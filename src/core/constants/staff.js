/**
 * Bansal Geo Solutions Pvt. Ltd. - Core Staff & Personnel Directory
 * Real company records
 */

export const COORDINATORS = [
  { name: 'Kritika Gupta', title: 'HR & Operations Lead', phone: '9829011223', email: 'kritika.gupta@bansalgeo.com', id: 'BGS/ADM-01' },
  { name: 'Inder Nogiya', title: 'Manager (Survey)', phone: '9785589075', email: 'inder.nogiya@bansalgeo.com', id: 'BGS/01' },
];

export const TEAM_LEADS = [
  { name: 'Dr. Amit Kumar Bansal', title: 'Managing Director & Chief Geologist', phone: '9887695208', email: 'amit.bansal@bansalgeo.com', id: 'BGS/DIR-01' },
  { name: 'Dharmendra Goyal', title: 'Executive Director', phone: '9829055443', email: 'dharmendra.goyal@bansalgeo.com', id: 'BGS/DIR-03' },
  { name: 'Inder Nogiya', title: 'Manager (Survey)', phone: '9785589075', email: 'inder.nogiya@bansalgeo.com', id: 'BGS/01' },
];

export const FIELD_MEMBERS = [
  { name: 'Vikas Verma', title: 'Surveyor', department: 'Mining & Survey', email: 'vikas.verma@bansalgeo.com', phone: '7665252839', id: 'BGS/04' },
  { name: 'Kuldip Singh', title: 'Field Supervisor', department: 'Mining & Survey', email: 'kuldip.singh@bansalgeo.com', phone: '9785990998', id: 'BGS/05' },
  { name: 'Balveer Singh Yadav', title: 'Jr. Geologist', department: 'Mineral Exploration', email: 'balveer.singh@bansalgeo.com', phone: '9784867411', id: 'BGS/09' },
  { name: 'Vishal Kumawat', title: 'Sr. Surveyor', department: 'Mineral Exploration', email: 'vishal.kumawat@bansalgeo.com', phone: '9166774427', id: 'BGS/10' },
  { name: 'Pradeep Chand', title: 'Intern (Surveyor)', department: 'Mineral Exploration', email: 'pradeep.chand@bansalgeo.com', phone: '6378170930', id: 'BGS/11' },
  { name: 'Madhurika Saini', title: 'Sr. GIS Analyst', department: 'Mineral Exploration', email: 'madhurikasaini@bansalgeo.com', phone: '9351349467', id: 'BGS/12' },
];

export const ALL_STAFF = [
  ...TEAM_LEADS.filter((l) => l.id !== 'BGS/01'), // Avoid duplicate Inder Nogiya
  COORDINATORS[0], // Kritika
  TEAM_LEADS[2],   // Inder
  ...FIELD_MEMBERS,
];

export const titleOf = (name) =>
  [...COORDINATORS, ...TEAM_LEADS, ...FIELD_MEMBERS].find((p) => p.name === name)?.title ?? '';
