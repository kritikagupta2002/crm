import { CalendarPlus, CheckCircle2, Mail, MapPin, Phone, StickyNote, X, XCircle } from 'lucide-react'
import { useEffect, useId, useState } from 'react'
import { StagePill } from '../../components/common/StagePill'
import { useCrm } from '../../context/crm'
import { FOLLOW_UP_TYPES, STAGES, TODAY } from '../../data/mockData'
import { addDays, formatDayMonth, formatTime, parseISODate, toISODate } from '../../utils/date'
import { formatINR } from '../../utils/format'
import { leadAgeDays } from '../../utils/leads'

const todayISO = toISODate(TODAY)
const OPEN_STAGES = STAGES.filter((stage) => stage !== 'Won' && stage !== 'Lost')

function formatWhen(iso) {
  const date = new Date(iso)
  return `${formatDayMonth(toISODate(date))}, ${formatTime(`${date.getHours()}:${date.getMinutes()}`)}`
}

function FollowUpForm({ onSave, onCancel }) {
  const [form, setForm] = useState({ type: 'Call', date: toISODate(addDays(TODAY, 1)), time: '11:00', note: '' })
  const [error, setError] = useState('')
  const set = (key) => (e) => {
    setForm({ ...form, [key]: e.target.value })
    setError('')
  }

  const submit = (e) => {
    e.preventDefault()
    if (!form.date || form.date < todayISO) return setError("Pick today or a later date")
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

export function LeadDetailDrawer({ leadId, onClose, onMarkLost }) {
  const { leads, followUps, activities, changeStage, addNote, scheduleFollowUp } = useCrm()
  const lead = leads.find((l) => l.id === leadId)
  const [showFollowUpForm, setShowFollowUpForm] = useState(false)
  const [note, setNote] = useState('')
  const titleId = useId()

  useEffect(() => {
    const onKey = (event) => event.key === 'Escape' && !document.querySelector('.dialog-root') && onClose()
    document.addEventListener('keydown', onKey)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = previousOverflow
    }
  }, [onClose])

  if (!lead) return null

  const isClosed = lead.stage === 'Won' || lead.stage === 'Lost'
  const pending = followUps.filter((f) => f.leadId === lead.id).sort((a, b) => a.date.localeCompare(b.date))

  // Timeline: when the enquiry came in, then everything done in the CRM, newest first.
  const timeline = [
    ...activities.filter((a) => a.leadId === lead.id).map((a) => ({ ...a, when: formatWhen(a.at), sort: a.at })),
    {
      id: 'created',
      type: 'created',
      text: `Enquiry received${lead.source ? ` via ${lead.source}` : ''}`,
      when: formatDayMonth(lead.createdOn),
      sort: parseISODate(lead.createdOn).toISOString(),
    },
  ].sort((a, b) => b.sort.localeCompare(a.sort))

  const facts = [
    ['Service', lead.serviceDetail, lead.service],
    ['Quotation', lead.quoteValue ? formatINR(lead.quoteValue) : 'Not sent yet'],
    ['Assigned to', lead.assignedTo],
    ['Source', lead.source ?? '—'],
    ['Received', formatDayMonth(lead.createdOn), leadAgeDays(lead) === 0 ? 'Today' : `${leadAgeDays(lead)} days ago`],
    ['Next follow-up', lead.nextFollowUp ? (lead.nextFollowUp === todayISO ? 'Today' : formatDayMonth(lead.nextFollowUp)) : '—'],
  ]

  return (
    <div className="drawer-root">
      <div className="drawer-backdrop" onClick={onClose} />
      <aside className="enquiry-drawer lead-drawer" role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <header className="drawer-header">
          <div className="lead-drawer-title">
            <h2 id={titleId}>{lead.company}</h2>
            <span className="muted">
              {lead.id} · <StagePill stage={lead.stage} />
            </span>
          </div>
          <button className="icon-button" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </header>

        <div className="drawer-body lead-drawer-body">
          <section className="contact-card">
            <strong>{lead.contactPerson}</strong>
            <div className="contact-lines">
              {lead.phone && (
                <a href={`tel:+91${lead.phone}`}>
                  <Phone size={14} /> +91 {lead.phone.slice(0, 5)} {lead.phone.slice(5)}
                </a>
              )}
              {lead.email && (
                <a href={`mailto:${lead.email}`}>
                  <Mail size={14} /> {lead.email}
                </a>
              )}
              {lead.location && (
                <span>
                  <MapPin size={14} /> {lead.location}
                </span>
              )}
            </div>
          </section>

          <dl className="fact-grid">
            {facts.map(([label, value, sub]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>
                  {value}
                  {sub && <span>{sub}</span>}
                </dd>
              </div>
            ))}
          </dl>

          {lead.stage === 'Lost' && lead.lostReason && (
            <p className="lost-note">
              <XCircle size={16} /> Lost: {lead.lostReason}
            </p>
          )}

          <section className="lead-section">
            <h3>Stage</h3>
            <div className="stage-actions">
              <label className="field stage-select">
                <span className="sr-only">Move to stage</span>
                <select value={isClosed ? '' : lead.stage} onChange={(e) => changeStage(lead.id, e.target.value)}>
                  {isClosed && (
                    <option value="" disabled>
                      Reopen at…
                    </option>
                  )}
                  {OPEN_STAGES.map((stage) => (
                    <option key={stage}>{stage}</option>
                  ))}
                </select>
              </label>
              {lead.stage !== 'Won' && (
                <button className="btn btn-success" onClick={() => changeStage(lead.id, 'Won')}>
                  <CheckCircle2 size={16} /> Mark as Won
                </button>
              )}
              {lead.stage !== 'Lost' && (
                <button className="btn btn-outline-danger" onClick={() => onMarkLost(lead.id)}>
                  <XCircle size={16} /> Mark as Lost
                </button>
              )}
            </div>
          </section>

          <section className="lead-section">
            <div className="lead-section-head">
              <h3>Follow-ups</h3>
              {!isClosed && !showFollowUpForm && (
                <button className="link-button" onClick={() => setShowFollowUpForm(true)}>
                  <CalendarPlus size={15} /> Schedule
                </button>
              )}
            </div>
            {showFollowUpForm && (
              <FollowUpForm
                onCancel={() => setShowFollowUpForm(false)}
                onSave={(form) => {
                  scheduleFollowUp(lead.id, form)
                  setShowFollowUpForm(false)
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
              !showFollowUpForm && <p className="muted small">{isClosed ? 'Lead is closed.' : 'Nothing scheduled.'}</p>
            )}
          </section>

          <section className="lead-section">
            <h3>Activity</h3>
            <form
              className="note-form"
              onSubmit={(e) => {
                e.preventDefault()
                if (!note.trim()) return
                addNote(lead.id, note.trim())
                setNote('')
              }}
            >
              <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add a note — call outcome, client feedback…" aria-label="Add a note" />
              <button type="submit" className="btn" disabled={!note.trim()}>
                <StickyNote size={15} /> Add
              </button>
            </form>
            <ol className="timeline">
              {timeline.map((item) => (
                <li key={item.id} className={`timeline-item type-${item.type}`}>
                  <span className="timeline-dot" />
                  <div>
                    <p>{item.text}</p>
                    <span className="muted">{item.when}</span>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        </div>
      </aside>
    </div>
  )
}
