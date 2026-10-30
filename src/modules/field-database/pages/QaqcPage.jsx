import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { AlertCircle, ArrowLeft, CheckCircle2, ClipboardCheck, Clock, Download, Edit3, FlaskConical, Save, X, XCircle } from 'lucide-react'
import { useAccess, useCrm } from '../../../core/permissions/crm'
import { KpiCard } from '../../../shared/components/KpiCard'
import { filterFieldRecordsByRole } from '../data/fieldDatabase'
import { fieldsOf, rowsOf } from '../data/fieldFormats'
import { BlankCharts, CrmCharts, DuplicateCharts } from '../components/QaqcCharts'
import { QaqcResultsModal } from '../components/QaqcResultsModal'
import { BLANK_EXPECTED, DUP_RANGE, ELEMENTS, QC_SHEETS, SAMPLE_TYPE, allChecks, batchQaqc, certifiedOf, downloadQaqcWorkbook, qaqcRows } from '../utils/qaqc'
import './fieldDatabase.css'
import '../components/fieldOverview.css'
import './qaqc.css'

const STATE = {
  awaiting: { label: 'Awaiting results', icon: Clock, tone: 'missing' },
  partial: { label: 'Results coming in', icon: Clock, tone: 'missing' },
  complete: { label: 'All results in', icon: CheckCircle2, tone: 'pass' },
}
const VERDICT = { pass: 'Within 95–105%', fail: 'Outside 95–105%', open: 'Rule awaited', missing: 'Awaiting' }

/* What each tab compares. Only the duplicate has a pass/fail rule from the client so far. */
const BLANK_RULE = `Lab value against the blank's Org value (Zn ${BLANK_EXPECTED.Zn}, Pb ${BLANK_EXPECTED.Pb}, Ag ${BLANK_EXPECTED.Ag} ppm). The client has not given a pass/fail limit for blanks yet.`
const RULES = {
  rockBlank: BLANK_RULE,
  pulpBlank: BLANK_RULE,
  pulpDuplicate: `% = duplicate ÷ original × 100. Acceptable between ${DUP_RANGE[0]}% and ${DUP_RANGE[1]}% (client's rule).`,
  crm: "Lab value against the certified value and its 1, 2 and 3 SD lines, as in the client's sheet. The client has not given the pass/fail rule for CRMs yet.",
}

const fmtNum = (v) => (v == null ? '—' : v)

function Verdict({ v }) {
  return <span className={`qa-verdict qa-${v}`}>{VERDICT[v]}</span>
}

/* A lab value coloured by its check. */
function LabCell({ el }) {
  return <td className={`qa-lab qa-lab-${el.verdict}`}>{fmtNum(el.lab)}</td>
}

function CheckTable({ sheetKey, rows }) {
  const dup = sheetKey === 'pulpDuplicate'
  const crm = sheetKey === 'crm'
  if (!rows.length) return <p className="fo-empty">No such samples in the batches shown.</p>
  return (
    <div className="fd-table-wrap qa-table-wrap">
      <table className="fd-table qa-table">
        <thead>
          <tr>
            <th>Project ID</th>
            <th>Batch No</th>
            {crm && <th>CRM</th>}
            <th>Sample No</th>
            {dup && <th>Original</th>}
            {ELEMENTS.map((e) => (
              <th key={e} colSpan={dup ? 3 : crm ? 3 : 2} className="qa-group">
                {e} (ppm)
              </th>
            ))}
            <th>Check</th>
          </tr>
          <tr className="qa-subhead">
            <th colSpan={crm ? 4 : dup ? 4 : 3} />
            {ELEMENTS.map((e) => (
              <FragmentHead key={e} labels={dup ? ['Org', 'Lab', '%'] : crm ? ['Certified', 'Lab', 'SD off'] : ['Org', 'Lab']} />
            ))}
            <th />
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.sampleNo}>
              <td>{r.projectId}</td>
              <td className="fd-mono">{r.batchId}</td>
              {crm && <td>{r.crm}</td>}
              <td className="fd-mono">{r.sampleNo}</td>
              {dup && <td className="fd-mono">{r.reference}</td>}
              {ELEMENTS.map((e) => {
                const el = r.el[e]
                return (
                  <FragmentCells key={e}>
                    <td className="qa-num-cell">{fmtNum(el.org)}</td>
                    <LabCell el={el} />
                    {dup && <td className={`qa-num-cell qa-lab-${el.verdict}`}>{el.pct == null ? '—' : `${el.pct}%`}</td>}
                    {crm && <td className={`qa-num-cell qa-lab-${el.verdict}`}>{el.z == null ? '—' : `${el.z > 0 ? '+' : ''}${el.z}`}</td>}
                  </FragmentCells>
                )
              })}
              <td>
                <Verdict v={r.verdict} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

const FragmentHead = ({ labels }) => labels.map((l) => <th key={l}>{l}</th>)
const FragmentCells = ({ children }) => children

/* Certified value and SD of each element for one CRM: from the client's sheet, or typed in here. */
function CrmValues({ crm, crmValues, onSave, canEdit }) {
  const cert = certifiedOf(crm, crmValues)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState({})
  const [error, setError] = useState('')
  const start = () => {
    setDraft(Object.fromEntries(ELEMENTS.map((e) => [e, { value: cert?.[e]?.value ?? '', sd: cert?.[e]?.sd ?? '' }])))
    setError('')
    setEditing(true)
  }
  const save = () => {
    const values = {}
    for (const e of ELEMENTS) {
      const value = Number(draft[e].value)
      const sd = Number(draft[e].sd)
      if (draft[e].value === '' || draft[e].sd === '' || !Number.isFinite(value) || !Number.isFinite(sd) || sd <= 0) {
        setError(`Enter the certified value and a standard deviation above 0 for ${e}.`)
        return
      }
      values[e] = { value, sd }
    }
    try {
      onSave(crm, values)
      setEditing(false)
    } catch (err) {
      setError(err.message)
    }
  }
  return (
    <div className="qa-cert">
      <div className="qa-cert-head">
        <strong>{crm}</strong>
        <span className="ff-muted">{cert ? 'certified values' : 'certified values not entered yet'}</span>
        {canEdit && !editing && (
          <button type="button" className="link-button" onClick={start}>
            <Edit3 size={14} /> {cert ? 'Edit' : 'Enter values'}
          </button>
        )}
      </div>
      <table className="qa-cert-table">
        <thead>
          <tr>
            <th />
            {ELEMENTS.map((e) => (
              <th key={e}>{e} (ppm)</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {['value', 'sd'].map((k) => (
            <tr key={k}>
              <th>{k === 'value' ? 'Certified' : 'SD'}</th>
              {ELEMENTS.map((e) => (
                <td key={e}>
                  {editing ? (
                    <input className="fd-input qa-num" type="number" step="any" min="0" aria-label={`${e} ${k}`} value={draft[e][k]} onChange={(ev) => setDraft((d) => ({ ...d, [e]: { ...d[e], [k]: ev.target.value } }))} />
                  ) : (
                    fmtNum(cert?.[e]?.[k])
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {editing && (
        <div className="qa-cert-actions">
          {error && (
            <span className="fd-error-msg">
              <AlertCircle size={14} /> {error}
            </span>
          )}
          <button type="button" className="btn-secondary" onClick={() => setEditing(false)}>
            <X size={14} /> Cancel
          </button>
          <button type="button" className="btn-primary" onClick={save}>
            <Save size={14} /> Save values
          </button>
        </div>
      )}
    </div>
  )
}

/*
 * QAQC: the lab's results for each batch sent, checked against the blanks, duplicates and CRMs that
 * went with it, laid out like the client's QAQC workbook (one tab per sheet) with its charts.
 */
export function QaqcPage() {
  const { fieldRecords = [], role, user, crmValues, saveCrmValues } = useCrm()
  const { may } = useAccess()
  const canManage = may('fieldDatabase')
  const [params, setParams] = useSearchParams()
  const [project, setProject] = useState('ALL')
  const [tab, setTab] = useState('rockBlank')
  const [crmPick, setCrmPick] = useState('')
  const [entering, setEntering] = useState(null)
  const [toast, setToast] = useState(null)
  const batchFilter = params.get('batch') || 'ALL'

  const batches = useMemo(
    () => filterFieldRecordsByRole(fieldRecords.filter((r) => r.section === 'dispatch-database'), role, user).sort((a, b) => (b.date || '').localeCompare(a.date || '')),
    [fieldRecords, role, user],
  )
  const projects = useMemo(() => [...new Map(batches.map((b) => [b.projectId, { id: b.projectId, name: b.projectName }])).values()], [batches])
  const inProject = batches.filter((b) => project === 'ALL' || b.projectId === project)
  const shown = inProject.filter((b) => batchFilter === 'ALL' || b.id === batchFilter)

  const rows = useMemo(() => qaqcRows(shown, crmValues), [shown, crmValues])
  const checks = allChecks(rows)
  const withResults = checks.filter((c) => c.verdict !== 'missing')
  const states = useMemo(() => new Map(inProject.map((b) => [b.id, batchQaqc(b, crmValues)])), [inProject, crmValues])
  const waiting = shown.filter((b) => ['awaiting', 'partial'].includes(states.get(b.id)?.state)).length

  const crms = [...new Set(rows.crm.map((r) => r.crm))]
  const crm = crms.includes(crmPick) ? crmPick : crms[0]
  const crmRows = rows.crm.filter((r) => r.crm === crm)

  const canEnter = (b) => canManage && (role !== 'Employee' || (b.employeeName || b.createdBy) === user?.name)
  const showToast = (message) => {
    setToast(message)
    setTimeout(() => setToast(null), 4000)
  }
  const setBatch = (id) => {
    const next = new URLSearchParams(params)
    if (id === 'ALL') next.delete('batch')
    else next.set('batch', id)
    setParams(next, { replace: true })
  }

  const counts = { rockBlank: rows.rockBlank.length, pulpBlank: rows.pulpBlank.length, pulpDuplicate: rows.pulpDuplicate.length, crm: rows.crm.length, samples: rows.samples.length }
  const typeCounts = Object.values(SAMPLE_TYPE).map((t) => [t, rows.samples.filter((s) => s.type === t).length])

  return (
    <div className="fd-page qa-page">
      {toast && (
        <div className="fd-toast success">
          <CheckCircle2 size={18} />
          <span>{toast}</span>
        </div>
      )}

      <div className="fd-header">
        <div className="fd-header-titles">
          <div style={{ marginBottom: 4 }}>
            <Link to="/field-database" className="fd-section-cta" style={{ fontSize: 13, gap: 6 }}>
              <ArrowLeft size={14} /> Back to Field Database Overview
            </Link>
          </div>
          <div className="fd-header-top">
            <h1 className="fd-header-title">QAQC</h1>
          </div>
          <p className="fd-header-subtitle">The lab's results for each batch, checked against the blanks, duplicates and CRMs sent with it.</p>
        </div>
        <div className="fd-header-actions">
          <button
            type="button"
            className="btn-secondary"
            disabled={!checks.length}
            title="The client's QAQC workbook with the batches shown"
            onClick={() => {
              downloadQaqcWorkbook(rows)
              showToast(`QAQC Excel downloaded: ${shown.length} batch${shown.length === 1 ? '' : 'es'}.`)
            }}
          >
            <Download size={16} /> Download Excel
          </button>
          <Link to="/field-database/dispatch-database" className="btn-primary">
            <FlaskConical size={16} /> Sample Dispatch
          </Link>
        </div>
      </div>

      <div className="fd-toolbar qa-toolbar">
        <div className="fd-filter-group">
          <select className="fd-filter-select" value={project} aria-label="Project" onChange={(e) => (setProject(e.target.value), setBatch('ALL'))}>
            <option value="ALL">All projects</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.id} · {p.name}
              </option>
            ))}
          </select>
          <select className="fd-filter-select" value={batchFilter} aria-label="Batch" onChange={(e) => setBatch(e.target.value)}>
            <option value="ALL">All batches</option>
            {inProject.map((b) => (
              <option key={b.id} value={b.id}>
                {fieldsOf(b).BATCH_ID || b.id} · {fieldsOf(b).DATA_TYPE?.toLowerCase()}
              </option>
            ))}
          </select>
        </div>
      </div>

      <section className="stat-grid" aria-label="QAQC figures">
        <KpiCard tone="tone-info" icon={ClipboardCheck} label="QC results in" value={withResults.length}>
          of {checks.length} blanks, duplicates and CRMs
        </KpiCard>
        <KpiCard tone="tone-good" icon={CheckCircle2} label="Duplicates within 95–105%" value={rows.pulpDuplicate.filter((c) => c.verdict === 'pass').length}>
          of {rows.pulpDuplicate.length} pulp duplicates
        </KpiCard>
        <KpiCard tone="tone-urgent" icon={XCircle} label="Duplicates outside 95–105%" value={rows.pulpDuplicate.filter((c) => c.verdict === 'fail').length}>
          client's acceptable range
        </KpiCard>
        <KpiCard tone="tone-neutral" icon={Clock} label="Batches awaiting results" value={waiting}>
          of {shown.length} shown
        </KpiCard>
      </section>

      <section className="card qa-card">
        <header className="card-header">
          <FlaskConical className="card-icon" size={20} strokeWidth={1.8} />
          <h2>Batches</h2>
        </header>
        {inProject.length === 0 ? (
          <p className="fo-empty">No batch sent to a lab yet.</p>
        ) : (
          <div className="fd-table-wrap">
            <table className="fd-table qa-batches">
              <thead>
                <tr>
                  <th>Batch</th>
                  <th>Project</th>
                  <th>Dispatched</th>
                  <th>Lab</th>
                  <th>Samples</th>
                  <th>Results in</th>
                  <th>Duplicates</th>
                  <th>Results</th>
                  <th>Lab status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {inProject.map((b) => {
                  const q = states.get(b.id)
                  const s = STATE[q.state]
                  const Icon = s.icon
                  const v = fieldsOf(b)
                  return (
                    <tr key={b.id} className={batchFilter === b.id ? 'qa-picked' : ''}>
                      <td>
                        <button type="button" className="link-button fd-mono" onClick={() => setBatch(batchFilter === b.id ? 'ALL' : b.id)} title="Show only this batch below">
                          {v.BATCH_ID || b.id}
                        </button>
                      </td>
                      <td>{b.projectId}</td>
                      <td style={{ whiteSpace: 'nowrap' }}>{b.date}</td>
                      <td>{v.LAB || '—'}</td>
                      <td>
                        {q.total - q.qc} + {q.qc} QC
                      </td>
                      <td>
                        {q.withResult} / {rowsOf(b, 'samples').length}
                      </td>
                      <td className="qa-mini">
                        {q.dupPass > 0 && <span className="qa-verdict qa-pass" title="Within 95–105%">{q.dupPass} within</span>}
                        {q.dupFail > 0 && <span className="qa-verdict qa-fail" title="Outside 95–105%">{q.dupFail} outside</span>}
                        {!q.dupPass && !q.dupFail && <span className="ff-muted">—</span>}
                      </td>
                      <td>
                        <span className={`qa-state qa-${s.tone}`}>
                          <Icon size={14} /> {s.label}
                        </span>
                      </td>
                      <td>{v.STATUS || 'Pending'}</td>
                      <td>
                        {canEnter(b) && (
                          <button type="button" className="btn-secondary qa-enter" onClick={() => setEntering(b)}>
                            {q.withResult ? 'Edit results' : 'Enter results'}
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="card qa-card">
        <div className="qa-tabs" role="tablist">
          {[...QC_SHEETS, { key: 'samples', title: 'Sample No' }].map((t) => (
            <button key={t.key} type="button" role="tab" aria-selected={tab === t.key} className={`qa-tab${tab === t.key ? ' active' : ''}`} onClick={() => setTab(t.key)}>
              {t.title} <span className="qa-tab-count">{counts[t.key]}</span>
            </button>
          ))}
        </div>

        <div className="qa-tab-body">
          {tab !== 'samples' && <p className="qa-rule">{RULES[tab]}</p>}

          {(tab === 'rockBlank' || tab === 'pulpBlank') && (
            <>
              <BlankCharts rows={rows[tab]} />
              <CheckTable sheetKey={tab} rows={rows[tab]} />
            </>
          )}
          {tab === 'pulpDuplicate' && (
            <>
              <DuplicateCharts rows={rows[tab]} />
              <CheckTable sheetKey={tab} rows={rows[tab]} />
            </>
          )}
          {tab === 'crm' &&
            (crms.length === 0 ? (
              <p className="fo-empty">No CRM in the batches shown.</p>
            ) : (
              <>
                {crms.length > 1 && (
                  <div className="qa-crm-pick" role="group" aria-label="CRM">
                    {crms.map((c) => (
                      <button key={c} type="button" className={`qa-chip${c === crm ? ' active' : ''}`} onClick={() => setCrmPick(c)}>
                        {c} <span>{rows.crm.filter((r) => r.crm === c).length}</span>
                      </button>
                    ))}
                  </div>
                )}
                <CrmValues key={crm} crm={crm} crmValues={crmValues} canEdit={canManage && role !== 'Employee'} onSave={(c, values) => (saveCrmValues(c, values), showToast(`Certified values of ${c} saved.`))} />
                <CrmCharts rows={crmRows} />
                <CheckTable sheetKey="crm" rows={crmRows} />
              </>
            ))}
          {tab === 'samples' && (
            <>
              <div className="qa-type-counts">
                {typeCounts.map(([t, n]) => (
                  <span key={t} className="qa-type">
                    {t} <b>{n}</b>
                  </span>
                ))}
                <span className="qa-type">
                  Ordinary <b>{rows.samples.length - typeCounts.reduce((sum, [, n]) => sum + n, 0)}</b>
                </span>
              </div>
              <div className="fd-table-wrap qa-table-wrap qa-tall">
                <table className="fd-table qa-table">
                  <thead>
                    <tr>
                      <th>Sample Nos</th>
                      <th>Type</th>
                      <th>Batch</th>
                      <th>Result</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.samples.map((s) => (
                      <tr key={s.sampleNo}>
                        <td className="fd-mono">{s.sampleNo}</td>
                        <td>{s.type}</td>
                        <td className="fd-mono">{s.batchId}</td>
                        <td>{s.hasResult ? <CheckCircle2 size={15} className="qa-tick" aria-label="Received" /> : <span className="ff-muted">—</span>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </section>

      {entering && (
        <QaqcResultsModal
          batch={entering}
          onClose={() => setEntering(null)}
          onSaved={(status) => showToast(`Results saved for ${fieldsOf(entering).BATCH_ID || entering.id}. Lab status: ${status}.`)}
        />
      )}
    </div>
  )
}
