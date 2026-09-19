import { Bell, Building2, Check, FileText, Layers, RotateCcw, ShieldCheck } from 'lucide-react'
import { useState } from 'react'
import { useCrm } from '../../context/crm'
import { LOST_REASONS, SERVICE_DETAILS, SERVICES, TEAM } from '../../data/mockData'

/* Roles from the requirement sheet (RBAC). The demo shows who can see what; enforcement comes with login. */
const TEAM_ROLES = { 'K. Sharma': 'Sales Manager', 'R. Mehta': 'Business Development', 'S. Verma': 'Business Development', 'A. Singh': 'Project Coordinator', 'P. Joshi': 'Coordinator' }
const ACCESS = [
  { role: 'Admin / Management', sees: 'Everything, including quotation values and reports' },
  { role: 'Sales Manager / BD', sees: 'All leads, quotations and client details' },
  { role: 'Coordinator', sees: 'Leads and follow-ups; quotation amounts hidden' },
  { role: 'Accountant', sees: 'Quotations and approvals (PO, advance) only' },
]

function Section({ icon: Icon, title, children, action }) {
  return (
    <section className="card settings-card">
      <header className="card-header">
        <Icon className="card-icon" size={20} strokeWidth={1.8} />
        <h2>{title}</h2>
        {action && <div className="card-actions">{action}</div>}
      </header>
      <div className="settings-body">{children}</div>
    </section>
  )
}

function SavedNote({ show }) {
  return show ? (
    <span className="saved-note">
      <Check size={14} /> Saved
    </span>
  ) : null
}

export function SettingsPage() {
  const { settings, updateSettings, resetDemoData, changeCount } = useCrm()
  const [company, setCompany] = useState(() => ({ companyName: settings.companyName, address: settings.address, phone: settings.phone, email: settings.email, gstin: settings.gstin }))
  const [quote, setQuote] = useState(() => ({ gstPct: String(settings.gstPct), quoteValidityDays: String(settings.quoteValidityDays), terms: settings.terms }))
  const [saved, setSaved] = useState('')

  const flash = (key) => {
    setSaved(key)
    setTimeout(() => setSaved((s) => (s === key ? '' : s)), 2000)
  }

  const field = (state, setState, key, label, props = {}) => (
    <label className={`field ${props.wide ? 'field-wide' : ''}`}>
      <span className="field-label">{label}</span>
      {props.textarea ? (
        <textarea rows={3} value={state[key]} onChange={(e) => setState({ ...state, [key]: e.target.value })} />
      ) : (
        <input value={state[key]} inputMode={props.numeric ? 'numeric' : undefined} placeholder={props.placeholder} onChange={(e) => setState({ ...state, [key]: props.numeric ? e.target.value.replace(/[^\d]/g, '') : e.target.value })} />
      )}
    </label>
  )

  return (
    <div className="module-page">
      <header className="page-header">
        <div className="page-title">
          <h1>Settings</h1>
          <p>Company details, quotation defaults and team access</p>
        </div>
      </header>

      <div className="card-grid settings-grid">
        <Section icon={Building2} title="Company Profile" action={<SavedNote show={saved === 'company'} />}>
          <form
            className="form-grid"
            onSubmit={(e) => {
              e.preventDefault()
              updateSettings({ ...company, companyName: company.companyName.trim() || settings.companyName })
              flash('company')
            }}
          >
            {field(company, setCompany, 'companyName', 'Company name', { wide: true })}
            {field(company, setCompany, 'address', 'Address', { wide: true })}
            {field(company, setCompany, 'phone', 'Phone')}
            {field(company, setCompany, 'email', 'Email')}
            {field(company, setCompany, 'gstin', 'GSTIN', { placeholder: 'Shown on quotations when added' })}
            <div className="settings-actions field-wide">
              <button className="btn btn-primary" type="submit">
                Save profile
              </button>
            </div>
          </form>
        </Section>

        <Section icon={FileText} title="Quotation Defaults" action={<SavedNote show={saved === 'quote'} />}>
          <form
            className="form-grid"
            onSubmit={(e) => {
              e.preventDefault()
              updateSettings({ gstPct: Number(quote.gstPct) || 18, quoteValidityDays: Number(quote.quoteValidityDays) || 30, terms: quote.terms.trim() })
              flash('quote')
            }}
          >
            {field(quote, setQuote, 'gstPct', 'GST (%)', { numeric: true })}
            {field(quote, setQuote, 'quoteValidityDays', 'Valid for (days)', { numeric: true })}
            {field(quote, setQuote, 'terms', 'Terms printed on quotations', { wide: true, textarea: true })}
            <div className="settings-actions field-wide">
              <button className="btn btn-primary" type="submit">
                Save defaults
              </button>
            </div>
          </form>
        </Section>

        <Section icon={ShieldCheck} title="Team & Access">
          <ul className="team-list">
            {TEAM.map((m) => (
              <li key={m}>
                <span className="avatar small-avatar">{m.split(' ').pop()[0]}</span>
                <strong>{m}</strong>
                <span className="pill tone-neutral role-pill">{TEAM_ROLES[m]}</span>
              </li>
            ))}
          </ul>
          <table className="access-table">
            <tbody>
              {ACCESS.map((a) => (
                <tr key={a.role}>
                  <th>{a.role}</th>
                  <td>{a.sees}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="muted small">Role-based access is enforced once staff sign in with their own accounts.</p>
        </Section>

        <Section icon={Bell} title="Notifications">
          {[
            ['notifyOverdue', 'Remind owners about overdue follow-ups'],
            ['notifyNewEnquiry', 'Alert the sales manager about every new enquiry'],
          ].map(([key, label]) => (
            <label key={key} className="toggle settings-toggle">
              <input type="checkbox" checked={settings[key]} onChange={(e) => updateSettings({ [key]: e.target.checked })} />
              <span className="toggle-track" aria-hidden="true" />
              {label}
            </label>
          ))}
          <p className="muted small">WhatsApp and email delivery come with the notification module.</p>
        </Section>

        <Section icon={Layers} title="Services">
          <ul className="service-list">
            {SERVICES.map((s) => (
              <li key={s}>
                <strong>{s}</strong>
                <span className="muted">{SERVICE_DETAILS[s].join(' · ')}</span>
              </li>
            ))}
          </ul>
        </Section>

        <Section icon={RotateCcw} title="Lost Reasons & Demo Data">
          <div className="tag-list">
            {LOST_REASONS.map((r) => (
              <span key={r} className="pill tone-urgent status-pill">
                {r}
              </span>
            ))}
          </div>
          <div className="reset-box">
            <div>
              <strong>Reset demo data</strong>
              <span className="muted">{changeCount ? `${changeCount} changes made in this browser` : 'No changes yet'}</span>
            </div>
            <button className="btn btn-outline-danger" disabled={!changeCount} onClick={() => window.confirm('Undo every change made in this demo?') && resetDemoData()}>
              Reset
            </button>
          </div>
        </Section>
      </div>
    </div>
  )
}
