/*
 * Document Management (requirement WP2's document repository, WP6 and the Document Management flowchart):
 * a government document is scanned, saved to the QNAP NAS, linked to its client / project / lease / vendor,
 * verified against the original, given its access (office, client, vendor), shared, and its original dispatched,
 * with every step on its audit trail.
 *
 * Letters the demo's projects have received besides their approval steps' letters (notices, queries, permissions),
 * and where the demo's documents stand on the way. A letter without a record here follows the default in
 * utils/documents.js: the last ten days' unshared letters wait for verification, older ones went all the way.
 */
export const NAS_ROOT = '\\\\QNAP-NAS\\Documents\\Clients'

export const DOC_KINDS = ['Approval', 'Acknowledgement', 'Notice', 'Query', 'Permission / NOC', 'Lease document', 'Circular', 'Letter']

export const DISPATCH_MODES = ['Speed Post', 'Courier', 'By hand', 'Registered Post']

export const RESCAN_REASONS = ['A page is cut off or missing', 'Not readable — too light or blurred', 'Wrong document scanned', 'Pages out of order']

/* Letters on file per project, besides the approval steps' own. sharedOn: already passed on to the client. */
export const SEEDED_LETTERS = {
  'PR-26-038': [
    { id: 'GL-S01', title: 'Site inspection notice', ref: 'CGWA/RAJ/2026/6175/N-1', date: '2026-09-23', kind: 'Notice', pages: 2 },
    { id: 'GL-S08', title: 'Acknowledgement of the NOC application for ground water abstraction', ref: 'CGWA/RAJ/2026/6175/A-1', date: '2026-09-05', kind: 'Acknowledgement', pages: 1, sharedOn: '2026-09-05' },
  ],
  'PR-26-041': [
    { id: 'GL-S02', title: 'Query on the drilling programme', ref: 'DMG/GUJ/2026/7294/Q-1', date: '2026-09-22', kind: 'Query', pages: 3 },
    { id: 'GL-S10', title: 'Permission to drill exploratory boreholes', ref: 'DMG/GUJ/2026/7294/P-1', date: '2026-09-12', kind: 'Permission / NOC', pages: 2, sharedOn: '2026-09-12' },
  ],
  'PR-26-020': [
    { id: 'GL-S03', title: 'Demarcation report with pillar coordinates', ref: 'DMG/RAJ/2026/8460/D-1', date: '2026-09-19', kind: 'Letter', pages: 4 },
    { id: 'GL-S11', title: 'Permission for the DGPS pillar survey', ref: 'DMG/RAJ/2026/8460/P-1', date: '2026-07-02', kind: 'Permission / NOC', pages: 1, sharedOn: '2026-07-03' },
  ],
  'PR-26-009': [{ id: 'GL-S04', title: 'Deficiency letter on the survey maps', ref: 'DMG/RAJ/2026/4357/Q-1', date: '2026-09-21', kind: 'Query', pages: 2 }],
  'PR-26-017': [{ id: 'GL-S05', title: 'Certified copy of the lease deed', ref: 'IBM/RAJ/2026/7341/L-1', date: '2026-09-18', kind: 'Lease document', pages: 6 }],
  'PR-26-015': [
    { id: 'GL-S06', title: 'Inspection notice under Reg. 106', ref: 'DGMS/MAD/2026/6595/N-1', date: '2026-09-17', kind: 'Notice', pages: 1 },
    { id: 'GL-S09', title: 'Circular on slope monitoring in opencast mines', ref: 'DGMS/CIR/2026/14', date: '2026-08-28', kind: 'Circular', pages: 2 },
  ],
}

const ADMIN = 'Kritika Gupta'
const at = (day, time) => new Date(`${day}T${time}:00`).toISOString()
const verified = (by, day, time = '15:10') => ({ status: 'Verified', by, at: at(day, time) })
const access = (by, day, { client = true, vendor = false } = {}, time = '16:00') => ({ client, vendor, by, at: at(day, time) })

/*
 * Where each demo document stands. filed: who filed the scan and when; verify, access, dispatch as the steps left them.
 * The rest of a record (links, the timeline) is filled in by utils/documents.js.
 */
export const SEEDED_DOC_RECORDS = {
  // To verify
  'GL-S01': { filedBy: 'A. Singh', filedAt: at('2026-09-23', '11:20') },
  'GL-S02': { filedBy: 'N. Rathore', filedAt: at('2026-09-22', '12:05') },
  // Sent back for a rescan
  'GL-S03': {
    filedBy: 'A. Singh',
    filedAt: at('2026-09-19', '10:40'),
    links: { vendorId: 'VN-06' },
    verify: { status: 'Rescan', by: ADMIN, at: at('2026-09-20', '09:50'), reason: 'A page is cut off or missing', note: 'Page 3 is cut off at the bottom; the last rows of the pillar table are missing.' },
  },
  // To authorize
  'GL-S04': { filedBy: 'N. Rathore', filedAt: at('2026-09-21', '16:30'), verify: verified(ADMIN, '2026-09-22', '10:15') },
  'GL-S05': { filedBy: 'N. Rathore', filedAt: at('2026-09-18', '11:00'), links: { leaseNo: 'ML 17/2004' }, verify: verified('A. Singh', '2026-09-19', '12:40') },
  // To share
  'GL-S06': { filedBy: 'N. Rathore', filedAt: at('2026-09-17', '15:45'), verify: verified('A. Singh', '2026-09-18', '10:05'), access: access('A. Singh', '2026-09-18', {}, '10:20'), dispatch: { status: 'Not needed' } },
  // Originals to dispatch
  'PR-26-017-filed': { filedBy: 'N. Rathore', filedAt: at('2026-09-14', '11:30'), verify: verified(ADMIN, '2026-09-14', '14:00'), access: access(ADMIN, '2026-09-14', {}, '14:05'), dispatch: { status: 'To dispatch' } },
  'GL-S10': {
    filedBy: 'N. Rathore',
    filedAt: at('2026-09-12', '10:10'),
    links: { vendorId: 'VN-01' },
    verify: verified(ADMIN, '2026-09-12', '11:30'),
    access: access(ADMIN, '2026-09-12', { client: true, vendor: true }, '11:40'),
    dispatch: { status: 'To dispatch' },
  },
  // Originals on their way, and received
  'PR-26-009-filed': { filedBy: 'N. Rathore', filedAt: at('2026-09-08', '12:00'), verify: verified(ADMIN, '2026-09-08', '15:20'), access: access(ADMIN, '2026-09-08', {}, '15:25'), dispatch: { status: 'Dispatched', mode: 'Speed Post', docket: 'EE447122905IN', on: '2026-09-10', by: 'A. Singh' } },
  'GL-S08': {
    filedBy: 'A. Singh',
    filedAt: at('2026-09-05', '11:15'),
    verify: verified(ADMIN, '2026-09-05', '12:30'),
    access: access(ADMIN, '2026-09-05', {}, '12:35'),
    dispatch: { status: 'Received', mode: 'Courier', docket: 'DTDC D40018873', on: '2026-09-06', by: 'A. Singh', receivedOn: '2026-09-09' },
  },
  'PR-26-001-granted': {
    filedBy: 'N. Rathore',
    filedAt: at('2026-08-19', '11:00'),
    verify: verified(ADMIN, '2026-08-19', '13:30'),
    access: access(ADMIN, '2026-08-19', {}, '13:40'),
    dispatch: { status: 'Received', mode: 'By hand', docket: '', on: '2026-08-20', by: 'N. Rathore', receivedOn: '2026-08-20' },
  },
  // Done: shared with the client and the vendor on the work; an office-only circular
  'GL-S11': { filedBy: 'A. Singh', filedAt: at('2026-07-02', '16:10'), links: { vendorId: 'VN-06' }, verify: verified(ADMIN, '2026-07-03', '10:00'), access: access(ADMIN, '2026-07-03', { client: true, vendor: true }, '10:10'), dispatch: { status: 'Not needed' } },
  'GL-S09': { filedBy: 'N. Rathore', filedAt: at('2026-08-28', '12:20'), verify: verified('A. Singh', '2026-08-28', '16:00'), access: access('A. Singh', '2026-08-28', { client: false }, '16:05'), dispatch: { status: 'Not needed' } },
}
