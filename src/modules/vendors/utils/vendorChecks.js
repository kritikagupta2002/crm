import { STATE_CODES, VENDOR_DOCS } from '../data/vendorApplications'

export const PAN_RE = /^[A-Z]{5}[0-9]{4}[A-Z]$/
export const GSTIN_RE = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/
export const IFSC_RE = /^[A-Z]{4}0[A-Z0-9]{6}$/
const MOBILE_RE = /^[6-9][0-9]{9}$/
const PIN_RE = /^[1-9][0-9]{5}$/
const EMAIL_RE = /^\S+@\S+\.\S+$/

const clean = (v) => String(v ?? '').replace(/\s+/g, '').toUpperCase()
export const digitsOf = (v) => String(v ?? '').replace(/\D/g, '')

/* The documents a firm must upload: the PAN card and a cancelled cheque, and the GST certificate if it has a GSTIN. */
export const requiredDocs = (app) => VENDOR_DOCS.filter((d) => d.required === true || (d.required === 'gst' && app.tax?.gstRegistered)).map((d) => d.kind)

/* What the registration form must have before it can be sent: { 'section.field': message }. */
export function validateApplication(app, files) {
  const e = {}
  const need = (path, value, message) => {
    if (!String(value ?? '').trim()) e[path] = message
  }
  // Login & correspondence (verified mobile: with the vendor ID, it signs in to the vendor portal)
  if (!EMAIL_RE.test(app.contact.email.trim())) e['contact.email'] = 'Enter a valid email address.'
  if (!MOBILE_RE.test(digitsOf(app.contact.mobile).slice(-10))) e['contact.mobile'] = 'Enter a 10-digit mobile number.'
  else if (!app.contact.mobileVerified) e['contact.mobile'] = 'Verify the mobile number with the code we send.'
  // Company details (eProc's section, Company Type in place of Bidder Type)
  need('firm.name', app.firm.name, 'Enter the company name or licence holder’s name.')
  if (app.firm.preferential) need('firm.preference', app.firm.preference, 'Choose the preference category.')
  need('firm.regNo', app.firm.regNo, 'Enter the registration number.')
  need('address.line', app.address.line, 'Enter the registered address.')
  need('firm.companyType', app.firm.companyType, 'Choose the company type.')
  need('address.city', app.address.city, 'Enter the city.')
  need('address.state', app.address.state, 'Choose the state.')
  if (!PIN_RE.test(digitsOf(app.address.pincode))) e['address.pincode'] = 'Enter the 6-digit postal code.'
  need('firm.nature', app.firm.nature, 'Describe the nature of business.')
  need('firm.legalStatus', app.firm.legalStatus, 'Choose the legal status.')
  need('firm.category', app.firm.category, 'Choose the company category.')
  if (!app.work.categories.length) e['work.categories'] = 'Choose at least one kind of work.'
  // Contact details
  need('contact.name', app.contact.name, 'Enter the contact person’s name.')
  need('contact.dob', app.contact.dob, 'Enter the date of birth.')
  if (!PAN_RE.test(clean(app.tax.pan))) e['tax.pan'] = 'PAN has 10 characters, like ABCDE1234F.'
  if (app.tax.gstRegistered) {
    const gstin = clean(app.tax.gstin)
    if (!GSTIN_RE.test(gstin)) e['tax.gstin'] = 'GSTIN has 15 characters, like 08ABCDE1234F1Z5.'
    else if (PAN_RE.test(clean(app.tax.pan)) && gstin.slice(2, 12) !== clean(app.tax.pan)) e['tax.gstin'] = 'The GSTIN should contain your PAN (characters 3 to 12).'
  }
  need('bank.holder', app.bank.holder, 'Enter the account holder’s name.')
  need('bank.bank', app.bank.bank, 'Enter the bank’s name.')
  if (digitsOf(app.bank.accountNo).length < 9) e['bank.accountNo'] = 'Enter the full account number.'
  else if (digitsOf(app.bank.accountNo) !== digitsOf(app.bank.accountConfirm)) e['bank.accountConfirm'] = 'The two account numbers don’t match.'
  if (!IFSC_RE.test(clean(app.bank.ifsc))) e['bank.ifsc'] = 'IFSC has 11 characters, like SBIN0001234.'
  const kinds = new Set([...(app.documents ?? []).map((d) => d.kind), ...files.map((f) => f.kind)])
  const missing = requiredDocs(app).filter((k) => !kinds.has(k))
  if (missing.length) e.documents = `Still to upload: ${missing.join(', ')}.`
  if (!app.declared) e.declared = 'Please confirm the declaration.'
  if (!app.captchaOk) e.captcha = 'Enter the answer to the captcha.'
  return e
}

/*
 * What the Admin checks before approving: formats, that the GSTIN belongs to this PAN and state, the papers, and that
 * the PAN, GSTIN or bank account isn't already with another vendor or application.
 * Returns [{ label, ok, note }].
 */
export function applicationChecks(app, vendors, applications) {
  const pan = clean(app.tax.pan)
  const gstin = clean(app.tax.gstin)
  const account = digitsOf(app.bank.accountNo)
  const checks = []

  checks.push({ label: 'PAN', ok: PAN_RE.test(pan), note: PAN_RE.test(pan) ? `${pan} · valid format` : `${pan || 'missing'} · not a valid PAN` })

  if (!app.tax.gstRegistered) checks.push({ label: 'GSTIN', ok: true, note: 'Not GST registered (declared by the firm)' })
  else if (!GSTIN_RE.test(gstin)) checks.push({ label: 'GSTIN', ok: false, note: `${gstin || 'missing'} · not a valid GSTIN` })
  else {
    const stateCode = STATE_CODES[app.address.state]
    const issues = [gstin.slice(2, 12) !== pan && 'does not contain the PAN', stateCode && gstin.slice(0, 2) !== stateCode && `state code ${gstin.slice(0, 2)} is not ${app.address.state} (${stateCode})`].filter(Boolean)
    checks.push({ label: 'GSTIN', ok: !issues.length, note: issues.length ? `${gstin} · ${issues.join('; ')}` : `${gstin} · matches the PAN and ${app.address.state}` })
  }

  checks.push({ label: 'Bank IFSC', ok: IFSC_RE.test(clean(app.bank.ifsc)), note: `${clean(app.bank.ifsc)} · ${IFSC_RE.test(clean(app.bank.ifsc)) ? `${app.bank.bank}, ${app.bank.branch || 'branch not given'}` : 'not a valid IFSC'}` })

  const kinds = new Set((app.documents ?? []).map((d) => d.kind))
  const missing = requiredDocs(app).filter((k) => !kinds.has(k))
  checks.push({ label: 'Documents', ok: !missing.length, note: missing.length ? `Missing: ${missing.join(', ')}` : `${app.documents.length} uploaded, required ones present` })

  // Already with us: another vendor or another live application with the same PAN, GSTIN or bank account.
  const clashes = []
  vendors.forEach((v) => {
    if (clean(v.pan) === pan) clashes.push(`PAN is ${v.id} ${v.name}`)
    else if (gstin && clean(v.gstin) === gstin) clashes.push(`GSTIN is ${v.id} ${v.name}`)
    else if (account && digitsOf(v.bank?.accountNo) === account) clashes.push(`bank account is ${v.id} ${v.name}`)
  })
  applications
    .filter((a) => a.id !== app.id && a.status !== 'Rejected')
    .forEach((a) => {
      if (clean(a.tax.pan) === pan || (gstin && clean(a.tax.gstin) === gstin) || (account && digitsOf(a.bank.accountNo) === account)) clashes.push(`same details as application ${a.id}`)
    })
  checks.push({ label: 'Not already registered', ok: !clashes.length, note: clashes.length ? clashes.join('; ') : 'No other vendor with this PAN, GSTIN or bank account' })

  return checks
}

/* The TDS section a vendor's work usually falls under: technical services 194J (labs, surveys, consultants), contract work 194C. */
export function suggestedTds(app) {
  if (['Laboratory', 'Survey Agency', 'Consultant'].includes(app.firm.companyType)) return { section: '194J', rate: 2 }
  return { section: '194C', rate: app.firm.legalStatus === 'Proprietorship' ? 1 : 2 }
}
