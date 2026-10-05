/*
 * CRM Master Data definitions.
 * Provides the canonical default service categories, services, minerals, and timeline units.
 */

export const DEFAULT_SERVICE_CATEGORIES = [
  { id: 'cat-1', name: 'Mineral Exploration & Resources', status: 'Active' },
  { id: 'cat-2', name: 'Mine Planning & Prefeasibility Study', status: 'Active' },
  { id: 'cat-3', name: 'Geophysical Survey & Report', status: 'Active' },
  { id: 'cat-4', name: 'Hydro & Ground Water', status: 'Active' },
  { id: 'cat-5', name: 'Remote Sensing & GIS', status: 'Active' },
]

export const DEFAULT_SERVICES = [
  // Mineral Exploration & Resources
  { id: 'srv-1', category: 'Mineral Exploration & Resources', name: 'End to End Exploration', status: 'Active' },
  { id: 'srv-2', category: 'Mineral Exploration & Resources', name: 'Exploration Programme Design', status: 'Active' },
  { id: 'srv-3', category: 'Mineral Exploration & Resources', name: 'Geological Modelling', status: 'Active' },
  { id: 'srv-4', category: 'Mineral Exploration & Resources', name: 'Resource Estimation', status: 'Active' },
  { id: 'srv-5', category: 'Mineral Exploration & Resources', name: 'Drilling Supervision', status: 'Active' },

  // Mine Planning & Prefeasibility Study
  { id: 'srv-6', category: 'Mine Planning & Prefeasibility Study', name: 'Mine Compliance Support', status: 'Active' },
  { id: 'srv-7', category: 'Mine Planning & Prefeasibility Study', name: 'Mining Plan Preparation', status: 'Active' },
  { id: 'srv-8', category: 'Mine Planning & Prefeasibility Study', name: 'Prefeasibility Study', status: 'Active' },
  { id: 'srv-9', category: 'Mine Planning & Prefeasibility Study', name: 'Lease Renewal Support', status: 'Active' },

  // Geophysical Survey & Report
  { id: 'srv-10', category: 'Geophysical Survey & Report', name: 'Ground Magnetic Survey', status: 'Active' },
  { id: 'srv-11', category: 'Geophysical Survey & Report', name: 'Ground Gravity Survey', status: 'Active' },
  { id: 'srv-12', category: 'Geophysical Survey & Report', name: 'Ground EM/IP Survey', status: 'Active' },
  { id: 'srv-13', category: 'Geophysical Survey & Report', name: 'Ground SP Survey', status: 'Active' },
  { id: 'srv-14', category: 'Geophysical Survey & Report', name: 'Borehole Geophysical Survey', status: 'Active' },
  { id: 'srv-15', category: 'Geophysical Survey & Report', name: 'Drone Magnetic Survey', status: 'Active' },
  { id: 'srv-16', category: 'Geophysical Survey & Report', name: 'Resistivity Survey', status: 'Active' },

  // Hydro & Ground Water
  { id: 'srv-17', category: 'Hydro & Ground Water', name: 'Technical Report', status: 'Active' },
  { id: 'srv-18', category: 'Hydro & Ground Water', name: 'Groundwater Investigation', status: 'Active' },
  { id: 'srv-19', category: 'Hydro & Ground Water', name: 'Aquifer Modelling', status: 'Active' },
  { id: 'srv-20', category: 'Hydro & Ground Water', name: 'Dewatering System Design', status: 'Active' },

  // Remote Sensing & GIS
  { id: 'srv-21', category: 'Remote Sensing & GIS', name: 'Data Purchase', status: 'Active' },
  { id: 'srv-22', category: 'Remote Sensing & GIS', name: 'DGPS Survey', status: 'Active' },
  { id: 'srv-23', category: 'Remote Sensing & GIS', name: 'Drone Survey & Mapping', status: 'Active' },
  { id: 'srv-24', category: 'Remote Sensing & GIS', name: 'Land Use Mapping', status: 'Active' },
]

export const DEFAULT_MINERALS = [
  { id: 'min-1', name: 'REE', status: 'Active' },
  { id: 'min-2', name: 'Critical Mineral', status: 'Active' },
  { id: 'min-3', name: 'Pb', status: 'Active' },
  { id: 'min-4', name: 'Zn', status: 'Active' },
]

export const TIMELINE_UNITS = ['Days', 'Months', 'Years']
