import { Mountain, Shovel, FlaskConical, Waves, Layers, Drill, FileSpreadsheet, Hammer, ScrollText, Truck, Database } from 'lucide-react'

export const FIELD_SECTIONS = [
  {
    key: 'geological-mapping',
    slug: 'geological-mapping',
    route: '/field-database/geological-mapping',
    title: 'Geological Mapping',
    shortTitle: 'Geological Mapping',
    description: 'Rock type, lithological contacts, structural orientation, and geological unit observation logs',
    icon: Mountain,
    prefix: 'FD-GM',
    samplePlaceholder: 'OUTCROP-01 / WP-104',
    category: 'Surface Exploration',
  },
  {
    key: 'trench-mapping',
    slug: 'trench-mapping',
    route: '/field-database/trench-mapping',
    title: 'Trench Mapping',
    shortTitle: 'Trench Mapping',
    description: 'Trench profiling, pit mapping, wall lithology boundaries, and mineralization horizon logs',
    icon: Shovel,
    prefix: 'FD-TM',
    samplePlaceholder: 'TR-2026-01 / PIT-A',
    category: 'Surface Exploration',
  },
  {
    key: 'soil-sampling',
    slug: 'soil-sampling',
    route: '/field-database/soil-sampling',
    title: 'Soil Sampling',
    shortTitle: 'Soil Sampling',
    description: 'Soil horizon, geochemical grid sampling, composite sampling points, and B-horizon survey logs',
    icon: FlaskConical,
    prefix: 'FD-SS',
    samplePlaceholder: 'SOIL-GRID-105',
    category: 'Geochemical Surveys',
  },
  {
    key: 'stream-sediment',
    slug: 'stream-sediment',
    route: '/field-database/stream-sediment',
    title: 'Stream Sediment Sampling',
    shortTitle: 'Stream Sediment Sampling',
    description: 'Drainage basin sampling, active channel stream sediment, and heavy mineral concentration logs',
    icon: Waves,
    prefix: 'FD-STR',
    samplePlaceholder: 'STR-SED-42',
    category: 'Geochemical Surveys',
  },
  {
    key: 'channel-sampling',
    slug: 'channel-sampling',
    route: '/field-database/channel-sampling',
    title: 'Channel Sampling',
    shortTitle: 'Channel Sampling',
    description: 'Continuous groove sampling, outcrop channel intervals, and chip-channel survey logs',
    icon: Layers,
    prefix: 'FD-CS',
    samplePlaceholder: 'CHN-LINE-08',
    category: 'Geochemical Surveys',
  },
  {
    key: 'core-drilling-dpr',
    slug: 'core-drilling-dpr',
    route: '/field-database/core-drilling-dpr',
    title: 'Core Drilling Data — Daily Progress Report',
    shortTitle: 'Core Drilling DPR',
    description: 'Daily diamond drilling progress, shift runs, rig operation, drill depth, and run recovery progress',
    icon: Drill,
    prefix: 'FD-CDD',
    samplePlaceholder: 'BH-CD-01 / RIG-02',
    category: 'Drilling & Subsurface',
  },
  {
    key: 'drill-core-logging',
    slug: 'drill-core-logging',
    route: '/field-database/drill-core-logging',
    title: 'Drill Core Logging',
    shortTitle: 'Drill Core Logging',
    description: 'Core run depth intervals, RQD measurements, core photography, and stratigraphical logging',
    icon: FileSpreadsheet,
    prefix: 'FD-DCL',
    samplePlaceholder: 'RUN-04 (12.5m - 15.5m)',
    category: 'Drilling & Subsurface',
  },
  {
    key: 'non-core-drilling-dpr',
    slug: 'non-core-drilling-dpr',
    route: '/field-database/non-core-drilling-dpr',
    title: 'Non-Core Drilling Data — Daily Progress Report',
    shortTitle: 'Non-Core DPR',
    description: 'RC/DTH daily drilling progress, penetration rates, compressed air flushing, and meterage logs',
    icon: Hammer,
    prefix: 'FD-NCD',
    samplePlaceholder: 'RC-HOLE-03 / RIG-01',
    category: 'Drilling & Subsurface',
  },
  {
    key: 'non-core-logging',
    slug: 'non-core-logging',
    route: '/field-database/non-core-logging',
    title: 'Non-Core Logging',
    shortTitle: 'Non-Core Logging',
    description: 'Rotary chip logging, cutting intervals, mineralogical grain examination, and dust recovery',
    icon: ScrollText,
    prefix: 'FD-NCL',
    samplePlaceholder: 'CHIP-INT-02 (20m - 22m)',
    category: 'Drilling & Subsurface',
  },
  {
    key: 'dispatch-database',
    slug: 'dispatch-database',
    route: '/field-database/dispatch-database',
    title: 'Dispatch Database',
    shortTitle: 'Dispatch Database',
    description: 'Field sample batch dispatches to analytical laboratories, core box couriers, and chain-of-custody transfer logs',
    icon: Truck,
    prefix: 'FD-DISP',
    samplePlaceholder: 'BATCH-NABL-2026-09',
    category: 'Chain of Custody',
  },
]

export const getFieldSectionByKey = (key) => {
  return FIELD_SECTIONS.find((s) => s.key === key || s.slug === key) || null
}

/* Realistic seed data referencing actual projects and personnel */
export const SEEDED_FIELD_RECORDS = [
  // 1. Geological Mapping
  {
    id: 'FD-GM-2026-001',
    section: 'geological-mapping',
    projectId: 'PRJ-001',
    projectName: 'Bhilwara Iron Ore Block',
    date: '2026-09-20',
    employeeId: 'BGS-014',
    employeeName: 'Ajay Kumar',
    metadata: {
      location: 'South Ridge Sector B Outcrop 4',
      sampleOrBoreholeId: 'WP-GM-014',
      coordinates: { latitude: '25.3478° N', longitude: '74.6392° E', elevation: '420 m' },
      remarks: 'Banded Magnetite Quartzite (BMQ) exposed with 65° strike dip towards SW.',
    },
    data: {},
    status: 'Submitted',
    createdAt: '2026-09-20T10:30:00Z',
    updatedAt: '2026-09-20T11:15:00Z',
    createdBy: 'Ajay Kumar',
  },
  {
    id: 'FD-GM-2026-002',
    section: 'geological-mapping',
    projectId: 'PRJ-002',
    projectName: 'Udaipur Rock Phosphate Block',
    date: '2026-09-22',
    employeeId: 'BGS-007',
    employeeName: 'Ravi Gurjar',
    metadata: {
      location: 'Jhamarkotra West Escarpment',
      sampleOrBoreholeId: 'WP-GM-022',
      coordinates: { latitude: '24.5212° N', longitude: '73.8115° E', elevation: '510 m' },
      remarks: 'Stromatolitic phosphorite horizon in dolomite unit, mapped using drone orthophoto reference.',
    },
    data: {},
    status: 'Submitted',
    createdAt: '2026-09-22T09:45:00Z',
    updatedAt: '2026-09-22T09:45:00Z',
    createdBy: 'Ravi Gurjar',
  },

  // 2. Trench Mapping
  {
    id: 'FD-TM-2026-001',
    section: 'trench-mapping',
    projectId: 'PRJ-001',
    projectName: 'Bhilwara Iron Ore Block',
    date: '2026-09-18',
    employeeId: 'BGS-014',
    employeeName: 'Ajay Kumar',
    metadata: {
      location: 'Trench TR-01 (15m x 1.5m x 2m)',
      sampleOrBoreholeId: 'TR-BH-01',
      coordinates: { latitude: '25.3485° N', longitude: '74.6380° E', elevation: '418 m' },
      remarks: 'Cross-cutting pegmatite vein observed at 8.2m mark from trench origin. Samples bagged.',
    },
    data: {},
    status: 'Submitted',
    createdAt: '2026-09-18T14:20:00Z',
    updatedAt: '2026-09-18T15:00:00Z',
    createdBy: 'Ajay Kumar',
  },

  // 3. Soil Sampling
  {
    id: 'FD-SS-2026-001',
    section: 'soil-sampling',
    projectId: 'PRJ-004',
    projectName: 'Nagaur Limestone Pre-Feasibility',
    date: '2026-09-24',
    employeeId: 'BGS-015',
    employeeName: 'Deepak Soni',
    metadata: {
      location: 'Grid Line L-4, Station S-12',
      sampleOrBoreholeId: 'SOIL-NG-12',
      coordinates: { latitude: '27.2014° N', longitude: '73.7431° E', elevation: '330 m' },
      remarks: 'Sample collected from B-horizon at 40cm depth. Calcareous sandy loam.',
    },
    data: {},
    status: 'Submitted',
    createdAt: '2026-09-24T11:00:00Z',
    updatedAt: '2026-09-24T11:00:00Z',
    createdBy: 'Deepak Soni',
  },
  {
    id: 'FD-SS-2026-002',
    section: 'soil-sampling',
    projectId: 'PRJ-001',
    projectName: 'Bhilwara Iron Ore Block',
    date: '2026-09-25',
    employeeId: 'BGS-007',
    employeeName: 'Ravi Gurjar',
    metadata: {
      location: 'Anomalous geochemical zone East-2',
      sampleOrBoreholeId: 'SOIL-BH-45',
      coordinates: { latitude: '25.3510° N', longitude: '74.6415° E', elevation: '425 m' },
      remarks: 'Reddish lateritic soil with high magnetic susceptibility.',
    },
    data: {},
    status: 'Draft',
    createdAt: '2026-09-25T16:15:00Z',
    updatedAt: '2026-09-25T16:15:00Z',
    createdBy: 'Ravi Gurjar',
  },

  // 4. Stream Sediment Sampling
  {
    id: 'FD-STR-2026-001',
    section: 'stream-sediment',
    projectId: 'PRJ-005',
    projectName: 'Banswara Manganese Block',
    date: '2026-09-19',
    employeeId: 'BGS-018',
    employeeName: 'Pooja Meena',
    metadata: {
      location: 'Confluence of Stream Alpha & Nullah-3',
      sampleOrBoreholeId: 'STR-BW-03',
      coordinates: { latitude: '23.5419° N', longitude: '74.4528° E', elevation: '280 m' },
      remarks: '-80 mesh sieved sample collected from active bar. 3 kg composite stored in poly bag.',
    },
    data: {},
    status: 'Submitted',
    createdAt: '2026-09-19T13:40:00Z',
    updatedAt: '2026-09-19T13:40:00Z',
    createdBy: 'Pooja Meena',
  },

  // 5. Channel Sampling
  {
    id: 'FD-CS-2026-001',
    section: 'channel-sampling',
    projectId: 'PRJ-002',
    projectName: 'Udaipur Rock Phosphate Block',
    date: '2026-09-21',
    employeeId: 'BGS-014',
    employeeName: 'Ajay Kumar',
    metadata: {
      location: 'Quarry Face Cut 3',
      sampleOrBoreholeId: 'CHN-UD-09',
      coordinates: { latitude: '24.5205° N', longitude: '73.8130° E', elevation: '515 m' },
      remarks: 'Continuous channel cut across 2.0m true thickness. Sample weight approx 4.5kg.',
    },
    data: {},
    status: 'Submitted',
    createdAt: '2026-09-21T15:10:00Z',
    updatedAt: '2026-09-21T15:10:00Z',
    createdBy: 'Ajay Kumar',
  },

  // 6. Core Drilling DPR
  {
    id: 'FD-CDD-2026-001',
    section: 'core-drilling-dpr',
    projectId: 'PRJ-003',
    projectName: 'Sikar Deep Potash Drilling',
    date: '2026-09-23',
    employeeId: 'BGS-016',
    employeeName: 'Imran Ali',
    metadata: {
      location: 'Borehole Location SK-BH-01',
      sampleOrBoreholeId: 'BH-SK-01',
      coordinates: { latitude: '27.6128° N', longitude: '75.1432° E', elevation: '435 m' },
      remarks: 'Shift Day: Rig Atlas Copco CS14. Drilled 142.0m to 164.5m (22.5m meterage). Bentonite mud circulating normal.',
    },
    data: {},
    status: 'Submitted',
    createdAt: '2026-09-23T18:30:00Z',
    updatedAt: '2026-09-23T18:30:00Z',
    createdBy: 'Imran Ali',
  },

  // 7. Drill Core Logging
  {
    id: 'FD-DCL-2026-001',
    section: 'drill-core-logging',
    projectId: 'PRJ-003',
    projectName: 'Sikar Deep Potash Drilling',
    date: '2026-09-24',
    employeeId: 'BGS-016',
    employeeName: 'Imran Ali',
    metadata: {
      location: 'Core Shed SK-01',
      sampleOrBoreholeId: 'SK-BH-01 (Run 18 to 22)',
      coordinates: { latitude: '27.6128° N', longitude: '75.1432° E', elevation: '435 m' },
      remarks: 'Interval 142.0m - 158.0m logged. Halite with sylvite layers. Average core recovery 96.2%, RQD 84%. Core boxes 24-27 cataloged.',
    },
    data: {},
    status: 'Submitted',
    createdAt: '2026-09-24T17:00:00Z',
    updatedAt: '2026-09-24T17:00:00Z',
    createdBy: 'Imran Ali',
  },

  // 8. Non-Core Drilling DPR
  {
    id: 'FD-NCD-2026-001',
    section: 'non-core-drilling-dpr',
    projectId: 'PRJ-004',
    projectName: 'Nagaur Limestone Pre-Feasibility',
    date: '2026-09-22',
    employeeId: 'BGS-017',
    employeeName: 'Sunil Yadav',
    metadata: {
      location: 'DTH Rig Site NG-NC-04',
      sampleOrBoreholeId: 'DTH-NG-04',
      coordinates: { latitude: '27.2050° N', longitude: '73.7480° E', elevation: '328 m' },
      remarks: 'Non-core DTH rig drilled from 0m to 48m depth. Water table struck at 36m. Chip samples collected every 1 meter interval.',
    },
    data: {},
    status: 'Submitted',
    createdAt: '2026-09-22T19:00:00Z',
    updatedAt: '2026-09-22T19:00:00Z',
    createdBy: 'Sunil Yadav',
  },

  // 9. Non-Core Logging
  {
    id: 'FD-NCL-2026-001',
    section: 'non-core-logging',
    projectId: 'PRJ-004',
    projectName: 'Nagaur Limestone Pre-Feasibility',
    date: '2026-09-23',
    employeeId: 'BGS-017',
    employeeName: 'Sunil Yadav',
    metadata: {
      location: 'Field Camp Logging Station 2',
      sampleOrBoreholeId: 'CHIP-NG-04 (0 - 48m)',
      coordinates: { latitude: '27.2050° N', longitude: '73.7480° E', elevation: '328 m' },
      remarks: 'Chip sample trays evaluated with 10% HCl effervescence. Dense gray limestone interval 12m-38m with minor chert nodules.',
    },
    data: {},
    status: 'Submitted',
    createdAt: '2026-09-23T11:45:00Z',
    updatedAt: '2026-09-23T11:45:00Z',
    createdBy: 'Sunil Yadav',
  },

  // 10. Dispatch Database
  {
    id: 'FD-DISP-2026-001',
    section: 'dispatch-database',
    projectId: 'PRJ-001',
    projectName: 'Bhilwara Iron Ore Block',
    date: '2026-09-25',
    employeeId: 'BGS-014',
    employeeName: 'Ajay Kumar',
    metadata: {
      location: 'Site Camp to Shiva Analytical Lab, Bengaluru',
      sampleOrBoreholeId: 'BATCH-BH-FE-01 (40 Samples)',
      coordinates: { latitude: '25.3478° N', longitude: '74.6392° E', elevation: '420 m' },
      remarks: 'Consignment of 40 pulverized iron ore core samples dispatched via BlueDart Air Waybill #849201934. Sample security seals intact.',
    },
    data: {},
    status: 'Submitted',
    createdAt: '2026-09-25T14:30:00Z',
    updatedAt: '2026-09-25T14:30:00Z',
    createdBy: 'Ajay Kumar',
  },
]

/**
 * Filter records by user role:
 * - Super Admin: sees all records
 * - Manager: sees self + operations reportees / field team
 * - Employee: sees strictly own records
 */
export function filterFieldRecordsByRole(records, role, user) {
  if (!Array.isArray(records)) return []
  if (role === 'Super Admin') return records

  if (role === 'Manager') {
    // Operations Manager oversees field delivery and field staff
    return records
  }

  if (role === 'Employee') {
    const currentName = (typeof user === 'string' ? user : user?.name || '').trim().toLowerCase()
    const currentEmpId = (typeof user === 'object' ? user?.employeeId || '' : '').trim().toLowerCase()
    return records.filter((r) => {
      const createdBy = (r.createdBy || '').trim().toLowerCase()
      const empName = (r.employeeName || '').trim().toLowerCase()
      const empId = (r.employeeId || '').trim().toLowerCase()
      return (
        (currentName && (createdBy === currentName || empName === currentName)) ||
        (currentEmpId && empId === currentEmpId)
      )
    })
  }

  // Unauthorized roles
  return []
}

/**
 * Generates the next sequential Record ID for a section.
 */
export function generateFieldRecordId(sectionKey, existingRecords = []) {
  const section = getFieldSectionByKey(sectionKey)
  const prefix = section?.prefix || 'FD-REC'
  const year = new Date().getFullYear()
  const matching = existingRecords.filter((r) => r.id?.startsWith(`${prefix}-${year}`))
  const nextNum = matching.length + 1
  return `${prefix}-${year}-${String(nextNum).padStart(3, '0')}`
}

/**
 * Validates a field database record payload.
 */
export function validateFieldRecord(record) {
  const errors = {}

  if (!record.projectId || !record.projectId.trim()) {
    errors.projectId = 'Project selection is required.'
  }

  if (!record.date || !record.date.trim()) {
    errors.date = 'Record date is required.'
  } else if (isNaN(new Date(record.date).getTime())) {
    errors.date = 'Valid date (YYYY-MM-DD) is required.'
  }

  if (!record.employeeName || !record.employeeName.trim()) {
    errors.employeeName = 'Geologist / recorded by is required.'
  }

  const loc = record.metadata?.location || record.location
  if (!loc || !loc.trim()) {
    errors.location = 'Field location / station is required.'
  }

  if (record.status && !['Draft', 'Submitted'].includes(record.status)) {
    errors.status = 'Status must be Draft or Submitted.'
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  }
}

