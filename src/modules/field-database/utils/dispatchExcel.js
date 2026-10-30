import { CLIENT_FORM_SHEETS } from '../data/clientFormSheets'

const CLIENT_DISPATCH_FORMS = CLIENT_FORM_SHEETS['SAMPLE DISPATCH']
import { bound, fieldsOf, formatOf, rowsOf } from '../data/fieldFormats'
import { formatDate } from '../../../shared/utils/date'
import { RESULT_MAILS, boxSummary, dispatchNumber } from './dispatch'

/*
 * The client's SAMPLE DISPATCH form sheets, laid out cell for cell as in their workbook: the letter
 * (DISPATCH FORMAT) and the two forms (LAB DETAILS DISPATCH, Sample details). Given a batch they are
 * filled from it, each value in the cell right of its label; without one they are the empty forms.
 */

const norm = (s) => String(s ?? '').replace(/\s+/g, ' ').trim().replace(/:$/, '').trim().toUpperCase()
const asCell = (v) => (typeof v === 'string' && /^-?\d+(\.\d+)?$/.test(v) ? Number(v) : v)
const split = (ref) => {
  const [, col, row] = /^([A-Z]+)(\d+)$/.exec(ref)
  return { col, row: Number(row) }
}
const nextCol = (col) => String.fromCharCode(col.charCodeAt(col.length - 1) + 1)

/* A value goes in the cell right of its label, never over the client's own text there (the QC rules) — only over their "(Today)". */
function put(t, name, ref, value) {
  const own = CLIENT_DISPATCH_FORMS[name].cells[ref]
  if (own !== undefined && own !== '(Today)') return
  t.cells[ref] = asCell(value)
}

function template(name) {
  const t = CLIENT_DISPATCH_FORMS[name]
  return { cells: Object.fromEntries(Object.entries(t.cells).map(([k, v]) => [k, asCell(v)])), merges: [...t.merges], widths: [...t.widths], validations: t.validations.map((v) => ({ ...v })) }
}

/* What a batch holds under one of the client's labels ("Lab:", "Peroject:" ...). */
function valueFor(batch, label) {
  const fmt = formatOf('dispatch-database')
  const key = norm(label) === 'PEROJECT' ? 'PROJECT' : norm(label)
  const fld = fmt.header.find((f) => norm(f.col) === key)
  if (!fld) return undefined
  return bound(fld, batch) ?? fieldsOf(batch)[fld.id] ?? ''
}

function labDetails(batch) {
  const t = template('LAB DETAILS DISPATCH')
  if (batch) {
    Object.entries(CLIENT_DISPATCH_FORMS['LAB DETAILS DISPATCH'].cells).forEach(([ref, label]) => {
      const v = valueFor(batch, label)
      if (v === undefined) return
      const { col, row } = split(ref)
      put(t, 'LAB DETAILS DISPATCH', `${nextCol(col)}${row}`, v)
    })
  }
  return { name: 'LAB DETAILS DISPATCH', ...t }
}

function sampleDetails(batch) {
  const t = template('Sample details')
  if (batch) {
    // Their example numbers (1–9 under SAMPLES:, the counts in column O) make way for the batch's own.
    Object.keys(t.cells).forEach((ref) => {
      const { col } = split(ref)
      if (col === 'H' || col === 'O') delete t.cells[ref]
    })
    Object.entries(CLIENT_DISPATCH_FORMS['Sample details'].cells).forEach(([ref, label]) => {
      const { col, row } = split(ref)
      if (norm(label) === 'SAMPLES') {
        rowsOf(batch, 'samples').forEach((s, i) => (t.cells[`${nextCol(col)}${row + i}`] = s.SAMPLE_NUMBER))
        return
      }
      const v = valueFor(batch, label)
      if (v !== undefined) put(t, 'Sample details', `${nextCol(col)}${row}`, v)
    })
  }
  return { name: 'Sample details', ...t }
}

/* The letter: each value after its label, the box table growing past their four rows when a batch has more boxes. */
function dispatchFormat(batch) {
  const t = template('DISPATCH FORMAT')
  t.bold = ['A1', 'A23', 'B23', 'C23', 'D23', 'E23', 'A28']
  if (!batch) return { name: 'DISPATCH FORMAT', ...t }
  const v = fieldsOf(batch)
  const after = (ref, value) => value && (t.cells[ref] = `${t.cells[ref]} ${value}`)
  after('A3', batch.date && formatDate(batch.date))
  after('D3', v.BATCH_ID)
  after('A4', v.LAB)
  after('A5', v.LAB_OWNER)
  after('A6', v.LAB_ADDRESS)
  after('A10', v.LAB_CONTACT)
  after('A11', v.LAB_MAIL)
  t.cells.A12 = `Dispatch No: ${dispatchNumber(v, batch.date)}`
  after('A13', v.BATCH_OWNER)
  after('A14', v.SENDER_ADDRESS)
  after('A18', v.SENDER_CONTACT)
  after('A19', v.SENDER_MAIL)
  after('A20', v.COURIER)
  after('A21', [v.ELEMENTS1, v.ELEMENTS2, v.ELEMENTS3, v.ELEMENTS4].filter(Boolean).join('; '))

  const { rows, total } = boxSummary(rowsOf(batch, 'samples'))
  const extra = Math.max(0, rows.length - 4)
  const move = (ref) => {
    const { col, row } = split(ref)
    return row >= 28 ? `${col}${row + extra}` : ref
  }
  t.cells = Object.fromEntries(Object.entries(t.cells).map(([k, val]) => [move(k), val]))
  t.merges = t.merges.map((m) => m.split(':').map(move).join(':'))
  t.bold = t.bold.map(move)
  rows.forEach((r, i) => {
    const n = 24 + i
    ;[r.box, r['Half Core'] || '', r['Rock Chip'] || '', r.Pulp || '', r.total].forEach((val, j) => (t.cells[`${'ABCDE'[j]}${n}`] = asCell(String(val))))
  })
  const g = 28 + extra
  ;[total['Half Core'] || '', total['Rock Chip'] || '', total.Pulp || '', total.total].forEach((val, j) => (t.cells[`${'BCDE'[j]}${g}`] = val))
  t.cells[`B${29 + extra}`] = v.SAMPLE_PREPARATION || ''
  t.cells[`B${30 + extra}`] = v.PULP_RETURN || ''
  t.cells[`B${31 + extra}`] = [v.MAIL1, v.MAIL2, v.MAIL3].filter(Boolean).join(', ') || RESULT_MAILS
  return { name: 'DISPATCH FORMAT', ...t }
}

/* The three form sheets, in the client's order; their Code and dashboard sheets come from the format. */
export const dispatchFormSheets = (batch) => [dispatchFormat(batch), labDetails(batch), sampleDetails(batch)]
