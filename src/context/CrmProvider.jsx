import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { FOLLOW_UPS, LEADS, STAGES, TODAY } from '../data/mockData'
import { FIELD_MEMBERS } from '../data/staff'
import { VENDORS } from '../data/vendors'
import { formatDayMonth, formatTime, toISODate } from '../utils/date'
import { queriesOf } from '../data/queries'
import { rememberFile } from '../utils/files'
import { clientProjects } from '../utils/projects'
import { pinnedQuote } from '../utils/workflow'
import { CrmContext, DEFAULT_SETTINGS, ROLE_ACCESS, ROLE_USERS } from './crm'

/*
 * Holds the demo's data in React state. Generated mock data is the base; everything done
 * through the UI (enquiries, stage changes, notes, follow-ups, quotations, settings) is kept
 * separately in localStorage so it survives a refresh and can be reset in one go.
 * Later, this provider is the one place to swap for real API calls.
 */
const STORAGE_KEY = 'bansal-crm-demo:v2'
const ROLE_KEY = 'bansal-crm:role'
// Which of the field team is signed in when the role is Field Member (each sees only their own work).
const FIELD_KEY = 'bansal-crm:field-member'
// The team, a client and a vendor each have their own sign-in, so one browser can show the CRM and a portal side by side.
const SESSION_KEY = 'bansal-crm:session'
const CLIENT_KEY = 'bansal-crm:client-session'
const VENDOR_KEY = 'bansal-crm:vendor-session'
const OLD_STORAGE_KEY = 'bansal-crm-demo:added:v1'
const EMPTY = { leads: [], followUps: [], followUpEdits: {}, edits: {}, activities: [], settings: {}, projects: {}, vendors: [] }

/* Keeps uploaded files for this session and returns their details for the record. */
const fileRecords = (files, extra = {}) =>
  files.map((file) => {
    const record = { id: `PF-${Date.now()}-${Math.round(Math.random() * 1e6)}`, name: file.name, size: file.size, type: file.type || 'application/octet-stream', addedOn: toISODate(new Date()), ...extra }
    rememberFile(record.id, file)
    return record
  })

/* A project's closure as it stands (seeded steps included), so a first edit keeps what was already ticked. */
const closureOf = (project) => ({ steps: Object.fromEntries(project.closure.steps.map((c) => [c.key, c.date ?? false])) })

function loadChanges() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed.leads) && Array.isArray(parsed.activities)) return { ...EMPTY, ...parsed }
    }
    // Carry over enquiries saved by the first version of the demo.
    const old = localStorage.getItem(OLD_STORAGE_KEY)
    if (old) {
      const parsed = JSON.parse(old)
      if (Array.isArray(parsed.leads)) return { ...EMPTY, leads: parsed.leads, followUps: parsed.followUps ?? [] }
    }
  } catch {
    // Storage unavailable or corrupted: start from the generated data only.
  }
  return EMPTY
}

function nextLeadId(leads) {
  const year = TODAY.getFullYear()
  const highest = leads.reduce((max, lead) => Math.max(max, Number(lead.id.split('-').pop()) || 0), 0)
  return `BG-${year}-${String(highest + 1).padStart(3, '0')}`
}

const FOLLOW_UP_TITLES = {
  Call: 'Call with',
  Meeting: 'Meeting with',
  'Site Visit': 'Site visit for',
  Presentation: 'Client presentation for',
  Review: 'Review proposal with',
}

const CLOSED_STAGES = ['Won', 'Lost']
const stageIndex = (stage) => STAGES.indexOf(stage)

/* extra: { by: 'client', clientText } for things done in the client portal — they notify the team. */
const newActivity = (leadId, type, text, extra) => ({
  id: `AC-${Date.now()}-${Math.round(Math.random() * 1e6)}`,
  leadId,
  type,
  text,
  at: new Date().toISOString(),
  ...extra,
})

const editLead = (prev, id, patch) => ({ ...prev.edits, [id]: { ...prev.edits[id], ...patch } })
const log = (prev, id, type, text, extra) => [...prev.activities, newActivity(id, type, text, extra)]

function loadFieldMember() {
  try {
    const saved = localStorage.getItem(FIELD_KEY)
    return FIELD_MEMBERS.some((m) => m.name === saved) ? saved : ROLE_USERS['Field Member'].name
  } catch {
    return ROLE_USERS['Field Member'].name
  }
}

function loadRole() {
  try {
    const saved = localStorage.getItem(ROLE_KEY) === 'Coordinator' ? 'Project Coordinator' : localStorage.getItem(ROLE_KEY)
    return ROLE_ACCESS[saved] ? saved : 'Admin'
  } catch {
    return 'Admin'
  }
}

/*
 * Demo sign-in, one per side: the team ({ type: 'team' }), a client ({ leadId }) and a vendor ({ vendorId }).
 * No password check — that comes with a backend.
 */
function loadJSON(key) {
  try {
    return JSON.parse(localStorage.getItem(key))
  } catch {
    return null
  }
}
function store(key, value) {
  try {
    if (value) localStorage.setItem(key, JSON.stringify(value))
    else localStorage.removeItem(key)
  } catch {
    // Without storage the demo simply asks to sign in again after a refresh.
  }
}

const loadTeam = () => loadJSON(SESSION_KEY)?.type === 'team'
const loadVendor = () => loadJSON(VENDOR_KEY)?.vendorId ?? null
function loadClient() {
  const saved = loadJSON(CLIENT_KEY)?.leadId
  if (saved) return saved
  // An older demo kept the client's sign-in in the team key: move it to its own.
  const old = loadJSON(SESSION_KEY)
  if (old?.type !== 'client' || !old.leadId) return null
  store(CLIENT_KEY, { leadId: old.leadId })
  store(SESSION_KEY, null)
  return old.leadId
}

/* Stamps each new activity with who did it: the client or vendor on their portal, else the signed-in team member. */
function withActors(prev, next, actor) {
  if (next.activities === prev.activities || next.activities.length <= prev.activities.length) return next
  const known = new Set(prev.activities.map((a) => a.id))
  return {
    ...next,
    activities: next.activities.map((a) => {
      if (known.has(a.id) || a.actor) return a
      if (a.by === 'client') return { ...a, actor: { role: 'Client' } }
      if (a.by === 'vendor') return { ...a, actor: { role: 'Vendor', name: a.vendor } }
      return { ...a, actor }
    }),
  }
}

export function CrmProvider({ children }) {
  const [changes, setRawChanges] = useState(loadChanges)
  const [role, setRoleState] = useState(loadRole)
  const [fieldMember, setFieldMemberState] = useState(loadFieldMember)
  // The person signed in: one per role, except the field team, where it is whichever member signed in.
  const user = useMemo(() => {
    if (role !== 'Field Member') return ROLE_USERS[role] ?? ROLE_USERS.Admin
    const member = FIELD_MEMBERS.find((m) => m.name === fieldMember)
    return { name: fieldMember, title: member?.title ?? ROLE_USERS[role].title }
  }, [role, fieldMember])
  const [teamSignedIn, setTeamSignedIn] = useState(loadTeam)
  const [clientLeadId, setClientLeadId] = useState(loadClient)
  const [vendorId, setVendorId] = useState(loadVendor)

  // Read inside the updaters below, so each change is logged against whoever is signed in at that moment.
  const actorRef = useRef(null)
  useEffect(() => {
    actorRef.current = { role, name: user.name }
  }, [role, user])
  const setChanges = useCallback((update) => setRawChanges((prev) => withActors(prev, typeof update === 'function' ? update(prev) : update, actorRef.current)), [])

  const setFieldMember = useCallback((name) => {
    setFieldMemberState(name)
    try {
      localStorage.setItem(FIELD_KEY, name)
    } catch {
      // Only the remembered person is lost.
    }
  }, [])

  // person: for Field Member, which member of the field team.
  const setRole = useCallback(
    (next, person) => {
      setRoleState(next)
      if (person) setFieldMember(person)
      try {
        localStorage.setItem(ROLE_KEY, next)
      } catch {
        // Remembering the role is only a convenience.
      }
    },
    [setFieldMember],
  )

  const signIn = useCallback(
    (nextRole, person) => {
      setRole(nextRole, person)
      setTeamSignedIn(true)
      store(SESSION_KEY, { type: 'team' })
    },
    [setRole],
  )
  const signOut = useCallback(() => {
    setTeamSignedIn(false)
    store(SESSION_KEY, null)
  }, [])
  const signInClient = useCallback((leadId) => {
    setClientLeadId(leadId)
    store(CLIENT_KEY, { leadId })
  }, [])
  const signOutClient = useCallback(() => {
    setClientLeadId(null)
    store(CLIENT_KEY, null)
  }, [])
  const signInVendor = useCallback((id) => {
    setVendorId(id)
    store(VENDOR_KEY, { vendorId: id })
  }, [])
  const signOutVendor = useCallback(() => {
    setVendorId(null)
    store(VENDOR_KEY, null)
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(changes))
      localStorage.removeItem(OLD_STORAGE_KEY)
    } catch {
      // Not critical for a demo; data just won't survive a refresh.
    }
  }, [changes])

  /*
   * Other tabs of the demo (the CRM in one, the client portal in another) write to the same storage.
   * Pick up their changes straight away, so each tab shows the latest data and never saves over it.
   */
  useEffect(() => {
    const onStorage = (e) => {
      if (e.storageArea !== localStorage) return
      if (e.key === STORAGE_KEY || e.key === null) setRawChanges(loadChanges())
      if (e.key === ROLE_KEY || e.key === null) setRoleState(loadRole())
      if (e.key === FIELD_KEY || e.key === null) setFieldMemberState(loadFieldMember())
      if (e.key === SESSION_KEY || e.key === null) setTeamSignedIn(loadTeam())
      if (e.key === CLIENT_KEY || e.key === null) setClientLeadId(loadClient())
      if (e.key === VENDOR_KEY || e.key === null) setVendorId(loadVendor())
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const settings = useMemo(() => ({ ...DEFAULT_SETTINGS, ...changes.settings }), [changes.settings])

  /*
   * Leads and follow-ups are derived together: a follow-up is pending unless it was completed or
   * its lead is closed, and each lead's "next follow-up" is its earliest pending one.
   */
  const { leads, followUps, completedFollowUps } = useMemo(() => {
    const merged = [...LEADS, ...changes.leads].map((lead) => (changes.edits[lead.id] ? { ...lead, ...changes.edits[lead.id] } : lead))
    const closed = new Set(merged.filter((lead) => CLOSED_STAGES.includes(lead.stage)).map((lead) => lead.id))
    const all = [...FOLLOW_UPS, ...changes.followUps].map((f) => (changes.followUpEdits[f.id] ? { ...f, ...changes.followUpEdits[f.id] } : f))
    const pending = all.filter((f) => !f.done && !closed.has(f.leadId))
    const earliest = new Map()
    pending.forEach((f) => {
      if (!earliest.has(f.leadId) || f.date < earliest.get(f.leadId)) earliest.set(f.leadId, f.date)
    })
    return {
      leads: merged.map((lead) => ({ ...lead, nextFollowUp: earliest.get(lead.id) ?? null })),
      followUps: pending,
      completedFollowUps: all.filter((f) => f.done),
    }
  }, [changes.leads, changes.edits, changes.followUps, changes.followUpEdits])

  const findLead = useCallback((id) => leads.find((l) => l.id === id), [leads])

  /* byClient: sent from the public enquiry page. files: documents that came with it (lease papers, maps). */
  const addEnquiry = useCallback(
    ({ followUp, files = [], byClient = false, ...details }) => {
      const createdBy = byClient ? { role: 'Client', name: details.contactPerson } : actorRef.current
      const documents = files.map((file) => {
        const doc = { id: `DOC-${Date.now()}-${Math.round(Math.random() * 1e6)}`, name: file.name, size: file.size, type: file.type, addedOn: toISODate(new Date()), byClient }
        rememberFile(doc.id, file)
        return doc
      })
      const lead = { ...details, ...(documents.length ? { documents } : {}), id: nextLeadId(leads), stage: 'New Enquiry', createdOn: toISODate(TODAY), createdAt: new Date().toISOString(), createdBy }
      const newFollowUps = followUp
        ? [
            {
              id: `FU-${lead.id}`,
              leadId: lead.id,
              type: followUp.type,
              title: `${FOLLOW_UP_TITLES[followUp.type]} ${lead.company}`,
              note: details.description?.trim() || `${details.serviceDetail} enquiry`,
              date: followUp.date,
              time: followUp.time,
            },
          ]
        : []
      setChanges((prev) => ({ ...prev, leads: [...prev.leads, lead], followUps: [...prev.followUps, ...newFollowUps] }))
      return lead
    },
    [leads, setChanges],
  )

  const changeStage = useCallback(
    (id, stage, { lostReason } = {}) => {
      const lead = findLead(id)
      if (!lead || lead.stage === stage) return
      const patch = { stage, lostReason: stage === 'Lost' ? lostReason : undefined, quote: pinnedQuote(lead) }
      if (stage === 'Won') patch.wonOn = toISODate(TODAY)
      if (stage === 'Lost' && lead.quoteValue) patch.quoteStatus = 'Rejected'
      const text = stage === 'Lost' && lostReason ? `Marked as Lost: ${lostReason}` : `Stage changed from ${lead.stage} to ${stage}`
      setChanges((prev) => ({ ...prev, edits: editLead(prev, id, patch), activities: log(prev, id, 'stage', text) }))
    },
    [findLead, setChanges],
  )

  /* kind: Note, Call, WhatsApp, Email or Meeting — how the conversation happened. */
  const addNote = useCallback((id, text, kind = 'Note') => {
    setChanges((prev) => ({ ...prev, activities: log(prev, id, kind === 'Note' ? 'note' : 'contact', kind === 'Note' ? text : `${kind} — ${text}`) }))
  }, [setChanges])

  /* Records that something was shared with the client (e.g. a quotation on WhatsApp). */
  const logActivity = useCallback((id, type, text, extra) => {
    setChanges((prev) => ({ ...prev, activities: log(prev, id, type, text, extra) }))
  }, [setChanges])

  const scheduleFollowUp = useCallback(
    (id, { type, date, time, note }) => {
      const lead = findLead(id)
      if (!lead) return
      const followUp = { id: `FU-${id}-${Date.now()}`, leadId: id, type, title: `${FOLLOW_UP_TITLES[type]} ${lead.company}`, note: note?.trim() || lead.serviceDetail, date, time }
      setChanges((prev) => ({
        ...prev,
        followUps: [...prev.followUps, followUp],
        activities: log(prev, id, 'follow-up', `${type} scheduled for ${formatDayMonth(date)}, ${formatTime(time)}`),
      }))
    },
    [findLead, setChanges],
  )

  const completeFollowUp = useCallback((followUp, outcome) => {
    setChanges((prev) => ({
      ...prev,
      followUpEdits: { ...prev.followUpEdits, [followUp.id]: { ...prev.followUpEdits[followUp.id], done: true, outcome, doneOn: toISODate(TODAY) } },
      activities: log(prev, followUp.leadId, 'follow-up', `${followUp.type} done${outcome ? `: ${outcome}` : ''}`),
    }))
  }, [setChanges])

  const rescheduleFollowUp = useCallback((followUp, date, time) => {
    setChanges((prev) => ({
      ...prev,
      followUpEdits: { ...prev.followUpEdits, [followUp.id]: { ...prev.followUpEdits[followUp.id], date, time } },
      activities: log(prev, followUp.leadId, 'follow-up', `${followUp.type} moved to ${formatDayMonth(date)}, ${formatTime(time)}`),
    }))
  }, [setChanges])

  /* Saves edited fields (details form, project, checklists) and notes it in the activity log. */
  const updateLead = useCallback((id, patch, activityText) => {
    setChanges((prev) => ({
      ...prev,
      edits: editLead(prev, id, patch),
      activities: activityText ? log(prev, id, 'edit', activityText) : prev.activities,
    }))
  }, [setChanges])

  /* Saves a new or revised quotation; sending one moves an early-stage lead to "Proposal Sent". */
  const saveQuotation = useCallback(
    (id, quote) => {
      const lead = findLead(id)
      if (!lead) return
      const revising = Boolean(lead.quote || lead.quoteValue)
      // The first quotation's date stays on record; a revision gets its own date.
      const firstSentOn = lead.firstSentOn ?? (revising ? pinnedQuote(lead)?.sentOn : quote.sentOn)
      const patch = { quote, quoteValue: quote.net, quoteStatus: revising ? 'Revised' : 'Sent', changeRequest: undefined, firstSentOn }
      if (stageIndex(lead.stage) < stageIndex('Proposal Sent') || lead.stage === 'Lost') patch.stage = 'Proposal Sent'
      if (revising && lead.stage === 'Proposal Sent') patch.stage = 'Negotiation'
      const text = `${revising ? `Quotation revised (v${quote.version})` : 'Quotation sent'} — ₹${quote.net.toLocaleString('en-IN')} + GST`
      setChanges((prev) => ({ ...prev, edits: editLead(prev, id, patch), activities: log(prev, id, 'quote', text) }))
    },
    [findLead, setChanges],
  )

  /* Client accepted the quotation: it moves into Client Approval (PO, advance, agreement). */
  const acceptQuotation = useCallback(
    (id, { byClient = false } = {}) => {
      const lead = findLead(id)
      if (!lead) return
      const patch = { quoteStatus: 'Accepted', approval: { ...lead.approval, quoteAccepted: true }, quote: pinnedQuote(lead), changeRequest: undefined }
      if (stageIndex(lead.stage) < stageIndex('Negotiation')) patch.stage = 'Negotiation'
      const text = byClient ? 'Quotation accepted by client (portal)' : 'Quotation accepted by client'
      const extra = byClient ? { by: 'client', clientText: 'You accepted the quotation' } : undefined
      setChanges((prev) => ({ ...prev, edits: editLead(prev, id, patch), activities: log(prev, id, 'quote', text, extra) }))
    },
    [findLead, setChanges],
  )

  /* The client asked for changes from the portal: the quotation now waits on the team until it is revised. */
  const requestQuoteChanges = useCallback(
    (id, message, quoteNumber) => {
      const lead = findLead(id)
      if (!lead) return
      const patch = { quoteStatus: 'Changes requested', changeRequest: { text: message, at: new Date().toISOString() }, quote: pinnedQuote(lead) }
      const extra = { by: 'client', clientText: 'You asked for changes to the quotation' }
      const text = `Client asked for changes on ${quoteNumber} (portal) — ${message}`
      setChanges((prev) => ({ ...prev, edits: editLead(prev, id, patch), activities: log(prev, id, 'quote', text, extra) }))
    },
    [findLead, setChanges],
  )

  /* byClient: uploaded from the client portal, so the log says where it came from. */
  const addDocuments = useCallback(
    (id, files, { byClient = false } = {}) => {
      const lead = findLead(id)
      if (!lead || files.length === 0) return
      const added = files.map((file) => {
        const doc = { id: `DOC-${Date.now()}-${Math.round(Math.random() * 1e6)}`, name: file.name, size: file.size, type: file.type, addedOn: toISODate(new Date()) }
        if (byClient) doc.byClient = true
        rememberFile(doc.id, file)
        return doc
      })
      const what = added.length === 1 ? added[0].name : `${added.length} documents`
      const text = `${added.length === 1 ? `Document added: ${added[0].name}` : `${added.length} documents added`}${byClient ? ' by client (portal)' : ''}`
      const extra = byClient ? { by: 'client', clientText: `You uploaded ${what}` } : undefined
      setChanges((prev) => ({ ...prev, edits: editLead(prev, id, { documents: [...(lead.documents ?? []), ...added] }), activities: log(prev, id, 'document', text, extra) }))
    },
    [findLead, setChanges],
  )

  /* Marks a project milestone or approval step done (today) or not done. kind: 'milestones' | 'approvals'. */
  const setProjectStep = useCallback((leadId, project, kind, key, done, label) => {
    setChanges((prev) => {
      const edits = prev.projects[project.id] ?? {}
      const next = { ...edits, [kind]: { ...edits[kind], [key]: done ? toISODate(TODAY) : false } }
      return { ...prev, projects: { ...prev.projects, [project.id]: next }, activities: log(prev, leadId, 'project', `${project.name}: ${label} ${done ? 'done' : 'reopened'}`) }
    })
  }, [setChanges])

  /* ERM: set the project's coordinator, team lead or field team (patch of { coordinator, teamLead, members }). */
  const setProjectTeam = useCallback((leadId, project, patch) => {
    const text = Object.entries(patch)
      .map(([key, value]) => `${{ coordinator: 'Coordinator', teamLead: 'Team lead', members: 'Field team' }[key]}: ${Array.isArray(value) ? value.join(', ') || 'none' : value || 'none'}`)
      .join(' · ')
    const lead = findLead(leadId)
    setChanges((prev) => {
      const edits = prev.projects[project.id] ?? {}
      const team = { ...project.team, ...edits.team, ...patch }
      // A full team in the ERM also ticks the client's onboarding step "Project team assigned".
      const staffed = team.coordinator && team.teamLead && team.members?.length && lead && !lead.onboarding?.teamAssigned
      return {
        ...prev,
        edits: staffed ? editLead(prev, leadId, { onboarding: { ...lead.onboarding, teamAssigned: true } }) : prev.edits,
        projects: { ...prev.projects, [project.id]: { ...edits, team: { ...edits.team, ...patch } } },
        activities: log(prev, leadId, 'project', `${project.name} (${project.id}) — ${text}`),
      }
    })
  }, [findLead, setChanges])

  /*
   * ERM: change a task's owner, due date or status. A standard task marked done also completes the
   * project milestone of the same name, so the CRM drawer and the client portal follow along.
   */
  const updateProjectTask = useCallback((leadId, project, task, patch) => {
    setChanges((prev) => {
      const edits = prev.projects[project.id] ?? {}
      let next
      if (task.standard) {
        const { status, ...rest } = patch
        const saved = { ...edits.tasks?.[task.key], ...rest }
        const milestones = { ...edits.milestones }
        if (status === 'done') milestones[task.key] = toISODate(TODAY)
        else if (status) {
          milestones[task.key] = false
          saved.status = status
        }
        next = { ...edits, milestones, tasks: { ...edits.tasks, [task.key]: saved } }
      } else {
        // A seeded task becomes one of the team's own the first time it is changed.
        const own = edits.customTasks ?? []
        const base = own.some((t) => t.id === task.id) ? own : [...own, { id: task.id, title: task.title, assignee: task.assignee, due: task.due, status: task.status, doneOn: task.doneOn }]
        const customTasks = base.map((t) =>
          t.id === task.id ? { ...t, ...patch, ...(patch.status === 'done' ? { doneOn: toISODate(TODAY) } : patch.status ? { doneOn: null } : {}) } : t,
        )
        next = { ...edits, customTasks }
      }
      const what = patch.status ? `marked ${patch.status === 'in-progress' ? 'in progress' : patch.status === 'todo' ? 'to do' : 'done'}` : patch.assignee !== undefined ? `assigned to ${patch.assignee || 'nobody'}` : 'due date changed'
      return { ...prev, projects: { ...prev.projects, [project.id]: next }, activities: log(prev, leadId, 'project', `${project.name}: "${task.title}" ${what}`) }
    })
  }, [setChanges])

  const addProjectTask = useCallback((leadId, project, { title, assignee, due }) => {
    const task = { id: `TK-${Date.now()}`, title, assignee: assignee || null, due: due || null, status: 'todo', doneOn: null }
    setChanges((prev) => {
      const edits = prev.projects[project.id] ?? {}
      return {
        ...prev,
        projects: { ...prev.projects, [project.id]: { ...edits, customTasks: [...(edits.customTasks ?? []), task] } },
        activities: log(prev, leadId, 'project', `${project.name}: task added — ${title}${assignee ? ` (${assignee})` : ''}`),
      }
    })
  }, [setChanges])

  /*
   * Records an official letter (scanned or received) against a project; the client sees it in the portal.
   * forStep links it to an approval step (vendor sheet: "link the scanned PDF to the client's task"): the step
   * is marked done on the letter's date if it wasn't already, and the scan becomes that step's letter.
   */
  const addGovtLetter = useCallback((leadId, project, { title, authority, ref, date, file, forStep }) => {
    const letter = { id: `GL-${Date.now()}`, title, authority, ref, date }
    if (forStep) letter.forStep = forStep
    if (file) {
      letter.fileId = `${letter.id}-file`
      rememberFile(letter.fileId, file)
    }
    const step = forStep && project.approvals.find((s) => s.key === forStep)
    setChanges((prev) => {
      const edits = prev.projects[project.id] ?? {}
      // A scan replaces an earlier one recorded for the same step.
      const others = (edits.letters ?? []).filter((l) => !forStep || l.forStep !== forStep)
      const approvals = step && !step.done ? { ...edits.approvals, [forStep]: date } : edits.approvals
      return {
        ...prev,
        projects: { ...prev.projects, [project.id]: { ...edits, approvals, letters: [...others, letter] } },
        activities: log(prev, leadId, 'project', step ? `${project.name}: ${step.label}${step.done ? '' : ' done'} — scanned letter linked: ${title} (${ref})` : `Government letter added to ${project.name}: ${title} (${ref})`),
      }
    })
    return { ...letter, stepKey: step?.letter ? forStep : undefined }
  }, [setChanges])

  /* ERM: changes one project's edits and logs it on the client's activity. */
  const editProject = useCallback((leadId, project, change, text) => {
    setChanges((prev) => {
      const edits = prev.projects[project.id] ?? {}
      return { ...prev, projects: { ...prev.projects, [project.id]: { ...edits, ...change(edits) } }, activities: log(prev, leadId, 'project', text) }
    })
  }, [setChanges])

  /* ERM: a new project for an existing client (repeat work). It starts in Allocation, waiting for a coordinator. */
  const createProject = useCallback(
    (leadId, { id, name, service, site, startedOn, days }) => {
      const lead = findLead(leadId)
      if (!lead) return
      const project = { id, name, service, site, startedOn, days, createdOn: toISODate(TODAY) }
      setChanges((prev) => ({
        ...prev,
        edits: editLead(prev, leadId, { extraProjects: [...(lead.extraProjects ?? []), project] }),
        activities: log(prev, leadId, 'project', `${name} (${id}) — new project created`),
      }))
    },
    [findLead, setChanges],
  )

  /* ERM: a field visit with its photos and readings. */
  const addFieldVisit = useCallback(
    (leadId, project, { date, by, activity, location, notes, files }) => {
      const visit = { id: `FV-${Date.now()}`, date, by, activity, location, notes, files: fileRecords(files) }
      editProject(leadId, project, (e) => ({ fieldVisits: [...(e.fieldVisits ?? []), visit] }), `${project.name}: field visit logged — ${activity} by ${by}${files.length ? ` (${files.length} file${files.length === 1 ? '' : 's'})` : ''}`)
    },
    [editProject],
  )

  /* ERM: the work is filed with the authority; the submission milestone is done on the date it was filed. */
  const submitToAuthority = useCallback(
    (leadId, project, { date, mode, ackNo, files }) => {
      const submission = { mode, ackNo, files: fileRecords(files), by: project.team.coordinator }
      editProject(
        leadId,
        project,
        // Filing is also the first step of the approval ("report submitted", "application filed").
        (e) => ({ submission, milestones: { ...e.milestones, submission: date }, approvals: { ...e.approvals, [project.approvals[0].key]: date } }),
        `${project.name}: submitted to ${project.authority} via ${mode}${ackNo ? ` · Ack. ${ackNo}` : ''}`,
      )
    },
    [editProject],
  )

  /* ERM: tick or untick a closure step; closing the project once they are all done. */
  const setClosureStep = useCallback(
    (leadId, project, key, done, label) => {
      editProject(
        leadId,
        project,
        (e) => {
          const closure = e.closure ?? closureOf(project)
          return { closure: { ...closure, steps: { ...closure.steps, [key]: done ? toISODate(TODAY) : false } } }
        },
        `${project.name}: ${label.charAt(0).toLowerCase()}${label.slice(1)} ${done ? '— done' : '— reopened'}`,
      )
    },
    [editProject],
  )

  const closeProject = useCallback(
    (leadId, project, note) => {
      editProject(
        leadId,
        project,
        (e) => ({ closure: { ...(e.closure ?? closureOf(project)), closedOn: toISODate(TODAY), note: note || null } }),
        `${project.name} (${project.id}) — project closed${note ? `: ${note}` : ''}`,
      )
    },
    [editProject],
  )

  /* ERM: files kept against a project (reports, maps, field data). */
  const addProjectDocuments = useCallback(
    (leadId, project, files, category) => {
      if (files.length === 0) return
      const added = fileRecords(files, { category })
      editProject(leadId, project, (e) => ({ documents: [...(e.documents ?? []), ...added] }), `${project.name}: ${added.length === 1 ? `${category.toLowerCase()} added — ${added[0].name}` : `${added.length} files added (${category.toLowerCase()})`}`)
    },
    [editProject],
  )

  const removeProjectDocument = useCallback(
    (leadId, project, doc) => {
      editProject(leadId, project, (e) => ({ documents: (e.documents ?? []).filter((d) => d.id !== doc.id) }), `${project.name}: file removed — ${doc.name}`)
    },
    [editProject],
  )

  /* ERM: a project file the client can (or can no longer) download from the portal. */
  const setFileShared = useCallback(
    (leadId, project, file, shared) => {
      editProject(leadId, project, (e) => ({ sharedFiles: { ...e.sharedFiles, [file.id]: shared ? toISODate(TODAY) : false } }), `${project.name}: ${file.name} ${shared ? 'shared with the client (portal)' : 'no longer shared with the client'}`)
    },
    [editProject],
  )

  /* Client portal: a question for the team. It stays open until someone answers it. */
  const raiseQuery = useCallback(
    (id, { topic, message }) => {
      const lead = findLead(id)
      if (!lead) return
      const query = { id: `Q-${Date.now()}`, topic, message, at: new Date().toISOString(), status: 'Open' }
      setChanges((prev) => ({
        ...prev,
        edits: editLead(prev, id, { queries: [...queriesOf(lead), query] }),
        activities: log(prev, id, 'query', `Client asked a question (${topic}) — ${message}`, { by: 'client', clientText: 'You asked us a question' }),
      }))
    },
    [findLead, setChanges],
  )

  /* The team's answer to a client's question; the client sees it on the portal. */
  const answerQuery = useCallback(
    (id, queryId, reply) => {
      const lead = findLead(id)
      if (!lead) return
      const queries = queriesOf(lead).map((q) => (q.id === queryId ? { ...q, status: 'Answered', reply, repliedAt: new Date().toISOString(), repliedBy: actorRef.current?.name ?? lead.assignedTo } : q))
      setChanges((prev) => ({ ...prev, edits: editLead(prev, id, { queries }), activities: log(prev, id, 'contact', `Portal — replied to the client's question: ${reply}`) }))
    },
    [findLead, setChanges],
  )

  /* Client portal: the client paid (UPI, bank or cheque) and reports it with the reference and a screenshot. */
  const submitPayment = useCallback(
    (id, { dueKey, title, amount, method, utr, paidOn, file }) => {
      const lead = findLead(id)
      if (!lead) return
      const payment = { id: `PAY-${Date.now()}`, dueKey, title, amount, method, utr, paidOn, submittedAt: new Date().toISOString(), status: 'Submitted' }
      if (file) {
        payment.file = { id: `${payment.id}-proof`, name: file.name, size: file.size, type: file.type, addedOn: paidOn }
        rememberFile(payment.file.id, file)
      }
      const rupees = `₹${Math.round(amount).toLocaleString('en-IN')}`
      setChanges((prev) => ({
        ...prev,
        edits: editLead(prev, id, { payments: [...(lead.payments ?? []), payment] }),
        activities: log(prev, id, 'payment', `Payment of ${rupees} reported for ${title} (${method}${utr ? `, ref. ${utr}` : ''}) — to verify`, { by: 'client', clientText: `You reported a payment of ${rupees}` }),
      }))
    },
    [findLead, setChanges],
  )

  /*
   * Accounts confirms (or rejects) a reported payment. A confirmed advance ticks "Advance payment received"
   * in Client Approval; a confirmed balance ticks "Final payment received" in the project's closure.
   */
  const verifyPayment = useCallback(
    (id, paymentId, ok, note) => {
      const lead = findLead(id)
      const payment = lead?.payments?.find((p) => p.id === paymentId)
      if (!payment) return
      const today = toISODate(TODAY)
      const payments = lead.payments.map((p) => (p.id === paymentId ? { ...p, status: ok ? 'Verified' : 'Rejected', checkedOn: today, checkNote: note || null } : p))
      const leadPatch = { payments }
      if (ok && payment.dueKey === 'advance') leadPatch.approval = { ...lead.approval, advanceReceived: true }
      const rupees = `₹${Math.round(payment.amount).toLocaleString('en-IN')}`
      setChanges((prev) => {
        let projects = prev.projects
        if (ok && payment.dueKey === 'balance') {
          const main = clientProjects(lead, prev.projects)[0]
          if (main) {
            const edits = prev.projects[main.id] ?? {}
            const closure = edits.closure ?? closureOf(main)
            projects = { ...prev.projects, [main.id]: { ...edits, closure: { ...closure, steps: { ...closure.steps, payment: today } } } }
          }
        }
        return {
          ...prev,
          edits: editLead(prev, id, leadPatch),
          projects,
          activities: log(prev, id, 'payment', ok ? `Payment of ${rupees} for ${payment.title} verified — received` : `Payment of ${rupees} for ${payment.title} not found in the account${note ? `: ${note}` : ''}`),
        }
      })
    },
    [findLead, setChanges],
  )

  /* The team asks the client for a payment (government fee, extra work); it shows up as due on the portal. */
  const requestPayment = useCallback(
    (id, { title, amount }) => {
      const lead = findLead(id)
      if (!lead) return
      const request = { id: `REQ-${Date.now()}`, title, amount, on: toISODate(TODAY), by: lead.assignedTo }
      setChanges((prev) => ({
        ...prev,
        edits: editLead(prev, id, { paymentRequests: [...(lead.paymentRequests ?? []), request] }),
        activities: log(prev, id, 'payment', `Payment requested from the client: ${title} — ₹${Math.round(amount).toLocaleString('en-IN')}`),
      }))
    },
    [findLead, setChanges],
  )

  /* ERM: the client was told about a government letter on WhatsApp. */
  const markLetterShared = useCallback(
    (leadId, project, letter) => {
      editProject(leadId, project, (e) => ({ sharedLetters: { ...e.sharedLetters, [letter.id]: toISODate(TODAY) } }), `${project.name}: ${letter.title} (${letter.ref}) shared with the client on WhatsApp`)
    },
    [editProject],
  )

  /* ERM: a subcontract (drilling, lab testing, drone survey) given to an outside firm against a project. */
  const addWorkOrder = useCallback(
    (leadId, project, order) => {
      editProject(leadId, project, (e) => ({ workOrders: [...(e.workOrders ?? []), { ...order, status: 'Issued', issuedOn: toISODate(TODAY) }] }), `${project.name}: subcontract ${order.id} issued to ${order.vendor} — ${order.work}`)
    },
    [editProject],
  )

  /*
   * Subcontract steps, in order: started → delivery recorded → bill recorded → bill checked → payment released.
   * step: 'start' | 'deliver' | 'bill' | 'check' | 'pay'. byVendor: done by the vendor on the vendor portal.
   */
  const recordWorkStep = useCallback(
    (leadId, project, order, step, details = {}, { byVendor = false } = {}) => {
      const today = toISODate(TODAY)
      const who = byVendor ? (VENDORS.find((v) => v.name === order.vendor)?.contact ?? order.vendor) : actorRef.current.name
      let patch
      let text
      if (step === 'start') {
        patch = { startedOn: today }
        text = 'work started'
      } else if (step === 'deliver') {
        patch = { delivery: { on: details.on ?? today, note: details.note || null, files: fileRecords(details.files ?? []), by: who } }
        text = `delivery recorded${details.files?.length ? ` (${details.files.length} file${details.files.length === 1 ? '' : 's'})` : ''}`
      } else if (step === 'bill') {
        const [file] = fileRecords(details.file ? [details.file] : [])
        patch = { bill: { no: details.no, date: details.date ?? today, amount: details.amount, file: file ?? null, by: who }, check: null }
        text = `bill ${details.no} recorded — ₹${Math.round(details.amount).toLocaleString('en-IN')}`
      } else if (step === 'check' && details.ok) {
        patch = { check: { on: today, ok: true, by: who, note: details.note || null } }
        text = 'bill checked against the order and the delivery — ready to pay'
      } else if (step === 'check') {
        // A bill that doesn't match goes back to the vendor; the work stays delivered, waiting for a corrected bill.
        patch = { bill: null, check: null, returned: [...(order.returned ?? []), { ...order.bill, returnedOn: today, reason: details.note || 'Does not match the order', by: who }] }
        text = `bill ${order.bill?.no} returned to the vendor — ${details.note || 'does not match the order'}`
      } else if (step === 'pay') {
        // TDS is on the bill's value before GST.
        const tds = { ...details.tds, amount: Math.round(((order.bill?.amount ?? order.amount) * details.tds.rate) / 100) }
        patch = { payment: { on: today, gross: details.gross, tds, ref: details.ref, by: who } }
        text = `payment released — ₹${Math.round(details.gross - tds.amount).toLocaleString('en-IN')} after TDS ${tds.section} ₹${tds.amount.toLocaleString('en-IN')}`
      }
      if (!patch) return
      const extra = byVendor ? { by: 'vendor', vendor: order.vendor } : undefined
      setChanges((prev) => {
        const edits = prev.projects[project.id] ?? {}
        return {
          ...prev,
          projects: { ...prev.projects, [project.id]: { ...edits, woEdits: { ...edits.woEdits, [order.id]: { ...edits.woEdits?.[order.id], ...patch } } } },
          activities: log(prev, leadId, 'project', `${project.name}: subcontract ${order.id} (${order.vendor}) — ${text}${byVendor ? ' (vendor portal)' : ''}`, extra),
        }
      })
    },
    [setChanges],
  )

  /* A subcontractor registered by the team (vendor master); the seeded ones are in data/vendors.js. */
  const addVendor = useCallback(
    (details) => {
      setChanges((prev) => {
        const all = [...VENDORS, ...(prev.vendors ?? [])]
        const id = `VN-${String(all.length + 1).padStart(2, '0')}`
        return { ...prev, vendors: [...(prev.vendors ?? []), { ...details, id, since: toISODate(TODAY) }], activities: log(prev, null, 'vendor', `Subcontractor registered: ${details.name} (${id}) — ${details.work}`) }
      })
    },
    [setChanges],
  )

  const vendors = useMemo(() => [...VENDORS, ...(changes.vendors ?? [])], [changes.vendors])

  /* The client got their portal login on WhatsApp; for a won client this also ticks the onboarding step. */
  const markPortalShared = useCallback(
    (id) => {
      const lead = findLead(id)
      if (!lead) return
      const patch = lead.stage === 'Won' ? { onboarding: { ...lead.onboarding, portal: true } } : {}
      setChanges((prev) => ({ ...prev, edits: editLead(prev, id, patch), activities: log(prev, id, 'contact', 'Client portal access shared on WhatsApp') }))
    },
    [findLead, setChanges],
  )

  const removeDocument = useCallback(
    (id, documentId) => {
      const lead = findLead(id)
      const doc = lead?.documents?.find((d) => d.id === documentId)
      if (!doc) return
      setChanges((prev) => ({
        ...prev,
        edits: editLead(prev, id, { documents: lead.documents.filter((d) => d.id !== documentId) }),
        activities: log(prev, id, 'document', `Document removed: ${doc.name}`),
      }))
    },
    [findLead, setChanges],
  )

  const setTags = useCallback((id, tags) => setChanges((prev) => ({ ...prev, edits: editLead(prev, id, { tags }) })), [setChanges])

  const updateSettings = useCallback((patch) => setChanges((prev) => ({ ...prev, settings: { ...prev.settings, ...patch } })), [setChanges])

  const resetDemoData = useCallback(() => setChanges(EMPTY), [setChanges])

  const changeCount = changes.leads.length + changes.activities.length + Object.keys(changes.settings).length + Object.keys(changes.projects).length

  return (
    <CrmContext.Provider
      value={{
        leads,
        followUps,
        completedFollowUps,
        activities: changes.activities,
        settings,
        role,
        setRole,
        user,
        fieldMember,
        setFieldMember,
        teamSignedIn,
        clientLeadId,
        vendorId,
        signIn,
        signOut,
        signInClient,
        signOutClient,
        signInVendor,
        signOutVendor,
        vendors,
        addVendor,
        recordWorkStep,
        logActivity,
        addEnquiry,
        changeStage,
        addNote,
        scheduleFollowUp,
        completeFollowUp,
        rescheduleFollowUp,
        updateLead,
        saveQuotation,
        acceptQuotation,
        requestQuoteChanges,
        projectEdits: changes.projects,
        setProjectStep,
        setProjectTeam,
        updateProjectTask,
        addProjectTask,
        addGovtLetter,
        createProject,
        addFieldVisit,
        submitToAuthority,
        setClosureStep,
        closeProject,
        addProjectDocuments,
        removeProjectDocument,
        markLetterShared,
        setFileShared,
        raiseQuery,
        submitPayment,
        verifyPayment,
        requestPayment,
        answerQuery,
        addWorkOrder,
        markPortalShared,
        addDocuments,
        removeDocument,
        setTags,
        updateSettings,
        changeCount, // demo changes kept in this browser
        resetDemoData,
      }}
    >
      {children}
    </CrmContext.Provider>
  )
}
