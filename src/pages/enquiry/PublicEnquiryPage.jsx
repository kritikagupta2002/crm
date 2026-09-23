import { AlertTriangle, ArrowLeft, Check, CheckCircle2, Copy, FileText, Mail, MessageCircle, Paperclip, Phone, Send, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Logo } from '../../components/common/Logo'
import { ServicePicker } from '../../components/enquiry/ServicePicker'
import { useCrm } from '../../context/crm'
import { CONTACT_MODES, MINERALS, TEAM, TIMELINES, TODAY } from '../../data/mockData'
import { addDays, formatDate, toISODate } from '../../utils/date'
import { newService, serviceFields, servicesOf } from '../../utils/leads'
import { whatsappLink } from '../../utils/whatsapp'
import { PortalBand } from '../portal/PortalBand'
import '../portal/portal.css'
import './publicEnquiry.css'

const digits = (value) => value.replace(/\D/g, '').slice(-10)
const MAX_SIZE = 10 * 1024 * 1024
const formatSize = (bytes) => (bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`)

/* How we first get back to the client, in their chosen way. */
const FIRST_STEP = {
  Call: ['We call you', 'Within one working day, to understand the site and the scope.'],
  WhatsApp: ['We message you on WhatsApp', 'Within one working day, to understand the site and the scope.'],
  Email: ['We email you', 'Within one working day, with a few questions about the site and the scope.'],
}
const REPLY_VERB = { Call: 'call', WhatsApp: 'message', Email: 'email' }

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
    services: [newService()],
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

/* An open enquiry from the same mobile for one of the same services in the last two months: likely sent twice. */
function earlierEnquiry(leads, form) {
  const phone = digits(form.phone)
  const since = toISODate(addDays(TODAY, -60))
  const wanted = new Set(form.services.map((s) => s.serviceDetail))
  return leads.find(
    (l) => l.phone && digits(l.phone) === phone && !['Won', 'Lost'].includes(l.stage) && l.createdOn >= since && servicesOf(l).some((s) => wanted.has(s.serviceDetail)),
  )
}

/* After sending: the enquiry ID to keep (it is the portal login), what was sent, and what happens next. */
function EnquiryDone({ created, settings, onAnother, onPortal }) {
  const [copied, setCopied] = useState(false)
  const services = servicesOf(created)
  const portal = `${window.location.origin}/login`
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(created.id)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard blocked: the ID is on screen to note down.
    }
  }

  return (
    <section className="card portal-card enquiry-done">
      <span className="enquiry-done-icon">
        <CheckCircle2 size={28} />
      </span>
      <h1>Thank you, {created.contactPerson}</h1>
      <p>
        {created.assignedTo} from our team will {REPLY_VERB[created.preferredContact] ?? 'call'} you within one working day.
      </p>

      <div className="enquiry-id">
        <span>Your enquiry ID</span>
        <strong className="mono-sub">{created.id}</strong>
        <button type="button" className="btn btn-small" onClick={copy}>
          {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <p className="muted small">Keep this ID: with your mobile number it opens your client portal, where you can follow the enquiry and later see your quotation.</p>

      <dl className="enquiry-summary">
        <div>
          <dt>{services.length > 1 ? 'Services' : 'Service'}</dt>
          <dd>{services.map((s) => s.serviceDetail).join(', ')}</dd>
        </div>
        <div>
          <dt>Site</dt>
          <dd>{created.location}</dd>
        </div>
        {created.expectedTimeline && (
          <div>
            <dt>Needed</dt>
            <dd>{created.expectedTimeline}</dd>
          </div>
        )}
        {created.documents?.length > 0 && (
          <div>
            <dt>Documents</dt>
            <dd>
              {created.documents.length} file{created.documents.length === 1 ? '' : 's'} attached
            </dd>
          </div>
        )}
      </dl>

      <div className="portal-actions enquiry-done-actions">
        <a
          className="btn btn-whatsapp"
          target="_blank"
          rel="noreferrer"
          href={whatsappLink(created.phone, `My enquiry with ${settings.companyName}: ${created.id} (${services.map((s) => s.serviceDetail).join(', ')}), sent on ${formatDate(created.createdOn)}.\nClient portal: ${portal}`)}
        >
          <MessageCircle size={15} /> Save ID on WhatsApp
        </a>
        <button className="btn btn-primary" onClick={onPortal}>
          Open my client portal
        </button>
      </div>
      <button className="link-button enquiry-another" onClick={onAnother}>
        Send another enquiry
      </button>
    </section>
  )
}

/*
 * The public "Send an enquiry" page: what the website's enquiry button opens. Anyone can use it; a signed-in
 * client gets their details filled in. The enquiry lands in the CRM like any other and the client can
 * follow it in their portal straight away.
 */
/* Tomorrow, or Monday when tomorrow is a Sunday. */
const nextWorkingDay = () => {
  const day = addDays(TODAY, 1)
  return toISODate(day.getDay() === 0 ? addDays(day, 1) : day)
}

export function PublicEnquiryPage() {
  const { leads, settings, clientLeadId, addEnquiry, signInClient } = useCrm()
  const navigate = useNavigate()
  const client = clientLeadId ? leads.find((l) => l.id === clientLeadId) : null
  const [form, setForm] = useState(() => blankForm(client))
  const [files, setFiles] = useState([])
  const [fileError, setFileError] = useState('')
  const [errors, setErrors] = useState({})
  const [tried, setTried] = useState(false)
  const [earlier, setEarlier] = useState(null)
  const [created, setCreated] = useState(null)
  const fileInput = useRef(null)

  useEffect(() => {
    document.title = 'Send an Enquiry · Bansal Geo Solutions'
  }, [])

  const update = (key, value) => {
    const next = { ...form, [key]: value }
    setForm(next)
    setEarlier(null)
    if (tried) setErrors(validate(next))
  }

  const addFiles = (list) => {
    const picked = [...list]
    const tooBig = picked.filter((f) => f.size > MAX_SIZE)
    setFileError(tooBig.length ? `${tooBig.map((f) => f.name).join(', ')} is over 10 MB and was not added.` : '')
    setFiles([...files, ...picked.filter((f) => f.size <= MAX_SIZE && !files.some((x) => x.name === f.name && x.size === f.size))].slice(0, 8))
  }

  const send = () => {
    const lead = addEnquiry({
      clientType: form.company.trim() ? 'Company' : 'Individual',
      company: form.company.trim() || form.contactPerson.trim(),
      contactPerson: form.contactPerson.trim(),
      phone: digits(form.phone),
      email: form.email.trim() || undefined,
      location: form.location.trim(),
      preferredContact: form.preferredContact,
      ...serviceFields(form.services),
      mineral: form.mineral || undefined,
      priority: 'Medium',
      source: 'Website / WhatsApp',
      expectedTimeline: form.expectedTimeline || undefined,
      assignedTo: nextOwner(leads),
      description: form.description.trim() || undefined,
      // The thank-you screen promises a call within one working day, so the owner gets that call on their list.
      followUp: { type: 'Call', date: nextWorkingDay(), time: '11:00' },
      files,
      byClient: true,
    })
    setCreated(lead)
    setEarlier(null)
    window.scrollTo(0, 0)
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
    // Sent twice by mistake? Say so first; the client can still send it.
    const match = earlierEnquiry(leads, form)
    if (match && !earlier) {
      setEarlier(match)
      return
    }
    send()
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
  const [firstStep, firstStepNote] = FIRST_STEP[form.preferredContact] ?? FIRST_STEP.Call

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
        <p className="band-lead">{created ? `Registered as ${created.id} on ${formatDate(created.createdOn)}.` : 'Tell us about your lease or site and what you need. We reply within one working day.'}</p>
      </PortalBand>

      <main className="portal-main page-anim">
        {created ? (
          <EnquiryDone
            created={created}
            settings={settings}
            onAnother={() => {
              setCreated(null)
              setForm(blankForm(client ?? created))
              setFiles([])
              setTried(false)
            }}
            onPortal={() => {
              signInClient(created.id)
              navigate('/portal')
            }}
          />
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
                    <ServicePicker value={form.services} onChange={(v) => update('services', v)} />
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
                    {field('description', 'Anything else we should know', <textarea rows={2} value={form.description} onChange={(e) => update('description', e.target.value)} placeholder="Lease area, khasra number, deadline…" />, { wide: true })}
                  </div>
                </fieldset>

                <fieldset>
                  <legend>Documents (optional)</legend>
                  <div className="enquiry-files">
                    <button type="button" className="btn" onClick={() => fileInput.current.click()} disabled={files.length >= 8}>
                      <Paperclip size={15} /> Attach files
                    </button>
                    <span className="muted small">Lease papers, maps, earlier reports or a work order. PDF or images, up to 10 MB each.</span>
                    <input
                      ref={fileInput}
                      type="file"
                      multiple
                      hidden
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.kml,.kmz,.zip,image/*"
                      onChange={(e) => {
                        addFiles(e.target.files)
                        e.target.value = ''
                      }}
                    />
                  </div>
                  {files.length > 0 && (
                    <ul className="enquiry-file-list">
                      {files.map((f) => (
                        <li key={`${f.name}-${f.size}`}>
                          <FileText size={16} />
                          <span>
                            <strong>{f.name}</strong>
                            <span className="muted">{formatSize(f.size)}</span>
                          </span>
                          <button type="button" className="icon-button small" onClick={() => setFiles(files.filter((x) => x !== f))} aria-label={`Remove ${f.name}`}>
                            <X size={15} />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                  {fileError && <p className="auth-error">{fileError}</p>}
                </fieldset>

                {earlier && (
                  <div className="duplicate-warning enquiry-earlier" role="alert">
                    <AlertTriangle size={18} />
                    <div>
                      <strong>You already have an open enquiry for this</strong>
                      <p>
                        {earlier.id} for {servicesOf(earlier).map((s) => s.serviceDetail).join(', ')}, sent on {formatDate(earlier.createdOn)}. {earlier.assignedTo} is handling it; you can follow it in your
                        client portal with that ID.
                      </p>
                      <div className="portal-actions">
                        <Link className="btn" to="/login" state={{ tab: 'client' }}>
                          Open client portal
                        </Link>
                        <button type="button" className="btn btn-primary" onClick={send}>
                          <Send size={15} /> Send as a new enquiry
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                <div className="public-form-foot">
                  <span className="muted">We use these details only to reply to your enquiry.</span>
                  <button type="submit" className="btn btn-primary" disabled={Boolean(earlier)}>
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
                    <strong>{firstStep}</strong>
                    <span>{firstStepNote}</span>
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
