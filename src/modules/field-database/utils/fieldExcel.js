import { CLIENT_CODE_SHEETS } from '../data/clientCodeSheets'
import { CLIENT_FORM_SHEETS } from '../data/clientFormSheets'
import { CLIENT_SHEET_HEADINGS } from '../data/clientSheetHeadings'
import { FIELD_CODES } from '../data/fieldCodes'
import { FIELD_FORMATS, bound, codeList, fieldsOf, formatOf, recordStat, rowsOf, withCalcs } from '../data/fieldFormats'
import { dispatchFormSheets } from './dispatchExcel'
import { downloadBlob, workbookBlob } from './xlsx'

/*
 * Builds the client's workbook for one section: the same sheets, the same column headers in the
 * same order, one line per record (or per interval / run / sample), and a CODES sheet laid out like
 * theirs (Attribute Group | Attribute Name | Attribute Value | Description) that the dropdowns point at.
 */

function resolveColumn(fmt, sheet, spec) {
  const [header, ref] = Array.isArray(spec) ? spec : [spec, null]
  const table = fmt.tables.find((t) => t.key === sheet.rows)
  const pool = [...(table?.columns ?? []), ...fmt.header]
  if (ref?.startsWith('@')) return { header, stat: ref.slice(1) }
  const fld = ref ? pool.find((c) => c.id === ref) : pool.find((c) => c.col === header)
  return { header, fld }
}

function sheetColumns(fmt, sheet) {
  if (sheet.columns) return sheet.columns.map((spec) => resolveColumn(fmt, sheet, spec))
  if (sheet.rows === 'record') return fmt.header.map((fld) => ({ header: fld.col, fld }))
  const table = fmt.tables.find((t) => t.key === sheet.rows)
  const own = table.columns.map((fld) => ({ header: fld.col, fld }))
  if (!sheet.withHeader) return own
  const headerIds = new Set(fmt.header.map((h) => h.id))
  return [...fmt.header.map((fld) => ({ header: fld.col, fld })), ...own.filter((c) => !(c.fld.inherit && headerIds.has(c.fld.id)))]
}

function valueOf(col, record, sectionKey, row, table) {
  if (col.stat) return recordStat(sectionKey, record, col.stat)
  const fld = col.fld
  if (!fld) return ''
  // A row's own value first (its date and geologist can differ row by row), then the record's.
  if (row && table?.columns.includes(fld) && !fld.inherit && row[fld.id] !== '' && row[fld.id] != null) return row[fld.id]
  const fromBind = bound(fld, record)
  if (fromBind !== undefined) return fromBind
  const fields = fieldsOf(record)
  if (row && table?.columns.includes(fld) && !fld.inherit) return row[fld.id] ?? ''
  return fields[fld.id] ?? ''
}

const asCell = (v, fld) => {
  if (v === '' || v == null) return ''
  if (fld?.type === 'number' && v !== '' && Number.isFinite(Number(v))) return Number(v)
  return v
}

const norm = (s) => String(s ?? '').replace(/\s+/g, ' ').trim().replace(/:$/, '').trim().toUpperCase()
const asCode = (v) => (/^-?\d+(\.\d+)?$/.test(v) ? Number(v) : v)

/*
 * The client's own codes sheet, cell for cell. Options added from the dropdowns go in right under their
 * list, and every dropdown reads the range the client's sheet gives it (moved down past any added rows).
 */
function clientCodesSheet(fmt, client) {
  const fields = [...fmt.header, ...fmt.tables.flatMap((t) => t.columns)].filter((f) => f.list)
  const clientRange = (sheetName, fld) => client.lists[sheetName]?.[norm(fld.col)] ?? client.lists[sheetName]?.[norm(fld.label)]
  // Where each list sits in their sheet, from any of their dropdowns that use it.
  const block = {}
  fmt.sheets.forEach((s) => fields.forEach((fld) => {
    const r = clientRange(s.name, fld)
    if (r && !block[fld.list]) block[fld.list] = r
  }))
  const added = (key) => codeList(key).slice(FIELD_CODES[key]?.values.length ?? 0)

  const rows = []
  const moved = {} // their row number -> ours
  client.rows.slice(1).forEach((r, i) => {
    const row = i + 2
    rows.push(r.map(asCode))
    moved[row] = rows.length + 1
    Object.entries(block).forEach(([key, [, , end]]) => {
      if (end === row) added(key).forEach((v) => rows.push([r[0] ?? '', r[1] ?? '', v.code, v.desc ?? '']))
    })
  })
  const shift = rows.length + 1 - client.rows.length // for a range reaching past their last row
  const at = (row) => moved[row] ?? row + shift
  const span = (key, [col, start, end]) => [col, at(start), at(end) + (block[key]?.[2] === end ? added(key).length : 0)]
  // A list the client's sheet has no dropdown for is not added to their codes sheet; that column gets no dropdown, as with them.
  const rangeFor = (sheetName, fld) => {
    const own = clientRange(sheetName, fld)
    const r = own ? span(fld.list, own) : block[fld.list] && span(fld.list, block[fld.list])
    return r && `${client.name}!$${r[0]}$${r[1]}:$${r[0]}$${r[2]}`
  }
  // A range written in the client's own sheets (their dispatch forms), moved to where those rows now are.
  const remap = (formula) => {
    const m = /\$?([A-Z]+)\$?(\d+):\$?[A-Z]+\$?(\d+)/.exec(formula)
    if (!m) return formula
    const [col, a, b] = [m[1], Number(m[2]), Number(m[3])]
    const key = Object.keys(block).find((k) => block[k][1] === a && block[k][2] === b)
    const [, start, end] = key ? span(key, [col, a, b]) : [col, at(a), at(b)]
    return `${client.name}!$${col}$${start}:$${col}$${end}`
  }
  return { sheet: { name: client.name, header: client.rows[0], rows }, rangeFor, remap }
}

/* The CODES sheet: every list this format uses, with the range each dropdown reads. */
function codesSheet(fmt) {
  const client = CLIENT_CODE_SHEETS[fmt.workbook]
  if (client) return clientCodesSheet(fmt, client)
  const used = []
  const all = [...fmt.header, ...fmt.tables.flatMap((t) => t.columns)]
  all.forEach((fld) => {
    if (fld.list && !used.includes(fld.list)) used.push(fld.list)
  })
  const rows = []
  const ranges = {}
  used.forEach((key) => {
    const list = FIELD_CODES[key]
    if (!list) return
    const start = rows.length + 2
    codeList(key).forEach((v) => rows.push([fmt.codesGroup, list.label, v.code, v.desc ?? '']))
    ranges[key] = { code: `${fmt.codesSheet}!$C$${start}:$C$${rows.length + 1}`, desc: `${fmt.codesSheet}!$D$${start}:$D$${rows.length + 1}` }
  })
  return {
    sheet: { name: fmt.codesSheet, header: ['Attribute Group', 'Attribute Name', 'Attribute Value', 'Description'], rows, widths: [16, 22, 24, 48] },
    rangeFor: (_, fld) => ranges[fld.list] && (fld.type === 'desc' ? ranges[fld.list].desc : ranges[fld.list].code),
    remap: (formula) => formula,
  }
}

/* One format's sheets as tables: one line per record, or per row of its table. */
function tableSheets(fmt, sectionKey, records, codes) {
  return fmt.sheets.map((sheet) => {
    const cols = sheetColumns(fmt, sheet)
    const table = fmt.tables.find((t) => t.key === sheet.rows)
    const rows = []
    records.forEach((record) => {
      if (sheet.rows === 'record') {
        rows.push(cols.map((c) => asCell(valueOf(c, record, sectionKey), c.fld)))
      } else {
        rowsOf(record, sheet.rows).forEach((raw) => {
          const row = withCalcs(table.columns, raw)
          rows.push(cols.map((c) => asCell(valueOf(c, record, sectionKey, row, table), c.fld)))
        })
      }
    })
    const lists = {}
    cols.forEach((c, i) => {
      const r = c.fld?.list && codes.rangeFor(sheet.name, c.fld)
      if (r) lists[i] = r
    })
    return { name: sheet.name, title: sheet.title, header: cols.map((c) => c.header), rows, lists, spec: sheet }
  })
}

const cellRef = (col, row) => {
  let s = ''
  for (let n = col + 1; n > 0; n = Math.floor((n - 1) / 26)) s = String.fromCharCode(65 + ((n - 1) % 26)) + s
  return `${s}${row}`
}
const parseRef = (ref) => {
  const [, letters, row] = /^([A-Z]+)(\d+)$/.exec(ref)
  return { col: [...letters].reduce((n, ch) => n * 26 + ch.charCodeAt(0) - 64, 0) - 1, row: Number(row) }
}

/* The row of a form sheet where a run of headings starts in column A (their compiled table, or the DPR's activity list). */
function headingRow(cells, headings) {
  const rows = new Set(Object.keys(cells).map((r) => parseRef(r).row))
  return [...rows].sort((a, b) => a - b).find((r) => headings.length > 1 && headings.slice(0, 3).every((h, i) => norm(cells[cellRef(i, r)]) === norm(h)))
}

/*
 * A sheet the client lays out as a form (labels with their values beside them, the compiled table below):
 * their cells as they are, our lines under their compiled headings, and, for one record, its values beside
 * the labels — never over their own text.
 */
function asClientForm(fmt, sectionKey, built, record, codes) {
  const tpl = CLIENT_FORM_SHEETS[fmt.workbook]?.[built.name]
  if (!tpl) return built
  const cells = Object.fromEntries(Object.entries(tpl.cells).map(([k, v]) => [k, asCode(v)]))
  const compiled = headingRow(cells, built.header)
  if (compiled) built.rows.forEach((r, i) => r.forEach((v, j) => v !== '' && v != null && (cells[cellRef(j, compiled + 1 + i)] = v)))
  if (record) {
    const fields = fieldsOf(record)
    const stat = (label) => (built.spec.columns ?? []).find((c) => Array.isArray(c) && c[1]?.startsWith('@') && norm(c[0]) === norm(label))?.[1].slice(1)
    Object.entries(tpl.cells).forEach(([ref, label]) => {
      const { col, row } = parseRef(ref)
      if (compiled && row >= compiled) return
      const fld = fmt.header.find((f) => norm(f.col) === norm(label))
      const s = !fld && stat(label)
      if (!fld && !s) return
      const value = fld ? bound(fld, record) ?? fields[fld.id] : recordStat(sectionKey, record, s)
      const target = cellRef(col + 1, row)
      if (tpl.cells[target] === undefined && value !== '' && value != null) cells[target] = asCode(value)
    })
    // A list kept on the form itself (the DPR's activities): the record's rows under those headings.
    fmt.tables.forEach((t) => {
      const heads = t.columns.filter((c) => !c.inherit).map((c) => c.col)
      const at = headingRow(tpl.cells, heads)
      if (!at || at === compiled) return
      const cols = heads.map((h, j) => ({ j, fld: t.columns.find((c) => c.col === h) })).filter(({ j }) => norm(tpl.cells[cellRef(j, at)]) === norm(heads[j]))
      rowsOf(record, t.key).forEach((r, i) => cols.forEach(({ j, fld }) => r[fld.id] !== '' && r[fld.id] != null && (cells[cellRef(j, at + 1 + i)] = asCode(r[fld.id]))))
    })
  }
  return { name: built.name, cells, merges: tpl.merges, widths: tpl.widths, validations: tpl.validations.map((v) => ({ ref: v.ref, formula: codes.remap(v.formula) })) }
}

/*
 * The client's workbook for a section. A workbook the client keeps as one file but the app splits into
 * sections (CORE DRILL_LOG_SAMPLE: DPR, collar and survey, logging) comes out whole, every sheet in their
 * order, the other sections' sheets from `related`. Given `record`, its forms are filled in.
 */
export function buildWorkbook(sectionKey, records, { record, related = [] } = {}) {
  const fmt = formatOf(sectionKey)
  if (!fmt) return null
  const family = Object.entries(FIELD_FORMATS).filter(([, f]) => f.workbook === fmt.workbook)
  const whole = { ...fmt, header: family.flatMap(([, f]) => f.header), tables: family.flatMap(([, f]) => f.tables), sheets: family.flatMap(([, f]) => f.sheets) }
  const codes = codesSheet(whole)
  const bySheet = new Map()
  family.forEach(([key, f]) => {
    const recs = key === sectionKey ? records : related.filter((r) => r.section === key)
    tableSheets(f, key, recs, codes).forEach((built) => bySheet.set(built.name, asClientForm(f, key, built, key === sectionKey ? record : null, codes)))
  })
  const strip = ({ spec: _spec, ...sheet }) => sheet
  if (sectionKey === 'dispatch-database') {
    // The client's order: the letter and the two forms (filled for one batch, else empty), Code, then the batches.
    const forms = dispatchFormSheets(record).map((f) => ({ ...f, validations: f.validations.map((v) => ({ ref: v.ref, formula: codes.remap(v.formula) })) }))
    return [...forms, codes.sheet, strip(bySheet.get(' sample dashbaord ouput'))]
  }
  const order = Object.keys(CLIENT_SHEET_HEADINGS[fmt.workbook] ?? {})
  const named = order.length ? order.map((n) => bySheet.get(n)).filter(Boolean) : [...bySheet.values()]
  return [...named.map(strip), codes.sheet]
}

/* One record in the client's workbook, its forms filled in. */
export function downloadRecordWorkbook(record) {
  const fmt = formatOf(record.section)
  const sheets = buildWorkbook(record.section, [record], { record })
  if (!sheets) return false
  const name = fmt.summary?.id ? fieldsOf(record)[fmt.summary.id] : ''
  downloadBlob(workbookBlob(sheets), `${fmt.workbook}_${name || record.id}.xlsx`)
  return true
}

export function downloadSectionWorkbook(section, records, related = []) {
  const sheets = buildWorkbook(section.key, records, { related })
  if (!sheets) return false
  const fmt = formatOf(section.key)
  const stamp = new Date().toISOString().slice(0, 10)
  downloadBlob(workbookBlob(sheets), `${fmt.workbook}_${stamp}.xlsx`)
  return true
}
