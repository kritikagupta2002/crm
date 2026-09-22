import { baseProjects } from '../data/projects'
import { TODAY } from '../data/mockData'
import { formatDayMonth, toISODate } from './date'

const todayISO = toISODate(TODAY)
const sharedBeforeISO = toISODate(new Date(TODAY.getTime() - 10 * 86_400_000))

/*
 * A step is done when its planned date has passed, unless the team has marked it otherwise:
 * an edit is the ISO date it was done on, or false for "not done yet".
 */
function resolve(step, edit) {
  if (edit === false) return { ...step, done: false }
  if (typeof edit === 'string') return { ...step, done: true, date: edit }
  return { ...step, done: Boolean(step.date && step.date <= todayISO) }
}

/*
 * The ERM stages (vendor sheet C1: Admin → Project Coordinator → Team Lead → Field Member →
 * Govt Submission → Final Approval), ending with the project's closure. A stage is done when its
 * hand-over has happened.
 */
export const ERM_STAGES = [
  { key: 'allocation', label: 'Allocation', owner: 'Admin', todo: 'Assign a project coordinator', waiting: 'Waiting for a coordinator' },
  { key: 'planning', label: 'Planning', owner: 'Project Coordinator', todo: 'Choose the team lead and field team', waiting: 'Waiting for a team' },
  { key: 'tasks', label: 'Task assignment', owner: 'Team Lead', todo: 'Give every task an owner', waiting: 'Tasks waiting for owners' },
  { key: 'work', label: 'Field & report work', owner: 'Field team', todo: 'Finish the field work and the report', waiting: 'Survey or report under way' },
  { key: 'submission', label: 'Govt submission', owner: 'Project Coordinator', todo: 'Submit to the authority', waiting: 'Report ready, to be filed' },
  { key: 'approval', label: 'Final approval', owner: 'Authority', todo: 'Follow up for the approval', waiting: 'Filed, waiting for approval' },
  { key: 'closure', label: 'Project closure', owner: 'Project Coordinator', todo: 'Hand over and close the project', waiting: 'Approved, to be handed over' },
]

/* Which roles can do each stage's hand-over; everyone else with ERM access follows it read-only. */
const STAGE_ACTORS = {
  allocation: ['Admin'],
  planning: ['Admin', 'Project Coordinator'],
  tasks: ['Admin', 'Project Coordinator', 'Team Lead'],
  work: ['Admin', 'Project Coordinator', 'Team Lead', 'Field Member'],
  submission: ['Admin', 'Project Coordinator'],
  approval: ['Admin', 'Project Coordinator'],
  closure: ['Admin', 'Project Coordinator'],
}

export const canActOn = (role, stageKey) => Boolean(STAGE_ACTORS[stageKey]?.includes(role))

/* What has to happen before a project is closed. */
export const CLOSURE_STEPS = [
  { key: 'handover', label: 'Final report and approval handed over to the client' },
  { key: 'payment', label: 'Final payment received' },
  { key: 'archive', label: 'Field data and documents archived' },
  { key: 'feedback', label: 'Client feedback taken' },
]

/* Kinds of file kept against a project. */
export const DOC_CATEGORIES = ['Report', 'Field data', 'Maps & drawings', 'Submission', 'Other']

/* Who does each of the standard tasks, by role in the project team. */
const TASK_OWNER = { kickoff: 'teamLead', field: 'member', analysis: 'teamLead', report: 'teamLead', submission: 'coordinator' }

export const TASK_STATUS = { todo: 'To do', 'in-progress': 'In progress', done: 'Done' }

function buildTasks(base, edits, team, milestones, started) {
  const current = milestones.find((m) => !m.done)
  // Some running projects have slipped on their current task, so the demo has overdue work to show.
  const slipped = Number(base.id.split('-').pop()) % 2 === 0
  const standard = milestones.map((m) => {
    const saved = edits.tasks?.[m.key] ?? {}
    const owner = TASK_OWNER[m.key]
    const assignee = saved.assignee !== undefined ? saved.assignee : owner === 'member' ? team.members[0] ?? null : team[owner] ?? null
    const isCurrent = started && current?.key === m.key
    const status = m.done ? 'done' : saved.status ?? (isCurrent ? 'in-progress' : 'todo')
    const due = saved.due ?? (isCurrent && slipped && m.date > todayISO ? toISODate(new Date(TODAY.getTime() - 2 * 86_400_000)) : m.date)
    return { key: m.key, title: m.label, assignee, due, status, doneOn: m.done ? m.date : null, standard: true }
  })
  // Seeded field tasks, then the team's own; a seeded task the team has changed is stored with its edits.
  const own = edits.customTasks ?? []
  const extra = [...(base.seedTasks ?? []).filter((t) => !own.some((o) => o.id === t.id)), ...own].map((t) => ({ ...t, standard: false }))
  return [...standard, ...extra].map((t) => ({ ...t, overdue: t.status !== 'done' && Boolean(t.due) && t.due < todayISO }))
}

export const PROJECT_STATUS_TONE = { 'Not started': 'tone-neutral', 'In progress': 'tone-info', 'Awaiting approval': 'tone-attention', Approved: 'tone-good', Completed: 'tone-good' }

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
    ]
      // Older letters were already passed on to the client; the last ten days' still wait for a WhatsApp.
      .map((l) => ({ ...l, sharedOn: edits.sharedLetters?.[l.id] ?? (l.stepKey && l.date < sharedBeforeISO ? l.date : null) }))
      .sort((a, b) => b.date.localeCompare(a.date))
    const milestonesDone = milestones.filter((m) => m.done).length
    const approvalsDone = approvals.filter((s) => s.done).length
    // A project whose start date is still ahead (just won) hasn't started, even though it has a plan.
    // Started once its date has come, or earlier if the team has already ticked work off.
    const firstDone = milestones.find((m) => m.done)?.date
    const startedOn = firstDone && (!base.startedOn || firstDone < base.startedOn) ? firstDone : base.startedOn
    const started = Boolean(startedOn && startedOn <= todayISO)
    const approved = approvalsDone === approvals.length

    // Closure: the demo's finished projects carry their own closure record until the team changes it.
    const seed = approved && edits.closure === undefined ? base.closureSeed : null
    const closureSteps = seed ? seed.steps : (edits.closure?.steps ?? {})
    const closedOn = seed ? seed.closedOn : approved ? (edits.closure?.closedOn ?? null) : null
    const closure = { steps: CLOSURE_STEPS.map((c) => ({ ...c, done: Boolean(closureSteps[c.key]), date: closureSteps[c.key] || null })), closedOn, note: edits.closure?.note ?? null }

    const status = !started && milestonesDone === 0 ? 'Not started' : approved ? (closedOn ? 'Completed' : 'Approved') : submitted ? 'Awaiting approval' : 'In progress'
    const submissionDate = milestones[milestones.length - 1].date
    const submission = submitted ? { ...base.submissionInfo, ...edits.submission, date: submissionDate } : null
    const fieldVisits = [...base.fieldVisits, ...(edits.fieldVisits ?? [])].sort((a, b) => b.date.localeCompare(a.date))
    const reportDone = milestones.find((m) => m.key === 'report')
    const documents = [...(reportDone?.done && base.reportFile ? [{ ...base.reportFile, addedOn: reportDone.date }] : []), ...(edits.documents ?? [])]
    const workOrders = [...base.workOrders, ...(edits.workOrders ?? [])].map((w) => ({ ...w, status: edits.woStatus?.[w.id]?.status ?? w.status }))

    const team = { ...base.team, ...edits.team }
    const tasks = buildTasks(base, edits, team, milestones, started)
    const standard = tasks.filter((t) => t.standard)
    const done = [
      Boolean(team.coordinator),
      Boolean(team.teamLead && team.members?.length),
      standard.every((t) => t.assignee),
      standard.find((t) => t.key === 'report')?.status === 'done',
      submitted,
      approved,
      Boolean(closedOn),
    ]
    // Stages run in order: the current one is the first not yet handed over.
    const stageIndex = done.findIndex((d) => !d) === -1 ? ERM_STAGES.length : done.findIndex((d) => !d)
    const stages = ERM_STAGES.map((st, i) => ({ ...st, done: i < stageIndex }))
    // What happened on the project before anyone changed it in the ERM (the demo's seeded record).
    // Changes made in the ERM are logged as activities, so nothing appears twice.
    const history = [
      // A project created in the ERM is already in the activity log.
      base.createdOn && !base.extra && { kind: 'created', date: base.createdOn, text: `Project created — work confirmed by ${lead.company}` },
      started && !edits.team && team.coordinator && { kind: 'team', date: startedOn, text: `Team allocated: ${team.coordinator} (coordinator), ${team.teamLead} (team lead), ${team.members.join(', ')}` },
      // The submission and the authority's first step are one event; the submission line covers both.
      ...milestones.filter((m) => m.done && m.key !== 'submission' && edits.milestones?.[m.key] === undefined).map((m) => ({ kind: 'milestone', date: m.date, text: `${m.label} done` })),
      ...base.fieldVisits.map((v) => ({ kind: 'visit', date: v.date, text: `Field visit: ${v.activity} by ${v.by}${v.files.length ? ` (${v.files.length} files)` : ''}` })),
      ...base.workOrders.map((w) => ({ kind: 'subcontract', date: w.issuedOn, text: `Subcontract ${w.id} issued to ${w.vendor} — ${w.work}` })),
      submission && !edits.submission && { kind: 'submission', date: submission.date, text: `Submitted to ${base.authority} via ${submission.mode} · Ack. ${submission.ackNo}` },
      ...approvals.slice(1).filter((a) => a.done && edits.approvals?.[a.key] === undefined).map((a) => ({ kind: a.key === approvals[approvals.length - 1].key ? 'granted' : 'approval', date: a.date, text: `${a.label}` })),
      ...letters.filter((l) => l.stepKey).map((l) => ({ kind: 'letter', date: l.date, text: `Letter received: ${l.title} (${l.ref})` })),
      ...(seed ? CLOSURE_STEPS.filter((c) => seed.steps[c.key]).map((c) => ({ kind: 'closure', date: seed.steps[c.key], text: c.label })) : []),
      seed?.closedOn && { kind: 'closed', date: seed.closedOn, text: 'Project closed' },
    ]
      .filter(Boolean)
      .filter((h) => h.date && h.date <= todayISO)
      .map((h, i) => ({ ...h, id: `${base.id}-h${i}` }))

    return { ...base, history, startedOn, milestones, approvals, letters, milestonesDone, approvalsDone, status, started, team, tasks, stages, stageIndex, closure, submission, fieldVisits, documents, workOrders }
  })
}

/* Where a project stands right now: the first open milestone, else the approval step with the authority. */
function currentStep(p) {
  if (p.status === 'Completed') return { label: 'Project closed', date: p.closure.closedOn }
  if (p.status === 'Approved') return { label: 'Closure pending', date: null }
  if (!p.startedOn && p.milestonesDone === 0) return { label: 'Waiting for onboarding', date: null }
  if (!p.started && p.milestonesDone === 0) return { label: 'Kick-off', date: p.startedOn }
  const m = p.milestones.find((s) => !s.done)
  if (m) return { label: m.label, date: m.date }
  const a = p.approvals.find((s) => !s.done)
  return { label: a.label, date: a.date }
}

const STATUS_ORDER = ['Awaiting approval', 'In progress', 'Approved', 'Not started', 'Completed']

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
    if (p.closure.closedOn) items.push({ id: `${p.id}-closed`, text: `${p.name}: project completed and handed over`, date: p.closure.closedOn, sort: stepSort(p.closure.closedOn) })
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
