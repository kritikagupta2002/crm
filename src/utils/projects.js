import { baseProjects } from '../data/projects'
import { TODAY } from '../data/mockData'
import { formatDayMonth, toISODate } from './date'

const todayISO = toISODate(TODAY)

/*
 * A step is done when its planned date has passed, unless the team has marked it otherwise:
 * an edit is the ISO date it was done on, or false for "not done yet".
 */
function resolve(step, edit) {
  if (edit === false) return { ...step, done: false }
  if (typeof edit === 'string') return { ...step, done: true, date: edit }
  return { ...step, done: Boolean(step.date && step.date <= todayISO) }
}

export const PROJECT_STATUS_TONE = { 'Not started': 'tone-neutral', 'In progress': 'tone-info', 'Awaiting approval': 'tone-attention', Completed: 'tone-good' }

/* A client's projects with the team's edits applied: milestones, approval steps, letters and a status. */
export function clientProjects(lead, projectEdits = {}) {
  return baseProjects(lead).map((base) => {
    const edits = projectEdits[base.id] ?? {}
    const milestones = base.milestones.map((m) => resolve(m, edits.milestones?.[m.key]))
    // Approval steps can't run ahead of the submission.
    const submitted = milestones[milestones.length - 1].done
    const approvals = base.approvals.map((s) => (submitted ? resolve(s, edits.approvals?.[s.key]) : { ...s, done: false }))
    const letters = [
      ...approvals
        .filter((s) => s.done && s.letter)
        .map((s, i) => ({ id: `${base.id}-${s.key}`, title: s.letter, authority: base.authority, ref: `${base.refBase}/${i + 1}`, date: s.date, stepKey: s.key })),
      ...(edits.letters ?? []),
    ].sort((a, b) => b.date.localeCompare(a.date))
    const milestonesDone = milestones.filter((m) => m.done).length
    const approvalsDone = approvals.filter((s) => s.done).length
    // A project whose start date is still ahead (just won) hasn't started, even though it has a plan.
    // Started once its date has come, or earlier if the team has already ticked work off.
    const firstDone = milestones.find((m) => m.done)?.date
    const startedOn = firstDone && (!base.startedOn || firstDone < base.startedOn) ? firstDone : base.startedOn
    const started = Boolean(startedOn && startedOn <= todayISO)
    const status = !started && milestonesDone === 0 ? 'Not started' : approvalsDone === approvals.length ? 'Completed' : submitted ? 'Awaiting approval' : 'In progress'
    return { ...base, startedOn, milestones, approvals, letters, milestonesDone, approvalsDone, status, started }
  })
}

/* Where a project stands right now: the first open milestone, else the approval step with the authority. */
function currentStep(p) {
  if (p.status === 'Completed') return { label: p.approvals[p.approvals.length - 1].label, date: null }
  if (!p.startedOn && p.milestonesDone === 0) return { label: 'Waiting for onboarding', date: null }
  if (!p.started && p.milestonesDone === 0) return { label: 'Kick-off', date: p.startedOn }
  const m = p.milestones.find((s) => !s.done)
  if (m) return { label: m.label, date: m.date }
  const a = p.approvals.find((s) => !s.done)
  return { label: a.label, date: a.date }
}

const STATUS_ORDER = ['Awaiting approval', 'In progress', 'Not started', 'Completed']

/* Every won client's projects, busiest first, each with its client lead and current step. */
export function allProjects(leads, projectEdits) {
  return leads
    .flatMap((lead) => clientProjects(lead, projectEdits).map((p) => ({ ...p, lead, now: currentStep(p) })))
    .sort((a, b) => STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status) || a.id.localeCompare(b.id))
}

const FOLLOW_UP_FOR_CLIENT = /^(Site Visit|Meeting|Presentation) scheduled for (.*)$/

/*
 * What the client sees as "Latest updates": milestones of their own enquiry and project, never the
 * team's internal notes or calls. Newest first.
 */
export function clientUpdates({ lead, quote, projects, activities, followUps }) {
  const items = [{ id: 'received', text: 'We received your enquiry', date: lead.createdOn, sort: `${lead.createdOn}T00:00:00` }]
  if (quote) {
    const sentOn = lead.firstSentOn ?? quote.sentOn
    items.push({ id: 'quote', text: `Quotation ${quote.number.replace(/-R\d+$/, '')} shared with you`, date: sentOn, sort: `${sentOn}T00:00:01` })
  }
  activities
    .filter((a) => a.leadId === lead.id)
    .forEach((a) => {
      // Activities carry a time, so things done on the same day keep their real order.
      const date = a.at.slice(0, 10)
      const sort = `${date}T${new Date(a.at).toTimeString().slice(0, 8)}`
      if (a.by === 'client') items.push({ id: a.id, text: a.clientText ?? a.text, date, sort, you: true })
      else if (a.type === 'quote' && /revised/i.test(a.text)) items.push({ id: a.id, text: 'We sent you a revised quotation', date, sort })
      else if (a.type === 'stage' && /to Won$/.test(a.text)) items.push({ id: a.id, text: 'Your project is confirmed', date, sort })
      else if (a.type === 'document' && !a.by) items.push({ id: a.id, text: a.text.replace('Document added:', 'We shared a document:'), date, sort })
      else if (a.type === 'follow-up') {
        const m = FOLLOW_UP_FOR_CLIENT.exec(a.text)
        if (m) items.push({ id: a.id, text: `${m[1]} planned for ${m[2]}`, date, sort })
      }
    })
  followUps
    .filter((f) => f.leadId === lead.id && ['Site Visit', 'Meeting', 'Presentation'].includes(f.type) && f.date >= todayISO)
    .forEach((f) => items.push({ id: f.id, text: `Upcoming ${f.type.toLowerCase()} on ${formatDayMonth(f.date)}`, date: f.date, sort: `9${f.date}`, upcoming: true }))
  projects.forEach((p) => {
    let step = 0
    const stepSort = (date) => `${date}T${date === todayISO ? '23:59' : '12:00'}:${String(step++).padStart(2, '0')}`
    p.milestones.filter((m) => m.done).forEach((m) => items.push({ id: `${p.id}-${m.key}`, text: `${p.name}: ${m.label.toLowerCase()} done`, date: m.date, sort: stepSort(m.date) }))
    p.approvals.filter((s) => s.done).forEach((s) => items.push({ id: `${p.id}-a-${s.key}`, text: `${p.name}: ${s.label}`, date: s.date, sort: stepSort(s.date) }))
    p.letters.filter((l) => !l.stepKey).forEach((l) => items.push({ id: l.id, text: `New letter from ${l.authority}: ${l.title}`, date: l.date, sort: stepSort(l.date) }))
  })
  const seen = new Set()
  return items
    .filter((i) => i.date && !seen.has(i.text + i.date) && seen.add(i.text + i.date))
    .sort((a, b) => (b.sort ?? b.date).localeCompare(a.sort ?? a.date))
}

/* WhatsApp message that gives a client their portal login. */
export function portalInvite(lead, settings) {
  const url = `${window.location.origin}/login`
  return `Dear ${lead.contactPerson}, you can now follow your work with ${settings.companyName} online: quotations, approvals, project progress and government letters.\n\nPortal: ${url}\nEnquiry ID: ${lead.id}\nLogin with your registered mobile number.\n\n— ${lead.assignedTo}, ${settings.companyName}`
}
