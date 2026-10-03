export const NAS_ROOT = '\\\\QNAP-NAS\\Documents\\Clients';
export const SCAN_FOLDER = '\\\\QNAP-NAS\\Scans\\Govt-Letters';

export const DOC_KINDS = [
  'Approval',
  'Acknowledgement',
  'Notice',
  'Query',
  'Permission / NOC',
  'Lease document',
  'Circular',
  'Letter',
] as const;

export const DOC_STAGES = ['To verify', 'To authorize', 'To share', 'To dispatch', 'Done'] as const;

export const DISPATCH_MODES = ['Speed Post', 'Courier', 'By hand', 'Registered Post'] as const;

export const RESCAN_REASONS = [
  'A page is cut off or missing',
  'Not readable — too light or blurred',
  'Wrong document scanned',
  'Pages out of order',
] as const;

export const CONFIDENTIALITY_LEVELS = ['Public', 'Internal', 'Confidential', 'Strictly Secret'] as const;

export const STAGE_TONE: Record<string, string> = {
  'To verify': 'tone-attention',
  'To authorize': 'tone-info',
  'To share': 'tone-info',
  'To dispatch': 'tone-attention',
  Done: 'tone-good',
};

export const DISPATCH_TONE: Record<string, string> = {
  'To dispatch': 'tone-attention',
  Dispatched: 'tone-info',
  Received: 'tone-good',
  'Not needed': 'tone-neutral',
};

const at = (day: string, time: string) => new Date(`${day}T${time}:00`).toISOString();
const minutesAfter = (iso: string, minutes: number) =>
  new Date(new Date(iso).getTime() + minutes * 60_000).toISOString();

export function docKind(letter: { title: string; kind?: string }): string {
  if (letter.kind) return letter.kind;
  const t = letter.title.toLowerCase();
  if (t.includes('acknowledg')) return 'Acknowledgement';
  if (t.includes('notice')) return 'Notice';
  if (/query|deficien/.test(t)) return 'Query';
  if (t.includes('lease')) return 'Lease document';
  if (/permission|noc|consent/.test(t)) return 'Permission / NOC';
  if (/approv|accept|grant|sanction/.test(t)) return 'Approval';
  if (t.includes('circular')) return 'Circular';
  return 'Letter';
}

export const originalNeeded = (kind: string) =>
  ['Approval', 'Permission / NOC', 'Lease document'].includes(kind);

const safe = (text: string) => text.replace(/[^A-Za-z0-9]+/g, '-').replace(/^-|-$/g, '');

export const nasPath = (letter: { date: string; ref: string }, project: { id: string; lead?: { company?: string }; clientName?: string }) => {
  const company = project.lead?.company || project.clientName || 'Bansal-Clients';
  return `${NAS_ROOT}\\${safe(company)}\\${project.id}\\Govt-Letters\\${letter.date}_${safe(letter.ref)}.pdf`;
};

export const vendorName = (vendorId: string, vendors: any[] = []) =>
  vendors.find((v) => v.id === vendorId)?.name ?? vendorId;

export function accessLabel(
  access?: { client?: boolean; vendor?: boolean } | null,
  links: { vendorId?: string } = {},
  vendors: any[] = []
): string {
  if (!access) return 'Not set';
  return [
    'Office',
    access.client && 'Client',
    access.vendor && links.vendorId && vendorName(links.vendorId, vendors),
  ]
    .filter(Boolean)
    .join(' · ');
}

export function eventsOf(
  record: any,
  letter: any,
  project: any,
  vendors: any[] = []
): Array<{ at: string; by: string; text: string }> {
  const links = record.links ?? {};
  const company = project.lead?.company || project.clientName || 'Client';
  const linked = [
    company,
    links.leaseNo && `lease ${links.leaseNo}`,
    links.vendorId && vendorName(links.vendorId, vendors),
  ]
    .filter(Boolean)
    .join(', ');

  const events: Array<{ at: string; by: string; text: string }> = [
    {
      at: minutesAfter(record.filedAt || new Date().toISOString(), -25),
      by: 'Front office scanner',
      text: `Scanned${letter.pages ? `, ${letter.pages} page${letter.pages === 1 ? '' : 's'}` : ''} — saved to the NAS`,
    },
    {
      at: record.filedAt || new Date().toISOString(),
      by: record.filedBy || 'A. Singh',
      text: `Filed to ${project.id || project.projectCode} · linked to ${linked}`,
    },
  ];

  const { verify, access, dispatch } = record;
  if (verify) {
    events.push({
      at: verify.at,
      by: verify.by,
      text:
        verify.status === 'Verified'
          ? 'Verified against the original'
          : `Sent back for a rescan: ${verify.reason}${verify.note ? ` — ${verify.note}` : ''}`,
    });
  }

  if (access) {
    events.push({
      at: access.at,
      by: access.by,
      text: `Access set: ${accessLabel(access, links, vendors)}`,
    });
  }

  if (access?.client && letter.sharedOn) {
    const sharedAt = at(letter.sharedOn, '16:30');
    events.push({
      at: sharedAt > access.at ? sharedAt : minutesAfter(access.at, 5),
      by: access.by,
      text: 'Shared with the client — portal and WhatsApp',
    });
  }

  if (dispatch?.on) {
    events.push({
      at: at(dispatch.on, '12:00'),
      by: dispatch.by || 'A. Singh',
      text: `Original sent by ${dispatch.mode}${dispatch.docket ? ` · ${dispatch.docket}` : ''}`,
    });
  }

  if (dispatch?.receivedOn) {
    events.push({
      at: at(dispatch.receivedOn, '17:00'),
      by: dispatch.receivedBy || project.lead?.contactPerson || 'Client Rep',
      text: 'Original received by the client',
    });
  }

  return events.sort((a, b) => a.at.localeCompare(b.at));
}

export function docStage(record: any, letter: any): 'To verify' | 'To authorize' | 'To share' | 'To dispatch' | 'Done' {
  if (record.verify?.status !== 'Verified') return 'To verify';
  if (!record.access) return 'To authorize';
  if (record.access.client && !letter.sharedOn) return 'To share';
  if (record.dispatch?.status === 'To dispatch') return 'To dispatch';
  return 'Done';
}

/**
 * 4-EYES PRINCIPLE:
 * The person who filed or uploaded the scan CANNOT verify it.
 * A second pair of eyes is mandatory.
 */
export const verifyBlock = (doc: any, userName?: string): string | null => {
  if (!userName) return null;
  const filedBy = doc.record?.filedBy || doc.uploadedBy || doc.uploaderName;
  if (filedBy && filedBy.toLowerCase() === userName.toLowerCase()) {
    return 'Four-Eyes Principle: You filed this scan — someone else must inspect and verify it against the physical original.';
  }
  return null;
};

export const clientCanSee = (doc: any) =>
  doc.record?.verify?.status === 'Verified' && Boolean(doc.record?.access?.client);

export const vendorCanSee = (doc: any, vendorId: string) =>
  doc.record?.verify?.status === 'Verified' &&
  Boolean(doc.record?.access?.vendor) &&
  doc.record?.links?.vendorId === vendorId;

// Seeded Scans for Scan Inbox
export const SEEDED_SCANS = [
  {
    id: 'SCN-1',
    name: 'SCAN_20260925_1042.pdf',
    scannedAt: '2026-09-25T10:42:00.000Z',
    pages: 2,
    size: 684000,
    type: 'application/pdf',
    scanner: 'Front office scanner',
    seeded: true,
  },
  {
    id: 'SCN-2',
    name: 'SCAN_20260924_1605.pdf',
    scannedAt: '2026-09-24T16:05:00.000Z',
    pages: 1,
    size: 312000,
    type: 'application/pdf',
    scanner: 'Front office scanner',
    seeded: true,
  },
  {
    id: 'SCN-3',
    name: 'SCAN_20260923_1118.pdf',
    scannedAt: '2026-09-23T11:18:00.000Z',
    pages: 3,
    size: 1046000,
    type: 'application/pdf',
    scanner: 'Front office scanner',
    seeded: true,
  },
];

// Seeded Letters per Project from web CRM
export const SEEDED_LETTERS: Record<string, any[]> = {
  'prj-001': [
    {
      id: 'GL-S01',
      title: 'Site inspection notice',
      ref: 'CGWA/RAJ/2026/6175/N-1',
      date: '2026-09-23',
      kind: 'Notice',
      pages: 2,
      authority: 'Central Ground Water Authority',
    },
    {
      id: 'GL-S08',
      title: 'Acknowledgement of NOC application for groundwater abstraction',
      ref: 'CGWA/RAJ/2026/6175/A-1',
      date: '2026-09-05',
      kind: 'Acknowledgement',
      pages: 1,
      sharedOn: '2026-09-05',
      authority: 'Central Ground Water Authority',
    },
  ],
  'prj-002': [
    {
      id: 'GL-S02',
      title: 'Query on the drilling programme',
      ref: 'DMG/GUJ/2026/7294/Q-1',
      date: '2026-09-22',
      kind: 'Query',
      pages: 3,
      authority: 'Department of Mines & Geology, Gujarat',
    },
    {
      id: 'GL-S10',
      title: 'Permission to drill exploratory boreholes',
      ref: 'DMG/GUJ/2026/7294/P-1',
      date: '2026-09-12',
      kind: 'Permission / NOC',
      pages: 2,
      sharedOn: '2026-09-12',
      authority: 'Department of Mines & Geology, Gujarat',
    },
  ],
  'prj-003': [
    {
      id: 'GL-S03',
      title: 'Demarcation report with pillar coordinates',
      ref: 'DMG/RAJ/2026/8460/D-1',
      date: '2026-09-19',
      kind: 'Letter',
      pages: 4,
      authority: 'Department of Mines & Geology, Rajasthan',
    },
    {
      id: 'GL-S11',
      title: 'Permission for DGPS pillar boundary survey',
      ref: 'DMG/RAJ/2026/8460/P-1',
      date: '2026-07-02',
      kind: 'Permission / NOC',
      pages: 1,
      sharedOn: '2026-07-03',
      authority: 'Department of Mines & Geology, Rajasthan',
    },
    {
      id: 'GL-S04',
      title: 'Deficiency letter on survey cadastral maps',
      ref: 'DMG/RAJ/2026/4357/Q-1',
      date: '2026-09-21',
      kind: 'Query',
      pages: 2,
      authority: 'Department of Mines & Geology, Rajasthan',
    },
    {
      id: 'GL-S05',
      title: 'Certified copy of mining lease deed (ML 17/2004)',
      ref: 'IBM/RAJ/2026/7341/L-1',
      date: '2026-09-18',
      kind: 'Lease document',
      pages: 6,
      authority: 'Indian Bureau of Mines',
    },
    {
      id: 'GL-S06',
      title: 'Inspection notice under Regulation 106',
      ref: 'DGMS/MAD/2026/6595/N-1',
      date: '2026-09-17',
      kind: 'Notice',
      pages: 1,
      authority: 'Directorate General of Mines Safety',
    },
    {
      id: 'GL-S09',
      title: 'Circular on slope monitoring in opencast mines',
      ref: 'DGMS/CIR/2026/14',
      date: '2026-08-28',
      kind: 'Circular',
      pages: 2,
      authority: 'Directorate General of Mines Safety',
    },
  ],
};

const ADMIN = 'Kritika Gupta';

export const SEEDED_DOC_RECORDS: Record<string, any> = {
  // To verify
  'GL-S01': { filedBy: 'A. Singh', filedAt: at('2026-09-23', '11:20') },
  'GL-S02': { filedBy: 'N. Rathore', filedAt: at('2026-09-22', '12:05') },
  // Sent back for a rescan
  'GL-S03': {
    filedBy: 'A. Singh',
    filedAt: at('2026-09-19', '10:40'),
    links: { vendorId: 'VEND-001' },
    verify: {
      status: 'Rescan',
      by: ADMIN,
      at: at('2026-09-20', '09:50'),
      reason: 'A page is cut off or missing',
      note: 'Page 3 is cut off at the bottom; the last rows of the pillar table are missing.',
    },
  },
  // To authorize
  'GL-S04': {
    filedBy: 'N. Rathore',
    filedAt: at('2026-09-21', '16:30'),
    verify: { status: 'Verified', by: ADMIN, at: at('2026-09-22', '10:15') },
  },
  'GL-S05': {
    filedBy: 'N. Rathore',
    filedAt: at('2026-09-18', '11:00'),
    links: { leaseNo: 'ML 17/2004' },
    verify: { status: 'Verified', by: 'A. Singh', at: at('2026-09-19', '12:40') },
  },
  // To share
  'GL-S06': {
    filedBy: 'N. Rathore',
    filedAt: at('2026-09-17', '15:45'),
    verify: { status: 'Verified', by: 'A. Singh', at: at('2026-09-18', '10:05') },
    access: { client: true, vendor: false, by: 'A. Singh', at: at('2026-09-18', '10:20') },
    dispatch: { status: 'Not needed' },
  },
  'GL-S10': {
    filedBy: 'N. Rathore',
    filedAt: at('2026-09-12', '10:10'),
    links: { vendorId: 'VEND-001' },
    verify: { status: 'Verified', by: ADMIN, at: at('2026-09-12', '11:30') },
    access: { client: true, vendor: true, by: ADMIN, at: at('2026-09-12', '11:40') },
    dispatch: { status: 'To dispatch' },
  },
  // Originals dispatched & received
  'GL-S08': {
    filedBy: 'A. Singh',
    filedAt: at('2026-09-05', '11:15'),
    verify: { status: 'Verified', by: ADMIN, at: at('2026-09-05', '12:30') },
    access: { client: true, vendor: false, by: ADMIN, at: at('2026-09-05', '12:35') },
    dispatch: {
      status: 'Received',
      mode: 'Courier',
      docket: 'DTDC D40018873',
      on: '2026-09-06',
      by: 'A. Singh',
      receivedOn: '2026-09-09',
      receivedBy: 'Sandeep Mukherjee',
    },
  },
  'GL-S11': {
    filedBy: 'A. Singh',
    filedAt: at('2026-07-02', '16:10'),
    links: { vendorId: 'VEND-001' },
    verify: { status: 'Verified', by: ADMIN, at: at('2026-07-03', '10:00') },
    access: { client: true, vendor: true, by: ADMIN, at: at('2026-07-03', '10:10') },
    dispatch: { status: 'Not needed' },
  },
  'GL-S09': {
    filedBy: 'N. Rathore',
    filedAt: at('2026-08-28', '12:20'),
    verify: { status: 'Verified', by: 'A. Singh', at: at('2026-08-28', '16:00') },
    access: { client: false, vendor: false, by: 'A. Singh', at: at('2026-08-28', '16:05') },
    dispatch: { status: 'Not needed' },
  },
};

export function defaultRecord(letter: any, project: any): any {
  const filedBy = project.team?.coordinator || 'A. Singh';
  const filedAt = at(letter.date, '11:00');
  if (!letter.sharedOn && letter.date >= '2026-09-15') return { filedBy, filedAt };
  return {
    filedBy,
    filedAt,
    verify: { status: 'Verified', by: 'Kritika Gupta', at: at(letter.date, '14:30') },
    access: { client: true, vendor: false, by: 'Kritika Gupta', at: at(letter.date, '14:40') },
    dispatch: { status: 'Not needed' },
  };
}

export function govtDocuments(projects: any[], saved: Record<string, any> = {}, vendors: any[] = []): any[] {
  return projects
    .flatMap((project) => {
      const letters = [
        ...(project.letters || []),
        ...(SEEDED_LETTERS[project.id] || []).filter(
          (sl) => !(project.letters || []).some((l: any) => l.id === sl.id)
        ),
      ];
      return letters.map((letter: any) => {
        const base = saved[letter.id] ?? SEEDED_DOC_RECORDS[letter.id] ?? defaultRecord(letter, project);
        const record = { links: {}, ...base, events: base.events ?? eventsOf({ links: {}, ...base }, letter, project, vendors) };
        const kind = docKind(letter);
        const lead = project.lead || { id: project.leadId || 'lead-1', company: project.clientName || 'Client', contactPerson: 'Client Rep', location: 'Office' };
        return {
          id: letter.id,
          letter,
          project: { ...project, lead },
          lead,
          record,
          kind,
          stage: docStage(record, letter),
          rescan: record.verify?.status === 'Rescan',
          nas: nasPath(letter, project),
          vendor: record.links.vendorId ? (vendors.find((v) => v.id === record.links.vendorId) ?? { id: record.links.vendorId, name: record.links.vendorId }) : null,
        };
      });
    })
    .sort((a, b) => b.letter.date.localeCompare(a.letter.date) || (b.record.filedAt || '').localeCompare(a.record.filedAt || ''));
}

