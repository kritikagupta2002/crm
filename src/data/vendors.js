/*
 * Subcontractors the project team hires for work it doesn't do in-house: drilling, lab testing,
 * drone flights, pumping tests. Seeded subcontracts pick the vendor that fits the service line.
 */
export const VENDORS = [
  { name: 'Rajasthan Drilling Co.', work: 'Core drilling', place: 'Udaipur' },
  { name: 'GeoLab Analytical', work: 'Lab testing (NABL)', place: 'Jaipur' },
  { name: 'SkyEye Drone Services', work: 'Drone survey', place: 'Jodhpur' },
  { name: 'Aqua Borewell Works', work: 'Borewell & pumping test', place: 'Ajmer' },
  { name: 'EnviroTest Labs', work: 'Air, water & noise monitoring', place: 'Jaipur' },
  { name: 'Marudhar Survey Services', work: 'DGPS & total station survey', place: 'Bikaner' },
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

export const WORK_ORDER_STATUS = ['Issued', 'In progress', 'Completed', 'Bill received', 'Paid']
