import { TODAY } from './mockData'

/*
 * Works put out to vendors (tenders), after eProc Rajasthan's tender page: the Admin publishes a work, every
 * approved vendor is told, vendors bid from the vendor portal, bids stay sealed until bidding closes, then the
 * Admin shortlists, rejects (with a reason) and allots one bid, which becomes the work order in Subcontracts.
 */

export const TENDER_CATEGORIES = ['Services', 'Works', 'Goods']
export const CONTRACT_FORMS = ['Lump-sum', 'Item rate', 'Percentage']

export const BID_REJECT_REASONS = [
  'Rate too high against the other bids',
  'Pre-qualification not met',
  'Period of work too long',
  'Documents incomplete',
  'Other',
]

/* Papers a bid carries; the financial quote is required. */
export const BID_DOCS = [
  { kind: 'Financial quote / BOQ', required: true },
  { kind: 'Technical documents', required: false },
  { kind: 'Experience certificates', required: false },
]

/* Date-time `days` from today (negative: in the past) at `time`, as ISO. */
const at = (days, time) => {
  const d = new Date(TODAY.getTime() + days * 86_400_000)
  const [h, m] = time.split(':').map(Number)
  d.setHours(h, m, 0, 0)
  return d.toISOString()
}
const doc = (id, kind, name, size) => ({ id, kind, name, size, type: 'application/pdf', seeded: true })
const AUTHORITY = { name: 'Kritika Gupta', designation: 'Admin, Bansal Geo Solutions Pvt. Ltd.', address: 'Jaipur, Rajasthan' }

/*
 * The demo's tenders, one of each kind: open with sealed bids, closed with bids to decide, and just published.
 * `service` picks the project the work is for (the first running project of that service line).
 */
export const SEEDED_TENDERS = [
  {
    id: 'TN-2026-021',
    refNo: 'BG/VW/2026-27/021',
    title: 'Exploratory core drilling, 5 boreholes × 80 m (NQ)',
    description: 'Core drilling at the marked locations with core recovery above 90%, core boxes and a driller’s log per hole. Drill-site restoration after each hole.',
    prequal: 'At least 3 similar drilling works in the last 5 years; own rig in working order.',
    category: 'Core drilling',
    service: 'Mineral Exploration & Resources',
    location: 'Rajsamand, Rajasthan',
    pincode: '313324',
    tenderCategory: 'Works',
    contractForm: 'Item rate',
    estimate: 640000,
    showEstimate: true,
    emd: 0,
    periodDays: 30,
    bidValidityDays: 60,
    preBid: { at: at(1, '11:00'), place: 'Bansal Geo office, Jaipur' },
    publishedAt: at(-3, '11:00'),
    closesAt: at(4, '17:00'),
    opensAt: at(5, '11:00'),
    documents: [doc('TN21-1', 'Notice inviting tender', 'NIT_TN-2026-021.pdf', 312000), doc('TN21-2', 'Scope & drawings', 'Borehole_layout_Rajsamand.pdf', 1840000)],
    authority: AUTHORITY,
    status: 'Open',
    history: [{ at: at(-3, '11:00'), action: 'Published · all approved vendors told', by: 'Kritika Gupta' }],
  },
  {
    id: 'TN-2026-019',
    refNo: 'BG/VW/2026-27/019',
    title: 'Drone survey and DEM of three mining leases (about 420 ha)',
    description: 'RTK drone flights with ground control points, orthomosaic at 5 cm GSD, DEM and contour plan at 1 m interval, lease boundary overlay.',
    prequal: 'DGCA remote pilot certificate; RTK-enabled drone; two similar surveys.',
    category: 'Drone survey',
    service: 'Mine Planning & Prefeasibility Study',
    location: 'Nagaur, Rajasthan',
    pincode: '341001',
    tenderCategory: 'Services',
    contractForm: 'Lump-sum',
    estimate: 225000,
    showEstimate: false,
    emd: 5000,
    periodDays: 21,
    bidValidityDays: 45,
    preBid: null,
    publishedAt: at(-12, '10:30'),
    closesAt: at(-2, '17:00'),
    opensAt: at(-1, '11:00'),
    documents: [doc('TN19-1', 'Notice inviting tender', 'NIT_TN-2026-019.pdf', 288000), doc('TN19-2', 'Scope & drawings', 'Lease_boundaries_Nagaur.pdf', 2240000)],
    authority: AUTHORITY,
    status: 'Open',
    history: [
      { at: at(-12, '10:30'), action: 'Published · all approved vendors told', by: 'Kritika Gupta' },
      { at: at(-1, '11:00'), action: 'Bids opened', by: 'Kritika Gupta' },
    ],
  },
  {
    id: 'TN-2026-022',
    refNo: 'BG/VW/2026-27/022',
    title: 'Pumping test on 4 borewells with water sampling',
    description: '24-hour constant-rate test and recovery on each well, water levels at set intervals, two water samples per well to a NABL lab.',
    prequal: 'Pumping test equipment with a calibrated flow meter; one similar work.',
    category: 'Borewell & pumping test',
    service: 'Hydrogeology & Groundwater',
    location: 'Bhilwara, Rajasthan',
    pincode: '311001',
    tenderCategory: 'Services',
    contractForm: 'Lump-sum',
    estimate: 150000,
    showEstimate: true,
    emd: 0,
    periodDays: 15,
    bidValidityDays: 45,
    preBid: null,
    publishedAt: at(0, '10:00'),
    closesAt: at(9, '17:00'),
    opensAt: at(10, '11:00'),
    documents: [doc('TN22-1', 'Notice inviting tender', 'NIT_TN-2026-022.pdf', 276000)],
    authority: AUTHORITY,
    status: 'Open',
    history: [{ at: at(0, '10:00'), action: 'Published · all approved vendors told', by: 'Kritika Gupta' }],
  },
]

const bidDocs = (prefix, extra = []) => [doc(`${prefix}-1`, 'Financial quote / BOQ', `${prefix}_quote.pdf`, 184000), ...extra]

export const SEEDED_BIDS = [
  {
    id: 'BD-021-01',
    tenderId: 'TN-2026-021',
    vendorId: 'VN-01',
    submittedAt: at(-2, '15:40'),
    amount: 598000,
    gstPct: 18,
    days: 28,
    startFrom: at(7, '09:00').slice(0, 10),
    validityDays: 60,
    note: 'Two truck-mounted rigs, NQ wireline; crew of 8. Core boxes supplied by us.',
    emdRef: '',
    documents: bidDocs('BD-021-01', [doc('BD-021-01-2', 'Experience certificates', 'Drilling_completion_certificates.pdf', 920000)]),
    status: 'Submitted',
    history: [{ at: at(-2, '15:40'), action: 'Bid submitted', by: 'H. Rawat' }],
  },
  {
    id: 'BD-021-02',
    tenderId: 'TN-2026-021',
    vendorId: 'VN-04',
    submittedAt: at(-1, '12:10'),
    amount: 615000,
    gstPct: 18,
    days: 32,
    startFrom: at(8, '09:00').slice(0, 10),
    validityDays: 60,
    note: 'One rig, NQ; can add a second rig after 10 days.',
    emdRef: '',
    documents: bidDocs('BD-021-02'),
    status: 'Submitted',
    history: [{ at: at(-1, '12:10'), action: 'Bid submitted', by: 'M. Chauhan' }],
  },
  {
    id: 'BD-019-01',
    tenderId: 'TN-2026-019',
    vendorId: 'VN-03',
    submittedAt: at(-6, '11:20'),
    amount: 210000,
    gstPct: 18,
    days: 15,
    startFrom: at(3, '09:00').slice(0, 10),
    validityDays: 45,
    note: 'DJI M300 RTK with P1 camera, two pilots; GCPs by DGPS.',
    emdRef: 'DD 448120 · SBI Jodhpur',
    documents: bidDocs('BD-019-01', [doc('BD-019-01-2', 'Technical documents', 'DGCA_RPC_and_equipment.pdf', 610000)]),
    status: 'Submitted',
    history: [{ at: at(-6, '11:20'), action: 'Bid submitted', by: 'R. Solanki' }],
  },
  {
    id: 'BD-019-02',
    tenderId: 'TN-2026-019',
    vendorId: 'VN-06',
    submittedAt: at(-4, '16:05'),
    amount: 186000,
    gstPct: 18,
    days: 20,
    startFrom: at(4, '09:00').slice(0, 10),
    validityDays: 45,
    note: 'Drone with RTK base; DEM and contours in AutoCAD and GeoTIFF.',
    emdRef: 'DD 201934 · PNB Bikaner',
    documents: bidDocs('BD-019-02', [doc('BD-019-02-2', 'Technical documents', 'Remote_pilot_certificate.pdf', 402000)]),
    status: 'Shortlisted',
    history: [
      { at: at(-4, '16:05'), action: 'Bid submitted', by: 'K. Bishnoi' },
      { at: at(-1, '12:30'), action: 'Shortlisted', by: 'Kritika Gupta' },
    ],
  },
  {
    id: 'BD-019-03',
    tenderId: 'TN-2026-019',
    vendorId: 'VN-01',
    submittedAt: at(-3, '10:45'),
    amount: 172000,
    gstPct: 18,
    days: 25,
    startFrom: at(5, '09:00').slice(0, 10),
    validityDays: 45,
    note: 'Survey through a hired drone operator.',
    emdRef: 'DD 118502 · SBI Udaipur',
    documents: bidDocs('BD-019-03'),
    status: 'Rejected',
    reason: 'Pre-qualification not met',
    remark: 'No DGCA remote pilot certificate with the bid.',
    history: [
      { at: at(-3, '10:45'), action: 'Bid submitted', by: 'H. Rawat' },
      { at: at(-1, '12:35'), action: 'Rejected', by: 'Kritika Gupta', note: 'Pre-qualification not met — No DGCA remote pilot certificate with the bid.' },
    ],
  },
]

// A bid withdrawn before closing (eProc allows it; the firm can't bid again on that tender).
SEEDED_BIDS.push({
  id: 'BD-021-03',
  tenderId: 'TN-2026-021',
  vendorId: 'VN-05',
  submittedAt: at(-2, '11:15'),
  amount: 655000,
  gstPct: 18,
  days: 35,
  startFrom: at(9, '09:00').slice(0, 10),
  validityDays: 60,
  note: 'Drilling through a partner rig.',
  emdRef: '',
  documents: bidDocs('BD-021-03'),
  status: 'Withdrawn',
  withdrawnAt: at(-1, '17:20'),
  history: [
    { at: at(-2, '11:15'), action: 'Bid submitted', by: 'P. Mathur' },
    { at: at(-1, '17:20'), action: 'Withdrawn by the firm', by: 'P. Mathur' },
  ],
})

/*
 * Vendors' questions on a tender (eProc's "Clarification"). The answer is published on the tender for every
 * bidder, without the asking firm's name.
 */
export const SEEDED_CLARIFICATIONS = [
  {
    id: 'CL-021-01',
    tenderId: 'TN-2026-021',
    vendorId: 'VN-04',
    question: 'Is core logging and core photography in our scope, or will your geologist log the core?',
    askedAt: at(-2, '10:05'),
    answer: 'Your driller’s log per hole is enough. Our geologist logs and photographs the core at site.',
    answeredAt: at(-1, '16:40'),
    answeredBy: 'Kritika Gupta',
  },
  {
    id: 'CL-022-01',
    tenderId: 'TN-2026-022',
    vendorId: 'VN-01',
    question: 'Is power available at the well sites, or should we bring a generator for the pumps?',
    askedAt: at(0, '12:00'),
    answer: null,
    answeredAt: null,
    answeredBy: null,
  },
]

/*
 * Earlier tenders, already decided, so every demo vendor has a history: one allotted to each of four firms, with the
 * other bids not selected, rejected (with the reason) or withdrawn. Their work orders are in SEEDED_TENDER_ORDERS.
 */
const pastTender = (n, title, category, service, location, pincode, estimate, periodDays, published, allottedTo, bidId) => ({
  id: `TN-2026-0${n}`,
  refNo: `BG/VW/2026-27/0${n}`,
  title,
  description: `${title}, as per the scope and drawings attached to the notice.`,
  prequal: '',
  category,
  service,
  location,
  pincode,
  tenderCategory: 'Services',
  contractForm: 'Lump-sum',
  estimate,
  showEstimate: true,
  emd: 0,
  periodDays,
  bidValidityDays: 45,
  preBid: null,
  publishedAt: at(published, '10:00'),
  closesAt: at(published + 8, '17:00'),
  opensAt: at(published + 9, '11:00'),
  documents: [doc(`TN${n}-1`, 'Notice inviting tender', `NIT_TN-2026-0${n}.pdf`, 280000)],
  authority: AUTHORITY,
  status: 'Allotted',
  allotted: { bidId, vendorId: allottedTo, at: at(published + 11, '12:00') },
  history: [
    { at: at(published, '10:00'), action: 'Published · all approved vendors told', by: 'Kritika Gupta' },
    { at: at(published + 9, '11:00'), action: 'Bids opened', by: 'Kritika Gupta' },
    { at: at(published + 11, '12:00'), action: 'Allotted · work order issued', by: 'Kritika Gupta' },
  ],
})

SEEDED_TENDERS.push(
  pastTender(14, 'Grade analysis of 36 limestone core samples', 'Lab testing (NABL)', 'Mineral Economics & Valuation', 'Chittorgarh, Rajasthan', '312001', 90000, 15, -32, 'VN-02', 'BD-014-01'),
  pastTender(16, 'Baseline air, water and noise monitoring, one season', 'Air, water & noise monitoring', 'Environment, Community & Permitting', 'Rajsamand, Rajasthan', '313324', 215000, 30, -26, 'VN-05', 'BD-016-01'),
  pastTender(17, 'DGPS survey of lease pillars on two leases', 'DGPS & total station survey', 'Remote Sensing, GIS & Aerial Mapping', 'Bikaner, Rajasthan', '334001', 85000, 12, -30, 'VN-06', 'BD-017-01'),
  pastTender(18, 'Pumping test on 3 borewells', 'Borewell & pumping test', 'Hydrogeology & Groundwater', 'Ajmer, Rajasthan', '305001', 125000, 15, -40, 'VN-04', 'BD-018-01'),
)

/* A bid on an earlier tender. sent / decided: days from today. */
const pastBid = (id, tenderId, vendorId, by, amount, days, sent, status, decided, extra = {}) => ({
  id,
  tenderId,
  vendorId,
  submittedAt: at(sent, '15:00'),
  amount,
  gstPct: 18,
  days,
  startFrom: at(sent + 12, '09:00').slice(0, 10),
  validityDays: 45,
  note: 'As per the scope; team and equipment of our own.',
  emdRef: '',
  documents: bidDocs(id),
  status,
  ...extra,
  history: [
    { at: at(sent, '15:00'), action: 'Bid submitted', by },
    ...(status === 'Withdrawn'
      ? [{ at: extra.withdrawnAt, action: 'Withdrawn by the firm', by }]
      : status === 'Submitted'
        ? []
        : [{ at: at(decided, '12:00'), action: status === 'Allotted' ? 'Allotted · work order issued' : status, by: 'Kritika Gupta', note: extra.reason ? [extra.reason, extra.remark].filter(Boolean).join(' — ') : null }]),
  ],
})

SEEDED_BIDS.push(
  pastBid('BD-014-01', 'TN-2026-014', 'VN-02', 'Dr. S. Kothari', 84000, 12, -27, 'Allotted', -21),
  pastBid('BD-014-02', 'TN-2026-014', 'VN-05', 'P. Mathur', 91000, 18, -26, 'Not selected', -21),
  pastBid('BD-016-01', 'TN-2026-016', 'VN-05', 'P. Mathur', 196000, 30, -21, 'Allotted', -15),
  pastBid('BD-016-02', 'TN-2026-016', 'VN-02', 'Dr. S. Kothari', 205000, 28, -20, 'Not selected', -15),
  pastBid('BD-016-03', 'TN-2026-016', 'VN-04', 'M. Chauhan', 172000, 35, -20, 'Rejected', -16, { reason: 'Pre-qualification not met', remark: 'No NABL accreditation for ambient air monitoring.' }),
  pastBid('BD-016-04', 'TN-2026-016', 'VN-03', 'R. Solanki', 188000, 30, -22, 'Withdrawn', null, { withdrawnAt: at(-19, '11:30') }),
  pastBid('BD-017-01', 'TN-2026-017', 'VN-06', 'K. Bishnoi', 78000, 10, -25, 'Allotted', -19),
  pastBid('BD-017-02', 'TN-2026-017', 'VN-03', 'R. Solanki', 83000, 12, -24, 'Not selected', -19),
  pastBid('BD-017-03', 'TN-2026-017', 'VN-01', 'H. Rawat', 92000, 14, -26, 'Withdrawn', null, { withdrawnAt: at(-23, '16:10') }),
  pastBid('BD-018-01', 'TN-2026-018', 'VN-04', 'M. Chauhan', 112000, 14, -35, 'Allotted', -29),
  pastBid('BD-018-02', 'TN-2026-018', 'VN-01', 'H. Rawat', 138000, 15, -34, 'Rejected', -30, { reason: 'Rate too high against the other bids', remark: 'L1 was 19% lower.' }),
  pastBid('BD-018-03', 'TN-2026-018', 'VN-02', 'Dr. S. Kothari', 121000, 16, -36, 'Withdrawn', null, { withdrawnAt: at(-33, '10:20') }),
  pastBid('BD-018-04', 'TN-2026-018', 'VN-06', 'K. Bishnoi', 130000, 15, -35, 'Withdrawn', null, { withdrawnAt: at(-33, '18:05') }),
  // Sealed bids on the pumping test that is open now.
  pastBid('BD-022-01', 'TN-2026-022', 'VN-02', 'Dr. S. Kothari', 146000, 14, 0, 'Submitted', null),
  pastBid('BD-022-02', 'TN-2026-022', 'VN-05', 'P. Mathur', 158000, 15, 0, 'Submitted', null),
)

SEEDED_CLARIFICATIONS.push(
  { id: 'CL-014-01', tenderId: 'TN-2026-014', vendorId: 'VN-02', question: 'Can LOI be reported at 1000 °C instead of 950 °C?', askedAt: at(-29, '12:15'), answer: 'Yes, 1000 °C as per IS 1760; please mention it in the report.', answeredAt: at(-28, '10:30'), answeredBy: 'Kritika Gupta' },
  { id: 'CL-017-01', tenderId: 'TN-2026-017', vendorId: 'VN-06', question: 'Should the pillar coordinates be given in UTM or in the lease grid?', askedAt: at(-28, '16:00'), answer: 'UTM zone 43N (WGS 84), with a pillar-wise sketch.', answeredAt: at(-27, '11:20'), answeredBy: 'Kritika Gupta' },
  { id: 'CL-019-01', tenderId: 'TN-2026-019', vendorId: 'VN-03', question: 'Is a ground control point spacing of about 300 m acceptable?', askedAt: at(-9, '14:30'), answer: 'Yes, with at least five GCPs per lease and two check points.', answeredAt: at(-8, '10:05'), answeredBy: 'Kritika Gupta' },
  { id: 'CL-022-02', tenderId: 'TN-2026-022', vendorId: 'VN-05', question: 'Should the water samples also be tested for heavy metals?', askedAt: at(0, '13:20'), answer: null, answeredAt: null, answeredBy: null },
)

/* Tenders each demo vendor saved to come back to ("My Tenders"). */
export const SEEDED_SAVED_TENDERS = {
  'VN-01': ['TN-2026-022', 'TN-2026-021'],
  'VN-02': ['TN-2026-022', 'TN-2026-021'],
  'VN-03': ['TN-2026-021', 'TN-2026-019'],
  'VN-04': ['TN-2026-022'],
  'VN-05': ['TN-2026-021', 'TN-2026-022'],
  'VN-06': ['TN-2026-022', 'TN-2026-019'],
}

/*
 * The work orders of the earlier allotted tenders, at different stages (days from today for each step; null: not
 * yet). The provider places each under a running project of the tender's service line.
 */
export const SEEDED_TENDER_ORDERS = [
  { tenderId: 'TN-2026-014', bidId: 'BD-014-01', issued: -21, started: -19, due: -6, delivered: -9, billed: -7, checked: -5, paid: -3 },
  { tenderId: 'TN-2026-016', bidId: 'BD-016-01', issued: -15, started: -13, due: 12, delivered: null, billed: null, checked: null, paid: null },
  { tenderId: 'TN-2026-017', bidId: 'BD-017-01', issued: -19, started: -17, due: -4, delivered: -2, billed: null, checked: null, paid: null },
  { tenderId: 'TN-2026-018', bidId: 'BD-018-01', issued: -29, started: -27, due: -14, delivered: -16, billed: -14, checked: -12, paid: -9 },
]

// One more earlier tender (paid), a withdrawn bid, and a work just put out that nobody has bid on yet.
SEEDED_TENDERS.push(pastTender(11, 'Water quality monitoring of 6 wells, post-monsoon', 'Air, water & noise monitoring', 'Environment, Community & Permitting', 'Bhilwara, Rajasthan', '311001', 68000, 10, -58, 'VN-05', 'BD-011-01'), {
  id: 'TN-2026-024',
  refNo: 'BG/VW/2026-27/024',
  title: 'Rock strength tests on 24 core samples (UCS and point load)',
  description: 'Uniaxial compressive strength and point load index on 24 NX core samples, with a test report per sample and a summary sheet.',
  prequal: 'NABL accreditation for mechanical testing of rock.',
  category: 'Geotechnical testing',
  service: 'Geotechnical Services',
  location: 'Udaipur, Rajasthan',
  pincode: '313001',
  tenderCategory: 'Services',
  contractForm: 'Item rate',
  estimate: 110000,
  showEstimate: false,
  emd: 0,
  periodDays: 20,
  bidValidityDays: 45,
  preBid: null,
  publishedAt: at(-1, '16:00'),
  closesAt: at(6, '17:00'),
  opensAt: at(7, '11:00'),
  documents: [doc('TN24-1', 'Notice inviting tender', 'NIT_TN-2026-024.pdf', 262000), doc('TN24-2', 'Scope & drawings', 'Core_sample_list.pdf', 148000)],
  authority: AUTHORITY,
  status: 'Open',
  history: [{ at: at(-1, '16:00'), action: 'Published · all approved vendors told', by: 'Kritika Gupta' }],
})

SEEDED_BIDS.push(
  pastBid('BD-011-01', 'TN-2026-011', 'VN-05', 'P. Mathur', 62000, 10, -53, 'Allotted', -47),
  pastBid('BD-011-02', 'TN-2026-011', 'VN-02', 'Dr. S. Kothari', 66500, 12, -52, 'Not selected', -47),
  pastBid('BD-017-04', 'TN-2026-017', 'VN-04', 'M. Chauhan', 88000, 12, -27, 'Withdrawn', null, { withdrawnAt: at(-24, '12:40') }),
)

SEEDED_TENDER_ORDERS.push({ tenderId: 'TN-2026-011', bidId: 'BD-011-01', issued: -47, started: -45, due: -33, delivered: -34, billed: -32, checked: -30, paid: -26 })

/*
 * The project each earlier tender was for, by name (projects are generated from the demo's leads; if one isn't
 * running on the day, the tender goes to a running project of its service line instead).
 */
const FOR_PROJECT = { 'TN-2026-011': 'Dewatering System Design', 'TN-2026-014': 'Resource Estimation', 'TN-2026-016': 'Lease Renewal Support', 'TN-2026-017': 'DGPS Survey', 'TN-2026-018': 'Dewatering System Design' }
SEEDED_TENDERS.forEach((t) => {
  if (FOR_PROJECT[t.id]) t.forProject = FOR_PROJECT[t.id]
})

