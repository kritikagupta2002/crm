import { AlertTriangle, CalendarCheck2, CalendarClock, CalendarDays, Check, Clock, Search } from 'lucide-react'
import { useState } from 'react'
import { KpiCard } from '../../components/common/KpiCard'
import { useAccess, useCrm } from '../../context/crm'
import { FOLLOW_UP_TYPES, TEAM, TODAY } from '../../data/mockData'
import { addDays, formatDayMonth, formatTime, toISODate } from '../../utils/date'
import { RoleLink } from '../../components/common/RoleLink'

const todayISO = toISODate(TODAY)
const tomorrowISO = toISODate(addDays(TODAY, 1))
const weekEndISO = toISODate(addDays(TODAY, 7))

// Long groups show their first few; the rest are one click away.
const GROUP_PREVIEW = 5

const GROUPS = [
  { id: 'overdue', label: 'Overdue', tone: 'tone-urgent', test: (d) => d < todayISO },
  { id: 'today', label: 'Today', tone: 'tone-attention', test: (d) => d === todayISO },
  { id: 'tomorrow', label: 'Tomorrow', tone: 'tone-info', test: (d) => d === tomorrowISO },
  { id: 'week', label: 'This week', tone: 'tone-info', test: (d) => d > tomorrowISO && d <= weekEndISO },
  { id: 'later', label: 'Later', tone: 'tone-neutral', test: (d) => d > weekEndISO },
]

/* One follow-up row: "Done" asks for a short outcome, "Reschedule" for a new date and time. */
function FollowUpRow({ item, lead, tone }) {
  const { completeFollowUp, rescheduleFollowUp } = useCrm()
  const { may } = useAccess()
  const [mode, setMode] = useState(null) // null | 'done' | 'move'
  const [outcome, setOutcome] = useState('')
  const [move, setMove] = useState({ date: toISODate(addDays(TODAY, 1)), time: item.time })

  return (
    <li className={`fu-row ${tone}`}>
      <span className="fu-dot" aria-hidden="true" />
      <div className="fu-main">
        <strong>{item.title}</strong>
        <span className="muted">
          {item.note} · <RoleLink to={`/leads/${item.leadId}?tab=activity`}>{item.leadId}</RoleLink> · {lead?.assignedTo}
        </span>
        {mode === 'done' && (
          <form
            className="fu-inline"
            onSubmit={(e) => {
              e.preventDefault()
              completeFollowUp(item, outcome.trim())
            }}
          >
            <input autoFocus value={outcome} onChange={(e) => setOutcome(e.target.value)} placeholder="Outcome — e.g. client wants revised quote" aria-label="Outcome" />
            <button className="btn btn-success" type="submit">
              <Check size={15} /> Mark done
            </button>
            <button className="btn" type="button" onClick={() => setMode(null)}>
              Cancel
            </button>
          </form>
        )}
        {mode === 'move' && (
          <form
            className="fu-inline"
            onSubmit={(e) => {
              e.preventDefault()
              if (move.date >= todayISO && move.time) rescheduleFollowUp(item, move.date, move.time)
              setMode(null)
            }}
          >
            <input type="date" min={todayISO} value={move.date} onChange={(e) => setMove({ ...move, date: e.target.value })} aria-label="New date" />
            <input type="time" value={move.time} onChange={(e) => setMove({ ...move, time: e.target.value })} aria-label="New time" />
            <button className="btn btn-primary" type="submit">
              Move
            </button>
            <button className="btn" type="button" onClick={() => setMode(null)}>
              Cancel
            </button>
          </form>
        )}
      </div>
      <div className="fu-when">
        <span className="pill fu-type">{item.type}</span>
        <span>
          {item.date === todayISO ? 'Today' : formatDayMonth(item.date)}, {formatTime(item.time)}
        </span>
      </div>
      {!mode && may('contact') && (
        <div className="fu-actions">
          <button className="btn" onClick={() => setMode('move')}>
            Reschedule
          </button>
          <button className="btn btn-success" onClick={() => setMode('done')}>
            <Check size={15} /> Done
          </button>
        </div>
      )}
    </li>
  )
}

export function FollowUpsPage() {
  const { followUps, completedFollowUps, leads } = useCrm()
  const [filters, setFilters] = useState({ search: '', owner: '', type: '' })
  const [expanded, setExpanded] = useState({}) // group id → showing all
  const leadById = new Map(leads.map((l) => [l.id, l]))

  const q = filters.search.trim().toLowerCase()
  const visible = followUps
    .filter((f) => (!filters.owner || leadById.get(f.leadId)?.assignedTo === filters.owner) && (!filters.type || f.type === filters.type))
    .filter((f) => !q || `${f.title} ${f.note} ${f.leadId}`.toLowerCase().includes(q))
    .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time))

  const count = (id) => followUps.filter((f) => GROUPS.find((g) => g.id === id).test(f.date)).length
  const set = (key) => (e) => setFilters({ ...filters, [key]: e.target.value })

  return (
    <div className="module-page">
      <header className="page-header">
        <div className="page-title">
          <h1>Follow-ups</h1>
          <p>Calls, meetings and site visits across all enquiries</p>
        </div>
      </header>

      <section className="stat-grid">
        <KpiCard tone="tone-urgent" icon={AlertTriangle} label="Overdue" value={count('overdue')}>
          <span className="muted">Need attention first</span>
        </KpiCard>
        <KpiCard tone="tone-attention" icon={Clock} label="Due Today" value={count('today')}>
          <span className="muted">{formatDayMonth(todayISO)}</span>
        </KpiCard>
        <KpiCard tone="tone-info" icon={CalendarDays} label="Next 7 Days" value={count('tomorrow') + count('week')}>
          <span className="muted">Coming up</span>
        </KpiCard>
        <KpiCard tone="tone-good" icon={CalendarCheck2} label="Completed" value={completedFollowUps.length}>
          <span className="muted">Marked done in the CRM</span>
        </KpiCard>
      </section>

      <section className="card">
        <div className="leads-toolbar">
          <label className="toolbar-search">
            <Search size={16} className="muted" />
            <input value={filters.search} onChange={set('search')} placeholder="Search client, note or enquiry ID" aria-label="Search follow-ups" />
          </label>
          <select value={filters.owner} onChange={set('owner')} aria-label="Assigned to">
            <option value="">Everyone</option>
            {TEAM.map((m) => (
              <option key={m}>{m}</option>
            ))}
          </select>
          <select value={filters.type} onChange={set('type')} aria-label="Type">
            <option value="">All types</option>
            {FOLLOW_UP_TYPES.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </div>

        {visible.length === 0 && <p className="empty-state">Nothing to follow up — you're all caught up.</p>}
        {GROUPS.map((group) => {
          const items = visible.filter((f) => group.test(f.date))
          if (items.length === 0) return null
          return (
            <div key={group.id} className="fu-group">
              <h2 className={`fu-group-title ${group.tone}`}>
                <CalendarClock size={16} /> {group.label} <span>{items.length}</span>
              </h2>
              <ul className="fu-list">
                {items.slice(0, expanded[group.id] ? items.length : GROUP_PREVIEW).map((item) => (
                  <FollowUpRow key={item.id} item={item} lead={leadById.get(item.leadId)} tone={group.tone} />
                ))}
              </ul>
              {items.length > GROUP_PREVIEW && (
                <button className="link-button show-more" onClick={() => setExpanded({ ...expanded, [group.id]: !expanded[group.id] })}>
                  {expanded[group.id] ? 'Show fewer' : `Show all ${items.length}`}
                </button>
              )}
            </div>
          )
        })}
      </section>
    </div>
  )
}
