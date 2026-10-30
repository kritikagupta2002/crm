import { ArrowRight, Users } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { ContourLines } from '../../shared/components/ContourLines'
import { Logo } from '../../shared/components/Logo'
import { MountainRange } from '../../shared/components/MountainRange'
import { ROLE_ACCESS, ROLE_USERS, ROLES, canOpen, useCrm } from '../permissions/crm'
import { FIELD_MEMBERS } from '../../modules/erm/data/staff'
import './auth.css'

function TeamForm({ onDone }) {
  const { role, fieldMember, signIn } = useCrm()
  const [email, setEmail] = useState('kritika.gupta@bansalgeo.com')
  const [password, setPassword] = useState('demo1234')
  const [signInAs, setSignInAs] = useState(ROLE_ACCESS[role] ? role : 'Super Admin')
  // The field team signs in person by person: each sees only their own tasks/attendance.
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
          <label key={r} className={signInAs === r ? 'is-selected' : ''}>
            <input type="radio" name="role" value={r} checked={signInAs === r} onChange={() => setSignInAs(r)} />
            <strong>{r}</strong>
            <span>{r === 'Employee' ? `${FIELD_MEMBERS.length} people` : ROLE_USERS[r]?.name}</span>
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
      <p className="role-pick-note">{ROLE_ACCESS[signInAs]?.note}</p>
      <button className="btn btn-primary auth-submit" type="submit">
        Sign in <ArrowRight size={16} />
      </button>
      <p className="auth-note">Demo build: any password works.</p>
    </form>
  )
}

/*
 * Entry screen for HRMS, Attendance & Employee Management.
 */
export function LoginPage() {
  const { teamSignedIn, role } = useCrm()
  const { state } = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    document.title = 'Sign in · Bansal Geo HRMS'
  }, [])

  // If already signed in, navigate straight to the dashboard or previous route
  if (teamSignedIn) {
    const destination = state?.from && canOpen(role, state.from) ? state.from : (ROLE_ACCESS[role]?.home ?? '/')
    return <Navigate to={destination} replace />
  }

  const handleDone = (selectedRole) => {
    const home = ROLE_ACCESS[selectedRole]?.home ?? '/'
    const target = state?.from && canOpen(selectedRole, state.from) ? state.from : home
    navigate(target, { replace: true })
  }

  return (
    <div className="auth-page">
      <aside className="auth-brand">
        <ContourLines className="auth-contours" lines={22} />
        <MountainRange className="auth-range" />
        <Logo />
        <div className="auth-brand-copy">
          <h1>HRMS &amp; Attendance Portal</h1>
          <p>Employee management, daily &amp; monthly attendance tracking, leave requests, and self-service in one unified dashboard.</p>
        </div>
        <span className="auth-foot">© {new Date().getFullYear()} Bansal Geo Solutions Pvt. Ltd. · Jaipur</span>
      </aside>

      <main className="auth-main">
        <div className="auth-card">
          <h2>Sign in to HRMS</h2>
          <div className="tab-panel">
            <TeamForm onDone={handleDone} />
          </div>
        </div>
      </main>
    </div>
  )
}
