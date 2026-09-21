import { ArrowLeft, CheckCircle2, Mail, MessageCircle, Phone, Send } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Logo } from '../../components/common/Logo'
import { useCrm } from '../../context/crm'
import { CONTACT_MODES, MINERALS, SERVICE_DETAILS, SERVICES, TEAM, TIMELINES } from '../../data/mockData'
import { whatsappLink } from '../../utils/whatsapp'
import { PortalBand } from '../portal/PortalBand'
import '../portal/portal.css'
import './publicEnquiry.css'

const digits = (value) => value.replace(/\D/g, '').slice(-10)

/* New enquiries go to whoever has the fewest open ones, like the team does by hand. */
function nextOwner(leads) {
  const open = (name) => leads.filter((l) => l.assignedTo === name && l.stage !== 'Won' && l.stage !== 'Lost').length
  return [...TEAM].sort((a, b) => open(a) - open(b))[0]
}

function blankForm(client) {
  return {
    contactPerson: client?.contactPerson ?? '',
    company: client?.company ?? '',
    phone: client?.phone ?? '',
    email: client?.email ?? '',
    location: '',
    service: SERVICES[0],
    serviceDetail: SERVICE_DETAILS[SERVICES[0]][0],
    mineral: '',
    expectedTimeline: '',
    preferredContact: 'Call',
    description: '',
  }
}

function validate(form) {
  const errors = {}
  if (!form.contactPerson.trim()) errors.contactPerson = 'Enter your name.'
  if (digits(form.phone).length !== 10) errors.phone = 'Enter a 10-digit mobile number.'
  if (form.email.trim() && !/^\S+@\S+\.\S+$/.test(form.email.trim())) errors.email = 'Check the email address.'
  if (!form.location.trim()) errors.location = 'Enter the site location (district, state).'
  return errors
}

/*
 * The public "Send an enquiry" page: what the website's enquiry button opens. Anyone can use it; a signed-in
 * client gets their details filled in. The enquiry lands in the CRM like any other and the client can
 * follow it in their portal straight away.
 */
export function PublicEnquiryPage() {
  const { leads, settings, session, addEnquiry, signInClient } = useCrm()
  const navigate = useNavigate()
  const client = session?.type === 'client' ? leads.find((l) => l.id === session.leadId) : null
  const [form, setForm] = useState(() => blankForm(client))
  const [errors, setErrors] = useState({})
  const [tried, setTried] = useState(false)
  const [created, setCreated] = useState(null)

  useEffect(() => {
    document.title = 'Send an Enquiry · Bansal Geo Solutions'
  }, [])

  const update = (key, value) => {
    const next = { ...form, [key]: value }
    if (key === 'service') next.serviceDetail = SERVICE_DETAILS[value][0]
    setForm(next)
    if (tried) setErrors(validate(next))
  }

  const submit = (e) => {
    e.preventDefault()
    setTried(true)
    const found = validate(form)
    setErrors(found)
    if (Object.keys(found).length) {
      requestAnimationFrame(() => document.querySelector('.public-form .has-error input, .public-form .has-error select')?.focus())
      return
    }
    const lead = addEnquiry({
      clientType: form.company.trim() ? 'Company' : 'Individual',
      company: form.company.trim() || form.contactPerson.trim(),
      contactPerson: form.contactPerson.trim(),
      phone: digits(form.phone),
      email: form.email.trim() || undefined,
      location: form.location.trim(),
      preferredContact: form.preferredContact,
      service: form.service,
      serviceDetail: form.serviceDetail,
      mineral: form.mineral || undefined,
      priority: 'Medium',
      source: 'Website / WhatsApp',
      expectedTimeline: form.expectedTimeline || undefined,
      assignedTo: nextOwner(leads),
      description: form.description.trim() || undefined,
      followUp: null,
    })
    setCreated(lead)
    window.scrollTo(0, 0)
  }

  const field = (key, label, input, { required = false, wide = false } = {}) => (
    <label className={`field ${wide ? 'field-wide' : ''} ${errors[key] ? 'has-error' : ''}`}>
      <span className="field-label">
        {label} {required && <em>*</em>}
      </span>
      {input}
      {errors[key] && <span className="field-error">{errors[key]}</span>}
    </label>
  )

  const companyPhone = settings.phone.replace(/\D/g, '').slice(-10)

  return (
    <div className="portal public-enquiry">
      <header className="portal-top">
        <div className="portal-top-inner">
          <div className="portal-brand">
            <Logo />
            <span className="portal-tag">Enquiry</span>
          </div>
          <Link className="btn" to={client ? '/portal' : '/login'} state={client ? undefined : { tab: 'client' }}>
            <ArrowLeft size={15} /> {client ? 'Back to my portal' : 'Client sign in'}
          </Link>
        </div>
      </header>

      <PortalBand compact>
        <h1 className="band-title">{created ? 'Enquiry received' : 'Send an enquiry'}</h1>
        <p className="band-lead">
          {created ? 'Thank you for writing to us.' : 'Tell us about your lease or site and what you need. We reply within one working day.'}
        </p>
      </PortalBand>

      <main className="portal-main page-anim">
        {created ? (
          <section className="card portal-card enquiry-done">
            <span className="enquiry-done-icon">
              <CheckCircle2 size={28} />
            </span>
            <h1>Thank you, {created.contactPerson}</h1>
            <p>
              Your enquiry for <b>{created.serviceDetail}</b> is registered as <b className="mono-sub">{created.id}</b>. {created.assignedTo} from our team will{' '}
              {created.preferredContact === 'Email' ? 'email' : created.preferredContact === 'WhatsApp' ? 'message' : 'call'} you within one working day.
            </p>
            <p className="muted">You can follow it, and later see your quotation, in the client portal. Sign in with the enquiry ID and your mobile number.</p>
            <div className="portal-actions enquiry-done-actions">
              <button
                className="btn"
                onClick={() => {
                  setCreated(null)
                  setForm(blankForm(client ?? created))
                  setTried(false)
                }}
              >
                Send another enquiry
              </button>
              <button
                className="btn btn-primary"
                onClick={() => {
                  signInClient(created.id)
                  navigate('/portal')
                }}
              >
                Open my client portal
              </button>
            </div>
          </section>
        ) : (
          <div className="portal-grid">
            <section className="card portal-card">
              <form className="public-form" onSubmit={submit} noValidate>
                <fieldset>
                  <legend>Your details</legend>
                  <div className="form-grid">
                    {field('contactPerson', 'Your name', <input value={form.contactPerson} onChange={(e) => update('contactPerson', e.target.value)} autoComplete="name" />, { required: true })}
                    {field('company', 'Company / organisation', <input value={form.company} onChange={(e) => update('company', e.target.value)} placeholder="Leave empty if individual" autoComplete="organization" />)}
                    {field('phone', 'Mobile number', <input type="tel" inputMode="numeric" value={form.phone} onChange={(e) => update('phone', e.target.value)} placeholder="10-digit mobile" autoComplete="tel" />, { required: true })}
                    {field('email', 'Email', <input type="email" value={form.email} onChange={(e) => update('email', e.target.value)} autoComplete="email" />)}
                    {field('preferredContact', 'Best way to reach you', (
                      <select value={form.preferredContact} onChange={(e) => update('preferredContact', e.target.value)}>
                        {CONTACT_MODES.map((m) => (
                          <option key={m}>{m}</option>
                        ))}
                      </select>
                    ))}
                  </div>
                </fieldset>

                <fieldset>
                  <legend>Your requirement</legend>
                  <div className="form-grid">
                    {field('service', 'Service area', (
                      <select value={form.service} onChange={(e) => update('service', e.target.value)}>
                        {SERVICES.map((s) => (
                          <option key={s}>{s}</option>
                        ))}
                      </select>
                    ))}
                    {field('serviceDetail', 'Service needed', (
                      <select value={form.serviceDetail} onChange={(e) => update('serviceDetail', e.target.value)}>
                        {SERVICE_DETAILS[form.service].map((s) => (
                          <option key={s}>{s}</option>
                        ))}
                      </select>
                    ))}
                    {field('location', 'Site location', <input value={form.location} onChange={(e) => update('location', e.target.value)} placeholder="e.g. Rajsamand, Rajasthan" />, { required: true })}
                    {field('mineral', 'Mineral', (
                      <select value={form.mineral} onChange={(e) => update('mineral', e.target.value)}>
                        <option value="">Not sure / not applicable</option>
                        {MINERALS.map((m) => (
                          <option key={m}>{m}</option>
                        ))}
                      </select>
                    ))}
                    {field('expectedTimeline', 'When do you need it?', (
                      <select value={form.expectedTimeline} onChange={(e) => update('expectedTimeline', e.target.value)}>
                        <option value="">Not decided</option>
                        {TIMELINES.map((t) => (
                          <option key={t}>{t}</option>
                        ))}
                      </select>
                    ))}
                    {field('description', 'Anything else we should know', <textarea rows={2} value={form.description} onChange={(e) => update('description', e.target.value)} placeholder="Lease area, khasra number, deadline…" />)}
                  </div>
                </fieldset>

                <div className="public-form-foot">
                  <span className="muted">We use these details only to reply to your enquiry.</span>
                  <button type="submit" className="btn btn-primary">
                    <Send size={15} /> Send enquiry
                  </button>
                </div>
              </form>
            </section>

            <aside className="portal-col">
              <section className="card portal-card">
                <h2>What happens next</h2>
                <ol className="next-steps">
                  <li>
                    <strong>We call you</strong>
                    <span>Within one working day, to understand the site and the scope.</span>
                  </li>
                  <li>
                    <strong>Site visit or discussion</strong>
                    <span>If needed, our geologist visits the lease or reviews your documents.</span>
                  </li>
                  <li>
                    <strong>Quotation in your portal</strong>
                    <span>View, accept or ask for changes online — and later follow the project and government approvals.</span>
                  </li>
                </ol>
              </section>
              <section className="card portal-card portal-contact">
                <h2>Prefer to talk?</h2>
                <a href={`tel:${settings.phone.replace(/\s/g, '')}`}>
                  <Phone size={14} /> {settings.phone}
                </a>
                <a href={`mailto:${settings.email}`}>
                  <Mail size={14} /> {settings.email}
                </a>
                <a className="btn btn-whatsapp" target="_blank" rel="noreferrer" href={whatsappLink(companyPhone, 'Hello, I would like to discuss a requirement with Bansal Geo.')}>
                  <MessageCircle size={15} /> WhatsApp us
                </a>
              </section>
            </aside>
          </div>
        )}
      </main>

      <footer className="portal-foot">
        © {new Date().getFullYear()} {settings.companyName}
      </footer>
    </div>
  )
}
