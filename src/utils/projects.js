import { baseProjects } from '../data/projects'
import { TODAY } from '../data/mockData'
import { seededInteractions } from './clientHistory'
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
    return { key: m.key, title: m.label, assignee, assignedOn: saved.assignedOn ?? null, due, status, doneOn: m.done ? m.date : null, standard: true }
  })
  // Seeded field tasks, then the team's own; a seeded task the team has changed is stored with its edits.
  const own = edits.customTasks ?? []
  const extra = [...(base.seedTasks ?? []).filter((t) => !own.some((o) => o.id === t.id)), ...own].map((t) => ({ ...t, standard: false }))
  return [...standard, ...extra].map((t) => ({ ...t, overdue: t.status !== 'done' && Boolean(t.due) && t.due < todayISO }))
}

/*
 * A subcontract with what has been recorded on it: started, delivered, billed, bill checked, paid.
 * The status follows from the last step recorded, so it can only move forward in order.
 * oldStatus: a status picked by hand in an earlier version of the demo, used until a step is recorded.
 */
export function resolveWorkOrder(order, edit = {}, oldStatus) {
  const w = { ...order, ...edit }
  const derived = w.payment ? 'Paid' : w.bill ? 'Bill received' : w.delivery ? 'Completed' : w.startedOn ? 'In progress' : 'Issued'
  const status = Object.keys(edit).length || !oldStatus ? derived : oldStatus
  // The check compares the three records: order value, delivered work and the bill (3-way match).
  const billDiff = w.bill ? w.bill.amount - w.amount : 0
  const match = w.bill ? { order: true, delivery: Boolean(w.delivery), amount: billDiff === 0, diff: billDiff } : null
  const late = w.delivery ? w.delivery.on > w.dueOn : status !== 'Paid' && w.dueOn < todayISO && !w.delivery
  return { ...w, status, match, late, delayDays: w.delivery ? Math.round((new Date(w.delivery.on) - new Date(w.dueOn)) / 86_400_000) : null }
}

/* What comes next on a subcontract, and which side does it. */
export function nextWorkStep(w) {
  if (w.status === 'Issued') return { key: 'start', label: 'Mark started', who: 'work' }
  if (w.status === 'In progress') return { key: 'deliver', label: 'Record delivery', who: 'work' }
  if (w.status === 'Completed') return { key: 'bill', label: 'Record bill', who: 'record' }
  if (w.status === 'Bill received' && !w.check?.ok) return { key: 'check', label: 'Check bill', who: 'check' }
  if (w.status === 'Bill received') return { key: 'pay', label: 'Release payment', who: 'pay' }
  return null
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
    // A scanned letter recorded against an approval step becomes that step's letter (one letter, with the real scan).
    const recorded = edits.letters ?? []
    const stepLetters = approvals
      .filter((s) => s.done && s.letter)
      .map((s, i) => {
        const letter = { id: `${base.id}-${s.key}`, title: s.letter, authority: base.authority, ref: `${base.refBase}/${i + 1}`, date: s.date, stepKey: s.key, stepLabel: s.label }
        const scan = recorded.find((r) => r.forStep === s.key)
        return scan ? { ...letter, title: scan.title || letter.title, ref: scan.ref || letter.ref, date: scan.date, fileId: scan.fileId, recordedAs: scan.id } : letter
      })
    const merged = new Set(stepLetters.map((l) => l.recordedAs).filter(Boolean))
    const letters = [
      ...stepLetters,
      ...recorded.filter((r) => !merged.has(r.id)).map((r) => ({ ...r, stepLabel: r.forStep ? base.approvals.find((s) => s.key === r.forStep)?.label : undefined })),
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
    // Which files the client can download from the portal. The final report goes to the client once it is
    // filed with the authority (the balance falls due then) or at the hand-over; everything else stays with
    // the team until someone shares it.
    const handedOver = submitted || closure.steps.find((c) => c.key === 'handover')?.done
    const share = (file, byDefault = false) => ({ ...file, shared: edits.sharedFiles?.[file.id] ?? Boolean(byDefault) })
    const baseSubmission = submitted ? { ...base.submissionInfo, ...edits.submission, date: submissionDate } : null
    const submission = baseSubmission && { ...baseSubmission, files: (baseSubmission.files ?? []).map((f) => share(f)) }
    const fieldVisits = [...base.fieldVisits, ...(edits.fieldVisits ?? [])].map((v) => ({ ...v, files: v.files.map((f) => share(f)) })).sort((a, b) => b.date.localeCompare(a.date))
    const reportDone = milestones.find((m) => m.key === 'report')
    const documents = [...(reportDone?.done && base.reportFile ? [share({ ...base.reportFile, addedOn: reportDone.date }, handedOver)] : []), ...(edits.documents ?? []).map((d) => share(d))]
    // Everything the client can download, with where it came from.
    const clientFiles = [
      ...documents.filter((d) => d.shared).map((d) => ({ ...d, from: d.category })),
      ...(submission?.files ?? []).filter((f) => f.shared).map((f) => ({ ...f, addedOn: f.addedOn ?? submission.date, from: 'Filed with the authority' })),
      ...fieldVisits.flatMap((v) => v.files.filter((f) => f.shared).map((f) => ({ ...f, addedOn: f.addedOn ?? v.date, from: `Site visit · ${v.activity}` }))),
    ]
    const workOrders = [...base.workOrders, ...(edits.workOrders ?? [])].map((w) => resolveWorkOrder(w, edits.woEdits?.[w.id], edits.woStatus?.[w.id]?.status))

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

    return { ...base, history, startedOn, milestones, approvals, letters, milestonesDone, approvalsDone, status, started, team, tasks, stages, stageIndex, closure, submission, fieldVisits, documents, workOrders, clientFiles }
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
const CLIENT_MILESTONES = { accepted: 'You accepted the quotation', advance: 'We received your advance payment', won: 'Your project is confirmed' }

export function clientUpdates({ lead, quote, projects, activities, followUps }) {
  const items = [{ id: 'received', text: 'We received your enquiry', date: lead.createdOn, sort: `${lead.createdOn}T00:00:00` }]
  if (quote) {
    const sentOn = lead.firstSentOn ?? quote.sentOn
    items.push({ id: 'quote', text: `Quotation ${quote.number.replace(/-R\d+$/, '')} shared with you`, date: sentOn, sort: `${sentOn}T00:00:01` })
  }
  // The demo's older deals were accepted, paid and confirmed before the app was opened: the same dates the team's timeline shows.
  seededInteractions(lead)
    .filter((i) => CLIENT_MILESTONES[i.key])
    .forEach((i, n) => items.push({ id: i.id, text: CLIENT_MILESTONES[i.key], date: i.date, sort: `${i.date}T00:00:0${n + 2}` }))
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
    // Filing is also the approval's first step; on the same day it is one update, not two.
    const filed = p.approvals[0]
    const filedWithSubmission = (m) => m.key === 'submission' && filed?.done && filed.date === m.date
    p.milestones.filter((m) => m.done && !filedWithSubmission(m)).forEach((m) => items.push({ id: `${p.id}-${m.key}`, text: `${p.name}: ${m.label.toLowerCase()} done`, date: m.date, sort: stepSort(m.date) }))
    p.approvals
      .filter((s) => s.done)
      .forEach((s) => {
        // The step's official letter comes with it, ready to download.
        const letter = p.letters.find((l) => l.stepKey === s.key || l.forStep === s.key)
        items.push({ id: `${p.id}-a-${s.key}`, text: `${p.name}: ${s.label}${letter ? ` — ${letter.title} is ready to download` : ''}`, date: s.date, sort: stepSort(s.date), letter: Boolean(letter) })
      })
    p.letters.filter((l) => !l.stepKey && !(l.forStep && p.approvals.some((s) => s.key === l.forStep && s.done))).forEach((l) => items.push({ id: l.id, text: `New letter from ${l.authority}: ${l.title}`, date: l.date, sort: stepSort(l.date), letter: true }))
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
