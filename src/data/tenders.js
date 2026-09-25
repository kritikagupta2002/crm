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
