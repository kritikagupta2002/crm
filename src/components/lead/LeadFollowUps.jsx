import { CalendarPlus } from 'lucide-react'
import { useState } from 'react'
import { useCrm } from '../../context/crm'
import { FOLLOW_UP_TYPES, TODAY } from '../../data/mockData'
import { addDays, formatDayMonth, formatTime, toISODate } from '../../utils/date'

const todayISO = toISODate(TODAY)

function FollowUpForm({ onSave, onCancel }) {
  const [form, setForm] = useState({ type: 'Call', date: toISODate(addDays(TODAY, 1)), time: '11:00', note: '' })
  const [error, setError] = useState('')
  const set = (key) => (e) => {
    setForm({ ...form, [key]: e.target.value })
    setError('')
  }

  const submit = (e) => {
    e.preventDefault()
    if (!form.date || form.date < todayISO) return setError('Pick today or a later date')
    if (!form.time) return setError('Pick a time')
    onSave(form)
  }

  return (
    <form className="inline-form" onSubmit={submit} noValidate>
      <div className="inline-form-grid">
        <label className="field">
          <span className="field-label">Type</span>
          <select value={form.type} onChange={set('type')}>
            {FOLLOW_UP_TYPES.map((type) => (
              <option key={type}>{type}</option>
            ))}
          </select>
        </label>
        <label className={`field ${error ? 'has-error' : ''}`}>
          <span className="field-label">Date</span>
          <input type="date" min={todayISO} value={form.date} onChange={set('date')} />
        </label>
        <label className="field">
          <span className="field-label">Time</span>
          <input type="time" value={form.time} onChange={set('time')} />
        </label>
      </div>
      <label className="field">
        <span className="field-label">What's it about?</span>
        <input value={form.note} onChange={set('note')} placeholder="Discuss revised quotation" />
      </label>
      {error && <span className="field-error">{error}</span>}
      <div className="inline-form-actions">
        <button type="button" className="btn" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary">
          Schedule
        </button>
      </div>
    </form>
  )
}

/* Pending follow-ups for one lead, plus an inline form to schedule another. */
export function LeadFollowUps({ lead, startWithForm = false }) {
  const { followUps, scheduleFollowUp } = useCrm()
  const [showForm, setShowForm] = useState(startWithForm)
  const isClosed = lead.stage === 'Won' || lead.stage === 'Lost'
  const pending = followUps.filter((f) => f.leadId === lead.id).sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time))

  return (
    <>
      <div className="lead-section-head">
        <h3>Follow-ups</h3>
        {!isClosed && !showForm && (
          <button className="link-button" onClick={() => setShowForm(true)}>
            <CalendarPlus size={15} /> Schedule
          </button>
        )}
      </div>
      {showForm && (
        <FollowUpForm
          onCancel={() => setShowForm(false)}
          onSave={(form) => {
            scheduleFollowUp(lead.id, form)
            setShowForm(false)
          }}
        />
      )}
      {pending.length > 0 ? (
        <ul className="mini-list">
          {pending.map((f) => (
            <li key={f.id} className={f.date < todayISO ? 'tone-urgent' : f.date === todayISO ? 'tone-attention' : 'tone-info'}>
              <i />
              <span>
                <strong>{f.type}</strong> · {f.note}
              </span>
              <span className="mini-when">
                {f.date === todayISO ? 'Today' : formatDayMonth(f.date)}, {formatTime(f.time)}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        !showForm && <p className="muted small">{isClosed ? 'Lead is closed.' : 'Nothing scheduled.'}</p>
      )}
    </>
  )
}
