import { AlertTriangle, Camera, CheckCircle2, ClipboardCheck, MapPin, Phone, Play } from 'lucide-react'
import { useState } from 'react'
import { KpiCard } from '../../components/common/KpiCard'
import { RoleLink } from '../../components/common/RoleLink'
import { useCrm } from '../../context/crm'
import { TODAY } from '../../data/mockData'
import { FIELD_MEMBERS } from '../../data/staff'
import { formatNearDate, toISODate } from '../../utils/date'
import { allProjects } from '../../utils/projects'
import { FieldVisitForm } from '../projects/ProjectWork'
import '../projects/erm.css'

const PERSON_KEY = 'bansal-crm:field-member'
const monthStartISO = toISODate(TODAY).slice(0, 8) + '01'

function savedPerson() {
  try {
    const saved = localStorage.getItem(PERSON_KEY)
    return FIELD_MEMBERS.some((m) => m.name === saved) ? saved : null
  } catch {
    return null
  }
}

/* The field team's phone screen: my open tasks with one-tap status, my sites, and logging a visit with photos. */
export function MyTasksPage() {
  const { leads, projectEdits, updateProjectTask } = useCrm()
  const projects = allProjects(leads, projectEdits).filter((p) => p.status !== 'Completed')
  // Opens on the field member with the most open work, until someone picks a name.
  const openFor = (name) => projects.flatMap((p) => p.tasks).filter((t) => t.assignee === name && t.status !== 'done').length
  const busiest = FIELD_MEMBERS.map((m) => m.name).sort((a, b) => openFor(b) - openFor(a))[0]
  const [me, setMe] = useState(() => savedPerson() ?? busiest)
  const [logging, setLogging] = useState(null)

  const choose = (name) => {
    setMe(name)
    setLogging(null)
    try {
      localStorage.setItem(PERSON_KEY, name)
    } catch {
      // Only the default person is lost.
    }
  }

  const person = FIELD_MEMBERS.find((m) => m.name === me)
  const mine = projects.filter((p) => p.team.members?.includes(me))
  const tasks = projects.flatMap((p) => p.tasks.map((t) => ({ ...t, project: p }))).filter((t) => t.assignee === me)
  const open = tasks.filter((t) => t.status !== 'done').sort((a, b) => (a.due ?? '9').localeCompare(b.due ?? '9'))
  const done = tasks.filter((t) => t.status === 'done').sort((a, b) => (b.doneOn ?? '').localeCompare(a.doneOn ?? '')).slice(0, 5)
  const visitsThisMonth = projects.flatMap((p) => p.fieldVisits).filter((v) => v.by === me && v.date >= monthStartISO).length

  return (
    <div className="module-page my-tasks">
      <header className="page-header">
        <div className="page-title">
          <h1>My Tasks</h1>
          <p>
            {me} · {person?.title}
          </p>
        </div>
        <div className="page-actions">
          <select className="me-select" value={me} onChange={(e) => choose(e.target.value)} aria-label="Field member">
            {FIELD_MEMBERS.map((m) => (
              <option key={m.name} value={m.name}>
                {m.name}
              </option>
            ))}
          </select>
        </div>
      </header>

      <section className="stat-grid my-stats">
        <KpiCard tone="tone-info" icon={ClipboardCheck} label="Open Tasks" value={open.length}>
          <span className="muted">On {mine.length} sites</span>
        </KpiCard>
        <KpiCard tone={open.some((t) => t.overdue) ? 'tone-urgent' : 'tone-good'} icon={AlertTriangle} label="Overdue" value={open.filter((t) => t.overdue).length}>
          <span className="muted">Past their due date</span>
        </KpiCard>
        <KpiCard tone="tone-good" icon={Camera} label="Visits This Month" value={visitsThisMonth}>
          <span className="muted">Logged with photos & readings</span>
        </KpiCard>
      </section>

      <section className="card">
        <header className="card-header">
          <ClipboardCheck size={18} className="card-icon" />
          <h2>To Do</h2>
          <div className="card-actions">{open.length} open</div>
        </header>
        {open.length === 0 ? (
          <p className="empty-state">Nothing assigned to you right now. Log your site visits below.</p>
        ) : (
          <ul className="my-task-list">
            {open.map((t) => (
              <li key={`${t.project.id}-${t.key ?? t.id}`} className={t.overdue ? 'is-overdue' : ''}>
                <div>
                  <strong>{t.title}</strong>
                  <span className="muted">
                    <RoleLink to={`/projects/${t.project.id}`}>{t.project.name}</RoleLink> · {t.project.lead.company}
                  </span>
                  <span className={`my-due ${t.overdue ? 'text-red' : ''}`}>{t.due ? `${t.overdue ? 'Was due' : 'Due'} ${formatNearDate(t.due)}` : 'No due date'}</span>
                </div>
                <div className="my-task-actions">
                  {t.status === 'todo' ? (
                    <button className="btn btn-small" onClick={() => updateProjectTask(t.project.lead.id, t.project, t, { status: 'in-progress' })}>
                      <Play size={14} /> Start
                    </button>
                  ) : (
                    <span className="pill status-pill tone-info">In progress</span>
                  )}
                  <button className="btn btn-primary btn-small" onClick={() => updateProjectTask(t.project.lead.id, t.project, t, { status: 'done' })}>
                    <CheckCircle2 size={14} /> Done
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card">
        <header className="card-header">
          <MapPin size={18} className="card-icon" />
          <h2>My Sites</h2>
          <div className="card-actions">{mine.length} running</div>
        </header>
        {mine.length === 0 ? (
          <p className="empty-state">You aren't on a running project yet.</p>
        ) : (
          <ul className="my-sites">
            {mine.map((p) => {
              const last = p.fieldVisits.find((v) => v.by === me)
              return (
                <li key={p.id}>
                  <div className="my-site-head">
                    <div>
                      <strong>{p.name}</strong>
                      <span className="muted">
                        {p.lead.company} · {p.site}
                      </span>
                      <span className="muted">
                        Team lead {p.team.teamLead ?? '—'} · {last ? `your last visit ${formatNearDate(last.date)}` : 'no visit logged by you yet'}
                      </span>
                    </div>
                    <div className="my-task-actions">
                      {p.lead.phone && (
                        <a className="btn btn-small" href={`tel:+91${p.lead.phone}`}>
                          <Phone size={14} /> Client
                        </a>
                      )}
                      {logging !== p.id && (
                        <button className="btn btn-primary btn-small" onClick={() => setLogging(p.id)}>
                          <Camera size={14} /> Log visit
                        </button>
                      )}
                    </div>
                  </div>
                  {logging === p.id && <FieldVisitForm key={`${p.id}-${me}`} project={p} by={me} onDone={() => setLogging(null)} />}
                </li>
              )
            })}
          </ul>
        )}
      </section>

      {done.length > 0 && (
        <section className="card">
          <header className="card-header">
            <CheckCircle2 size={18} className="card-icon" />
            <h2>Recently Done</h2>
          </header>
          <ul className="my-task-list is-done">
            {done.map((t) => (
              <li key={`${t.project.id}-${t.key ?? t.id}`}>
                <div>
                  <strong>{t.title}</strong>
                  <span className="muted">
                    {t.project.lead.company} · done {t.doneOn ? formatNearDate(t.doneOn) : ''}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
