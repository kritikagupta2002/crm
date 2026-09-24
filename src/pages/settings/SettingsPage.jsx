import { Bell, Building2, Check, FileText, Layers, RotateCcw, ShieldCheck, Workflow } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { BILL_ROLES, PERMISSIONS, ROLE_ACCESS, ROLE_USERS, initialsOf, useCrm } from '../../context/crm'
import { LOST_REASONS, SERVICE_DETAILS, SERVICES } from '../../data/mockData'
import { FIELD_MEMBERS } from '../../data/staff'
import { AUTOMATIONS, CHANNELS, automationOf } from '../../utils/automations'
import { canActOn } from '../../utils/projects'

/* What each permission lets a role change, in words (PERMISSIONS in context/crm.js). */
const CHANGES = {
  sales: 'enquiries & quotations',
  contact: 'notes & follow-ups',
  payments: 'client payments',
  onboarding: 'onboarding',
  projects: 'project tasks & files',
}

/* Which portal questions each role answers (utils/questions). */
const QUESTIONS = {
  Sales: 'questions before the win',
  'Project Coordinator': 'project & document questions',
  'Team Lead': 'questions on their projects',
  Finance: 'billing questions',
  Accountant: 'billing questions',
}

function changesOf(role) {
  if (role === 'Admin') return 'Everything'
  if (role === 'Field Member') return 'Their own tasks and field visits'
  const list = Object.keys(CHANGES).filter((key) => PERMISSIONS[key].includes(role)).map((key) => CHANGES[key])
  if (canActOn(role, 'approval')) list.push('government letters')
  if (QUESTIONS[role]) list.push(QUESTIONS[role])
  if (BILL_ROLES.pay.includes(role)) list.push('vendor bills & payments')
  else if (BILL_ROLES.check.includes(role)) list.push('vendor bills')
  return list.length ? list.join(', ').replace(/^./, (c) => c.toUpperCase()) : 'Nothing — view only'
}

/* Staff and the role-based access rules (RBAC): the same ROLE_ACCESS and PERMISSIONS the menu, pages and buttons follow. */
const ACCESS = [
  ...Object.entries(ROLE_ACCESS).map(([role, a]) => ({ role, sees: a.note, changes: changesOf(role) })),
  // Outside the team: each signs in to their own portal and sees only their own records.
  { role: 'Client', sees: 'Client portal: their enquiries, quotations, projects, approvals, letters and payments', changes: 'Accept a quotation, pay, upload, ask' },
  { role: 'Vendor', sees: 'Vendor portal: their work orders, deliveries, bills and payments', changes: 'Their deliveries and bills' },
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

function field(state, setState, key, label, props = {}) {
  return (
    <label className={`field ${props.wide ? 'field-wide' : ''}`}>
      <span className="field-label">{label}</span>
      {props.textarea ? (
        <textarea rows={3} value={state[key]} onChange={(e) => setState({ ...state, [key]: e.target.value })} />
      ) : (
        <input value={state[key]} inputMode={props.numeric ? 'numeric' : undefined} placeholder={props.placeholder} onChange={(e) => setState({ ...state, [key]: props.numeric ? e.target.value.replace(/[^\d]/g, '') : e.target.value })} />
      )}
    </label>
  )
}

function CompanyForm({ settings, onSave }) {
  const [company, setCompany] = useState(() => ({ companyName: settings.companyName, address: settings.address, phone: settings.phone, email: settings.email, gstin: settings.gstin, upiId: settings.upiId, accountName: settings.accountName, accountNo: settings.accountNo, ifsc: settings.ifsc, bankName: settings.bankName }))
  return (
    <form
      className="form-grid"
      onSubmit={(e) => {
        e.preventDefault()
        onSave({ ...company, companyName: company.companyName.trim() || settings.companyName })
      }}
    >
      {field(company, setCompany, 'companyName', 'Company name', { wide: true })}
      {field(company, setCompany, 'address', 'Address', { wide: true })}
      {field(company, setCompany, 'phone', 'Phone')}
      {field(company, setCompany, 'email', 'Email')}
      {field(company, setCompany, 'gstin', 'GSTIN', { placeholder: 'Shown on quotations when added' })}
      {/* Where clients pay from the portal (UPI QR and bank transfer). */}
      {field(company, setCompany, 'upiId', 'UPI ID for client payments')}
      {field(company, setCompany, 'accountName', 'Bank account name')}
      {field(company, setCompany, 'accountNo', 'Account number')}
      {field(company, setCompany, 'ifsc', 'IFSC')}
      {field(company, setCompany, 'bankName', 'Bank & branch', { wide: true })}
      <div className="settings-actions field-wide">
        <button className="btn btn-primary" type="submit">
          Save profile
        </button>
      </div>
    </form>
  )
}

function QuoteDefaultsForm({ settings, onSave }) {
  const [quote, setQuote] = useState(() => ({ gstPct: String(settings.gstPct), quoteValidityDays: String(settings.quoteValidityDays), terms: settings.terms }))
  return (
    <form
      className="form-grid"
      onSubmit={(e) => {
        e.preventDefault()
        onSave({ gstPct: Number(quote.gstPct) || 18, quoteValidityDays: Number(quote.quoteValidityDays) || 30, terms: quote.terms.trim() })
      }}
    >
      {field(quote, setQuote, 'gstPct', 'GST (%)', { numeric: true })}
      {field(quote, setQuote, 'quoteValidityDays', 'Valid for (days)', { numeric: true })}
      {field(quote, setQuote, 'terms', 'Terms printed on new quotations', { wide: true, textarea: true })}
      <div className="settings-actions field-wide">
        <button className="btn btn-primary" type="submit">
          Save defaults
        </button>
      </div>
    </form>
  )
}

export function SettingsPage() {
  const { settings, updateSettings, resetDemoData, changeCount } = useCrm()
  const [saved, setSaved] = useState('')
  const companyKey = [settings.companyName, settings.address, settings.phone, settings.email, settings.gstin, settings.upiId, settings.accountName, settings.accountNo, settings.ifsc, settings.bankName].join('|')
  const quoteKey = [settings.gstPct, settings.quoteValidityDays, settings.terms].join('|')

  const flash = (key) => {
    setSaved(key)
    setTimeout(() => setSaved((s) => (s === key ? '' : s)), 2000)
  }

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
          <CompanyForm
            key={companyKey}
            settings={settings}
            onSave={(values) => {
              updateSettings(values)
              flash('company')
            }}
          />
        </Section>

        <Section icon={FileText} title="Quotation Defaults" action={<SavedNote show={saved === 'quote'} />}>
          <p className="muted small">Applies to quotations created from now on; quotations already sent keep their own GST, validity and terms.</p>
          <QuoteDefaultsForm
            key={quoteKey}
            settings={settings}
            onSave={(values) => {
              updateSettings(values)
              flash('quote')
            }}
          />
        </Section>

        <Section icon={ShieldCheck} title="Team & Access">
          <ul className="team-list">
            {/* One sign-in per role, and one per member of the field team. */}
            {Object.entries(ROLE_USERS)
              .flatMap(([role, person]) => (role === 'Field Member' ? FIELD_MEMBERS.map((m) => [role, m]) : [[role, person]]))
              .map(([role, person]) => (
                <li key={person.name}>
                  <span className="avatar small-avatar">{initialsOf(person.name)}</span>
                  <strong>{person.name}</strong>
                  <span className="pill tone-neutral role-pill">{role}</span>
                </li>
              ))}
          </ul>
          <table className="access-table">
            <thead>
              <tr>
                <th>Role</th>
                <th>Sees</th>
                <th>Can change</th>
              </tr>
            </thead>
            <tbody>
              {ACCESS.map((a) => (
                <tr key={a.role}>
                  <th>{a.role}</th>
                  <td>{a.sees}</td>
                  <td>{a.changes}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="muted small">
            The menu and pages follow these rules for whoever is signed in. Try it with "Switch role" in the profile menu. Every change is recorded with who made it in the <Link to="/audit-log">audit log</Link>.
          </p>
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
        </Section>

        <Section icon={Workflow} title="Automations">
          <table className="automation-table">
            <thead>
              <tr>
                <th>When</th>
                <th>To</th>
                {CHANNELS.map((c) => (
                  <th key={c.key} className="align-center">
                    {c.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {AUTOMATIONS.map((a) => {
                const set = automationOf(settings, a.key)
                return (
                  <tr key={a.key}>
                    <td>
                      {a.label}
                      {a.note && <span className="muted"> — {a.note}</span>}
                    </td>
                    <td className="muted">{a.to}</td>
                    {CHANNELS.map((c) => (
                      <td key={c.key} className="align-center">
                        <input
                          type="checkbox"
                          checked={Boolean(set[c.key])}
                          onChange={(e) => updateSettings({ automations: { ...settings.automations, [a.key]: { ...set, [c.key]: e.target.checked } } })}
                          aria-label={`${a.label} on ${c.label}`}
                        />
                      </td>
                    ))}
                  </tr>
                )
              })}
            </tbody>
          </table>
          <p className="muted small">
            Each message goes out on its own when the event happens and is kept in <Link to="/messages">Sent messages</Link>. Demo: messages are recorded, not sent; the live system sends them through the WhatsApp Business API and the mail server.
          </p>
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
