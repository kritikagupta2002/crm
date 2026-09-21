import { ArrowRight, Building2, Users } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { ContourLines } from '../../components/common/ContourLines'
import { Logo } from '../../components/common/Logo'
import { MountainRange } from '../../components/common/MountainRange'
import { ROLE_ACCESS, ROLES, useCrm } from '../../context/crm'
import { baseProjects } from '../../data/projects'
import { ONBOARDING_STEPS, progressOf, quoteFor } from '../../utils/workflow'
import './auth.css'


const digits = (value) => value.replace(/\D/g, '').slice(-10)

function TeamForm() {
  const { role, signIn } = useCrm()
  const [email, setEmail] = useState('kritika.sharma@bansalgeo.com')
  const [password, setPassword] = useState('demo1234')
  const [signInAs, setSignInAs] = useState(role)

  return (
    <form
      className="auth-form"
      onSubmit={(e) => {
        e.preventDefault()
        signIn(signInAs)
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
          <label key={r} className={signInAs === r ? 'is-selected' : ''}>
            <input type="radio" name="role" value={r} checked={signInAs === r} onChange={() => setSignInAs(r)} />
            <strong>{r}</strong>
            <span>{ROLE_ACCESS[r].note}</span>
          </label>
        ))}
      </fieldset>
      <button className="btn btn-primary auth-submit" type="submit">
        Sign in <ArrowRight size={16} />
      </button>
      <p className="auth-note">Demo build: any password works.</p>
    </form>
  )
}

function ClientForm() {
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
        signInClient(lead.id)
      }}
    >
      <p className="auth-lead">Track your enquiry, view and accept quotations, and share documents with our team.</p>
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
            <button key={lead.id} type="button" onClick={() => signInClient(lead.id)}>
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

/* Entry screen for both the team and clients. Already signed in → straight to the right place. */
export function LoginPage() {
  const { session } = useCrm()
  const { state } = useLocation()
  const [tab, setTab] = useState(state?.tab === 'client' ? 'client' : 'team')

  useEffect(() => {
    document.title = 'Sign in · Bansal Geo CRM'
  }, [])

  // Also runs right after signing in, so it carries the page the user was trying to open.
  if (session?.type === 'team') return <Navigate to={state?.from ?? '/'} replace />
  if (session?.type === 'client') return <Navigate to="/portal" replace />

  return (
    <div className="auth-page">
      <aside className="auth-brand">
        <ContourLines className="auth-contours" lines={22} />
        <MountainRange className="auth-range" />
        <Logo />
        <div className="auth-brand-copy">
          <h1>Enquiries to active clients, tracked in one place.</h1>
          <p>Mineral exploration, mine planning, environment &amp; permitting, hydrogeology and GIS mapping.</p>
        </div>
        <span className="auth-foot">© {new Date().getFullYear()} Bansal Geo Solutions Pvt. Ltd. · Jaipur</span>
      </aside>

      <main className="auth-main">
        <div className="auth-card">
          <h2>Sign in</h2>
          <div className="auth-tabs" role="tablist">
            <button role="tab" aria-selected={tab === 'team'} className={tab === 'team' ? 'is-active' : ''} onClick={() => setTab('team')}>
              <Users size={15} /> Bansal Geo team
            </button>
            <button role="tab" aria-selected={tab === 'client'} className={tab === 'client' ? 'is-active' : ''} onClick={() => setTab('client')}>
              <Building2 size={15} /> Client
            </button>
          </div>
          <div key={tab} className="tab-panel">
            {tab === 'team' ? <TeamForm /> : <ClientForm />}
          </div>
        </div>
      </main>
    </div>
  )
}
