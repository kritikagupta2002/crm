import { SERVICES, STAGES, TODAY } from '../data/mockData'
import { isInRange, monthShort, parseISODate, periodRange, toISODate } from './date'
import { openQuotes } from './workflow'

const countStage = (leads, stage) => leads.filter((lead) => lead.stage === stage).length
const quotedValue = (leads, stage) => leads.filter((lead) => lead.stage === stage).reduce((sum, lead) => sum + (lead.quoteValue ?? 0), 0)

/* Percentage change; null when there is nothing to compare against. */
function change(current, previous) {
  if (previous === 0) return null
  return Math.round(((current - previous) / previous) * 100)
}

export function leadsForPeriod(leads, period, offset = 0) {
  const range = periodRange(period, TODAY, offset)
  return leads.filter((lead) => isInRange(lead.createdOn, range))
}

export function countFollowUpsDue(followUps) {
  const todayISO = toISODate(TODAY)
  return {
    due: followUps.filter((f) => f.date <= todayISO).length,
    overdue: followUps.filter((f) => f.date < todayISO).length,
  }
}

export function getSummary({ leads, followUps }, period) {
  const current = leadsForPeriod(leads, period)
  const previous = leadsForPeriod(leads, period, -1)
  const won = countStage(current, 'Won')
  const wonPrev = countStage(previous, 'Won')
  const followUpsDue = countFollowUpsDue(followUps)
  // Waiting on the client is a current state, like follow-ups due, so it isn't limited to the period.
  const awaiting = openQuotes(leads)

  const rate = current.length ? (won / current.length) * 100 : 0
  const ratePrev = previous.length ? (wonPrev / previous.length) * 100 : null

  return {
    totalLeads: current.length,
    totalLeadsChange: change(current.length, previous.length),
    followUpsDue: { value: followUpsDue.due, overdue: followUpsDue.overdue },
    pendingProposals: awaiting.length,
    pendingProposalsValue: awaiting.reduce((sum, row) => sum + row.quote.total, 0),
    converted: {
      value: won,
      amount: quotedValue(current, 'Won'),
      change: won - wonPrev,
      hasPrevious: previous.length > 0,
    },
    conversion: {
      rate: Math.round(rate),
      changePoints: ratePrev === null ? null : Math.round(rate - ratePrev),
      previousRate: ratePrev === null ? null : Math.round(ratePrev),
      proposalsSent: current.filter((lead) => ['Proposal Sent', 'Negotiation', 'Won'].includes(lead.stage)).length,
    },
  }
}

export function getPipeline(leads, period) {
  const inPeriod = leadsForPeriod(leads, period)
  return STAGES.map((stage) => {
    const count = countStage(inPeriod, stage)
    return {
      stage,
      count,
      share: inPeriod.length ? Math.round((count / inPeriod.length) * 100) : 0,
    }
  })
}

export function getServiceMix(leads, period) {
  const inPeriod = leadsForPeriod(leads, period)
  return SERVICES.map((service) => {
    const count = inPeriod.filter((lead) => lead.service === service).length
    return {
      service,
      count,
      share: inPeriod.length ? Math.round((count / inPeriod.length) * 100) : 0,
    }
  })
}

/* Last six calendar months, oldest first — independent of the period filter. */
export function getMonthlyTrend(leads) {
  return Array.from({ length: 6 }, (_, i) => {
    const monthDate = new Date(TODAY.getFullYear(), TODAY.getMonth() - 5 + i, 1)
    const inMonth = leads.filter((lead) => {
      const created = parseISODate(lead.createdOn)
      return created.getFullYear() === monthDate.getFullYear() && created.getMonth() === monthDate.getMonth()
    })
    return {
      month: monthShort(monthDate),
      label: `${monthShort(monthDate)} ${monthDate.getFullYear()}`,
      enquiries: inMonth.length,
      converted: countStage(inMonth, 'Won'),
    }
  })
}

/* Newest first; the ID breaks ties so enquiries added today land on top. */
export function getRecentEnquiries(leads, limit = 5) {
  return [...leads].sort((a, b) => b.createdOn.localeCompare(a.createdOn) || b.id.localeCompare(a.id)).slice(0, limit)
}

export function getUpcomingFollowUps({ leads, followUps }, limit = 5) {
  const todayISO = toISODate(TODAY)
  return [...followUps]
    .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time))
    .slice(0, limit)
    .map((followUp) => ({
      ...followUp,
      lead: leads.find((lead) => lead.id === followUp.leadId),
      status: followUp.date < todayISO ? 'Overdue' : followUp.date === todayISO ? 'Today' : 'Upcoming',
    }))
}
