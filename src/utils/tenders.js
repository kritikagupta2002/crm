import { BID_DOCS } from '../data/tenders'
import { formatDate } from './date'

/*
 * Where a tender stands. Open: taking bids (sealed). Evaluation: bidding closed, bids opened, no allotment yet.
 * Allotted: one bid won and became a work order. Closing early (the Admin's "close bidding now") counts as closed.
 */
export function tenderPhase(tender, now = Date.now()) {
  if (tender.status === 'Allotted') return 'Allotted'
  if (tender.status === 'Cancelled') return 'Cancelled'
  const closes = new Date(tender.closedEarlyAt ?? tender.closesAt).getTime()
  return now < closes ? 'Open' : 'Evaluation'
}

export const PHASE_LABEL = { Open: 'Open for bids', Evaluation: 'To decide', Allotted: 'Allotted', Cancelled: 'Cancelled' }
export const PHASE_TONE = { Open: 'tone-info', Evaluation: 'tone-attention', Allotted: 'tone-good', Cancelled: 'tone-neutral' }
export const BID_TONE = { Submitted: 'tone-info', Shortlisted: 'tone-attention', Allotted: 'tone-good', Rejected: 'tone-urgent', 'Not selected': 'tone-neutral' }

/* When bidding ends: the closing date, or when the Admin closed it early. */
export const closingOf = (tender) => tender.closedEarlyAt ?? tender.closesAt

/* "24 Sep 2026, 05:00 pm" from an ISO date-time. */
export const formatDateTime = (iso) => `${formatDate(localDay(iso))}, ${new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`

/* The local calendar day of an ISO date-time (the ISO string itself is UTC). */
export const localDay = (iso) => new Date(iso).toLocaleDateString('en-CA')

/* "in 4 days", "today", "closed 2 days ago": how far a date-time is from now, in days. */
export function daysFrom(iso, now = Date.now()) {
  const day = (t) => new Date(new Date(t).toDateString()).getTime()
  const diff = Math.round((day(iso) - day(now)) / 86_400_000)
  if (diff === 0) return 'today'
  if (diff === 1) return 'tomorrow'
  if (diff === -1) return 'yesterday'
  return diff > 0 ? `in ${diff} days` : `${-diff} days ago`
}

/* The project a tender is for: the one chosen when it was published, else the first running project of its service line. */
export function projectOfTender(tender, projects) {
  return projects.find((p) => p.id === tender.projectId) ?? projects.find((p) => p.service === tender.service && p.status !== 'Completed' && p.startedOn) ?? null
}

/* What a bid must have before it can be sent: { field: message }. */
export function validateBid(bid, tender, files) {
  const e = {}
  if (!(Number(bid.amount) > 0)) e.amount = 'Enter your quoted amount.'
  if (!(Number(bid.days) > 0)) e.days = 'Enter the days you need.'
  if (!bid.startFrom) e.startFrom = 'Choose when you can start.'
  if (!bid.note.trim()) e.note = 'Describe how you will do the work (equipment, team).'
  if (tender.emd > 0 && !bid.emdRef.trim()) e.emdRef = 'Enter the EMD payment reference.'
  const kinds = new Set([...(bid.documents ?? []).map((d) => d.kind), ...files.map((f) => f.kind)])
  const missing = BID_DOCS.filter((d) => d.required && !kinds.has(d.kind)).map((d) => d.kind)
  if (missing.length) e.documents = `Still to upload: ${missing.join(', ')}.`
  if (!bid.declared) e.declared = 'Please confirm the declaration.'
  return e
}

/*
 * What a vendor is told in their portal's bell: new works (published in the last week, not yet bid on) and
 * every decision on their bids. Newest first. seen: ids already read.
 */
export function vendorNotices(vendorId, tenders, bids, now = Date.now()) {
  const mine = bids.filter((b) => b.vendorId === vendorId)
  const weekAgo = now - 7 * 86_400_000
  const works = tenders
    .filter((t) => tenderPhase(t, now) === 'Open' && new Date(t.publishedAt).getTime() >= weekAgo && !mine.some((b) => b.tenderId === t.id))
    .map((t) => ({ id: `new-${t.id}`, at: t.publishedAt, tone: 'tone-info', title: `New work: ${t.title}`, sub: `${t.id} · bids close ${formatDateTime(closingOf(t))}`, to: `/vendor/tenders/${t.id}` }))
  const decisions = mine
    .filter((b) => b.status !== 'Submitted')
    .map((b) => {
      const t = tenders.find((x) => x.id === b.tenderId)
      const last = b.history[b.history.length - 1]
      const sub = {
        Shortlisted: 'Your bid is shortlisted',
        Allotted: `Work allotted to you${t?.allotted?.orderId ? ` · work order ${t.allotted.orderId}` : ''}`,
        Rejected: `Not accepted: ${b.reason}`,
        'Not selected': 'The work went to another firm',
      }[b.status]
      return { id: `bid-${b.id}-${b.status}`, at: last.at, tone: BID_TONE[b.status], title: `${b.status}: ${t?.title ?? b.tenderId}`, sub, to: `/vendor/tenders/${b.tenderId}` }
    })
  return [...works, ...decisions].sort((a, b) => b.at.localeCompare(a.at))
}
