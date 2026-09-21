import { useCallback, useEffect, useMemo, useState } from 'react'
import { FOLLOW_UPS, LEADS, STAGES, TODAY } from '../data/mockData'
import { formatDayMonth, formatTime, toISODate } from '../utils/date'
import { pinnedQuote } from '../utils/workflow'
import { CrmContext, DEFAULT_SETTINGS } from './crm'

/*
 * Holds the demo's data in React state. Generated mock data is the base; everything done
 * through the UI (enquiries, stage changes, notes, follow-ups, quotations, settings) is kept
 * separately in localStorage so it survives a refresh and can be reset in one go.
 * Later, this provider is the one place to swap for real API calls.
 */
const STORAGE_KEY = 'bansal-crm-demo:v2'
const ROLE_KEY = 'bansal-crm:role'
const SESSION_KEY = 'bansal-crm:session'
const OLD_STORAGE_KEY = 'bansal-crm-demo:added:v1'
const EMPTY = { leads: [], followUps: [], followUpEdits: {}, edits: {}, activities: [], settings: {} }

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

const newActivity = (leadId, type, text) => ({
  id: `AC-${Date.now()}-${Math.round(Math.random() * 1e6)}`,
  leadId,
  type,
  text,
  at: new Date().toISOString(),
})

const editLead = (prev, id, patch) => ({ ...prev.edits, [id]: { ...prev.edits[id], ...patch } })
const log = (prev, id, type, text) => [...prev.activities, newActivity(id, type, text)]

function loadRole() {
  try {
    return localStorage.getItem(ROLE_KEY) || 'Admin'
  } catch {
    return 'Admin'
  }
}

/* Demo sign-in: { type: 'team' } or { type: 'client', leadId }. No password check — that comes with a backend. */
function loadSession() {
  try {
    const session = JSON.parse(localStorage.getItem(SESSION_KEY))
    return session?.type === 'team' || (session?.type === 'client' && session.leadId) ? session : null
  } catch {
    return null
  }
}

export function CrmProvider({ children }) {
  const [changes, setChanges] = useState(loadChanges)
  const [role, setRoleState] = useState(loadRole)
  const [session, setSessionState] = useState(loadSession)

  const setRole = useCallback((next) => {
    setRoleState(next)
    try {
      localStorage.setItem(ROLE_KEY, next)
    } catch {
      // Remembering the role is only a convenience.
    }
  }, [])

  const setSession = useCallback((next) => {
    setSessionState(next)
    try {
      if (next) localStorage.setItem(SESSION_KEY, JSON.stringify(next))
      else localStorage.removeItem(SESSION_KEY)
    } catch {
      // Without storage the demo simply asks to sign in again after a refresh.
    }
  }, [])

  const signIn = useCallback(
    (nextRole) => {
      setRole(nextRole)
      setSession({ type: 'team' })
    },
    [setRole, setSession],
  )
  const signInClient = useCallback((leadId) => setSession({ type: 'client', leadId }), [setSession])
  const signOut = useCallback(() => setSession(null), [setSession])

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(changes))
      localStorage.removeItem(OLD_STORAGE_KEY)
    } catch {
      // Not critical for a demo; data just won't survive a refresh.
    }
  }, [changes])

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

  const addEnquiry = useCallback(
    ({ followUp, ...details }) => {
      const lead = { ...details, id: nextLeadId(leads), stage: 'New Enquiry', createdOn: toISODate(TODAY) }
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
    [leads],
  )

  const changeStage = useCallback(
    (id, stage, { lostReason } = {}) => {
      const lead = findLead(id)
      if (!lead || lead.stage === stage) return
      const patch = { stage, lostReason: stage === 'Lost' ? lostReason : undefined, quote: pinnedQuote(lead, settings) }
      if (stage === 'Won') patch.wonOn = toISODate(TODAY)
      if (stage === 'Lost' && lead.quoteValue) patch.quoteStatus = 'Rejected'
      const text = stage === 'Lost' && lostReason ? `Marked as Lost: ${lostReason}` : `Stage changed from ${lead.stage} to ${stage}`
      setChanges((prev) => ({ ...prev, edits: editLead(prev, id, patch), activities: log(prev, id, 'stage', text) }))
    },
    [findLead, settings],
  )

  /* kind: Note, Call, WhatsApp, Email or Meeting — how the conversation happened. */
  const addNote = useCallback((id, text, kind = 'Note') => {
    setChanges((prev) => ({ ...prev, activities: log(prev, id, kind === 'Note' ? 'note' : 'contact', kind === 'Note' ? text : `${kind} — ${text}`) }))
  }, [])

  /* Records that something was shared with the client (e.g. a quotation on WhatsApp). */
  const logActivity = useCallback((id, type, text) => {
    setChanges((prev) => ({ ...prev, activities: log(prev, id, type, text) }))
  }, [])

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
    [findLead],
  )

  const completeFollowUp = useCallback((followUp, outcome) => {
    setChanges((prev) => ({
      ...prev,
      followUpEdits: { ...prev.followUpEdits, [followUp.id]: { ...prev.followUpEdits[followUp.id], done: true, outcome, doneOn: toISODate(TODAY) } },
      activities: log(prev, followUp.leadId, 'follow-up', `${followUp.type} done${outcome ? `: ${outcome}` : ''}`),
    }))
  }, [])

  const rescheduleFollowUp = useCallback((followUp, date, time) => {
    setChanges((prev) => ({
      ...prev,
      followUpEdits: { ...prev.followUpEdits, [followUp.id]: { ...prev.followUpEdits[followUp.id], date, time } },
      activities: log(prev, followUp.leadId, 'follow-up', `${followUp.type} moved to ${formatDayMonth(date)}, ${formatTime(time)}`),
    }))
  }, [])

  /* Saves edited fields (details form, project, checklists) and notes it in the activity log. */
  const updateLead = useCallback((id, patch, activityText) => {
    setChanges((prev) => ({
      ...prev,
      edits: editLead(prev, id, patch),
      activities: activityText ? log(prev, id, 'edit', activityText) : prev.activities,
    }))
  }, [])

  /* Saves a new or revised quotation; sending one moves an early-stage lead to "Proposal Sent". */
  const saveQuotation = useCallback(
    (id, quote) => {
      const lead = findLead(id)
      if (!lead) return
      const revising = Boolean(lead.quote || lead.quoteValue)
      const patch = { quote, quoteValue: quote.net, quoteStatus: revising ? 'Revised' : 'Sent' }
      if (stageIndex(lead.stage) < stageIndex('Proposal Sent') || lead.stage === 'Lost') patch.stage = 'Proposal Sent'
      if (revising && lead.stage === 'Proposal Sent') patch.stage = 'Negotiation'
      const text = `${revising ? `Quotation revised (v${quote.version})` : 'Quotation sent'} — ₹${quote.net.toLocaleString('en-IN')} + GST`
      setChanges((prev) => ({ ...prev, edits: editLead(prev, id, patch), activities: log(prev, id, 'quote', text) }))
    },
    [findLead],
  )

  /* Client accepted the quotation: it moves into Client Approval (PO, advance, agreement). */
  const acceptQuotation = useCallback(
    (id) => {
      const lead = findLead(id)
      if (!lead) return
      const patch = { quoteStatus: 'Accepted', approval: { ...lead.approval, quoteAccepted: true }, quote: pinnedQuote(lead, settings) }
      if (stageIndex(lead.stage) < stageIndex('Negotiation')) patch.stage = 'Negotiation'
      setChanges((prev) => ({ ...prev, edits: editLead(prev, id, patch), activities: log(prev, id, 'quote', 'Quotation accepted by client') }))
    },
    [findLead, settings],
  )

  /* byClient: uploaded from the client portal, so the log says where it came from. */
  const addDocuments = useCallback(
    (id, files, { byClient = false } = {}) => {
      const lead = findLead(id)
      if (!lead || files.length === 0) return
      const added = files.map((file) => ({
        id: `DOC-${Date.now()}-${Math.round(Math.random() * 1e6)}`,
        name: file.name,
        size: file.size,
        type: file.type,
        addedOn: toISODate(new Date()),
      }))
      const text = `${added.length === 1 ? `Document added: ${added[0].name}` : `${added.length} documents added`}${byClient ? ' by client (portal)' : ''}`
      setChanges((prev) => ({ ...prev, edits: editLead(prev, id, { documents: [...(lead.documents ?? []), ...added] }), activities: log(prev, id, 'document', text) }))
    },
    [findLead],
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
    [findLead],
  )

  const setTags = useCallback((id, tags) => setChanges((prev) => ({ ...prev, edits: editLead(prev, id, { tags }) })), [])

  const updateSettings = useCallback((patch) => setChanges((prev) => ({ ...prev, settings: { ...prev.settings, ...patch } })), [])

  const resetDemoData = useCallback(() => setChanges(EMPTY), [])

  const changeCount = changes.leads.length + changes.activities.length + Object.keys(changes.settings).length

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
        session,
        signIn,
        signInClient,
        signOut,
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
