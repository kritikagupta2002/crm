import { AlertTriangle, Building2, CalendarClock, ClipboardList, X } from 'lucide-react'
import { useEffect, useId, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useCrm } from '../../context/crm'
import {
  CLIENT_TYPES,
  CONTACT_MODES,
  FOLLOW_UP_TYPES,
  LEAD_SOURCES,
  MINERALS,
  PRIORITIES,
  SERVICE_DETAILS,
  SERVICES,
  TEAM,
  TIMELINES,
  TODAY,
} from '../../data/mockData'
import { addDays, toISODate } from '../../utils/date'

const todayISO = toISODate(TODAY)

/* Blank form for a new enquiry, or the lead's current values when editing. */
const initialState = (lead) => ({
  clientType: lead?.clientType ?? 'Company',
  company: lead?.company ?? '',
  contactPerson: lead?.contactPerson ?? '',
  phone: lead?.phone ?? '',
  email: lead?.email ?? '',
  location: lead?.location ?? '',
  preferredContact: lead?.preferredContact ?? 'Call',
  service: lead?.service ?? SERVICES[0],
  serviceDetail: lead?.serviceDetail ?? SERVICE_DETAILS[SERVICES[0]][0],
  mineral: lead?.mineral ?? '',
  priority: lead?.priority ?? 'Medium',
  source: lead?.source ?? 'Phone Call',
  referredBy: lead?.referredBy ?? '',
  expectedTimeline: lead?.expectedTimeline ?? '',
  estimatedValue: lead?.estimatedValue ? String(lead.estimatedValue) : '',
  assignedTo: lead?.assignedTo ?? TEAM[0],
  description: lead?.description ?? '',
  scheduleFollowUp: !lead,
  followUpType: 'Call',
  followUpDate: toISODate(addDays(TODAY, 2)),
  followUpTime: '11:00',
})

/* Accepts "98290 12345", "+91 9829012345", "09829012345" — stores the 10-digit number. */
const normalisePhone = (value) => value.replace(/[\s-]/g, '').replace(/^(\+91|0)/, '')

function validate(form) {
  const errors = {}
  if (form.company.trim().length < 2) errors.company = form.clientType === 'Company' ? 'Enter the company name' : "Enter the client's name"
  if (!form.contactPerson.trim()) errors.contactPerson = 'Enter a contact person'
  if (!/^[6-9]\d{9}$/.test(normalisePhone(form.phone))) errors.phone = 'Enter a valid 10-digit mobile number'
  if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) errors.email = 'Enter a valid email address'
  if (form.estimatedValue && !(Number(form.estimatedValue) > 0)) errors.estimatedValue = 'Enter an amount in rupees'
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

/* A row of pill-shaped radio buttons; `tones` optionally colours each option (colour code). */
function ChoiceChips({ label, name, options, value, onChange, tones }) {
  return (
    <fieldset className="field choice-field">
      <legend className="field-label">{label}</legend>
      <div className="choice-chips">
        {options.map((option) => (
          <label key={option} className={`choice-chip ${value === option ? 'is-selected' : ''} ${tones?.[option] ?? ''}`}>
            <input type="radio" name={name} value={option} checked={value === option} onChange={() => onChange(option)} />
            {tones && <i aria-hidden="true" />}
            {option}
          </label>
        ))}
      </div>
    </fieldset>
  )
}

const PRIORITY_TONES = { High: 'tone-urgent', Medium: 'tone-attention', Low: 'tone-neutral' }

export function AddEnquiryDrawer({ lead, onClose, onSaved }) {
  const { leads, addEnquiry, updateLead } = useCrm()
  const isEdit = Boolean(lead)
  const [form, setForm] = useState(() => initialState(lead))
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

    const details = {
      clientType: form.clientType,
      company: form.company.trim(),
      contactPerson: form.contactPerson.trim(),
      phone: normalisePhone(form.phone),
      email: form.email.trim() || undefined,
      location: form.location.trim() || undefined,
      preferredContact: form.preferredContact,
      service: form.service,
      serviceDetail: form.serviceDetail,
      mineral: form.mineral || undefined,
      priority: form.priority,
      source: form.source,
      referredBy: form.source === 'Referral' ? form.referredBy.trim() || undefined : undefined,
      expectedTimeline: form.expectedTimeline || undefined,
      estimatedValue: form.estimatedValue ? Number(form.estimatedValue) : undefined,
      assignedTo: form.assignedTo,
      description: form.description.trim() || undefined,
    }

    if (isEdit) {
      updateLead(lead.id, details, 'Enquiry details updated')
      onSaved({ ...lead, ...details })
      return
    }

    const created = addEnquiry({
      ...details,
      followUp: form.scheduleFollowUp ? { date: form.followUpDate, time: form.followUpTime, type: form.followUpType } : null,
    })
    onSaved(created)
  }

  const isCompany = form.clientType === 'Company'

  // Same mobile number or company name already in the CRM? Warn, but don't block: repeat clients are normal.
  const phone = normalisePhone(form.phone)
  const name = form.company.trim().toLowerCase()
  const duplicates = isEdit
    ? []
    : leads.filter((l) => (phone.length === 10 && l.phone === phone) || (name.length > 2 && l.company.toLowerCase() === name)).slice(0, 3)

  return (
    <div className="drawer-root">
      <div className="drawer-backdrop" onClick={onClose} />
      <aside className="enquiry-drawer" role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <header className="drawer-header">
          <h2 id={titleId}>{isEdit ? `Edit ${lead.id}` : 'Add New Enquiry'}</h2>
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
                <ChoiceChips label="Client type" name="clientType" options={CLIENT_TYPES} value={form.clientType} onChange={(v) => update('clientType', v)} />
                <ChoiceChips
                  label="Preferred contact"
                  name="preferredContact"
                  options={CONTACT_MODES}
                  value={form.preferredContact}
                  onChange={(v) => update('preferredContact', v)}
                />
                <Field label={isCompany ? 'Company name' : 'Client name'} required error={errors.company} wide>
                  <input
                    ref={firstFieldRef}
                    value={form.company}
                    onChange={(e) => update('company', e.target.value)}
                    placeholder={isCompany ? 'Aravali Minerals Pvt. Ltd.' : 'Ramesh Choudhary'}
                    autoComplete="organization"
                  />
                </Field>
                <Field label="Contact person" required error={errors.contactPerson}>
                  <input value={form.contactPerson} onChange={(e) => update('contactPerson', e.target.value)} placeholder="Mahesh Jain" autoComplete="name" />
                </Field>
                <Field label="Mobile number" required error={errors.phone}>
                  <input value={form.phone} onChange={(e) => update('phone', e.target.value)} placeholder="98290 12345" inputMode="tel" autoComplete="tel" />
                </Field>
                <Field label="Email" error={errors.email}>
                  <input value={form.email} onChange={(e) => update('email', e.target.value)} placeholder="mahesh@aravaliminerals.in" type="email" autoComplete="email" />
                </Field>
                <Field label="Site location" hint="District, State">
                  <input value={form.location} onChange={(e) => update('location', e.target.value)} placeholder="Rajsamand, Rajasthan" />
                </Field>
              </div>
              {duplicates.length > 0 && (
                <div className="duplicate-warning" role="status">
                  <AlertTriangle size={16} />
                  <div>
                    <strong>This client may already be in the CRM</strong>
                    {duplicates.map((d) => (
                      <Link key={d.id} to={`/leads/${d.id}`} onClick={onClose}>
                        {d.id} · {d.company} · {d.stage}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
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
                <ChoiceChips label="Priority" name="priority" options={PRIORITIES} value={form.priority} onChange={(v) => update('priority', v)} tones={PRIORITY_TONES} />
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
                {form.source === 'Referral' && (
                  <Field label="Referred by">
                    <input value={form.referredBy} onChange={(e) => update('referredBy', e.target.value)} placeholder="Name of the person or company" />
                  </Field>
                )}
                <Field label="Assign to" required>
                  <select value={form.assignedTo} onChange={(e) => update('assignedTo', e.target.value)}>
                    {TEAM.map((member) => (
                      <option key={member}>{member}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Expected timeline">
                  <select value={form.expectedTimeline} onChange={(e) => update('expectedTimeline', e.target.value)}>
                    <option value="">Not known yet</option>
                    {TIMELINES.map((timeline) => (
                      <option key={timeline}>{timeline}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Estimated value (₹)" error={errors.estimatedValue} hint="Optional — rough budget, if the client shared one">
                  <input value={form.estimatedValue} onChange={(e) => update('estimatedValue', e.target.value.replace(/[^\d]/g, ''))} placeholder="250000" inputMode="numeric" />
                </Field>
                <Field label="Enquiry description" wide>
                  <textarea
                    value={form.description}
                    onChange={(e) => update('description', e.target.value)}
                    placeholder="What the client asked for — lease area, survey needs, deadlines…"
                    rows={3}
                    maxLength={500}
                  />
                </Field>
              </div>
            </fieldset>

            {!isEdit && (
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
            )}
          </div>

          <footer className="drawer-footer">
            <button type="button" className="btn" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {isEdit ? 'Save Changes' : 'Save Enquiry'}
            </button>
          </footer>
        </form>
      </aside>
    </div>
  )
}
