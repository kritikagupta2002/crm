import { ArrowRight, Building2, HardHat, Users } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { ContourLines } from '../../components/common/ContourLines'
import { Logo } from '../../components/common/Logo'
import { MountainRange } from '../../components/common/MountainRange'
import { ROLE_ACCESS, ROLE_USERS, ROLES, roleSlug, useCrm } from '../../context/crm'
import { baseProjects } from '../../data/projects'
import { FIELD_MEMBERS } from '../../data/staff'
import { allProjects } from '../../utils/projects'
import { ONBOARDING_STEPS, progressOf, quoteFor } from '../../utils/workflow'
import './auth.css'

const digits = (value) => value.replace(/\D/g, '').slice(-10)

/* What the brand panel says to each kind of visitor. */
const BRAND_COPY = {
  team: ['Enquiries to active clients, tracked in one place.', 'Mineral exploration, mine planning, environment & permitting, hydrogeology and GIS mapping.'],
  client: ['Your project, approvals and government letters in one place.', 'Follow the work stage by stage, download official letters and documents, and review quotations.'],
  vendor: ['Your work orders with Bansal Geo, from order to payment.', 'Upload the delivered work and your bill, and see when the payment is released.'],
}

function TeamForm({ onDone }) {
  const { role, fieldMember, signIn } = useCrm()
  const [email, setEmail] = useState('kritika.gupta@bansalgeo.com')
  const [password, setPassword] = useState('demo1234')
  const [signInAs, setSignInAs] = useState(role)
  // The field team signs in person by person: each sees only their own tasks.
  const [member, setMember] = useState(fieldMember)

  return (
    <form
      className="auth-form"
      onSubmit={(e) => {
        e.preventDefault()
        signIn(signInAs, signInAs === 'Employee' ? member : undefined)
        onDone(signInAs)
      }}
    >
      <label className="field">
        <span className="field-label">Work email</span>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" required />
      </label>
      <label className="field">
        <span className="field-label">Password</span>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required />
      </label>
      <fieldset className="role-pick">
        <legend className="field-label">Sign in as</legend>
        {ROLES.map((r) => (
          <label key={r} className={`role-pick-${roleSlug(r)} ${signInAs === r ? 'is-selected' : ''}`}>
            <input type="radio" name="role" value={r} checked={signInAs === r} onChange={() => setSignInAs(r)} />
            <strong>{r}</strong>
            <span>{r === 'Employee' ? `${FIELD_MEMBERS.length} people` : ROLE_USERS[r].name}</span>
          </label>
        ))}
      </fieldset>
      {signInAs === 'Employee' && (
        <label className="field">
          <span className="field-label">Who is signing in?</span>
          <select value={member} onChange={(e) => setMember(e.target.value)}>
            {FIELD_MEMBERS.map((m) => (
              <option key={m.name} value={m.name}>
                {m.name} · {m.title}
              </option>
            ))}
          </select>
        </label>
      )}
      <p className="role-pick-note">{ROLE_ACCESS[signInAs].note}</p>
      <button className="btn btn-primary auth-submit" type="submit">
        Sign in <ArrowRight size={16} />
      </button>
      <p className="auth-note">Demo build: any password works.</p>
    </form>
  )
}

function ClientForm({ onDone }) {
  const { leads, signInClient } = useCrm()
  const [enquiryId, setEnquiryId] = useState('')
  const [mobile, setMobile] = useState('')
  const [error, setError] = useState('')

  // Demo clients at different points: a won client with projects, and one with a quotation to decide on.
  const demos = [
    {
      lead: leads.find((l) => l.stage === 'Won' && baseProjects(l).length > 1 && progressOf(ONBOARDING_STEPS, l.onboarding) === ONBOARDING_STEPS.length),
      what: 'project & government approvals',
    },
    { lead: leads.find((l) => l.phone && l.stage === 'Proposal Sent' && quoteFor(l)?.displayStatus === 'Sent'), what: 'quotation to review' },
  ].filter((d) => d.lead)
  const open = (id) => {
    signInClient(id)
    onDone()
  }

  return (
    <form
      className="auth-form"
      onSubmit={(e) => {
        e.preventDefault()
        const lead = leads.find((l) => l.id.toLowerCase() === enquiryId.trim().toLowerCase())
        if (!lead || !lead.phone || digits(lead.phone) !== digits(mobile)) {
          setError('No enquiry matches this ID and mobile number. Check the details in the message we sent you.')
          return
        }
        open(lead.id)
      }}
    >
      <p className="auth-lead">Follow your project and government approvals, download official letters and documents, and review quotations.</p>
      <label className="field">
        <span className="field-label">Enquiry ID</span>
        <input value={enquiryId} onChange={(e) => (setEnquiryId(e.target.value), setError(''))} placeholder="e.g. BG-2026-041" required />
      </label>
      <label className="field">
        <span className="field-label">Registered mobile number</span>
        <input type="tel" inputMode="numeric" value={mobile} onChange={(e) => (setMobile(e.target.value), setError(''))} placeholder="10-digit mobile" required />
      </label>
      {error && (
        <p className="auth-error" role="alert">
          {error}
        </p>
      )}
      <button className="btn btn-primary auth-submit" type="submit">
        Open my portal <ArrowRight size={16} />
      </button>
      {demos.length > 0 && (
        <div className="auth-demos">
          <span className="muted">Or open a demo client:</span>
          {demos.map(({ lead, what }) => (
            <button key={lead.id} type="button" onClick={() => open(lead.id)}>
              <strong>{lead.company}</strong>
              <span>{what}</span>
            </button>
          ))}
        </div>
      )}
      <p className="auth-new">
        New to Bansal Geo? <Link to="/enquiry">Send an enquiry</Link>
      </p>
    </form>
  )
}

function VendorForm({ onDone }) {
  const { vendors, leads, projectEdits, signInVendor } = useCrm()
  const [vendorCode, setVendorCode] = useState('')
  const [mobile, setMobile] = useState('')
  const [error, setError] = useState('')

  // Demo vendors, one per stage of an order (up to three firms). The seeded orders move on with the date, so
  // whichever stages exist today are offered: there is always something to show.
  const orders = allProjects(leads, projectEdits).flatMap((p) => p.workOrders)
  const demos = [
    ['Issued', 'work to start'],
    ['In progress', 'work to deliver'],
    ['Completed', 'bill to send'],
    ['Bill received', 'bill with Accounts'],
    ['Paid', 'paid orders'],
  ]
    .flatMap(([status, what]) => orders.filter((w) => w.status === status).map((order) => ({ order, what })))
    .map((d) => ({ ...d, vendor: vendors.find((v) => v.name === d.order.vendor) }))
    .filter((d, i, all) => d.vendor && all.findIndex((x) => x.vendor?.id === d.vendor.id) === i)
    .slice(0, 3)
  const open = (id) => {
    signInVendor(id)
    onDone()
  }

  return (
    <form
      className="auth-form"
      onSubmit={(e) => {
        e.preventDefault()
        const vendor = vendors.find((v) => v.id.toLowerCase() === vendorCode.trim().toLowerCase())
        if (!vendor || digits(vendor.phone) !== digits(mobile)) {
          setError('No vendor matches this ID and mobile number. Check the work order we sent you.')
          return
        }
        open(vendor.id)
      }}
    >
      <p className="auth-lead">See your work orders, upload the delivered work and your bill, and follow the payment.</p>
      <label className="field">
        <span className="field-label">Vendor ID</span>
        <input value={vendorCode} onChange={(e) => (setVendorCode(e.target.value), setError(''))} placeholder="e.g. VN-03" required />
      </label>
      <label className="field">
        <span className="field-label">Registered mobile number</span>
        <input type="tel" inputMode="numeric" value={mobile} onChange={(e) => (setMobile(e.target.value), setError(''))} placeholder="10-digit mobile" required />
      </label>
      {error && (
        <p className="auth-error" role="alert">
          {error}
        </p>
      )}
      <button className="btn btn-primary auth-submit" type="submit">
        Open vendor portal <ArrowRight size={16} />
      </button>
      <p className="auth-register">
        New vendor? <Link to="/vendor/register">Register your firm</Link> · <Link to="/vendor/register?track">Check registration status</Link>
      </p>
      {demos.length > 0 && (
        <div className="auth-demos">
          <span className="muted">Or open a demo vendor:</span>
          {demos.map(({ vendor, what }) => (
            <button key={vendor.id} type="button" onClick={() => open(vendor.id)}>
              <strong>{vendor.name}</strong>
              <span>{what}</span>
            </button>
          ))}
        </div>
      )}
    </form>
  )
}

const TABS = [
  { key: 'team', label: 'Team', icon: Users },
  { key: 'client', label: 'Client', icon: Building2 },
  { key: 'vendor', label: 'Vendor', icon: HardHat },
]

/*
 * Entry screen for the team, clients and vendors. Each has its own sign-in, so the team can keep the CRM
 * open while previewing a portal. Opening /login while signed in goes straight on, unless a tab was asked for.
 */
export function LoginPage() {
  const { teamSignedIn, clientLeadId, vendorId } = useCrm()
  const { state } = useLocation()
  const navigate = useNavigate()
  const [tab, setTab] = useState(TABS.some((t) => t.key === state?.tab) ? state.tab : 'team')

  useEffect(() => {
    document.title = 'Sign in · Bansal Geo CRM'
  }, [])

  // Sent here from a CRM page: that page once the team is signed in. Opened directly: straight to whichever side is signed in.
  if (state?.from) {
    if (teamSignedIn) return <Navigate to={state.from} replace />
  } else if (!state?.tab) {
    if (teamSignedIn) return <Navigate to="/" replace />
    if (clientLeadId) return <Navigate to="/portal" replace />
    if (vendorId) return <Navigate to="/vendor" replace />
  }

  const [headline, lead] = BRAND_COPY[tab]
  const done = {
    team: (role) => navigate(state?.from ?? ROLE_ACCESS[role].home, { replace: true }),
    client: () => navigate('/portal', { replace: true }),
    vendor: () => navigate('/vendor', { replace: true }),
  }[tab]

  return (
    <div className="auth-page">
      <aside className="auth-brand">
        <ContourLines className="auth-contours" lines={22} />
        <MountainRange className="auth-range" />
        <Logo />
        <div key={tab} className="auth-brand-copy">
          <h1>{headline}</h1>
          <p>{lead}</p>
        </div>
        <span className="auth-foot">© {new Date().getFullYear()} Bansal Geo Solutions Pvt. Ltd. · Jaipur</span>
      </aside>

      <main className="auth-main">
        <div className="auth-card">
          <h2>Sign in</h2>
          <div className="auth-tabs" role="tablist">
            {TABS.map(({ key, label, icon: Icon }) => (
              <button key={key} role="tab" aria-selected={tab === key} className={tab === key ? 'is-active' : ''} onClick={() => setTab(key)}>
                <Icon size={15} /> {label}
              </button>
            ))}
          </div>
          <div key={tab} className="tab-panel">
            {tab === 'team' ? <TeamForm onDone={done} /> : tab === 'client' ? <ClientForm onDone={done} /> : <VendorForm onDone={done} />}
          </div>
        </div>
      </main>
    </div>
  )
}
