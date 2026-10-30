import { CLIENT_SHEET_HEADINGS } from '../data/clientSheetHeadings'
import { codeList, fieldLabel } from '../data/fieldFormats'

/* Helpers shared by the format form, its rows and the dispatch batch. */

/* The "+ Add new…" entry at the end of a dropdown. */
export const ADD_NEW = '__add_new__'

/* Fields the person fills in: not the ones taken from the record or from the header above. */
export const editable = (fields) => fields.filter((f) => !f.bind && !f.inherit)

/* The columns of a row as the client's sheet has them: a row's own date and geologist included, the header's values (BHID ...) and the project left out. */
export const rowColumns = (columns) => columns.filter((f) => !f.inherit && f.bind !== 'project')

/* A field under the client's own heading. */
export const heading = (fld) => fld.col ?? fieldLabel(fld)

const norm = (s) => String(s ?? '').replace(/\s+/g, ' ').trim().replace(/:$/, '').trim().toUpperCase()

/* Fields in the order the client's sheets show them (row by row, left to right); any the client has not got go last. */
export function inClientOrder(fmt, fields) {
  const sheets = CLIENT_SHEET_HEADINGS[fmt.workbook] ?? {}
  const headings = fmt.sheets.flatMap((s) => sheets[s.name] ?? [])
  const at = (f) => {
    const i = headings.indexOf(norm(f.col))
    return i < 0 ? Infinity : i
  }
  return fields.map((f, i) => [f, i]).sort((a, b) => at(a[0]) - at(b[0]) || a[1] - b[1]).map(([f]) => f)
}

/* Picking a code also fills the fields it describes (ROCK_CODE → ROCK_TYPE). */
export function applyChange(fields, values, id, value) {
  const fld = fields.find((f) => f.id === id)
  const next = { ...values, [id]: value }
  if (fld?.fill && fld.type === 'code') {
    const picked = codeList(fld.list).find((c) => c.code === value)
    Object.entries(fld.fill).forEach(([target, what]) => {
      next[target] = picked ? picked[what] ?? '' : ''
    })
  }
  return next
}

const KIND_TONE = {
  Ordinary: 'ord',
  'Rock blank': 'blank',
  'Pulp blank': 'blank',
  CRM: 'crm',
  'Pulp duplicate': 'dup',
  'Coarse reject duplicate': 'dup',
}

export const kindTone = (kind) => KIND_TONE[kind] ?? 'ord'
