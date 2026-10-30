import { Copy, Plus, Trash2 } from 'lucide-react'
import { fieldLabel, withCalcs } from '../data/fieldFormats'
import { FormatInput } from './FormatFields'
import { applyChange, rowColumns } from '../utils/formatRows'

/* A part holds at most this many columns, so every part fits the width without scrolling sideways. */
const MAX_PART = 8

const heading = (c) => c.col ?? fieldLabel(c)

/* A row's own date is picked from a calendar. */
const asInput = (c) => (c.bind === 'date' ? { ...c, type: 'date' } : c)

/*
 * The columns in the order of the client's sheet, cut into equal runs of at most MAX_PART. A part is
 * named after its first and last heading (FROM – MINERAL2): the client's sheet has no parts of its own.
 */
function partsOf(columns) {
  const cols = rowColumns(columns).map(asInput)
  const count = Math.ceil(cols.length / MAX_PART)
  const size = Math.ceil(cols.length / count)
  return Array.from({ length: count }, (_, i) => {
    const part = cols.slice(i * size, (i + 1) * size)
    return { name: count > 1 ? `${heading(part[0])} – ${heading(part.at(-1))}` : '', cols: part }
  })
}

/*
 * Repeating rows of a format, filled in under the client's headings in their order, cut into parts
 * one below the other instead of one long line: each part lists every row (#1, #2 ...) with its
 * columns, so nothing needs scrolling sideways.
 */
export function FormatTable({ table, rows, onChange, header, recordDate, geologist }) {
  const parts = partsOf(table.columns)

  const newRow = (copyFrom) => {
    const row = copyFrom ? { ...copyFrom } : {}
    rowColumns(table.columns).forEach((c) => {
      if (!copyFrom && c.defaultFrom) row[c.id] = c.defaultFrom === 'date' ? recordDate ?? '' : header[c.defaultFrom] ?? ''
      // A row's date and geologist start as the record's; they can be changed row by row, as on the client's sheet.
      if (!copyFrom && c.bind === 'date') row[c.id] = recordDate ?? ''
      if (!copyFrom && c.bind === 'geologist') row[c.id] = geologist ?? ''
    })
    const last = rows.at(-1)
    if (table.continues && last && last.TO !== '' && last.TO != null) {
      row.FROM = last.TO
      if (copyFrom) row.TO = ''
    }
    // A copied row keeps the geology but not the sample number, which must stay unique.
    if (copyFrom) table.columns.filter((c) => c.key || c.sample).forEach((c) => (row[c.id] = ''))
    return row
  }

  const add = (copyFrom) => {
    onChange([...rows, newRow(copyFrom)])
  }
  const update = (i, id, value) => onChange(rows.map((r, n) => (n === i ? applyChange(table.columns, r, id, value) : r)))
  const remove = (i) => onChange(rows.filter((_, n) => n !== i))

  return (
    <section className="ff-table">
      <header className="ff-table-head">
        <h3>
          {table.title} <span className="ff-count">{rows.length}</span>
        </h3>
        {table.add && (
          <button type="button" className="fd-btn-action" onClick={() => add()}>
            <Plus size={14} /> {table.add}
          </button>
        )}
      </header>

      {rows.length === 0 ? (
        <p className="ff-empty">No rows yet.</p>
      ) : (
        <div className="ff-parts">
          {parts.map((part, p) => (
            <div key={part.name || 'all'} className="ff-part">
              {part.name && <h4 className="ff-part-title">{part.name}</h4>}
              <table className="ff-sheet">
                <colgroup>
                  <col style={{ width: 44 }} />
                  {part.cols.map((c) => (
                    <col key={c.id} />
                  ))}
                  {p === 0 && <col style={{ width: 76 }} />}
                </colgroup>
                <thead>
                  <tr>
                    <th>#</th>
                    {part.cols.map((c) => (
                      <th key={c.id} title={heading(c)}>
                        {heading(c)}
                        {c.calc && <span className="ff-auto">auto</span>}
                      </th>
                    ))}
                    {p === 0 && <th aria-label="Actions" />}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((raw, i) => {
                    const row = withCalcs(table.columns, raw)
                    return (
                      <tr key={i}>
                        <td className="ff-n">{i + 1}</td>
                        {part.cols.map((c) => (
                          <td key={c.id}>
                            <FormatInput fld={c} value={row[c.id]} compact idPrefix={`${table.key}-${i}`} onChange={(v) => update(i, c.id, v)} />
                          </td>
                        ))}
                        {p === 0 && (
                          <td className="ff-row-actions">
                            {table.add && (
                              <button type="button" className="ff-icon" title="Copy this row below" onClick={() => add(raw)}>
                                <Copy size={14} />
                              </button>
                            )}
                            <button type="button" className="ff-icon danger" title="Remove row" onClick={() => remove(i)}>
                              <Trash2 size={14} />
                            </button>
                          </td>
                        )}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
