import { Award, CheckCircle2, Download, FilePlus2, FileText, Gavel, Lock, Megaphone, Paperclip, Star, X, XCircle } from 'lucide-react'
import { useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { KpiCard } from '../../components/common/KpiCard'
import { SideDrawer } from '../../components/common/SideDrawer'
import { useAccess, useCrm, useMoney } from '../../context/crm'
import { TODAY } from '../../data/mockData'
import { BID_REJECT_REASONS, CONTRACT_FORMS, TENDER_CATEGORIES } from '../../data/tenders'
import { WORK_CATEGORIES } from '../../data/vendorApplications'
import { addDays, formatDate, formatNearDate, toISODate } from '../../utils/date'
import { downloadDocument } from '../../utils/files'
import { allProjects } from '../../utils/projects'
import { BID_TONE, PHASE_LABEL, PHASE_TONE, closingOf, daysFrom, formatDateTime, localDay, projectOfTender, tenderPhase } from '../../utils/tenders'
import '../projects/erm.css'
import './vendors.css'

const TABS = [
  ['Open', 'Open for bids'],
  ['Evaluation', 'To decide'],
  ['Allotted', 'Allotted'],
  ['All', 'All'],
]
const todayISO = toISODate(TODAY)
const running = (projects) => projects.filter((p) => p.status !== 'Completed' && p.startedOn)
const asISO = (date, time) => new Date(`${date}T${time}`).toISOString()

/* The Admin puts a work out for bids: the fields of eProc's tender page that matter for our subcontracts. */
function NewTenderForm({ projects, onDone }) {
  const { publishTender } = useCrm()
  const closes = toISODate(addDays(TODAY, 7))
  const [form, setForm] = useState({
    title: '',
    category: WORK_CATEGORIES[0],
    projectId: '',
    location: '',
    pincode: '',
    description: '',
    prequal: '',
    tenderCategory: 'Services',
    contractForm: 'Lump-sum',
    estimate: '',
    showEstimate: true,
    emd: '',
    periodDays: '',
    bidValidityDays: '60',
    closesOn: closes,
    closesAt: '17:00',
    opensOn: toISODate(addDays(TODAY, 8)),
    opensAt: '11:00',
    preBid: false,
    preBidOn: toISODate(addDays(TODAY, 2)),
    preBidAt: '11:00',
    preBidPlace: 'Bansal Geo office, Jaipur',
  })
  const [files, setFiles] = useState([])
  const [error, setError] = useState('')
  const picker = useRef(null)
  const set = (key) => (e) => setForm({ ...form, [key]: e.target.type === 'checkbox' ? e.target.checked : e.target.value })
  const pickProject = (e) => {
    const project = projects.find((p) => p.id === e.target.value)
    setForm({ ...form, projectId: e.target.value, location: form.location || project?.site || '' })
  }

  const submit = (e) => {
    e.preventDefault()
    const closesISO = asISO(form.closesOn, form.closesAt)
    const opensISO = asISO(form.opensOn, form.opensAt)
    if (new Date(closesISO) <= new Date()) return setError('Bids must close later than now.')
    if (opensISO < closesISO) return setError('Bids open after bidding closes.')
    if (!files.length) return setError('Add the notice inviting tender (and the scope or drawings).')
    const project = projects.find((p) => p.id === form.projectId)
    const id = publishTender(
      {
        title: form.title.trim(),
        description: form.description.trim(),
        prequal: form.prequal.trim(),
        category: form.category,
        projectId: project.id,
        leadId: project.lead.id,
        service: project.service,
        location: form.location.trim(),
        pincode: form.pincode.trim(),
        tenderCategory: form.tenderCategory,
        contractForm: form.contractForm,
        estimate: Number(form.estimate),
        showEstimate: form.showEstimate,
        emd: Number(form.emd) || 0,
        periodDays: Number(form.periodDays),
        bidValidityDays: Number(form.bidValidityDays) || 60,
        preBid: form.preBid ? { at: asISO(form.preBidOn, form.preBidAt), place: form.preBidPlace.trim() } : null,
        closesAt: closesISO,
        opensAt: opensISO,
      },
      files.map((file, i) => ({ file, kind: i === 0 ? 'Notice inviting tender' : 'Scope & drawings' })),
    )
    onDone(id)
  }

  return (
    <form className="letter-form tender-form" onSubmit={submit}>
      <label className="field field-wide">
        <span className="field-label">Work title</span>
        <input value={form.title} onChange={set('title')} placeholder="e.g. Exploratory core drilling, 5 boreholes × 80 m" required autoFocus />
      </label>
      <label className="field">
        <span className="field-label">For project</span>
        <select value={form.projectId} onChange={pickProject} required>
          <option value="">Choose…</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.lead.company} — {p.name}
            </option>
          ))}
        </select>
      </label>
      <label className="field">
        <span className="field-label">Kind of work</span>
        <select value={form.category} onChange={set('category')}>
          {WORK_CATEGORIES.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </label>
      <label className="field">
        <span className="field-label">Location</span>
        <input value={form.location} onChange={set('location')} placeholder="District, state" required />
      </label>
      <label className="field">
        <span className="field-label">Pincode</span>
        <input value={form.pincode} onChange={set('pincode')} inputMode="numeric" maxLength={6} />
      </label>
      <label className="field field-wide">
        <span className="field-label">Scope of work</span>
        <textarea rows={3} value={form.description} onChange={set('description')} placeholder="What is to be done, deliverables, standards" required />
      </label>
      <label className="field field-wide">
        <span className="field-label">Pre-qualification</span>
        <input value={form.prequal} onChange={set('prequal')} placeholder="e.g. NABL accreditation; 3 similar works in 5 years" />
      </label>
      <label className="field">
        <span className="field-label">Tender category</span>
        <select value={form.tenderCategory} onChange={set('tenderCategory')}>
          {TENDER_CATEGORIES.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </label>
      <label className="field">
        <span className="field-label">Form of contract</span>
        <select value={form.contractForm} onChange={set('contractForm')}>
          {CONTRACT_FORMS.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </label>
      <label className="field">
        <span className="field-label">Estimated value (₹, before GST)</span>
        <input type="number" min="1000" step="500" value={form.estimate} onChange={set('estimate')} required />
      </label>
      <label className="field check-field">
        <span className="field-label">Vendors see the estimate</span>
        <span className="check-line">
          <input type="checkbox" checked={form.showEstimate} onChange={set('showEstimate')} />
          <span>{form.showEstimate ? 'Shown on the tender' : 'Not disclosed'}</span>
        </span>
      </label>
      <label className="field">
        <span className="field-label">Period of work (days)</span>
        <input type="number" min="1" value={form.periodDays} onChange={set('periodDays')} required />
      </label>
      <label className="field">
        <span className="field-label">Bid validity (days)</span>
        <input type="number" min="15" value={form.bidValidityDays} onChange={set('bidValidityDays')} />
      </label>
      <label className="field">
        <span className="field-label">EMD (₹, optional)</span>
        <input type="number" min="0" step="500" value={form.emd} onChange={set('emd')} placeholder="None" />
      </label>
      <span />
      <label className="field">
        <span className="field-label">Bids close</span>
        <span className="date-time">
          <input type="date" value={form.closesOn} min={todayISO} onChange={set('closesOn')} required />
          <input type="time" value={form.closesAt} onChange={set('closesAt')} required />
        </span>
      </label>
      <label className="field">
        <span className="field-label">Bids open</span>
        <span className="date-time">
          <input type="date" value={form.opensOn} min={form.closesOn} onChange={set('opensOn')} required />
          <input type="time" value={form.opensAt} onChange={set('opensAt')} required />
        </span>
      </label>
      <label className="field check-field field-wide">
        <span className="check-line">
          <input type="checkbox" checked={form.preBid} onChange={set('preBid')} />
          <span>Pre-bid meeting</span>
        </span>
      </label>
      {form.preBid && (
        <>
          <label className="field">
            <span className="field-label">Meeting on</span>
            <span className="date-time">
              <input type="date" value={form.preBidOn} min={todayISO} max={form.closesOn} onChange={set('preBidOn')} />
              <input type="time" value={form.preBidAt} onChange={set('preBidAt')} />
            </span>
          </label>
          <label className="field">
            <span className="field-label">Place</span>
            <input value={form.preBidPlace} onChange={set('preBidPlace')} />
          </label>
        </>
      )}
      <div className="field field-wide">
        <span className="field-label">Tender documents</span>
        <ul className="app-docs">
          {files.map((f, i) => (
            <li key={`${f.name}-${i}`}>
              <FileText size={15} />
              <span>
                <b>{i === 0 ? 'Notice inviting tender' : 'Scope & drawings'}</b> {f.name}
              </span>
              <button type="button" className="icon-button small" onClick={() => setFiles(files.filter((x) => x !== f))} aria-label={`Remove ${f.name}`}>
                <X size={14} />
              </button>
            </li>
          ))}
          <li>
            <Paperclip size={15} />
            <span className="muted">{files.length ? 'Add scope, drawings or BOQ' : 'The first file is the notice inviting tender (NIT)'}</span>
            <button type="button" className="btn btn-small" onClick={() => picker.current?.click()}>
              Add
            </button>
          </li>
        </ul>
        <input
          ref={picker}
          type="file"
          hidden
          multiple
          accept=".pdf,image/*,.xlsx,.xls,.doc,.docx"
          onChange={(e) => {
            setFiles([...files, ...e.target.files])
            e.target.value = ''
          }}
        />
      </div>
      {error && <p className="field-error field-wide">{error}</p>}
      <p className="muted small field-wide">Publishing tells every approved vendor by email and WhatsApp. Bids stay sealed until bidding closes.</p>
      <div className="letter-form-actions">
        <button type="button" className="btn" onClick={() => onDone(null)}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary">
          <Megaphone size={15} /> Publish tender
        </button>
      </div>
    </form>
  )
}

/* One bid, opened: what the firm offered, its papers, and the Admin's next step for it. */
function BidDetail({ bid, tender, vendor, project, projects, canDecide }) {
  const { decideBid, allotBid, settings } = useCrm()
  const money = useMoney()
  const [mode, setMode] = useState(null)
  const [reason, setReason] = useState(BID_REJECT_REASONS[0])
  const [note, setNote] = useState('')
  const [projectId, setProjectId] = useState(project?.id ?? '')
  const [dueOn, setDueOn] = useState(toISODate(addDays(bid.startFrom ? new Date(`${bid.startFrom}T00:00`) : TODAY, bid.days)))
  const chosen = projects.find((p) => p.id === projectId)
  const open = ['Submitted', 'Shortlisted'].includes(bid.status)

  return (
    <div className="bid-detail">
      <dl className="bid-facts">
        <div>
          <dt>Quoted</dt>
          <dd>
            {money.full(bid.amount)} + GST {bid.gstPct}%
          </dd>
        </div>
        <div>
          <dt>Period offered</dt>
          <dd>{bid.days} days</dd>
        </div>
        <div>
          <dt>Can start</dt>
          <dd>{bid.startFrom ? formatDate(bid.startFrom) : '—'}</dd>
        </div>
        <div>
          <dt>Bid valid for</dt>
          <dd>{bid.validityDays} days</dd>
        </div>
        {tender.emd > 0 && (
          <div>
            <dt>EMD</dt>
            <dd>{bid.emdRef || '—'}</dd>
          </div>
        )}
        <div>
          <dt>Submitted</dt>
          <dd>{formatDateTime(bid.submittedAt)}</dd>
        </div>
      </dl>
      <p className="bid-note">{bid.note}</p>
      {bid.status === 'Rejected' && (
        <p className="vendor-note">
          <b>{bid.reason}.</b> {bid.remark}
        </p>
      )}
      <ul className="app-docs">
        {bid.documents.map((d) => (
          <li key={d.id}>
            <FileText size={15} />
            <span>
              <b>{d.kind}</b> {d.name}
            </span>
            <button className="icon-button small" onClick={() => downloadDocument({ ...d, addedOn: localDay(bid.submittedAt) }, { company: vendor?.name ?? bid.vendorId, companyName: settings.companyName })} aria-label={`Download ${d.name}`}>
              <Download size={15} />
            </button>
          </li>
        ))}
      </ul>

      {canDecide && open && !mode && (
        <div className="app-actions">
          {bid.status === 'Submitted' && (
            <button className="btn btn-small btn-primary" onClick={() => decideBid(bid.id, 'shortlist')}>
              <Star size={14} /> Shortlist
            </button>
          )}
          {bid.status === 'Shortlisted' && (
            <button className="btn btn-small btn-success" onClick={() => setMode('allot')}>
              <Award size={14} /> Approve & allot
            </button>
          )}
          <button className="btn btn-small btn-outline-danger" onClick={() => setMode('reject')}>
            <XCircle size={14} /> Reject
          </button>
        </div>
      )}

      {mode === 'reject' && (
        <form
          className="app-decision"
          onSubmit={(e) => {
            e.preventDefault()
            decideBid(bid.id, 'reject', { reason, note: note.trim() })
            setMode(null)
          }}
        >
          <label className="field">
            <span className="field-label">Reason</span>
            <select value={reason} onChange={(e) => setReason(e.target.value)}>
              {BID_REJECT_REASONS.map((r) => (
                <option key={r}>{r}</option>
              ))}
            </select>
          </label>
          <label className="field">
            <span className="field-label">Note to the firm</span>
            <textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Optional — sent with the reason" autoFocus />
          </label>
          <p className="muted small">{vendor?.name} is told by email, with the reason.</p>
          <div className="letter-form-actions">
            <button type="button" className="btn" onClick={() => setMode(null)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-danger">
              Reject bid
            </button>
          </div>
        </form>
      )}

      {mode === 'allot' && (
        <form
          className="app-decision"
          onSubmit={(e) => {
            e.preventDefault()
            allotBid(bid.id, chosen, dueOn)
            setMode(null)
          }}
        >
          <p>
            <b>{vendor?.name}</b> gets the work: a work order for {money.full(bid.amount)} + GST is issued in Subcontracts. The other open bids are marked not selected, and every bidder is told.
          </p>
          <label className="field">
            <span className="field-label">Project</span>
            <select value={projectId} onChange={(e) => setProjectId(e.target.value)} required>
              <option value="">Choose…</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.lead.company} — {p.name}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span className="field-label">Work due by</span>
            <input type="date" value={dueOn} min={todayISO} onChange={(e) => setDueOn(e.target.value)} required />
          </label>
          <div className="letter-form-actions">
            <button type="button" className="btn" onClick={() => setMode(null)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-success" disabled={!chosen}>
              Allot work
            </button>
          </div>
        </form>
      )}

      <ol className="app-history">
        {bid.history.map((h, i) => (
          <li key={i}>
            <span className="muted">{formatDateTime(h.at)}</span> <b>{h.action}</b> · {h.by}
            {h.note && <p>{h.note}</p>}
          </li>
        ))}
      </ol>
    </div>
  )
}

/* Vendors' questions on a tender: the Admin answers; the answer is published for every bidder. */
function TenderClarifications({ tender }) {
  const { clarifications, vendors, answerClarification } = useCrm()
  const { may } = useAccess()
  const [drafts, setDrafts] = useState({})
  const list = clarifications.filter((c) => c.tenderId === tender.id).sort((a, b) => a.askedAt.localeCompare(b.askedAt))
  if (!list.length) return null

  return (
    <section className="app-section">
      <h3>Clarifications</h3>
      <ul className="clarify-list">
        {list.map((c) => (
          <li key={c.id}>
            <p className="clarify-q">
              <b>Q.</b> {c.question}{' '}
              <span className="muted small">
                · {vendors.find((v) => v.id === c.vendorId)?.name ?? c.vendorId}, {formatDateTime(c.askedAt)}
              </span>
            </p>
            {c.answer ? (
              <p className="clarify-a">
                <b>A.</b> {c.answer}{' '}
                <span className="muted small">
                  · {c.answeredBy}, {formatDateTime(c.answeredAt)}
                </span>
              </p>
            ) : may('vendors') ? (
              <form
                className="clarify-form"
                onSubmit={(e) => {
                  e.preventDefault()
                  answerClarification(c.id, drafts[c.id].trim())
                }}
              >
                <textarea rows={2} value={drafts[c.id] ?? ''} onChange={(e) => setDrafts({ ...drafts, [c.id]: e.target.value })} placeholder="Your answer — published on the tender for every bidder" aria-label={`Answer to ${c.id}`} />
                <div className="clarify-foot">
                  <button type="submit" className="btn btn-small btn-primary" disabled={!drafts[c.id]?.trim()}>
                    Publish answer
                  </button>
                </div>
              </form>
            ) : (
              <p className="muted small">Awaiting the Admin’s answer.</p>
            )}
          </li>
        ))}
      </ul>
    </section>
  )
}

/* One tender: its details, the bids (sealed while bidding is open), and the decisions. */
function TenderDrawer({ tender, projects, onClose }) {
  const { bids, vendors, closeBidding, settings } = useCrm()
  const { may } = useAccess()
  const money = useMoney()
  const [openBid, setOpenBid] = useState(null)
  const [confirmClose, setConfirmClose] = useState(false)
  const phase = tenderPhase(tender)
  const project = projectOfTender(tender, projects)
  // A bid the firm withdrew before closing is no longer in the running.
  const all = bids.filter((b) => b.tenderId === tender.id)
  const received = all.filter((b) => b.status !== 'Withdrawn')
  const withdrawn = all.length - received.length
  const ranked = [...received].sort((a, b) => a.amount - b.amount)
  const vendorOf = (id) => vendors.find((v) => v.id === id)
  const allotted = tender.allotted && vendorOf(tender.allotted.vendorId)
  const facts = [
    ['Project', project ? `${project.lead.company} — ${project.name}` : 'Not linked'],
    ['Kind of work', tender.category],
    ['Location', [tender.location, tender.pincode].filter(Boolean).join(' · ')],
    ['Estimated value', `${money.full(tender.estimate)}${tender.showEstimate ? '' : ' · not disclosed to vendors'}`],
    ['EMD', tender.emd ? money.full(tender.emd) : 'None'],
    ['Period of work', `${tender.periodDays} days`],
    ['Contract', `${tender.tenderCategory} · ${tender.contractForm}`],
    ['Published', formatDateTime(tender.publishedAt)],
    ['Bids close', formatDateTime(closingOf(tender))],
    ['Pre-bid meeting', tender.preBid ? `${formatDateTime(tender.preBid.at)} · ${tender.preBid.place}` : 'None'],
  ]

  return (
    <SideDrawer title={tender.title} sub={`${tender.id} · ${tender.refNo}`} onClose={onClose} className="app-drawer tender-drawer">
      <div className="wo-head">
        <span className={`pill status-pill ${PHASE_TONE[phase]}`}>{PHASE_LABEL[phase]}</span>
        <span className="muted small">
          {phase === 'Open' ? `Bids close ${daysFrom(closingOf(tender))}` : phase === 'Evaluation' ? `Bidding closed ${daysFrom(closingOf(tender))}` : allotted ? `Allotted ${formatNearDate(localDay(tender.allotted.at))}` : ''}
        </span>
      </div>

      {allotted && (
        <p className="tender-result">
          <CheckCircle2 size={16} /> Allotted to <b>{allotted.name}</b> · work order{' '}
          <Link to="/subcontracts" className="link-button">
            {tender.allotted.orderId} →
          </Link>
        </p>
      )}

      <section className="app-section">
        <h3>Bids</h3>
        {phase === 'Open' ? (
          <div className="sealed-box">
            <Lock size={18} />
            <div>
              <b>
                {received.length ? `${received.length} bid${received.length === 1 ? '' : 's'} received` : 'No bids yet'}
              </b>
              <span className="muted">
                Sealed until {formatDateTime(closingOf(tender))}. Firms and amounts show once bidding closes.
                {withdrawn > 0 && ` ${withdrawn} withdrawn by the firm.`}
              </span>
            </div>
          </div>
        ) : received.length === 0 ? (
          <p className="muted small">No bids came in.</p>
        ) : (
          <ul className="bid-list">
            {ranked.map((b, i) => {
              const vendor = vendorOf(b.vendorId)
              const diff = tender.estimate ? Math.round(((b.amount - tender.estimate) / tender.estimate) * 100) : null
              return (
                <li key={b.id} className={openBid === b.id ? 'is-open' : ''}>
                  <button type="button" className="bid-row" onClick={() => setOpenBid(openBid === b.id ? null : b.id)} aria-expanded={openBid === b.id}>
                    <span className="bid-rank">L{i + 1}</span>
                    <span className="bid-firm">
                      <b>{vendor?.name ?? b.vendorId}</b>
                      <span className="muted">
                        {b.id} · {b.days} days
                      </span>
                    </span>
                    <span className="bid-amount">
                      {money.full(b.amount)}
                      {diff !== null && !money.hidden && <span className={diff > 0 ? 'text-red' : 'muted'}>{diff > 0 ? `+${diff}%` : `${diff}%`} vs estimate</span>}
                    </span>
                    <span className={`pill status-pill ${BID_TONE[b.status]}`}>{b.status}</span>
                  </button>
                  {openBid === b.id && <BidDetail bid={b} tender={tender} vendor={vendor} project={project} projects={projects} canDecide={may('vendors') && phase === 'Evaluation'} />}
                </li>
              )
            })}
          </ul>
        )}
        {phase !== 'Open' && withdrawn > 0 && (
          <p className="muted small">
            {withdrawn} bid{withdrawn === 1 ? '' : 's'} withdrawn by the firm before closing.
          </p>
        )}
        {phase === 'Evaluation' && received.length > 0 && <p className="muted small">Open a bid to shortlist or reject it; approve one of the shortlisted to allot the work.</p>}
        {phase === 'Open' && may('vendors') && (
          <div className="app-actions">
            {confirmClose ? (
              <>
                <span className="muted small">Close bidding now? Firms that haven’t bid can’t bid after this.</span>
                <button className="btn btn-small" onClick={() => setConfirmClose(false)}>
                  Cancel
                </button>
                <button
                  className="btn btn-small btn-primary"
                  onClick={() => {
                    closeBidding(tender.id)
                    setConfirmClose(false)
                  }}
                >
                  Close bidding & open bids
                </button>
              </>
            ) : (
              <button className="btn btn-small" onClick={() => setConfirmClose(true)}>
                <Gavel size={14} /> Close bidding now
              </button>
            )}
          </div>
        )}
      </section>

      <TenderClarifications tender={tender} />

      <section className="app-section">
        <h3>Work</h3>
        <p className="bid-note">{tender.description}</p>
        {tender.prequal && (
          <p className="muted small">
            <b>Pre-qualification:</b> {tender.prequal}
          </p>
        )}
        <dl>
          {facts.map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
        {tender.notified > 0 && <p className="muted small">{tender.notified} approved vendors were told when it was published.</p>}
      </section>

      <section className="app-section">
        <h3>Tender documents</h3>
        <ul className="app-docs">
          {tender.documents.map((d) => (
            <li key={d.id}>
              <FileText size={15} />
              <span>
                <b>{d.kind}</b> {d.name}
              </span>
              <button className="icon-button small" onClick={() => downloadDocument({ ...d, addedOn: localDay(tender.publishedAt) }, { company: tender.id, companyName: settings.companyName })} aria-label={`Download ${d.name}`}>
                <Download size={15} />
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="app-section">
        <h3>History</h3>
        <ol className="app-history">
          {tender.history.map((h, i) => (
            <li key={i}>
              <span className="muted">{formatDateTime(h.at)}</span> <b>{h.action}</b> · {h.by}
            </li>
          ))}
        </ol>
      </section>
    </SideDrawer>
  )
}

/*
 * Tenders (vendor sheet, flowchart 4; after eProc Rajasthan): works put out to every approved vendor, bids sealed
 * until bidding closes, then shortlisted, rejected with a reason, and one allotted as a work order.
 */
export function TendersPage() {
  const { tenders, bids, leads, projectEdits } = useCrm()
  const { may } = useAccess()
  const [params, setParams] = useSearchParams()
  const [tab, setTab] = useState('Open')
  const [creating, setCreating] = useState(false)
  const projects = running(allProjects(leads, projectEdits))
  const open = tenders.find((t) => t.id === params.get('open'))
  const phaseOf = (t) => tenderPhase(t)
  const count = (key) => (key === 'All' ? tenders.length : tenders.filter((t) => phaseOf(t) === key).length)
  const visible = tab === 'All' ? tenders : tenders.filter((t) => phaseOf(t) === tab)
  const bidsOn = (t) => bids.filter((b) => b.tenderId === t.id && b.status !== 'Withdrawn')
  const sealedBids = tenders.filter((t) => phaseOf(t) === 'Open').reduce((n, t) => n + bidsOn(t).length, 0)
  const toDecide = tenders.filter((t) => phaseOf(t) === 'Evaluation')

  return (
    <div className="module-page">
      <header className="page-header">
        <div className="page-title">
          <h1>Tenders</h1>
          <p>Works put out to approved vendors · they bid from the vendor portal</p>
        </div>
        {may('vendors') && !creating && (
          <div className="page-actions">
            <button className="btn btn-primary" onClick={() => setCreating(true)}>
              <FilePlus2 size={16} /> New tender
            </button>
          </div>
        )}
      </header>

      {creating && (
        <section className="card tender-new">
          <div className="card-header">
            <Megaphone size={18} className="card-icon" />
            <h2>New tender</h2>
          </div>
          <NewTenderForm
            projects={projects}
            onDone={(id) => {
              setCreating(false)
              if (id) {
                setTab('Open')
                setParams({ open: id }, { replace: true })
              }
            }}
          />
        </section>
      )}

      <section className="stat-grid">
        <KpiCard tone="tone-info" icon={Megaphone} label="Open for Bids" value={count('Open')}>
          <span className="muted">{sealedBids ? `${sealedBids} sealed bid${sealedBids === 1 ? '' : 's'} in` : 'No bids in yet'}</span>
        </KpiCard>
        <KpiCard tone="tone-attention" icon={Gavel} label="To Decide" value={toDecide.length}>
          <span className="muted">{toDecide.length ? `${toDecide.reduce((n, t) => n + bidsOn(t).filter((b) => ['Submitted', 'Shortlisted'].includes(b.status)).length, 0)} bids waiting` : 'Bidding still open'}</span>
        </KpiCard>
        <KpiCard tone="tone-good" icon={Award} label="Allotted" value={count('Allotted')}>
          <span className="muted">Work orders in Subcontracts</span>
        </KpiCard>
        <KpiCard tone="tone-neutral" icon={FileText} label="Bids Received" value={bids.filter((b) => b.status !== 'Withdrawn').length}>
          <span className="muted">Across {tenders.length} tenders</span>
        </KpiCard>
      </section>

      <section className="card">
        <nav className="stage-tabs" aria-label="Filter tenders">
          {TABS.map(([key, label]) => (
            <button key={key} className={`stage-tab ${tab === key ? 'is-active' : ''}`} onClick={() => setTab(key)} aria-pressed={tab === key}>
              {label}
              <span>{count(key)}</span>
            </button>
          ))}
        </nav>
        {visible.length === 0 ? (
          <p className="empty-state">{tab === 'Evaluation' ? 'Nothing to decide. Tenders come here when bidding closes.' : 'No tenders here.'}</p>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Tender</th>
                  <th>Work</th>
                  <th>Project</th>
                  <th>Bids</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((t) => {
                  const phase = phaseOf(t)
                  const project = projectOfTender(t, projects)
                  const n = bidsOn(t).length
                  return (
                    <tr key={t.id} className="clickable-row" onClick={() => setParams({ open: t.id }, { replace: true })}>
                      <td>
                        <div className="cell-strong mono-sub">{t.id}</div>
                        <div className="cell-sub">{formatNearDate(localDay(t.publishedAt))}</div>
                      </td>
                      <td>
                        <div className="cell-strong cell-clip">{t.title}</div>
                        <div className="cell-sub">
                          {t.category} · {t.location}
                        </div>
                      </td>
                      <td>
                        <div className="cell-clip">{project ? project.lead.company : '—'}</div>
                      </td>
                      <td>
                        <span className="bid-count">
                          {phase === 'Open' && <Lock size={13} />} {n}
                        </span>
                      </td>
                      <td>
                        <span className={`pill status-pill ${PHASE_TONE[phase]}`}>{PHASE_LABEL[phase]}</span>
                        <div className="cell-sub">{phase === 'Open' ? `closes ${daysFrom(closingOf(t))}` : phase === 'Allotted' ? t.allotted?.orderId : `closed ${formatNearDate(localDay(closingOf(t)))}`}</div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {open && <TenderDrawer key={open.id} tender={open} projects={projects} onClose={() => setParams({}, { replace: true })} />}
    </div>
  )
}
