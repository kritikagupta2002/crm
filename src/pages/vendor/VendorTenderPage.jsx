import { ArrowLeft, Bookmark, BookmarkCheck, CalendarClock, CheckCircle2, Clock, Download, FileText, IndianRupee, Landmark, Lock, MapPin, MessageCircleQuestion, Paperclip, Send, Undo2, X } from 'lucide-react'
import { useRef, useState } from 'react'
import { Link, Navigate, useOutletContext, useParams } from 'react-router-dom'
import { useCrm } from '../../context/crm'
import { TODAY } from '../../data/mockData'
import { BID_DOCS } from '../../data/tenders'
import { addDays, toISODate } from '../../utils/date'
import { downloadDocument } from '../../utils/files'
import { BID_TONE, closingChip, closingOf, formatDateTime, localDay, orgChain, tenderDates, tenderPhase, validateBid } from '../../utils/tenders'
import '../enquiry/publicEnquiry.css'

const MAX_SIZE = 10 * 1024 * 1024
const rupees = (n) => `₹${Math.round(n).toLocaleString('en-IN')}`
const formatSize = (bytes) => (bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`)

/* One eProc-style section: a heading and label / value pairs, two to a row. */
function Section({ title, rows }) {
  return (
    <section className="card portal-card eproc-section">
      <h2>{title}</h2>
      <dl className="eproc-grid">
        {rows
          .filter(([, value]) => value !== undefined && value !== null && value !== '')
          .map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
      </dl>
    </section>
  )
}

/* The bid: amount, time, how the work will be done, papers, declaration. Also used to revise a bid while bidding is open. */
function BidForm({ tender, vendor, existing, onDone }) {
  const { submitBid } = useCrm()
  const [bid, setBid] = useState(() => ({
    amount: existing?.amount ?? '',
    gstPct: existing?.gstPct ?? 18,
    days: existing?.days ?? tender.periodDays,
    startFrom: existing?.startFrom ?? toISODate(addDays(TODAY, 7)),
    validityDays: existing?.validityDays ?? tender.bidValidityDays,
    note: existing?.note ?? '',
    emdRef: existing?.emdRef ?? '',
    documents: existing?.documents ?? [],
    declared: false,
  }))
  const [files, setFiles] = useState([])
  const [errors, setErrors] = useState({})
  const [tried, setTried] = useState(false)
  const [fileError, setFileError] = useState('')
  const pickers = useRef({})
  const update = (key, value) => {
    const next = { ...bid, [key]: value }
    setBid(next)
    if (tried) setErrors(validateBid(next, tender, files))
  }
  const pickFile = (kind, file) => {
    if (!file) return
    if (file.size > MAX_SIZE) return setFileError(`${file.name} is over 10 MB and was not added.`)
    setFileError('')
    const next = [...files.filter((f) => f.kind !== kind), { kind, file }]
    setFiles(next)
    if (tried) setErrors(validateBid(bid, tender, next))
  }
  const field = (key, label, input, { required = true, hint, wide } = {}) => (
    <label className={`field ${wide ? 'field-wide' : ''} ${errors[key] ? 'has-error' : ''}`}>
      <span className="field-label">
        {label} {required && <em>*</em>}
      </span>
      {input}
      {errors[key] ? <span className="field-error">{errors[key]}</span> : hint && <span className="field-hint">{hint}</span>}
    </label>
  )
  const total = Number(bid.amount) > 0 ? Number(bid.amount) * (1 + Number(bid.gstPct) / 100) : 0

  return (
    <form
      className="public-form bid-form"
      noValidate
      onSubmit={(e) => {
        e.preventDefault()
        setTried(true)
        const found = validateBid(bid, tender, files)
        setErrors(found)
        if (Object.keys(found).length) return
        const details = { amount: Number(bid.amount), gstPct: Number(bid.gstPct), days: Number(bid.days), startFrom: bid.startFrom, validityDays: Number(bid.validityDays), note: bid.note.trim(), emdRef: bid.emdRef.trim() }
        onDone(submitBid(tender.id, vendor.id, details, files))
      }}
    >
      <fieldset>
        <legend>Your offer</legend>
        <div className="form-grid">
          {field('amount', 'Quoted amount (₹, before GST)', <input type="number" min="1" step="100" value={bid.amount} onChange={(e) => update('amount', e.target.value)} />, { hint: total ? `${rupees(total)} with GST` : 'For the whole scope of work' })}
          {field(
            'gstPct',
            'GST',
            <select value={bid.gstPct} onChange={(e) => update('gstPct', e.target.value)}>
              {[18, 12, 5, 0].map((g) => (
                <option key={g} value={g}>
                  {g}%
                </option>
              ))}
            </select>,
            { required: false },
          )}
          {field('days', 'Period of work you offer (days)', <input type="number" min="1" value={bid.days} onChange={(e) => update('days', e.target.value)} />, { hint: `Tender asks for ${tender.periodDays} days` })}
          {field('startFrom', 'Can start from', <input type="date" value={bid.startFrom} min={toISODate(TODAY)} onChange={(e) => update('startFrom', e.target.value)} />)}
          {field('validityDays', 'Bid valid for (days)', <input type="number" min="15" value={bid.validityDays} onChange={(e) => update('validityDays', e.target.value)} />, { required: false })}
          {tender.emd > 0 && field('emdRef', `EMD of ${rupees(tender.emd)} — payment reference`, <input value={bid.emdRef} onChange={(e) => update('emdRef', e.target.value)} placeholder="DD / BG / UTR no. and bank" />)}
          {field('note', 'How you will do the work', <textarea rows={3} value={bid.note} onChange={(e) => update('note', e.target.value)} placeholder="Equipment, team, method, anything the scope asks for" />, { wide: true })}
        </div>
      </fieldset>

      <fieldset className={errors.documents ? 'has-error' : ''}>
        <legend>Documents</legend>
        <ul className="doc-slots">
          {BID_DOCS.map(({ kind, required }) => {
            const picked = files.find((f) => f.kind === kind)
            const before = bid.documents.filter((d) => d.kind === kind)
            return (
              <li key={kind}>
                <span className="doc-slot-name">
                  {kind} {required && <em>*</em>}
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
                  accept=".pdf,image/*,.xlsx,.xls"
                  onChange={(e) => {
                    pickFile(kind, e.target.files[0])
                    e.target.value = ''
                  }}
                />
              </li>
            )
          })}
        </ul>
        <span className="muted small">PDF, Excel or a photo, up to 10 MB each.</span>
        {(errors.documents || fileError) && <span className="field-error">{errors.documents || fileError}</span>}
      </fieldset>

      <fieldset className={`vendor-declare ${errors.declared ? 'has-error' : ''}`}>
        <label className="check-line">
          <input type="checkbox" checked={bid.declared} onChange={(e) => update('declared', e.target.checked)} />
          <span>We have read the tender documents and accept their terms; the rates hold for the validity period, and the firm is not blacklisted or debarred.</span>
        </label>
        {errors.declared && <span className="field-error">{errors.declared}</span>}
      </fieldset>

      <div className="public-form-foot">
        <span className="muted">
          <Lock size={13} /> Sealed until {formatDateTime(closingOf(tender))}. You can revise it until then.
        </span>
        <button type="submit" className="btn btn-primary">
          <Send size={15} /> {existing ? 'Submit revised bid' : 'Submit bid'}
        </button>
      </div>
    </form>
  )
}

/* The vendor's own bid, as sent, with where it stands. */
function YourBid({ bid, tender, onRevise }) {
  const { withdrawBid } = useCrm()
  const [confirming, setConfirming] = useState(false)
  const phase = tenderPhase(tender)
  const words = {
    Submitted: phase === 'Open' ? `Sealed until ${formatDateTime(closingOf(tender))}.` : 'Bids are opened; you will hear the result by email.',
    Shortlisted: 'Your bid is shortlisted. The allotment is confirmed shortly.',
    Allotted: `The work is allotted to you. Work order ${tender.allotted?.orderId ?? ''} is in your portal.`,
    Rejected: `Not accepted: ${bid.reason}.${bid.remark ? ` ${bid.remark}` : ''}`,
    'Not selected': 'The work was allotted to another firm. Thank you for bidding.',
    Withdrawn: `You withdrew this bid on ${formatDateTime(bid.withdrawnAt ?? bid.submittedAt)}. A withdrawn bid can’t be submitted again on this tender.`,
  }[bid.status]
  return (
    <section className="card portal-card your-bid">
      <div className="portal-card-head">
        <h2>Your bid {bid.id}</h2>
        <span className={`pill status-pill ${BID_TONE[bid.status]}`}>{bid.status}</span>
      </div>
      <p className="muted">{words}</p>
      <dl className="eproc-grid">
        <div>
          <dt>Quoted</dt>
          <dd>
            {rupees(bid.amount)} + GST {bid.gstPct}%
          </dd>
        </div>
        <div>
          <dt>Period offered</dt>
          <dd>{bid.days} days</dd>
        </div>
        <div>
          <dt>Submitted</dt>
          <dd>{formatDateTime(bid.submittedAt)}</dd>
        </div>
        <div>
          <dt>Documents</dt>
          <dd>{bid.documents.map((d) => d.kind).join(', ')}</dd>
        </div>
      </dl>
      {bid.status === 'Allotted' && (
        <Link to="/vendor/orders" className="btn btn-primary">
          Open the work order
        </Link>
      )}
      {phase === 'Open' && bid.status === 'Submitted' && (
        <div className="your-bid-actions">
          {confirming ? (
            <>
              <span className="muted small">Withdraw this bid? You can’t bid again on this tender.</span>
              <button className="btn btn-small" onClick={() => setConfirming(false)}>
                Keep bid
              </button>
              <button
                className="btn btn-small btn-danger"
                onClick={() => {
                  withdrawBid(bid.id)
                  setConfirming(false)
                }}
              >
                Withdraw bid
              </button>
            </>
          ) : (
            <>
              <button className="btn" onClick={onRevise}>
                Revise bid
              </button>
              <button className="btn btn-outline-danger" onClick={() => setConfirming(true)}>
                <Undo2 size={15} /> Withdraw
              </button>
            </>
          )}
        </div>
      )}
    </section>
  )
}

/*
 * Questions on this tender (eProc's "Clarification"): answered ones are shown to every bidder without the asking
 * firm's name; the firm also sees its own questions still waiting. While bidding is open it can ask a new one.
 */
function Clarifications({ tender, vendor }) {
  const { clarifications, askClarification } = useCrm()
  const [question, setQuestion] = useState('')
  const [sent, setSent] = useState(null)
  const shown = clarifications.filter((c) => c.tenderId === tender.id && (c.answer || c.vendorId === vendor.id)).sort((a, b) => a.askedAt.localeCompare(b.askedAt))
  const open = tenderPhase(tender) === 'Open'

  return (
    <section className="card portal-card eproc-section">
      <h2>
        <MessageCircleQuestion size={17} /> Clarifications
      </h2>
      {shown.length === 0 ? (
        <p className="muted small">No questions on this tender yet.</p>
      ) : (
        <ul className="clarify-list">
          {shown.map((c) => (
            <li key={c.id}>
              <p className="clarify-q">
                <b>Q.</b> {c.question} <span className="muted small">· {formatDateTime(c.askedAt)}{c.vendorId === vendor.id ? ' · your question' : ''}</span>
              </p>
              {c.answer ? (
                <p className="clarify-a">
                  <b>A.</b> {c.answer} <span className="muted small">· {formatDateTime(c.answeredAt)}</span>
                </p>
              ) : (
                <p className="muted small">Awaiting our answer.</p>
              )}
            </li>
          ))}
        </ul>
      )}
      {open && (
        <form
          className="clarify-form"
          onSubmit={(e) => {
            e.preventDefault()
            setSent(askClarification(tender.id, vendor.id, question.trim()))
            setQuestion('')
          }}
        >
          <label className="field">
            <span className="field-label">Ask a question about this tender</span>
            <textarea rows={2} value={question} onChange={(e) => (setQuestion(e.target.value), setSent(null))} placeholder="The answer is shared with every bidder, without your name" />
          </label>
          <div className="clarify-foot">
            {sent && <span className="text-green small">Question {sent} sent.</span>}
            <button type="submit" className="btn btn-small btn-primary" disabled={!question.trim()}>
              <Send size={14} /> Send question
            </button>
          </div>
        </form>
      )}
    </section>
  )
}

/* eProc's critical dates as a timeline: what has happened is filled in, the next step is marked. */
function DatesTimeline({ tender }) {
  return (
    <ol className="dates-timeline">
      {tenderDates(tender).map(({ label, at, state }) => (
        <li key={label} className={state}>
          <span className="dates-dot" />
          <span>
            <strong>{label}</strong>
            <span className="muted small">{formatDateTime(at)}</span>
          </span>
        </li>
      ))}
    </ol>
  )
}

/*
 * One work put out for bids, after eProc Rajasthan's tender page: a summary with what matters most (value, EMD,
 * period, place, closing), the details and documents, the questions, and the firm's bid.
 */
export function VendorTenderPage() {
  const { tenderId } = useParams()
  const { vendor } = useOutletContext()
  const { tenders, bids, settings, savedTenders, toggleSavedTender } = useCrm()
  const [revising, setRevising] = useState(false)
  const [sent, setSent] = useState(null)
  const tender = tenders.find((t) => t.id === tenderId)

  if (!tender) return <Navigate to="/vendor/tenders" replace />

  const phase = tenderPhase(tender)
  const mine = bids.find((b) => b.tenderId === tender.id && b.vendorId === vendor.id)
  const saved = (savedTenders[vendor.id] ?? []).includes(tender.id)
  const day = (iso) => formatDateTime(iso)
  const SaveIcon = saved ? BookmarkCheck : Bookmark
  const chip = closingChip(tender)
  const facts = [
    [IndianRupee, 'Tender value', tender.showEstimate ? rupees(tender.estimate) : 'Not disclosed', tender.showEstimate ? 'before GST' : ''],
    [Landmark, 'EMD', tender.emd ? rupees(tender.emd) : 'Nil', tender.emd ? 'with the bid' : 'no deposit'],
    [CalendarClock, 'Period of work', `${tender.periodDays} days`, `bid valid ${tender.bidValidityDays} days`],
    [MapPin, 'Location', tender.location, tender.pincode],
  ]

  return (
    <div className="module-page vendor-page tender-page">
      <Link to="/vendor/tenders" className="back-link">
        <ArrowLeft size={15} /> Search Active Tenders
      </Link>

      <section className="card tender-summary">
        <div className="tender-summary-head">
          <div className="tender-summary-title">
            <div className="tender-chips">
              <span className="cat-chip">{tender.category}</span>
              <span className={`pill status-pill ${chip.tone}`}>
                <Clock size={12} /> {chip.label}
              </span>
              {mine && <span className={`pill status-pill ${BID_TONE[mine.status]}`}>Your bid: {mine.status.toLowerCase()}</span>}
            </div>
            <h1>{tender.title}</h1>
            <p className="muted">
              {tender.id} · {tender.refNo} · {orgChain(tender, settings.companyName)}
            </p>
          </div>
          <div className="tender-summary-actions">
            {phase === 'Open' && !mine && (
              <a href="#bid" className="btn btn-primary">
                <Send size={15} /> Submit bid
              </a>
            )}
            {mine && (
              <a href="#bid" className="btn btn-primary">
                View your bid
              </a>
            )}
            <button className={`btn ${saved ? 'is-saved' : ''}`} onClick={() => toggleSavedTender(vendor.id, tender.id)} aria-pressed={saved}>
              <SaveIcon size={15} /> {saved ? 'Saved' : 'Save'}
            </button>
          </div>
        </div>
        <dl className="tender-facts">
          {facts.map(([Icon, label, value, sub]) => (
            <div key={label}>
              <span className="tender-fact-icon">
                <Icon size={17} />
              </span>
              <span>
                <dt>{label}</dt>
                <dd>{value}</dd>
                {sub && <span className="muted small">{sub}</span>}
              </span>
            </div>
          ))}
          <div className={`tender-fact-close ${chip.tone}`}>
            <span className="tender-fact-icon">
              <Clock size={17} />
            </span>
            <span>
              <dt>Bids close</dt>
              <dd>{day(closingOf(tender))}</dd>
              <span className="small">{chip.label}</span>
            </span>
          </div>
        </dl>
      </section>

      <div className="tender-layout">
        <div className="tender-main">
          <Section
            title="Work item details"
            rows={[
              ['Work description', tender.description],
              ['Pre-qualification', tender.prequal || 'None'],
              ['Kind of work', tender.category],
              ['Pre-bid meeting', tender.preBid ? `${day(tender.preBid.at)} · ${tender.preBid.place}` : 'None'],
              ['Bid opening place', `${settings.companyName}, ${settings.address}`],
            ]}
          />
          <Section
            title="Basic details"
            rows={[
              ['Tender reference no.', tender.refNo],
              ['Tender ID', tender.id],
              ['Tender type', 'Open tender'],
              ['Form of contract', tender.contractForm],
              ['Tender category', tender.tenderCategory],
              ['No. of covers', '1 (technical and financial together)'],
              ['Tender fee', 'Nil'],
              ['EMD', tender.emd ? `${rupees(tender.emd)} (DD / BG / online, reference with the bid)` : 'Nil'],
              ['Revision / withdrawal', 'Allowed until bidding closes'],
              ['Inviting authority', `${tender.authority.name}, ${tender.authority.designation}, ${tender.authority.address}`],
            ]}
          />
          <section className="card portal-card eproc-section">
            <h2>
              <FileText size={17} /> Tender documents
            </h2>
            <ul className="app-docs">
              {tender.documents.map((d) => (
                <li key={d.id}>
                  <FileText size={15} />
                  <span>
                    <b>{d.kind}</b> {d.name}
                  </span>
                  <button className="icon-button small" onClick={() => downloadDocument({ ...d, addedOn: localDay(tender.publishedAt) }, { company: vendor.name, companyName: settings.companyName })} aria-label={`Download ${d.name}`}>
                    <Download size={15} />
                  </button>
                </li>
              ))}
            </ul>
          </section>

          <Clarifications tender={tender} vendor={vendor} />

          <div id="bid" className="bid-anchor">
            {sent && (
              <p className="portal-sent bid-sent">
                <CheckCircle2 size={18} /> Bid {sent} {mine?.history.length > 1 ? 'revised' : 'submitted'}. It stays sealed until {day(closingOf(tender))}; a confirmation is on its way by email.
              </p>
            )}
            {mine && !revising ? (
              <YourBid bid={mine} tender={tender} onRevise={() => (setRevising(true), setSent(null))} />
            ) : phase === 'Open' ? (
              <section className="card portal-card">
                <div className="portal-card-head">
                  <h2>{mine ? `Revise bid ${mine.id}` : 'Submit your bid'}</h2>
                </div>
                <BidForm
                  tender={tender}
                  vendor={vendor}
                  existing={mine}
                  onDone={(id) => {
                    setSent(id)
                    setRevising(false)
                  }}
                />
              </section>
            ) : (
              <section className="card portal-card">
                <p className="portal-empty">
                  <Lock size={15} /> Bidding closed on {day(closingOf(tender))}. You did not bid on this work.
                </p>
              </section>
            )}
          </div>
        </div>

        <aside className="tender-side">
          <section className="card portal-card">
            <h2>Critical dates</h2>
            <DatesTimeline tender={tender} />
          </section>
          <section className="card portal-card tender-side-bid">
            <h2>Your bid</h2>
            {mine ? (
              <>
                <span className={`pill status-pill ${BID_TONE[mine.status]}`}>{mine.status}</span>
                <dl className="side-facts">
                  <div>
                    <dt>Bid</dt>
                    <dd>{mine.id}</dd>
                  </div>
                  <div>
                    <dt>Quoted</dt>
                    <dd>{rupees(mine.amount)} + GST</dd>
                  </div>
                  <div>
                    <dt>Period</dt>
                    <dd>{mine.days} days</dd>
                  </div>
                </dl>
                <a href="#bid" className="link-button">
                  Details →
                </a>
              </>
            ) : phase === 'Open' ? (
              <>
                <p className="muted small">You haven’t bid yet. Your bid stays sealed until bidding closes, and you can revise it till then.</p>
                <a href="#bid" className="btn btn-primary">
                  <Send size={15} /> Submit bid
                </a>
              </>
            ) : (
              <p className="muted small">Bidding is closed.</p>
            )}
          </section>
        </aside>
      </div>
    </div>
  )
}
