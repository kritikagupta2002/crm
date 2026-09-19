import { TODAY } from '../data/mockData'
import { isInRange, parseISODate, periodRange } from './date'

export const leadAgeDays = (lead) => Math.max(0, Math.round((TODAY - parseISODate(lead.createdOn)) / 86_400_000))

export const EMPTY_FILTERS = { search: '', service: '', owner: '', source: '', period: 'all' }

export function filterLeads(leads, { search, service, owner, source, period }) {
  const q = search.trim().toLowerCase()
  const range = period === 'all' ? null : periodRange(period, TODAY)
  return leads.filter((lead) => {
    if (service && lead.service !== service) return false
    if (owner && lead.assignedTo !== owner) return false
    if (source && lead.source !== source) return false
    if (range && !isInRange(lead.createdOn, range)) return false
    if (!q) return true
    return [lead.id, lead.company, lead.contactPerson, lead.phone, lead.email].some((value) => value?.toLowerCase().includes(q))
  })
}

const SORTERS = {
  id: (a, b) => a.id.localeCompare(b.id),
  company: (a, b) => a.company.localeCompare(b.company),
  quote: (a, b) => (a.quoteValue ?? -1) - (b.quoteValue ?? -1),
  followUp: (a, b) => (a.nextFollowUp ?? '9999').localeCompare(b.nextFollowUp ?? '9999'),
  age: (a, b) => leadAgeDays(a) - leadAgeDays(b),
}

export function sortLeads(leads, key, direction) {
  const sorted = [...leads].sort(SORTERS[key])
  return direction === 'desc' ? sorted.reverse() : sorted
}
