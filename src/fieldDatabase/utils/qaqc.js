import { fieldsOf, rowsOf } from '../data/fieldFormats'
import { workbookBytes } from './xlsx'
import { saveWorkbook } from './save'

/*
 * QAQC of the lab results, laid out as the client's QAQC workbook. Only the client's own rule is
 * applied: a duplicate is acceptable between 95 % and 105 % of its original. Blanks and CRMs are shown
 * against their expected / certified values and SD lines; their pass/fail rule is awaited from the client.
 * Results are kept on the dispatch record (data.results: { <sample number>: { Zn, Pb, Ag } }).
 */

export const ELEMENTS = ['Zn', 'Pb', 'Ag'] // ppm, the three the client's sheets check

/* What a blank should read: the "Org" column of the client's ROCK BLANK and PULP BLANK sheets. */
export const BLANK_EXPECTED = { Zn: 5, Pb: 5, Ag: 1 }

export const DUP_RANGE = [95, 105] // "ACCEPTABLE BETWEEN 95% TO 105%" on the client's sheet

/* Certified values from the client's QAQC sheet. Others are entered on the QAQC page. */
export const CRM_DEFAULTS = {
  'GBM 326-6': { Zn: { value: 1100, sd: 50 }, Pb: { value: 738, sd: 42 }, Ag: { value: 14.6, sd: 0.6 } },
  'GBM924-4': { Zn: { value: 410, sd: 20 }, Pb: { value: 72, sd: 5 }, Ag: { value: 2.2, sd: 0.2 } },
}

/* The client's CRM sheet: every CRM on one sheet under this name. */
export const CRM_SHEET = 'GBM 907-8'

export const QC_SHEETS = [
  { key: 'rockBlank', kind: 'Rock blank', title: 'Rock Blank', sheet: 'ROCK BLANK' },
  { key: 'pulpBlank', kind: 'Pulp blank', title: 'Pulp Blank', sheet: 'PULP BLANK' },
  { key: 'pulpDuplicate', kind: 'Pulp duplicate', title: 'Pulp Duplicate', sheet: 'Pulp duplicate' },
  { key: 'crm', kind: 'CRM', title: 'CRM', sheet: CRM_SHEET },
]

/* The client's names in the SAMPLE NO sheet. */
export const SAMPLE_TYPE = { 'Rock blank': 'Rock Blank', 'Pulp blank': 'Pulp Blank', 'Pulp duplicate': 'Pulp Duplicate', CRM: 'CRM', 'Coarse reject duplicate': 'CRD' }

export const resultsOf = (batch) => batch?.data?.results ?? {}

const num = (v) => (v === '' || v == null || !Number.isFinite(Number(v)) ? null : Number(v))
const round = (v, d = 2) => (v == null ? null : Math.round(v * 10 ** d) / 10 ** d)

/*
 * Verdicts: 'pass' / 'fail' where the client has a rule, 'open' where the result is in but the client
 * has not given the rule yet, 'missing' where the result has not come.
 */
export function checkDuplicate(org, lab) {
  if (org == null || lab == null || !org) return { pct: null, verdict: 'missing' }
  const pct = (lab / org) * 100
  return { pct: round(pct), verdict: pct >= DUP_RANGE[0] && pct <= DUP_RANGE[1] ? 'pass' : 'fail' }
}

/* How many SD the lab value sits from the certified value: shown, not judged. */
export function crmOffset(lab, cert) {
  if (lab == null) return { z: null, verdict: 'missing' }
  if (!cert || cert.value == null || !cert.sd) return { z: null, verdict: 'open' }
  return { z: round((lab - cert.value) / cert.sd), verdict: 'open' }
}

export const crmBands = (cert) =>
  cert && cert.value != null && cert.sd
    ? { value: cert.value, sd: cert.sd, ...Object.fromEntries([1, 2, 3].flatMap((k) => [[`p${k}`, round(cert.value + k * cert.sd, 4)], [`m${k}`, round(cert.value - k * cert.sd, 4)]])) }
    : null

export const certifiedOf = (crm, crmValues = {}) => crmValues[crm] ?? CRM_DEFAULTS[crm] ?? null

const rowVerdict = (el) => {
  const v = ELEMENTS.map((e) => el[e].verdict)
  if (v.includes('fail')) return 'fail'
  if (v.includes('missing')) return 'missing'
  return v.includes('open') ? 'open' : 'pass'
}

/*
 * Every QC sample of the given batches, one list per sheet of the client's workbook, plus the full
 * sample list (SAMPLE NO sheet).
 */
export function qaqcRows(batches, crmValues = {}) {
  const out = { rockBlank: [], pulpBlank: [], pulpDuplicate: [], crm: [], samples: [] }
  const ordered = [...batches].sort((a, b) => (a.date || '').localeCompare(b.date || ''))
  ordered.forEach((batch) => {
    const v = fieldsOf(batch)
    const results = resultsOf(batch)
    const base = { projectId: batch.projectId, batchId: v.BATCH_ID || batch.id, recordId: batch.id, date: batch.date, lab: v.LAB }
    rowsOf(batch, 'samples').forEach((s) => {
      const lab = results[s.SAMPLE_NUMBER] ?? {}
      const type = s.QC === 'Ordinary' ? s.SAMPLE_TYPE || s.CLASS : SAMPLE_TYPE[s.QC]
      out.samples.push({ ...base, sampleNo: s.SAMPLE_NUMBER, type, qc: s.QC, hasResult: ELEMENTS.some((e) => num(lab[e]) != null) })
      const row = { ...base, sampleNo: s.SAMPLE_NUMBER, reference: s.REFERENCE, el: {} }
      if (s.QC === 'Rock blank' || s.QC === 'Pulp blank') {
        ELEMENTS.forEach((e) => {
          const l = num(lab[e])
          row.el[e] = { org: BLANK_EXPECTED[e], lab: l, verdict: l == null ? 'missing' : 'open' }
        })
        out[s.QC === 'Rock blank' ? 'rockBlank' : 'pulpBlank'].push(row)
      } else if (s.QC === 'Pulp duplicate') {
        const original = results[s.REFERENCE] ?? {}
        ELEMENTS.forEach((e) => {
          const o = num(original[e])
          const l = num(lab[e])
          row.el[e] = { org: o, lab: l, ...checkDuplicate(o, l) }
        })
        out.pulpDuplicate.push(row)
      } else if (s.QC === 'CRM') {
        const cert = certifiedOf(s.REFERENCE, crmValues)
        row.crm = s.REFERENCE
        ELEMENTS.forEach((e) => {
          const l = num(lab[e])
          const c = cert?.[e]
          row.el[e] = { org: num(c?.value), lab: l, bands: crmBands(c), ...crmOffset(l, c) }
        })
        out.crm.push(row)
      } else return // ordinary samples, and coarse reject duplicates (the client's workbook has no sheet for them)
      row.verdict = rowVerdict(row.el)
    })
  })
  return out
}

export const allChecks = (rows) => [...rows.rockBlank, ...rows.pulpBlank, ...rows.pulpDuplicate, ...rows.crm]

/* Where a batch's results stand, and how its duplicates came out. The lab status itself is set by hand. */
export function batchQaqc(batch, crmValues) {
  const rows = qaqcRows([batch], crmValues)
  const checks = allChecks(rows)
  const withResult = rows.samples.filter((s) => s.hasResult).length
  const summary = {
    total: rows.samples.length,
    withResult,
    qc: rows.samples.filter((s) => s.qc !== 'Ordinary').length,
    dupPass: rows.pulpDuplicate.filter((r) => r.verdict === 'pass').length,
    dupFail: rows.pulpDuplicate.filter((r) => r.verdict === 'fail').length,
    waitingQc: checks.filter((c) => c.verdict === 'missing').length,
  }
  const state = !withResult ? 'awaiting' : withResult < summary.total ? 'partial' : 'complete'
  return { ...summary, state }
}

/* ---------- The client's QAQC workbook ---------- */

const cellOf = (v) => (v == null ? '' : v)

/* ---------- The client's twelve charts, placed as on their sheets: two rows under the data, three across ---------- */

const colLetter = (i) => {
  let out = ''
  for (let n = i + 1; n > 0; n = Math.floor((n - 1) / 26)) out = String.fromCharCode(65 + ((n - 1) % 26)) + out
  return out
}
const range = (sheet, col, first, last) => `'${sheet}'!$${colLetter(col)}$${first}:$${colLetter(col)}$${last}`
const head = (sheet, col) => `'${sheet}'!$${colLetter(col)}$1`
const place = (cols, rows) => cols.map(([from, to], i) => ({ from: [from, rows[i]], to: [to, rows[i] + 14] }))

/* Blanks: per element a line of the expected (Org) and one of the lab value, along the sample numbers. */
function blankCharts(sheet, label, n, cols) {
  if (!n) return []
  const at = place(cols, [n + 1, n + 1, n + 1])
  return ELEMENTS.map((e, i) => ({
    kind: 'line',
    title: `${label} QAQC chart_${e}`,
    ...at[i],
    series: [3 + i * 2, 4 + i * 2].map((c) => ({ name: head(sheet, c), cat: range(sheet, 2, 2, n + 1), val: range(sheet, c, 2, n + 1) })),
  }))
}

/* Duplicates: per element the lab value against the original. */
function duplicateCharts(sheet, n) {
  if (!n) return []
  const at = place([[0, 6], [8, 15], [16, 24]], [n, n + 1, n + 1])
  return ELEMENTS.map((e, i) => ({
    kind: 'scatter',
    title: `${e}_PD (ppm)`,
    ...at[i],
    series: [{ name: head(sheet, 4 + i * 3), x: range(sheet, 3 + i * 3, 2, n + 1), y: range(sheet, 4 + i * 3, 2, n + 1), line: false }],
  }))
}

/* The first CRM on the sheet, as the client charts it: its SD lines, the certified (Org) and the lab values. */
function crmCharts(sheet, crm, k, used) {
  if (!k) return []
  const at = place([[0, 7], [8, 13], [14, 19]], [used + 1, used + 1, used + 1])
  return ELEMENTS.map((e, i) => {
    const base = 4 + i * 9 // Org, lab, STDEV, then 1SD+ … 3SD-
    const sd = [3, 4, 5, 6, 7, 8].map((o) => ({ name: head(sheet, base + o), cat: range(sheet, 3, 2, k + 1), val: range(sheet, base + o, 2, k + 1), markers: false }))
    const points = [base, base + 1].map((c) => ({ name: head(sheet, c), cat: range(sheet, 3, 2, k + 1), val: range(sheet, c, 2, k + 1), line: false }))
    return { kind: 'line', title: `${crm} ${e}(ppm)`, ...at[i], series: [...sd, ...points] }
  })
}

function blankSheet(name, rows, label, cols) {
  return {
    name,
    widths: WIDTHS[name],
    charts: blankCharts(name, label, rows.length, cols),
    header: ['Project ID', 'Batch No', 'Sample No', ...ELEMENTS.flatMap((e) => [`${e}_Org (ppm)`, `${e}_lab (ppm)`])],
    rows: rows.map((r) => [r.projectId, r.batchId, r.sampleNo, ...ELEMENTS.flatMap((e) => [cellOf(r.el[e].org), cellOf(r.el[e].lab)])]),
  }
}

/* Column widths of the client's sheets. */
const WIDTHS = {
  'ROCK BLANK': [9.57, 14.57, 12.29, 15.43, 12.71, 13.29, 12.71, 13.43, 12.86],
  'PULP BLANK': [11.57, 14.57, 15.86, 13.29, 12.71, 13.43, 12.86, 13.43, 12.86],
  'Pulp duplicate': [null, 14.57, 12.29, 13.29, 12.71, 13.43, 12.86, 13.43, 12.86, 13.43, 12.86],
  [CRM_SHEET]: [9.14, 14.57, ...Array(11).fill(12.29), 12.86, 13.29, ...Array(7).fill(12.29), 13.71, 12.71, 12.71, ...Array(6).fill(12.29)],
  'SAMPLE NO ': [12.29, 10.43, null, null, 14, 25.57],
}

/* The client works % out in the sheet: lab ÷ original as a percentage (E2/D2%). */
function duplicateSheet(name, rows) {
  const body = rows.map((r, i) => {
    const at = i + 2
    return [
      r.projectId, r.batchId, r.sampleNo,
      ...ELEMENTS.flatMap((e, k) => {
        const el = r.el[e]
        const [org, lab] = [colLetter(3 + k * 3), colLetter(4 + k * 3)]
        return [cellOf(el.org), cellOf(el.lab), el.pct == null ? '' : { f: `${lab}${at}/${org}${at}%`, v: el.pct }]
      }),
    ]
  })
  // The client's note sits beside the first row, column O.
  if (body.length) body[0] = [...body[0], '', '', `ACCEPTABLE BETWEEN ${DUP_RANGE[0]}% TO ${DUP_RANGE[1]}%`]
  return { name, header: ['Project ID', 'Batch No', 'Sample No', ...ELEMENTS.flatMap((e) => [`${e}_Org (ppm)`, `${e}_lab (ppm)`, `%_${e}`])], rows: body, widths: WIDTHS[name], charts: duplicateCharts(name, body.length) }
}

/*
 * The CRM sheet, rows in sheet order with null for the empty row between one CRM and the next. As in the
 * client's sheet, the SD lines are formulas on the certified value and its STDEV (E2+G2, E2-2*G2 ...).
 */
function crmSheet(name, rows) {
  const labCol = (e) => (e === 'Ag' ? `${e}(ppm)_Lab` : `${e}(ppm)_lab`)
  return {
    name,
    header: ['Project ID', 'Batch No', 'CRM', 'Sample No', ...ELEMENTS.flatMap((e) => [`${e}(ppm)_Org`, labCol(e), 'STDEV', '1SD+', '1SD-', '2SD+', '2SD-', '3SD+', '3SD-'])],
    widths: WIDTHS[name],
    rows: rows.map((r, i) => {
      if (!r) return []
      const at = i + 2
      return [
        r.projectId, r.batchId, r.crm, r.sampleNo,
        ...ELEMENTS.flatMap((e, k) => {
          const b = r.el[e].bands
          const [org, sd] = [colLetter(4 + k * 9), colLetter(6 + k * 9)]
          const band = (sign, n, v) => ({ f: `${org}${at}${sign}${n > 1 ? `${n}*` : ''}${sd}${at}`, v })
          return [
            cellOf(r.el[e].org), cellOf(r.el[e].lab),
            ...(b ? [b.sd, band('+', 1, b.p1), band('-', 1, b.m1), band('+', 2, b.p2), band('-', 2, b.m2), band('+', 3, b.p3), band('-', 3, b.m3)] : ['', '', '', '', '', '', '']),
          ]
        }),
      ]
    }),
  }
}

export function qaqcWorkbook(rows) {
  // The client's sheets, in their order. The CRMs share one sheet, an empty row between one CRM and the next.
  const crms = [...new Set(rows.crm.map((r) => r.crm))]
  const byCrm = crms.map((c) => rows.crm.filter((r) => r.crm === c))
  const crm = crmSheet(CRM_SHEET, byCrm.flatMap((group, i) => (i ? [null, ...group] : group)))
  crm.charts = crmCharts(CRM_SHEET, crms[0], byCrm[0]?.length ?? 0, crm.rows.length + 1)
  const sheets = [
    blankSheet('ROCK BLANK', rows.rockBlank, 'Rock Blank', [[2, 7], [9, 16], [17, 24]]),
    blankSheet('PULP BLANK', rows.pulpBlank, 'Pulp Blank', [[2, 7], [8, 15], [16, 23]]),
    duplicateSheet('Pulp duplicate', rows.pulpDuplicate),
    crm,
  ]
  // SAMPLE NO: every tube and its type, the count of each QC type beside it (columns E–F).
  const counts = Object.values(SAMPLE_TYPE).map((t) => [t, rows.samples.filter((s) => s.type === t).length])
  const list = rows.samples.map((s, i) => [s.sampleNo, s.type, '', '', ...(counts[i] ?? [])])
  sheets.push({ name: 'SAMPLE NO ', header: ['Sample Nos', 'Type'], rows: list, widths: WIDTHS['SAMPLE NO '] })
  return sheets
}

export function downloadQaqcWorkbook(rows) {
  const stamp = new Date().toISOString().slice(0, 10)
  return saveWorkbook(workbookBytes(qaqcWorkbook(rows)), `QAQC_${stamp}.xlsx`)
}

/*
 * Results pasted from the lab's sheet: a sample number then Zn, Pb, Ag on each line, split by tabs,
 * commas or semicolons. A header line names the columns in any order.
 */
export function parseResults(text, knownNumbers) {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean)
  let order = ['SAMPLE', ...ELEMENTS]
  const out = {}
  const unknown = []
  lines.forEach((line) => {
    const cells = line.split(/\t|;|,/).map((c) => c.trim())
    const upper = cells.map((c) => c.toUpperCase())
    if (upper.some((c) => /SAMPLE/.test(c))) {
      order = upper.map((c) => (/SAMPLE/.test(c) ? 'SAMPLE' : ELEMENTS.find((e) => c.startsWith(e.toUpperCase())) ?? ''))
      return
    }
    const rec = {}
    order.forEach((key, i) => key && (rec[key] = cells[i]))
    const sample = knownNumbers(rec.SAMPLE)
    if (!sample) {
      if (rec.SAMPLE) unknown.push(rec.SAMPLE)
      return
    }
    out[sample] = Object.fromEntries(ELEMENTS.filter((e) => num(rec[e]) != null).map((e) => [e, num(rec[e])]))
  })
  return { results: out, unknown }
}
