import { TODAY } from './mockData'

/*
 * Vendor self-registration (requirement WP8; fields after eProc Rajasthan's "Online Enrollment of Corporate/Bidder"):
 * a firm applies on the public page, the Admin approves, sends it back for changes, or rejects it with a reason.
 * An approved firm joins the vendor register and signs in to the vendor portal with its vendor ID and mobile.
 */

/* The kinds of outside work the project team hires. A vendor picks the ones it does; tenders go out by these. */
export const WORK_CATEGORIES = [
  'Core drilling',
  'Lab testing (NABL)',
  'Drone survey',
  'DGPS & total station survey',
  'Borewell & pumping test',
  'Air, water & noise monitoring',
  'Geotechnical testing',
  'Machinery & equipment hire',
  'Transport & logistics',
  'Other',
]

/*
 * The form follows eProc's "Company Details" section. Where eProc asks Bidder Type (Indian / Foreign), we ask the
 * kind of firm, which is what matters for our work; Legal Status and Company Category keep eProc's meaning.
 */
export const COMPANY_TYPES = ['Contractor', 'Laboratory', 'Survey Agency', 'Consultant', 'Supplier / Equipment Hire']
export const LEGAL_STATUS = ['Proprietorship', 'Partnership', 'LLP', 'Private Limited Company', 'Public Limited Company', 'Joint Venture', 'Others']
export const COMPANY_CATEGORIES = ['Micro Unit as per MSME', 'Small Unit as per MSME', 'Medium Unit as per MSME', 'Ancillary Unit', 'SSI', 'Others']
export const PREFERENCE_CATEGORIES = ['MSME', 'Startup']
export const TITLES = ['Mr', 'Ms', 'Mrs', 'Dr', 'Sri']
export const ACCOUNT_TYPES = ['Current', 'Savings']

/* Micro / Small / Medium from the company category, or null when the firm isn't an MSME unit. */
export const msmeOf = (firm) => firm.category?.match(/^(Micro|Small|Medium) Unit/)?.[1] ?? null

/* States with their GST state code (the first two digits of a GSTIN). */
export const STATE_CODES = {
  'Andhra Pradesh': '37',
  Bihar: '10',
  Chhattisgarh: '22',
  Delhi: '07',
  Goa: '30',
  Gujarat: '24',
  Haryana: '06',
  'Himachal Pradesh': '02',
  Jharkhand: '20',
  Karnataka: '29',
  Kerala: '32',
  'Madhya Pradesh': '23',
  Maharashtra: '27',
  Odisha: '21',
  Punjab: '03',
  Rajasthan: '08',
  'Tamil Nadu': '33',
  Telangana: '36',
  'Uttar Pradesh': '09',
  Uttarakhand: '05',
  'West Bengal': '19',
}
export const STATES = Object.keys(STATE_CODES)

/* Papers a firm uploads; `required` ones are checked before approval (GST certificate only if GST registered). */
export const VENDOR_DOCS = [
  { kind: 'PAN card', required: true },
  { kind: 'Cancelled cheque', required: true },
  { kind: 'GST certificate', required: 'gst' },
  { kind: 'Registration / Udyam / Startup certificate', required: false },
  { kind: 'Experience / accreditation', required: false },
]

export const REJECT_REASONS = [
  'Already registered (duplicate PAN, GSTIN or bank account)',
  'Work we don’t subcontract',
  'Documents not valid',
  'Not eligible (experience, accreditation or blacklisting)',
  'Other',
]

const at = (daysAgo, time) => {
  const d = new Date(TODAY.getTime() - daysAgo * 86_400_000)
  const [h, m] = time.split(':').map(Number)
  d.setHours(h, m, 0, 0)
  return d.toISOString()
}
const doc = (id, kind, name, size) => ({ id, kind, name, size, type: name.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg', seeded: true })

/* Applications waiting in the demo: two new, one sent back, one rejected. */
export const SEEDED_APPLICATIONS = [
  {
    id: 'VR-2026-012',
    submittedAt: at(0, '09:20'),
    status: 'New',
    firm: { name: 'Mewar Drilling & Boring', companyType: 'Contractor', regNo: 'UDYAM-RJ-27-0048812', partners: 'Mahendra Singh Chundawat', year: '2016', nature: 'Core drilling and borewell works', legalStatus: 'Proprietorship', category: 'Micro Unit as per MSME', preferential: true, preference: 'MSME', preferenceNo: 'UDYAM-RJ-27-0048812' },
    work: { categories: ['Core drilling', 'Borewell & pumping test'], areas: 'Udaipur, Rajsamand, Chittorgarh, Bhilwara', experience: '9', accreditation: '', turnover: '84 lakh' },
    address: { line: 'Plot 14, RIICO Industrial Area, Madri', city: 'Udaipur', state: 'Rajasthan', country: 'India', pincode: '313003' },
    contact: { title: 'Mr', name: 'Mahendra Singh Chundawat', dob: '1978-03-14', designation: 'Proprietor', phone: '', mobile: '9829412270', email: 'mewardrilling@gmail.com' },
    tax: { pan: 'CKLPC4471Q', gstRegistered: true, gstin: '24CKLPC4471Q1ZB' },
    bank: { holder: 'Mewar Drilling & Boring', bank: 'Bank of Baroda', branch: 'Madri, Udaipur', accountNo: '46120200001873', ifsc: 'BARB0MADRIX', type: 'Current' },
    documents: [doc('VR12-1', 'PAN card', 'PAN_Mewar_Drilling.pdf', 212000), doc('VR12-2', 'GST certificate', 'GST_REG-06.pdf', 388000), doc('VR12-3', 'Registration / Udyam / Startup certificate', 'Udyam_certificate.pdf', 156000)],
    history: [{ at: at(0, '09:20'), action: 'Submitted', by: 'Mahendra Singh Chundawat' }],
  },
  {
    id: 'VR-2026-011',
    submittedAt: at(1, '16:45'),
    status: 'New',
    firm: { name: 'Shekhawati Geo Labs', companyType: 'Laboratory', regNo: 'RJ/JPR/FIRM/2014/3391', partners: 'Anil Kumawat, Rekha Kumawat', year: '2014', nature: 'NABL testing of rock, ore, soil and water samples', legalStatus: 'Partnership', category: 'Small Unit as per MSME', preferential: true, preference: 'MSME', preferenceNo: 'UDYAM-RJ-17-0015264' },
    work: { categories: ['Lab testing (NABL)', 'Geotechnical testing'], areas: 'All Rajasthan', experience: '12', accreditation: 'NABL TC-8812 (chemical & mechanical testing)', turnover: '2.1 crore' },
    address: { line: 'G-7, Sitapura Industrial Area', city: 'Jaipur', state: 'Rajasthan', country: 'India', pincode: '302022' },
    contact: { title: 'Mr', name: 'Anil Kumawat', dob: '1974-11-02', designation: 'Managing Partner', phone: '0141 2770156', mobile: '9414035561', email: 'lab@shekhawatigeolabs.in' },
    tax: { pan: 'ABSFS7412K', gstRegistered: true, gstin: '08ABSFS7412K1Z4' },
    bank: { holder: 'Shekhawati Geo Labs', bank: 'HDFC Bank', branch: 'Sitapura, Jaipur', accountNo: '50200047718264', ifsc: 'HDFC0002231', type: 'Current' },
    documents: [
      doc('VR11-1', 'PAN card', 'PAN_Shekhawati_Geo_Labs.pdf', 198000),
      doc('VR11-2', 'Cancelled cheque', 'Cancelled_cheque_HDFC.jpg', 402000),
      doc('VR11-3', 'GST certificate', 'GST_Certificate.pdf', 351000),
      doc('VR11-4', 'Experience / accreditation', 'NABL_certificate_TC-8812.pdf', 624000),
    ],
    history: [{ at: at(1, '16:45'), action: 'Submitted', by: 'Anil Kumawat' }],
  },
  {
    id: 'VR-2026-010',
    submittedAt: at(5, '11:05'),
    status: 'Changes requested',
    firm: { name: 'Thar Aerial Mapping', companyType: 'Survey Agency', regNo: 'AAX-4417', partners: 'Vikram Bishnoi, Neha Bishnoi', year: '2020', nature: 'Drone mapping and DGPS surveys of mining leases', legalStatus: 'LLP', category: 'Micro Unit as per MSME', preferential: true, preference: 'Startup', preferenceNo: 'DIPP88214' },
    work: { categories: ['Drone survey', 'DGPS & total station survey'], areas: 'Bikaner, Jodhpur, Barmer, Nagaur', experience: '5', accreditation: '', turnover: '46 lakh' },
    address: { line: '22, Rani Bazar Industrial Area', city: 'Bikaner', state: 'Rajasthan', country: 'India', pincode: '334001' },
    contact: { title: 'Mr', name: 'Vikram Bishnoi', dob: '1990-07-21', designation: 'Designated Partner', phone: '', mobile: '9636218840', email: 'ops@tharaerial.in' },
    tax: { pan: 'AAXFT2290L', gstRegistered: true, gstin: '08AAXFT2290L1ZQ' },
    bank: { holder: 'Thar Aerial Mapping LLP', bank: 'State Bank of India', branch: 'Rani Bazar, Bikaner', accountNo: '39448120775', ifsc: 'SBIN0031421', type: 'Current' },
    documents: [doc('VR10-1', 'PAN card', 'PAN_Thar_Aerial.pdf', 180000), doc('VR10-2', 'Cancelled cheque', 'cheque.jpg', 96000), doc('VR10-3', 'GST certificate', 'GST.pdf', 290000)],
    note: 'The cancelled cheque is not readable — please upload a clear scan. Also add your DGCA remote pilot certificate for drone work.',
    history: [
      { at: at(5, '11:05'), action: 'Submitted', by: 'Vikram Bishnoi' },
      { at: at(3, '15:30'), action: 'Sent back for changes', by: 'Kritika Gupta', note: 'The cancelled cheque is not readable — please upload a clear scan. Also add your DGCA remote pilot certificate for drone work.' },
    ],
  },
  {
    id: 'VR-2026-009',
    submittedAt: at(10, '10:40'),
    status: 'Rejected',
    firm: { name: 'Rajasthan Drilling Company Pvt. Ltd.', companyType: 'Contractor', regNo: 'U45200RJ2019PTC064412', partners: 'H. Rawat, S. Rawat', year: '2019', nature: 'Exploratory core drilling', legalStatus: 'Private Limited Company', category: 'Small Unit as per MSME', preferential: false, preference: '', preferenceNo: '' },
    work: { categories: ['Core drilling'], areas: 'Udaipur division', experience: '7', accreditation: '', turnover: '1.4 crore' },
    address: { line: 'Hiran Magri Sector 11', city: 'Udaipur', state: 'Rajasthan', country: 'India', pincode: '313002' },
    contact: { title: 'Mr', name: 'H. Rawat', dob: '1969-05-30', designation: 'Director', phone: '', mobile: '9829011401', email: 'accounts@rajdrill.in' },
    tax: { pan: 'AAKFR4521M', gstRegistered: true, gstin: '08AAKFR4521M1Z3' },
    bank: { holder: 'Rajasthan Drilling Co.', bank: 'SBI', branch: 'Udaipur', accountNo: '384411027781', ifsc: 'SBIN0001124', type: 'Current' },
    documents: [doc('VR09-1', 'PAN card', 'PAN.pdf', 150000), doc('VR09-2', 'Cancelled cheque', 'cheque.pdf', 120000), doc('VR09-3', 'GST certificate', 'GST.pdf', 260000)],
    reason: 'Already registered (duplicate PAN, GSTIN or bank account)',
    note: 'This PAN and GSTIN are already registered as VN-01 (Rajasthan Drilling Co.). Please sign in with that vendor ID.',
    history: [
      { at: at(10, '10:40'), action: 'Submitted', by: 'H. Rawat' },
      { at: at(8, '12:15'), action: 'Rejected', by: 'Kritika Gupta', note: 'This PAN and GSTIN are already registered as VN-01 (Rajasthan Drilling Co.). Please sign in with that vendor ID.' },
    ],
  },
]
