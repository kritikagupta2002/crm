import { CircleDashed, Clock, FolderKanban, GanttChart, Landmark, List, Plus, ScrollText, Search, X } from 'lucide-react'
import { useCallback, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { KpiCard } from '../../components/common/KpiCard'
import { usePaged } from '../../components/common/Pager'
import { tabLink, useTabParam } from '../../components/common/useTabParam'
import { ProgressBar } from '../../components/common/Checklist'
import { useCrm } from '../../context/crm'
import { TODAY } from '../../data/mockData'
import { addDays, formatNearDate, toISODate } from '../../utils/date'
import { ERM_STAGES, PROJECT_STATUS_TONE, allProjects } from '../../utils/projects'
import { LettersCard } from './LettersCard'
import { NewProjectDrawer } from './NewProjectDrawer'
import { ProjectTimeline } from './ProjectTimeline'
import './erm.css'

const TABS = ['All', 'In progress', 'Awaiting approval', 'Approved', 'Completed', 'Not started']
const monthAgoISO = toISODate(addDays(TODAY, -30))

/* Every won client's projects in one list: where the work is, which approval is with which authority, and the letters received. */
export function ProjectsPage() {
  const { leads, projectEdits, role } = useCrm()
  const [params, setParams] = useSearchParams()
  const navigate = useNavigate()
  const stageKey = params.get('stage')
  const stageIndex = ERM_STAGES.findIndex((st) => st.key === stageKey)
  const [tab, setTab] = useTabParam(TABS, 'All')
  const [search, setSearch] = useState('')
  const [creating, setCreating] = useState(false)
  const view = params.get('view') === 'timeline' ? 'timeline' : 'list'
  const switchView = (next) => {
    const nextParams = new URLSearchParams(params)
    if (next === 'timeline') nextParams.set('view', 'timeline')
    else nextParams.delete('view')
    setParams(nextParams, { replace: true })
  }
  const closeCreate = useCallback(() => setCreating(false), [])
  const clients = leads.filter((l) => l.stage === 'Won').sort((a, b) => a.company.localeCompare(b.company))

  const projects = allProjects(leads, projectEdits)
  const count = (status) => projects.filter((p) => p.status === status).length
  const q = search.trim().toLowerCase()
  const visible = projects
    .filter((p) => tab === 'All' || p.status === tab)
    .filter((p) => stageIndex < 0 || p.stageIndex === stageIndex)
    .filter((p) => !q || `${p.name} ${p.id} ${p.lead.company} ${p.authority} ${p.site}`.toLowerCase().includes(q))
  const letters = projects
    .flatMap((p) => p.letters.map((letter) => ({ letter, project: p })))
    .sort((a, b) => b.letter.date.localeCompare(a.letter.date))
  const { rows: pageRows, pager } = usePaged(visible, 10, `${tab}|${q}|${stageKey}`)
  const recentLetters = letters.filter(({ letter }) => letter.date >= monthAgoISO).length

  return (
    <div className="module-page">
      <header className="page-header">
        <div className="page-title">
          <h1>Projects &amp; Approvals</h1>
          <p>
            {projects.length} projects · {count('Awaiting approval')} with the authority
          </p>
        </div>
        {['Admin', 'Project Coordinator'].includes(role) && clients.length > 0 && (
          <div className="page-actions">
            <button className="btn btn-primary" onClick={() => setCreating(true)}>
              <Plus size={16} /> New Project
            </button>
          </div>
        )}
      </header>

      <section className="stat-grid">
        <KpiCard tone="tone-info" icon={FolderKanban} label="Work in Progress" value={count('In progress')} to={tabLink('/projects', 'In progress')}>
          <span className="muted">Survey, analysis or report</span>
        </KpiCard>
        <KpiCard tone="tone-attention" icon={Landmark} label="With the Authority" value={count('Awaiting approval')} to={tabLink('/projects', 'Awaiting approval')}>
          <span className="muted">Submitted, approval pending</span>
        </KpiCard>
        <KpiCard tone="tone-good" icon={ScrollText} label="Letters Received" value={recentLetters} to="/projects?letters=All">
          <span className="muted">
            In the last 30 days · {letters.filter(({ letter }) => !letter.sharedOn).length} to share
          </span>
        </KpiCard>
        <KpiCard tone="tone-neutral" icon={CircleDashed} label="Not Started" value={count('Not started')} to={tabLink('/projects', 'Not started')}>
          <span className="muted">Waiting on onboarding</span>
        </KpiCard>
      </section>

      <section className="card">
        <div className="leads-toolbar">
          <label className="toolbar-search">
            <Search size={16} className="muted" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search project, client, authority or place" aria-label="Search projects" />
          </label>
          {stageIndex >= 0 && (
            <button className="filter-chip" onClick={() => setParams(view === 'timeline' ? { view } : {}, { replace: true })}>
              Stage: {ERM_STAGES[stageIndex].label} <X size={13} />
            </button>
          )}
          <div className="segmented view-switch" role="group" aria-label="View">
            <button aria-pressed={view === 'list'} className={view === 'list' ? 'is-selected' : ''} onClick={() => switchView('list')}>
              <List size={15} /> List
            </button>
            <button aria-pressed={view === 'timeline'} className={view === 'timeline' ? 'is-selected' : ''} onClick={() => switchView('timeline')}>
              <GanttChart size={15} /> Timeline
            </button>
          </div>
        </div>
        <nav className="stage-tabs" aria-label="Filter by status">
          {TABS.map((t) => (
            <button key={t} className={`stage-tab ${tab === t ? 'is-active' : ''}`} onClick={() => setTab(t)} aria-pressed={tab === t}>
              {t}
              <span>{t === 'All' ? projects.length : count(t)}</span>
            </button>
          ))}
        </nav>
        {visible.length === 0 ? (
          <p className="empty-state">No projects here.</p>
        ) : view === 'timeline' ? (
          <ProjectTimeline projects={visible} />
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Project</th>
                  <th>Client</th>
                  <th>Stage</th>
                  <th>Now at</th>
                  <th>Progress</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {pageRows.map((p) => (
                  <tr key={p.id} className="clickable-row" onClick={() => navigate(`/projects/${p.id}`)}>
                    <td>
                      <button className="row-link">{p.name}</button>
                      <div className="cell-sub">{p.id}</div>
                    </td>
                    <td>
                      <div className="cell-strong">{p.lead.company}</div>
                      <div className="cell-sub">{p.site}</div>
                    </td>
                    <td>
                      <div className="cell-strong nowrap">{p.stageIndex < ERM_STAGES.length ? ERM_STAGES[p.stageIndex].label : 'Complete'}</div>
                      <div className="cell-sub">
                        Stage {Math.min(p.stageIndex + 1, ERM_STAGES.length)} of {ERM_STAGES.length} · {p.code}
                      </div>
                    </td>
                    <td>
                      <div className="cell-clip">{p.now.label}</div>
                      {p.now.date && (
                        <div className="cell-sub">
                          <Clock size={11} /> {p.now.date < toISODate(TODAY) ? 'since' : 'planned'} {formatNearDate(p.now.date)}
                        </div>
                      )}
                    </td>
                    <td className="progress-cell">
                      <ProgressBar done={p.milestonesDone + p.approvalsDone} total={p.milestones.length + p.approvals.length} tone={PROJECT_STATUS_TONE[p.status]} />
                      <span className="cell-sub">
                        Work {p.milestonesDone}/{p.milestones.length} · Approval {p.approvalsDone}/{p.approvals.length}
                      </span>
                    </td>
                    <td>
                      <span className={`pill status-pill ${PROJECT_STATUS_TONE[p.status]}`}>{p.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {view === 'list' && pager}
      </section>

      <LettersCard projects={projects} />

      {creating && <NewProjectDrawer clients={clients} projects={projects} onClose={closeCreate} onCreated={(id) => navigate(`/projects/${id}`)} />}
    </div>
  )
}
