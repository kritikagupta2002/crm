import { useState, useEffect } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { ArrowRight, Mail, Lock, User, Check, Eye, EyeOff, ShieldCheck, Award, Briefcase } from 'lucide-react'
import { ContourLines } from '../../shared/components/ContourLines'
import { Logo } from '../../shared/components/Logo'
import { MountainRange } from '../../shared/components/MountainRange'
import { ROLE_ACCESS, ROLE_USERS, ROLES, canOpen, useCrm } from '../permissions/crm'
import { FIELD_MEMBERS } from '../constants/staff'
import { api } from '../../hrms/core/api/apiClient'
import './auth.css'

function TeamForm({ onDone }) {
  const { role, fieldMember, signIn } = useCrm()
  const defaultRole = ROLE_ACCESS[role] ? role : 'Managing Director'

  const [signInAs, setSignInAs] = useState(defaultRole)
  const [member, setMember] = useState(fieldMember || FIELD_MEMBERS[0]?.name || '')
  const [email, setEmail] = useState(ROLE_USERS[defaultRole]?.email || 'amit.bansal@bansalgeo.com')
  const [password, setPassword] = useState('demo1234')
  const [showPassword, setShowPassword] = useState(false)

  // Handle role switch and auto-fill corresponding real person's email
  const handleSelectRole = (newRole) => {
    setSignInAs(newRole)
    if (newRole === 'Employee') {
      const activeMember = FIELD_MEMBERS.find((m) => m.name === member) || FIELD_MEMBERS[0]
      if (activeMember) {
        setEmail(activeMember.email)
        setMember(activeMember.name)
      }
    } else if (ROLE_USERS[newRole]?.email) {
      setEmail(ROLE_USERS[newRole].email)
    }
  }

  // Handle employee dropdown switch
  const handleSelectMember = (memberName) => {
    setMember(memberName)
    const activeMember = FIELD_MEMBERS.find((m) => m.name === memberName)
    if (activeMember?.email) {
      setEmail(activeMember.email)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const res = await api.post('/auth/login', {
        email,
        password,
        role: signInAs,
        member: signInAs === 'Employee' ? member : undefined,
      })
      if (res && res.token) {
        api.setToken(res.token)
      }
    } catch (err) {
      console.warn('[Login] API authentication notice:', err.message)
    }
    signIn(signInAs, signInAs === 'Employee' ? member : undefined)
    onDone(signInAs)
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      {/* Work Email Field */}
      <div className="field">
        <label className="field-label" htmlFor="auth-email">
          Work Email
        </label>
        <div className="input-wrap">
          <Mail className="input-icon" size={18} />
          <input
            id="auth-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@bansalgeo.com"
            autoComplete="username"
            required
          />
        </div>
      </div>

      {/* Password Field */}
      <div className="field">
        <label className="field-label" htmlFor="auth-password">
          Password
        </label>
        <div className="input-wrap">
          <Lock className="input-icon" size={18} />
          <input
            id="auth-password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            autoComplete="current-password"
            required
          />
          <button
            type="button"
            className="input-password-toggle"
            onClick={() => setShowPassword(!showPassword)}
            tabIndex={-1}
            title={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
      </div>

      {/* Sign in as role selector */}
      <div className="field">
        <span className="field-label">Sign in as</span>
        <div className="role-pick-grid">
          {ROLES.map((r) => {
            const isSelected = signInAs === r
            const userDisplay = r === 'Employee' ? `${FIELD_MEMBERS.length} team members` : ROLE_USERS[r]?.name
            const userTitle = r === 'Employee' ? 'Field & Technical' : ROLE_USERS[r]?.title

            return (
              <label
                key={r}
                className={`role-card ${isSelected ? 'is-selected' : ''}`}
                onClick={() => handleSelectRole(r)}
              >
                <input
                  type="radio"
                  name="role"
                  value={r}
                  checked={isSelected}
                  onChange={() => handleSelectRole(r)}
                />
                <div className="role-card-header">
                  <span className="role-title">{r}</span>
                  {isSelected && <Check size={16} className="role-check-icon" />}
                </div>
                <span className="role-sub" title={userDisplay}>
                  {userDisplay}
                </span>
                <span className="role-desc">{userTitle}</span>
              </label>
            )
          })}
        </div>
      </div>

      {/* Employee Member Picker (when Employee role is selected) */}
      {signInAs === 'Employee' && (
        <div className="field field-employee-picker">
          <label className="field-label" htmlFor="employee-select">
            Select Employee Profile
          </label>
          <div className="input-wrap">
            <User className="input-icon" size={18} />
            <select
              id="employee-select"
              value={member}
              onChange={(e) => handleSelectMember(e.target.value)}
            >
              {FIELD_MEMBERS.map((m) => (
                <option key={m.id || m.name} value={m.name}>
                  {m.name} · {m.title} ({m.department})
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Role access brief note */}
      <div className="role-pick-note">
        <p>{ROLE_ACCESS[signInAs]?.note}</p>
      </div>

      {/* Submit Button */}
      <button className="auth-submit" type="submit">
        <span>Sign in to Dashboard</span>
        <ArrowRight size={17} />
      </button>

      <p className="auth-note">Official Enterprise Portal · Bansal Geo Solutions Pvt. Ltd.</p>
    </form>
  )
}

export function LoginPage() {
  const { teamSignedIn, role } = useCrm()
  const { state } = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    document.title = 'Sign in · Bansal Geo HRMS'
  }, [])

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
      {/* Left Brand Panel */}
      <aside className="auth-brand">
        <ContourLines className="auth-contours" lines={22} />
        <MountainRange className="auth-range" />

        <div className="auth-brand-content">
          <div className="auth-logo-row">
            <Logo />
          </div>

          <div className="auth-brand-copy">
            <div className="auth-badge">
              <span>Bansal Geo Solutions Pvt. Ltd.</span>
            </div>
            <h1>HRMS &amp; Attendance Portal</h1>
            <p>
              Unified employee management, automated biometric &amp; web attendance,
              leave approvals, and staff self-service dashboard.
            </p>

            <div className="auth-highlights">
              <div className="auth-highlight-item">
                <div className="auth-highlight-icon">
                  <ShieldCheck size={18} />
                </div>
                <div>
                  <strong>Role-Based Access</strong>
                  <span>Super Admin, Director, Manager &amp; Employee portals</span>
                </div>
              </div>
              <div className="auth-highlight-item">
                <div className="auth-highlight-icon">
                  <Award size={18} />
                </div>
                <div>
                  <strong>Live Attendance &amp; Leaves</strong>
                  <span>Daily punch-in, monthly muster rolls &amp; leave approvals</span>
                </div>
              </div>
              <div className="auth-highlight-item">
                <div className="auth-highlight-icon">
                  <Briefcase size={18} />
                </div>
                <div>
                  <strong>Real Team Directory</strong>
                  <span>10 active staff records with documents and designations</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="auth-foot">
          © {new Date().getFullYear()} Bansal Geo Solutions Pvt. Ltd. · Jaipur, Rajasthan
        </div>
      </aside>

      {/* Right Login Main Form Card */}
      <main className="auth-main">
        <div className="auth-card">
          <div className="auth-card-header">
            <h2>Sign in to HRMS</h2>
            <p>Select your role or enter credentials to access your dashboard</p>
          </div>
          <TeamForm onDone={handleDone} />
        </div>
      </main>
    </div>
  )
}
