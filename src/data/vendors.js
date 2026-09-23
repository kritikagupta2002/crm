/*
 * Subcontractors the project team hires for work it doesn't do in-house: drilling, lab testing,
 * drone flights, pumping tests. Seeded subcontracts pick the vendor that fits the service line.
 * tds: the section the payment falls under (194C contract work, 194J technical/professional) and its rate.
 * A vendor signs in to the vendor portal with its vendor ID and registered mobile.
 */
export const VENDORS = [
  { id: 'VN-01', name: 'Rajasthan Drilling Co.', work: 'Core drilling', place: 'Udaipur', contact: 'H. Rawat', phone: '9829011401', email: 'accounts@rajdrill.in', gstin: '08AAKFR4521M1Z3', pan: 'AAKFR4521M', tds: { section: '194C', rate: 2 }, bank: { name: 'SBI, Udaipur', accountNo: '3844 1102 7781', ifsc: 'SBIN0001124' }, since: '2023-06-12' },
  { id: 'VN-02', name: 'GeoLab Analytical', work: 'Lab testing (NABL)', place: 'Jaipur', contact: 'Dr. S. Kothari', phone: '9829011402', email: 'lab@geolab.in', gstin: '08AAGCG7310K1Z8', pan: 'AAGCG7310K', tds: { section: '194J', rate: 2 }, bank: { name: 'HDFC Bank, Malviya Nagar', accountNo: '5020 0031 4471', ifsc: 'HDFC0000315' }, since: '2022-11-03' },
  { id: 'VN-03', name: 'SkyEye Drone Services', work: 'Drone survey', place: 'Jodhpur', contact: 'R. Solanki', phone: '9829011403', email: 'ops@skyeyedrones.in', gstin: '08ABMFS2290Q1Z1', pan: 'ABMFS2290Q', tds: { section: '194C', rate: 2 }, bank: { name: 'ICICI Bank, Jodhpur', accountNo: '0987 0500 2231', ifsc: 'ICIC0000987' }, since: '2024-02-20' },
  { id: 'VN-04', name: 'Aqua Borewell Works', work: 'Borewell & pumping test', place: 'Ajmer', contact: 'M. Chauhan', phone: '9829011404', email: 'aquaborewell@gmail.com', gstin: '08AHQPC6617D1Z5', pan: 'AHQPC6617D', tds: { section: '194C', rate: 1 }, bank: { name: 'Bank of Baroda, Ajmer', accountNo: '2911 0100 0045', ifsc: 'BARB0AJMERX' }, since: '2023-09-08' },
  { id: 'VN-05', name: 'EnviroTest Labs', work: 'Air, water & noise monitoring', place: 'Jaipur', contact: 'P. Mathur', phone: '9829011405', email: 'reports@envirotest.in', gstin: '08AAECE9021H1Z2', pan: 'AAECE9021H', tds: { section: '194J', rate: 2 }, bank: { name: 'Axis Bank, C-Scheme', accountNo: '9180 2003 3517', ifsc: 'UTIB0000047' }, since: '2022-07-15' },
  { id: 'VN-06', name: 'Marudhar Survey Services', work: 'DGPS & total station survey', place: 'Bikaner', contact: 'K. Bishnoi', phone: '9829011406', email: 'marudharsurvey@gmail.com', gstin: '08BCRPB4412L1Z9', pan: 'BCRPB4412L', tds: { section: '194C', rate: 1 }, bank: { name: 'PNB, Bikaner', accountNo: '4410 0021 0009', ifsc: 'PUNB0441000' }, since: '2024-05-02' },
]

export const TDS_SECTIONS = [
  { section: '194C', rate: 1, label: '194C · contract work · 1% (individual / HUF)' },
  { section: '194C', rate: 2, label: '194C · contract work · 2% (firm / company)' },
  { section: '194J', rate: 2, label: '194J · technical services · 2%' },
  { section: '194J', rate: 10, label: '194J · professional services · 10%' },
]

/* The work usually subcontracted on each service line, with a typical order value (₹). */
export const SUBCONTRACT_BY_SERVICE = {
  'Mineral Exploration & Resources': { vendor: 'Rajasthan Drilling Co.', work: 'Core drilling, 4 holes × 60 m', amount: 480000 },
  'Mineral Economics & Valuation': { vendor: 'GeoLab Analytical', work: 'Grade analysis of 40 samples', amount: 96000 },
  'Environment, Community & Permitting': { vendor: 'EnviroTest Labs', work: 'Baseline monitoring, one season', amount: 210000 },
  'Mine Planning & Prefeasibility Study': { vendor: 'SkyEye Drone Services', work: 'Drone survey & DEM of the lease', amount: 145000 },
  'Hydrogeology & Groundwater': { vendor: 'Aqua Borewell Works', work: 'Pumping test on 3 wells', amount: 120000 },
  'Remote Sensing, GIS & Aerial Mapping': { vendor: 'Marudhar Survey Services', work: 'DGPS survey of lease pillars', amount: 85000 },
  'Geotechnical Services': { vendor: 'GeoLab Analytical', work: 'Rock strength tests, 24 samples', amount: 110000 },
}

/* A subcontract moves through these in order; each step is recorded with who did it and when. */
export const WORK_ORDER_STATUS = ['Issued', 'In progress', 'Completed', 'Bill received', 'Paid']
