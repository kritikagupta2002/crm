import { wonDate } from '../data/projects'
import { LEADS, STAGES, TODAY } from '../data/mockData'
import { addDays, parseISODate, toISODate } from './date'
import { quoteFor } from './workflow'

const todayISO = toISODate(TODAY)
const stageAt = (lead, stage) => STAGES.indexOf(lead.stage) >= STAGES.indexOf(stage) && lead.stage !== 'Lost'
const num = (lead) => Number(lead.id.split('-').pop()) || 1

export function seededInteractions(lead) {
  const seed = LEADS.find((l) => l.id === lead.id)
  const received = { key: 'received', date: lead.createdOn, type: 'created', text: `Enquiry received${lead.source ? ` via ${lead.source}` : ''} — ${lead.serviceDetail}` }
  if (!seed) return [{ ...received, id: `${lead.id}-si-received` }]
  const n = num(lead)
  const created = parseISODate(lead.createdOn)
  const at = (days) => toISODate(addDays(created, days))
  const quote = !lead.firstSentOn && !lead.quote ? quoteFor(seed) : null
  const reachedQuote = Boolean(seed.quoteValue)
  const won = seed.stage === 'Won' && !lead.wonOn ? wonDate(seed) : null
  const owner = lead.assignedTo
  const items = [received]

  if (stageAt(seed, 'Contacted') || seed.stage === 'Lost')
    items.push({ key: 'call', date: at(1), type: 'contact', mode: 'Call', text: `Call — ${owner} spoke to ${lead.contactPerson}; requirement understood (${lead.serviceDetail})` })
  if (stageAt(seed, 'Qualified') || (seed.stage === 'Lost' && reachedQuote))
    items.push({ key: 'visit', date: at(4 + (n % 3)), type: 'contact', mode: 'Site visit', text: `Site visit — ${owner} visited ${lead.location ?? 'the site'} with ${lead.contactPerson}` })
  if (quote) items.push({ key: 'quote', date: quote.sentOn, type: 'quote', text: `Quotation ${quote.number.replace(/-R\d+$/, '')} sent on WhatsApp and email` })
  if (quote && (stageAt(seed, 'Negotiation') || seed.stage === 'Won'))
    items.push({ key: 'nego', date: toISODate(addDays(parseISODate(quote.sentOn), won ? Math.min(3, Math.max(0, Math.round((parseISODate(won) - parseISODate(quote.sentOn)) / 86_400_000) - 2)) : 3)), type: 'contact', mode: 'Meeting', text: `Meeting — scope and price discussed with ${lead.contactPerson}` })
  if (quote && seed.stage === 'Lost') items.push({ key: 'lost', date: toISODate(addDays(parseISODate(quote.sentOn), 9)), type: 'stage', text: `Marked as Lost${seed.lostReason ? `: ${seed.lostReason}` : ''}` })

  if (won) {
    const w = parseISODate(won)
    const span = Math.round((w - parseISODate(quoteFor(seed)?.sentOn ?? lead.createdOn)) / 86_400_000)
    const before = (d) => toISODate(addDays(w, -Math.max(0, Math.min(d, span - 1))))
    if (seed.approval?.quoteAccepted) items.push({ key: 'accepted', date: before(4), type: 'quote', text: 'Quotation accepted by the client' })
    if (seed.approval?.poReceived) items.push({ key: 'po', date: before(2), type: 'contact', mode: 'Email', text: 'Work order / PO received from the client' })
    if (seed.approval?.advanceReceived) items.push({ key: 'advance', date: before(1), type: 'stage', text: 'Advance payment received' })
    items.push({ key: 'won', date: won, type: 'stage', text: 'Deal won — client confirmed the work' })
    if (seed.onboarding?.kickoff) items.push({ key: 'kickoff', date: toISODate(addDays(w, 7)), type: 'contact', mode: 'Meeting', text: `Kick-off meeting with ${lead.contactPerson}` })
    if (seed.onboarding?.portal) items.push({ key: 'portal', date: toISODate(addDays(w, 8)), type: 'contact', mode: 'WhatsApp', text: 'Client portal login shared on WhatsApp' })
    if (seed.onboarding?.kickoff)
      for (let i = 1; i <= 8; i++) {
        const date = toISODate(addDays(w, 8 + i * (26 + (n % 7))))
        const mode = (n + i) % 2 ? 'Call' : 'WhatsApp'
        items.push({ key: `update${i}`, date, type: 'contact', mode, text: `${mode} — progress update shared with ${lead.contactPerson}` })
      }
  }
  return items.filter((i) => i.date <= todayISO).map((i) => ({ ...i, id: `${lead.id}-si-${i.key}` }))
}

export function leadTimeline(lead, activities) {
  const who = (a) => (a.actor?.role === 'Client' ? lead.contactPerson : a.actor?.name ? `${a.actor.name}${a.actor.role === 'Vendor' ? ' (vendor)' : ''}` : null)
  const logged = activities.filter((a) => a.leadId === lead.id).map((a) => ({ id: a.id, date: a.at.slice(0, 10), sort: a.at, type: a.type, text: a.text, at: a.at, byClient: a.by === 'client', who: who(a) }))
  const past = seededInteractions(lead).map((i, k) => ({ ...i, sort: `${i.date}T00:00:${String(k).padStart(2, '0')}` }))
  return [...logged, ...past].sort((a, b) => b.sort.localeCompare(a.sort))
}

const PROJECT_KINDS = ['team', 'submission', 'letter', 'granted', 'closed']

export function clientTimeline(lead, activities, projects) {
  const projectItems = projects.flatMap((p) =>
    p.history.filter((h) => PROJECT_KINDS.includes(h.kind)).map((h) => ({ id: h.id, date: h.date, sort: `${h.date}T00:01`, type: 'project', text: `${p.name}: ${h.text}` })),
  )
  return [...leadTimeline(lead, activities), ...projectItems].sort((a, b) => b.sort.localeCompare(a.sort))
}

export function lastContact(timeline) {
  const hit = timeline.find((i) => i.type === 'contact' || i.byClient || (i.type === 'follow-up' && / done/.test(i.text)))
  if (!hit) return null
  const mode = hit.mode ?? (hit.byClient ? 'Portal' : hit.text.split(' — ')[0].replace(/ done.*$/, ''))
  return { date: hit.date, mode }
}
