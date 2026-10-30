import { useMemo, useState } from 'react'
import { AlertCircle, ListChecks, Shuffle } from 'lucide-react'
import { codeLabel } from '../data/fieldFormats'
import { getFieldSectionByKey } from '../data/fieldDatabase'
import { kindTone } from '../utils/formatRows'
import { BATCH_NOTE, DATA_TYPE_SECTIONS, MAX_BATCH, QC_RULES, buildBatch, dispatchedSamples, fieldNumber, maxOrdinary, nextSeriesStart, sampleRegister, seriesOf } from '../utils/dispatch'

/*
 * Sample details of a dispatch: the samples of the chosen data type that have not gone to a lab
 * yet, and the batch built from the ticked ones with the QC samples in their places.
 */
export function DispatchBatch({ fields, rows, onRowsChange, projectId, records, recordId }) {
  const fitsInBatch = useMemo(() => maxOrdinary(), [])
  const sent = useMemo(() => dispatchedSamples(records, recordId), [records, recordId])
  const available = useMemo(() => {
    const sections = DATA_TYPE_SECTIONS[fields.DATA_TYPE] ?? []
    // Ordinary samples only: duplicates and standards are put in by the QC rules.
    return sampleRegister(records).filter((s) => sections.includes(s.section) && (!projectId || s.projectId === projectId) && (!s.cat || s.cat === 'ORD'))
  }, [records, fields.DATA_TYPE, projectId])

  const [picked, setPicked] = useState(() => new Set(rows.filter((r) => r.QC === 'Ordinary').map(fieldNumber)))
  const [error, setError] = useState('')

  const free = available.filter((s) => !sent.has(s.number))
  const toggle = (num) => {
    const next = new Set(picked)
    if (next.has(num)) next.delete(num)
    else next.add(num)
    setPicked(next)
  }
  const allPicked = free.length > 0 && free.every((s) => picked.has(s.number))

  const build = () => {
    const ordinary = free.filter((s) => picked.has(s.number))
    if (!ordinary.length) {
      setError('Tick the samples that go in this batch.')
      return
    }
    // Rebuilt, a batch keeps the running numbers it started with; a new one carries on from the project's last batch.
    const own = rows[0]?.SAMPLE_NUMBER?.startsWith(`${projectId}/`) ? seriesOf(rows[0].SAMPLE_NUMBER) : null
    const start = own ?? nextSeriesStart(records, projectId, recordId)
    const batch = buildBatch(ordinary, { crm: fields.CRM, pulpBlank: fields.PULP_BLANK, rockBlank: fields.ROCK_BLANK, projectCode: projectId, start })
    if (batch.length > MAX_BATCH) {
      setError(`That makes ${batch.length} samples with QC. A batch can hold ${MAX_BATCH}, so tick ${fitsInBatch} or fewer and send the rest in the next batch.`)
      return
    }
    setError('')
    onRowsChange(batch)
  }

  const counts = rows.reduce((t, r) => ({ ...t, [r.QC]: (t[r.QC] ?? 0) + 1 }), {})

  return (
    <section className="ff-table">
      <header className="ff-table-head">
        <h3>
          Sample details <span className="ff-count">{rows.length} / {MAX_BATCH}</span>
        </h3>
      </header>

      {!fields.DATA_TYPE ? (
        <p className="ff-empty">Choose the data type above to see its samples.</p>
      ) : (
        <div className="ff-dispatch">
          <div className="ff-pick">
            <div className="ff-pick-head">
              <label className="ff-check">
                <input type="checkbox" checked={allPicked} disabled={!free.length} onChange={() => setPicked(allPicked ? new Set() : new Set(free.map((s) => s.number)))} />
                <span>
                  {free.length} {fields.DATA_TYPE.toLowerCase()} sample{free.length === 1 ? '' : 's'} not yet sent
                </span>
              </label>
              <span className="ff-muted">{picked.size} ticked · up to {fitsInBatch} fit in one batch</span>
            </div>
            {free.length === 0 ? (
              <p className="ff-empty">Every recorded {fields.DATA_TYPE.toLowerCase()} sample of this project is already in a batch.</p>
            ) : (
              <ul className="ff-pick-list">
                {free.map((s) => (
                  <li key={s.number}>
                    <label className="ff-check">
                      <input type="checkbox" checked={picked.has(s.number)} onChange={() => toggle(s.number)} />
                      <span className="fd-mono">{s.number}</span>
                      <span className="ff-muted">
                        {s.type ? codeLabel('SAMPLE_TYPE_CORE', s.type) : getFieldSectionByKey(s.section)?.shortTitle} · {s.recordId}
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
            )}
            {sent.size > 0 && available.some((s) => sent.has(s.number)) && (
              <p className="ff-muted ff-small">{available.filter((s) => sent.has(s.number)).length} already sent in other batches are left out.</p>
            )}
            <div className="ff-pick-foot">
              <button type="button" className="btn-primary" onClick={build}>
                <Shuffle size={15} /> Build batch with QC samples
              </button>
              <details className="ff-rules">
                <summary>
                  <ListChecks size={14} /> QC rules
                </summary>
                <ul>
                  <li>{BATCH_NOTE}</li>
                  {QC_RULES.map((r) => (
                    <li key={r.kind}>
                      <strong>{r.title}:</strong> {r.rule}
                    </li>
                  ))}
                </ul>
              </details>
            </div>
            {error && (
              <p className="fd-error-msg ff-row-gap">
                <AlertCircle size={14} /> {error}
              </p>
            )}
          </div>

          {rows.length > 0 && (
            <div className="ff-batch">
              <div className="ff-chips">
                {Object.entries(counts).map(([kind, count]) => (
                  <span key={kind} className={`ff-kind ff-kind-${kindTone(kind)}`}>
                    {kind} <b>{count}</b>
                  </span>
                ))}
              </div>
              <div className="fd-table-wrap ff-batch-wrap">
                <table className="fd-table ff-rows">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Sample number</th>
                      <th>Field sample no.</th>
                      <th>Kind</th>
                      <th>CRM / original</th>
                      <th>Class</th>
                      <th>Box</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r) => (
                      <tr key={r.SEQ}>
                        <td className="ff-n">{r.SEQ}</td>
                        <td className="fd-mono">{r.SAMPLE_NUMBER}</td>
                        <td className="fd-mono">{r.QC === 'Ordinary' ? fieldNumber(r) : '—'}</td>
                        <td>
                          <span className={`ff-kind ff-kind-${kindTone(r.QC)}`}>{r.QC}</span>
                        </td>
                        <td>{r.REFERENCE || '—'}</td>
                        <td>{r.CLASS}</td>
                        <td>
                          <input
                            className="fd-input ff-box-input"
                            aria-label={`Box no. of ${r.SAMPLE_NUMBER}`}
                            value={r.BOX_NO ?? ''}
                            onChange={(e) => onRowsChange(rows.map((x) => (x.SEQ === r.SEQ ? { ...x, BOX_NO: e.target.value } : x)))}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  )
}
