import { Bookmark, BookmarkCheck, Eye, MessageCircleQuestion, RotateCcw, Search, Send, Undo2 } from 'lucide-react'
import { useState } from 'react'
import { Link, useOutletContext } from 'react-router-dom'
import { useCrm } from '../../context/crm'
import { CONTRACT_FORMS, TENDER_CATEGORIES } from '../../data/tenders'
import { WORK_CATEGORIES } from '../../data/vendorApplications'
import { formatNearDate } from '../../utils/date'
import { BID_TONE, LIVE_BID, closingChip, closingOf, formatDateTime, localDay, orgChain, stageFor, tenderPhase } from '../../utils/tenders'

const rupees = (n) => `₹${Math.round(n).toLocaleString('en-IN')}`

function PageHead({ title, note, children }) {
  return (
    <header className="page-header">
      <div className="page-title">
        <h1>{title}</h1>
        {note && <p>{note}</p>}
      </div>
      {children && <div className="page-actions">{children}</div>}
    </header>
  )
}

function SaveButton({ vendorId, tenderId }) {
  const { savedTenders, toggleSavedTender } = useCrm()
  const saved = (savedTenders[vendorId] ?? []).includes(tenderId)
  const Icon = saved ? BookmarkCheck : Bookmark
  return (
    <button type="button" className={`icon-button small save-toggle ${saved ? 'is-saved' : ''}`} onClick={() => toggleSavedTender(vendorId, tenderId)} aria-pressed={saved} title={saved ? 'Remove from My Tenders' : 'Save to My Tenders'} aria-label={saved ? 'Remove from My Tenders' : 'Save to My Tenders'}>
      <Icon size={16} />
    </button>
  )
}

const BLANK_SEARCH = { id: '', keyword: '', contractForm: '', tenderCategory: '', category: '', location: '' }

/* Search Active Tenders: every work open for bids, with eProc's search fields. */
export function VendorSearchTendersPage() {
  const { vendor } = useOutletContext()
  const { tenders, bids, settings } = useCrm()
  const [draft, setDraft] = useState(BLANK_SEARCH)
  const [search, setSearch] = useState(BLANK_SEARCH)
  const set = (key) => (e) => setDraft({ ...draft, [key]: e.target.value })
  const has = (value, part) => !part.trim() || String(value ?? '').toLowerCase().includes(part.trim().toLowerCase())
  const active = tenders.filter((t) => tenderPhase(t) === 'Open').sort((a, b) => closingOf(a).localeCompare(closingOf(b)))
  const found = active.filter(
    (t) =>
      has(t.id, search.id) &&
      (has(t.title, search.keyword) || has(t.refNo, search.keyword)) &&
      (!search.contractForm || t.contractForm === search.contractForm) &&
      (!search.tenderCategory || t.tenderCategory === search.tenderCategory) &&
      (!search.category || t.category === search.category) &&
      has(t.location, search.location),
  )
  const bidOn = (t) => bids.find((b) => b.tenderId === t.id && b.vendorId === vendor.id)

  return (
    <div className="module-page vendor-page">
      <PageHead title="Search Active Tenders" note={`${active.length} work${active.length === 1 ? '' : 's'} open for bids`} />

      <section className="card eproc-search">
        <div className="card-header">
          <Search size={18} className="card-icon" />
          <h2>Search</h2>
        </div>
        <form
          className="search-grid"
          onSubmit={(e) => {
            e.preventDefault()
            setSearch(draft)
          }}
        >
          <label className="field">
            <span className="field-label">Tender ID</span>
            <input value={draft.id} onChange={set('id')} placeholder="e.g. TN-2026-021" />
          </label>
          <label className="field">
            <span className="field-label">Keyword</span>
            <input value={draft.keyword} onChange={set('keyword')} placeholder="Title or reference no." />
          </label>
          <label className="field">
            <span className="field-label">Form of contract</span>
            <select value={draft.contractForm} onChange={set('contractForm')}>
              <option value="">Any</option>
              {CONTRACT_FORMS.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
          <label className="field">
            <span className="field-label">Tender category</span>
            <select value={draft.tenderCategory} onChange={set('tenderCategory')}>
              <option value="">Any</option>
              {TENDER_CATEGORIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
          <label className="field">
            <span className="field-label">Kind of work</span>
            <select value={draft.category} onChange={set('category')}>
              <option value="">Any</option>
              {WORK_CATEGORIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
          <label className="field">
            <span className="field-label">Location</span>
            <input value={draft.location} onChange={set('location')} placeholder="District or state" />
          </label>
          <div className="search-actions">
            <button
              type="button"
              className="btn"
              onClick={() => {
                setDraft(BLANK_SEARCH)
                setSearch(BLANK_SEARCH)
              }}
            >
              <RotateCcw size={15} /> Clear
            </button>
            <button type="submit" className="btn btn-primary">
              <Search size={15} /> Search
            </button>
          </div>
        </form>
      </section>

      <section className="card">
        <div className="card-header">
          <h2>Tender list</h2>
          <span className="card-actions">
            {found.length} of {active.length}
          </span>
        </div>
        {found.length === 0 ? (
          <p className="empty-state">{active.length ? 'No open tender matches this search.' : 'No works open for bids right now. New works reach you by email and WhatsApp.'}</p>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>S.No</th>
                  <th>Tender ID</th>
                  <th>Title and Ref. No.</th>
                  <th>Organisation chain</th>
                  <th>Bids close</th>
                  <th className="num">Value</th>
                  <th aria-label="Save" />
                </tr>
              </thead>
              <tbody>
                {found.map((t, i) => {
                  const mine = bidOn(t)
                  return (
                    <tr key={t.id}>
                      <td className="muted">{i + 1}.</td>
                      <td className="mono-sub">
                        <Link to={`/vendor/tenders/${t.id}`} className="cell-strong">
                          {t.id}
                        </Link>
                      </td>
                      <td>
                        <Link to={`/vendor/tenders/${t.id}`} className="cell-strong tender-title-link">
                          {t.title}
                        </Link>
                        <div className="cell-sub">
                          [{t.refNo}] · {t.location}
                        </div>
                        <div className="cell-chips">
                          <span className="cat-chip">{t.category}</span>
                          {mine && <span className={`pill status-pill ${BID_TONE[mine.status]}`}>Bid {mine.status.toLowerCase()}</span>}
                        </div>
                      </td>
                      <td className="cell-sub">{orgChain(t, settings.companyName)}</td>
                      <td className="nowrap">
                        {formatDateTime(closingOf(t))}
                        <div>
                          <span className={`pill status-pill ${closingChip(t).tone} pill-small`}>{closingChip(t).label}</span>
                        </div>
                      </td>
                      <td className="num">{t.showEstimate ? rupees(t.estimate) : <span className="muted">Not disclosed</span>}</td>
                      <td>
                        <SaveButton vendorId={vendor.id} tenderId={t.id} />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}

/* My Tenders: works the firm saved to come back to, open or not. */
export function VendorMyTendersPage() {
  const { vendor } = useOutletContext()
  const { tenders, bids, savedTenders } = useCrm()
  const saved = (savedTenders[vendor.id] ?? []).map((id) => tenders.find((t) => t.id === id)).filter(Boolean)

  return (
    <div className="module-page vendor-page">
      <PageHead title="My Tenders" note="Works you saved from Search Active Tenders" />
      <section className="card">
        {saved.length === 0 ? (
          <p className="empty-state">
            Nothing saved yet. Use the <Bookmark size={13} /> on a tender to keep it here.
          </p>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>S.No</th>
                  <th>Tender ID</th>
                  <th>Title and Ref. No.</th>
                  <th>Tender stage</th>
                  <th>Your bid</th>
                  <th aria-label="Remove" />
                </tr>
              </thead>
              <tbody>
                {saved.map((t, i) => {
                  const stage = stageFor(t, vendor.id)
                  const mine = bids.find((b) => b.tenderId === t.id && b.vendorId === vendor.id)
                  return (
                    <tr key={t.id}>
                      <td className="muted">{i + 1}.</td>
                      <td className="mono-sub">{t.id}</td>
                      <td>
                        <Link to={`/vendor/tenders/${t.id}`} className="cell-strong tender-title-link">
                          {t.title}
                        </Link>
                        <div className="cell-sub">[{t.refNo}]</div>
                      </td>
                      <td>
                        <span className={`pill status-pill ${stage.tone}`}>{stage.label}</span>
                        <div className="cell-sub">{stage.sub}</div>
                      </td>
                      <td>{mine ? <span className={`pill status-pill ${BID_TONE[mine.status]}`}>{mine.status}</span> : <span className="muted">Not bid</span>}</td>
                      <td>
                        <SaveButton vendorId={vendor.id} tenderId={t.id} />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}

/* My Active Bids: bids still in the running. A sealed bid can be withdrawn until bidding closes. */
export function VendorActiveBidsPage() {
  const { vendor } = useOutletContext()
  const { tenders, bids, withdrawBid } = useCrm()
  const [confirming, setConfirming] = useState(null)
  const active = bids.filter((b) => b.vendorId === vendor.id && LIVE_BID.includes(b.status)).sort((a, b) => b.submittedAt.localeCompare(a.submittedAt))

  return (
    <div className="module-page vendor-page">
      <PageHead title="My Active Bids" note="Sealed bids and shortlisted bids" />
      <section className="card">
        {active.length === 0 ? (
          <p className="empty-state">No active bids. Bid on a work from Search Active Tenders.</p>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>S.No</th>
                  <th>Bid</th>
                  <th>Tender</th>
                  <th className="num">Quoted</th>
                  <th>Status</th>
                  <th aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                {active.map((b, i) => {
                  const t = tenders.find((x) => x.id === b.tenderId)
                  const canWithdraw = b.status === 'Submitted' && tenderPhase(t) === 'Open'
                  return (
                    <tr key={b.id}>
                      <td className="muted">{i + 1}.</td>
                      <td>
                        <div className="cell-strong mono-sub">{b.id}</div>
                        <div className="cell-sub">{formatDateTime(b.submittedAt)}</div>
                      </td>
                      <td>
                        <Link to={`/vendor/tenders/${t.id}`} className="cell-strong tender-title-link">
                          {t.title}
                        </Link>
                        <div className="cell-sub">{t.id}</div>
                      </td>
                      <td className="num">
                        {rupees(b.amount)}
                        <div className="cell-sub">+ GST · {b.days} days</div>
                      </td>
                      <td>
                        <span className={`pill status-pill ${BID_TONE[b.status]}`}>{b.status === 'Submitted' ? 'Sealed' : b.status}</span>
                        <div className="cell-sub">{b.status === 'Submitted' && tenderPhase(t) === 'Open' ? `until ${formatDateTime(closingOf(t))}` : b.status === 'Submitted' ? 'bids opened' : 'allotment soon'}</div>
                      </td>
                      <td className="row-actions">
                        {confirming === b.id ? (
                          <>
                            <button className="btn btn-small" onClick={() => setConfirming(null)}>
                              Keep
                            </button>
                            <button
                              className="btn btn-small btn-danger"
                              onClick={() => {
                                withdrawBid(b.id)
                                setConfirming(null)
                              }}
                            >
                              Withdraw
                            </button>
                          </>
                        ) : (
                          <>
                            <Link to={`/vendor/tenders/${t.id}`} className="icon-button small" aria-label="View" title="View">
                              <Eye size={15} />
                            </Link>
                            {canWithdraw && (
                              <button className="icon-button small" onClick={() => setConfirming(b.id)} aria-label="Withdraw bid" title="Withdraw bid">
                                <Undo2 size={15} />
                              </button>
                            )}
                          </>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
        {confirming && <p className="muted small vendor-warning">A withdrawn bid can’t be submitted again on the same tender.</p>}
      </section>
    </div>
  )
}

/* Clarification: the firm's questions on tenders and our answers; a new question on any open tender. */
export function VendorClarificationsPage() {
  const { vendor } = useOutletContext()
  const { tenders, clarifications, askClarification } = useCrm()
  const open = tenders.filter((t) => tenderPhase(t) === 'Open')
  const [tenderId, setTenderId] = useState(open[0]?.id ?? '')
  const [question, setQuestion] = useState('')
  const [sent, setSent] = useState(null)
  const mine = clarifications.filter((c) => c.vendorId === vendor.id)

  return (
    <div className="module-page vendor-page">
      <PageHead title="Clarification" note="Ask about a tender before you bid; answers are shared with every bidder, without your name" />

      {open.length > 0 && (
        <section className="card">
          <div className="card-header">
            <MessageCircleQuestion size={18} className="card-icon" />
            <h2>Ask a question</h2>
          </div>
          <form
            className="clarify-form"
            onSubmit={(e) => {
              e.preventDefault()
              setSent(askClarification(tenderId, vendor.id, question.trim()))
              setQuestion('')
            }}
          >
            <label className="field">
              <span className="field-label">Tender</span>
              <select value={tenderId} onChange={(e) => setTenderId(e.target.value)}>
                {open.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.id} — {t.title}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span className="field-label">Your question</span>
              <textarea rows={3} value={question} onChange={(e) => (setQuestion(e.target.value), setSent(null))} placeholder="e.g. Is the site road usable for a truck-mounted rig?" />
            </label>
            <div className="clarify-foot">
              {sent && <span className="text-green small">Question {sent} sent. The answer comes by email and shows on the tender.</span>}
              <button type="submit" className="btn btn-primary" disabled={!question.trim() || !tenderId}>
                <Send size={15} /> Send question
              </button>
            </div>
          </form>
        </section>
      )}

      <section className="card">
        <div className="card-header">
          <h2>Your questions</h2>
          <span className="card-actions">{mine.length}</span>
        </div>
        {mine.length === 0 ? (
          <p className="empty-state">No questions yet.</p>
        ) : (
          <ul className="clarify-list">
            {mine.map((c) => {
              const t = tenders.find((x) => x.id === c.tenderId)
              return (
                <li key={c.id}>
                  <div className="clarify-head">
                    <Link to={`/vendor/tenders/${c.tenderId}`} className="cell-strong">
                      {c.tenderId} · {t?.title}
                    </Link>
                    <span className={`pill status-pill ${c.answer ? 'tone-good' : 'tone-attention'}`}>{c.answer ? 'Answered' : 'Awaiting answer'}</span>
                  </div>
                  <p className="clarify-q">
                    <b>Q.</b> {c.question} <span className="muted small">· {formatDateTime(c.askedAt)}</span>
                  </p>
                  {c.answer && (
                    <p className="clarify-a">
                      <b>A.</b> {c.answer} <span className="muted small">· {formatDateTime(c.answeredAt)}</span>
                    </p>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </div>
  )
}

/* Tender Status: every tender the firm bid on and its stage, as in eProc. */
export function VendorTenderStatusPage() {
  const { vendor } = useOutletContext()
  const { tenders, bids, settings } = useCrm()
  const [keyword, setKeyword] = useState('')
  const mine = bids.filter((b) => b.vendorId === vendor.id)
  const rows = mine
    .map((b) => ({ bid: b, tender: tenders.find((t) => t.id === b.tenderId) }))
    .filter(({ tender }) => tender && (!keyword.trim() || `${tender.id} ${tender.title} ${tender.refNo}`.toLowerCase().includes(keyword.trim().toLowerCase())))
    .sort((a, b) => b.bid.submittedAt.localeCompare(a.bid.submittedAt))

  return (
    <div className="module-page vendor-page">
      <PageHead title="Tender Status" note="Where each tender you bid on stands">
        <label className="search compact-search">
          <Search size={15} />
          <input value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="Tender ID or keyword" aria-label="Search tenders" />
        </label>
      </PageHead>
      <section className="card">
        {rows.length === 0 ? (
          <p className="empty-state">{mine.length ? 'No tender matches.' : 'You haven’t bid on any tender yet.'}</p>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>S.No</th>
                  <th>Tender ID</th>
                  <th>Title and Ref. No.</th>
                  <th>Organisation chain</th>
                  <th>Tender stage</th>
                  <th>Your bid</th>
                  <th aria-label="View" />
                </tr>
              </thead>
              <tbody>
                {rows.map(({ bid, tender }, i) => {
                  const stage = stageFor(tender, vendor.id)
                  return (
                    <tr key={bid.id}>
                      <td className="muted">{i + 1}.</td>
                      <td className="mono-sub">{tender.id}</td>
                      <td>
                        <span className="cell-strong">{tender.title}</span>
                        <div className="cell-sub">[{tender.refNo}]</div>
                      </td>
                      <td className="cell-sub">{orgChain(tender, settings.companyName)}</td>
                      <td>
                        <span className={`pill status-pill ${stage.tone}`}>{stage.label}</span>
                        <div className="cell-sub">{stage.sub}</div>
                      </td>
                      <td>
                        <span className={`pill status-pill ${BID_TONE[bid.status]}`}>{bid.status}</span>
                      </td>
                      <td>
                        <Link to={`/vendor/tenders/${tender.id}`} className="icon-button small" aria-label={`View ${tender.id}`} title="View">
                          <Eye size={15} />
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}

/* My Bids History: every bid and how it ended; My Withdrawn Bids: the ones the firm took back. */
export function VendorBidsHistoryPage({ withdrawn = false }) {
  const { vendor } = useOutletContext()
  const { tenders, bids } = useCrm()
  const rows = bids.filter((b) => b.vendorId === vendor.id && (withdrawn ? b.status === 'Withdrawn' : b.status !== 'Withdrawn')).sort((a, b) => b.submittedAt.localeCompare(a.submittedAt))

  return (
    <div className="module-page vendor-page">
      <PageHead title={withdrawn ? 'My Withdrawn Bids' : 'My Bids History'} note={withdrawn ? 'Bids you took back before bidding closed' : 'Every bid you sent and its result'} />
      <section className="card">
        {rows.length === 0 ? (
          <p className="empty-state">{withdrawn ? 'No withdrawn bids.' : 'No bids yet.'}</p>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>S.No</th>
                  <th>Bid</th>
                  <th>Tender</th>
                  <th className="num">Quoted</th>
                  <th>{withdrawn ? 'Withdrawn on' : 'Result'}</th>
                  {!withdrawn && <th>Note</th>}
                </tr>
              </thead>
              <tbody>
                {rows.map((b, i) => {
                  const t = tenders.find((x) => x.id === b.tenderId)
                  const note = { Allotted: `Work order ${t?.allotted?.orderId ?? ''}`, Rejected: [b.reason, b.remark].filter(Boolean).join(' — '), 'Not selected': 'Allotted to another firm', Shortlisted: 'Allotment soon', Submitted: tenderPhase(t) === 'Open' ? 'Sealed' : 'Bids opened' }[b.status]
                  return (
                    <tr key={b.id}>
                      <td className="muted">{i + 1}.</td>
                      <td>
                        <div className="cell-strong mono-sub">{b.id}</div>
                        <div className="cell-sub">{formatNearDate(localDay(b.submittedAt))}</div>
                      </td>
                      <td>
                        <Link to={`/vendor/tenders/${b.tenderId}`} className="cell-strong tender-title-link">
                          {t?.title ?? b.tenderId}
                        </Link>
                        <div className="cell-sub">{b.tenderId}</div>
                      </td>
                      <td className="num">{rupees(b.amount)}</td>
                      <td>{withdrawn ? formatDateTime(b.withdrawnAt) : <span className={`pill status-pill ${BID_TONE[b.status]}`}>{b.status}</span>}</td>
                      {!withdrawn && <td className="cell-sub">{note}</td>}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
