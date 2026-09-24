/*
 * The project side of the team (the CRM's TEAM in mockData is the sales team).
 * Team leads are matched to the service line they lead; field members carry their field skills.
 */
export const COORDINATORS = [
  { name: 'A. Singh', title: 'Project Coordinator' },
  { name: 'N. Rathore', title: 'Project Coordinator' },
]

export const TEAM_LEADS = [
  { name: 'Dr. V. Meena', title: 'Senior Geologist', services: ['Mineral Exploration & Resources', 'Mineral Economics & Valuation'] },
  { name: 'R. Bhati', title: 'Hydrogeologist', services: ['Hydrogeology & Groundwater', 'Geotechnical Services'] },
  { name: 'S. Choudhary', title: 'Mining Engineer', services: ['Mine Planning & Prefeasibility Study', 'Remote Sensing, GIS & Aerial Mapping'] },
  { name: 'M. Khan', title: 'Environment Specialist', services: ['Environment, Community & Permitting'] },
]

/* phone: for task messages on WhatsApp (demo numbers). */
export const FIELD_MEMBERS = [
  { name: 'Ajay Kumar', title: 'Field Geologist', skills: 'Mapping, sampling', phone: '9829022101' },
  { name: 'Deepak Soni', title: 'Surveyor', skills: 'DGPS, total station', phone: '9829022102' },
  { name: 'Ravi Gurjar', title: 'Drone Operator', skills: 'Aerial survey, GIS', phone: '9829022103' },
  { name: 'Imran Ali', title: 'Field Technician', skills: 'Drilling logs, core sampling', phone: '9829022104' },
  { name: 'Sunil Yadav', title: 'Field Technician', skills: 'Water level, pumping tests', phone: '9829022105' },
  { name: 'Pooja Meena', title: 'Environment Surveyor', skills: 'Air, water & noise monitoring', phone: '9829022106' },
]

export const teamLeadFor = (service, n) => {
  const matching = TEAM_LEADS.filter((t) => t.services.includes(service))
  return (matching.length ? matching : TEAM_LEADS)[n % (matching.length || TEAM_LEADS.length)]
}

export const titleOf = (name) =>
  [...COORDINATORS, ...TEAM_LEADS, ...FIELD_MEMBERS].find((p) => p.name === name)?.title ?? ''
