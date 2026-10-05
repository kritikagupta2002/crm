import { AlertTriangle, CalendarClock, CheckCircle2, FileText, ListChecks, Search } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { KpiCard } from '../../../shared/components/KpiCard'
import { usePaged } from '../../../shared/components/Pager'
import { tabLink, useTabParam } from '../../../shared/hooks/useTabParam'
import { WarningLetterModal } from '../components/WarningLetterModal'
import { useAccess, useCrm } from '../../../core/permissions/crm'
import { TODAY } from '../../crm/data/mockData'
import { COORDINATORS, FIELD_MEMBERS, TEAM_LEADS } from '../data/staff'
import { addDays, formatNearDate, toISODate } from '../../../shared/utils/date'
import { canIssueWarningLetter, findIssuedWarningLetter, formatOverdueLabel } from '../utils/overdue'
import { TASK_STATUS, allProjects } from '../utils/projects'
import './erm.css'

const todayISO = toISODate(TODAY)
const weekISO = toISODate(addDays(TODAY, 7))
const monthStartISO = todayISO.slice(0, 8) + '01'
const PEOPLE = [...COORDINATORS, ...TEAM_LEADS, ...FIELD_MEMBERS]

const TABS = {
  Open: (t) => t.status !== 'done',
  Overdue: (t) => t.overdue,
  'This week': (t) => t.status !== 'done' && t.due && t.due >= todayISO && t.due <= weekISO,
  Unassigned: (t) => t.status !== 'done' && !t.assignee,
  Done: (t) => t.status === 'done',
}

/* Every task on every running project in one list: who has what, what is late, and what is due next. */
export function TasksPage() {
  const { leads, projectEdits, updateProjectTask, warningLetters } = useCrm()
  const access = useAccess()
  // Management follows the work; the project team changes it.
  const readOnly = !access.may('projects')
  const canIssueLetters = access.may('warningLetters')
  const [tab, setTab] = useTabParam(Object.keys(TABS), 'Open')
  const [person, setPerson] = useState('')
  const [search, setSearch] = useState('')
  const [selectedTaskProject, setSelectedTaskProject] = useState(null)

  const projects = allProjects(leads, projectEdits).filter((p) => p.status !== 'Completed')
  const tasks = projects
    .flatMap((p) => p.tasks.map((t) => ({ ...t, project: p })))
    .sort((a, b) => (a.status === 'done') - (b.status === 'done') || (a.due ?? '9').localeCompare(b.due ?? '9'))
  const q = search.trim().toLowerCase()
  const mine = tasks.filter((t) => !person || t.assignee === person)
  const visible = mine.filter(TABS[tab]).filter((t) => !q || `${t.title} ${t.project.name} ${t.project.id} ${t.project.lead.company}`.toLowerCase().includes(q))
  const { rows, pager } = usePaged(visible, 12, `${tab}|${person}|${q}`)
  const doneThisMonth = tasks.filter((t) => t.status === 'done' && t.doneOn && t.doneOn >= monthStartISO).length

  return (
    <div className="module-page">
      <header className="page-header">
        <div className="page-title">
          <h1>Tasks</h1>
          <p>
            {tasks.filter(TABS.Open).length} open tasks across {projects.length} running projects
          </p>
        </div>
      </header>

      <section className="stat-grid">
        <KpiCard tone="tone-info" icon={ListChecks} label="Open Tasks" value={mine.filter(TABS.Open).length} to={tabLink('/tasks', 'Open')}>
          <span className="muted">{mine.filter(TABS.Unassigned).length} without an owner</span>
        </KpiCard>
        <KpiCard tone={mine.filter(TABS.Overdue).length ? 'tone-urgent' : 'tone-good'} icon={AlertTriangle} label="Overdue" value={mine.filter(TABS.Overdue).length} to={tabLink('/tasks', 'Overdue')}>
          <span className="muted">Past their due date</span>
        </KpiCard>
        <KpiCard tone="tone-attention" icon={CalendarClock} label="Due This Week" value={mine.filter(TABS['This week']).length} to={tabLink('/tasks', 'This week')}>
          <span className="muted">Next 7 days</span>
        </KpiCard>
        <KpiCard tone="tone-good" icon={CheckCircle2} to={tabLink('/tasks', 'Done')} label="Done This Month" value={person ? mine.filter((t) => t.status === 'done' && t.doneOn >= monthStartISO).length : doneThisMonth}>
          <span className="muted">Tasks closed since the 1st</span>
        </KpiCard>
      </section>

      <section className="card">
        <div className="leads-toolbar">
          <label className="toolbar-search">
            <Search size={16} className="muted" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search task, project or client" aria-label="Search tasks" />
          </label>
          <select value={person} onChange={(e) => setPerson(e.target.value)} aria-label="Filter by person">
            <option value="">Everyone</option>
            {PEOPLE.map((p) => (
              <option key={p.name} value={p.name}>
                {p.name} — {p.title}
              </option>
            ))}
          </select>
        </div>
        <nav className="stage-tabs" aria-label="Filter tasks">
          {Object.keys(TABS).map((t) => (
            <button key={t} className={`stage-tab ${tab === t ? 'is-active' : ''}`} onClick={() => setTab(t)} aria-pressed={tab === t}>
              {t}
              <span>{mine.filter(TABS[t]).length}</span>
            </button>
          ))}
        </nav>

        {visible.length === 0 ? (
          <p className="empty-state">{tab === 'Overdue' ? 'Nothing is late.' : 'No tasks here.'}</p>
        ) : (
          <div className="table-wrap">
            <table className="data-table task-table">
              <thead>
                <tr>
                  <th>Task</th>
                  <th>Project</th>
                  <th>Owner</th>
                  <th>Due</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((t) => {
                  const issued = findIssuedWarningLetter(t, t.project, warningLetters)
                  const canWarn = canIssueWarningLetter(t)
                  return (
                    <tr key={`${t.project.id}-${t.key ?? t.id}`} className={t.status === 'done' ? 'is-done' : ''}>
                      <td>
                        <div className="cell-strong">{t.title}</div>
                        <div className="cell-sub">{t.standard ? 'Standard step' : 'Added by the team'}</div>
                      </td>
                      <td>
                        <Link to={`/projects/${t.project.id}?tab=tasks`} className="cell-strong cell-link">
                          {t.project.name}
                        </Link>
                        <div className="cell-sub">
                          {t.project.id} · {t.project.lead.company}
                        </div>
                      </td>
                      <td>
                        <select value={t.assignee ?? ''} onChange={(e) => updateProjectTask(t.project.lead.id, t.project, t, { assignee: e.target.value || null })} aria-label={`Owner of ${t.title}`} disabled={readOnly}>
                          <option value="">Unassigned</option>
                          {PEOPLE.map((p) => (
                            <option key={p.name}>{p.name}</option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <input
                          type="date"
                          className={t.overdue ? 'is-overdue' : undefined}
                          value={t.due ?? ''}
                          onChange={(e) => updateProjectTask(t.project.lead.id, t.project, t, { due: e.target.value || null })}
                          aria-label={`Due date of ${t.title}`}
                          disabled={t.status === 'done' || readOnly}
                        />
                        {t.overdue && <div className="cell-sub text-red font-medium">{formatOverdueLabel(t.overdueDays)}</div>}
                        {t.status === 'done' && t.doneOn && <div className="cell-sub">Done {formatNearDate(t.doneOn)}</div>}
                      </td>
                      <td>
                        <select className={`task-status status-${t.status}`} value={t.status} onChange={(e) => updateProjectTask(t.project.lead.id, t.project, t, { status: e.target.value })} aria-label={`Status of ${t.title}`} disabled={readOnly}>
                          {Object.entries(TASK_STATUS).map(([value, label]) => (
                            <option key={value} value={value}>
                              {label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>
                        {issued ? (
                          <button
                            type="button"
                            className="badge-warning-issued"
                            onClick={() => setSelectedTaskProject({ task: t, project: t.project })}
                            title={`Warning letter ${issued.letterNumber} issued on ${issued.issuedDate}. Click to view/print.`}
                          >
                            <FileText size={12} /> Warning Issued
                          </button>
                        ) : canWarn && canIssueLetters ? (
                          <button
                            type="button"
                            className="btn-warning-action"
                            onClick={() => setSelectedTaskProject({ task: t, project: t.project })}
                            title="Task is overdue by 3+ days. Click to issue formal warning letter."
                          >
                            <FileText size={12} /> Warning Letter
                          </button>
                        ) : (
                          <span className="muted small">—</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
        {pager}
      </section>

      {selectedTaskProject && (
        <WarningLetterModal
          task={selectedTaskProject.task}
          project={selectedTaskProject.project}
          onClose={() => setSelectedTaskProject(null)}
        />
      )}
    </div>
  )
}

