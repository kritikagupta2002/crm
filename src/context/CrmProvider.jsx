import { useCallback, useEffect, useMemo, useState } from 'react'
import { FOLLOW_UPS, LEADS, TODAY } from '../data/mockData'
import { formatDayMonth, formatTime, toISODate } from '../utils/date'
import { CrmContext } from './crm'

/*
 * Holds the demo's data in React state. Generated mock data is the base; everything done
 * through the UI (new enquiries, stage changes, notes, follow-ups) is kept separately in
 * localStorage so it survives a refresh and can be reset in one go.
 * Later, this provider is the one place to swap for real API calls.
 */
const STORAGE_KEY = 'bansal-crm-demo:v2'
const OLD_STORAGE_KEY = 'bansal-crm-demo:added:v1'
const EMPTY = { leads: [], followUps: [], edits: {}, activities: [] }

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

const newActivity = (leadId, type, text) => ({
  id: `AC-${Date.now()}-${Math.round(Math.random() * 1e6)}`,
  leadId,
  type,
  text,
  at: new Date().toISOString(),
})

export function CrmProvider({ children }) {
  const [changes, setChanges] = useState(loadChanges)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(changes))
      localStorage.removeItem(OLD_STORAGE_KEY)
    } catch {
      // Not critical for a demo; data just won't survive a refresh.
    }
  }, [changes])

  const leads = useMemo(
    () => [...LEADS, ...changes.leads].map((lead) => (changes.edits[lead.id] ? { ...lead, ...changes.edits[lead.id] } : lead)),
    [changes.leads, changes.edits],
  )

  // Follow-ups of leads that have since been won or lost are no longer pending.
  const followUps = useMemo(() => {
    const closed = new Set(leads.filter((lead) => CLOSED_STAGES.includes(lead.stage)).map((lead) => lead.id))
    return [...FOLLOW_UPS, ...changes.followUps].filter((followUp) => !closed.has(followUp.leadId))
  }, [leads, changes.followUps])

  const editLead = (prev, id, patch) => ({ ...prev.edits, [id]: { ...prev.edits[id], ...patch } })

  const addEnquiry = useCallback(
    ({ followUp, ...details }) => {
      const lead = {
        ...details,
        id: nextLeadId(leads),
        stage: 'New Enquiry',
        createdOn: toISODate(TODAY),
        nextFollowUp: followUp?.date ?? null,
      }
      const newFollowUps = followUp
        ? [
            {
              id: `FU-${lead.id}`,
              leadId: lead.id,
              type: followUp.type,
              title: `${FOLLOW_UP_TITLES[followUp.type]} ${lead.company}`,
              note: details.notes?.trim() || `${details.serviceDetail} enquiry`,
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
      const lead = leads.find((l) => l.id === id)
      if (!lead || lead.stage === stage) return
      const patch = { stage, lostReason: stage === 'Lost' ? lostReason : undefined }
      if (CLOSED_STAGES.includes(stage)) patch.nextFollowUp = null
      const text = stage === 'Lost' && lostReason ? `Marked as Lost: ${lostReason}` : `Stage changed from ${lead.stage} to ${stage}`
      setChanges((prev) => ({
        ...prev,
        edits: editLead(prev, id, patch),
        activities: [...prev.activities, newActivity(id, 'stage', text)],
      }))
    },
    [leads],
  )

  const addNote = useCallback((id, text) => {
    setChanges((prev) => ({ ...prev, activities: [...prev.activities, newActivity(id, 'note', text)] }))
  }, [])

  const scheduleFollowUp = useCallback(
    (id, { type, date, time, note }) => {
      const lead = leads.find((l) => l.id === id)
      if (!lead) return
      const followUp = {
        id: `FU-${id}-${Date.now()}`,
        leadId: id,
        type,
        title: `${FOLLOW_UP_TITLES[type]} ${lead.company}`,
        note: note?.trim() || lead.serviceDetail,
        date,
        time,
      }
      // "Next follow-up" is always the earliest pending one.
      const next = lead.nextFollowUp && lead.nextFollowUp < date ? lead.nextFollowUp : date
      setChanges((prev) => ({
        ...prev,
        followUps: [...prev.followUps, followUp],
        edits: editLead(prev, id, { nextFollowUp: next }),
        activities: [...prev.activities, newActivity(id, 'follow-up', `${type} scheduled for ${formatDayMonth(date)}, ${formatTime(time)}`)],
      }))
    },
    [leads],
  )

  const resetDemoData = useCallback(() => setChanges(EMPTY), [])

  return (
    <CrmContext.Provider
      value={{
        leads,
        followUps,
        activities: changes.activities,
        addEnquiry,
        changeStage,
        addNote,
        scheduleFollowUp,
        changeCount: changes.leads.length + changes.activities.length, // demo changes kept in this browser
        resetDemoData,
      }}
    >
      {children}
    </CrmContext.Provider>
  )
}
