import { AlertTriangle, Briefcase, UserCheck, Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import { KpiCard } from '../../components/common/KpiCard'
import { tabLink, useTabParam } from '../../components/common/useTabParam'
import { useCrm } from '../../context/crm'
import { TODAY } from '../../data/mockData'
import { COORDINATORS, FIELD_MEMBERS, TEAM_LEADS } from '../../data/staff'
import { addDays, toISODate } from '../../utils/date'
import { allProjects } from '../../utils/projects'
import '../projects/erm.css'

const monthAgoISO = toISODate(addDays(TODAY, -30))

const GROUPS = [
  { key: 'coordinator', label: 'Coordinators', people: COORDINATORS, about: () => 'Allocation, planning, submission and closure' },
  { key: 'teamLead', label: 'Team leads', people: TEAM_LEADS, about: (p) => p.services.join(', ') },
  { key: 'member', label: 'Field team', people: FIELD_MEMBERS, about: (p) => p.skills },
]

/* Free, normal or busy, from the running projects a person is on. */
function loadOf(projects) {
  if (projects === 0) return { label: 'Free', tone: 'tone-good' }
  if (projects <= 2) return { label: 'Normal', tone: 'tone-info' }
  return { label: 'Busy', tone: 'tone-attention' }
}

const initials = (name) =>
  name
    .replace(/^Dr\. /, '')
    .split(/[\s.]+/)
    .filter(Boolean)
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

/* The project team: who is on which project, what they have open, and who is free for the next allocation. */
export function TeamPage() {
  const { leads, projectEdits } = useCrm()
  const [group, setGroup] = useTabParam(['all', ...GROUPS.map((g) => g.key), 'free'], 'all')
  const running = allProjects(leads, projectEdits).filter((p) => p.status !== 'Completed')
  const tasks = running.flatMap((p) => p.tasks.filter((t) => t.status !== 'done'))

  const people = GROUPS.flatMap((g) =>
    g.people.map((person) => {
      const onProject = (p) => (g.key === 'member' ? p.team.members?.includes(person.name) : p.team[g.key] === person.name)
      const projects = running.filter(onProject)
      const open = tasks.filter((t) => t.assignee === person.name)
      const visits = running.flatMap((p) => p.fieldVisits).filter((v) => v.by === person.name && v.date >= monthAgoISO).length
      return { ...person, group: g, projects, open: open.length, overdue: open.filter((t) => t.overdue).length, visits, load: loadOf(projects.length) }
    }),
  )
  const visible = people.filter((p) => group === 'all' || (group === 'free' ? p.projects.length === 0 : p.group.key === group))
  const free = people.filter((p) => p.projects.length === 0)

  return (
    <div className="module-page">
      <header className="page-header">
        <div className="page-title">
          <h1>Team</h1>
          <p>
            {people.length} people on the project side · {free.length} free for a new project
          </p>
        </div>
      </header>

      <section className="stat-grid">
        <KpiCard tone="tone-info" icon={Users} label="Project Team" value={people.length} to="/team">
          <span className="muted">
            {COORDINATORS.length} coordinators · {TEAM_LEADS.length} leads · {FIELD_MEMBERS.length} field
          </span>
        </KpiCard>
        <KpiCard tone="tone-attention" icon={Briefcase} label="On Projects" value={people.length - free.length}>
          <span className="muted">{people.filter((p) => p.load.label === 'Busy').length} carrying 3 or more</span>
        </KpiCard>
        <KpiCard tone="tone-good" icon={UserCheck} label="Free Now" value={free.length} to={tabLink('/team', 'free')}>
          <span className="muted">{free.length ? free.map((p) => p.name).join(', ') : 'Everyone is on a project'}</span>
        </KpiCard>
        <KpiCard tone={tasks.some((t) => t.overdue) ? 'tone-urgent' : 'tone-good'} icon={AlertTriangle} label="Overdue Tasks" value={tasks.filter((t) => t.overdue).length} to={tabLink('/tasks', 'Overdue')}>
          <span className="muted">Across the whole team</span>
        </KpiCard>
      </section>

      <section className="card">
        <nav className="stage-tabs" aria-label="Filter by role">
          {[{ key: 'all', label: 'Everyone' }, ...GROUPS, { key: 'free', label: 'Free now' }].map((g) => (
            <button key={g.key} className={`stage-tab ${group === g.key ? 'is-active' : ''}`} onClick={() => setGroup(g.key)} aria-pressed={group === g.key}>
              {g.label}
              <span>{g.key === 'all' ? people.length : g.key === 'free' ? free.length : people.filter((p) => p.group.key === g.key).length}</span>
            </button>
          ))}
        </nav>
        <div className="table-wrap">
          <table className="data-table team-table">
            <thead>
              <tr>
                <th>Person</th>
                <th>Works on</th>
                <th>Running projects</th>
                <th className="num">Open tasks</th>
                <th className="num">Overdue</th>
                <th className="num">Visits (30 days)</th>
                <th>Load</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((p) => (
                <tr key={p.name}>
                  <td>
                    <span className="person">
                      <span className="avatar small-avatar">{initials(p.name)}</span>
                      <span>
                        <strong>{p.name}</strong>
                        <span className="muted">{p.title}</span>
                      </span>
                    </span>
                  </td>
                  <td>
                    <div className="cell-sub team-about">{p.group.about(p)}</div>
                  </td>
                  <td>
                    {p.projects.length ? (
                      <div className="team-projects">
                        {p.projects.slice(0, 3).map((pr) => (
                          <Link key={pr.id} to={`/projects/${pr.id}`} className="cell-link" title={`${pr.name} · ${pr.lead.company}`}>
                            {pr.lead.company}
                          </Link>
                        ))}
                        {p.projects.length > 3 && <span className="muted">+{p.projects.length - 3} more</span>}
                      </div>
                    ) : (
                      <span className="muted">—</span>
                    )}
                  </td>
                  <td className="num">{p.open}</td>
                  <td className={`num ${p.overdue ? 'text-red' : 'muted'}`}>{p.overdue}</td>
                  <td className="num">{p.group.key === 'member' || p.visits ? p.visits : <span className="muted">—</span>}</td>
                  <td>
                    <span className={`pill status-pill ${p.load.tone}`}>{p.load.label}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
