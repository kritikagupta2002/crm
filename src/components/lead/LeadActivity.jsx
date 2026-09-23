import { StickyNote } from 'lucide-react'
import { useState } from 'react'
import { useAccess, useCrm } from '../../context/crm'
import { clientTimeline, lastContact, leadTimeline } from '../../utils/clientHistory'
import { formatDayMonth, formatNearDate, formatTime, toISODate } from '../../utils/date'
import { clientProjects } from '../../utils/projects'

/* Log how the conversation happened, so the timeline doubles as a communication log. */
const NOTE_KINDS = ['Note', 'Call', 'WhatsApp', 'Email', 'Meeting']

function formatWhen(iso) {
  const date = new Date(iso)
  return `${formatDayMonth(toISODate(date))}, ${formatTime(`${date.getHours()}:${date.getMinutes()}`)}`
}

/*
 * Notes box plus the history: the enquiry's conversations, quotation and deal, newest first. For a client
 * (withProjects) the main moments of its projects are added, with the last contact on top.
 */
export function LeadActivity({ lead, withProjects = false, title = 'Activity', limit }) {
  const { activities, addNote, projectEdits } = useCrm()
  const { may } = useAccess()
  const [note, setNote] = useState('')
  const [kind, setKind] = useState('Note')
  const [showAll, setShowAll] = useState(false)

  const items = withProjects ? clientTimeline(lead, activities, clientProjects(lead, projectEdits)) : leadTimeline(lead, activities)
  const timeline = items.map((item) => ({ ...item, when: item.at ? formatWhen(item.at) : formatNearDate(item.date) }))
  const shown = limit && !showAll ? timeline.slice(0, limit) : timeline
  const last = lastContact(items)
  const talks = items.filter((i) => i.type === 'contact' || i.byClient).length

  return (
    <>
      <h3>{title}</h3>
      {withProjects && (
        <p className="history-summary">
          {last ? (
            <>
              Last contact <b>{formatNearDate(last.date)}</b> · {last.mode}
            </>
          ) : (
            'No conversation logged yet'
          )}{' '}
          · {talks} conversations · {items.length} events in all
        </p>
      )}
      {may('contact') && (
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
      )}
      <ol className="timeline">
        {shown.map((item) => (
          <li key={item.id} className={`timeline-item type-${item.type}`}>
            <span className="timeline-dot" />
            <div>
              <p>{item.text}</p>
              <span className="muted">
                {item.when}
                {item.who && ` · ${item.who}`}
              </span>
            </div>
          </li>
        ))}
      </ol>
      {limit && timeline.length > limit && (
        <button className="link-button show-more" onClick={() => setShowAll(!showAll)}>
          {showAll ? 'Show fewer' : `Show all ${timeline.length} events`}
        </button>
      )}
    </>
  )
}
