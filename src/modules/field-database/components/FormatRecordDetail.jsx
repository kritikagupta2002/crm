import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ClipboardCheck, Download, Edit3, FileText, Printer, X } from 'lucide-react'
import { bound, codeLabel, fieldsOf, formatOf, recordStat, rowsOf, withCalcs } from '../data/fieldFormats'
import { heading, inClientOrder, kindTone, rowColumns } from '../utils/formatRows'
import { DispatchLetter } from './DispatchLetter'
import { dispatchNumber } from '../utils/dispatch'
import { downloadRecordWorkbook } from '../utils/fieldExcel'

const blank = (v) => v === '' || v == null

function shown(fld, v) {
  if (blank(v)) return '—'
  if (fld.type === 'code') return codeLabel(fld.list, v)
  return String(v)
}

/* A record in the client's format: its values in the order of the client's sheet, under their headings, then every row. */
export function FormatRecordDetail({ record, section, onClose, onEdit, canEdit }) {
  const fmt = formatOf(section.key)
  const values = fieldsOf(record)
  const [letter, setLetter] = useState(false)
  const isDispatch = section.key === 'dispatch-database'

  const filled = inClientOrder(fmt, fmt.header.filter((fld) => !fld.bind && !blank(values[fld.id])))

  return (
    <>
    <div className="fd-modal-backdrop" onClick={onClose}>
      <div className="fd-modal ff-modal" onClick={(e) => e.stopPropagation()}>
        <div className="fd-modal-header">
          <div className="fd-header-titles">
            <div className="fd-header-top">
              <h2 className="fd-modal-title">
                <span className="fd-mono">{record.id}</span>
              </h2>
              <span className={`fd-status-pill ${record.status === 'Draft' ? 'fd-status-draft' : 'fd-status-submitted'}`}>{record.status || 'Submitted'}</span>
            </div>
            <span className="ff-format-name">
              <FileText size={13} /> {section.title} · {record.projectName} ({record.projectId}) · {record.date} · {record.employeeName}
            </span>
          </div>
          <button type="button" className="fd-modal-close" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className="fd-modal-body">
          {isDispatch && (
            <div className="ff-dispatch-strip">
              <div>
                <span className="ff-muted">Dispatch no.</span>
                <strong className="fd-mono">{dispatchNumber(values, record.date)}</strong>
              </div>
              <div>
                <span className="ff-muted">Samples</span>
                <strong>
                  {recordStat(section.key, record, 'ordinary')} + {recordStat(section.key, record, 'qc')} QC
                </strong>
              </div>
              <div>
                <span className="ff-muted">Lab status</span>
                <strong>{values.STATUS || 'Pending'}</strong>
              </div>
              <Link to={`/field-database/qaqc?batch=${record.id}`} className="btn-secondary">
                <ClipboardCheck size={15} /> QAQC
              </Link>
              <button type="button" className="btn-primary" onClick={() => setLetter(true)}>
                <Printer size={15} /> Dispatch letter
              </button>
            </div>
          )}

          {filled.length > 0 && (
            <section className="ff-detail-group">
              <dl className="ff-dl">
                {filled.map((fld) => (
                  <div key={fld.id} className={fld.type === 'textarea' ? 'ff-wide' : ''}>
                    <dt>{heading(fld)}</dt>
                    <dd>{shown(fld, values[fld.id])}</dd>
                  </div>
                ))}
              </dl>
            </section>
          )}

          {fmt.tables.map((table) => {
            const rows = rowsOf(record, table.key).map((r) => withCalcs(table.columns, r))
            const cols = rowColumns(table.columns).filter((c) => rows.some((r) => !blank(r[c.id])))
            return (
              <section key={table.key} className="ff-detail-group">
                <h3>
                  {table.title} <span className="ff-count">{rows.length}</span>
                </h3>
                {rows.length === 0 ? (
                  <p className="ff-empty">None recorded.</p>
                ) : (
                  <div className="fd-table-wrap ff-detail-table">
                    <table className="fd-table ff-rows">
                      <thead>
                        <tr>
                          <th>#</th>
                          {cols.map((c) => (
                            <th key={c.id}>{heading(c)}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((r, i) => (
                          <tr key={i}>
                            <td className="ff-n">{i + 1}</td>
                            {cols.map((c) => (
                              <td key={c.id} title={c.type === 'code' ? codeLabel(c.list, r[c.id]) : undefined}>
                                {c.id === 'QC' ? <span className={`ff-kind ff-kind-${kindTone(r.QC)}`}>{r.QC}</span> : blank(r[c.id]) ? '—' : String(r[c.id] ?? bound(c, record))}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            )
          })}

          <div className="ff-audit">
            <span>
              Created {record.createdAt ? new Date(record.createdAt).toLocaleString('en-IN') : '—'} by {record.createdBy || record.employeeName}
            </span>
            {record.updatedAt && record.updatedAt !== record.createdAt && (
              <span>
                Last updated {new Date(record.updatedAt).toLocaleString('en-IN')} by {record.updatedBy || record.createdBy}
              </span>
            )}
          </div>
        </div>

        <div className="fd-modal-footer">
          <button type="button" className="btn-secondary" title={`This record in the client's ${fmt.workbook} workbook, its forms filled in`} onClick={() => downloadRecordWorkbook(record)}>
            <Download size={15} /> Download Excel
          </button>
          <button type="button" className="btn-secondary" onClick={onClose}>
            Close
          </button>
          {canEdit && (
            <button
              type="button"
              className="btn-primary"
              onClick={() => {
                onClose()
                onEdit(record)
              }}
            >
              <Edit3 size={15} /> Edit record
            </button>
          )}
        </div>
      </div>
    </div>
    {letter && <DispatchLetter record={record} onClose={() => setLetter(false)} />}
    </>
  )
}
