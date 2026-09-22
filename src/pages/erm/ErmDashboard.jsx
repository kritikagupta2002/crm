import { AlertTriangle, CalendarClock, FolderKanban, Landmark, UserCog, Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import { KpiCard } from '../../components/common/KpiCard'
import { tabLink } from '../../components/common/useTabParam'
import { useCrm } from '../../context/crm'
import { TODAY } from '../../data/mockData'
import { TEAM_LEADS } from '../../data/staff'
import { addDays, formatLongDate, formatNearDate, toISODate } from '../../utils/date'
import { ERM_STAGES, allProjects } from '../../utils/projects'
import '../projects/erm.css'

const todayISO = toISODate(TODAY)
const weekISO = toISODate(addDays(TODAY, 7))

/* Project delivery at a glance: where every project stands, what is late, and who is carrying the work. */
export function ErmDashboard() {
  const { leads, projectEdits } = useCrm()
  const projects = allProjects(leads, projectEdits)
  const active = projects.filter((p) => p.stageIndex < ERM_STAGES.length)
  const openTasks = active.flatMap((p) => p.tasks.filter((t) => t.status !== 'done').map((t) => ({ task: t, project: p })))
  const overdue = openTasks.filter(({ task }) => task.overdue)
  const dueThisWeek = openTasks.filter(({ task }) => task.due && task.due >= todayISO && task.due <= weekISO)
  const withAuthority = active.filter((p) => ERM_STAGES[p.stageIndex].key === 'approval')

  // Hand-overs waiting on a person: no coordinator, no team, owners missing or closure pending; and anything overdue.
  const waiting = active
    .filter((p) => ['allocation', 'planning', 'tasks', 'closure'].includes(ERM_STAGES[p.stageIndex].key))
    .map((p) => ({ id: `s-${p.id}`, project: p, text: ERM_STAGES[p.stageIndex].todo, who: ERM_STAGES[p.stageIndex].owner, tone: 'tone-attention' }))
  const late = overdue.map(({ task, project }) => ({ id: `t-${project.id}-${task.key ?? task.id}`, project, text: `${task.title} — due ${formatNearDate(task.due)}`, who: task.assignee ?? 'Unassigned', tone: 'tone-urgent' }))
  const attention = [...late, ...waiting]

  const leadsLoad = TEAM_LEADS.map((t) => {
    const mine = active.filter((p) => p.team.teamLead === t.name)
    const tasks = mine.flatMap((p) => p.tasks.filter((x) => x.status !== 'done'))
    return { ...t, projects: mine.length, open: tasks.length, overdue: tasks.filter((x) => x.overdue).length }
  })

  return (
    <div className="module-page erm-dashboard">
      <header className="page-header">
        <div className="page-title">
          <h1>ERM Dashboard</h1>
          <p>
            {formatLongDate(TODAY)} · {active.length} active projects
          </p>
        </div>
      </header>

      <section className="stat-grid">
        <KpiCard tone="tone-info" icon={FolderKanban} label="Active Projects" value={active.length} to="/projects">
          <span className="muted">{projects.length - active.length} completed</span>
        </KpiCard>
        <KpiCard tone={overdue.length ? 'tone-urgent' : 'tone-good'} icon={AlertTriangle} label="Overdue Tasks" value={overdue.length} to={tabLink('/tasks', 'Overdue')}>
          <span className="muted">{overdue.length ? 'Past their due date' : 'Nothing late'}</span>
        </KpiCard>
        <KpiCard tone="tone-attention" icon={CalendarClock} label="Due This Week" value={dueThisWeek.length} to={tabLink('/tasks', 'This week')}>
          <span className="muted">Open tasks, next 7 days</span>
        </KpiCard>
        <KpiCard tone="tone-attention" icon={Landmark} label="With the Authority" value={withAuthority.length} to="/projects?stage=approval">
          <span className="muted">Submitted, approval pending</span>
        </KpiCard>
      </section>

      <section className="card">
        <header className="card-header">
          <FolderKanban size={18} className="card-icon" />
          <h2>Projects by Stage</h2>
          <div className="card-actions">{active.length} running · click a stage to see its projects</div>
        </header>
        <ol className="stage-counts">
          {ERM_STAGES.map((st, i) => {
            const count = active.filter((p) => p.stageIndex === i).length
            return (
              <li key={st.key} className={count ? 'has-items' : ''}>
                <Link to={`/projects?stage=${st.key}`} aria-label={`${st.label}: ${count} projects`}>
                  <span className="stage-name">
                    <span className="stage-num">{i + 1}</span>
                    {st.label}
                  </span>
                  <span className="stage-count">
                    <strong>{count}</strong> {count === 1 ? 'project' : 'projects'}
                  </span>
                  <span className="stage-state">{count ? st.waiting : 'None right now'}</span>
                  <span className="muted">Owner · {st.owner}</span>
                </Link>
              </li>
            )
          })}
        </ol>
      </section>

      <div className="erm-row">
        <section className="card">
          <header className="card-header">
            <UserCog size={18} className="card-icon" />
            <h2>Needs Attention</h2>
            <div className="card-actions">{attention.length} items</div>
          </header>
          {attention.length === 0 ? (
            <p className="empty-state">Every project is moving. Nothing overdue or waiting on a hand-over.</p>
          ) : (
            <ul className="attention-list">
              {attention.slice(0, 8).map((a) => (
                <li key={a.id} className={a.tone}>
                  <i />
                  <Link to={`/projects/${a.project.id}${a.tone === 'tone-urgent' ? '?tab=tasks' : ''}`}>
                    <strong>{a.project.lead.company}</strong>
                    <span className="muted">
                      {a.project.name} · {a.text}
                    </span>
                  </Link>
                  <span className="attention-who">{a.who}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card">
          <header className="card-header">
            <Users size={18} className="card-icon" />
            <h2>Team Leads</h2>
          </header>
          <div className="table-wrap">
            <table className="data-table load-table">
              <thead>
                <tr>
                  <th>Team lead</th>
                  <th className="num">Projects</th>
                  <th className="num">Open tasks</th>
                  <th className="num">Overdue</th>
                </tr>
              </thead>
              <tbody>
                {leadsLoad.map((t) => (
                  <tr key={t.name}>
                    <td>
                      <div className="cell-strong">{t.name}</div>
                      <div className="cell-sub">{t.title}</div>
                    </td>
                    <td className="num">{t.projects}</td>
                    <td className="num">{t.open}</td>
                    <td className={`num ${t.overdue ? 'text-red' : ''}`}>{t.overdue}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  )
}
