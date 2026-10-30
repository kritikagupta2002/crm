import { FIELD_CODES } from './fieldCodes'

/*
 * The client's field formats (M/s Bansal Geo Solutions Pvt Ltd), one per Field Database section.
 *
 * A field is { id, col, label, type, list, group, ... }:
 *   id    — the key the value is saved under (record.data.fields[id], or a table row's [id])
 *   col   — the column header exactly as it is in the client's sheet (spelling kept), used on download
 *   type  — text | number | date | time | code (pick a code) | desc (pick a description) | textarea
 *   list  — the FIELD_CODES list a code / desc field picks from
 *   bind  — project | geologist | date: comes from the record itself, so it is not asked again
 *   inherit — in a table: the value comes from the header field with the same id
 *   fill  — picking a code also fills these fields with its description (ROCK_CODE → ROCK_TYPE)
 *   calc  — worked out from the other values of the row, e.g. INTERVAL = TO − FROM
 *
 * header  — asked once per record. tables — repeating rows (intervals, runs, assay samples).
 * sheets  — the workbook the Download button builds, sheet by sheet and column by column as the
 *           client's file has it. rows: 'record' gives one line per record, a table key one line per row;
 *           withHeader puts the header columns first on every row (trench and channel sheets).
 *           A column is a header of the client's sheet, or [header, field id or '@total'] when they differ.
 */

const f = (id, o = {}) => ({ id, col: id, type: 'text', ...o })
const num = (id, o = {}) => f(id, { type: 'number', ...o })
const code = (id, list, o = {}) => f(id, { type: 'code', list, ...o })
const desc = (id, list, o = {}) => f(id, { type: 'desc', list, ...o })
const bind = (id, to, o = {}) => f(id, { bind: to, ...o })

const round = (v, dp = 2) => (Number.isFinite(v) ? Number(v.toFixed(dp)) : '')
const n = (v) => (v === '' || v == null ? NaN : Number(v))
const diff = (r) => round(n(r.TO) - n(r.FROM))
const pct = (part, whole) => (n(whole) > 0 ? round((n(part) / n(whole)) * 100, 1) : '')

const rockCode = (o = {}) => code('ROCK_CODE', 'ROCK_CODE', { label: 'Rock code', fill: { ROCK_TYPE: 'desc' }, group: 'Rock', ...o })
const rockType = (o = {}) => desc('ROCK_TYPE', 'ROCK_CODE', { label: 'Rock type', group: 'Rock', ...o })
const synRock = (o = {}) => desc('SYN_ROCK', 'ROCK_CODE', { label: 'Synonym rock', group: 'Rock', ...o })
const minerals = (prefix, count, group = 'Minerals') =>
  Array.from({ length: count }, (_, i) => f(`${prefix}${i + 1}`, { label: `Mineral ${i + 1}`, group }))
const ores = (ids, group = 'Minerals') => ids.map((id, i) => f(id, { label: `Ore ${i + 1}`, group }))

const assayCols = (prospect) => [
  ...(prospect ? [prospect] : []),
  bind('PROJECT_NAME', 'project'),
  f('SAMPLE_NUMBER', { label: 'Sample number', key: true }),
  code('SAMPLE_CAT', 'SAMPLE_CAT', { label: 'Category' }),
  code('SAMPLE_TYPE', 'SAMPLE_TYPE', { label: 'Sample type' }),
  f('DATE', { label: 'Date', type: 'date', defaultFrom: 'date' }),
  f('ORIGINAL_SAMPLE_NUMBER', { label: 'Original sample no. (for duplicates)' }),
]
const assayTable = (prospect) => ({ key: 'assay', title: 'ASSAY', sheet: 'ASSAY', add: 'Add row', columns: assayCols(prospect) })

/* ---------- Geological Mapping ---------- */
const MAPPING = {
  workbook: 'Geological Mapping',
  codesSheet: 'CODES',
  codesGroup: 'MAPPING',
  header: [
    f('PROSPECTID', { label: 'Prospect ID', group: 'Station & sample' }),
    bind('PROJECT_NAME', 'project'),
    f('M_ST', { label: 'Mapping station (M_ST)', group: 'Station & sample' }),
    code('ST_TYPE', 'ST_TYPE', { label: 'Station type', group: 'Station & sample' }),
    f('SAMPLE_NUMBER', { label: 'Sample number', group: 'Station & sample', sample: true }),
    code('SAMPLE_TYPE', 'SAMPLE_TYPE', { label: 'Sample type', group: 'Station & sample' }),
    num('UTM_N_WGS84', { label: 'UTM North (WGS84)', group: 'Coordinates' }),
    num('UTM_E_WGS84', { label: 'UTM East (WGS84)', group: 'Coordinates' }),
    num('LOCAL_N', { label: 'Local North', group: 'Coordinates' }),
    num('LOCAL_E', { label: 'Local East', group: 'Coordinates' }),
    rockCode({ fill: { ROCK_TYPE: 'desc' } }),
    rockType(),
    synRock(),
    code('COLOUR', 'COLOUR', { label: 'Colour', group: 'Rock' }),
    code('GRAIN_SIZE', 'GRAIN_SIZE', { col: 'GRAIN SIZE', label: 'Grain size', group: 'Rock' }),
    code('TEXTURE', 'TEXTURE', { label: 'Texture', group: 'Rock' }),
    f('ROCK_FAB', { label: 'Rock fabric', group: 'Rock' }),
    f('SH_FAB', { label: 'Shear fabric', group: 'Rock' }),
    f('ROCK_AS1', { label: 'Rock association 1', group: 'Rock' }),
    f('ROCK_AS2', { label: 'Rock association 2', group: 'Rock' }),
    ...['Mineral1', 'Mineral2', 'Mineral3', 'Mineral4', 'Mineral5'].map((id, i) => f(id, { label: `Mineral ${i + 1}`, group: 'Minerals' })),
    f('Ore 1', { label: 'Ore 1', group: 'Minerals' }),
    f('Ore 2', { label: 'Ore 2', group: 'Minerals' }),
    f('Other', { label: 'Other', group: 'Minerals' }),
    num('MAG_SI', { label: 'Magnetic susceptibility', group: 'Minerals' }),
    f('FOLIATION', { label: 'Foliation', group: 'Structure' }),
    f('BEDDING', { label: 'Bedding', group: 'Structure' }),
    f('FOLD_AXIS', { label: 'Fold axis', group: 'Structure' }),
    f('LINEATION', { label: 'Lineation', group: 'Structure' }),
    num('TREND', { label: 'Trend', group: 'Structure' }),
    num('DIP', { label: 'Dip', group: 'Structure' }),
    num('DIPDIRECTION', { label: 'Dip direction', group: 'Structure' }),
    code('STR_CODE', 'STR_CODE', { label: 'Structure code', group: 'Structure' }),
    f('QZ_VN', { label: 'Quartz vein', group: 'Structure' }),
    f('QZ_STR', { label: 'Quartz structure', group: 'Structure' }),
    f('LOCATION', { label: 'Location', group: 'Station & sample' }),
    f('DESCRIPTION1', { label: 'Description 1', type: 'textarea', group: 'Description' }),
    f('DESCRIPTION2', { label: 'Description 2', type: 'textarea', group: 'Description' }),
    bind('GEOLOGIST', 'geologist'),
    bind('RECORD_DATE', 'date'),
  ],
  tables: [assayTable(f('PROSPECTID', { inherit: true }))],
  summary: { id: 'M_ST', location: 'LOCATION', north: 'UTM_N_WGS84', east: 'UTM_E_WGS84', rock: 'ROCK_TYPE' },
  listColumns: [['M_ST', 'Station'], ['SAMPLE_NUMBER', 'Sample'], ['ROCK_TYPE', 'Rock'], ['STR_CODE', 'Str. code']],
  sheets: [
    { name: 'GEOLOGICAL MAPPING', rows: 'record' },
    { name: 'ASSAY', rows: 'assay' },
  ],
}

/* ---------- Trench Mapping ---------- */
const intervalCore = (sampleCol, sampleTypeCol = 'SAMPLE_TYPE') => ({
  from: num('FROM', { label: 'From (m)' }),
  to: num('TO', { label: 'To (m)' }),
  interval: num('INTERVAL', { label: 'Interval (m)', calc: diff }),
  sample: f('SAMPLE_NO', { col: sampleCol, label: 'Sample no.', sample: true }),
  sampleType: code('SAMPLE_TYPE', 'SAMPLE_TYPE', { col: sampleTypeCol, label: 'Sample type' }),
})

const tr = intervalCore('SAMPLE NO')
const TRENCH = {
  workbook: 'Trench_Mapping_and_Sampling',
  codesSheet: 'CODE',
  codesGroup: 'TRENCH',
  header: [
    bind('PROJECT_NAME', 'project', { col: 'PROJECT NAME' }),
    f('TRENCH_ID', { col: 'TRENCH ID', label: 'Trench ID', group: 'Trench' }),
    f('LOCATION', { label: 'Location', group: 'Trench' }),
    num('TRENCH_AZM', { label: 'Azimuth', group: 'Trench' }),
    num('LENGTH', { label: 'Length (m)', group: 'Trench' }),
    num('WIDTH', { label: 'Width (m)', group: 'Trench' }),
    num('DEPTH', { label: 'Depth (m)', group: 'Trench' }),
    num('START_LONG', { label: 'Start longitude', group: 'Trench' }),
    num('START_LATT', { label: 'Start latitude', group: 'Trench' }),
  ],
  tables: [
    {
      key: 'intervals',
      title: 'TRENCH MAPPING',
      sheet: 'TRENCH MAPPING',
      add: 'Add row',
      continues: true,
      columns: [
        tr.from, tr.to, tr.interval,
        rockCode(), rockType(), synRock(),
        ...minerals('MINERAL', 5),
        ...ores(['ORE1', 'ORE2', 'ORE3']),
        num('TREND', { label: 'Trend', group: 'Structure' }),
        num('DIP', { label: 'Dip', group: 'Structure' }),
        num('DIP_DIR', { col: 'DIP DIR', label: 'Dip direction', group: 'Structure' }),
        code('STR_CODE', 'STR_CODE', { label: 'Structure code', group: 'Structure' }),
        code('GRAIN', 'GRAIN_SIZE', { label: 'Grain', group: 'Rock' }),
        code('TEXTURE', 'TEXTURE', { label: 'Texture', group: 'Rock' }),
        bind('RECORD_DATE', 'date', { col: 'RECORD DATE' }),
        { ...tr.sampleType, group: 'Sample' },
        code('SAMPLE_CAT', 'SAMPLE_CAT', { label: 'Sample category', group: 'Sample' }),
        { ...tr.sample, group: 'Sample' },
        bind('GEOLOGIST', 'geologist'),
        f('DESCRIPTION1', { label: 'Description 1', type: 'textarea', group: 'Description' }),
        f('DESCRIPTION2', { label: 'Description 2', type: 'textarea', group: 'Description' }),
      ],
    },
    assayTable(null),
  ],
  summary: { id: 'TRENCH_ID', location: 'LOCATION', north: 'START_LATT', east: 'START_LONG', geographic: true },
  listColumns: [['TRENCH_ID', 'Trench'], ['@intervals', 'Intervals'], ['@metres', 'Logged (m)'], ['@samples', 'Samples']],
  sheets: [
    { name: 'TRENCH MAPPING', rows: 'intervals', withHeader: true },
    { name: 'ASSAY', rows: 'assay' },
  ],
}

/* ---------- Channel Sampling ---------- */
const ch = intervalCore('SAMPLE NO', 'SAMLE TYPE')
const CHANNEL = {
  workbook: 'Channel sampling',
  codesSheet: 'CODES',
  codesGroup: 'CHANNEL',
  header: [
    bind('PROJECT_NAME', 'project', { col: 'PROJECT NAME' }),
    f('CHANNEL_ID', { col: 'CHANNEL ID', label: 'Channel ID', group: 'Channel' }),
    f('LOCATION', { label: 'Location', group: 'Channel' }),
    num('WIDTH', { label: 'Width (m)', group: 'Channel' }),
    num('DEPTH', { label: 'Depth (m)', group: 'Channel' }),
    num('AZM', { label: 'Azimuth', group: 'Channel' }),
    num('CH_DIP', { col: 'DIP', label: 'Dip', group: 'Channel' }),
    num('LONGITUDE', { label: 'Longitude', group: 'Channel' }),
    num('LATTITUDE', { label: 'Latitude', group: 'Channel' }),
  ],
  tables: [
    {
      key: 'intervals',
      title: 'CHANNEL SAMPLING',
      sheet: 'CHANNEL SAMPLING',
      add: 'Add row',
      continues: true,
      columns: [
        ch.from, ch.to, ch.interval,
        rockCode(), rockType(), synRock(),
        { ...ch.sample, group: 'Sample' },
        { ...ch.sampleType, group: 'Sample' },
        // The client's sheet has one column headed MINERAL2MINERAL3, kept as they have it.
        f('MINERAL1', { label: 'Mineral 1', group: 'Minerals' }),
        f('MINERAL2MINERAL3', { label: 'Mineral 2 / 3', group: 'Minerals' }),
        f('MINERAL4', { label: 'Mineral 4', group: 'Minerals' }),
        f('MINERAL5', { label: 'Mineral 5', group: 'Minerals' }),
        ...ores(['ORE1', 'ORE2']),
        code('GRAIN', 'GRAIN_SIZE', { label: 'Grain', group: 'Rock' }),
        code('TEXTURE', 'TEXTURE', { label: 'Texture', group: 'Rock' }),
        num('TREND', { label: 'Trend', group: 'Structure' }),
        num('DIP', { label: 'Dip', group: 'Structure' }),
        num('DIP_DIR', { col: 'DIP DIR', label: 'Dip direction', group: 'Structure' }),
        code('STR_CODE', 'STR_CODE', { label: 'Structure code', group: 'Structure' }),
        f('PHOTO_ID', { col: 'PHTO_ID', label: 'Photo ID', group: 'Sample' }),
        f('DESCRIPTION1', { label: 'Description 1', type: 'textarea', group: 'Description' }),
        f('DESCRIPTION2', { label: 'Description 2', type: 'textarea', group: 'Description' }),
        bind('GEOLOGIST', 'geologist'),
        bind('RECORD_DATE', 'date', { col: 'RECORD DATE' }),
      ],
    },
    assayTable(null),
  ],
  summary: { id: 'CHANNEL_ID', location: 'LOCATION', north: 'LATTITUDE', east: 'LONGITUDE', geographic: true },
  listColumns: [['CHANNEL_ID', 'Channel'], ['@intervals', 'Intervals'], ['@metres', 'Length (m)'], ['@samples', 'Samples']],
  sheets: [
    { name: 'CHANNEL SAMPLING', rows: 'intervals', withHeader: true },
    { name: 'ASSAY', rows: 'assay' },
  ],
}

/* ---------- Soil Sampling ---------- */
const SOIL = {
  workbook: 'SOIL SAMPLING',
  codesSheet: 'CODES',
  codesGroup: 'SOIL',
  header: [
    f('PROSPECT_ID', { col: 'PROSPECT ID', label: 'Prospect ID', group: 'Grid & sample' }),
    bind('PROJECT_NAME', 'project', { col: 'PROJECT _NAME' }),
    f('LINE_NO', { label: 'Line no.', group: 'Grid & sample' }),
    num('LINE_SPACING', { label: 'Line spacing (m)', group: 'Grid & sample' }),
    f('SAMPLE_NUMBER', { label: 'Sample number', group: 'Grid & sample', sample: true }),
    num('SAMPLE_SPACING', { label: 'Sample spacing (m)', group: 'Grid & sample' }),
    num('LEASTING', { label: 'Local easting', group: 'Coordinates' }),
    num('LNORTHING', { label: 'Local northing', group: 'Coordinates' }),
    num('UTM_E', { label: 'UTM East', group: 'Coordinates' }),
    num('UTM_N', { label: 'UTM North', group: 'Coordinates' }),
    code('REGIME', 'REGIME', { label: 'Regime', group: 'Setting' }),
    code('SLOPE', 'SLOPE', { label: 'Slope', group: 'Setting' }),
    code('SETTING', 'SETTING', { label: 'Setting', group: 'Setting' }),
    code('SOIL_TYPE', 'SOIL_TYPE', { label: 'Soil type', group: 'Soil' }),
    code('COLOUR', 'COLOUR_SOIL', { label: 'Colour', group: 'Soil' }),
    code('SOIL_CONDITION', 'SOIL_CONDITION', { label: 'Soil condition', group: 'Soil' }),
    num('DEPTH_CM', { col: 'DETH_CM', label: 'Depth (cm)', group: 'Soil' }),
    code('OUTCROP', 'OUTCROP', { label: 'Outcrop', group: 'Setting' }),
    code('VEGETATION', 'VEGETATION', { label: 'Vegetation', group: 'Setting' }),
    code('MINING_ACTIVITY', 'MINING_ACTIVITY', { label: 'Mining activity', group: 'Setting' }),
    code('CONTAMINATION', 'CONTAMINATION', { label: 'Contamination', group: 'Setting' }),
    desc('ROCK_TYPE', 'ROCK_CODE', { label: 'Rock type', group: 'Soil' }),
    bind('GEOLOGIST', 'geologist'),
    f('PERMIT', { label: 'Permit', group: 'Grid & sample' }),
    f('BLOCK', { label: 'Block', group: 'Grid & sample' }),
    bind('DATE', 'date'),
    f('COMMENTS', { label: 'Comments', type: 'textarea', group: 'Comments' }),
  ],
  tables: [assayTable(f('PROSPECT_ID', { col: 'PROSPECT ID', inherit: true }))],
  summary: { id: 'SAMPLE_NUMBER', location: 'LINE_NO', locationPrefix: 'Line ', north: 'UTM_N', east: 'UTM_E' },
  listColumns: [['SAMPLE_NUMBER', 'Sample'], ['LINE_NO', 'Line'], ['SOIL_TYPE', 'Soil'], ['DEPTH_CM', 'Depth (cm)']],
  sheets: [
    // The client's sheet has the title on row 1 and the headers on row 3.
    { name: 'SOIL SAMPLING', rows: 'record', title: 'SOIL SAMPLING FORMAT' },
    { name: 'ASSAY', rows: 'assay' },
  ],
}

/* ---------- Stream Sediment Sampling ---------- */
const STREAM = {
  workbook: 'STREM SEDIMENT SAMPLING',
  codesSheet: 'CODE',
  codesGroup: 'STREAM',
  header: [
    f('PROSPECTID', { label: 'Prospect ID', group: 'Sample point' }),
    bind('PROJECT_NAME', 'project', { col: 'PROJECT  NAME' }),
    f('LOCATION', { label: 'Location', group: 'Sample point' }),
    f('DRAINAGE_BASIN', { col: 'DARAINAGE_BASIN', label: 'Drainage basin', group: 'Sample point' }),
    num('L_EASTING', { label: 'Local easting', group: 'Coordinates' }),
    num('L_NORTHING', { label: 'Local northing', group: 'Coordinates' }),
    num('UTM_EASTING', { label: 'UTM easting', group: 'Coordinates' }),
    num('UTM_NORTHING', { label: 'UTM northing', group: 'Coordinates' }),
    f('SAMPLE_ID', { col: 'SAMPLE ID', label: 'Sample ID', group: 'Sample point', sample: true }),
    f('SIEVE_SIZE', { col: 'SEIVE_SIZE', label: 'Sieve size', group: 'Sediment' }),
    code('DRAINAGE_ORDER', 'DRAINAGE_ORDER', { label: 'Drainage order', group: 'Stream' }),
    num('WIDTH_M', { col: 'WIDTH (M)', label: 'Width (m)', group: 'Stream' }),
    code('FLOW_ENERGY', 'FLOW_ENERGY', { label: 'Flow energy', group: 'Stream' }),
    code('SEDIMENT_MATRIX', 'SEDIMENT_MATRIX', { label: 'Sediment matrix', group: 'Sediment' }),
    code('COLOUR', 'COLOUR_SOIL', { label: 'Colour', group: 'Sediment' }),
    num('WEIGHT_KG', { col: 'WEIGHT(KG)', label: 'Weight (kg)', group: 'Sediment' }),
    code('CONTAMINATION', 'CONTAMINATION', { label: 'Contamination', group: 'Stream' }),
    code('VEGETATION', 'VEGETATION_STREAM', { label: 'Vegetation', group: 'Stream' }),
    code('OUTCROP', 'OUTCROP', { label: 'Outcrop', group: 'Stream' }),
    desc('ROCK_TYPE', 'ROCK_CODE', { label: 'Rock type', group: 'Sediment' }),
    f('COMMENTS', { label: 'Comments', type: 'textarea', group: 'Comments' }),
    bind('GEOLOGIST', 'geologist'),
    bind('RECORD_DATE', 'date', { col: 'RECORD DATE' }),
  ],
  tables: [assayTable(f('PROSPECTID', { col: 'PROSPECT ID', inherit: true }))],
  summary: { id: 'SAMPLE_ID', location: 'LOCATION', north: 'UTM_NORTHING', east: 'UTM_EASTING' },
  listColumns: [['SAMPLE_ID', 'Sample'], ['DRAINAGE_BASIN', 'Basin'], ['DRAINAGE_ORDER', 'Order'], ['WEIGHT_KG', 'Weight (kg)']],
  sheets: [
    { name: 'STREAM SEDIMENT', rows: 'record' },
    { name: 'ASSAY', rows: 'assay' },
  ],
}

/* ---------- Core drilling: one workbook, three sections linked by BHID ---------- */
const drillHeader = () => [
  f('PROSPECTID', { label: 'Prospect ID', group: 'Borehole' }),
  bind('PROJECT_NAME', 'project', { col: 'PROJECT NAME' }),
  f('BHID', { label: 'BHID (borehole ID)', group: 'Borehole' }),
]

const DPR = {
  workbook: 'CORE DRILL_LOG_SAMPLE',
  codesSheet: 'CODE',
  codesGroup: 'DRILL DPR',
  header: [
    ...drillHeader(),
    bind('DATE', 'date'),
    code('RIG_ID', 'RIG_ID', { col: 'RIG ID', label: 'Rig ID', group: 'Rig & shift' }),
    code('DRILL_PARTNER', 'DRILL_PARTNER', { col: 'DRILL PARTNER', label: 'Drill partner', group: 'Rig & shift' }),
    code('TYPE', 'TYPE', { label: 'Drill type', group: 'Borehole' }), // on the client's CORE DRILLING form
    code('SHIFT', 'SHIFT', { label: 'Shift', group: 'Rig & shift' }),
    f('DRILLER', { label: 'Driller', group: 'Rig & shift' }),
    bind('GEOLOGIST', 'geologist'),
    code('DRILL_TYPE', 'DRILL_TYPE', { label: 'Drill type', group: 'Borehole' }),
    code('CORE_SIZE', 'CORE_SIZE', { col: 'CORE SIZE', label: 'Core size', group: 'Borehole' }),
    num('WATER_TANKER', { col: 'WATER TANKER (NOS)', label: 'Water tankers (nos)', group: 'Rig & shift' }),
    f('ACCESSORIES', { col: 'ACCESSORIES USED', label: 'Accessories used', group: 'Rig & shift' }),
    f('COMMENTS', { label: 'Comments', type: 'textarea', group: 'Comments' }),
  ],
  tables: [
    {
      key: 'runs',
      title: 'CORE DRILLING',
      sheet: 'CORE DRILLING',
      add: 'Add row',
      continues: true,
      columns: [
        f('BHID', { inherit: true }),
        code('CORE_SIZE', 'CORE_SIZE', { col: 'CORE SIZE', label: 'Core size', defaultFrom: 'CORE_SIZE' }),
        num('FROM', { label: 'From (m)' }),
        num('TO', { label: 'To (m)' }),
        num('RUN_LENGTH', { col: 'RUN LENGTH (M)', label: 'Run length (m)', calc: diff }),
        num('RECOVERY', { col: 'RECOVERY (M)', label: 'Recovery (m)' }),
        num('REC_PCT', { col: 'REC(%)', label: 'Recovery %', calc: (r) => pct(r.RECOVERY, diff(r)) }),
        num('RQD', { col: 'RQD (M)', label: 'RQD (m)' }),
        num('RQD_PCT', { col: 'RQD(%)', label: 'RQD %', calc: (r) => pct(r.RQD, diff(r)) }),
        num('FI', { label: 'Fracture index (FI)' }),
        f('BOX_NO', { col: 'BOX NO', label: 'Box no.' }),
      ],
    },
    {
      key: 'activity',
      title: 'Activity',
      sheet: 'DRILL DPR',
      add: 'Add row',
      columns: [
        f('BHID', { inherit: true }),
        f('SHIFT', { inherit: true }),
        code('ACTIVITY', 'ACTIVITY', { col: 'Activity', label: 'Activity' }),
        f('TIME_START', { col: 'TIME START', label: 'Start', type: 'time' }),
        f('TIME_END', { col: 'TIME END', label: 'End', type: 'time' }),
        f('REMARKS', { label: 'Remarks' }),
      ],
    },
  ],
  summary: { id: 'BHID', location: 'RIG_ID', locationPrefix: 'Rig ' },
  listColumns: [['BHID', 'BHID'], ['RIG_ID', 'Rig'], ['SHIFT', 'Shift'], ['@metres', 'Drilled (m)'], ['@recovery', 'Recovery']],
  sheets: [
    {
      name: 'DRILL DPR',
      rows: 'record',
      columns: [
        'PROSPECTID', 'PROJECT NAME', 'DATE', 'RIG ID', 'DRILL PARTNER', 'SHIFT', 'DRILLER', 'GEOLOGIST', 'BHID', 'DRILL_TYPE', 'CORE SIZE',
        ['BOX NO', '@boxes'], ['FROM', '@from'], ['TO', '@to'], ['RUN LENGTH (M)', '@metres'], ['RECOVERY (M)', '@recovered'], ['RQD (M)', '@rqd'], ['FI', '@fi'],
        'WATER TANKER (NOS)', 'ACCESSORIES USED',
      ],
    },
    { name: 'CORE DRILLING', rows: 'runs', columns: ['BHID', 'CORE SIZE', 'FROM', 'TO', 'RUN LENGTH (M)', 'RECOVERY (M)', 'REC(%)', 'RQD (M)', 'RQD(%)', 'FI', 'BOX NO'] },
  ],
}

const COLLAR = {
  workbook: 'CORE DRILL_LOG_SAMPLE',
  codesSheet: 'CODE',
  codesGroup: 'COLLAR',
  header: [
    ...drillHeader(),
    code('TYPE', 'TYPE', { label: 'Drill type', group: 'Borehole' }),
    code('L_GRID', 'L_GRID', { label: 'Local grid', group: 'Collar position' }),
    num('LEASTING', { label: 'Local easting', group: 'Collar position' }),
    num('LNORTHING', { label: 'Local northing', group: 'Collar position' }),
    f('SURVEY_METHOD', { col: 'SURVEY METHOD', label: 'Collar survey method', group: 'Collar position' }),
    code('RIG_ID', 'RIG_ID', { label: 'Rig ID', group: 'Borehole' }),
    num('UTM_EAST', { label: 'UTM East', group: 'Collar position' }),
    num('UTM_NORTH', { label: 'UTM North', group: 'Collar position' }),
    num('AZIMUTH', { label: 'Azimuth', group: 'Collar position' }),
    num('DIP', { label: 'Dip', group: 'Collar position' }),
    num('TDEPTH', { label: 'Total depth (m)', group: 'Depths' }),
    code('DRILL_PARTNER', 'DRILL_PARTNER', { label: 'Drill partner', group: 'Borehole' }),
    num('YEAR', { label: 'Year', group: 'Borehole' }),
    bind('GEOLOGIST', 'geologist'),
    num('DEPTH_PQ', { label: 'Depth PQ (m)', group: 'Depths' }),
    num('DEPTH_HQ', { label: 'Depth HQ (m)', group: 'Depths' }),
    num('DEPTH_NQ', { col: 'DDEPTH_NQ', label: 'Depth NQ (m)', group: 'Depths' }),
    num('DEPTH_BQ', { label: 'Depth BQ (m)', group: 'Depths' }),
    num('DEPTH_RC', { label: 'Depth RC (m)', group: 'Depths' }),
    f('DATE_START', { label: 'Date started', type: 'date', group: 'Borehole' }),
    f('DATE_COMPLETE', { label: 'Date completed', type: 'date', group: 'Borehole' }),
    f('COMMENTS', { label: 'Comments', type: 'textarea', group: 'Comments' }),
  ],
  tables: [
    {
      key: 'survey',
      title: 'SURVEY',
      sheet: 'SURVEY',
      add: 'Add row',
      columns: [
        f('BHID', { inherit: true }),
        num('SURVEY_DEPTH', { label: 'Survey depth (m)' }),
        num('DIP', { label: 'Dip' }),
        num('AZIMUTH', { label: 'Azimuth' }),
        num('TMI', { label: 'TMI' }),
        code('SURVEY_METHOD', 'SURVEY_METHOD', { label: 'Survey method' }),
        code('SURVEYOR', 'SURVEYOR', { label: 'Surveyor' }),
        f('DATE', { label: 'Date', type: 'date', defaultFrom: 'date' }),
        f('COMMENTS', { label: 'Comments' }),
      ],
    },
  ],
  summary: { id: 'BHID', location: 'PROSPECTID', locationPrefix: 'Prospect ', north: 'UTM_NORTH', east: 'UTM_EAST' },
  listColumns: [['BHID', 'BHID'], ['TYPE', 'Type'], ['TDEPTH', 'Depth (m)'], ['AZIMUTH', 'Azimuth'], ['DIP', 'Dip'], ['@survey', 'Survey readings']],
  sheets: [
    {
      name: 'COLLAR',
      rows: 'record',
      columns: [
        'BHID', 'L_GRID', 'LEASTING', ['LNORTING', 'LNORTHING'], 'SURVEY METHOD', 'TYPE', ['RIG_TYPE', 'RIG_ID'], 'UTM_EAST', 'UTM_NORTH', 'AZIMUTH', 'DIP',
        ['T_DEPTH', 'TDEPTH'], 'DRILL_PARTNER', 'YEAR', 'DEPTH_PQ', 'DEPTH_HQ', ['DEPTH_NQ', 'DEPTH_NQ'], 'DEPTH_BQ', 'DEPTH_RC', 'DATE_START', 'DATE_COMPLETE', 'GEOLOGIST', 'COMMENTS',
      ],
    },
    { name: 'SURVEY', rows: 'survey', columns: ['BHID', 'SURVEY_DEPTH', 'DIP', 'AZIMUTH', 'TMI', 'SURVEY_METHOD', 'DATE', 'COMMENTS'] },
  ],
}

const LOGGING = {
  workbook: 'CORE DRILL_LOG_SAMPLE',
  codesSheet: 'CODE',
  codesGroup: 'CORE LOGGING',
  header: [
    ...drillHeader(),
    bind('DATE', 'date'),
    code('TYPE', 'TYPE', { label: 'Drill type', group: 'Borehole' }),
    code('RIG_ID', 'RIG_ID', { col: 'RIG ID', label: 'Rig ID', group: 'Borehole' }),
    bind('GEOLOGIST', 'geologist'),
    code('CORE_SIZE', 'CORE_SIZE', { col: 'CORE SIZE', label: 'Core size', group: 'Borehole' }),
  ],
  tables: [
    {
      key: 'logging',
      title: 'CORE LOGGING',
      sheet: 'CORE LOGGING',
      add: 'Add row',
      continues: true,
      columns: [
        f('BHID', { inherit: true }),
        code('CORE_SIZE', 'CORE_SIZE', { col: 'CORE SIZE', label: 'Core size', defaultFrom: 'CORE_SIZE', group: 'Interval' }),
        num('FROM', { label: 'From (m)', group: 'Interval' }),
        num('TO', { label: 'To (m)', group: 'Interval' }),
        num('LENGTH', { label: 'Length (m)', calc: diff, group: 'Interval' }),
        code('COLOUR', 'COLOUR', { label: 'Colour', group: 'Rock' }),
        code('GRAIN_SIZE', 'GRAIN_SIZE_CORE', { col: 'GRAIN SIZE', label: 'Grain size', group: 'Rock' }),
        code('TEXTURE', 'TEXTURE', { label: 'Texture', group: 'Rock' }),
        code('STRUCTURE', 'STRUCTURE', { label: 'Structure', group: 'Rock' }),
        rockCode(), rockType(), synRock(),
        num('ALPHA', { label: 'Alpha', group: 'Structure' }),
        num('BETA_THETA', { col: 'BETA/THETA', label: 'Beta / theta', group: 'Structure' }),
        code('FRACTURE_TYPE', 'FRACTURE_TYPE', { col: 'FRCATURE TYPE', label: 'Fracture type', group: 'Fractures' }),
        code('FRACTURE_SURFACE', 'FRACTURE_SURFACE', { col: 'FRCATURE SURFACE', label: 'Fracture surface', group: 'Fractures' }),
        num('FRACTURE_ANGLE', { col: 'FRCATURE ANGLE', label: 'Fracture angle', group: 'Fractures' }),
        code('FRACTURE_SPACING', 'FRACTURE_SPACING', { col: 'FRCATURE SPACING', label: 'Fracture spacing', group: 'Fractures' }),
        code('FRACTURE_FILLING', 'FRACTURE_FILLING', { col: 'FRCATURE FILLING', label: 'Fracture filling', group: 'Fractures' }),
        code('BEDDING', 'BEDDING', { label: 'Bedding', group: 'Structure' }),
        code('YOUNGING', 'YOUNGING', { label: 'Younging', group: 'Structure' }),
        code('FOLIATION', 'FOLIATION', { col: 'FOLITATION', label: 'Foliation', group: 'Structure' }),
        code('FOLIATION1', 'FOLIATION1', { label: 'Foliation 1', group: 'Structure' }),
        code('FOLIATION2', 'FOLIATION2', { label: 'Foliation 2', group: 'Structure' }),
        code('FOLIATION3', 'FOLIATION3', { label: 'Foliation 3', group: 'Structure' }),
        code('WEATHERING', 'WEATHERING', { label: 'Weathering', group: 'Rock' }),
        code('ROCK_FABRIC', 'ROCK_FABRIC', { col: 'ROCK FABRIC', label: 'Rock fabric', group: 'Rock' }),
        code('CONTACT', 'CONTACT', { col: 'Contact', label: 'Contact', group: 'Structure' }),
        num('CONTACT_ANGLE', { col: 'Contact angle', label: 'Contact angle', group: 'Structure' }),
        code('VEINING', 'VEINING', { label: 'Veining', group: 'Alteration & veins' }),
        code('SHEAR_FABRIC1', 'SHEAR_FABRIC1', { col: 'SHEAR FABRIC1', label: 'Shear fabric 1', group: 'Structure' }),
        code('SHEAR_FABRIC2', 'SHEAR_FABRIC2', { col: 'SHEAR FABRIC2', label: 'Shear fabric 2', group: 'Structure' }),
        code('ALTERATION', 'ALTERATION', { label: 'Alteration', group: 'Alteration & veins' }),
        ...minerals('MINERAL', 5),
        ...[1, 2, 3].flatMap((i) => [
          f(`ORE${i}_MIN`, { col: `ORE${i} MIN`, label: `Ore ${i} mineral`, group: 'Ore' }),
          f(`ORE${i}_VE`, { col: `ORE${i} VE`, label: `Ore ${i} VE`, group: 'Ore' }),
          code(`ORE${i}_TXT`, `ORE${i}_TXT`, { col: `ORE${i} TXT`, label: `Ore ${i} texture`, group: 'Ore' }),
        ]),
        f('DESCRIPTION1', { label: 'Description 1', type: 'textarea', group: 'Description' }),
        f('DESCRIPTION2', { label: 'Description 2', type: 'textarea', group: 'Description' }),
      ],
    },
    {
      key: 'sampling',
      title: 'CORE SAMPLING',
      sheet: 'CORE SAMPLING',
      add: 'Add row',
      continues: true,
      columns: [
        f('BHID', { inherit: true }),
        code('CORE_SIZE', 'CORE_SIZE', { col: 'CORE SIZE', label: 'Core size', defaultFrom: 'CORE_SIZE' }),
        num('FROM', { label: 'From (m)' }),
        num('TO', { label: 'To (m)' }),
        num('LENGTH', { label: 'Length (m)', calc: diff }),
        code('SAMPLE_TYPE', 'SAMPLE_TYPE_CORE2', { label: 'Sample type' }),
        code('SAMPLE_CAT', 'SAMPLE_CAT', { label: 'Category' }),
        bind('GEOLOGIST', 'geologist'),
        f('COMMENTS', { label: 'Comments' }),
      ],
    },
    {
      key: 'assay',
      title: 'ASSAY',
      sheet: 'ASSAY',
      add: 'Add row',
      continues: true,
      columns: [
        f('BHID', { inherit: true }),
        f('PROSPECTID', { inherit: true }),
        bind('PROJECT_NAME', 'project'),
        f('SAMPLE_NUMBER', { label: 'Sample number', key: true }),
        code('SAMPLE_CAT', 'SAMPLE_CAT', { label: 'Category' }),
        code('SAMPLE_TYPE', 'SAMPLE_TYPE_CORE', { label: 'Sample type' }),
        num('SPECIFIC_GRAVITY', { label: 'Specific gravity' }),
        num('FROM', { label: 'From (m)' }),
        num('TO', { label: 'To (m)' }),
        num('WIDTH', { label: 'Width (m)', calc: diff }),
        f('ORIGINAL_SAMPLE_NUMBER', { label: 'Original sample no. (for duplicates)' }),
      ],
    },
  ],
  summary: { id: 'BHID', location: 'PROSPECTID', locationPrefix: 'Prospect ' },
  listColumns: [['BHID', 'BHID'], ['CORE_SIZE', 'Core'], ['@logging', 'Intervals'], ['@metres', 'Logged (m)'], ['@samples', 'Samples']],
  sheets: [
    {
      name: 'CORE LOGGING',
      rows: 'logging',
      // The compiled table of the client's sheet: no VE columns, and the ore columns as MIN / TXT pairs.
      columns: [
        'BHID', 'CORE SIZE', 'FROM', 'TO', 'LENGTH', 'COLOUR', 'GRAIN SIZE', 'TEXTURE', 'STRUCTURE', 'ROCK_CODE', 'ROCK_TYPE', 'SYN_ROCK', 'ALPHA', 'BETA/THETA',
        'FRCATURE TYPE', 'FRCATURE SURFACE', 'FRCATURE ANGLE', 'FRCATURE SPACING', 'FRCATURE FILLING', 'BEDDING', 'YOUNGING', 'FOLITATION', 'FOLIATION1', 'FOLIATION2',
        'FOLIATION3', 'WEATHERING', 'ROCK FABRIC', 'Contact', 'Contact angle', 'VEINING', 'SHEAR FABRIC1', 'SHEAR FABRIC2', 'ALTERATION', 'MINERAL1', 'MINERAL2',
        'MINERAL3', 'MINERAL4', 'MINERAL5', 'ORE1 MIN', 'ORE1 TXT', 'ORE2 MIN', 'ORE2 TXT', 'ORE3 MIN', 'ORE3 TXT', 'DESCRIPTION1', 'DESCRIPTION2',
      ],
    },
    { name: 'CORE SAMPLING', rows: 'sampling', columns: ['BHID', 'CORE SIZE', 'FROM', 'TO', 'LENGTH', 'CORE SIZE', 'SAMPLE_TYPE', 'SAMPLE_CAT', 'GEOLOGIST', 'COMMENTS'] },
    { name: 'ASSAY', rows: 'assay' },
  ],
}

/* ---------- Sample Dispatch: lab details + sample details → dispatch letter ---------- */
const DISPATCH = {
  workbook: 'SAMPLE DISPATCH',
  codesSheet: 'Code',
  codesGroup: 'DISPATCH',
  header: [
    bind('PROJECT', 'project', { col: 'Project' }),
    bind('DISPATCH_DATE', 'date', { col: 'Dispatch Date' }),
    f('BATCH_ID', { col: 'Batch ID', label: 'Batch ID', group: 'Lab details' }),
    code('LAB', 'LAB', { col: 'Lab', label: 'Lab', group: 'Lab details' }),
    f('LAB_ADDRESS', { col: 'Lab Address', label: 'Lab address', group: 'Lab details' }),
    f('LAB_CONTACT', { col: 'Lab Conatct No', label: 'Lab contact no.', group: 'Lab details' }),
    f('LAB_OWNER', { col: 'Lab Owner', label: 'Lab owner / receiver', group: 'Lab details' }),
    f('LAB_MAIL', { col: 'Lab Mail Id', label: 'Lab mail ID', group: 'Lab details' }),
    f('BATCH_OWNER', { col: 'Batch Owner', label: 'Batch owner', group: 'Sender' }),
    f('SENDER_CONTACT', { col: 'Sender contcat no', label: 'Sender contact no.', group: 'Sender' }),
    f('SENDER_MAIL', { col: 'Sender Mail Id', label: 'Sender mail ID', group: 'Sender' }),
    f('SENDER_ADDRESS', { col: 'Sender Address', label: 'Sender address', group: 'Sender' }),
    ...[1, 2, 3, 4].map((i) => code(`ELEMENTS${i}`, 'ELEMENT', { col: `Elements${i}`, label: `Elements ${i}`, group: 'Analysis' })),
    ...[1, 2, 3].map((i) => f(`MAIL${i}`, { col: i === 1 ? 'Mail 1' : `Mail${i}`, label: `Result mail ${i}`, group: 'Analysis' })),
    code('COURIER', 'COURIER', { col: 'Courier', label: 'Courier', group: 'Courier' }),
    code('SAMPLE_PREPARATION', 'SAMPLE_PREPARATION', { col: 'Sample Preparation', label: 'Sample preparation', group: 'Analysis' }),
    code('PULP_RETURN', 'PULP', { col: 'Pulp return', label: 'Pulp return to owner', group: 'Analysis' }),
    f('TRACKING_NO', { col: 'Tracking No', label: 'Tracking no.', group: 'Courier' }),
    code('DATA_TYPE', 'DATA_TYPE', { col: 'DATA TYPE', label: 'Data type', group: 'Samples' }),
    code('CRM', 'CRM', { label: 'CRM (standard)', group: 'QC' }),
    code('PULP_BLANK', 'PULP_BLANK', { col: 'PULP BLANK', label: 'Pulp blank', group: 'QC' }),
    f('ROCK_BLANK', { col: 'ROCK BLANK', label: 'Rock blank material', group: 'QC' }),
    f('COARSE_REJECTS', { col: 'COARSE REJECTS', label: 'Coarse rejects', group: 'QC' }),
    f('PULP_DUPLICATE', { col: 'PULP DUPLICATE', label: 'Pulp duplicate', group: 'QC' }),
    f('LAB_RECEIVED', { col: 'Lab recieve date', label: 'Lab received on', type: 'date', group: 'Lab status' }),
    f('RESULT_RECEIVED', { col: 'Analysis received on', label: 'Results received on', type: 'date', group: 'Lab status' }),
    num('RESULT_COUNT', { col: 'No od samples analysis received', label: 'Samples with results', group: 'Lab status' }),
    code('STATUS', 'STATUS', { col: 'status', label: 'Status', group: 'Lab status' }),
  ],
  tables: [
    {
      key: 'samples',
      title: 'Sample details',
      sheet: 'Sample details',
      columns: [
        f('BATCH_ID', { inherit: true }),
        num('SEQ', { col: 'SEQ', label: '#' }),
        f('SAMPLE_NUMBER', { col: 'SAMPLE_NUMBER', label: 'Sample number' }),
        f('FIELD_SAMPLE', { col: 'FIELD SAMPLE NO', label: 'Field sample no.' }),
        f('QC', { col: 'SAMPLE / QC', label: 'Kind' }),
        f('REFERENCE', { col: 'REFERENCE', label: 'CRM / original sample' }),
        f('CLASS', { col: 'SAMPLE CLASS', label: 'Class' }),
        f('BOX_NO', { col: 'BOX NO', label: 'Box' }),
      ],
    },
  ],
  summary: { id: 'BATCH_ID', location: 'LAB', locationPrefix: 'Lab: ' },
  listColumns: [['BATCH_ID', 'Batch'], ['LAB', 'Lab'], ['@ordinary', 'Samples'], ['@qc', 'QC'], ['STATUS', 'Lab status']],
  sheets: [
    {
      name: 'LAB DETAILS DISPATCH',
      rows: 'record',
      columns: [
        'Project', 'Dispatch Date', 'Batch ID', 'Lab', 'Lab Address', 'Lab Conatct No', 'Lab Owner', 'Lab Mail Id', 'Batch Owner', 'Sender contcat no', 'Sender Mail Id',
        'Sender Address', 'Elements1', 'Elements2', 'Elements3', 'Elements4', 'Mail 1', 'Mail2', 'Mail3', 'Courier', 'Sample Preparation', 'Pulp return', 'Tracking No',
      ],
    },
    {
      name: 'Sample details',
      rows: 'samples',
      columns: [['Project', 'PROJECT'], 'Batch ID', ['DATA TYPE', 'DATA_TYPE'], 'SEQ', 'SAMPLE_NUMBER', 'FIELD SAMPLE NO', 'SAMPLE / QC', 'REFERENCE', 'SAMPLE CLASS', 'BOX NO'],
    },
    {
      name: ' sample dashbaord ouput',
      rows: 'record',
      columns: [
        ['Batch Id', 'BATCH_ID'], ['dispatch date', 'DISPATCH_DATE'], ['Half Core', '@halfCore'], ['Rock Chip', '@rockChip'], ['Pulp', '@pulp'], ['Total nos', '@total'],
        'Lab recieve date', 'Analysis received on', 'No od samples analysis received', 'status',
      ],
    },
  ],
}

export const FIELD_FORMATS = {
  'geological-mapping': MAPPING,
  'trench-mapping': TRENCH,
  'channel-sampling': CHANNEL,
  'soil-sampling': SOIL,
  'stream-sediment': STREAM,
  'core-drilling-dpr': DPR,
  'collar-survey': COLLAR,
  'drill-core-logging': LOGGING,
  'dispatch-database': DISPATCH,
}

export const formatOf = (sectionKey) => FIELD_FORMATS[sectionKey] ?? null

/* Helpers used by the form, the list, the detail view and the download. */

export function hoursBetween(start, end) {
  if (!start || !end) return ''
  const [h1, m1] = start.split(':').map(Number)
  const [h2, m2] = end.split(':').map(Number)
  let mins = h2 * 60 + m2 - (h1 * 60 + m1)
  if (mins < 0) mins += 24 * 60 // a night shift running past midnight
  return round(mins / 60)
}

/*
 * Options added from the dropdowns (a new rig, lab, rock code, geologist ...). They live with the demo's
 * changes in the store, which hands them over here, so every dropdown, label and the Excel CODES sheet sees them.
 */
let addedCodes = {}
export function setAddedCodes(entries) {
  addedCodes = {}
  entries.forEach((e) => (addedCodes[e.list] ??= []).push(e))
}

export const codeList = (key) => [...(FIELD_CODES[key]?.values ?? []), ...(addedCodes[key] ?? [])]

/* A list whose options carry a description (ROCK_CODE: GRN · Granite) asks for one when an option is added. */
export const listHasDesc = (key) => (FIELD_CODES[key]?.values ?? []).some((v) => v.desc)

export function codeLabel(listKey, value) {
  const v = codeList(listKey).find((c) => c.code === value)
  return v?.desc ? `${v.code} · ${v.desc}` : value
}

export const fieldLabel = (fld) => fld.label ?? fld.col

/* The value a field shows for a record: its own, or the record's project / geologist / date. */
export function bound(fld, record) {
  if (fld.bind === 'project') return record.projectName || record.projectId || ''
  if (fld.bind === 'geologist') return record.employeeName || record.createdBy || ''
  if (fld.bind === 'date') return record.date || ''
  return undefined
}

export const fieldsOf = (record) => record?.data?.fields ?? {}
export const rowsOf = (record, key) => record?.data?.rows?.[key] ?? []

/* A table row with its calculated values filled in. */
export function withCalcs(columns, row) {
  const out = { ...row }
  columns.forEach((c) => {
    if (c.calc) out[c.id] = c.calc(out)
  })
  return out
}

const sum = (rows, id) => round(rows.reduce((t, r) => t + (Number(r[id]) || 0), 0))

/* Totals a format can show in its list or put in a download column ('@name'). */
export function recordStat(sectionKey, record, stat) {
  const fmt = formatOf(sectionKey)
  if (!fmt) return ''
  const firstTable = fmt.tables.find((t) => t.continues)
  const rows = (key) => {
    const table = fmt.tables.find((t) => t.key === key)
    return rowsOf(record, key).map((r) => (table ? withCalcs(table.columns, r) : r))
  }
  switch (stat) {
    case 'intervals':
    case 'logging':
    case 'survey':
      return rows(stat === 'intervals' ? firstTable?.key : stat).length
    case 'metres': {
      const rs = rows(firstTable?.key)
      return rs.length ? round(rs.reduce((t, r) => t + (Number(diff(r)) || 0), 0)) : ''
    }
    case 'samples': {
      const nums = new Set()
      fmt.tables.forEach((t) => t.columns.forEach((c) => (c.sample || c.key) && rowsOf(record, t.key).forEach((r) => r[c.id] && nums.add(r[c.id]))))
      return nums.size
    }
    case 'from': {
      const rs = rows('runs')
      return rs.length ? Math.min(...rs.map((r) => n(r.FROM)).filter(Number.isFinite)) : ''
    }
    case 'to': {
      const rs = rows('runs')
      return rs.length ? Math.max(...rs.map((r) => n(r.TO)).filter(Number.isFinite)) : ''
    }
    case 'recovered':
      return sum(rows('runs'), 'RECOVERY') || ''
    case 'rqd':
      return sum(rows('runs'), 'RQD') || ''
    case 'fi': {
      const rs = rows('runs').filter((r) => r.FI !== '' && r.FI != null)
      return rs.length ? round(rs.reduce((t, r) => t + Number(r.FI), 0) / rs.length, 1) : ''
    }
    case 'recovery': {
      const drilled = Number(recordStat(sectionKey, record, 'metres'))
      return drilled ? `${round((sum(rows('runs'), 'RECOVERY') / drilled) * 100, 1)}%` : ''
    }
    case 'boxes': {
      const boxes = rows('runs').map((r) => r.BOX_NO).filter(Boolean)
      return boxes.length ? (boxes[0] === boxes.at(-1) ? boxes[0] : `${boxes[0]}–${boxes.at(-1)}`) : ''
    }
    case 'ordinary':
      return rowsOf(record, 'samples').filter((r) => r.QC === 'Ordinary').length
    case 'qc':
      return rowsOf(record, 'samples').filter((r) => r.QC !== 'Ordinary').length
    case 'halfCore':
    case 'rockChip':
    case 'pulp': {
      const cls = { halfCore: 'Half Core', rockChip: 'Rock Chip', pulp: 'Pulp' }[stat]
      return rowsOf(record, 'samples').filter((r) => r.CLASS === cls).length
    }
    case 'total':
      return rowsOf(record, 'samples').length
    default:
      return ''
  }
}

/* The record's list summary (location, id, coordinates) taken from its format fields. */
export function summaryMetadata(sectionKey, values) {
  const fmt = formatOf(sectionKey)
  const s = fmt?.summary ?? {}
  const v = (id) => (id && values[id] != null ? String(values[id]) : '')
  const location = v(s.location) ? `${s.locationPrefix ?? ''}${v(s.location)}` : ''
  return {
    location,
    sampleOrBoreholeId: v(s.id),
    coordinates: {
      latitude: s.north && v(s.north) ? (s.geographic ? `${v(s.north)}° N` : `N ${v(s.north)}`) : '',
      longitude: s.east && v(s.east) ? (s.geographic ? `${v(s.east)}° E` : `E ${v(s.east)}`) : '',
      elevation: '',
    },
  }
}
