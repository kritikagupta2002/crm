import { ArrowLeft, Check, CheckCircle2, Copy, FileText, Mail, MessageCircle, Paperclip, Phone, Search, X } from 'lucide-react'
import { useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Logo } from '../../components/common/Logo'
import { useCrm } from '../../context/crm'
import { ACCOUNT_TYPES, COMPANY_CATEGORIES, COMPANY_TYPES, LEGAL_STATUS, PREFERENCE_CATEGORIES, STATES, TITLES, VENDOR_DOCS, WORK_CATEGORIES } from '../../data/vendorApplications'
import { formatDate } from '../../utils/date'
import { digitsOf, requiredDocs, validateApplication } from '../../utils/vendorChecks'
import { whatsappLink } from '../../utils/whatsapp'
import { PortalBand } from '../portal/PortalBand'
import '../portal/portal.css'
import '../enquiry/publicEnquiry.css'
import './vendor.css'

const MAX_SIZE = 10 * 1024 * 1024
const formatSize = (bytes) => (bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`)
const YEARS = Array.from({ length: 60 }, (_, i) => String(new Date().getFullYear() - i))

const blankApp = () => ({
  firm: { name: '', preferential: false, preference: '', preferenceNo: '', regNo: '', partners: '', companyType: '', year: '', nature: '', legalStatus: '', category: '' },
  work: { categories: [], areas: '', experience: '', accreditation: '', turnover: '' },
  address: { line: '', city: '', state: 'Rajasthan', country: 'India', pincode: '' },
  contact: { title: 'Mr', name: '', dob: '', designation: '', phone: '', mobile: '', email: '', mobileVerified: false },
  tax: { pan: '', gstRegistered: true, gstin: '' },
  bank: { holder: '', bank: '', branch: '', accountNo: '', accountConfirm: '', ifsc: '', type: 'Current' },
  documents: [],
  declared: false,
  captchaOk: false,
})

/* The saved application as the form's starting point, when a firm corrects one that was sent back (its mobile is already verified). */
const editable = (app) => ({
  ...blankApp(),
  ...app,
  contact: { ...blankApp().contact, ...app.contact, mobileVerified: true },
  bank: { ...app.bank, accountConfirm: app.bank.accountNo },
  declared: false,
  captchaOk: false,
})

/* Tidies what the firm typed before it is saved: upper-case PAN, GSTIN and IFSC; digits only in numbers; no form-only fields. */
function tidy(app) {
  // The second account number is only there to catch typos; the captcha and the verification are for this form only.
  const bank = { ...app.bank }
  delete bank.accountConfirm
  const contact = { ...app.contact, mobile: digitsOf(app.contact.mobile).slice(-10) }
  delete contact.mobileVerified
  const rest = { ...app }
  delete rest.captchaOk
  return {
    ...rest,
    firm: { ...app.firm, preference: app.firm.preferential ? app.firm.preference : '', preferenceNo: app.firm.preferential ? app.firm.preferenceNo : '' },
    tax: { ...app.tax, pan: app.tax.pan.trim().toUpperCase(), gstin: app.tax.gstRegistered ? app.tax.gstin.trim().toUpperCase() : '' },
    bank: { ...bank, accountNo: digitsOf(bank.accountNo), ifsc: bank.ifsc.trim().toUpperCase() },
    contact,
    address: { ...app.address, pincode: digitsOf(app.address.pincode) },
  }
}

/* A small sum instead of eProc's image captcha: the demo has no server to check one. */
const newCaptcha = () => {
  const a = 2 + Math.floor(Math.random() * 8)
  const b = 1 + Math.floor(Math.random() * 9)
  return { question: `${a} + ${b}`, answer: String(a + b) }
}

/*
 * Mobile verification as on eProc: a code goes to the number and must be entered before the form can be sent.
 * The demo shows the code on screen, since no SMS goes out; it is valid for 15 minutes (eProc: 900 seconds).
 */
function MobileVerify({ mobile, verified, onVerified, error }) {
  const [sent, setSent] = useState(null) // { code, to }
  const [code, setCode] = useState('')
  const [wrong, setWrong] = useState(false)
  const valid = /^[6-9][0-9]{9}$/.test(digitsOf(mobile).slice(-10))
  // A different number needs a new code.
  const current = sent && sent.to === digitsOf(mobile).slice(-10) ? sent : null

  if (verified)
    return (
      <span className="verify-ok">
        <CheckCircle2 size={15} /> Verified
      </span>
    )
  return (
    <div className="verify">
      {!current ? (
        <button type="button" className="btn btn-small" disabled={!valid} onClick={() => (setSent({ code: String(100000 + Math.floor(Math.random() * 900000)), to: digitsOf(mobile).slice(-10) }), setCode(''), setWrong(false))}>
          Send verification code
        </button>
      ) : (
        <>
          <input className="verify-code" value={code} onChange={(e) => (setCode(e.target.value), setWrong(false))} inputMode="numeric" maxLength={6} placeholder="6-digit code" aria-label="Verification code" />
          <button type="button" className="btn btn-small btn-primary" onClick={() => (code.trim() === current.code ? onVerified() : setWrong(true))}>
            Verify
          </button>
          <span className="field-hint">
            Demo: the code sent is <b>{current.code}</b>. {wrong && <span className="text-red">That code doesn’t match.</span>}
          </span>
        </>
      )}
      {error && !current && <span className="field-error">{error}</span>}
    </div>
  )
}

/*
 * The registration form, laid out like eProc Rajasthan's "Online Enrollment of Corporate/Bidder" (login and
 * correspondence, company details with Company Type in place of Bidder Type, contact details, captcha), with what our
 * work needs added: kinds of work, GST, the bank account for payments and the papers. New, or an application sent
 * back for changes (then `existing` is set).
 */
function RegisterForm({ existing, onDone }) {
  const { submitVendorApplication, resubmitVendorApplication } = useCrm()
  const [app, setApp] = useState(() => (existing ? editable(existing) : blankApp()))
  const [files, setFiles] = useState([]) // [{ kind, file }]
  const [errors, setErrors] = useState({})
  const [tried, setTried] = useState(false)
  const [fileError, setFileError] = useState('')
  const [captcha, setCaptcha] = useState(newCaptcha)
  const [captchaInput, setCaptchaInput] = useState('')
  const pickers = useRef({})

  const apply = (next) => {
    setApp(next)
    if (tried) setErrors(validateApplication(next, files))
  }
  const update = (path, value) => {
    const [section, key] = path.split('.')
    const next = key ? { ...app, [section]: { ...app[section], [key]: value } } : { ...app, [section]: value }
    // A changed mobile has to be verified again.
    if (path === 'contact.mobile') next.contact.mobileVerified = false
    apply(next)
  }
  const toggleCategory = (c) => update('work.categories', app.work.categories.includes(c) ? app.work.categories.filter((x) => x !== c) : [...app.work.categories, c])

  const pickFile = (kind, file) => {
    if (!file) return
    if (file.size > MAX_SIZE) return setFileError(`${file.name} is over 10 MB and was not added.`)
    setFileError('')
    const next = [...files.filter((f) => f.kind !== kind), { kind, file }]
    setFiles(next)
    if (tried) setErrors(validateApplication(app, next))
  }

  const submit = (e) => {
    e.preventDefault()
    setTried(true)
    const found = validateApplication(app, files)
    setErrors(found)
    if (Object.keys(found).length) {
      requestAnimationFrame(() => document.querySelector('.vendor-form .has-error')?.scrollIntoView({ behavior: 'smooth', block: 'center' }))
      return
    }
    const clean = tidy(app)
    if (existing) {
      resubmitVendorApplication(existing.id, clean, files)
      onDone({ ...existing, ...clean, status: 'New' }, true)
    } else {
      onDone({ ...clean, id: submitVendorApplication(clean, files), submittedAt: new Date().toISOString() }, false)
    }
  }

  const field = (path, label, input, { required = false, wide = false, hint } = {}) => (
    <label className={`field ${wide ? 'field-wide' : ''} ${errors[path] ? 'has-error' : ''}`}>
      <span className="field-label">
        {label} {required && <em>*</em>}
      </span>
      {input}
      {errors[path] ? <span className="field-error">{errors[path]}</span> : hint && <span className="field-hint">{hint}</span>}
    </label>
  )
  const text = (path, props = {}) => {
    const [section, key] = path.split('.')
    return <input value={app[section][key]} onChange={(e) => update(path, e.target.value)} {...props} />
  }
  const area = (path, props = {}) => {
    const [section, key] = path.split('.')
    return <textarea rows={2} value={app[section][key]} onChange={(e) => update(path, e.target.value)} {...props} />
  }
  const select = (path, options, blank) => {
    const [section, key] = path.split('.')
    return (
      <select value={app[section][key]} onChange={(e) => update(path, e.target.value)}>
        {blank && <option value="">{blank}</option>}
        {options.map((o) => (
          <option key={o}>{o}</option>
        ))}
      </select>
    )
  }
  const needed = requiredDocs(app)
  const saved = (kind) => existing?.documents.filter((d) => d.kind === kind) ?? []

  return (
    <form className="public-form vendor-form" onSubmit={submit} noValidate>
      {existing?.note && (
        <p className="vendor-note">
          <b>Please correct:</b> {existing.note}
        </p>
      )}

      <fieldset>
        <legend>Login &amp; correspondence</legend>
        <div className="form-grid">
          {field('contact.email', 'Correspondence email', text('contact.email', { type: 'email', autoComplete: 'email', placeholder: 'name@firm.in' }), { required: true, hint: 'All mail about your registration and tenders comes here.' })}
          <div className={`field field-wide-2 ${errors['contact.mobile'] ? 'has-error' : ''}`}>
            <span className="field-label">
              Mobile <em>*</em>
            </span>
            <div className="mobile-row">
              <span className="mobile-code">+91</span>
              <input value={app.contact.mobile} onChange={(e) => update('contact.mobile', e.target.value)} type="tel" inputMode="numeric" placeholder="10-digit mobile" autoComplete="tel" aria-label="Mobile" readOnly={Boolean(existing)} />
              <MobileVerify mobile={app.contact.mobile} verified={app.contact.mobileVerified} onVerified={() => apply({ ...app, contact: { ...app.contact, mobileVerified: true } })} error={errors['contact.mobile']} />
            </div>
            <span className="field-hint">After approval, your vendor ID and this mobile sign you in to the vendor portal.</span>
          </div>
        </div>
      </fieldset>

      <fieldset>
        <legend>Company details</legend>
        <div className="form-grid">
          {field('firm.name', 'Company name / licence holder name', text('firm.name', { autoComplete: 'organization' }), { required: true, wide: true })}
          <label className="field check-field">
            <span className="field-label">Preferential bidder</span>
            <span className="check-line">
              <input type="checkbox" checked={app.firm.preferential} onChange={(e) => update('firm.preferential', e.target.checked)} />
              <span>Yes</span>
            </span>
          </label>
          {app.firm.preferential && field('firm.preference', 'Preference category', select('firm.preference', PREFERENCE_CATEGORIES, 'Choose…'), { required: true })}
          {app.firm.preferential && field('firm.preferenceNo', app.firm.preference === 'Startup' ? 'DPIIT recognition no.' : 'Udyam registration no.', text('firm.preferenceNo', { placeholder: app.firm.preference === 'Startup' ? 'DIPP00000' : 'UDYAM-RJ-00-0000000' }))}
          {field('firm.regNo', 'Registration number', text('firm.regNo'), { required: true, hint: 'CIN, LLPIN, firm, shop or Udyam registration' })}
          {field('address.line', 'Registered address', area('address.line', { autoComplete: 'street-address' }), { required: true, wide: true })}
          {field('firm.partners', 'Name of partners / directors', area('firm.partners'), { wide: true })}
        </div>

        <div className={`field company-type ${errors['firm.companyType'] ? 'has-error' : ''}`} role="radiogroup" aria-label="Company type">
          <span className="field-label">
            Company type <em>*</em>
          </span>
          <div className="choice-chips">
            {COMPANY_TYPES.map((t) => (
              <label key={t} className={`choice-chip ${app.firm.companyType === t ? 'is-selected' : ''}`}>
                <input type="radio" name="companyType" checked={app.firm.companyType === t} onChange={() => update('firm.companyType', t)} />
                {t}
              </label>
            ))}
          </div>
          {errors['firm.companyType'] && <span className="field-error">{errors['firm.companyType']}</span>}
        </div>

        <div className="form-grid vendor-form-row">
          {field('address.city', 'City', text('address.city'), { required: true })}
          {field('address.state', 'State', select('address.state', STATES), { required: true })}
          {field('address.country', 'Country', <input value="India" readOnly />, { required: true })}
          {field('address.pincode', 'Postal code', text('address.pincode', { inputMode: 'numeric', autoComplete: 'postal-code' }), { required: true })}
          {field('tax.pan', 'PAN number', text('tax.pan', { placeholder: 'AESTG2458A', maxLength: 10, className: 'upper' }), { required: true, hint: 'PAN has 10 characters, e.g. AESTG2458A' })}
          {field('firm.year', 'Establishment year', select('firm.year', YEARS, 'Year…'))}
          {field('firm.nature', 'Nature of business', text('firm.nature', { placeholder: 'e.g. Exploratory core drilling' }), { required: true, wide: true })}
          {field('firm.legalStatus', 'Legal status', select('firm.legalStatus', LEGAL_STATUS, 'Choose…'), { required: true })}
          {field('firm.category', 'Company category', select('firm.category', COMPANY_CATEGORIES, 'Choose…'), { required: true })}
        </div>
      </fieldset>

      <fieldset>
        <legend>Contact details</legend>
        <p className="muted small fieldset-note">The company’s contact person. Mobile and email are the ones given above.</p>
        <div className="form-grid">
          {field('contact.title', 'Title', select('contact.title', TITLES), { required: true })}
          {field('contact.name', 'Contact name', text('contact.name', { autoComplete: 'name' }), { required: true })}
          {field('contact.dob', 'Date of birth', text('contact.dob', { type: 'date', max: new Date().toISOString().slice(0, 10) }), { required: true })}
          {field('contact.designation', 'Designation', text('contact.designation'))}
          {field('contact.phone', 'Phone', text('contact.phone', { type: 'tel', placeholder: 'e.g. 0141 2227244' }))}
        </div>
      </fieldset>

      <fieldset className={errors['work.categories'] ? 'has-error' : ''}>
        <legend>
          Work you do <em>*</em>
        </legend>
        <div className="choice-chips">
          {WORK_CATEGORIES.map((c) => (
            <label key={c} className={`choice-chip ${app.work.categories.includes(c) ? 'is-selected' : ''}`}>
              <input type="checkbox" checked={app.work.categories.includes(c)} onChange={() => toggleCategory(c)} />
              {app.work.categories.includes(c) && <Check size={13} />} {c}
            </label>
          ))}
        </div>
        {errors['work.categories'] && <span className="field-error">{errors['work.categories']}</span>}
        <div className="form-grid vendor-form-row">
          {field('work.areas', 'Districts / states you work in', text('work.areas', { placeholder: 'e.g. Udaipur, Rajsamand, Bhilwara' }), { wide: true })}
          {field('work.experience', 'Years of experience', text('work.experience', { inputMode: 'numeric' }))}
          {field('work.turnover', 'Turnover, last financial year', text('work.turnover', { placeholder: 'e.g. 45 lakh' }))}
          {field('work.accreditation', 'Accreditation / licences', text('work.accreditation', { placeholder: 'NABL, DGCA remote pilot…' }))}
        </div>
      </fieldset>

      <fieldset>
        <legend>GST</legend>
        <div className="form-grid">
          {field('tax.gstRegistered', 'GST registered?', (
            <select value={app.tax.gstRegistered ? 'yes' : 'no'} onChange={(e) => update('tax.gstRegistered', e.target.value === 'yes')}>
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          ))}
          {app.tax.gstRegistered && field('tax.gstin', 'GSTIN', text('tax.gstin', { placeholder: '08AESTG2458A1Z5', maxLength: 15, className: 'upper' }), { required: true })}
        </div>
      </fieldset>

      <fieldset>
        <legend>Bank account for payments</legend>
        <div className="form-grid">
          {field('bank.holder', 'Account holder', text('bank.holder'), { required: true })}
          {field('bank.bank', 'Bank', text('bank.bank'), { required: true })}
          {field('bank.branch', 'Branch', text('bank.branch'))}
          {field('bank.accountNo', 'Account no.', text('bank.accountNo', { inputMode: 'numeric', autoComplete: 'off' }), { required: true })}
          {field('bank.accountConfirm', 'Account no. again', text('bank.accountConfirm', { inputMode: 'numeric', autoComplete: 'off', onPaste: (e) => e.preventDefault() }), { required: true })}
          {field('bank.ifsc', 'IFSC', text('bank.ifsc', { placeholder: 'SBIN0001234', maxLength: 11, className: 'upper' }), { required: true })}
          {field('bank.type', 'Account type', select('bank.type', ACCOUNT_TYPES))}
        </div>
      </fieldset>

      <fieldset className={errors.documents ? 'has-error' : ''}>
        <legend>Documents</legend>
        <ul className="doc-slots">
          {VENDOR_DOCS.map(({ kind }) => {
            const picked = files.find((f) => f.kind === kind)
            const before = saved(kind)
            return (
              <li key={kind}>
                <span className="doc-slot-name">
                  {kind} {needed.includes(kind) && <em>*</em>}
                </span>
                <span className="doc-slot-file">
                  {picked ? (
                    <>
                      <FileText size={14} /> {picked.file.name} <span className="muted">· {formatSize(picked.file.size)}</span>
                      <button type="button" className="icon-button small" onClick={() => setFiles(files.filter((f) => f !== picked))} aria-label={`Remove ${picked.file.name}`}>
                        <X size={14} />
                      </button>
                    </>
                  ) : before.length ? (
                    <span className="muted">Sent earlier: {before.map((d) => d.name).join(', ')}</span>
                  ) : (
                    <span className="muted">Not added</span>
                  )}
                </span>
                <button type="button" className="btn btn-small" onClick={() => pickers.current[kind]?.click()}>
                  <Paperclip size={14} /> {picked || before.length ? 'Replace' : 'Add'}
                </button>
                <input
                  ref={(el) => {
                    pickers.current[kind] = el
                  }}
                  type="file"
                  hidden
                  accept=".pdf,image/*"
                  onChange={(e) => {
                    pickFile(kind, e.target.files[0])
                    e.target.value = ''
                  }}
                />
              </li>
            )
          })}
        </ul>
        <span className="muted small">PDF or a photo, up to 10 MB each.</span>
        {(errors.documents || fileError) && <span className="field-error">{errors.documents || fileError}</span>}
      </fieldset>

      <fieldset className={`vendor-declare ${errors.declared ? 'has-error' : ''}`}>
        <label className="check-line">
          <input type="checkbox" checked={app.declared} onChange={(e) => update('declared', e.target.checked)} />
          <span>We confirm that the details above are correct, and that the firm is not blacklisted or debarred by any government department or PSU.</span>
        </label>
        {errors.declared && <span className="field-error">{errors.declared}</span>}
      </fieldset>

      <fieldset className={`vendor-captcha ${errors.captcha ? 'has-error' : ''}`}>
        <legend>Please fill the captcha</legend>
        <div className="captcha-row">
          <span className="captcha-question" aria-label={`What is ${captcha.question}?`}>
            {captcha.question} =
          </span>
          <input
            value={captchaInput}
            onChange={(e) => {
              setCaptchaInput(e.target.value)
              apply({ ...app, captchaOk: e.target.value.trim() === captcha.answer })
            }}
            inputMode="numeric"
            maxLength={3}
            aria-label="Captcha answer"
          />
          <button
            type="button"
            className="link-button"
            onClick={() => {
              setCaptcha(newCaptcha())
              setCaptchaInput('')
              apply({ ...app, captchaOk: false })
            }}
          >
            Refresh
          </button>
        </div>
        {errors.captcha && <span className="field-error">{errors.captcha}</span>}
      </fieldset>

      <div className="public-form-foot">
        <span className="muted">We use these details only to register you as a vendor and to pay you.</span>
        <button type="submit" className="btn btn-primary">
          {existing ? 'Resubmit application' : 'Submit registration'}
        </button>
      </div>
    </form>
  )
}

/* After sending: the application number to keep, and what happens next. */
function Submitted({ app, again, onTrack }) {
  const { settings } = useCrm()
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(app.id)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard blocked: the number is on screen to note down.
    }
  }
  return (
    <section className="card portal-card enquiry-done">
      <span className="enquiry-done-icon">
        <CheckCircle2 size={28} />
      </span>
      <h1>{again ? 'Application resubmitted' : `Thank you, ${app.contact.name}`}</h1>
      <p>We review registrations within two working days and write to you at {app.contact.email}.</p>
      <div className="enquiry-id">
        <span>Your application no.</span>
        <strong className="mono-sub">{app.id}</strong>
        <button type="button" className="btn btn-small" onClick={copy}>
          {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <p className="muted small">With this number and your mobile you can check the status of your registration any time.</p>
      <dl className="enquiry-summary">
        <div>
          <dt>Firm</dt>
          <dd>{app.firm.name}</dd>
        </div>
        <div>
          <dt>Work</dt>
          <dd>{app.work.categories.join(', ')}</dd>
        </div>
      </dl>
      <div className="portal-actions enquiry-done-actions">
        <a className="btn btn-whatsapp" target="_blank" rel="noreferrer" href={whatsappLink(app.contact.mobile, `Vendor registration with ${settings.companyName}: ${app.id} (${app.firm.name}), sent on ${formatDate(app.submittedAt.slice(0, 10))}.`)}>
          <MessageCircle size={15} /> Save number on WhatsApp
        </a>
        <button className="btn btn-primary" onClick={onTrack}>
          Check status
        </button>
      </div>
    </section>
  )
}

const STATUS_TONE = { New: 'tone-info', 'Changes requested': 'tone-attention', Approved: 'tone-good', Rejected: 'tone-urgent' }
const STATUS_WORDS = {
  New: 'Received — we are reviewing it.',
  'Changes requested': 'Sent back to you — please correct and resubmit.',
  Approved: 'Approved — you are a registered vendor.',
  Rejected: 'Not approved.',
}

/* A firm looks up its application with the number and the mobile it gave. */
function Track({ onEdit }) {
  const { vendorApplications } = useCrm()
  const [params] = useSearchParams()
  const [no, setNo] = useState(params.get('app') ?? '')
  const [mobile, setMobile] = useState('')
  const [found, setFound] = useState(null)
  const [error, setError] = useState('')
  const app = found && vendorApplications.find((a) => a.id === found)

  return (
    <section className="card portal-card vendor-track">
      <h2>Check your registration</h2>
      <form
        className="track-form"
        onSubmit={(e) => {
          e.preventDefault()
          const match = vendorApplications.find((a) => a.id.toLowerCase() === no.trim().toLowerCase() && a.contact.mobile.slice(-10) === digitsOf(mobile).slice(-10))
          setFound(match?.id ?? null)
          setError(match ? '' : 'No application matches this number and mobile.')
        }}
      >
        <label className="field">
          <span className="field-label">Application no.</span>
          <input value={no} onChange={(e) => setNo(e.target.value)} placeholder="VR-2026-012" required />
        </label>
        <label className="field">
          <span className="field-label">Mobile</span>
          <input value={mobile} onChange={(e) => setMobile(e.target.value)} inputMode="numeric" placeholder="10-digit mobile" required />
        </label>
        <button type="submit" className="btn btn-primary">
          <Search size={15} /> Check
        </button>
      </form>
      {error && <p className="field-error">{error}</p>}
      {app && (
        <div className="track-result">
          <div className="track-head">
            <strong>{app.firm.name}</strong>
            <span className={`pill status-pill ${STATUS_TONE[app.status]}`}>{app.status}</span>
          </div>
          <p>{STATUS_WORDS[app.status]}</p>
          {app.status === 'Approved' && (
            <p>
              Your vendor ID is <b className="mono-sub">{app.vendorId}</b>. <Link to="/login" state={{ tab: 'vendor' }}>Sign in to the vendor portal</Link> with this ID and your mobile.
            </p>
          )}
          {app.note && app.status !== 'Approved' && <p className="vendor-note">{app.reason ? <b>{app.reason}. </b> : null}{app.note}</p>}
          {app.status === 'Changes requested' && (
            <button className="btn btn-primary" onClick={() => onEdit(app)}>
              Correct and resubmit
            </button>
          )}
          <ol className="track-history">
            {app.history.map((h, i) => (
              <li key={i}>
                <span className="muted">{formatDate(h.at.slice(0, 10))}</span> {h.action}
              </li>
            ))}
          </ol>
        </div>
      )}
    </section>
  )
}

/*
 * Public page for subcontractors: register as a vendor (fields after eProc Rajasthan's bidder enrollment),
 * then check the application's status and correct it if it was sent back. ?track opens the status check.
 */
export function VendorRegisterPage() {
  const { settings } = useCrm()
  const [params, setParams] = useSearchParams()
  const [done, setDone] = useState(null) // { app, again }
  const [editing, setEditing] = useState(null)
  const tracking = params.has('track') && !editing && !done
  const companyPhone = settings.phone.replace(/\D/g, '').slice(-10)

  const title = done ? 'Registration received' : editing ? `Application ${editing.id}` : tracking ? 'Registration status' : 'Register as a vendor'
  const lead = done
    ? `${done.app.firm.name} · ${done.app.id}`
    : tracking
      ? 'Enter your application number and mobile.'
      : 'Drilling, lab testing, drone and DGPS surveys, pumping tests and site services for our mining and environment projects.'

  return (
    <div className="portal public-enquiry vendor-register">
      <header className="portal-top">
        <div className="portal-top-inner">
          <div className="portal-brand">
            <Logo />
            <span className="portal-tag">Vendors</span>
          </div>
          <Link className="btn" to="/login" state={{ tab: 'vendor' }}>
            <ArrowLeft size={15} /> Vendor sign in
          </Link>
        </div>
      </header>

      <PortalBand compact>
        <h1 className="band-title">{title}</h1>
        <p className="band-lead">{lead}</p>
      </PortalBand>

      <main className="portal-main page-anim">
        {done ? (
          <Submitted
            app={done.app}
            again={done.again}
            onTrack={() => {
              setParams({ track: '', app: done.app.id })
              setDone(null)
            }}
          />
        ) : (
          <div className="portal-grid">
            <div className="portal-col">
              {tracking ? (
                <Track onEdit={setEditing} />
              ) : (
                <section className="card portal-card">
                  <RegisterForm
                    key={editing?.id ?? 'new'}
                    existing={editing}
                    onDone={(app, again) => {
                      setDone({ app, again })
                      setEditing(null)
                      window.scrollTo(0, 0)
                    }}
                  />
                </section>
              )}
            </div>

            <aside className="portal-col">
              <section className="card portal-card">
                <h2>How it works</h2>
                <ol className="next-steps">
                  <li>
                    <strong>Register</strong>
                    <span>Firm, tax, bank and papers. You get an application number.</span>
                  </li>
                  <li>
                    <strong>We review</strong>
                    <span>Within two working days. If something is missing, we send it back to you to correct.</span>
                  </li>
                  <li>
                    <strong>Vendor ID</strong>
                    <span>Once approved, your vendor ID reaches you by email and WhatsApp.</span>
                  </li>
                  <li>
                    <strong>Bid for work</strong>
                    <span>New works in your categories appear in the vendor portal.</span>
                  </li>
                </ol>
                {tracking ? (
                  <Link className="link-button" to="/vendor/register">
                    New registration
                  </Link>
                ) : (
                  <Link className="link-button" to="/vendor/register?track">
                    Already applied? Check the status
                  </Link>
                )}
              </section>
              <section className="card portal-card portal-contact">
                <h2>Questions?</h2>
                <a href={`tel:${settings.phone.replace(/\s/g, '')}`}>
                  <Phone size={14} /> {settings.phone}
                </a>
                <a href={`mailto:${settings.email}`}>
                  <Mail size={14} /> {settings.email}
                </a>
                <a className="btn btn-whatsapp" target="_blank" rel="noreferrer" href={whatsappLink(companyPhone, 'Hello, I would like to register as a vendor with Bansal Geo.')}>
                  <MessageCircle size={15} /> WhatsApp us
                </a>
              </section>
            </aside>
          </div>
        )}
      </main>
    </div>
  )
}
