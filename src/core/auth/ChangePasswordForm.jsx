import { useState } from 'react'
import { Eye, EyeOff, Lock } from 'lucide-react'
import { useCrm } from '../permissions/crm'

export const PASSWORD_HINT = 'At least 10 characters, including a letter and a number.'
const strongEnough = (pw) => pw.length >= 10 && /[A-Za-z]/.test(pw) && /\d/.test(pw)

function PasswordField({ id, label, value, onChange, autoComplete, autoFocus }) {
  const [visible, setVisible] = useState(false)
  return (
    <div className="field">
      <label className="field-label" htmlFor={id}>
        {label}
      </label>
      <div className="input-wrap">
        <Lock className="input-icon" size={18} aria-hidden="true" />
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          autoFocus={autoFocus}
          required
        />
        <button
          type="button"
          className="input-password-toggle"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? 'Hide password' : 'Show password'}
        >
          {visible ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
    </div>
  )
}

/* Used at first sign-in (temporary password) and from Settings > Security. */
export function ChangePasswordForm({ onDone, submitLabel = 'Update password' }) {
  const { changePassword } = useCrm()
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!strongEnough(next)) return setError(PASSWORD_HINT)
    if (next !== confirm) return setError('The new passwords do not match.')
    setBusy(true)
    try {
      await changePassword(current, next)
      setCurrent('')
      setNext('')
      setConfirm('')
      onDone?.()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit} noValidate>
      <PasswordField id="pw-current" label="Current password" value={current} onChange={setCurrent} autoComplete="current-password" autoFocus />
      <PasswordField id="pw-new" label="New password" value={next} onChange={setNext} autoComplete="new-password" />
      <PasswordField id="pw-confirm" label="Confirm new password" value={confirm} onChange={setConfirm} autoComplete="new-password" />
      <p className="auth-hint">{PASSWORD_HINT}</p>
      {error && (
        <p className="auth-error" role="alert">
          {error}
        </p>
      )}
      <button className="auth-submit" type="submit" disabled={busy}>
        <span>{busy ? 'Saving…' : submitLabel}</span>
      </button>
    </form>
  )
}
