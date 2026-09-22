import { Check, Copy, IndianRupee, Paperclip, Plus, Send, X } from 'lucide-react'
import QRCode from 'qrcode'
import { useCallback, useEffect, useId, useState } from 'react'
import { Portal } from '../../components/common/Portal'
import { useCrm } from '../../context/crm'
import { TODAY } from '../../data/mockData'
import { formatNearDate, toISODate } from '../../utils/date'
import { PAYMENT_METHODS, PAYMENT_TONE, duesFor, paymentsOf, upiLink } from '../../utils/payments'
import { clientProjects } from '../../utils/projects'

const todayISO = toISODate(TODAY)
const rupees = (n) => `₹${Math.round(n).toLocaleString('en-IN')}`
const MAX_SIZE = 10 * 1024 * 1024

function CardTitle({ icon: Icon, children }) {
  return (
    <h2 className="card-title-icon">
      <span className="title-icon">
        <Icon size={16} />
      </span>
      {children}
    </h2>
  )
}

/* The UPI QR for this amount; any UPI app (GPay, PhonePe, Paytm, BHIM) scans it. */
function UpiQr({ link }) {
  const [src, setSrc] = useState('')
  useEffect(() => {
    let live = true
    QRCode.toDataURL(link, { margin: 1, width: 200, color: { dark: '#12303f', light: '#ffffff' } }).then((url) => live && setSrc(url))
    return () => {
      live = false
    }
  }, [link])
  return src ? <img className="pay-qr" src={src} alt="UPI QR code to pay Bansal Geo" width="200" height="200" /> : <span className="pay-qr" />
}

/*
 * Paying one item (or anything else): the amount, a UPI QR and bank details to pay with, then the
 * payment's reference and a screenshot so Accounts can match it.
 */
function PayDrawer({ lead, due, onClose }) {
  const { settings, submitPayment } = useCrm()
  const titleId = useId()
  const other = !due
  const [title, setTitle] = useState(due?.title ?? '')
  const [amount, setAmount] = useState(due ? String(due.amount) : '')
  const [method, setMethod] = useState(PAYMENT_METHODS[0])
  const [utr, setUtr] = useState('')
  const [paidOn, setPaidOn] = useState(todayISO)
  const [file, setFile] = useState(null)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const [sent, setSent] = useState(false)
  const value = Number(amount) || 0

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [onClose])

  const copyUpi = () => {
    navigator.clipboard?.writeText(settings.upiId)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const ready = value > 0 && title.trim() && utr.trim() && file

  return (
    <Portal>
      <div className="drawer-root">
        <div className="drawer-backdrop" onClick={onClose} />
        <aside className="enquiry-drawer pay-drawer" role="dialog" aria-modal="true" aria-labelledby={titleId}>
          <header className="drawer-header">
            <div className="lead-drawer-title">
              <h2 id={titleId}>{other ? 'Make a payment' : `Pay: ${due.title}`}</h2>
              <span className="muted">{lead.company}</span>
            </div>
            <button className="icon-button" onClick={onClose} aria-label="Close">
              <X size={20} />
            </button>
          </header>

          {sent ? (
            <div className="drawer-body pay-done">
              <span className="pay-done-icon">
                <Check size={26} strokeWidth={2.6} />
              </span>
              <h3>Payment details sent</h3>
              <p className="muted">Our accounts team will match {rupees(value)} with ref. {utr} and confirm it here, usually within one working day.</p>
              <button className="btn btn-primary" onClick={onClose}>
                Done
              </button>
            </div>
          ) : (
            <form
              className="drawer-form"
              onSubmit={(e) => {
                e.preventDefault()
                submitPayment(lead.id, { dueKey: due?.key ?? 'other', title: title.trim(), amount: value, method, utr: utr.trim(), paidOn, file })
                setSent(true)
              }}
            >
              <div className="drawer-body">
                <section className="pay-step">
                  <h3>
                    <span>1</span> Pay {value ? rupees(value) : 'the amount'}
                  </h3>
                  {other && (
                    <div className="pay-grid">
                      <label className="field">
                        <span className="field-label">What is this payment for?</span>
                        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Government fee for DGPS survey" required autoFocus />
                      </label>
                      <label className="field">
                        <span className="field-label">Amount (₹)</span>
                        <input value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^\d]/g, '').slice(0, 10))} inputMode="numeric" placeholder="25000" required />
                      </label>
                    </div>
                  )}
                  <div className="pay-methods">
                    <div className="pay-upi">
                      {value > 0 ? <UpiQr link={upiLink(settings, value, title || lead.id)} /> : <span className="pay-qr pay-qr-empty">Enter the amount to see the QR</span>}
                      <span className="muted">Scan with any UPI app</span>
                      <button type="button" className="link-button" onClick={copyUpi}>
                        {copied ? <Check size={13} /> : <Copy size={13} />} {settings.upiId}
                      </button>
                    </div>
                    <dl className="pay-bank">
                      <div>
                        <dt>Account name</dt>
                        <dd>{settings.accountName}</dd>
                      </div>
                      <div>
                        <dt>Account no.</dt>
                        <dd className="mono-sub">{settings.accountNo}</dd>
                      </div>
                      <div>
                        <dt>IFSC</dt>
                        <dd className="mono-sub">{settings.ifsc}</dd>
                      </div>
                      <div>
                        <dt>Bank</dt>
                        <dd>{settings.bankName}</dd>
                      </div>
                    </dl>
                  </div>
                </section>

                <section className="pay-step">
                  <h3>
                    <span>2</span> Tell us you've paid
                  </h3>
                  <div className="pay-grid">
                    <label className="field">
                      <span className="field-label">Paid by</span>
                      <select value={method} onChange={(e) => setMethod(e.target.value)}>
                        {PAYMENT_METHODS.map((m) => (
                          <option key={m}>{m}</option>
                        ))}
                      </select>
                    </label>
                    <label className="field">
                      <span className="field-label">Paid on</span>
                      <input type="date" value={paidOn} max={todayISO} onChange={(e) => setPaidOn(e.target.value)} required />
                    </label>
                    <label className="field">
                      <span className="field-label">{method === 'Cheque' ? 'Cheque number' : 'UTR / transaction ID'}</span>
                      <input value={utr} onChange={(e) => setUtr(e.target.value)} placeholder={method === 'Cheque' ? 'e.g. 004512' : 'e.g. 426518993012'} required />
                    </label>
                    <label className="field">
                      <span className="field-label">Screenshot or receipt</span>
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={(e) => {
                          const picked = e.target.files[0] ?? null
                          setError(picked && picked.size > MAX_SIZE ? 'That file is over 10 MB.' : '')
                          setFile(picked && picked.size <= MAX_SIZE ? picked : null)
                        }}
                        required
                      />
                      {error && <span className="field-error">{error}</span>}
                    </label>
                  </div>
                </section>
              </div>
              <footer className="drawer-footer">
                <button type="button" className="btn" onClick={onClose}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={!ready}>
                  <Send size={15} /> Send payment details
                </button>
              </footer>
            </form>
          )}
        </aside>
      </div>
    </Portal>
  )
}

/* What the client owes and what they've paid; each due can be paid from here, or any other amount. */
export function PaymentsCard({ lead, readOnly }) {
  const { projectEdits } = useCrm()
  const [paying, setPaying] = useState(null)
  const close = useCallback(() => setPaying(null), [])
  // In the order they were created: the first is the project the quotation was for.
  const dues = duesFor(lead, clientProjects(lead, projectEdits))
  const reported = paymentsOf(lead)
  if (dues.length === 0 && reported.length === 0 && readOnly) return null
  const open = dues.filter((d) => d.status === 'Due')

  return (
    <section className="card portal-card portal-payments">
      <div className="portal-card-head">
        <CardTitle icon={IndianRupee}>Payments</CardTitle>
        <button className="btn" onClick={() => setPaying('other')} disabled={readOnly}>
          <Plus size={15} /> Make a payment
        </button>
      </div>
      {dues.length === 0 ? (
        <p className="portal-empty">Nothing due right now. Once you accept a quotation, the advance shows here to pay by UPI or bank transfer.</p>
      ) : (
        <ul className="pay-dues">
          {dues.map((d) => (
            <li key={d.key}>
              <span>
                <strong>{d.title}</strong>
                <span className="muted">{d.note}</span>
              </span>
              <b>{rupees(d.amount)}</b>
              {d.status === 'Due' ? (
                <button className="btn btn-primary btn-small" onClick={() => setPaying(d)} disabled={readOnly}>
                  Pay
                </button>
              ) : (
                <span className={`pill status-pill ${PAYMENT_TONE[d.status]}`}>{d.status === 'Verifying' ? 'Being verified' : 'Paid'}</span>
              )}
            </li>
          ))}
        </ul>
      )}
      {open.length > 0 && <p className="portal-note">Due now: {rupees(open.reduce((s, d) => s + d.amount, 0))}. Pay by UPI QR or bank transfer, then send us the reference and screenshot.</p>}

      {reported.length > 0 && (
        <>
          <h3 className="pay-history-title">Your payments</h3>
          <ul className="pay-history">
            {reported.map((p) => (
              <li key={p.id}>
                <span>
                  <strong>
                    {rupees(p.amount)} · {p.title}
                  </strong>
                  <span className="muted">
                    {formatNearDate(p.paidOn)} · {p.method} · ref. {p.utr}
                    {p.file && (
                      <>
                        {' '}
                        · <Paperclip size={11} /> {p.file.name}
                      </>
                    )}
                  </span>
                  {p.status === 'Rejected' && <span className="pay-rejected">Not received yet{p.checkNote ? `: ${p.checkNote}` : ''}. Please check with your bank or call us.</span>}
                </span>
                <span className={`pill status-pill ${PAYMENT_TONE[p.status === 'Submitted' ? 'Verifying' : p.status === 'Verified' ? 'Paid' : 'Rejected']}`}>
                  {p.status === 'Submitted' ? 'Being verified' : p.status === 'Verified' ? 'Received' : 'Not received'}
                </span>
              </li>
            ))}
          </ul>
        </>
      )}

      {paying && <PayDrawer key={paying === 'other' ? 'other' : paying.key} lead={lead} due={paying === 'other' ? null : paying} onClose={close} />}
    </section>
  )
}
