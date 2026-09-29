import { BID_DOCS } from '../data/tenders'
import { addDays, formatDate, formatNearDate, toISODate } from './date'

export function tenderPhase(tender, now = Date.now()) {
  if (tender.status === 'Allotted') return 'Allotted'
  if (tender.status === 'Cancelled') return 'Cancelled'
  const closes = new Date(tender.closedEarlyAt ?? tender.closesAt).getTime()
  return now < closes ? 'Open' : 'Evaluation'
}

export const PHASE_LABEL = { Open: 'Open for bids', Evaluation: 'To decide', Allotted: 'Allotted', Cancelled: 'Cancelled' }
export const PHASE_TONE = { Open: 'tone-info', Evaluation: 'tone-attention', Allotted: 'tone-good', Cancelled: 'tone-neutral' }
export const BID_TONE = { Submitted: 'tone-info', Shortlisted: 'tone-attention', Allotted: 'tone-good', Rejected: 'tone-urgent', 'Not selected': 'tone-neutral', Withdrawn: 'tone-neutral' }

export const LIVE_BID = ['Submitted', 'Shortlisted']

export const closingOf = (tender) => tender.closedEarlyAt ?? tender.closesAt

export const formatDateTime = (iso) => `${formatDate(localDay(iso))}, ${new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`

export const localDay = (iso) => new Date(iso).toLocaleDateString('en-CA')

export function daysFrom(iso, now = Date.now()) {
  const day = (t) => new Date(new Date(t).toDateString()).getTime()
  const diff = Math.round((day(iso) - day(now)) / 86_400_000)
  if (diff === 0) return 'today'
  if (diff === 1) return 'tomorrow'
  if (diff === -1) return 'yesterday'
  return diff > 0 ? `in ${diff} days` : `${-diff} days ago`
}

export function projectOfTender(tender, projects) {
  return projects.find((p) => p.id === tender.projectId) ?? projects.find((p) => p.service === tender.service && p.status !== 'Completed' && p.startedOn) ?? null
}

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

export function vendorNotices(vendorId, tenders, bids, clarifications = [], now = Date.now()) {
  const mine = bids.filter((b) => b.vendorId === vendorId)
  const weekAgo = now - 7 * 86_400_000
  const works = tenders
    .filter((t) => tenderPhase(t, now) === 'Open' && new Date(t.publishedAt).getTime() >= weekAgo && !mine.some((b) => b.tenderId === t.id))
    .map((t) => ({ id: `new-${t.id}`, at: t.publishedAt, tone: 'tone-info', title: `New work: ${t.title}`, sub: `${t.id} · bids close ${formatDateTime(closingOf(t))}`, to: `/vendor/tenders/${t.id}` }))
  const decisions = mine
    .filter((b) => !['Submitted', 'Withdrawn'].includes(b.status))
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
  const answers = clarifications
    .filter((c) => c.vendorId === vendorId && c.answer)
    .map((c) => ({ id: `cl-${c.id}`, at: c.answeredAt, tone: 'tone-info', title: `Answer to your question on ${c.tenderId}`, sub: c.answer.length > 70 ? `${c.answer.slice(0, 70)}…` : c.answer, to: `/vendor/tenders/${c.tenderId}` }))
  return [...works, ...decisions, ...answers].sort((a, b) => b.at.localeCompare(a.at))
}

export const orgChain = (tender, companyName) => `${companyName.replace(/ Pvt\. Ltd\.?$/, '')} › ${tender.service ?? tender.category}`

export function stageFor(tender, vendorId) {
  const phase = tenderPhase(tender)
  if (phase === 'Open') return { label: 'Bid submission', tone: 'tone-info', sub: `closes ${daysFrom(closingOf(tender))}` }
  if (phase === 'Evaluation') return { label: 'Bids opened · evaluation', tone: 'tone-attention', sub: `closed ${formatNearDate(localDay(closingOf(tender)))}` }
  if (phase === 'Allotted') return tender.allotted?.vendorId === vendorId ? { label: 'Allotted to you', tone: 'tone-good', sub: tender.allotted.orderId } : { label: 'Allotted (AOC)', tone: 'tone-neutral', sub: 'to another firm' }
  return { label: phase, tone: 'tone-neutral', sub: '' }
}

export function seededTenderOrder(spec, tender, bid, vendor, project, today) {
  const day = (n) => (n === null ? null : toISODate(addDays(today, n)))
  const id = `SC-${project.id.slice(3)}-${Number(tender.id.split('-').pop())}`
  const order = { id, vendor: vendor.name, work: tender.title, amount: bid.amount, issuedOn: day(spec.issued), dueOn: day(spec.due), startedOn: day(spec.started), tenderId: tender.id, bidId: bid.id }
  if (spec.delivered !== null) order.delivery = { on: day(spec.delivered), note: 'Work completed; report and data handed over.', files: [{ id: `${id}-DLV`, name: `${id}_report.pdf`, size: 1_840_000, type: 'application/pdf' }], by: vendor.contact }
  if (spec.billed !== null) order.bill = { no: `INV/${vendor.id}/${tender.id.slice(-3)}`, date: day(spec.billed), amount: bid.amount, file: { id: `${id}-BILL`, name: `${id}_invoice.pdf`, size: 310_000, type: 'application/pdf' }, by: vendor.contact }
  if (spec.checked !== null) order.check = { on: day(spec.checked), ok: true, by: 'N. Jain' }
  if (spec.paid !== null) {
    const tds = vendor.tds ?? { section: '194C', rate: 2 }
    order.payment = { on: day(spec.paid), gross: Math.round(bid.amount * 1.18), tds: { ...tds, amount: Math.round((bid.amount * tds.rate) / 100) }, ref: `NEFT${tender.id.slice(-3)}${vendor.id.slice(-2)}7`, by: 'Chhavi Bansal' }
  }
  return order
}

export function closingChip(tender, now = Date.now()) {
  const phase = tenderPhase(tender, now)
  if (phase !== 'Open') return { label: phase === 'Allotted' ? 'Allotted' : 'Bidding closed', tone: phase === 'Allotted' ? 'tone-good' : 'tone-neutral' }
  const hours = (new Date(closingOf(tender)).getTime() - now) / 3_600_000
  return { label: hours < 24 ? `Closes in ${Math.max(1, Math.round(hours))} h` : `Closes ${daysFrom(closingOf(tender), now)}`, tone: hours < 24 ? 'tone-urgent' : hours < 72 ? 'tone-attention' : 'tone-info' }
}

export const ORDER_STEPS = ['Issued', 'Started', 'Delivered', 'Billed', 'Paid']
export const orderStep = (status) => ({ Issued: 0, 'In progress': 1, Completed: 2, 'Bill received': 3, Paid: 4 })[status] ?? 0

export function tenderDates(tender, now = Date.now()) {
  const steps = [
    ['Published', tender.publishedAt],
    ...(tender.preBid ? [['Pre-bid meeting', tender.preBid.at]] : []),
    ['Bids close', closingOf(tender)],
    ['Bids open', tender.closedEarlyAt ?? tender.opensAt],
  ]
  const next = steps.findIndex(([, at]) => new Date(at).getTime() > now)
  return steps.map(([label, at], i) => ({ label, at, state: next === -1 || i < next ? 'is-done' : i === next ? 'is-next' : '' }))
}
