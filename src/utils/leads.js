import { SERVICE_DETAILS, SERVICES, TODAY } from '../data/mockData'
import { isInRange, parseISODate, periodRange } from './date'

export const leadAgeDays = (lead) => Math.max(0, Math.round((TODAY - parseISODate(lead.createdOn)) / 86_400_000))

/* A document the client uploaded on the portal in the last week: new for the team. */
export const isNewFromClient = (doc) => Boolean(doc.byClient) && Math.round((TODAY - parseISODate(doc.addedOn)) / 86_400_000) <= 7

/* "Today" / "Yesterday" / "5 days ago" */
export function leadAgeLabel(lead) {
  const days = leadAgeDays(lead)
  return days === 0 ? 'Today' : days === 1 ? 'Yesterday' : `${days} days ago`
}

export const EMPTY_FILTERS = { search: '', service: '', owner: '', source: '', state: '', period: 'all' }

/*
 * An enquiry can ask for more than one service (e.g. a mine plan and the environment clearance together).
 * service / serviceDetail hold the first one, so lists and charts keep working; services holds them all.
 */
export const servicesOf = (lead) => (lead.services?.length ? lead.services : [{ service: lead.service, serviceDetail: lead.serviceDetail }])

/* "Mine Plan Preparation" or "Mine Plan Preparation + 1 more". */
export function serviceSummary(lead) {
  const extra = servicesOf(lead).length - 1
  return extra > 0 ? `${lead.serviceDetail} + ${extra} more` : lead.serviceDetail
}

/* A service row for the picker: the area and its first service. */
export const newService = (service = SERVICES[0]) => ({ service, serviceDetail: SERVICE_DETAILS[service][0] })

/* The fields to save for a picked list of services. */
export const serviceFields = (services) => ({ service: services[0].service, serviceDetail: services[0].serviceDetail, services: services.length > 1 ? services : undefined })

/* "Rajsamand, Rajasthan" → "Rajasthan". Free-text locations from the enquiry form work the same way. */
export const stateOf = (lead) => lead.location?.split(',').pop().trim() || ''

export function filterLeads(leads, { search, service, owner, source, state, period }) {
  const q = search.trim().toLowerCase()
  const range = period === 'all' ? null : periodRange(period, TODAY)
  return leads.filter((lead) => {
    if (service && !servicesOf(lead).some((x) => x.service === service)) return false
    if (owner && lead.assignedTo !== owner) return false
    if (source && lead.source !== source) return false
    if (state && stateOf(lead) !== state) return false
    if (range && !isInRange(lead.createdOn, range)) return false
    if (!q) return true
    return [lead.id, lead.company, lead.contactPerson, lead.phone, lead.email, lead.location].some((value) => value?.toLowerCase().includes(q))
  })
}

const SORTERS = {
  id: (a, b) => a.id.localeCompare(b.id),
  company: (a, b) => a.company.localeCompare(b.company),
  quote: (a, b) => (a.quoteValue ?? -1) - (b.quoteValue ?? -1),
  followUp: (a, b) => (a.nextFollowUp ?? '9999').localeCompare(b.nextFollowUp ?? '9999'),
  date: (a, b) => a.createdOn.localeCompare(b.createdOn) || a.id.localeCompare(b.id),
  location: (a, b) => (a.location ?? '').localeCompare(b.location ?? ''),
}

export function sortLeads(leads, key, direction) {
  const sorted = [...leads].sort(SORTERS[key])
  return direction === 'desc' ? sorted.reverse() : sorted
}

/* Counts per value, largest first; anything past `limit` is folded into "Others". */
export function countBy(leads, getKey, limit) {
  const counts = new Map()
  leads.forEach((lead) => {
    const key = getKey(lead) || 'Not specified'
    counts.set(key, (counts.get(key) ?? 0) + 1)
  })
  const sorted = [...counts].map(([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count)
  if (!limit || sorted.length <= limit) return sorted
  const others = sorted.slice(limit).reduce((sum, row) => sum + row.count, 0)
  return [...sorted.slice(0, limit), { label: 'Others', count: others }]
}
