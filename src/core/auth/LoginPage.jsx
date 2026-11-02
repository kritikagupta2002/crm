import { useEffect, useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { ArrowRight, Clock, Eye, EyeOff, Lock, Mail, ShieldCheck, Users } from 'lucide-react'
import { ContourLines } from '../../shared/components/ContourLines'
import { Logo } from '../../shared/components/Logo'
import { canOpen, useCrm } from '../permissions/crm'
import { ChangePasswordForm } from './ChangePasswordForm'
import './auth.css'

function SignInForm() {
  const { signIn } = useCrm()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      await signIn(email.trim(), password)
    } catch (err) {
      setError(err.message)
      setPassword('')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      <div className="field">
        <label className="field-label" htmlFor="auth-email">
          Work email
        </label>
        <div className="input-wrap">
          <Mail className="input-icon" size={18} aria-hidden="true" />
          <input
            id="auth-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@bansalgeo.com"
            autoComplete="username"
            autoFocus
            required
          />
        </div>
      </div>

      <div className="field">
        <label className="field-label" htmlFor="auth-password">
          Password
        </label>
        <div className="input-wrap">
          <Lock className="input-icon" size={18} aria-hidden="true" />
          <input
            id="auth-password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
          <button
            type="button"
            className="input-password-toggle"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
      </div>

      {error && (
        <p className="auth-error" role="alert">
          {error}
        </p>
      )}

      <button className="auth-submit" type="submit" disabled={busy}>
        <span>{busy ? 'Signing in…' : 'Sign in'}</span>
        {!busy && <ArrowRight size={17} aria-hidden="true" />}
      </button>

      <p className="auth-note">Forgot your password? Contact HR to have it reset.</p>
    </form>
  )
}

export function LoginPage() {
  const { status, role, user } = useCrm()
  const { state } = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    document.title = 'Sign in · Bansal Geo HRMS'
  }, [])

  const destination = state?.from && user && canOpen(user.permissions, state.from, user.employeeId) ? state.from : '/'
  const mustChange = status === 'authenticated' && user?.mustChangePassword

  if (status === 'authenticated' && !mustChange) return <Navigate to={destination} replace />

  return (
    <div className="auth-page">
      <aside className="auth-brand">
        <img className="auth-photo" src="/hero-mountain.jpg" alt="" aria-hidden="true" />
        <ContourLines className="auth-contours" lines={22} color="rgba(255,255,255,0.16)" accent="rgba(214,160,86,0.45)" />

        <div className="auth-logo-row">
          <Logo />
        </div>

        <div className="auth-brand-copy">
          <h1>HRMS &amp; Attendance</h1>
          <p>Attendance, leave, payroll and employee records for the Bansal Geo team.</p>
          <ul className="auth-highlights">
            <li>
              <Clock size={16} aria-hidden="true" /> Geofenced punch in and out, at the office or on field duty
            </li>
            <li>
              <Users size={16} aria-hidden="true" /> Leave, corrections and approvals in one place
            </li>
            <li>
              <ShieldCheck size={16} aria-hidden="true" /> Each person sees only what their access allows
            </li>
          </ul>
        </div>

        <div className="auth-foot">© {new Date().getFullYear()} Bansal Geo Solutions Pvt. Ltd., Jaipur</div>
      </aside>

      <main className="auth-main">
        <div className="auth-card">
          {mustChange ? (
            <>
              <div className="auth-card-header">
                <h2>Set your password</h2>
                <p>Welcome, {user.name}. Replace the temporary password you were given before continuing.</p>
              </div>
              <ChangePasswordForm submitLabel="Save and continue" onDone={() => navigate(destination, { replace: true })} />
            </>
          ) : (
            <>
              <div className="auth-card-header">
                <h2>Sign in</h2>
                <p>Use your Bansal Geo work email and password.</p>
              </div>
              {status === 'loading' ? <p className="auth-note">Checking your session…</p> : <SignInForm />}
            </>
          )}
        </div>
      </main>
    </div>
  )
}
