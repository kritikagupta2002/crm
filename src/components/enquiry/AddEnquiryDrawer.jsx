import { Building2, CalendarClock, ClipboardList, X } from 'lucide-react'
import { useEffect, useId, useRef, useState } from 'react'
import { useCrm } from '../../context/crm'
import { FOLLOW_UP_TYPES, LEAD_SOURCES, MINERALS, SERVICE_DETAILS, SERVICES, TEAM, TODAY } from '../../data/mockData'
import { addDays, toISODate } from '../../utils/date'

const todayISO = toISODate(TODAY)

const initialState = () => ({
  company: '',
  contactPerson: '',
  phone: '',
  email: '',
  location: '',
  mineral: '',
  service: SERVICES[0],
  serviceDetail: SERVICE_DETAILS[SERVICES[0]][0],
  source: 'Phone Call',
  assignedTo: TEAM[0],
  scheduleFollowUp: true,
  followUpType: 'Call',
  followUpDate: toISODate(addDays(TODAY, 2)),
  followUpTime: '11:00',
  notes: '',
})

/* Accepts "98290 12345", "+91 9829012345", "09829012345" — stores the 10-digit number. */
const normalisePhone = (value) => value.replace(/[\s-]/g, '').replace(/^(\+91|0)/, '')

function validate(form) {
  const errors = {}
  if (form.company.trim().length < 2) errors.company = 'Enter the client or company name'
  if (!form.contactPerson.trim()) errors.contactPerson = 'Enter a contact person'
  if (!/^[6-9]\d{9}$/.test(normalisePhone(form.phone))) errors.phone = 'Enter a valid 10-digit mobile number'
  if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) errors.email = 'Enter a valid email address'
  if (form.scheduleFollowUp) {
    if (!form.followUpDate) errors.followUpDate = 'Pick a date'
    else if (form.followUpDate < todayISO) errors.followUpDate = "Date can't be in the past"
    if (!form.followUpTime) errors.followUpTime = 'Pick a time'
  }
  return errors
}

function Field({ label, error, required, hint, children, wide }) {
  return (
    <label className={`field ${wide ? 'field-wide' : ''} ${error ? 'has-error' : ''}`}>
      <span className="field-label">
        {label}
        {required && <em aria-hidden="true"> *</em>}
      </span>
      {children}
      {error ? <span className="field-error">{error}</span> : hint && <span className="field-hint">{hint}</span>}
    </label>
  )
}

export function AddEnquiryDrawer({ onClose, onSaved }) {
  const { addEnquiry } = useCrm()
  const [form, setForm] = useState(initialState)
  const [errors, setErrors] = useState({})
  const [submitted, setSubmitted] = useState(false)
  const firstFieldRef = useRef(null)
  const titleId = useId()

  useEffect(() => {
    firstFieldRef.current?.focus()
    const onKey = (event) => event.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = previousOverflow
    }
  }, [onClose])

  function update(key, value) {
    const next = { ...form, [key]: value }
    if (key === 'service') next.serviceDetail = SERVICE_DETAILS[value][0]
    setForm(next)
    // After the first submit attempt, re-check as the user fixes things.
    if (submitted) setErrors(validate(next))
  }

  function handleSubmit(event) {
    event.preventDefault()
    setSubmitted(true)
    const found = validate(form)
    setErrors(found)
    if (Object.keys(found).length > 0) {
      // Wait for the error styles to render, then take the user to the first problem.
      requestAnimationFrame(() => document.querySelector('.enquiry-drawer .has-error input, .enquiry-drawer .has-error select')?.focus())
      return
    }

    const lead = addEnquiry({
      company: form.company.trim(),
      contactPerson: form.contactPerson.trim(),
      phone: normalisePhone(form.phone),
      email: form.email.trim() || undefined,
      location: form.location.trim() || undefined,
      mineral: form.mineral || undefined,
      service: form.service,
      serviceDetail: form.serviceDetail,
      source: form.source,
      assignedTo: form.assignedTo,
      notes: form.notes.trim() || undefined,
      followUp: form.scheduleFollowUp
        ? {
            date: form.followUpDate,
            time: form.followUpTime,
            type: form.followUpType,
          }
        : null,
    })
    onSaved(lead)
  }

  return (
    <div className="drawer-root">
      <div className="drawer-backdrop" onClick={onClose} />
      <aside className="enquiry-drawer" role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <header className="drawer-header">
          <h2 id={titleId}>Add New Enquiry</h2>
          <button className="icon-button" onClick={onClose} aria-label="Close">
            <X size={22} />
          </button>
        </header>

        <form className="drawer-form" onSubmit={handleSubmit} noValidate>
          <div className="drawer-body">
            <fieldset className="form-section">
              <legend>
                <Building2 size={18} /> Client details
              </legend>
              <div className="form-grid">
                <Field label="Client / Company" required error={errors.company} wide>
                  <input
                    ref={firstFieldRef}
                    value={form.company}
                    onChange={(e) => update('company', e.target.value)}
                    placeholder="Aravali Minerals Pvt. Ltd."
                    autoComplete="organization"
                  />
                </Field>
                <Field label="Contact person" required error={errors.contactPerson}>
                  <input
                    value={form.contactPerson}
                    onChange={(e) => update('contactPerson', e.target.value)}
                    placeholder="Mahesh Jain"
                    autoComplete="name"
                  />
                </Field>
                <Field label="Mobile number" required error={errors.phone}>
                  <input
                    value={form.phone}
                    onChange={(e) => update('phone', e.target.value)}
                    placeholder="98290 12345"
                    inputMode="tel"
                    autoComplete="tel"
                  />
                </Field>
                <Field label="Email" error={errors.email}>
                  <input
                    value={form.email}
                    onChange={(e) => update('email', e.target.value)}
                    placeholder="mahesh@aravaliminerals.in"
                    type="email"
                    autoComplete="email"
                  />
                </Field>
                <Field label="Site location" hint="District, State">
                  <input value={form.location} onChange={(e) => update('location', e.target.value)} placeholder="Rajsamand, Rajasthan" />
                </Field>
              </div>
            </fieldset>

            <fieldset className="form-section">
              <legend>
                <ClipboardList size={18} /> Enquiry details
              </legend>
              <div className="form-grid">
                <Field label="Service category" required>
                  <select value={form.service} onChange={(e) => update('service', e.target.value)}>
                    {SERVICES.map((service) => (
                      <option key={service}>{service}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Service required" required>
                  <select value={form.serviceDetail} onChange={(e) => update('serviceDetail', e.target.value)}>
                    {SERVICE_DETAILS[form.service].map((detail) => (
                      <option key={detail}>{detail}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Mineral">
                  <select value={form.mineral} onChange={(e) => update('mineral', e.target.value)}>
                    <option value="">Not specified</option>
                    {MINERALS.map((mineral) => (
                      <option key={mineral}>{mineral}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Enquiry source" required>
                  <select value={form.source} onChange={(e) => update('source', e.target.value)}>
                    {LEAD_SOURCES.map((source) => (
                      <option key={source}>{source}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Assign to" required>
                  <select value={form.assignedTo} onChange={(e) => update('assignedTo', e.target.value)}>
                    {TEAM.map((member) => (
                      <option key={member}>{member}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Notes" wide>
                  <textarea
                    value={form.notes}
                    onChange={(e) => update('notes', e.target.value)}
                    placeholder="Lease area, survey requirement, deadlines…"
                    rows={3}
                    maxLength={500}
                  />
                </Field>
              </div>
            </fieldset>

            <fieldset className="form-section">
              <legend>
                <CalendarClock size={18} /> Follow-up
              </legend>
              <label className="toggle">
                <input type="checkbox" checked={form.scheduleFollowUp} onChange={(e) => update('scheduleFollowUp', e.target.checked)} />
                <span className="toggle-track" aria-hidden="true" />
                Schedule a follow-up
              </label>
              {form.scheduleFollowUp && (
                <div className="form-grid form-grid-3">
                  <Field label="Type" required>
                    <select value={form.followUpType} onChange={(e) => update('followUpType', e.target.value)}>
                      {FOLLOW_UP_TYPES.map((type) => (
                        <option key={type}>{type}</option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Date" required error={errors.followUpDate}>
                    <input type="date" min={todayISO} value={form.followUpDate} onChange={(e) => update('followUpDate', e.target.value)} />
                  </Field>
                  <Field label="Time" required error={errors.followUpTime}>
                    <input type="time" value={form.followUpTime} onChange={(e) => update('followUpTime', e.target.value)} />
                  </Field>
                </div>
              )}
            </fieldset>
          </div>

          <footer className="drawer-footer">
            <button type="button" className="btn" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Save Enquiry
            </button>
          </footer>
        </form>
      </aside>
    </div>
  )
}
