import { AlertTriangle, CheckCircle2, Download, FileText, RotateCcw, ShieldCheck, UserCheck, UserX } from 'lucide-react'
import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { KpiCard } from '../../components/common/KpiCard'
import { SideDrawer } from '../../components/common/SideDrawer'
import { maskAccount, useAccess, useCrm } from '../../context/crm'
import { REJECT_REASONS } from '../../data/vendorApplications'
import { TDS_SECTIONS } from '../../data/vendors'
import { formatDate, formatNearDate } from '../../utils/date'
import { downloadDocument } from '../../utils/files'
import { applicationChecks, suggestedTds } from '../../utils/vendorChecks'
import '../projects/erm.css'
import './vendors.css'

const TABS = ['New', 'Changes requested', 'Approved', 'Rejected', 'All']
const STATUS_TONE = { New: 'tone-info', 'Changes requested': 'tone-attention', Approved: 'tone-good', Rejected: 'tone-urgent' }
const timeOf = (iso) => new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })

/* The Admin's three answers. approve: TDS section to apply; changes: what to correct; reject: reason and note. */
function Decision({ app, onDone }) {
  const { decideVendorApplication } = useCrm()
  const [mode, setMode] = useState(null)
  const [note, setNote] = useState('')
  const [reason, setReason] = useState(REJECT_REASONS[0])
  const suggested = suggestedTds(app)
  const [tds, setTds] = useState(TDS_SECTIONS.findIndex((t) => t.section === suggested.section && t.rate === suggested.rate))
  const decide = (decision, extra) => {
    decideVendorApplication(app.id, decision, extra)
    onDone()
  }

  if (!mode)
    return (
      <div className="app-actions">
        <button className="btn btn-success" onClick={() => setMode('approve')}>
          <UserCheck size={15} /> Approve
        </button>
        <button className="btn" onClick={() => setMode('changes')}>
          <RotateCcw size={15} /> Send back for changes
        </button>
        <button className="btn btn-outline-danger" onClick={() => setMode('reject')}>
          <UserX size={15} /> Reject
        </button>
      </div>
    )

  return (
    <form
      className="app-decision"
      onSubmit={(e) => {
        e.preventDefault()
        if (mode === 'approve') decide('approve', { tds: { section: TDS_SECTIONS[tds].section, rate: TDS_SECTIONS[tds].rate } })
        if (mode === 'changes') decide('changes', { note: note.trim() })
        if (mode === 'reject') decide('reject', { reason, note: note.trim() })
      }}
    >
      {mode === 'approve' && (
        <>
          <p>
            <b>{app.firm.name}</b> joins the vendor register with the next vendor ID and gets it by email and WhatsApp.
          </p>
          <label className="field">
            <span className="field-label">TDS on payments</span>
            <select value={tds} onChange={(e) => setTds(Number(e.target.value))}>
              {TDS_SECTIONS.map((t, i) => (
                <option key={t.label} value={i}>
                  {t.label}
                </option>
              ))}
            </select>
          </label>
        </>
      )}
      {mode === 'reject' && (
        <label className="field">
          <span className="field-label">Reason</span>
          <select value={reason} onChange={(e) => setReason(e.target.value)}>
            {REJECT_REASONS.map((r) => (
              <option key={r}>{r}</option>
            ))}
          </select>
        </label>
      )}
      {mode !== 'approve' && (
        <label className="field">
          <span className="field-label">{mode === 'changes' ? 'What should the firm correct?' : 'Note to the firm'}</span>
          <textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder={mode === 'changes' ? 'e.g. The cancelled cheque is not readable — please upload a clear scan.' : 'Optional — sent with the reason'} autoFocus />
        </label>
      )}
      <p className="muted small">{mode === 'approve' ? 'The firm is told by email and WhatsApp.' : 'The firm is told by email, with your words.'}</p>
      <div className="letter-form-actions">
        <button type="button" className="btn" onClick={() => setMode(null)}>
          Cancel
        </button>
        <button type="submit" className={`btn ${mode === 'reject' ? 'btn-danger' : 'btn-primary'}`} disabled={mode === 'changes' && !note.trim()}>
          {mode === 'approve' ? 'Approve vendor' : mode === 'changes' ? 'Send back' : 'Reject application'}
        </button>
      </div>
    </form>
  )
}

/* One application: the checks first, then everything the firm filled in, its papers and what has happened so far. */
function ApplicationDrawer({ app, onClose }) {
  const { vendors, vendorApplications, settings } = useCrm()
  const { may, bank } = useAccess()
  const checks = applicationChecks(app, vendors, vendorApplications)
  const issues = checks.filter((c) => !c.ok).length
  const sections = [
    ['Company', [['Company type', app.firm.companyType], ['Nature of business', app.firm.nature], ['Legal status', app.firm.legalStatus], ['Company category', app.firm.category], ['Preferential bidder', app.firm.preferential ? [app.firm.preference, app.firm.preferenceNo].filter(Boolean).join(' · ') : 'No'], ['Registration no.', app.firm.regNo], ['Established', app.firm.year], ['Partners / directors', app.firm.partners]]],
    ['Work', [['Categories', app.work.categories.join(', ')], ['Areas', app.work.areas], ['Experience', app.work.experience && `${app.work.experience} years`], ['Turnover (last FY)', app.work.turnover], ['Accreditation', app.work.accreditation]]],
    ['Address', [['Registered address', app.address.line], ['City', app.address.city], ['State · postal code', `${app.address.state} · ${app.address.pincode}`], ['Country', app.address.country ?? 'India']]],
    ['Contact', [['Name', `${app.contact.title} ${app.contact.name}`], ['Designation', app.contact.designation], ['Date of birth', app.contact.dob && formatDate(app.contact.dob)], ['Mobile', `+91 ${app.contact.mobile} (verified)`], ['Email', app.contact.email], ['Phone', app.contact.phone]]],
    ['Tax', [['PAN', app.tax.pan], ['GSTIN', app.tax.gstRegistered ? app.tax.gstin : 'Not GST registered']]],
    ['Bank', [['Account holder', app.bank.holder], ['Bank · branch', [app.bank.bank, app.bank.branch].filter(Boolean).join(', ')], ['Account no.', maskAccount(app.bank.accountNo, bank)], ['IFSC', app.bank.ifsc], ['Type', app.bank.type]]],
  ]

  return (
    <SideDrawer title={app.firm.name} sub={`${app.id} · applied ${formatNearDate(app.submittedAt.slice(0, 10))}, ${timeOf(app.submittedAt)}`} onClose={onClose} className="app-drawer">
      <div className="wo-head">
        <span className={`pill status-pill ${STATUS_TONE[app.status]}`}>{app.status}</span>
        {app.vendorId && (
          <Link to="/subcontracts" className="link-button">
            Vendor {app.vendorId} →
          </Link>
        )}
      </div>

      {app.status === 'New' && (
        <section className={`app-checks ${issues ? 'has-issues' : ''}`}>
          <h3>
            {issues ? (
              <>
                <AlertTriangle size={16} /> {issues} thing{issues === 1 ? '' : 's'} to look at
              </>
            ) : (
              <>
                <ShieldCheck size={16} /> Everything checks out
              </>
            )}
          </h3>
          <ul>
            {checks.map((c) => (
              <li key={c.label} className={c.ok ? 'is-ok' : 'is-issue'}>
                {c.ok ? <CheckCircle2 size={15} /> : <AlertTriangle size={15} />}
                <span>
                  <b>{c.label}</b> {c.note}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {app.note && app.status !== 'New' && (
        <p className="vendor-note">
          {app.reason && <b>{app.reason}. </b>}
          {app.note}
        </p>
      )}

      {sections.map(([title, rows]) => (
        <section key={title} className="app-section">
          <h3>{title}</h3>
          <dl>
            {rows
              .filter(([, value]) => value)
              .map(([label, value]) => (
                <div key={label}>
                  <dt>{label}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
          </dl>
        </section>
      ))}
      {!bank && <p className="muted small">Bank details are shown in full only to Finance and the Admin.</p>}

      <section className="app-section">
        <h3>Documents</h3>
        <ul className="app-docs">
          {app.documents.map((d) => (
            <li key={d.id}>
              <FileText size={15} />
              <span>
                <b>{d.kind}</b> {d.name}
              </span>
              <button className="icon-button small" onClick={() => downloadDocument({ ...d, addedOn: app.submittedAt.slice(0, 10) }, { company: app.firm.name, companyName: settings.companyName })} aria-label={`Download ${d.name}`}>
                <Download size={15} />
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="app-section">
        <h3>History</h3>
        <ol className="app-history">
          {app.history.map((h, i) => (
            <li key={i}>
              <span className="muted">
                {formatDate(h.at.slice(0, 10))}, {timeOf(h.at)}
              </span>{' '}
              <b>{h.action}</b> · {h.by}
              {h.note && <p>{h.note}</p>}
            </li>
          ))}
        </ol>
      </section>

      {app.status === 'New' && (may('vendors') ? <Decision app={app} onDone={onClose} /> : <p className="muted small">The Admin approves or rejects registrations.</p>)}
    </SideDrawer>
  )
}

/*
 * Vendor registrations from the public page (/vendor/register): the Admin checks each one and approves it (the firm
 * joins the vendor register), sends it back for changes, or rejects it with a reason. The firm is told by email.
 */
export function VendorApplicationsPage() {
  const { vendorApplications, vendors } = useCrm()
  const [params, setParams] = useSearchParams()
  const [tab, setTab] = useState('New')
  const openId = params.get('open')
  const open = vendorApplications.find((a) => a.id === openId)
  const count = (t) => (t === 'All' ? vendorApplications.length : vendorApplications.filter((a) => a.status === t).length)
  const visible = tab === 'All' ? vendorApplications : vendorApplications.filter((a) => a.status === tab)
  const approvedThisMonth = vendorApplications.filter((a) => a.status === 'Approved' && a.decidedAt?.slice(0, 7) === new Date().toISOString().slice(0, 7)).length

  return (
    <div className="module-page">
      <header className="page-header">
        <div className="page-title">
          <h1>Vendor Applications</h1>
          <p>
            Firms registering on the public page · <a href="/vendor/register" target="_blank" rel="noreferrer">open the registration form</a>
          </p>
        </div>
      </header>

      <section className="stat-grid">
        <KpiCard tone="tone-info" icon={FileText} label="To Review" value={count('New')}>
          <span className="muted">New and resubmitted</span>
        </KpiCard>
        <KpiCard tone="tone-attention" icon={RotateCcw} label="With the Firm" value={count('Changes requested')}>
          <span className="muted">Sent back for changes</span>
        </KpiCard>
        <KpiCard tone="tone-good" icon={UserCheck} label="Registered Vendors" value={vendors.length}>
          <span className="muted">{approvedThisMonth ? `${approvedThisMonth} approved this month` : 'In the vendor register'}</span>
        </KpiCard>
        <KpiCard tone="tone-urgent" icon={UserX} label="Rejected" value={count('Rejected')}>
          <span className="muted">Told the reason by email</span>
        </KpiCard>
      </section>

      <section className="card">
        <nav className="stage-tabs" aria-label="Filter applications">
          {TABS.map((t) => (
            <button key={t} className={`stage-tab ${tab === t ? 'is-active' : ''}`} onClick={() => setTab(t)} aria-pressed={tab === t}>
              {t}
              <span>{count(t)}</span>
            </button>
          ))}
        </nav>
        {visible.length === 0 ? (
          <p className="empty-state">{tab === 'New' ? 'Nothing to review. New registrations from the public page come here.' : 'No applications here.'}</p>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Application</th>
                  <th>Firm</th>
                  <th>Work</th>
                  <th>Checks</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((a) => {
                  const issues = applicationChecks(a, vendors, vendorApplications).filter((c) => !c.ok)
                  return (
                    <tr key={a.id} className="clickable-row" onClick={() => setParams({ open: a.id }, { replace: true })}>
                      <td>
                        <div className="cell-strong mono-sub">{a.id}</div>
                        <div className="cell-sub">{formatNearDate(a.submittedAt.slice(0, 10))}</div>
                      </td>
                      <td>
                        <div className="cell-strong">{a.firm.name}</div>
                        <div className="cell-sub">
                          {a.firm.companyType} · {a.address.city}, {a.address.state}
                        </div>
                      </td>
                      <td>
                        <div className="cell-clip">{a.work.categories.join(', ')}</div>
                      </td>
                      <td>
                        {a.status !== 'New' ? (
                          <span className="muted">—</span>
                        ) : issues.length ? (
                          <span className="check-flag is-issue" title={issues.map((c) => `${c.label}: ${c.note}`).join('\n')}>
                            <AlertTriangle size={14} /> {issues.length} to look at
                          </span>
                        ) : (
                          <span className="check-flag is-ok">
                            <CheckCircle2 size={14} /> All clear
                          </span>
                        )}
                      </td>
                      <td>
                        <span className={`pill status-pill ${STATUS_TONE[a.status]}`}>{a.status}</span>
                        {a.vendorId && <div className="cell-sub">{a.vendorId}</div>}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {open && <ApplicationDrawer key={open.id} app={open} onClose={() => setParams({}, { replace: true })} />}
    </div>
  )
}
