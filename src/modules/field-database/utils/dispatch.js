import { FIELD_FORMATS, fieldsOf, rowsOf } from '../data/fieldFormats'

/*
 * Sample dispatch to the lab, as the client's SAMPLE DISPATCH workbook lays it down:
 * pick the ordinary samples of one data type, insert the QC samples by their rules, keep the batch
 * at 150 or fewer, and print the dispatch letter (Dispatch No: BGSPL/Lab name/FY/Batch Id).
 */

export const MAX_BATCH = 150

/* The rules as the client's Sample details sheet words them. */
export const QC_RULES = [
  { kind: 'Rock blank', title: 'Rock Blank', rule: 'first and last sample of batch and in between one sample in 20 nos ordinary samples' },
  { kind: 'Pulp blank', title: 'Pulp Blank', rule: 'one in each 35nos samples' },
  { kind: 'CRM', title: 'CRM', rule: 'ONE IN EACH 25NOS SAMPLES' },
  { kind: 'Pulp duplicate', title: 'Pulp duplicate', rule: 'ONE IN EACH 25NOS SAMPLES' },
  { kind: 'Coarse reject duplicate', title: 'Coarse rejects duplicates', rule: 'sample at after 10nos aamples' },
]
export const BATCH_NOTE = 'Note: Total size of batch must not be exceed 150nos including QC samples'

/* Which section's samples each DATA TYPE of the dispatch sheet means. */
export const DATA_TYPE_SECTIONS = {
  MAPPING: ['geological-mapping'],
  'ROCK CHIP': ['geological-mapping'],
  TRENCHING: ['trench-mapping'],
  CHANNEL: ['channel-sampling'],
  SOIL: ['soil-sampling'],
  STREAM: ['stream-sediment'],
  'CORE DRILL': ['drill-core-logging'],
  'NON CORE': ['non-core-logging'],
}

/* Half core, rock chip or pulp: the three columns of the dispatch letter. */
export function sampleClass(sampleType, qc) {
  if (qc === 'Pulp blank' || qc === 'CRM' || qc === 'Pulp duplicate') return 'Pulp'
  if (['HCR', 'QCR'].includes(sampleType)) return 'Half Core'
  if (sampleType === 'PULP') return 'Pulp'
  return 'Rock Chip'
}

/*
 * Every sample number recorded in the field formats: the sample columns of the forms and the
 * ASSAY sheets. One entry per number, with where it came from.
 */
export function sampleRegister(records) {
  const seen = new Map()
  records.forEach((rec) => {
    const fmt = FIELD_FORMATS[rec.section]
    if (!fmt || rec.section === 'dispatch-database') return
    const fields = fieldsOf(rec)
    const add = (number, type, cat) => {
      const key = String(number || '').trim()
      if (!key || seen.has(key)) return
      seen.set(key, { number: key, type: type || '', cat: cat || 'ORD', section: rec.section, recordId: rec.id, projectId: rec.projectId, date: rec.date, by: rec.employeeName })
    }
    fmt.header.forEach((fld) => fld.sample && add(fields[fld.id], fields.SAMPLE_TYPE, fields.SAMPLE_CAT))
    fmt.tables.forEach((t) => {
      const sampleCol = t.columns.find((c) => c.sample || c.key)
      if (!sampleCol) return
      rowsOf(rec, t.key).forEach((r) => add(r[sampleCol.id], r.SAMPLE_TYPE, r.SAMPLE_CAT))
    })
    // Core: a sampled interval without its own number still goes to the lab under the borehole's name.
    if (rec.section === 'drill-core-logging' && !rowsOf(rec, 'assay').length) {
      rowsOf(rec, 'sampling').forEach((r) => add(`${fields.BHID}/${r.FROM}-${r.TO}`, r.SAMPLE_TYPE, r.SAMPLE_CAT))
    }
  })
  return [...seen.values()]
}

/* The number a sample was recorded under in the field (older batches kept it as the sample number). */
export const fieldNumber = (row) => row.FIELD_SAMPLE || row.SAMPLE_NUMBER

/* Field sample numbers already sent in another batch. */
export function dispatchedSamples(records, exceptId) {
  const out = new Map()
  records
    .filter((r) => r.section === 'dispatch-database' && r.id !== exceptId)
    .forEach((r) => rowsOf(r, 'samples').forEach((s) => s.QC === 'Ordinary' && out.set(fieldNumber(s), fieldsOf(r).BATCH_ID || r.id)))
  return out
}

/*
 * Every tube of a project's batches carries one running number, QC samples included, as in the
 * client's QAQC sheet (BGSPL01/001 ... BGSPL01/122): <project>/<001>.
 */
export const seriesNumber = (projectCode, n) => `${projectCode}/${String(n).padStart(3, '0')}`
export const seriesOf = (number) => {
  const m = /\/(\d+)$/.exec(String(number || ''))
  return m ? Number(m[1]) : null
}

/* Where the next batch of a project starts its running numbers. */
export function nextSeriesStart(records, projectId, exceptId) {
  let last = 0
  records
    .filter((r) => r.section === 'dispatch-database' && r.projectId === projectId && r.id !== exceptId)
    .forEach((r) => rowsOf(r, 'samples').forEach((s) => (last = Math.max(last, s.SAMPLE_NUMBER?.startsWith(`${projectId}/`) ? seriesOf(s.SAMPLE_NUMBER) : 0))))
  return last + 1
}

/*
 * The batch in dispatch order. QC samples are placed by their position in the whole batch, the way
 * the client counts them: a rock blank first; a coarse reject duplicate of the last sample at 11, 21,
 * 31 ...; a rock blank after every 20 ordinary samples; a CRM and a pulp duplicate in every 25; a pulp
 * blank in every 35; a rock blank last. Then every tube takes the next running number.
 */
export function buildBatch(ordinary, { crm, pulpBlank, rockBlank, projectCode = '', start = 1 }) {
  const out = []
  const since = { CRM: 0, 'Pulp duplicate': 0, 'Pulp blank': 0 }
  let ordinarySinceBlank = 0
  let last = null // index in out of the last ordinary sample
  const push = (row) => {
    Object.keys(since).forEach((k) => (since[k] = row.QC === k ? 0 : since[k] + 1))
    out.push(row)
  }
  const qc = (kind, reference, ofIndex = null) => push({ QC: kind, REFERENCE: reference || '', CLASS: ofIndex == null ? sampleClass('', kind) : out[ofIndex].CLASS, of: ofIndex })

  qc('Rock blank', rockBlank)
  let i = 0
  while (i < ordinary.length) {
    const position = out.length + 1
    if (position % 10 === 1 && last != null) qc('Coarse reject duplicate', '', last)
    else if (ordinarySinceBlank >= 20) {
      qc('Rock blank', rockBlank)
      ordinarySinceBlank = 0
    } else if (since.CRM >= 25) qc('CRM', crm)
    else if (since['Pulp duplicate'] >= 25 && last != null) qc('Pulp duplicate', '', last)
    else if (since['Pulp blank'] >= 35) qc('Pulp blank', pulpBlank)
    else {
      const s = ordinary[i++]
      last = out.length
      ordinarySinceBlank += 1
      push({ QC: 'Ordinary', FIELD_SAMPLE: s.number, SAMPLE_TYPE: s.type || '', REFERENCE: '', CLASS: sampleClass(s.type, 'Ordinary'), SOURCE: s.recordId })
    }
  }
  if (ordinary.length) qc('Rock blank', rockBlank)

  const number = (idx) => seriesNumber(projectCode || 'BATCH', start + idx)
  return out.map(({ of, ...r }, idx) => ({
    ...r,
    SEQ: idx + 1,
    SAMPLE_NUMBER: number(idx),
    REFERENCE: of == null ? r.REFERENCE : number(of), // a duplicate names the tube it repeats
    BOX_NO: '', // filled in by hand: the client's sheets give no rule for how many go in a box
  }))
}

/* How many ordinary samples fit in one batch of 150 once the QC samples are added. */
export function maxOrdinary(limit = MAX_BATCH) {
  let n = 0
  while (buildBatch(Array.from({ length: n + 1 }, (_, i) => ({ number: String(i) })), {}).length <= limit) n++
  return n
}

export function financialYear(iso) {
  const d = iso ? new Date(iso) : new Date()
  const y = d.getFullYear()
  const start = d.getMonth() >= 3 ? y : y - 1
  return `${start}-${String((start + 1) % 100).padStart(2, '0')}`
}

export const dispatchNumber = (fields, date) => `BGSPL/${fields.LAB || 'Lab'}/${financialYear(date)}/${fields.BATCH_ID || 'Batch'}`

/* Box-wise count for the letter: Box No | Half Core | Rock Chip | Pulp | Total. */
export function boxSummary(samples) {
  const boxes = new Map()
  samples.forEach((s) => {
    const b = boxes.get(s.BOX_NO) ?? { box: s.BOX_NO, 'Half Core': 0, 'Rock Chip': 0, Pulp: 0, total: 0 }
    b[s.CLASS] = (b[s.CLASS] ?? 0) + 1
    b.total += 1
    boxes.set(s.BOX_NO, b)
  })
  const rows = [...boxes.values()].sort((a, b) => Number(a.box) - Number(b.box))
  const total = rows.reduce((t, r) => ({ 'Half Core': t['Half Core'] + r['Half Core'], 'Rock Chip': t['Rock Chip'] + r['Rock Chip'], Pulp: t.Pulp + r.Pulp, total: t.total + r.total }), { 'Half Core': 0, 'Rock Chip': 0, Pulp: 0, total: 0 })
  return { rows, total }
}

/* The fixed lines of the client's letter. */
export const RESULT_MAILS = 'amit.bansal@bansalgeo.com, dharmendra.goyal@bansalgeo.com'
export const RESULT_ADDRESS = 'Mr Amit K Bansal, 604, 607 & 612, 6th Floor, Okay Plus Square, Madhyam Marg, Mansarovar, Jaipur-302020, Rajasthan, India'
