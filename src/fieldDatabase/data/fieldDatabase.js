import { FORMAT_SEED_RECORDS } from './fieldSeeds'

export const FIELD_SECTIONS = [
  {
    key: 'geological-mapping',
    slug: 'geological-mapping',
    route: '/field-database/geological-mapping',
    title: 'Geological Mapping',
    shortTitle: 'Geological Mapping',
    description: 'Rock type, lithological contacts, structural orientation, and geological unit observation logs',
    icon: 'Mountain',
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
    icon: 'Shovel',
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
    icon: 'FlaskConical',
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
    icon: 'Waves',
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
    icon: 'Layers',
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
    description: 'Daily drilling report: rig, shift, core runs with recovery and RQD, and the activity time log',
    icon: 'Drill',
    prefix: 'FD-CDD',
    samplePlaceholder: 'BH-CD-01 / RIG-02',
    category: 'Drilling & Subsurface',
  },
  {
    key: 'collar-survey',
    slug: 'collar-survey',
    route: '/field-database/collar-survey',
    title: 'Collar & Downhole Survey',
    shortTitle: 'Collar & Survey',
    description: 'Borehole collar position, planned azimuth and dip, depths by core size, and downhole survey readings',
    icon: 'Crosshair',
    prefix: 'FD-COL',
    samplePlaceholder: 'AMB-BH-02',
    category: 'Drilling & Subsurface',
  },
  {
    key: 'drill-core-logging',
    slug: 'drill-core-logging',
    route: '/field-database/drill-core-logging',
    title: 'Drill Core Logging',
    shortTitle: 'Drill Core Logging',
    description: 'Interval logging of the core (rock, structure, fractures, alteration, ore), core sampling and assay samples',
    icon: 'FileSpreadsheet',
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
    icon: 'Hammer',
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
    icon: 'ScrollText',
    prefix: 'FD-NCL',
    samplePlaceholder: 'CHIP-INT-02 (20m - 22m)',
    category: 'Drilling & Subsurface',
  },
  {
    key: 'dispatch-database',
    slug: 'dispatch-database',
    route: '/field-database/dispatch-database',
    title: 'Sample Dispatch',
    shortTitle: 'Sample Dispatch',
    description: 'Lab batches with QC samples inserted, the dispatch letter, courier tracking and lab status',
    icon: 'Truck',
    prefix: 'FD-DISP',
    samplePlaceholder: 'BATCH-NABL-2026-09',
    category: 'Chain of Custody',
  },
]

export const getFieldSectionByKey = (key) => {
  return FIELD_SECTIONS.find((s) => s.key === key || s.slug === key) || null
}

/* Demo records: the client's formats (fieldSeeds.js), and the two non-core sections whose format is still awaited. */
export const SEEDED_FIELD_RECORDS = [
  ...FORMAT_SEED_RECORDS,

  // 8. Non-Core Drilling DPR
  {
    id: 'FD-NCD-2026-001',
    section: 'non-core-drilling-dpr',
    projectId: 'PR-26-001',
    projectName: 'Resource Estimation',
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
    projectId: 'PR-26-001',
    projectName: 'Resource Estimation',
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

