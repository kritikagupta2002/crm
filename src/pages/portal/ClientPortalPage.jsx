import { ArrowLeft, Check, CheckCircle2, FileText, LogOut, Mail, MapPin, MessageCircle, Phone, Printer, Send, UploadCloud, X } from 'lucide-react'
import { useEffect, useId, useRef, useState } from 'react'
import { Link, Navigate, useSearchParams } from 'react-router-dom'
import { Checklist, ProgressBar } from '../../components/common/Checklist'
import { Logo } from '../../components/common/Logo'
import { Portal } from '../../components/common/Portal'
import { useCrm, useMoney } from '../../context/crm'
import { formatDate, formatDayMonth } from '../../utils/date'
import { whatsappLink } from '../../utils/whatsapp'
import { APPROVAL_STEPS, ONBOARDING_STEPS, progressOf, quoteFor } from '../../utils/workflow'
import { QuoteDocument } from '../quotations/QuoteDocument'
import './portal.css'

const JOURNEY = ['Enquiry received', 'Requirement discussion', 'Quotation shared', 'Approvals', 'Project started']

function journeyIndex(lead, quote) {
  if (lead.stage === 'Won') return 4
  if (quote?.status === 'Accepted') return 3
  if (quote) return 2
  return lead.stage === 'New Enquiry' ? 0 : 1
}

/* The client's wording for a quotation's status. */
const QUOTE_STATUS = {
  Sent: ['Awaiting your response', 'tone-attention'],
  Revised: ['Revised · awaiting your response', 'tone-attention'],
  Accepted: ['Accepted', 'tone-good'],
  Rejected: ['Declined', 'tone-neutral'],
  Expired: ['Validity ended', 'tone-urgent'],
}

const clientAmount = (n) => `₹${Math.round(n).toLocaleString('en-IN')}`
const initialsOf = (name) =>
  name
    .replace(/\./g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
const formatSize = (bytes) => (bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`)
const MAX_SIZE = 10 * 1024 * 1024

function Journey({ lead, quote }) {
  const current = journeyIndex(lead, quote)
  const finished = lead.stage === 'Won' && progressOf(ONBOARDING_STEPS, lead.onboarding) === ONBOARDING_STEPS.length
  return (
    <ol className="journey">
      {JOURNEY.map((label, i) => {
        const state = i < current || finished ? 'is-done' : i === current ? 'is-current' : ''
        return (
          <li key={label} className={state} style={{ animationDelay: `${0.08 * i}s` }}>
            <span className="journey-dot">{state === 'is-done' ? <Check size={13} strokeWidth={3} /> : i + 1}</span>
            <span className="journey-label">{label}</span>
          </li>
        )
      })}
    </ol>
  )
}

function QuoteDrawer({ lead, quote, settings, amount, canAccept, onAccept, onClose }) {
  const titleId = useId()

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

  return (
    <Portal>
      <div className="drawer-root">
        <div className="drawer-backdrop" onClick={onClose} />
        <aside className="enquiry-drawer quote-view" role="dialog" aria-modal="true" aria-labelledby={titleId}>
          <header className="drawer-header no-print">
            <div className="lead-drawer-title">
              <h2 id={titleId}>Quotation {quote.number}</h2>
              <span className="muted">Valid until {formatDate(quote.validUntil)}</span>
            </div>
            <button className="icon-button" onClick={onClose} aria-label="Close">
              <X size={20} />
            </button>
          </header>
          <div className="drawer-body">
            <QuoteDocument lead={lead} quote={quote} settings={settings} amount={amount} />
          </div>
          <footer className="drawer-footer no-print">
            <button className="btn" onClick={() => window.print()}>
              <Printer size={15} /> Print / Save PDF
            </button>
            {canAccept && (
              <button className="btn btn-success" onClick={onAccept}>
                <CheckCircle2 size={15} /> Accept quotation
              </button>
            )}
          </footer>
        </aside>
      </div>
    </Portal>
  )
}

function QuotationCard({ lead, quote, settings, amount, readOnly }) {
  const { acceptQuotation, logActivity } = useCrm()
  const [viewing, setViewing] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [writing, setWriting] = useState(false)
  const [message, setMessage] = useState('')
  const [sent, setSent] = useState(false)

  if (!quote) {
    return (
      <section className="card portal-card">
        <h2>Quotation</h2>
        <p className="portal-empty">
          {lead.stage === 'Lost'
            ? 'No quotation was shared for this enquiry.'
            : `Your quotation is being prepared. ${lead.assignedTo} from our team will share it with you shortly.`}
        </p>
      </section>
    )
  }

  const [statusLabel, statusTone] = QUOTE_STATUS[quote.displayStatus] ?? QUOTE_STATUS.Sent
  const open = quote.status === 'Sent' || quote.status === 'Revised'
  const canAccept = open && quote.displayStatus !== 'Expired' && lead.stage !== 'Lost' && !readOnly
  const accept = () => {
    acceptQuotation(lead.id)
    setConfirming(false)
    setViewing(false)
  }

  return (
    <section className="card portal-card">
      <div className="portal-card-head">
        <h2>Quotation</h2>
        <span className={`pill status-pill ${statusTone}`}>{statusLabel}</span>
      </div>

      <div className="quote-summary">
        <div>
          <span>Quotation no.</span>
          <strong>{quote.number}</strong>
        </div>
        <div>
          <span>Shared on</span>
          <strong>{formatDayMonth(quote.sentOn)}</strong>
        </div>
        <div>
          <span>Valid until</span>
          <strong className={quote.displayStatus === 'Expired' ? 'text-red' : undefined}>{formatDayMonth(quote.validUntil)}</strong>
        </div>
        <div className="quote-summary-total">
          <span>Total incl. GST</span>
          <strong>{amount(quote.total)}</strong>
        </div>
      </div>

      {confirming ? (
        <div className="portal-confirm">
          <p>
            Accept quotation <b>{quote.number}</b> for <b>{amount(quote.total)}</b>? Our team will then share the work order and advance payment details.
          </p>
          <div className="portal-actions">
            <button className="btn" onClick={() => setConfirming(false)}>
              Cancel
            </button>
            <button className="btn btn-success" onClick={accept}>
              <CheckCircle2 size={15} /> Yes, accept
            </button>
          </div>
        </div>
      ) : (
        <div className="portal-actions">
          <button className="btn" onClick={() => setViewing(true)}>
            <FileText size={15} /> View quotation
          </button>
          {open && lead.stage !== 'Lost' && !sent && (
            <button className="btn" onClick={() => setWriting(true)} disabled={readOnly || writing}>
              {quote.displayStatus === 'Expired' ? 'Ask for a fresh quotation' : 'Request changes'}
            </button>
          )}
          {canAccept && (
            <button className="btn btn-success" onClick={() => setConfirming(true)}>
              <CheckCircle2 size={15} /> Accept
            </button>
          )}
        </div>
      )}

      {writing && !sent && (
        <form
          className="portal-message"
          onSubmit={(e) => {
            e.preventDefault()
            logActivity(lead.id, 'contact', `Client asked for changes on ${quote.number} (portal) — ${message.trim()}`)
            setSent(true)
            setWriting(false)
          }}
        >
          <label className="field">
            <span className="field-label">What would you like changed?</span>
            <textarea rows={3} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Scope, timeline, payment terms…" required autoFocus />
          </label>
          <div className="portal-actions">
            <button type="button" className="btn" onClick={() => setWriting(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={!message.trim()}>
              <Send size={15} /> Send to {lead.assignedTo}
            </button>
          </div>
        </form>
      )}
      {sent && (
        <p className="portal-sent">
          <CheckCircle2 size={16} /> Sent. {lead.assignedTo} will get back to you with a revised quotation.
        </p>
      )}

      {viewing && (
        <QuoteDrawer lead={lead} quote={quote} settings={settings} amount={amount} canAccept={canAccept} onAccept={accept} onClose={() => setViewing(false)} />
      )}
    </section>
  )
}

function StepsCard({ title, steps, values, note }) {
  const done = progressOf(steps, values)
  return (
    <section className="card portal-card">
      <div className="portal-card-head">
        <h2>{title}</h2>
        <span className="muted">
          {done} of {steps.length} done
        </span>
      </div>
      <ProgressBar done={done} total={steps.length} tone={done === steps.length ? 'tone-good' : 'tone-attention'} />
      <div className="portal-steps">
        <Checklist steps={steps} values={values} onToggle={() => {}} disabled />
      </div>
      {note && done < steps.length && <p className="portal-note">{note}</p>}
    </section>
  )
}

function DocumentsCard({ lead, readOnly }) {
  const { addDocuments } = useCrm()
  const input = useRef(null)
  const [error, setError] = useState('')
  const docs = lead.documents ?? []

  const upload = (fileList) => {
    const files = [...fileList]
    const tooBig = files.filter((f) => f.size > MAX_SIZE)
    setError(tooBig.length ? `${tooBig.map((f) => f.name).join(', ')} is over 10 MB and was skipped.` : '')
    addDocuments(
      lead.id,
      files.filter((f) => f.size <= MAX_SIZE),
      { byClient: true },
    )
  }

  return (
    <section className="card portal-card">
      <div className="portal-card-head">
        <h2>Documents</h2>
        <button className="btn" onClick={() => input.current.click()} disabled={readOnly}>
          <UploadCloud size={15} /> Upload
        </button>
        <input
          ref={input}
          type="file"
          multiple
          hidden
          onChange={(e) => {
            upload(e.target.files)
            e.target.value = ''
          }}
        />
      </div>
      {docs.length === 0 ? (
        <p className="portal-empty">Nothing shared yet. Upload lease papers, maps, the work order or any site documents here.</p>
      ) : (
        <ul className="portal-docs">
          {docs.map((doc) => (
            <li key={doc.id}>
              <FileText size={18} />
              <span>
                <strong>{doc.name}</strong>
                <span className="muted">
                  {formatDayMonth(doc.addedOn)} · {formatSize(doc.size)}
                </span>
              </span>
            </li>
          ))}
        </ul>
      )}
      {error && <p className="auth-error">{error}</p>}
    </section>
  )
}

/*
 * What a client sees after signing in with their enquiry ID and mobile number.
 * The team can open the same view read-only with /portal?lead=<id> ("Preview client portal").
 */
export function ClientPortalPage() {
  const { leads, settings, session, signOut } = useCrm()
  const money = useMoney()
  const [params] = useSearchParams()
  const preview = session?.type === 'team' ? params.get('lead') : null
  const leadId = session?.type === 'client' ? session.leadId : preview
  const lead = leads.find((l) => l.id === leadId)
  const missingClientLead = session?.type === 'client' && !lead

  useEffect(() => {
    if (lead) document.title = `${lead.company} · Client Portal`
  }, [lead])

  // The client's enquiry can disappear when demo data is reset; sign them out cleanly.
  useEffect(() => {
    if (missingClientLead) signOut()
  }, [missingClientLead, signOut])

  if (!session || missingClientLead) return <Navigate to="/login" replace state={{ tab: 'client' }} />
  if (!lead) return <Navigate to="/leads" replace />

  const quote = quoteFor(lead, settings)
  const amount = preview ? money.full : clientAmount
  const approvalStarted = quote?.status === 'Accepted' || lead.stage === 'Won'
  const companyPhone = settings.phone.replace(/\D/g, '').slice(-10)

  return (
    <div className="portal">
      <header className="portal-top">
        <div className="portal-top-inner">
          <div className="portal-brand">
            <Logo />
            <span className="portal-tag">Client Portal</span>
          </div>
          {preview ? (
            <Link className="btn" to={`/leads/${lead.id}`}>
              <ArrowLeft size={15} /> Back to CRM
            </Link>
          ) : (
            <button className="btn" onClick={signOut}>
              <LogOut size={15} /> Sign out
            </button>
          )}
        </div>
      </header>

      {preview && <div className="portal-preview">Preview: this is what {lead.contactPerson} sees. Actions are turned off here.</div>}

      <main className="portal-main page-anim">
        <section className="card portal-hero">
          <div className="portal-hero-head">
            <div>
              <h1>Welcome, {lead.contactPerson}</h1>
              <p>
                {lead.company} · Enquiry <span className="mono-sub">{lead.id}</span> · received {formatDate(lead.createdOn)}
              </p>
            </div>
            <div className="portal-service">
              <span>Service</span>
              <strong>{lead.serviceDetail}</strong>
            </div>
          </div>
          {lead.stage === 'Lost' ? (
            <p className="portal-closed">This enquiry is closed. If you'd like to take it forward again, message or call us and we'll reopen it.</p>
          ) : (
            <Journey lead={lead} quote={quote} />
          )}
        </section>

        <div className="portal-grid">
          <div className="portal-col">
            <QuotationCard key={quote?.number} lead={lead} quote={quote} settings={settings} amount={amount} readOnly={Boolean(preview)} />
            {approvalStarted && (
              <StepsCard
                title="Approvals"
                steps={APPROVAL_STEPS}
                values={lead.approval}
                note="Upload your work order / PO under Documents. Our accounts team will share the advance payment details."
              />
            )}
            {lead.stage === 'Won' && <StepsCard title="Project onboarding" steps={ONBOARDING_STEPS} values={lead.onboarding} />}
            <DocumentsCard lead={lead} readOnly={Boolean(preview)} />
          </div>

          <aside className="portal-col">
            <section className="card portal-card portal-contact">
              <h2>Your contact</h2>
              <div className="portal-person">
                <span className="avatar">{initialsOf(lead.assignedTo)}</span>
                <span>
                  <strong>{lead.assignedTo}</strong>
                  <span className="muted">Relationship manager</span>
                </span>
              </div>
              <a href={`tel:${settings.phone.replace(/\s/g, '')}`}>
                <Phone size={14} /> {settings.phone}
              </a>
              <a href={`mailto:${settings.email}`}>
                <Mail size={14} /> {settings.email}
              </a>
              <span>
                <MapPin size={14} /> {settings.address}
              </span>
              <a
                className="btn btn-whatsapp"
                target="_blank"
                rel="noreferrer"
                href={whatsappLink(companyPhone, `Hello, this is ${lead.contactPerson} from ${lead.company} regarding enquiry ${lead.id}.`)}
              >
                <MessageCircle size={15} /> Message on WhatsApp
              </a>
            </section>

            <section className="card portal-card">
              <h2>Enquiry details</h2>
              <dl className="portal-facts">
                <div>
                  <dt>Service area</dt>
                  <dd>{lead.service}</dd>
                </div>
                {lead.mineral && (
                  <div>
                    <dt>Mineral</dt>
                    <dd>{lead.mineral}</dd>
                  </div>
                )}
                {lead.location && (
                  <div>
                    <dt>Site location</dt>
                    <dd>{lead.location}</dd>
                  </div>
                )}
                {lead.expectedTimeline && (
                  <div>
                    <dt>Expected timeline</dt>
                    <dd>{lead.expectedTimeline}</dd>
                  </div>
                )}
              </dl>
            </section>
          </aside>
        </div>
      </main>

      <footer className="portal-foot">
        © {new Date().getFullYear()} {settings.companyName}
      </footer>
    </div>
  )
}
