import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { FOLLOW_UPS, LEADS, STAGES, TODAY } from '../data/mockData'
import { FIELD_MEMBERS } from '../data/staff'
import { VENDORS } from '../data/vendors'
import { formatDayMonth, formatTime, toISODate } from '../utils/date'
import { queriesOf } from '../data/queries'
import { rememberFile } from '../utils/files'
import { allProjects, clientProjects } from '../utils/projects'
import { pinnedQuote, quoteFor } from '../utils/workflow'
import { channelsFor, messageFor } from '../utils/automations'
import { SEEDED_SCANS } from '../data/scans'
import { SEEDED_APPLICATIONS, msmeOf } from '../data/vendorApplications'
import { SEEDED_BIDS, SEEDED_CLARIFICATIONS, SEEDED_SAVED_TENDERS, SEEDED_TENDERS, SEEDED_TENDER_ORDERS } from '../data/tenders'
import { LIVE_BID, closingOf, formatDateTime, seededTenderOrder, tenderPhase } from '../utils/tenders'
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
const VENDOR_LOGINS_KEY = 'bansal-crm:vendor-logins'
const OLD_STORAGE_KEY = 'bansal-crm-demo:added:v1'
const EMPTY = { leads: [], followUps: [], followUpEdits: {}, edits: {}, activities: [], settings: {}, projects: {}, vendors: [], outbox: [], scans: { added: [], filed: {}, discarded: [] }, vendorApps: {}, tenders: {}, bids: {}, clarifications: {}, savedTenders: {} }

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

/*
 * Automations (utils/automations.js): the message an event sends, if Settings has it on, goes into the outbox
 * and the client's history. Called inside the updaters below, so a change and its message are saved together.
 * to: { audience: 'client' | 'field', name, phone, email }.
 */
function sendAuto(prev, key, leadId, to, ctx) {
  if (!to) return prev
  const settings = { ...DEFAULT_SETTINGS, ...prev.settings }
  const channels = channelsFor(settings, key, to)
  if (!channels.length) return prev
  const message = messageFor(key, { ...ctx, to, companyName: settings.companyName })
  const item = { id: `MSG-${Date.now()}-${Math.round(Math.random() * 1e6)}`, at: new Date().toISOString(), key, leadId, to, channels, ...message }
  const via = channels.map((c) => (c === 'whatsapp' ? 'WhatsApp' : 'email')).join(' & ')
  return { ...prev, outbox: [...(prev.outbox ?? []), item], activities: log(prev, leadId, 'message', `Sent automatically on ${via} to ${to.name}: ${message.subject}`) }
}

/* Seeded records with the app's changes laid over them: a record changed or added in the app is kept whole under its id. */
const withSaved = (seeded, saved = {}) => [...seeded.map((x) => saved[x.id] ?? x), ...Object.values(saved).filter((x) => !seeded.some((s) => s.id === x.id))]

// Who a bid's history entries name while bids are sealed (the bid itself keeps the firm).
const SEALED_BIDDER = 'A bidder (sealed)'

const vendorContact = (vendor) => vendor && { audience: 'vendor', name: `${vendor.contact} (${vendor.name})`, phone: vendor.phone, email: vendor.email }

const digitsOfPhone = (v) => String(v ?? '').replace(/\D/g, '').slice(-10)
const clientOf = (lead) => lead && { audience: 'client', name: lead.contactPerson, phone: lead.phone, email: lead.email }
const memberOf = (name) => {
  const member = FIELD_MEMBERS.find((m) => m.name === name)
  return member && { audience: 'field', name: member.name, phone: member.phone }
}

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
    // "Last login" in the vendor portal is the sign-in before this one.
    const logins = loadJSON(VENDOR_LOGINS_KEY) ?? {}
    store(VENDOR_KEY, { vendorId: id, previousLogin: logins[id] ?? null })
    store(VENDOR_LOGINS_KEY, { ...logins, [id]: new Date().toISOString() })
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
      // The client gets the quotation (with its number and total) by email.
      const sentQuote = quoteFor({ ...lead, ...patch })
      setChanges((prev) =>
        sendAuto({ ...prev, edits: editLead(prev, id, patch), activities: log(prev, id, 'quote', text) }, 'quotation', id, clientOf(lead), { lead, quote: sentQuote, revised: revising }),
      )
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
        // The client's own uploads are theirs to see; the team's stay with the team until someone shares them.
        if (byClient) doc.byClient = true
        else doc.shared = false
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

  /* A team document on the enquiry, shown to the client on the portal or kept to the team. */
  const setDocumentShared = useCallback(
    (id, docId, shared) => {
      const lead = findLead(id)
      const doc = lead?.documents?.find((d) => d.id === docId)
      if (!doc) return
      const documents = lead.documents.map((d) => (d.id === docId ? { ...d, shared, sharedOn: shared ? toISODate(TODAY) : null } : d))
      setChanges((prev) => {
        const saved = { ...prev, edits: editLead(prev, id, { documents }), activities: log(prev, id, 'document', `${doc.name} ${shared ? 'shared with the client (portal)' : 'no longer shared with the client'}`) }
        return shared ? sendAuto(saved, 'document', id, clientOf(lead), { lead, file: doc }) : saved
      })
    },
    [findLead, setChanges],
  )

  /* Marks a project milestone or approval step done (today) or not done. kind: 'milestones' | 'approvals'. */
  const setProjectStep = useCallback((leadId, project, kind, key, done, label) => {
    const lead = findLead(leadId)
    const step = kind === 'approvals' && done ? project.approvals.find((s) => s.key === key) : null
    setChanges((prev) => {
      const edits = prev.projects[project.id] ?? {}
      const next = { ...edits, [kind]: { ...edits[kind], [key]: done ? toISODate(TODAY) : false } }
      const saved = { ...prev, projects: { ...prev.projects, [project.id]: next }, activities: log(prev, leadId, 'project', `${project.name}: ${label} ${done ? 'done' : 'reopened'}`) }
      // An approval step done is news for the client.
      return step ? sendAuto(saved, 'approval', leadId, clientOf(lead), { lead, project, step }) : saved
    })
  }, [findLead, setChanges])

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
    // A new owner gets the task from today (their notifications show it as new).
    const change = patch.assignee !== undefined && patch.assignee !== task.assignee ? { ...patch, assignedOn: patch.assignee ? toISODate(TODAY) : null } : patch
    setChanges((prev) => {
      const edits = prev.projects[project.id] ?? {}
      let next
      if (task.standard) {
        const { status, ...rest } = change
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
          t.id === task.id ? { ...t, ...change, ...(patch.status === 'done' ? { doneOn: toISODate(TODAY) } : patch.status ? { doneOn: null } : {}) } : t,
        )
        next = { ...edits, customTasks }
      }
      const what = patch.status ? `marked ${patch.status === 'in-progress' ? 'in progress' : patch.status === 'todo' ? 'to do' : 'done'}` : patch.assignee !== undefined ? `assigned to ${patch.assignee || 'nobody'}` : 'due date changed'
      const saved = { ...prev, projects: { ...prev.projects, [project.id]: next }, activities: log(prev, leadId, 'project', `${project.name}: "${task.title}" ${what}`) }
      // A task handed to someone in the field team reaches them on WhatsApp.
      const handedTo = patch.assignee && patch.assignee !== task.assignee ? memberOf(patch.assignee) : null
      return handedTo ? sendAuto(saved, 'task', leadId, handedTo, { lead: project.lead ?? findLead(leadId), project, task: { ...task, ...patch } }) : saved
    })
  }, [findLead, setChanges])

  const addProjectTask = useCallback((leadId, project, { title, assignee, due }) => {
    const task = { id: `TK-${Date.now()}`, title, assignee: assignee || null, assignedOn: assignee ? toISODate(TODAY) : null, due: due || null, status: 'todo', doneOn: null }
    setChanges((prev) => {
      const edits = prev.projects[project.id] ?? {}
      const saved = {
        ...prev,
        projects: { ...prev.projects, [project.id]: { ...edits, customTasks: [...(edits.customTasks ?? []), task] } },
        activities: log(prev, leadId, 'project', `${project.name}: task added — ${title}${assignee ? ` (${assignee})` : ''}`),
      }
      return sendAuto(saved, 'task', leadId, memberOf(assignee), { lead: project.lead ?? findLead(leadId), project, task })
    })
  }, [findLead, setChanges])

  /*
   * Records an official letter (scanned or received) against a project; the client sees it in the portal.
   * forStep links it to an approval step (vendor sheet: "link the scanned PDF to the client's task"): the step
   * is marked done on the letter's date if it wasn't already, and the scan becomes that step's letter.
   */
  // scan: a scan from the NAS inbox (flowchart 3, step 2); it becomes the letter's copy and leaves the inbox.
  const addGovtLetter = useCallback((leadId, project, { title, authority, ref, date, file, forStep, scan }) => {
    const letter = { id: `GL-${Date.now()}`, title, authority, ref, date }
    if (forStep) letter.forStep = forStep
    if (file) {
      letter.fileId = `${letter.id}-file`
      rememberFile(letter.fileId, file)
    } else if (scan) {
      // An uploaded scan's file is kept under the scan's id; a seeded one downloads as a generated copy.
      letter.fileId = scan.id
    }
    const step = forStep && project.approvals.find((s) => s.key === forStep)
    const lead = findLead(leadId)
    // A letter for an approval step is shown to the client as that step's letter.
    const shownAs = step?.letter ? `${project.id}-${forStep}` : letter.id
    setChanges((prev) => {
      const edits = prev.projects[project.id] ?? {}
      // A scan replaces an earlier one recorded for the same step.
      const others = (edits.letters ?? []).filter((l) => !forStep || l.forStep !== forStep)
      const approvals = step && !step.done ? { ...edits.approvals, [forStep]: date } : edits.approvals
      let next = {
        ...prev,
        projects: { ...prev.projects, [project.id]: { ...edits, approvals, letters: [...others, letter] } },
        activities: log(prev, leadId, 'project', step ? `${project.name}: ${step.label}${step.done ? '' : ' done'} — scanned letter linked: ${title} (${ref})` : `Government letter added to ${project.name}: ${title} (${ref})`),
      }
      if (scan) {
        const scans = { ...EMPTY.scans, ...prev.scans }
        next = { ...next, scans: { ...scans, filed: { ...scans.filed, [scan.id]: { projectId: project.id, letterId: letter.id, on: toISODate(TODAY) } } } }
      }
      // Vendor sheet C2: the client hears about the letter straight away, with the scan attached.
      const sent = sendAuto(next, 'letter', leadId, clientOf(lead), { lead, project, letter, fileName: file?.name ?? scan?.name })
      if (sent !== next && sent.outbox.at(-1).channels.includes('whatsapp')) {
        const saved = sent.projects[project.id]
        return { ...sent, projects: { ...sent.projects, [project.id]: { ...saved, sharedLetters: { ...saved.sharedLetters, [shownAs]: toISODate(TODAY) } } } }
      }
      return sent
    })
    return { ...letter, stepKey: step?.letter ? forStep : undefined }
  }, [findLead, setChanges])

  /* ERM: changes one project's edits and logs it on the client's activity. */
  // then(next): a follow-up on the saved change, e.g. the automatic message it sends.
  const editProject = useCallback((leadId, project, change, text, then) => {
    setChanges((prev) => {
      const edits = prev.projects[project.id] ?? {}
      const next = { ...prev, projects: { ...prev.projects, [project.id]: { ...edits, ...change(edits) } }, activities: log(prev, leadId, 'project', text) }
      return then ? then(next) : next
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
        (next) => sendAuto(next, 'submitted', leadId, clientOf(findLead(leadId)), { lead: findLead(leadId), project, mode, ackNo }),
      )
    },
    [editProject, findLead],
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
        (next) => sendAuto(next, 'closed', leadId, clientOf(findLead(leadId)), { lead: findLead(leadId), project }),
      )
    },
    [editProject, findLead],
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
      editProject(
        leadId,
        project,
        (e) => ({ sharedFiles: { ...e.sharedFiles, [file.id]: shared ? toISODate(TODAY) : false } }),
        `${project.name}: ${file.name} ${shared ? 'shared with the client (portal)' : 'no longer shared with the client'}`,
        shared ? (next) => sendAuto(next, 'document', leadId, clientOf(findLead(leadId)), { lead: findLead(leadId), project, file }) : undefined,
      )
    },
    [editProject, findLead],
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
      const topic = queriesOf(lead).find((q) => q.id === queryId)?.topic ?? 'your project'
      setChanges((prev) =>
        sendAuto({ ...prev, edits: editLead(prev, id, { queries }), activities: log(prev, id, 'contact', `Portal — replied to the client's question: ${reply}`) }, 'reply', id, clientOf(lead), { lead, topic, reply }),
      )
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
        const saved = {
          ...prev,
          edits: editLead(prev, id, leadPatch),
          projects,
          activities: log(prev, id, 'payment', ok ? `Payment of ${rupees} for ${payment.title} verified — received` : `Payment of ${rupees} for ${payment.title} not found in the account${note ? `: ${note}` : ''}`),
        }
        // A verified payment sends the client a receipt.
        return ok ? sendAuto(saved, 'payment', id, clientOf(lead), { lead, payment }) : saved
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
  /*
   * Scan inbox (WP6, flowchart 3): scans from the NAS scanner folder wait here until filed against a project
   * (addGovtLetter with the scan). New scans come in by upload; one that isn't a government letter is set aside.
   */
  const addScans = useCallback(
    (files) => {
      const added = files.map((file) => {
        const scan = { id: `SCN-${Date.now()}-${Math.round(Math.random() * 1e6)}`, name: file.name, size: file.size, type: file.type || 'application/pdf', scannedAt: new Date().toISOString(), scanner: 'Uploaded' }
        rememberFile(scan.id, file)
        return scan
      })
      setChanges((prev) => {
        const scans = { ...EMPTY.scans, ...prev.scans }
        return { ...prev, scans: { ...scans, added: [...scans.added, ...added] } }
      })
    },
    [setChanges],
  )
  const discardScan = useCallback(
    (id) =>
      setChanges((prev) => {
        const scans = { ...EMPTY.scans, ...prev.scans }
        return { ...prev, scans: { ...scans, discarded: [...scans.discarded, id] } }
      }),
    [setChanges],
  )
  const scanInbox = useMemo(() => {
    const scans = { ...EMPTY.scans, ...changes.scans }
    return [...SEEDED_SCANS, ...scans.added].filter((s) => !scans.filed[s.id] && !scans.discarded.includes(s.id)).sort((a, b) => b.scannedAt.localeCompare(a.scannedAt))
  }, [changes.scans])

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

  /*
   * Vendor registration (data/vendorApplications.js): the demo's applications plus those sent in the app; any
   * application changed in the app is kept whole in changes.vendorApps under its id.
   */
  const vendorApplications = useMemo(() => {
    const saved = changes.vendorApps ?? {}
    const seeded = SEEDED_APPLICATIONS.map((a) => saved[a.id] ?? a)
    const added = Object.values(saved).filter((a) => !SEEDED_APPLICATIONS.some((s) => s.id === a.id))
    return [...seeded, ...added].sort((a, b) => b.submittedAt.localeCompare(a.submittedAt))
  }, [changes.vendorApps])

  const vendorOf = (app) => ({ audience: 'vendor', name: `${app.contact.name} (${app.firm.name})`, phone: app.contact.mobile, email: app.contact.email })
  const docRecords = (files) => fileRecords(files.map((f) => f.file)).map((rec, i) => ({ ...rec, kind: files[i].kind }))

  /* A firm registers on the public page; returns its application number. files: [{ file, kind }]. */
  const submitVendorApplication = useCallback(
    (details, files) => {
      const year = TODAY.getFullYear()
      const highest = vendorApplications.reduce((max, a) => Math.max(max, Number(a.id.split('-').pop()) || 0), 0)
      const id = `VR-${year}-${String(highest + 1).padStart(3, '0')}`
      const now = new Date().toISOString()
      const app = { ...details, id, submittedAt: now, status: 'New', documents: docRecords(files), history: [{ at: now, action: 'Submitted', by: details.contact.name }] }
      setChanges((prev) => ({
        ...prev,
        vendorApps: { ...prev.vendorApps, [id]: app },
        activities: log(prev, null, 'vendor', `Vendor application ${id} received: ${app.firm.name} (${app.work.categories.join(', ')})`, { by: 'vendor', vendor: app.firm.name }),
      }))
      return id
    },
    [setChanges, vendorApplications],
  )

  /* The firm corrects an application that was sent back, and sends it again. */
  const resubmitVendorApplication = useCallback(
    (id, details, files) => {
      const app = vendorApplications.find((a) => a.id === id)
      if (!app) return
      const now = new Date().toISOString()
      const next = { ...app, ...details, status: 'New', note: null, documents: [...app.documents, ...docRecords(files)], history: [...app.history, { at: now, action: 'Resubmitted with changes', by: details.contact.name }] }
      setChanges((prev) => ({ ...prev, vendorApps: { ...prev.vendorApps, [id]: next }, activities: log(prev, null, 'vendor', `Vendor application ${id} resubmitted: ${next.firm.name}`, { by: 'vendor', vendor: next.firm.name }) }))
    },
    [setChanges, vendorApplications],
  )

  /*
   * The Admin's decision. approve: the firm joins the vendor register with a vendor ID (tds: the section Finance
   * applies); changes: sent back with a note; reject: with a reason. The firm hears by email (and WhatsApp once approved).
   */
  const decideVendorApplication = useCallback(
    (id, decision, { note = '', reason = '', tds } = {}) => {
      const app = vendorApplications.find((a) => a.id === id)
      if (!app) return
      const now = new Date().toISOString()
      const by = actorRef.current.name
      setChanges((prev) => {
        let vendorId = null
        let vendorsNext = prev.vendors ?? []
        if (decision === 'approve') {
          const all = [...VENDORS, ...vendorsNext]
          vendorId = `VN-${String(all.length + 1).padStart(2, '0')}`
          const vendor = {
            id: vendorId,
            name: app.firm.name,
            work: app.work.categories.join(', '),
            categories: app.work.categories,
            place: app.address.city,
            contact: app.contact.name,
            phone: digitsOfPhone(app.contact.mobile),
            email: app.contact.email,
            gstin: app.tax.gstRegistered ? app.tax.gstin.toUpperCase() : '',
            pan: app.tax.pan.toUpperCase(),
            tds,
            bank: { name: [app.bank.bank, app.bank.branch].filter(Boolean).join(', '), accountNo: app.bank.accountNo, ifsc: app.bank.ifsc.toUpperCase() },
            msme: msmeOf(app.firm),
            address: app.address,
            applicationId: id,
            since: toISODate(TODAY),
          }
          vendorsNext = [...vendorsNext, vendor]
        }
        const action = { approve: 'Approved', changes: 'Sent back for changes', reject: 'Rejected' }[decision]
        const status = { approve: 'Approved', changes: 'Changes requested', reject: 'Rejected' }[decision]
        const next = { ...app, status, note: note || null, reason: decision === 'reject' ? reason : app.reason, vendorId: vendorId ?? app.vendorId, decidedAt: now, history: [...app.history, { at: now, action, by, note: [reason, note].filter(Boolean).join(' — ') || null }] }
        const saved = {
          ...prev,
          vendors: vendorsNext,
          vendorApps: { ...prev.vendorApps, [id]: next },
          activities: log(prev, null, 'vendor', `Vendor application ${id} (${app.firm.name}) ${action.toLowerCase()}${vendorId ? ` as ${vendorId}` : ''}${reason ? `: ${reason}` : ''}`),
        }
        const key = { approve: 'vendorApproved', changes: 'vendorChanges', reject: 'vendorRejected' }[decision]
        return sendAuto(saved, key, null, vendorOf(app), { application: next, vendorId, note, reason })
      })
    },
    [setChanges, vendorApplications],
  )

  /*
   * The demo's earlier tenders were allotted before the app opened: their work orders sit under a running project
   * of the tender's service line (or the first running project), like orders issued in the app.
   */
  const tenderOrders = useMemo(() => {
    const running = allProjects(leads, {}).filter((p) => p.status !== 'Completed' && p.startedOn)
    return SEEDED_TENDER_ORDERS.flatMap((spec) => {
      const tender = SEEDED_TENDERS.find((t) => t.id === spec.tenderId)
      const bid = SEEDED_BIDS.find((b) => b.id === spec.bidId)
      const vendor = VENDORS.find((v) => v.id === bid?.vendorId)
      const project = running.find((p) => p.name === tender?.forProject) ?? running.find((p) => p.service === tender?.service) ?? running[0]
      return tender && bid && vendor && project ? [{ projectId: project.id, order: seededTenderOrder(spec, tender, bid, vendor, project, TODAY) }] : []
    })
  }, [leads])

  /* Project edits as every page reads them: what was changed in the app, plus the seeded tenders' work orders. */
  const projectEdits = useMemo(() => {
    const merged = { ...changes.projects }
    tenderOrders.forEach(({ projectId, order }) => {
      const edits = merged[projectId] ?? {}
      merged[projectId] = { ...edits, workOrders: [order, ...(edits.workOrders ?? []).filter((w) => w.id !== order.id)] }
    })
    return merged
  }, [changes.projects, tenderOrders])

  /* Tenders and bids (data/tenders.js): the demo's, with what was published, bid and decided in the app. */
  const tenders = useMemo(() => {
    // The seeded allotted tenders point at their seeded work orders.
    const seeded = SEEDED_TENDERS.map((t) => {
      const placed = tenderOrders.find((o) => o.order.tenderId === t.id)
      return placed ? { ...t, projectId: placed.projectId, allotted: { ...t.allotted, orderId: placed.order.id, projectId: placed.projectId } } : t
    })
    return withSaved(seeded, changes.tenders).sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
  }, [changes.tenders, tenderOrders])
  const bids = useMemo(() => withSaved(SEEDED_BIDS, changes.bids).sort((a, b) => a.submittedAt.localeCompare(b.submittedAt)), [changes.bids])

  /* The Admin puts a work out for bids; every approved vendor hears of it. Returns the tender ID. */
  const publishTender = useCallback(
    (details, files) => {
      const year = TODAY.getFullYear()
      const n = String(tenders.reduce((max, t) => Math.max(max, Number(t.id.split('-').pop()) || 0), 0) + 1).padStart(3, '0')
      const id = `TN-${year}-${n}`
      const now = new Date().toISOString()
      const by = actorRef.current.name
      setChanges((prev) => {
        const all = [...VENDORS, ...(prev.vendors ?? [])]
        const tender = {
          ...details,
          id,
          refNo: `BG/VW/${year}-${String((year + 1) % 100).padStart(2, '0')}/${n}`,
          publishedAt: now,
          status: 'Open',
          documents: docRecords(files),
          authority: { name: by, designation: `Admin, ${settings.companyName}`, address: settings.address },
          notified: all.length,
          history: [{ at: now, action: 'Published · all approved vendors told', by }],
        }
        let next = { ...prev, tenders: { ...prev.tenders, [id]: tender }, activities: log(prev, null, 'vendor', `Tender ${id} published: ${tender.title} — ${all.length} vendors told`) }
        all.forEach((v) => {
          next = sendAuto(next, 'tenderPublished', null, vendorContact(v), { tender, closes: formatDateTime(tender.closesAt) })
        })
        return next
      })
      return id
    },
    [setChanges, tenders, settings],
  )

  /* Bidding ends now instead of on the closing date (the bids open for the Admin). */
  const closeBidding = useCallback(
    (tenderId) => {
      const tender = tenders.find((t) => t.id === tenderId)
      if (!tender) return
      const now = new Date().toISOString()
      const by = actorRef.current.name
      setChanges((prev) => ({
        ...prev,
        tenders: { ...prev.tenders, [tenderId]: { ...tender, closedEarlyAt: now, history: [...tender.history, { at: now, action: 'Bidding closed early · bids opened', by }] } },
        activities: log(prev, null, 'vendor', `Tender ${tenderId}: bidding closed early, bids opened`),
      }))
    },
    [setChanges, tenders],
  )

  /* A vendor bids from the vendor portal, or revises its bid while bidding is open. Returns the bid ID. */
  const submitBid = useCallback(
    (tenderId, vendorId, details, files) => {
      const tender = tenders.find((t) => t.id === tenderId)
      const vendor = vendors.find((v) => v.id === vendorId)
      if (!tender || !vendor || tenderPhase(tender) !== 'Open') return null
      const existing = bids.find((b) => b.tenderId === tenderId && b.vendorId === vendorId)
      // A withdrawn bid can't come back (as on eProc).
      if (existing?.status === 'Withdrawn') return null
      const now = new Date().toISOString()
      const id = existing?.id ?? `BD-${tenderId.split('-').pop()}-${String(bids.filter((b) => b.tenderId === tenderId).length + 1).padStart(2, '0')}`
      const bid = existing
        ? { ...existing, ...details, submittedAt: now, documents: [...existing.documents, ...docRecords(files)], history: [...existing.history, { at: now, action: 'Bid revised', by: vendor.contact }] }
        : { ...details, id, tenderId, vendorId, submittedAt: now, documents: docRecords(files), status: 'Submitted', history: [{ at: now, action: 'Bid submitted', by: vendor.contact }] }
      setChanges((prev) =>
        sendAuto(
          // Sealed: until bidding closes the record says a bid came in, never whose or for how much.
          { ...prev, bids: { ...prev.bids, [id]: bid }, activities: log(prev, null, 'vendor', `Bid ${id} ${existing ? 'revised' : 'received'} on tender ${tenderId}`, { by: 'vendor', vendor: SEALED_BIDDER }) },
          'bidReceived',
          null,
          vendorContact(vendor),
          { bid, tender, closes: formatDateTime(closingOf(tender)) },
        ),
      )
      return id
    },
    [setChanges, tenders, bids, vendors],
  )

  /* The Admin's first look after bidding closes: shortlist a bid, or reject it with a reason (the vendor is told why). */
  const decideBid = useCallback(
    (bidId, decision, { reason = '', note = '' } = {}) => {
      const bid = bids.find((b) => b.id === bidId)
      const tender = bid && tenders.find((t) => t.id === bid.tenderId)
      const vendor = bid && vendors.find((v) => v.id === bid.vendorId)
      if (!tender || !vendor) return
      const now = new Date().toISOString()
      const by = actorRef.current.name
      const status = decision === 'shortlist' ? 'Shortlisted' : 'Rejected'
      const next = {
        ...bid,
        status,
        reason: status === 'Rejected' ? reason : bid.reason,
        remark: note || null,
        history: [...bid.history, { at: now, action: status, by, note: status === 'Rejected' ? [reason, note].filter(Boolean).join(' — ') : null }],
      }
      setChanges((prev) =>
        sendAuto(
          { ...prev, bids: { ...prev.bids, [bidId]: next }, activities: log(prev, null, 'vendor', `Bid ${bidId} (${vendor.name}) on tender ${tender.id} ${status.toLowerCase()}${status === 'Rejected' && reason ? `: ${reason}` : ''}`) },
          status === 'Shortlisted' ? 'bidShortlisted' : 'bidRejected',
          null,
          vendorContact(vendor),
          { bid: next, tender, reason, note },
        ),
      )
    },
    [setChanges, tenders, bids, vendors],
  )

  /*
   * The Admin approves one shortlisted bid: the work is allotted, its work order is issued in Subcontracts against
   * the project, and every other open bid on the tender is marked not selected. All vendors are told.
   */
  const allotBid = useCallback(
    (bidId, project, dueOn) => {
      const bid = bids.find((b) => b.id === bidId)
      const tender = bid && tenders.find((t) => t.id === bid.tenderId)
      const vendor = bid && vendors.find((v) => v.id === bid.vendorId)
      if (!tender || !vendor || !project) return null
      const now = new Date().toISOString()
      const by = actorRef.current.name
      const orderId = `SC-${project.id.slice(3)}-${project.workOrders.length + 1}`
      setChanges((prev) => {
        const current = (b) => prev.bids?.[b.id] ?? b
        const others = bids.filter((b) => b.tenderId === tender.id && b.id !== bidId).map(current).filter((b) => LIVE_BID.includes(b.status))
        const bidsNext = { ...prev.bids, [bidId]: { ...current(bid), status: 'Allotted', history: [...current(bid).history, { at: now, action: `Allotted · work order ${orderId}`, by }] } }
        others.forEach((b) => {
          bidsNext[b.id] = { ...b, status: 'Not selected', history: [...b.history, { at: now, action: 'Not selected', by }] }
        })
        const edits = prev.projects[project.id] ?? {}
        const order = { id: orderId, vendor: vendor.name, work: tender.title, amount: bid.amount, dueOn, tenderId: tender.id, bidId, status: 'Issued', issuedOn: toISODate(TODAY) }
        let next = {
          ...prev,
          projects: { ...prev.projects, [project.id]: { ...edits, workOrders: [...(edits.workOrders ?? []), order] } },
          tenders: { ...prev.tenders, [tender.id]: { ...tender, status: 'Allotted', allotted: { bidId, vendorId: vendor.id, orderId, projectId: project.id, at: now }, history: [...tender.history, { at: now, action: `Allotted to ${vendor.name} · work order ${orderId}`, by }] } },
          bids: bidsNext,
          activities: log(prev, project.lead.id, 'project', `${project.name}: subcontract ${orderId} issued to ${vendor.name} — ${tender.title} (tender ${tender.id})`),
        }
        next = sendAuto(next, 'bidAllotted', null, vendorContact(vendor), { bid, tender, orderId, dueOn })
        others.forEach((b) => {
          next = sendAuto(next, 'bidNotSelected', null, vendorContact(vendors.find((v) => v.id === b.vendorId)), { bid: b, tender })
        })
        return next
      })
      return orderId
    },
    [setChanges, tenders, bids, vendors],
  )

  /* A vendor takes its bid back before bidding closes; it can't bid on that tender again. */
  const withdrawBid = useCallback(
    (bidId) => {
      const bid = bids.find((b) => b.id === bidId)
      const tender = bid && tenders.find((t) => t.id === bid.tenderId)
      const vendor = bid && vendors.find((v) => v.id === bid.vendorId)
      if (!tender || !vendor || bid.status !== 'Submitted' || tenderPhase(tender) !== 'Open') return
      const now = new Date().toISOString()
      const next = { ...bid, status: 'Withdrawn', withdrawnAt: now, history: [...bid.history, { at: now, action: 'Withdrawn by the firm', by: vendor.contact }] }
      setChanges((prev) =>
        sendAuto(
          { ...prev, bids: { ...prev.bids, [bidId]: next }, activities: log(prev, null, 'vendor', `Bid ${bidId} withdrawn from tender ${tender.id}`, { by: 'vendor', vendor: SEALED_BIDDER }) },
          'bidWithdrawn',
          null,
          vendorContact(vendor),
          { bid: next, tender },
        ),
      )
    },
    [setChanges, tenders, bids, vendors],
  )

  /* Vendors' questions on tenders (eProc's "Clarification"): asked from the vendor portal, answered on the Tenders page. */
  const clarifications = useMemo(() => withSaved(SEEDED_CLARIFICATIONS, changes.clarifications).sort((a, b) => b.askedAt.localeCompare(a.askedAt)), [changes.clarifications])

  const askClarification = useCallback(
    (tenderId, vendorId, question) => {
      const vendor = vendors.find((v) => v.id === vendorId)
      if (!vendor) return null
      const n = clarifications.filter((c) => c.tenderId === tenderId).length + 1
      const id = `CL-${tenderId.split('-').pop()}-${String(n).padStart(2, '0')}`
      const item = { id, tenderId, vendorId, question, askedAt: new Date().toISOString(), answer: null, answeredAt: null, answeredBy: null }
      setChanges((prev) => ({ ...prev, clarifications: { ...prev.clarifications, [id]: item }, activities: log(prev, null, 'vendor', `Clarification ${id} asked on tender ${tenderId}`, { by: 'vendor', vendor: vendor.name }) }))
      return id
    },
    [setChanges, clarifications, vendors],
  )

  /* The Admin's answer: published on the tender for every bidder; the firm that asked is told by email. */
  const answerClarification = useCallback(
    (id, answer) => {
      const item = clarifications.find((c) => c.id === id)
      const tender = item && tenders.find((t) => t.id === item.tenderId)
      if (!tender) return
      const next = { ...item, answer, answeredAt: new Date().toISOString(), answeredBy: actorRef.current.name }
      setChanges((prev) =>
        sendAuto(
          { ...prev, clarifications: { ...prev.clarifications, [id]: next }, activities: log(prev, null, 'vendor', `Clarification ${id} on tender ${tender.id} answered`) },
          'clarificationAnswered',
          null,
          vendorContact(vendors.find((v) => v.id === item.vendorId)),
          { clarification: next, tender },
        ),
      )
    },
    [setChanges, clarifications, tenders, vendors],
  )

  /* Tenders a vendor saved to come back to (eProc's "My Tenders"): vendor ID → tender IDs. */
  const savedTenders = useMemo(() => ({ ...SEEDED_SAVED_TENDERS, ...changes.savedTenders }), [changes.savedTenders])
  const toggleSavedTender = useCallback(
    (vendorId, tenderId) =>
      setChanges((prev) => {
        const mine = prev.savedTenders?.[vendorId] ?? SEEDED_SAVED_TENDERS[vendorId] ?? []
        return { ...prev, savedTenders: { ...prev.savedTenders, [vendorId]: mine.includes(tenderId) ? mine.filter((id) => id !== tenderId) : [...mine, tenderId] } }
      }),
    [setChanges],
  )

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

  const resetDemoData = useCallback(() => {
    // The HRMS keeps its own demo data in this browser (bgspl_* keys); one reset clears the whole app.
    try {
      Object.keys(localStorage)
        .filter((k) => k.startsWith('bgspl_') || k.startsWith('hrms_'))
        .forEach((k) => localStorage.removeItem(k))
    } catch {
      // Storage unavailable: nothing saved to clear.
    }
    setChanges(EMPTY)
  }, [setChanges])

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
        outbox: changes.outbox ?? [],
        scanInbox,
        addScans,
        discardScan,
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
        projectEdits,
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
        setDocumentShared,
        vendorApplications,
        submitVendorApplication,
        resubmitVendorApplication,
        decideVendorApplication,
        tenders,
        bids,
        publishTender,
        closeBidding,
        submitBid,
        decideBid,
        allotBid,
        withdrawBid,
        clarifications,
        askClarification,
        answerClarification,
        savedTenders,
        toggleSavedTender,
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
