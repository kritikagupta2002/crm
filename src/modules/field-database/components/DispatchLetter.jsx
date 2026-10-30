import { useEffect } from 'react'
import { Printer, X } from 'lucide-react'
import { codeLabel, fieldsOf, rowsOf } from '../data/fieldFormats'
import { RESULT_ADDRESS, RESULT_MAILS, boxSummary, dispatchNumber } from '../utils/dispatch'
import { formatDate } from '../../../shared/utils/date'
import './fieldFormats.css'


/*
 * The client's DISPATCH FORMAT sheet, filled from the lab details and sample details of the batch,
 * ready to print or save as PDF and send with the boxes.
 */
export function DispatchLetter({ record, onClose }) {
  const v = fieldsOf(record)
  const samples = rowsOf(record, 'samples')
  const { rows, total } = boxSummary(samples)
  const elements = [v.ELEMENTS1, v.ELEMENTS2, v.ELEMENTS3, v.ELEMENTS4].filter(Boolean)
  const mails = [v.MAIL1, v.MAIL2, v.MAIL3].filter(Boolean).join(', ') || RESULT_MAILS

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const print = () => {
    document.body.classList.add('ff-printing')
    window.print()
    document.body.classList.remove('ff-printing')
  }

  const line = (label, value) => (
    <tr>
      <th>{label}</th>
      <td colSpan={4}>{value || '—'}</td>
    </tr>
  )

  return (
    <div className="fd-modal-backdrop" onClick={onClose}>
      <div className="fd-modal ff-letter-modal" onClick={(e) => e.stopPropagation()}>
        <div className="fd-modal-header">
          <h2 className="fd-modal-title">Dispatch letter · {v.BATCH_ID}</h2>
          <div className="ff-letter-actions">
            <button type="button" className="btn-primary" onClick={print}>
              <Printer size={15} /> Print / Save as PDF
            </button>
            <button type="button" className="fd-modal-close" onClick={onClose} aria-label="Close">
              <X size={18} />
            </button>
          </div>
        </div>
        <div className="fd-modal-body">
          <article className="ff-letter">
            <h1>Sample Dispatch, Preparation &amp; Analysis Format</h1>
            <table className="ff-letter-table">
              <tbody>
                <tr>
                  <th>Date of Dispatch:</th>
                  <td>{record.date ? formatDate(record.date) : '—'}</td>
                  <th>Batch ID:</th>
                  <td colSpan={2}>{v.BATCH_ID || '—'}</td>
                </tr>
                {line('Lab Details:', v.LAB)}
                {line('Name of Receiver:', v.LAB_OWNER)}
                {line('Address:', v.LAB_ADDRESS)}
                {line('Mobile No/Phone No:', v.LAB_CONTACT)}
                {line('Mail Id:', v.LAB_MAIL)}
                {line('Dispatch No:', dispatchNumber(v, record.date))}
                {line('Batch Owner Name:', v.BATCH_OWNER)}
                {line('Owner Address:', v.SENDER_ADDRESS)}
                {line('Mobile No/Phone No:', v.SENDER_CONTACT)}
                {line('Mail Id:', v.SENDER_MAIL)}
                {line('Courier Name:', v.COURIER)}
                {line('Analysis for:', elements.map((e) => codeLabel('ELEMENT', e)).join('; '))}
                <tr className="ff-letter-section">
                  <th colSpan={5}>Sample Details:</th>
                </tr>
                <tr className="ff-letter-grid-head">
                  <th>Box No</th>
                  <th>Half Core</th>
                  <th>Rock Chip</th>
                  <th>Pulp</th>
                  <th>Total</th>
                </tr>
                {rows.map((r) => (
                  <tr key={r.box} className="ff-letter-grid">
                    <td>{r.box}</td>
                    <td>{r['Half Core'] || ''}</td>
                    <td>{r['Rock Chip'] || ''}</td>
                    <td>{r.Pulp || ''}</td>
                    <td>{r.total}</td>
                  </tr>
                ))}
                <tr className="ff-letter-grid ff-letter-total">
                  <td>Grand Total</td>
                  <td>{total['Half Core'] || ''}</td>
                  <td>{total['Rock Chip'] || ''}</td>
                  <td>{total.Pulp || ''}</td>
                  <td>{total.total}</td>
                </tr>
                {line('Sample Preparation (Y/N)', v.SAMPLE_PREPARATION)}
                {line('Pulp Send to Owner (Y/N)', v.PULP_RETURN)}
                {line('Result in Digital format to:', mails)}
                {line('Result in Hard Copy and Invoice to:', RESULT_ADDRESS)}
              </tbody>
            </table>
            <div className="ff-letter-sign">
              <span>Project Manager</span>
              <span>Geologist</span>
            </div>

            {samples.length > 0 && (
              <section className="ff-letter-annex">
                <h2>Sample list · {record.projectName}</h2>
                <table className="ff-letter-table ff-letter-list">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Sample number</th>
                      <th>Field sample no.</th>
                      <th>Sample / QC</th>
                      <th>CRM / original</th>
                      <th>Class</th>
                      <th>Box</th>
                    </tr>
                  </thead>
                  <tbody>
                    {samples.map((s) => (
                      <tr key={s.SEQ}>
                        <td>{s.SEQ}</td>
                        <td>{s.SAMPLE_NUMBER}</td>
                        <td>{s.FIELD_SAMPLE || ''}</td>
                        <td>{s.QC}</td>
                        <td>{s.REFERENCE}</td>
                        <td>{s.CLASS}</td>
                        <td>{s.BOX_NO}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>
            )}
          </article>
        </div>
      </div>
    </div>
  )
}
