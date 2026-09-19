import { StickyNote } from 'lucide-react'
import { useState } from 'react'
import { useCrm } from '../../context/crm'
import { formatDayMonth, formatTime, parseISODate, toISODate } from '../../utils/date'

/* Log how the conversation happened, so the timeline doubles as a communication log. */
const NOTE_KINDS = ['Note', 'Call', 'WhatsApp', 'Email', 'Meeting']

function formatWhen(iso) {
  const date = new Date(iso)
  return `${formatDayMonth(toISODate(date))}, ${formatTime(`${date.getHours()}:${date.getMinutes()}`)}`
}

/* Notes box plus the lead's history: when the enquiry came in, then everything done in the CRM, newest first. */
export function LeadActivity({ lead }) {
  const { activities, addNote } = useCrm()
  const [note, setNote] = useState('')
  const [kind, setKind] = useState('Note')

  const timeline = [
    ...activities.filter((a) => a.leadId === lead.id).map((a) => ({ ...a, when: formatWhen(a.at), sort: a.at })),
    {
      id: 'created',
      type: 'created',
      text: `Enquiry received${lead.source ? ` via ${lead.source}` : ''}`,
      when: formatDayMonth(lead.createdOn),
      sort: parseISODate(lead.createdOn).toISOString(),
    },
  ].sort((a, b) => b.sort.localeCompare(a.sort))

  return (
    <>
      <h3>Activity</h3>
      <form
        className="note-form"
        onSubmit={(e) => {
          e.preventDefault()
          if (!note.trim()) return
          addNote(lead.id, note.trim(), kind)
          setNote('')
        }}
      >
        <select value={kind} onChange={(e) => setKind(e.target.value)} aria-label="Type of note">
          {NOTE_KINDS.map((k) => (
            <option key={k}>{k}</option>
          ))}
        </select>
        <input value={note} onChange={(e) => setNote(e.target.value)} placeholder={kind === 'Note' ? 'Add a note — client feedback, next steps…' : `What was discussed on the ${kind.toLowerCase()}?`} aria-label="Add a note" />
        <button type="submit" className="btn" disabled={!note.trim()}>
          <StickyNote size={15} /> Add
        </button>
      </form>
      <ol className="timeline">
        {timeline.map((item) => (
          <li key={item.id} className={`timeline-item type-${item.type}`}>
            <span className="timeline-dot" />
            <div>
              <p>{item.text}</p>
              <span className="muted">{item.when}</span>
            </div>
          </li>
        ))}
      </ol>
    </>
  )
}
