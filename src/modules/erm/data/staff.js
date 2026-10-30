/*
 * Bansal Geo Solutions - Core Team & Field Personnel
 * Generated from official company records
 */
export const COORDINATORS = [
  { name: 'Kritika Gupta', title: 'HR & Operations Lead', phone: '9829011223' },
  { name: 'Inder Nogiya', title: 'Manager (Survey)', phone: '9785589075' },
]

export const TEAM_LEADS = [
  { name: 'Dr. Amit Kumar Bansal', title: 'Managing Director & Chief Geologist', services: ['Mineral Exploration & Resources', 'Mineral Economics & Valuation'] },
  { name: 'Dharmendra Goyal', title: 'Executive Director', services: ['Mineral Exploration', 'Mine Planning & Prefeasibility Study'] },
  { name: 'Inder Nogiya', title: 'Manager (Survey)', services: ['Mining & Survey', 'Remote Sensing, GIS & Aerial Mapping'] },
]

/* Real company field members & technical staff */
export const FIELD_MEMBERS = [
  { name: 'Vikas Verma', title: 'Surveyor', department: 'Mining & Survey', email: 'vikas.verma@bansalgeo.com', phone: '7665252839', id: 'BGS/04' },
  { name: 'Kuldip Singh', title: 'Field Supervisor', department: 'Mining & Survey', email: 'kuldip.singh@bansalgeo.com', phone: '9785990998', id: 'BGS/05' },
  { name: 'Balveer Singh Yadav', title: 'Jr. Geologist', department: 'Mineral Exploration', email: 'balveer.singh@bansalgeo.com', phone: '9784867411', id: 'BGS/09' },
  { name: 'Vishal Kumawat', title: 'Sr. Surveyor', department: 'Mineral Exploration', email: 'vishal.kumawat@bansalgeo.com', phone: '9166774427', id: 'BGS/10' },
  { name: 'Pradeep Chand', title: 'Intern (Surveyor)', department: 'Mineral Exploration', email: 'pradeep.chand@bansalgeo.com', phone: '6378170930', id: 'BGS/11' },
  { name: 'Madhurika Saini', title: 'Sr. GIS Analyst', department: 'Mineral Exploration', email: 'madhurikasaini@bansalgeo.com', phone: '9351349467', id: 'BGS/12' },
]

export const teamLeadFor = (service, n) => {
  const matching = TEAM_LEADS.filter((t) => t.services.includes(service))
  return (matching.length ? matching : TEAM_LEADS)[n % (matching.length || TEAM_LEADS.length)]
}

export const titleOf = (name) =>
  [...COORDINATORS, ...TEAM_LEADS, ...FIELD_MEMBERS].find((p) => p.name === name)?.title ?? ''
