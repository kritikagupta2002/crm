import { TODAY } from '../data/mockData'
import { addDays, parseISODate, toISODate } from './date'

/* Steps between "client accepted the quotation" and "Won". */
export const APPROVAL_STEPS = [
  { key: 'quoteAccepted', label: 'Quotation accepted' },
  { key: 'poReceived', label: 'Work order / PO received' },
  { key: 'advanceReceived', label: 'Advance payment received' },
  { key: 'agreementSigned', label: 'Agreement signed' },
]

/* Steps that turn a won lead into an active client. */
export const ONBOARDING_STEPS = [
  { key: 'kyc', label: 'KYC — GST & PAN collected' },
  { key: 'leaseDocs', label: 'Lease & site documents received' },
  { key: 'kickoff', label: 'Kick-off meeting held' },
  { key: 'teamAssigned', label: 'Project team assigned' },
  { key: 'portal', label: 'Client portal access shared' },
]

export const progressOf = (steps, values = {}) => steps.filter((step) => values[step.key]).length

export const QUOTE_STATUS_TONE = { Draft: 'tone-neutral', Sent: 'tone-info', Revised: 'tone-attention', Accepted: 'tone-good', Rejected: 'tone-urgent', Expired: 'tone-urgent' }

const round = (n) => Math.round(n / 1000) * 1000

/*
 * When a generated quotation was sent: closed ones a few days after the enquiry; open ones
 * (still awaiting an answer) within the last ~5 weeks, so only a few have run past validity.
 */
function defaultSentOn(lead) {
  const afterEnquiry = new Date(Math.min(TODAY, addDays(parseISODate(lead.createdOn), 6)))
  const open = lead.stage === 'Proposal Sent' || lead.stage === 'Negotiation'
  if (!open) return toISODate(afterEnquiry)
  const daysAgo = (Number(lead.id.split('-').pop()) * 7) % 36
  return toISODate(new Date(Math.max(parseISODate(lead.createdOn), addDays(TODAY, -daysAgo))))
}

export function quoteTotals({ items, discountPct = 0, gstPct = 18 }) {
  const gross = items.reduce((sum, item) => sum + item.qty * item.rate, 0)
  const discount = Math.round((gross * discountPct) / 100)
  const net = gross - discount
  const gst = Math.round((net * gstPct) / 100)
  return { gross, discount, net, gst, total: net + gst }
}

/*
 * The quotation for a lead: the one built in the app if there is one, otherwise a standard
 * three-line quotation derived from the lead's quoted amount (so generated leads have one too).
 */
export function quoteFor(lead, settings) {
  if (!lead.quote && !lead.quoteValue) return null
  const base = lead.quote ?? {
    version: lead.quoteStatus === 'Revised' || lead.stage === 'Negotiation' ? 2 : 1,
    items: [
      { description: lead.serviceDetail, qty: 1, rate: round(lead.quoteValue * 0.65) },
      { description: 'Field survey & site visits', qty: 1, rate: round(lead.quoteValue * 0.25) },
      { description: 'Report preparation & submission', qty: 1, rate: 0 },
    ],
    discountPct: 0,
    gstPct: settings.gstPct,
    validDays: settings.quoteValidityDays,
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
