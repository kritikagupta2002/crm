import { wonDate } from '../data/projects'
import { LEADS, STAGES, TODAY } from '../data/mockData'
import { addDays, parseISODate, toISODate } from './date'
import { quoteFor } from './workflow'

const todayISO = toISODate(TODAY)
const stageAt = (lead, stage) => STAGES.indexOf(lead.stage) >= STAGES.indexOf(stage) && lead.stage !== 'Lost'
const num = (lead) => Number(lead.id.split('-').pop()) || 1

/*
 * The conversations the demo's generated enquiries went through before the app was opened: first call,
 * site visit, quotation, negotiation, work order, onboarding. Derived from what each enquiry already
 * records (stage, quotation date, won date, approval and onboarding ticks), so the dates always agree
 * with the rest of the CRM. Anything done in the app is logged as an activity and isn't repeated here.
 */
export function seededInteractions(lead) {
  const seed = LEADS.find((l) => l.id === lead.id)
  const received = { key: 'received', date: lead.createdOn, type: 'created', text: `Enquiry received${lead.source ? ` via ${lead.source}` : ''} — ${lead.serviceDetail}` }
  // An enquiry added in the app has only its arrival here; everything after it is in the activity log.
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
    items.push({ key: 'nego', date: toISODate(addDays(parseISODate(quote.sentOn), 3)), type: 'contact', mode: 'Meeting', text: `Meeting — scope and price discussed with ${lead.contactPerson}` })
  if (quote && seed.stage === 'Lost') items.push({ key: 'lost', date: toISODate(addDays(parseISODate(quote.sentOn), 9)), type: 'stage', text: `Marked as Lost${seed.lostReason ? `: ${seed.lostReason}` : ''}` })

  if (won) {
    const w = parseISODate(won)
    const before = (d) => toISODate(addDays(w, -d))
    if (seed.approval?.quoteAccepted) items.push({ key: 'accepted', date: before(4), type: 'quote', text: 'Quotation accepted by the client' })
    if (seed.approval?.poReceived) items.push({ key: 'po', date: before(2), type: 'contact', mode: 'Email', text: 'Work order / PO received from the client' })
    if (seed.approval?.advanceReceived) items.push({ key: 'advance', date: before(1), type: 'stage', text: 'Advance payment received' })
    items.push({ key: 'won', date: won, type: 'stage', text: 'Deal won — client confirmed the work' })
    if (seed.onboarding?.kickoff) items.push({ key: 'kickoff', date: toISODate(addDays(w, 7)), type: 'contact', mode: 'Meeting', text: `Kick-off meeting with ${lead.contactPerson}` })
    if (seed.onboarding?.portal) items.push({ key: 'portal', date: toISODate(addDays(w, 8)), type: 'contact', mode: 'WhatsApp', text: 'Client portal login shared on WhatsApp' })
    // Once the work is running, the account owner updates the client about every month.
    if (seed.onboarding?.kickoff)
      for (let i = 1; i <= 8; i++) {
        const date = toISODate(addDays(w, 8 + i * (26 + (n % 7))))
        const mode = (n + i) % 2 ? 'Call' : 'WhatsApp'
        items.push({ key: `update${i}`, date, type: 'contact', mode, text: `${mode} — progress update shared with ${lead.contactPerson}` })
      }
  }
  return items.filter((i) => i.date <= todayISO).map((i) => ({ ...i, id: `${lead.id}-si-${i.key}` }))
}

/* An enquiry's full timeline: the seeded past plus everything done in the app, newest first. */
export function leadTimeline(lead, activities) {
  const logged = activities.filter((a) => a.leadId === lead.id).map((a) => ({ id: a.id, date: a.at.slice(0, 10), sort: a.at, type: a.type, text: a.text, at: a.at, byClient: a.by === 'client' }))
  // Derived events have no time of day: they go at the start of their day (in their own order), so anything
  // done in the app that day stays above them.
  const past = seededInteractions(lead).map((i, k) => ({ ...i, sort: `${i.date}T00:00:${String(k).padStart(2, '0')}` }))
  return [...logged, ...past].sort((a, b) => b.sort.localeCompare(a.sort))
}

// The enquiry's "deal won" already marks the project's start, so the project's own start isn't repeated.
const PROJECT_KINDS = ['team', 'submission', 'letter', 'granted', 'closed']

/* A client's whole relationship: the enquiry and its conversations, then the main moments of each project. */
export function clientTimeline(lead, activities, projects) {
  const projectItems = projects.flatMap((p) =>
    p.history.filter((h) => PROJECT_KINDS.includes(h.kind)).map((h) => ({ id: h.id, date: h.date, sort: `${h.date}T00:01`, type: 'project', text: `${p.name}: ${h.text}` })),
  )
  return [...leadTimeline(lead, activities), ...projectItems].sort((a, b) => b.sort.localeCompare(a.sort))
}

/* The latest real conversation with the client: a call, meeting, visit, WhatsApp or email, or something they did on the portal. */
export function lastContact(timeline) {
  const hit = timeline.find((i) => i.type === 'contact' || i.byClient || (i.type === 'follow-up' && / done/.test(i.text)))
  if (!hit) return null
  const mode = hit.mode ?? (hit.byClient ? 'Portal' : hit.text.split(' — ')[0].replace(/ done.*$/, ''))
  return { date: hit.date, mode }
}
