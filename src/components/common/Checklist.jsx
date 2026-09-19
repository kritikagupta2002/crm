import { Check } from 'lucide-react'

export function ProgressBar({ done, total, tone = 'tone-good' }) {
  const pct = total ? Math.round((done / total) * 100) : 0
  return (
    <div className={`progress ${tone}`} role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
      <div style={{ width: `${pct}%` }} />
    </div>
  )
}

/* Tickable steps (approval, onboarding). Ticking or unticking calls onToggle(key, nextValue). */
export function Checklist({ steps, values = {}, onToggle, disabled }) {
  return (
    <ul className="checklist">
      {steps.map((step) => {
        const done = Boolean(values[step.key])
        return (
          <li key={step.key}>
            <button className={`check-step ${done ? 'is-done' : ''}`} onClick={() => onToggle(step.key, !done)} disabled={disabled} aria-pressed={done}>
              <span className="check-box">{done && <Check size={13} strokeWidth={3} />}</span>
              {step.label}
            </button>
          </li>
        )
      })}
    </ul>
  )
}
