import { ArrowLeft, CheckCircle2, Download, FileText, Lock, Paperclip, Send, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { useCrm } from '../../context/crm'
import { TODAY } from '../../data/mockData'
import { BID_DOCS } from '../../data/tenders'
import { addDays, toISODate } from '../../utils/date'
import { downloadDocument } from '../../utils/files'
import { BID_TONE, closingOf, formatDateTime, localDay, tenderPhase, validateBid } from '../../utils/tenders'
import { PortalBand } from '../portal/PortalBand'
import { VendorTop } from './VendorShell'
import '../portal/portal.css'
import '../enquiry/publicEnquiry.css'
import './vendor.css'

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
  const phase = tenderPhase(tender)
  const words = {
    Submitted: phase === 'Open' ? `Sealed until ${formatDateTime(closingOf(tender))}.` : 'Bids are opened; you will hear the result by email.',
    Shortlisted: 'Your bid is shortlisted. The allotment is confirmed shortly.',
    Allotted: `The work is allotted to you. Work order ${tender.allotted?.orderId ?? ''} is in your portal.`,
    Rejected: `Not accepted: ${bid.reason}.${bid.remark ? ` ${bid.remark}` : ''}`,
    'Not selected': 'The work was allotted to another firm. Thank you for bidding.',
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
        <Link to="/vendor?tab=orders" className="btn btn-primary">
          Open the work order
        </Link>
      )}
      {phase === 'Open' && bid.status === 'Submitted' && (
        <button className="btn" onClick={onRevise}>
          Revise bid
        </button>
      )}
    </section>
  )
}

/*
 * One work put out for bids, laid out like eProc Rajasthan's tender page (basic details, fee, work item, critical
 * dates, documents, inviting authority), with the vendor's bid below it.
 */
export function VendorTenderPage() {
  const { tenderId } = useParams()
  const { vendorId, vendors, tenders, bids, settings } = useCrm()
  const [revising, setRevising] = useState(false)
  const [sent, setSent] = useState(null)
  const vendor = vendors.find((v) => v.id === vendorId)
  const tender = tenders.find((t) => t.id === tenderId)

  useEffect(() => {
    if (tender) document.title = `${tender.id} · Vendor Portal`
  }, [tender])

  if (!vendor) return <Navigate to="/login" replace state={{ tab: 'vendor' }} />
  if (!tender) return <Navigate to="/vendor" replace />

  const phase = tenderPhase(tender)
  const mine = bids.find((b) => b.tenderId === tender.id && b.vendorId === vendor.id)
  const day = (iso) => formatDateTime(iso)

  return (
    <div className="portal vendor-portal">
      <VendorTop vendorId={vendor.id} />
      <PortalBand compact>
        <Link to="/vendor" className="band-back">
          <ArrowLeft size={15} /> All works
        </Link>
        <h1 className="band-title">{tender.title}</h1>
        <p className="band-lead">
          {tender.id} · {tender.location} · {phase === 'Open' ? `bids close ${day(closingOf(tender))}` : phase === 'Allotted' ? 'allotted' : 'bidding closed'}
        </p>
      </PortalBand>

      <main className="portal-main page-anim">
        <div className="tender-page">
          <Section
            title="Basic details"
            rows={[
              ['Organisation', `${settings.companyName} › Vendor works › ${tender.category}`],
              ['Tender reference no.', tender.refNo],
              ['Tender ID', tender.id],
              ['Tender type', 'Open tender'],
              ['Form of contract', tender.contractForm],
              ['Tender category', tender.tenderCategory],
              ['No. of covers', '1 (technical and financial together)'],
              ['Revision allowed', 'Yes — until bidding closes'],
            ]}
          />
          <Section
            title="Tender fee & EMD"
            rows={[
              ['Tender fee', 'Nil'],
              ['EMD', tender.emd ? `${rupees(tender.emd)} (DD / BG / online, reference with the bid)` : 'Nil'],
            ]}
          />
          <Section
            title="Work item details"
            rows={[
              ['Title', tender.title],
              ['Work description', tender.description],
              ['Pre-qualification', tender.prequal || 'None'],
              ['Tender value', tender.showEstimate ? `${rupees(tender.estimate)} (before GST)` : 'Not disclosed'],
              ['Kind of work', tender.category],
              ['Period of work', `${tender.periodDays} days`],
              ['Bid validity', `${tender.bidValidityDays} days`],
              ['Location', tender.location],
              ['Pincode', tender.pincode],
              ['Pre-bid meeting', tender.preBid ? `${day(tender.preBid.at)} · ${tender.preBid.place}` : 'None'],
              ['Bid opening place', `${settings.companyName}, ${settings.address}`],
            ]}
          />
          <Section
            title="Critical dates"
            rows={[
              ['Published', day(tender.publishedAt)],
              ['Documents download', `${day(tender.publishedAt)} to ${day(closingOf(tender))}`],
              ['Bid submission start', day(tender.publishedAt)],
              ['Bid submission end', day(closingOf(tender)) + (tender.closedEarlyAt ? ' (closed early)' : '')],
              ['Bid opening', tender.closedEarlyAt ? day(tender.closedEarlyAt) : day(tender.opensAt)],
            ]}
          />
          <section className="card portal-card eproc-section">
            <h2>Tender documents</h2>
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
          <Section
            title="Tender inviting authority"
            rows={[
              ['Name', `${tender.authority.name}, ${tender.authority.designation}`],
              ['Address', tender.authority.address],
            ]}
          />

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
      </main>

      <footer className="portal-foot">
        © {new Date().getFullYear()} {settings.companyName}
      </footer>
    </div>
  )
}
