import { useMemo, useState } from 'react'
import { AlertCircle, ClipboardPaste, FlaskConical, Save, X } from 'lucide-react'
import { useCrm } from '../../../core/permissions/crm'
import { toISODate } from '../../../shared/utils/date'
import { codeList, fieldsOf, rowsOf } from '../data/fieldFormats'
import { fieldNumber } from '../utils/dispatch'
import { kindTone } from '../utils/formatRows'
import { ELEMENTS, allChecks, batchQaqc, parseResults, qaqcRows, resultsOf } from '../utils/qaqc'

const VERDICT = { pass: 'Within 95–105%', fail: 'Outside 95–105%', open: 'Rule awaited' }

/*
 * The lab's results for one batch, typed in or pasted from their sheet. A pulp duplicate shows the
 * client's 95–105 % check as the numbers go in. The lab status is chosen here by the user.
 */
export function QaqcResultsModal({ batch, onClose, onSaved }) {
  const { updateFieldRecord, crmValues } = useCrm()
  const samples = rowsOf(batch, 'samples')
  const [results, setResults] = useState(() => structuredClone(resultsOf(batch)))
  const [pasteOpen, setPasteOpen] = useState(!Object.keys(resultsOf(batch)).length)
  const [pasted, setPasted] = useState('')
  const [note, setNote] = useState(null)
  const [error, setError] = useState('')
  const [status, setStatus] = useState(fieldsOf(batch).STATUS || 'Pending')
  const [resultsOn, setResultsOn] = useState(fieldsOf(batch).RESULT_RECEIVED || '')

  const draft = useMemo(() => ({ ...batch, data: { ...batch.data, results } }), [batch, results])
  const check = useMemo(() => batchQaqc(draft, crmValues), [draft, crmValues])
  const verdicts = useMemo(() => new Map(allChecks(qaqcRows([draft], crmValues)).map((c) => [c.sampleNo, c])), [draft, crmValues])

  const setValue = (sample, element, value) =>
    setResults((r) => {
      const next = { ...r, [sample]: { ...(r[sample] ?? {}) } }
      if (value === '') delete next[sample][element]
      else next[sample][element] = Number(value)
      return next
    })

  // The lab may list the tubes by the running number or by the field number.
  const byNumber = new Map(samples.flatMap((s) => [[s.SAMPLE_NUMBER.toUpperCase(), s.SAMPLE_NUMBER], ...(s.FIELD_SAMPLE ? [[s.FIELD_SAMPLE.toUpperCase(), s.SAMPLE_NUMBER]] : [])]))
  const applyPaste = () => {
    const { results: found, unknown } = parseResults(pasted, (n) => byNumber.get(String(n || '').trim().toUpperCase()))
    const count = Object.keys(found).length
    if (!count) {
      setNote({ bad: true, text: 'No line matched a sample of this batch. Each line needs the sample number, then Zn, Pb and Ag.' })
      return
    }
    setResults((r) => ({ ...r, ...Object.fromEntries(Object.entries(found).map(([k, v]) => [k, { ...(r[k] ?? {}), ...v }])) }))
    setNote({ bad: unknown.length > 0, text: `${count} sample${count === 1 ? '' : 's'} filled.${unknown.length ? ` Not in this batch: ${unknown.slice(0, 4).join(', ')}${unknown.length > 4 ? '…' : ''}.` : ''}` })
    setPasted('')
    setPasteOpen(false)
  }

  const save = () => {
    setError('')
    const fields = fieldsOf(batch)
    const clean = Object.fromEntries(Object.entries(results).filter(([, v]) => Object.keys(v).length))
    const nextFields = { ...fields, RESULT_COUNT: check.withResult, RESULT_RECEIVED: resultsOn, STATUS: status }
    try {
      updateFieldRecord(batch.id, { data: { results: clean, fields: nextFields } })
      onSaved?.(status)
      onClose()
    } catch (err) {
      setError(err.message || 'Unable to save the results.')
    }
  }

  const v = fieldsOf(batch)
  return (
    <div className="fd-modal-backdrop" onClick={onClose}>
      <div className="fd-modal ff-modal" onClick={(e) => e.stopPropagation()}>
        <div className="fd-modal-header">
          <div className="fd-header-titles">
            <h2 className="fd-modal-title">Lab results · {v.BATCH_ID || batch.id}</h2>
            <span className="ff-format-name">
              <FlaskConical size={13} /> {v.LAB} · {batch.projectName} · {samples.length} samples
            </span>
          </div>
          <button type="button" className="fd-modal-close" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className="fd-modal-body">
          {error && (
            <div className="fd-notice-banner ff-banner-error">
              <AlertCircle size={18} />
              <div>{error}</div>
            </div>
          )}

          <div className="qa-paste">
            <button type="button" className="btn-secondary" onClick={() => setPasteOpen((o) => !o)}>
              <ClipboardPaste size={15} /> Paste from the lab's sheet
            </button>
            {note && <span className={`qa-note${note.bad ? ' bad' : ''}`}>{note.text}</span>}
            {pasteOpen && (
              <div className="qa-paste-box">
                <textarea
                  className="fd-input"
                  rows={5}
                  value={pasted}
                  onChange={(e) => setPasted(e.target.value)}
                  placeholder={'Copy the columns from Excel and paste here:\nSample No    Zn    Pb    Ag\n' + `${samples[1]?.SAMPLE_NUMBER ?? 'BGSPL01/002'}    1345    698    12`}
                />
                <button type="button" className="btn-primary" disabled={!pasted.trim()} onClick={applyPaste}>
                  Fill results
                </button>
              </div>
            )}
          </div>

          <div className="qa-summary">
            <span>
              <b>{check.withResult}</b> of {check.total} with results
            </span>
            {check.dupPass > 0 && <span className="qa-verdict qa-pass">{check.dupPass} duplicate within 95–105%</span>}
            {check.dupFail > 0 && <span className="qa-verdict qa-fail">{check.dupFail} duplicate outside 95–105%</span>}
          </div>

          <div className="qa-status-row">
            <div className="fd-field">
              <label className="fd-label" htmlFor="qa-results-on">
                Results received on
              </label>
              <input id="qa-results-on" type="date" className="fd-input" value={resultsOn} onChange={(e) => setResultsOn(e.target.value)} />
              {!resultsOn && check.withResult > 0 && (
                <button type="button" className="link-button qa-today" onClick={() => setResultsOn(toISODate(new Date()))}>
                  Today
                </button>
              )}
            </div>
            <div className="fd-field">
              <label className="fd-label" htmlFor="qa-status">
                Lab status
              </label>
              <select id="qa-status" className="fd-select" value={status} onChange={(e) => setStatus(e.target.value)}>
                {codeList('STATUS').map((o) => (
                  <option key={o.code}>{o.code}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="fd-table-wrap qa-entry-wrap">
            <table className="fd-table ff-rows qa-entry">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Sample no.</th>
                  <th>Kind</th>
                  {ELEMENTS.map((e) => (
                    <th key={e}>{e} (ppm)</th>
                  ))}
                  <th>Check</th>
                </tr>
              </thead>
              <tbody>
                {samples.map((s) => {
                  const c = verdicts.get(s.SAMPLE_NUMBER)
                  return (
                    <tr key={s.SAMPLE_NUMBER}>
                      <td className="ff-n">{s.SEQ}</td>
                      <td>
                        <span className="fd-mono">{s.SAMPLE_NUMBER}</span>
                        {s.QC === 'Ordinary' ? <small className="qa-sub">{fieldNumber(s)}</small> : s.REFERENCE && <small className="qa-sub">{s.QC === 'CRM' ? s.REFERENCE : `of ${s.REFERENCE}`}</small>}
                      </td>
                      <td>
                        <span className={`ff-kind ff-kind-${kindTone(s.QC)}`}>{s.QC}</span>
                      </td>
                      {ELEMENTS.map((e) => (
                        <td key={e}>
                          <input
                            className={`fd-input qa-num${c?.el[e].verdict === 'fail' ? ' qa-bad' : ''}`}
                            type="number"
                            step="any"
                            min="0"
                            aria-label={`${e} of ${s.SAMPLE_NUMBER}`}
                            value={results[s.SAMPLE_NUMBER]?.[e] ?? ''}
                            onChange={(ev) => setValue(s.SAMPLE_NUMBER, e, ev.target.value)}
                          />
                        </td>
                      ))}
                      <td>{c && VERDICT[c.verdict] ? <span className={`qa-verdict qa-${c.verdict}`}>{VERDICT[c.verdict]}</span> : c ? <span className="ff-muted">—</span> : ''}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="fd-modal-footer ff-footer">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="btn-primary" onClick={save}>
            <Save size={15} /> Save results
          </button>
        </div>
      </div>
    </div>
  )
}
