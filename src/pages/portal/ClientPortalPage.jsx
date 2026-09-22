import { ArrowLeft, Bell, Check, CheckCircle2, ClipboardCheck, ClipboardList, Download, FileText, FolderKanban, Landmark, LogOut, Paperclip, UserRound, Mail, MapPin, MessageCircle, Phone, Plus, Printer, ScrollText, Send, UploadCloud, X } from 'lucide-react'
import { useEffect, useId, useRef, useState } from 'react'
import { Link, Navigate, useSearchParams } from 'react-router-dom'
import { Checklist, ProgressBar } from '../../components/common/Checklist'
import { Logo } from '../../components/common/Logo'
import { Portal } from '../../components/common/Portal'
import { canOpen, useCrm, useMoney } from '../../context/crm'
import { formatDate, formatNearDate } from '../../utils/date'
import { downloadDocument, downloadLetter } from '../../utils/files'
import { PROJECT_STATUS_TONE, clientProjects, clientUpdates } from '../../utils/projects'
import { whatsappLink } from '../../utils/whatsapp'
import { APPROVAL_STEPS, ONBOARDING_STEPS, progressOf, quoteFor } from '../../utils/workflow'
import { QuoteDocument } from '../quotations/QuoteDocument'
import { PortalBand } from './PortalBand'
import '../projects/erm.css'
import './portal.css'

const JOURNEY = ['Enquiry received', 'Requirement discussion', 'Quotation shared', 'Work order & advance', 'Project started']

/* The ERM stages in the client's words. */
const CLIENT_STAGE_LABELS = { allocation: 'Team allocated', planning: 'Planning', tasks: 'Work scheduled', work: 'Field & report work', submission: 'Filed with authority', approval: 'Government approval', closure: 'Handed over' }

const PROJECT_JOURNEY = ['Enquiry received', 'Quotation accepted', 'Project work', 'Government approval', 'Completed']

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
  'Changes requested': ['Changes requested · being revised', 'tone-attention'],
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
const digits = (value) => value.replace(/\D/g, '').slice(-10)

/* Before the deal: the sales steps. After it: where the current project really is, down to the approval step. */
function journeyFor(lead, quote, project) {
  if (lead.stage === 'Won' && project) {
    const at = { 'Not started': 2, 'In progress': 2, 'Awaiting approval': 3, Approved: 4, Completed: 5 }[project.status]
    const note = {
      'Not started': project.startedOn ? `Starts ${formatNearDate(project.startedOn)}` : 'Starting soon',
      'In progress': `${project.milestonesDone} of ${project.milestones.length} stages done`,
      'Awaiting approval': `${project.approvalsDone} of ${project.approvals.length} steps done`,
      Approved: 'Approval received · final hand-over in progress',
    }[project.status]
    return { steps: PROJECT_JOURNEY, current: at, note }
  }
  return { steps: JOURNEY, current: journeyIndex(lead, quote), note: null }
}

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

function Journey({ lead, quote, project }) {
  const { steps, current, note } = journeyFor(lead, quote, project)
  return (
    <ol className="journey">
      {steps.map((label, i) => {
        const state = i < current ? 'is-done' : i === current ? 'is-current' : ''
        return (
          <li key={label} className={state} style={{ animationDelay: `${0.08 * i}s` }}>
            <span className="journey-dot">{state === 'is-done' ? <Check size={13} strokeWidth={3} /> : i + 1}</span>
            <span className="journey-label">{label}</span>
            {state === 'is-current' && note && <span className="journey-note">{note}</span>}
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

function QuotationCard({ lead, quote, settings, amount, readOnly, bare = false }) {
  const { acceptQuotation, requestQuoteChanges } = useCrm()
  const [viewing, setViewing] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [writing, setWriting] = useState(false)
  const [message, setMessage] = useState('')
  const [sent, setSent] = useState(false)

  const frame = bare ? 'portal-bare' : 'card portal-card'

  if (!quote) {
    return (
      <section className={frame}>
        <CardTitle icon={FileText}>Quotation</CardTitle>
        <p className="portal-empty">
          {lead.stage === 'Lost'
            ? 'No quotation was shared for this enquiry.'
            : `Your quotation is being prepared. ${lead.assignedTo} from our team will share it with you shortly.`}
        </p>
      </section>
    )
  }

  const [statusLabel, statusTone] = QUOTE_STATUS[quote.displayStatus] ?? QUOTE_STATUS.Sent
  const open = quote.status === 'Sent' || quote.status === 'Revised' || quote.status === 'Changes requested'
  const asked = quote.status === 'Changes requested'
  const canAccept = open && quote.displayStatus !== 'Expired' && lead.stage !== 'Lost' && !readOnly
  const accept = () => {
    acceptQuotation(lead.id, { byClient: true })
    setConfirming(false)
    setViewing(false)
  }

  return (
    <section className={frame}>
      <div className="portal-card-head">
        <CardTitle icon={FileText}>Quotation</CardTitle>
        <span className={`pill status-pill ${statusTone}`}>{statusLabel}</span>
      </div>

      <div className="quote-summary">
        <div>
          <span>Quotation no.</span>
          <strong>{quote.number}</strong>
        </div>
        <div>
          <span>Shared on</span>
          <strong>{formatNearDate(quote.sentOn)}</strong>
        </div>
        <div>
          <span>Valid until</span>
          <strong className={quote.displayStatus === 'Expired' ? 'text-red' : undefined}>{formatNearDate(quote.validUntil)}</strong>
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
          {open && !asked && lead.stage !== 'Lost' && !sent && (
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
            requestQuoteChanges(lead.id, message.trim(), quote.number)
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
      {(sent || asked) && (
        <p className="portal-sent">
          <CheckCircle2 size={16} />
          <span>
            {lead.assignedTo} is revising the quotation{lead.changeRequest ? <> — you asked: “{lead.changeRequest.text}”</> : '.'}
          </span>
        </p>
      )}

      {viewing && (
        <QuoteDrawer lead={lead} quote={quote} settings={settings} amount={amount} canAccept={canAccept} onAccept={accept} onClose={() => setViewing(false)} />
      )}
    </section>
  )
}

function StepsCard({ title, steps, values, note, bare = false, icon = ClipboardCheck }) {
  const done = progressOf(steps, values)
  return (
    <section className={bare ? 'portal-bare' : 'card portal-card'}>
      <div className="portal-card-head">
        <CardTitle icon={icon}>{title}</CardTitle>
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
  const { addDocuments, settings } = useCrm()
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
        <CardTitle icon={Paperclip}>Documents</CardTitle>
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
                  {doc.byClient ? 'From you' : `From ${settings.companyName.split(' ').slice(0, 2).join(' ')}`} · {formatNearDate(doc.addedOn)} · {formatSize(doc.size)}
                </span>
              </span>
              <button className="icon-button small" onClick={() => downloadDocument(doc, { company: lead.company, companyName: settings.companyName })} aria-label={`Download ${doc.name}`}>
                <Download size={15} />
              </button>
            </li>
          ))}
        </ul>
      )}
      {error && <p className="auth-error">{error}</p>}
    </section>
  )
}

function StepList({ steps, pendingLabel }) {
  const current = steps.findIndex((s) => !s.done)
  return (
    <ol className="milestones">
      {steps.map((step, i) => (
        <li key={step.key} className={step.done ? 'is-done' : i === current ? 'is-current' : ''}>
          <span className="ms-dot">{step.done && <Check size={11} strokeWidth={3} />}</span>
          <span className="ms-label">{step.label}</span>
          <span className="ms-when">{step.done ? formatNearDate(step.date) : i === current ? pendingLabel : step.date ? `planned ${formatNearDate(step.date)}` : ''}</span>
        </li>
      ))}
    </ol>
  )
}

/* Won clients: each project's work progress, the government approval it is heading for and the official letters. */
function ProjectsCard({ lead, projects, settings }) {
  const [activeId, setActiveId] = useState(projects[0].id)
  const project = projects.find((p) => p.id === activeId) ?? projects[0]
  const submitted = project.milestones[project.milestones.length - 1].done

  return (
    <section className="card portal-card">
      <div className="portal-card-head">
        <CardTitle icon={FolderKanban}>{projects.length > 1 ? 'Your projects' : 'Your project'}</CardTitle>
        <span className={`pill status-pill ${PROJECT_STATUS_TONE[project.status]}`}>{project.status}</span>
      </div>
      {projects.length > 1 && (
        <div className="project-tabs" role="tablist" aria-label="Projects">
          {projects.map((p) => (
            <button key={p.id} role="tab" aria-selected={p.id === project.id} className={p.id === project.id ? 'is-active' : ''} onClick={() => setActiveId(p.id)}>
              <strong>{p.name}</strong>
              <span>{p.status === 'Completed' ? `Completed · ${p.startedOn.slice(0, 4)}` : 'Current'}</span>
            </button>
          ))}
        </div>
      )}
      <p className="project-meta">
        {project.id} · {project.site} · {project.startedOn ? `${project.started ? 'started' : 'starts'} ${formatDate(project.startedOn)}` : 'starts once onboarding is complete'}
      </p>

      <ol className="erm-stages portal-stages" aria-label="Where your project is">
        {project.stages.map((st, i) => (
          <li key={st.key} className={st.done ? 'is-done' : i === project.stageIndex ? 'is-current' : ''}>
            <span className="erm-dot">{st.done ? <Check size={13} strokeWidth={3} /> : i + 1}</span>
            <strong>{CLIENT_STAGE_LABELS[st.key]}</strong>
          </li>
        ))}
      </ol>
      {(project.fieldVisits.length > 0 || project.submission) && (
        <p className="portal-stage-note muted">
          {project.fieldVisits.length > 0 && `${project.fieldVisits.length} site visit${project.fieldVisits.length === 1 ? '' : 's'} so far, last on ${formatDate(project.fieldVisits[0].date)}`}
          {project.fieldVisits.length > 0 && project.submission && ' · '}
          {project.submission && `Filed with ${project.authority} on ${formatDate(project.submission.date)}${project.submission.ackNo ? ` (Ack. ${project.submission.ackNo})` : ''}`}
        </p>
      )}

      <div className="project-columns">
        <div>
          <h3>
            Work progress <span className="muted">{project.milestonesDone} of {project.milestones.length}</span>
          </h3>
          <ProgressBar done={project.milestonesDone} total={project.milestones.length} tone={submitted ? 'tone-good' : 'tone-info'} />
          <StepList steps={project.milestones} pendingLabel={project.started ? 'in progress' : 'not started'} />
        </div>
        <div>
          <h3>
            <Landmark size={15} /> Government approval
          </h3>
          <p className="project-authority">{project.authority}</p>
          {submitted ? (
            <StepList steps={project.approvals} pendingLabel="with the authority" />
          ) : (
            <p className="portal-empty small">We file with the authority once the report is ready{project.dueOn ? `, planned for ${formatNearDate(project.dueOn)}` : ''}.</p>
          )}
        </div>
      </div>

      <h3 className="letters-title">
        <ScrollText size={15} /> Government letters
      </h3>
      {project.letters.length === 0 ? (
        <p className="portal-empty small">Official letters and orders appear here as soon as we receive them.</p>
      ) : (
        <ul className="portal-docs">
          {project.letters.map((letter) => (
            <li key={letter.id}>
              <ScrollText size={18} />
              <span>
                <strong>{letter.title}</strong>
                <span className="muted">
                  {letter.authority} · {letter.ref} · {formatNearDate(letter.date)}
                </span>
              </span>
              <button className="btn btn-small" onClick={() => downloadLetter(letter, { project, lead, companyName: settings.companyName })}>
                <Download size={14} /> Download
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

/* Won clients: what is already finished (quotation, approvals, onboarding) folds into one short card. */
function CompletedCard({ items }) {
  const [open, setOpen] = useState(null)
  return (
    <section className="card portal-card">
      <CardTitle icon={CheckCircle2}>Completed</CardTitle>
      <ul className="done-list">
        {items.map((item) => (
          <li key={item.key} className={open === item.key ? 'is-open' : ''}>
            <div className="done-row">
              <span className="done-tick">
                <Check size={13} strokeWidth={3} />
              </span>
              <span className="done-text">
                <strong>{item.title}</strong>
                <span className="muted">{item.sub}</span>
              </span>
              <button className="link-button" aria-expanded={open === item.key} onClick={() => setOpen(open === item.key ? null : item.key)}>
                {open === item.key ? 'Hide' : 'View'}
              </button>
            </div>
            {open === item.key && <div className="done-body">{item.content}</div>}
          </li>
        ))}
      </ul>
    </section>
  )
}

function UpdatesCard({ updates }) {
  return (
    <section className="card portal-card">
      <CardTitle icon={Bell}>Latest updates</CardTitle>
      <ol className="portal-updates">
        {updates.slice(0, 8).map((u) => (
          <li key={u.id} className={u.you ? 'is-you' : u.upcoming ? 'is-upcoming' : ''}>
            <span className="muted">{u.upcoming ? 'Coming up' : formatNearDate(u.date)}</span>
            <p>{u.text}</p>
          </li>
        ))}
      </ol>
    </section>
  )
}

/*
 * What a client sees after signing in with their enquiry ID and mobile number.
 * The team can open the same view read-only with /portal?lead=<id> ("Preview client portal").
 */
export function ClientPortalPage() {
  const { leads, settings, session, signOut, projectEdits, activities, followUps, role } = useCrm()
  const money = useMoney()
  const [params] = useSearchParams()
  const [activeId, setActiveId] = useState(null)
  const preview = session?.type === 'team' ? params.get('lead') : null
  const leadId = session?.type === 'client' ? session.leadId : preview
  const home = leads.find((l) => l.id === leadId)
  // One login shows every enquiry made from the same mobile number.
  const related = home ? leads.filter((l) => l.id === home.id || (home.phone && l.phone && digits(l.phone) === digits(home.phone))) : []
  const lead = related.find((l) => l.id === activeId) ?? home
  const missingClientLead = session?.type === 'client' && !home

  useEffect(() => {
    if (lead) document.title = `${lead.company} · Client Portal`
  }, [lead])

  // The client's enquiry can disappear when demo data is reset; sign them out cleanly.
  useEffect(() => {
    if (missingClientLead) signOut()
  }, [missingClientLead, signOut])

  if (!session || missingClientLead) return <Navigate to="/login" replace state={{ tab: 'client' }} />
  if (!lead) return <Navigate to="/leads" replace />

  const quote = quoteFor(lead)
  // The work still running comes first; finished projects follow.
  const projects = clientProjects(lead, projectEdits).sort((a, b) => (a.status === 'Completed') - (b.status === 'Completed'))
  const updates = clientUpdates({ lead, quote, projects, activities, followUps })
  const amount = preview ? money.full : clientAmount
  const approvalStarted = quote?.status === 'Accepted' || lead.stage === 'Won'

  // Once the deal is won, finished stages stop taking a whole card each.
  const completed =
    lead.stage === 'Won'
      ? [
          quote?.status === 'Accepted' && {
            key: 'quote',
            title: 'Quotation accepted',
            sub: `${quote.number} · ${amount(quote.total)} incl. GST`,
            content: <QuotationCard lead={lead} quote={quote} settings={settings} amount={amount} readOnly bare />,
          },
          progressOf(APPROVAL_STEPS, lead.approval) === APPROVAL_STEPS.length && {
            key: 'approvals',
            title: 'Work order & advance',
            sub: 'PO received, advance paid, agreement signed',
            content: <StepsCard title="Work order & advance" steps={APPROVAL_STEPS} values={lead.approval} bare />,
          },
          progressOf(ONBOARDING_STEPS, lead.onboarding) === ONBOARDING_STEPS.length && {
            key: 'onboarding',
            title: 'Onboarding',
            sub: 'KYC, lease documents, kick-off and team',
            content: <StepsCard title="Project onboarding" steps={ONBOARDING_STEPS} values={lead.onboarding} bare />,
          },
        ].filter(Boolean)
      : []
  const doneKeys = new Set(completed.map((c) => c.key))
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
            <Link className="btn" to={canOpen(role, '/leads') ? `/leads/${lead.id}` : '/'}>
              <ArrowLeft size={15} /> Back to CRM
            </Link>
          ) : (
            <div className="portal-top-actions">
              <Link className="btn btn-primary" to="/enquiry">
                <Plus size={15} /> New enquiry
              </Link>
              <button className="btn" onClick={signOut} aria-label="Sign out">
                <LogOut size={15} /> <span className="hide-sm">Sign out</span>
              </button>
            </div>
          )}
        </div>
      </header>

      {preview && <div className="portal-preview">Preview: this is what {lead.contactPerson} sees. Actions are turned off here.</div>}

      <PortalBand>
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
              {related.length > 1 && (
                <select value={lead.id} onChange={(e) => setActiveId(e.target.value)} aria-label="Switch enquiry">
                  {related.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.id} · {l.serviceDetail}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>
          {lead.stage === 'Lost' ? (
            <p className="portal-closed">This enquiry is closed. If you'd like to take it forward again, message or call us and we'll reopen it.</p>
          ) : (
            <Journey lead={lead} quote={quote} project={projects[0]} />
          )}
      </PortalBand>

      <main className="portal-main page-anim">
        <div className="portal-grid">
          <div className="portal-col">
            {projects.length > 0 && <ProjectsCard key={lead.id} lead={lead} projects={projects} settings={settings} />}
            {!doneKeys.has('quote') && <QuotationCard key={quote?.number} lead={lead} quote={quote} settings={settings} amount={amount} readOnly={Boolean(preview)} />}
            {approvalStarted && !doneKeys.has('approvals') && (
              <StepsCard
                title="Work order & advance"
                steps={APPROVAL_STEPS}
                values={lead.approval}
                note="Upload your work order / PO under Documents. Our accounts team will share the advance payment details."
              />
            )}
            {lead.stage === 'Won' && !doneKeys.has('onboarding') && <StepsCard title="Project onboarding" steps={ONBOARDING_STEPS} values={lead.onboarding} />}
            {completed.length > 0 && <CompletedCard key={`done-${lead.id}`} items={completed} />}
            <DocumentsCard lead={lead} readOnly={Boolean(preview)} />
          </div>

          <aside className="portal-col">
            <section className="card portal-card portal-contact">
              <CardTitle icon={UserRound}>Your contact</CardTitle>
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

            <UpdatesCard updates={updates} />

            <section className="card portal-card">
              <CardTitle icon={ClipboardList}>Enquiry details</CardTitle>
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
