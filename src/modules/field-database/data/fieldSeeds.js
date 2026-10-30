import { buildBatch } from '../utils/dispatch'
import { CRM_DEFAULTS, batchQaqc } from '../utils/qaqc'

/*
 * Demo field data in the client's formats, on two of the demo's projects:
 *  PR-26-041 Exploration Programme Design (Satpura Infra & Mining, Banaskantha) — a base-metal prospect, AMB-01
 *  PR-26-001 Resource Estimation (Thar Limestone, Nagaur) — a limestone block, NGR-02
 */

const AMB = { projectId: 'PR-26-041', projectName: 'Exploration Programme Design' }
const NGR = { projectId: 'PR-26-001', projectName: 'Resource Estimation' }

function rec(id, section, project, date, by, metadata, fields, rows = {}, status = 'Submitted') {
  const at = `${date}T${String(9 + (id.length % 8)).padStart(2, '0')}:30:00Z`
  return {
    id,
    section,
    ...project,
    date,
    employeeId: '',
    employeeName: by,
    metadata: { coordinates: { latitude: '', longitude: '', elevation: '' }, remarks: fields.DESCRIPTION1 || fields.COMMENTS || '', ...metadata },
    data: { fields, rows },
    status,
    createdAt: at,
    updatedAt: at,
    createdBy: by,
  }
}

const assay = (number, type, cat = 'ORD', date = '', original = '') => ({ SAMPLE_NUMBER: number, SAMPLE_CAT: cat, SAMPLE_TYPE: type, DATE: date, ORIGINAL_SAMPLE_NUMBER: original })

/* ---------- Geological mapping ---------- */
const MAPPING = [
  rec(
    'FD-GM-2026-001', 'geological-mapping', AMB, '2026-10-06', 'Ravi Gurjar',
    { location: 'Ridge east of the Ambaji–Danta road', sampleOrBoreholeId: 'AMB-ST-014', coordinates: { latitude: 'N 2692870', longitude: 'E 281945', elevation: '' } },
    {
      PROSPECTID: 'AMB-01', M_ST: 'AMB-ST-014', ST_TYPE: 'OC', SAMPLE_NUMBER: 'AMB-R-0141', SAMPLE_TYPE: 'ROCK', UTM_N_WGS84: 2692870, UTM_E_WGS84: 281945, LOCAL_N: 820, LOCAL_E: 1460,
      ROCK_CODE: 'MS', ROCK_TYPE: 'Mica Schist', COLOUR: 'Grey', GRAIN_SIZE: 'M', TEXTURE: 'Schistose', ROCK_FAB: 'Schistose', ROCK_AS1: 'Calc-silicate bands',
      Mineral1: 'Biotite', Mineral2: 'Muscovite', Mineral3: 'Quartz', Mineral4: 'Garnet', 'Ore 1': 'Chalcopyrite', 'Ore 2': 'Pyrite', MAG_SI: 0.42,
      FOLIATION: 'S1', TREND: 35, DIP: 62, DIPDIRECTION: 125, STR_CODE: '17', QZ_VN: 'Yes', QZ_STR: 'Parallel to S1',
      LOCATION: 'Ridge east of the Ambaji–Danta road', DESCRIPTION1: 'Garnetiferous mica schist with malachite stains along S1; thin quartz veins carry disseminated chalcopyrite.',
    },
    { assay: [assay('AMB-R-0141', 'ROCK', 'ORD', '2026-10-06'), assay('AMB-R-0142', 'ROCK', 'FDUP', '2026-10-06', 'AMB-R-0141')] },
  ),
  rec(
    'FD-GM-2026-002', 'geological-mapping', AMB, '2026-10-07', 'Pooja Meena',
    { location: 'Nala cutting, 400 m NW of the gossan', sampleOrBoreholeId: 'AMB-ST-015', coordinates: { latitude: 'N 2693115', longitude: 'E 281720', elevation: '' } },
    {
      PROSPECTID: 'AMB-01', M_ST: 'AMB-ST-015', ST_TYPE: 'OC', SAMPLE_NUMBER: 'AMB-R-0143', SAMPLE_TYPE: 'ROCK', UTM_N_WGS84: 2693115, UTM_E_WGS84: 281720,
      ROCK_CODE: 'CS', ROCK_TYPE: 'Clac-Silicate', COLOUR: 'Green', GRAIN_SIZE: 'F', TEXTURE: 'Granoblastic', Mineral1: 'Diopside', Mineral2: 'Tremolite', Mineral3: 'Calcite', 'Ore 1': 'Pyrite',
      BEDDING: 'S0', TREND: 40, DIP: 58, DIPDIRECTION: 130, STR_CODE: '1', LOCATION: 'Nala cutting, 400 m NW of the gossan',
      DESCRIPTION1: 'Banded calc-silicate rock, diopside-rich layers alternating with marble; pyrite specks along bands.',
    },
    { assay: [assay('AMB-R-0143', 'ROCK', 'ORD', '2026-10-07')] },
  ),
  rec(
    'FD-GM-2026-003', 'geological-mapping', NGR, '2026-09-29', 'Deepak Soni',
    { location: 'Quarry face, east of the block boundary', sampleOrBoreholeId: 'NGR-ST-006', coordinates: { latitude: 'N 3009240', longitude: 'E 375180', elevation: '' } },
    {
      PROSPECTID: 'NGR-02', M_ST: 'NGR-ST-006', ST_TYPE: 'OC', SAMPLE_NUMBER: 'NGR-R-021', SAMPLE_TYPE: 'ROCK', UTM_N_WGS84: 3009240, UTM_E_WGS84: 375180,
      ROCK_CODE: 'LST', ROCK_TYPE: 'Limestone', COLOUR: 'Grey', GRAIN_SIZE: 'F', TEXTURE: 'Crystalline', Mineral1: 'Calcite', Mineral2: 'Dolomite',
      BEDDING: 'S0', TREND: 10, DIP: 12, DIPDIRECTION: 280, STR_CODE: '1', LOCATION: 'Quarry face, east of the block boundary',
      DESCRIPTION1: 'Massive grey limestone, gently dipping west; chert nodules rare. 6 m face exposed.',
    },
    { assay: [assay('NGR-R-021', 'ROCK', 'ORD', '2026-09-29')] },
  ),
]

/* ---------- Trench and channel ---------- */
const interval = (FROM, TO, ROCK_CODE, ROCK_TYPE, extra) => ({ FROM, TO, ROCK_CODE, ROCK_TYPE, ...extra })

const TRENCH = rec(
  'FD-TM-2026-001', 'trench-mapping', AMB, '2026-10-09', 'Ravi Gurjar',
  { location: 'Gossan zone, block B', sampleOrBoreholeId: 'AMB-TR-03', coordinates: { latitude: '24.3315° N', longitude: '72.8521° E', elevation: '' } },
  { TRENCH_ID: 'AMB-TR-03', LOCATION: 'Gossan zone, block B', TRENCH_AZM: 120, LENGTH: 18, WIDTH: 1, DEPTH: 1.5, START_LONG: 72.8521, START_LATT: 24.3315 },
  {
    intervals: [
      interval(0, 3, 'MS', 'Mica Schist', { MINERAL1: 'Biotite', MINERAL2: 'Quartz', TREND: 38, DIP: 60, DIP_DIR: 128, STR_CODE: '17', GRAIN: 'M', TEXTURE: 'Schistose', SAMPLE_TYPE: 'ROCK', SAMPLE_CAT: 'ORD', SAMPLE_NO: 'AMB-T-0301', DESCRIPTION1: 'Weathered mica schist, limonite on joints.' }),
      interval(3, 5.5, 'GO', 'Gossan', { MINERAL1: 'Limonite', MINERAL2: 'Goethite', ORE1: 'Malachite', GRAIN: 'F', SAMPLE_TYPE: 'ROCK', SAMPLE_CAT: 'ORD', SAMPLE_NO: 'AMB-T-0302', DESCRIPTION1: 'Boxwork gossan with malachite and azurite stains.' }),
      interval(5.5, 9, 'CS', 'Clac-Silicate', { MINERAL1: 'Diopside', MINERAL2: 'Tremolite', ORE1: 'Pyrite', TREND: 40, DIP: 58, DIP_DIR: 130, STR_CODE: '1', GRAIN: 'F', TEXTURE: 'Granoblastic', SAMPLE_TYPE: 'ROCK', SAMPLE_CAT: 'ORD', SAMPLE_NO: 'AMB-T-0303' }),
      interval(9, 12, 'MS', 'Mica Schist', { MINERAL1: 'Biotite', MINERAL2: 'Garnet', ORE1: 'Chalcopyrite', ORE2: 'Pyrite', ORE3: 'Sphalerite', TREND: 36, DIP: 61, DIP_DIR: 126, STR_CODE: '17', GRAIN: 'M', TEXTURE: 'Schistose', SAMPLE_TYPE: 'ROCK', SAMPLE_CAT: 'ORD', SAMPLE_NO: 'AMB-T-0304', DESCRIPTION1: 'Sulphide-bearing schist; chalcopyrite stringers along S1.' }),
      interval(12, 18, 'QZ', 'Quartzite', { MINERAL1: 'Quartz', MINERAL2: 'Sericite', GRAIN: 'M', TEXTURE: 'Granoblastic', SAMPLE_TYPE: 'ROCK', SAMPLE_CAT: 'ORD', SAMPLE_NO: 'AMB-T-0305' }),
    ],
    assay: [
      assay('AMB-T-0301', 'ROCK', 'ORD', '2026-10-09'),
      assay('AMB-T-0302', 'ROCK', 'ORD', '2026-10-09'),
      assay('AMB-T-0303', 'ROCK', 'ORD', '2026-10-09'),
      assay('AMB-T-0304', 'ROCK', 'ORD', '2026-10-09'),
      assay('AMB-T-0305', 'ROCK', 'ORD', '2026-10-09'),
      assay('AMB-T-0306', 'ROCK', 'FDUP', '2026-10-09', 'AMB-T-0304'),
    ],
  },
)

const CHANNEL = rec(
  'FD-CS-2026-001', 'channel-sampling', AMB, '2026-10-11', 'Pooja Meena',
  { location: 'Old working face, pit 2', sampleOrBoreholeId: 'AMB-CH-07', coordinates: { latitude: '24.329° N', longitude: '72.8498° E', elevation: '' } },
  { CHANNEL_ID: 'AMB-CH-07', LOCATION: 'Old working face, pit 2', WIDTH: 0.1, DEPTH: 0.05, AZM: 135, CH_DIP: 0, LONGITUDE: 72.8498, LATTITUDE: 24.329 },
  {
    intervals: [
      interval(0, 1, 'MS', 'Mica Schist', { SAMPLE_NO: 'AMB-C-0701', SAMPLE_TYPE: 'ROCK', MINERAL1: 'Biotite', ORE1: 'Pyrite', GRAIN: 'M', TEXTURE: 'Schistose', TREND: 35, DIP: 62, DIP_DIR: 125, STR_CODE: '17', PHOTO_ID: 'CH07-01' }),
      interval(1, 2, 'MS', 'Mica Schist', { SAMPLE_NO: 'AMB-C-0702', SAMPLE_TYPE: 'ROCK', MINERAL1: 'Biotite', ORE1: 'Galena', ORE2: 'Sphalerite', GRAIN: 'M', TEXTURE: 'Schistose', PHOTO_ID: 'CH07-02', DESCRIPTION1: 'Galena–sphalerite band, 30 cm.' }),
      interval(2, 3.2, 'MAR', 'Marble', { SAMPLE_NO: 'AMB-C-0703', SAMPLE_TYPE: 'ROCK', MINERAL1: 'Calcite', GRAIN: 'C', TEXTURE: 'Crystalline', PHOTO_ID: 'CH07-03' }),
    ],
    assay: [assay('AMB-C-0701', 'ROCK', 'ORD', '2026-10-11'), assay('AMB-C-0702', 'ROCK', 'ORD', '2026-10-11'), assay('AMB-C-0703', 'ROCK', 'ORD', '2026-10-11')],
  },
)

/* ---------- Soil: two grid lines on the Nagaur block, a few points at Ambaji ---------- */
const NGR_SOIL = ['L-04', 'L-05'].flatMap((line, li) =>
  Array.from({ length: 15 }, (_, i) => {
    const n = li * 15 + i + 1
    const sample = `NGR-S-${line.slice(2)}${String(i + 1).padStart(2, '0')}`
    const by = li ? 'Deepak Soni' : 'Sunil Yadav'
    const east = 375010 + i * 50
    const north = 3009020 + li * 100
    return rec(
      `FD-SS-2026-${String(n).padStart(3, '0')}`, 'soil-sampling', NGR, li ? '2026-10-01' : '2026-09-30', by,
      { location: `Line ${line}`, sampleOrBoreholeId: sample, coordinates: { latitude: `N ${north}`, longitude: `E ${east}`, elevation: '' } },
      {
        PROSPECT_ID: 'NGR-02', LINE_NO: line, LINE_SPACING: 100, SAMPLE_NUMBER: sample, SAMPLE_SPACING: 50, LEASTING: 1000 + i * 50, LNORTHING: 400 + li * 100, UTM_E: east, UTM_N: north,
        REGIME: i % 5 === 3 ? 'D' : 'R', SLOPE: '1', SETTING: 'EP', SOIL_TYPE: ['L', 'S', 'L', 'R'][i % 4], COLOUR: ['Brownish_Yellow', 'Light_Yellow', 'Reddish_Brown'][i % 3],
        SOIL_CONDITION: 'D', DEPTH_CM: 25 + (i % 3) * 5, OUTCROP: i % 4 === 0 ? 'Fl' : 'Gr', VEGETATION: i % 3 === 0 ? 'A' : 'D', CONTAMINATION: 'CN', ROCK_TYPE: 'Limestone',
        PERMIT: 'PL-NGR-02', BLOCK: 'Block B', COMMENTS: i % 5 === 3 ? 'Thin aeolian sand cover.' : '',
      },
      { assay: [assay(sample, 'SOIL', 'ORD', li ? '2026-10-01' : '2026-09-30')] },
    )
  }),
)

const AMB_SOIL = [
  ['AMB-S-1207', 282110, 2693240, 'T', 'Reddish_Brown', 'OW', 'CY', 'HS', 'E'],
  ['AMB-S-1208', 282160, 2693240, 'T', 'Reddish_Brown', '', 'CN', 'HS', 'E'],
  ['AMB-S-1209', 282210, 2693240, 'L', 'Brownish_Grey', '', 'CN', 'VS', 'R'],
].map(([sample, east, north, type, colour, mining, contamination, setting, regime], i) =>
  rec(
    `FD-SS-2026-${String(31 + i).padStart(3, '0')}`, 'soil-sampling', AMB, '2026-10-10', 'Ravi Gurjar',
    { location: 'Line L-12', sampleOrBoreholeId: sample, coordinates: { latitude: `N ${north}`, longitude: `E ${east}`, elevation: '' } },
    {
      PROSPECT_ID: 'AMB-01', LINE_NO: 'L-12', LINE_SPACING: 100, SAMPLE_NUMBER: sample, SAMPLE_SPACING: 50, UTM_E: east, UTM_N: north, REGIME: regime, SLOPE: '2', SETTING: setting,
      SOIL_TYPE: type, COLOUR: colour, SOIL_CONDITION: 'D', DEPTH_CM: 30, OUTCROP: 'Fl', VEGETATION: 'H', MINING_ACTIVITY: mining, CONTAMINATION: contamination, ROCK_TYPE: 'Mica Schist',
      PERMIT: 'PL-AMB-01', BLOCK: 'Block B', COMMENTS: mining === 'OW' ? 'Next to an old working; slag pieces around.' : '',
    },
    { assay: [assay(sample, 'SOIL', 'ORD', '2026-10-10')] },
    i === 2 ? 'Draft' : 'Submitted',
  ),
)

/* ---------- Stream sediment ---------- */
const STREAM = [
  ['FD-STR-2026-001', 'Pooja Meena', 'AMB-SS-031', 'Nala north of Kumbhariya', 281200, 2694850, '2', 4.5, 'M', 'FS', 'Greyish_Yellow', 2.5, 'SH'],
  ['FD-STR-2026-002', 'Ravi Gurjar', 'AMB-SS-032', 'Tributary below the old workings', 281640, 2693980, '1', 1.8, 'L', 'ST', 'Brownish_Grey', 2.2, 'GR'],
].map(([id, by, sample, location, east, north, order, width, flow, matrix, colour, weight, veg]) =>
  rec(
    id, 'stream-sediment', AMB, '2026-10-08', by,
    { location, sampleOrBoreholeId: sample, coordinates: { latitude: `N ${north}`, longitude: `E ${east}`, elevation: '' } },
    {
      PROSPECTID: 'AMB-01', LOCATION: location, DRAINAGE_BASIN: 'Sabarmati upper catchment', UTM_EASTING: east, UTM_NORTHING: north, SAMPLE_ID: sample, SIEVE_SIZE: '-80 mesh',
      DRAINAGE_ORDER: order, WIDTH_M: width, FLOW_ENERGY: flow, SEDIMENT_MATRIX: matrix, COLOUR: colour, WEIGHT_KG: weight, CONTAMINATION: 'CN', VEGETATION: veg, OUTCROP: 'Fl', ROCK_TYPE: 'Mica Schist',
      COMMENTS: 'Active channel sediment, composite of five points over 20 m.',
    },
    { assay: [assay(sample, 'STRM', 'ORD', '2026-10-08')] },
  ),
)

/* ---------- Core drilling: borehole AMB-BH-02 ---------- */
const COLLAR = rec(
  'FD-COL-2026-001', 'collar-survey', AMB, '2026-10-12', 'Imran Ali',
  { location: 'Prospect AMB-01', sampleOrBoreholeId: 'AMB-BH-02', coordinates: { latitude: 'N 2692905', longitude: 'E 281960', elevation: '' } },
  {
    PROSPECTID: 'AMB-01', BHID: 'AMB-BH-02', TYPE: 'DD', L_GRID: 'NS', LEASTING: 1500, LNORTHING: 800, SURVEY_METHOD: 'DGPS', RIG_ID: 'EPIROC201', UTM_EAST: 281960, UTM_NORTH: 2692905,
    AZIMUTH: 300, DIP: -60, TDEPTH: 150, DRILL_PARTNER: 'JSC', YEAR: 2026, DEPTH_PQ: 12, DEPTH_HQ: 150, DATE_START: '2026-10-12', COMMENTS: 'Planned to test the trench AMB-TR-03 sulphide zone at depth.',
  },
  {
    survey: [
      { SURVEY_DEPTH: 0, DIP: -60, AZIMUTH: 300, SURVEY_METHOD: 'REFLEX BORE', SURVEYOR: 'JSC', DATE: '2026-10-12', COMMENTS: 'Collar' },
      { SURVEY_DEPTH: 30, DIP: -59.5, AZIMUTH: 301.2, TMI: 48210, SURVEY_METHOD: 'REFLEX BORE', SURVEYOR: 'JSC', DATE: '2026-10-14' },
      { SURVEY_DEPTH: 60, DIP: -59.1, AZIMUTH: 302, TMI: 48195, SURVEY_METHOD: 'REFLEX BORE', SURVEYOR: 'JSC', DATE: '2026-10-17' },
      { SURVEY_DEPTH: 90, DIP: -58.6, AZIMUTH: 302.8, TMI: 48240, SURVEY_METHOD: 'REFLEX BORE', SURVEYOR: 'JSC', DATE: '2026-10-20' },
    ],
  },
)

const run = (FROM, TO, RECOVERY, RQD, FI, BOX_NO) => ({ CORE_SIZE: 'HQ', FROM, TO, RECOVERY, RQD, FI, BOX_NO })
const act = (ACTIVITY, TIME_START, TIME_END, REMARKS = '') => ({ ACTIVITY, TIME_START, TIME_END, REMARKS })
const dprFields = { PROSPECTID: 'AMB-01', BHID: 'AMB-BH-02', RIG_ID: 'EPIROC201', DRILL_PARTNER: 'JSC', SHIFT: 'DAY', DRILLER: 'Mohan Lal', DRILL_TYPE: 'DD', CORE_SIZE: 'HQ', WATER_TANKER: 2, ACCESSORIES: 'HQ triple-tube barrel, 3 m' }

const DPR = [
  rec(
    'FD-CDD-2026-001', 'core-drilling-dpr', AMB, '2026-10-19', 'Imran Ali',
    { location: 'Rig EPIROC201', sampleOrBoreholeId: 'AMB-BH-02' },
    { ...dprFields, COMMENTS: 'Smooth coring through the schist; survey shot at 90 m.' },
    {
      runs: [run(66, 69, 2.94, 2.5, 2, '22'), run(69, 72, 2.9, 2.35, 3, '23'), run(72, 75, 2.91, 2.4, 3, '24'), run(75, 78, 2.95, 2.55, 2, '25'), run(78, 81, 2.7, 1.8, 6, '26')],
      activity: [act('TBT', '07:00', '07:15', 'Toolbox talk'), act('PST', '07:15', '07:45', 'Rig and pump checks'), act('CR', '07:45', '12:30'), act('MAINT', '12:30', '13:15', 'Water swivel changed'), act('CR', '13:15', '18:15'), act('SURVEY', '18:15', '19:00', 'Reflex shot at 90 m')],
    },
  ),
  rec(
    'FD-CDD-2026-002', 'core-drilling-dpr', AMB, '2026-10-20', 'Imran Ali',
    { location: 'Rig EPIROC201', sampleOrBoreholeId: 'AMB-BH-02' },
    { ...dprFields, WATER_TANKER: 1, COMMENTS: 'Hose burst before noon; waited an hour for water in the afternoon.' },
    {
      runs: [run(81, 84, 2.88, 2.2, 4, '27'), run(84, 87, 2.6, 1.5, 8, '28'), run(87, 90, 2.97, 2.7, 1, '29')],
      activity: [act('TBT', '07:00', '07:15'), act('CR', '07:15', '10:30'), act('B/D', '10:30', '12:00', 'Hydraulic hose burst'), act('CR', '12:00', '15:00'), act('IDLE2', '15:00', '16:00', 'Waiting for water tanker'), act('CR', '16:00', '18:30')],
    },
  ),
]

const log = (FROM, TO, ROCK_CODE, ROCK_TYPE, extra) => ({ CORE_SIZE: 'HQ', FROM, TO, ROCK_CODE, ROCK_TYPE, ...extra })
const LOGGING = rec(
  'FD-DCL-2026-001', 'drill-core-logging', AMB, '2026-10-20', 'Imran Ali',
  { location: 'Prospect AMB-01', sampleOrBoreholeId: 'AMB-BH-02' },
  { PROSPECTID: 'AMB-01', BHID: 'AMB-BH-02', TYPE: 'DD', RIG_ID: 'EPIROC201', CORE_SIZE: 'HQ' },
  {
    logging: [
      log(66, 72.4, 'MS', 'Mica Schist', { COLOUR: 'Grey', GRAIN_SIZE: 'M', TEXTURE: 'Schistose', STRUCTURE: 'FOL', ALPHA: 45, BETA_THETA: 120, FRACTURE_TYPE: 'J', FRACTURE_SURFACE: 'PR', FRACTURE_SPACING: '3', FRACTURE_FILLING: 'q', BEDDING: 'N', FOLIATION: 'VISIBLE 1 SET', WEATHERING: '1', ROCK_FABRIC: 'SCH', CONTACT: 'Gradational', CONTACT_ANGLE: 40, VEINING: 'q', ALTERATION: 'CHLORITIC', MINERAL1: 'Biotite', MINERAL2: 'Muscovite', MINERAL3: 'Quartz', MINERAL4: 'Garnet', ORE1_MIN: 'Pyrite', ORE1_VE: '1', ORE1_TXT: 'DIS', DESCRIPTION1: 'Garnet mica schist, fresh; quartz veinlets parallel to S1.' }),
      log(72.4, 76.4, 'CS', 'Clac-Silicate', { COLOUR: 'Green', GRAIN_SIZE: 'F', TEXTURE: 'Granoblastic', STRUCTURE: 'BED', ALPHA: 50, FRACTURE_TYPE: 'B', FRACTURE_SURFACE: 'PS', FRACTURE_SPACING: '2', BEDDING: 'BND', WEATHERING: '1', ROCK_FABRIC: 'BND', CONTACT: 'Sharp', CONTACT_ANGLE: 48, VEINING: 'cal', ALTERATION: 'EPIDOTIC', MINERAL1: 'Diopside', MINERAL2: 'Tremolite', MINERAL3: 'Calcite', ORE1_MIN: 'Pyrite', ORE1_VE: '1', ORE1_TXT: 'PBN' }),
      log(76.4, 84.6, 'MS', 'Mica Schist', { COLOUR: 'Dark Grey', GRAIN_SIZE: 'FM', TEXTURE: 'Schistose', STRUCTURE: 'FOL', ALPHA: 42, BETA_THETA: 118, FRACTURE_TYPE: 'S', FRACTURE_SURFACE: 'UR', FRACTURE_SPACING: '2', FRACTURE_FILLING: 'chl', FOLIATION: 'VISIBLE MULTIPLE SET', FOLIATION1: 'BEDDING PARALLEL', WEATHERING: '1', ROCK_FABRIC: 'SCH', CONTACT: 'Sheared', CONTACT_ANGLE: 38, VEINING: 'q-cal', SHEAR_FABRIC1: 'SRTM', ALTERATION: 'SILICEOUS', MINERAL1: 'Biotite', MINERAL2: 'Quartz', MINERAL3: 'Chlorite', ORE1_MIN: 'Chalcopyrite', ORE1_VE: '3', ORE1_TXT: 'STR', ORE2_MIN: 'Pyrite', ORE2_VE: '2', ORE2_TXT: 'DIS', ORE3_MIN: 'Sphalerite', ORE3_VE: '1', ORE3_TXT: 'DIS', DESCRIPTION1: 'Sulphide zone: chalcopyrite stringers and pyrite along S1, sphalerite blebs; silicified.' }),
      log(84.6, 90, 'MAR', 'Marble', { COLOUR: 'White', GRAIN_SIZE: 'C', TEXTURE: 'Crystalline', STRUCTURE: 'BED', ALPHA: 55, FRACTURE_TYPE: 'J', FRACTURE_SURFACE: 'PS', FRACTURE_SPACING: '4', WEATHERING: '1', ROCK_FABRIC: 'MAS', VEINING: 'absent', MINERAL1: 'Calcite', MINERAL2: 'Phlogopite' }),
    ],
    sampling: [
      { CORE_SIZE: 'HQ', FROM: 79.8, TO: 80.8, SAMPLE_TYPE: 'HCR', SAMPLE_CAT: 'ORD' },
      { CORE_SIZE: 'HQ', FROM: 80.8, TO: 81.8, SAMPLE_TYPE: 'HCR', SAMPLE_CAT: 'ORD' },
      { CORE_SIZE: 'HQ', FROM: 81.8, TO: 82.8, SAMPLE_TYPE: 'HCR', SAMPLE_CAT: 'ORD' },
      { CORE_SIZE: 'HQ', FROM: 82.8, TO: 83.8, SAMPLE_TYPE: 'HCR', SAMPLE_CAT: 'ORD' },
      { CORE_SIZE: 'HQ', FROM: 83.8, TO: 84.6, SAMPLE_TYPE: 'HCR', SAMPLE_CAT: 'ORD' },
      { CORE_SIZE: 'HQ', FROM: 81.8, TO: 82.8, SAMPLE_TYPE: 'QCR', SAMPLE_CAT: 'FDUP', COMMENTS: 'Quarter-core duplicate of 81.8–82.8' },
    ],
    assay: [
      { SAMPLE_NUMBER: 'AMB-D-0201', SAMPLE_CAT: 'ORD', SAMPLE_TYPE: 'HCR', SPECIFIC_GRAVITY: 2.86, FROM: 79.8, TO: 80.8 },
      { SAMPLE_NUMBER: 'AMB-D-0202', SAMPLE_CAT: 'ORD', SAMPLE_TYPE: 'HCR', SPECIFIC_GRAVITY: 2.92, FROM: 80.8, TO: 81.8 },
      { SAMPLE_NUMBER: 'AMB-D-0203', SAMPLE_CAT: 'ORD', SAMPLE_TYPE: 'HCR', SPECIFIC_GRAVITY: 3.05, FROM: 81.8, TO: 82.8 },
      { SAMPLE_NUMBER: 'AMB-D-0204', SAMPLE_CAT: 'ORD', SAMPLE_TYPE: 'HCR', SPECIFIC_GRAVITY: 2.98, FROM: 82.8, TO: 83.8 },
      { SAMPLE_NUMBER: 'AMB-D-0205', SAMPLE_CAT: 'ORD', SAMPLE_TYPE: 'HCR', SPECIFIC_GRAVITY: 2.88, FROM: 83.8, TO: 84.6 },
      { SAMPLE_NUMBER: 'AMB-D-0206', SAMPLE_CAT: 'FDUP', SAMPLE_TYPE: 'QCR', SPECIFIC_GRAVITY: 3.04, FROM: 81.8, TO: 82.8, ORIGINAL_SAMPLE_NUMBER: 'AMB-D-0203' },
    ],
  },
)

/* ---------- Sample dispatch: earlier core batches with their results, then two recent ones ---------- */
const lab = { LAB: 'SAIPL', LAB_ADDRESS: 'Bengaluru, Karnataka', LAB_OWNER: 'Sample receipt desk', BATCH_OWNER: 'Dr. Sunita Meena', SENDER_CONTACT: '0141-2783370', SENDER_MAIL: 'field@bansalgeo.com', SENDER_ADDRESS: 'Bansal Geo Solutions, Mansarovar, Jaipur' }
const BASE_METALS = 'Cu, Pb, Zn, Ni, Co, Mo, Sn, W, As, Sb, Bi, Hg, Tl, Re, Te, Se, Ag, Cd, Ba, Si, C, Mn, Mg, Na, K'

/* A fixed sequence of "random" numbers, so the demo reads the same every time. */
function sequence(seed) {
  let a = seed
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/*
 * What the lab sent back for a batch: grades for the core, near nothing for the blanks, a duplicate
 * close to its original, a CRM near its certified value. `dupOff` puts one pulp duplicate outside
 * the client's 95–105 %.
 */
function labResults(samples, seed, { dupOff = 0 } = {}) {
  const rnd = sequence(seed)
  const between = (lo, hi) => lo + rnd() * (hi - lo)
  const out = {}
  let pulpDups = 0
  samples.forEach((s) => {
    if (s.QC === 'Ordinary') out[s.SAMPLE_NUMBER] = { Zn: Math.round(between(350, 2900)), Pb: Math.round(between(180, 1400)), Ag: Math.round(between(5, 24) * 10) / 10 }
    else if (s.QC === 'Rock blank' || s.QC === 'Pulp blank') out[s.SAMPLE_NUMBER] = { Zn: Math.round(between(1, 7)), Pb: Math.round(between(1, 7)), Ag: Math.round(between(0.5, 2)) || 1 }
    else if (s.QC === 'CRM') {
      const cert = CRM_DEFAULTS[s.REFERENCE]
      out[s.SAMPLE_NUMBER] = Object.fromEntries(Object.entries(cert).map(([e, c]) => [e, Math.round((c.value + between(-1.4, 1.4) * c.sd) * 10) / 10]))
    } else {
      const original = out[s.REFERENCE]
      if (s.QC === 'Pulp duplicate') pulpDups += 1
      const off = s.QC === 'Pulp duplicate' && pulpDups === dupOff ? 1.12 : 1
      out[s.SAMPLE_NUMBER] = { Zn: Math.round(original.Zn * between(0.98, 1.02) * off), Pb: Math.round(original.Pb * between(0.98, 1.02)), Ag: Math.round(original.Ag * between(0.99, 1.01) * 10) / 10 }
    }
  })
  return out
}

/* A batch record; the lab status is the one entered for it, as the user sets it after the results. */
function batchRecord(id, project, date, by, fields, samples, { results, received, resultsOn, status } = {}) {
  const record = rec(id, 'dispatch-database', project, date, by, { location: `Lab: ${fields.LAB || lab.LAB}`, sampleOrBoreholeId: fields.BATCH_ID }, { ...lab, SAMPLE_PREPARATION: 'Y', ...fields, LAB_RECEIVED: received || '' }, { samples })
  if (!results) return { ...record, data: { ...record.data, fields: { ...record.data.fields, STATUS: received ? 'Received' : 'Pending' } } }
  record.data.results = results
  record.data.fields = { ...record.data.fields, RESULT_RECEIVED: resultsOn, RESULT_COUNT: batchQaqc(record).withResult, STATUS: status }
  return record
}

// Half-core samples of the first borehole, AMB-BH-01 (the logging record above is AMB-BH-02's).
/* The box each tube went in, as the sender wrote it on the batch: twenty to a box. */
const boxed = (samples) => samples.map((s, i) => ({ ...s, BOX_NO: String(Math.floor(i / 20) + 1) }))

const coreNumbers = (from, count) => Array.from({ length: count }, (_, i) => ({ number: `AMB-D1-${String(from + i).padStart(3, '0')}`, type: 'HCR', recordId: '' }))

let ambNext = 1
const ambBatch = (ordinary, opts) => {
  const samples = boxed(buildBatch(ordinary, { projectCode: AMB.projectId, start: ambNext, ...opts }))
  ambNext += samples.length
  return samples
}

const CORE_BATCHES = [
  ['FD-DISP-2026-003', '2026-08-18', 'B2026-001', 1, 26, 'GBM 326-6', '22F', {}, '2026-08-21', '2026-09-01', 'QAQC passes'],
  ['FD-DISP-2026-004', '2026-08-29', 'B2026-002', 27, 30, 'GBM924-4', '22F', {}, '2026-09-01', '2026-09-11', 'QAQC passes'],
  ['FD-DISP-2026-005', '2026-09-09', 'B2026-003', 57, 28, 'GBM 326-6', '22G', { dupOff: 1 }, '2026-09-12', '2026-09-23', 'QAQC Failed'],
  ['FD-DISP-2026-006', '2026-09-22', 'B2026-004', 85, 32, 'GBM924-4', '22G', {}, '2026-09-25', '2026-10-06', 'QAQC passes'],
].map(([id, date, batchId, from, count, crm, pulpBlank, odd, received, resultsOn, status], i) => {
  const samples = ambBatch(coreNumbers(from, count), { crm, pulpBlank, rockBlank: 'Granite blank' })
  return batchRecord(
    id, AMB, date, 'Ravi Gurjar',
    { BATCH_ID: batchId, ELEMENTS1: BASE_METALS, COURIER: 'DTDC', TRACKING_NO: `D7260${4417 + i * 113}`, PULP_RETURN: 'Y', DATA_TYPE: 'CORE DRILL', CRM: crm, PULP_BLANK: pulpBlank, ROCK_BLANK: 'Granite blank' },
    samples,
    { results: labResults(samples, 11 + i, odd), received, resultsOn, status },
  )
})

const soilNumbers = NGR_SOIL.map((r) => ({ number: r.data.fields.SAMPLE_NUMBER, type: 'SOIL', recordId: r.id }))
const trenchNumbers = TRENCH.data.rows.intervals.map((r) => ({ number: r.SAMPLE_NO, type: 'ROCK', recordId: TRENCH.id }))

const DISPATCH = [
  ...CORE_BATCHES,
  batchRecord(
    'FD-DISP-2026-001', NGR, '2026-10-03', 'Sunil Yadav',
    { BATCH_ID: 'B2026-005', ELEMENTS1: 'Oxides: SiO2, Al2O3, Cao, MgO, K2O, Na2O, TiO2, MnO', COURIER: 'DTDC', TRACKING_NO: 'D72814490', PULP_RETURN: 'Y', DATA_TYPE: 'SOIL', CRM: 'GBM 906-11', PULP_BLANK: '22F', ROCK_BLANK: 'Quartz sand blank' },
    boxed(buildBatch(soilNumbers, { crm: 'GBM 906-11', pulpBlank: '22F', rockBlank: 'Quartz sand blank', projectCode: NGR.projectId })),
    { received: '2026-10-06' },
  ),
  batchRecord(
    'FD-DISP-2026-002', AMB, '2026-10-14', 'Ravi Gurjar',
    { BATCH_ID: 'B2026-006', ELEMENTS1: BASE_METALS, ELEMENTS2: 'Au', COURIER: 'DTDC', TRACKING_NO: 'D72861357', PULP_RETURN: 'N', DATA_TYPE: 'TRENCHING', CRM: 'GBM924-4', PULP_BLANK: '22G', ROCK_BLANK: 'Granite blank' },
    ambBatch(trenchNumbers, { crm: 'GBM924-4', pulpBlank: '22G', rockBlank: 'Granite blank' }),
    { received: '2026-10-17' },
  ),
]

export const FORMAT_SEED_RECORDS = [...MAPPING, TRENCH, CHANNEL, ...NGR_SOIL, ...AMB_SOIL, ...STREAM, COLLAR, ...DPR, LOGGING, ...DISPATCH]
