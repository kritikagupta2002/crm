import { TODAY } from '../data/mockData'
import { addDays, parseISODate, toISODate } from './date'

export const APPROVAL_STEPS = [
  { key: 'quoteAccepted', label: 'Quotation accepted', by: 'sales' },
  { key: 'poReceived', label: 'Work order / PO received', by: 'sales' },
  { key: 'advanceReceived', label: 'Advance payment received', by: 'payments' },
  { key: 'agreementSigned', label: 'Agreement signed', by: 'sales' },
]

export const ONBOARDING_STEPS = [
  { key: 'kyc', label: 'KYC — GST & PAN collected', by: 'onboarding' },
  { key: 'leaseDocs', label: 'Lease & site documents received', by: 'onboarding' },
  { key: 'kickoff', label: 'Kick-off meeting held', by: 'onboarding' },
  { key: 'teamAssigned', label: 'Project team assigned', by: 'onboarding' },
  { key: 'portal', label: 'Client portal access shared', by: 'onboarding' },
]

export const progressOf = (steps, values = {}) => steps.filter((step) => values[step.key]).length

export const QUOTE_STATUS_TONE = { Draft: 'tone-neutral', Sent: 'tone-info', Revised: 'tone-attention', 'Changes requested': 'tone-attention', Accepted: 'tone-good', Rejected: 'tone-urgent', Expired: 'tone-urgent' }

const round = (n) => Math.round(n / 1000) * 1000

const SENT_UNDER = { gstPct: 18, validDays: 30 }

export function seededWonOn(lead) {
  const created = parseISODate(lead.createdOn)
  const n = Number(lead.id.split('-').pop()) || 1
  const guess = Math.min(addDays(created, 18 + (n % 15)), addDays(TODAY, -3))
  return toISODate(new Date(Math.max(guess, Math.min(addDays(created, 4), TODAY))))
}

function defaultSentOn(lead) {
  const created = parseISODate(lead.createdOn)
  const afterEnquiry = new Date(Math.min(TODAY, addDays(created, 6)))
  if (lead.stage === 'Won') {
    const span = Math.round((parseISODate(seededWonOn(lead)) - created) / 86_400_000)
    return toISODate(addDays(created, Math.min(6, Math.max(1, Math.floor(span / 3)))))
  }
  const open = lead.stage === 'Proposal Sent' || lead.stage === 'Negotiation'
  if (!open) return toISODate(afterEnquiry)
  const n = Number(lead.id.split('-').pop())
  const daysAgo = (n * 7) % 36
  const afterVisit = Math.min(addDays(created, 4 + (n % 3)), TODAY)
  return toISODate(new Date(Math.max(afterVisit, addDays(TODAY, -daysAgo))))
}

export function quoteTotals({ items, discountPct = 0, gstPct = 18 }) {
  const gross = items.reduce((sum, item) => sum + item.qty * item.rate, 0)
  const discount = Math.round((gross * discountPct) / 100)
  const net = gross - discount
  const gst = Math.round((net * gstPct) / 100)
  return { gross, discount, net, gst, total: net + gst }
}

export function quoteFor(lead) {
  if (!lead.quote && !lead.quoteValue) return null
  const base = lead.quote ?? {
    version: lead.quoteStatus === 'Revised' || lead.stage === 'Negotiation' ? 2 : 1,
    items: [
      { description: lead.serviceDetail, qty: 1, rate: round(lead.quoteValue * 0.65) },
      { description: 'Field survey & site visits', qty: 1, rate: round(lead.quoteValue * 0.25) },
      { description: 'Report preparation & submission', qty: 1, rate: 0 },
    ],
    discountPct: 0,
    gstPct: SENT_UNDER.gstPct,
    validDays: SENT_UNDER.validDays,
    sentOn: defaultSentOn(lead),
  }
  if (!lead.quote) base.items[2].rate = lead.quoteValue - base.items[0].rate - base.items[1].rate
  const validUntil = toISODate(addDays(parseISODate(base.sentOn), base.validDays))
  const status = lead.quoteStatus ?? 'Sent'
  const expired = (status === 'Sent' || status === 'Revised') && validUntil < toISODate(TODAY)
  return {
    ...base,
    number: `QT-${lead.id.replace('BG-', '')}${base.version > 1 ? `-R${base.version - 1}` : ''}`,
    validUntil,
    status,
    displayStatus: expired ? 'Expired' : status,
    ...quoteTotals(base),
  }
}

export function openQuotes(leads) {
  return leads
    .map((lead) => ({ lead, quote: quoteFor(lead) }))
    .filter((row) => row.quote && (row.quote.status === 'Sent' || row.quote.status === 'Revised'))
}

export function pinnedQuote(lead) {
  if (lead.quote || !lead.quoteValue) return lead.quote
  const { version, items, discountPct, gstPct, validDays, sentOn } = quoteFor(lead)
  return { version, items, discountPct, gstPct, validDays, sentOn }
}
