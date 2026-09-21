import { CircleDashed, Clock, Download, FolderKanban, Landmark, ScrollText, Search, X } from 'lucide-react'
import { useCallback, useEffect, useId, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { KpiCard } from '../../components/common/KpiCard'
import { usePaged } from '../../components/common/Pager'
import { ProgressBar } from '../../components/common/Checklist'
import { Portal } from '../../components/common/Portal'
import { useAccess, useCrm } from '../../context/crm'
import { TODAY } from '../../data/mockData'
import { addDays, formatNearDate, toISODate } from '../../utils/date'
import { downloadLetter } from '../../utils/files'
import { PROJECT_STATUS_TONE, allProjects } from '../../utils/projects'
import { ProjectBlock } from '../clients/ProjectPanel'

const TABS = ['All', 'In progress', 'Awaiting approval', 'Completed', 'Not started']
const monthAgoISO = toISODate(addDays(TODAY, -30))

function ProjectDrawer({ project, onClose }) {
  const { can } = useAccess()
  const titleId = useId()

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [onClose])

  const { lead } = project
  return (
    <Portal>
      <div className="drawer-root">
        <div className="drawer-backdrop" onClick={onClose} />
        <aside className="enquiry-drawer lead-drawer" role="dialog" aria-modal="true" aria-labelledby={titleId}>
          <header className="drawer-header">
            <div className="lead-drawer-title">
              <h2 id={titleId}>{lead.company}</h2>
              <span className="muted">
                {project.site} · {can('/leads') ? <Link to={`/leads/${lead.id}`}>{lead.id}</Link> : lead.id} · <Link to={`/portal?lead=${lead.id}`}>Client portal view</Link>
              </span>
            </div>
            <button className="icon-button" onClick={onClose} aria-label="Close">
              <X size={20} />
            </button>
          </header>
          <div className="drawer-body lead-drawer-body">
            <ProjectBlock lead={lead} project={project} />
          </div>
        </aside>
      </div>
    </Portal>
  )
}

/* Every won client's projects in one list: where the work is, which approval is with which authority, and the letters received. */
export function ProjectsPage() {
  const { leads, projectEdits, settings } = useCrm()
  const [params, setParams] = useSearchParams()
  const [tab, setTab] = useState('All')
  const [search, setSearch] = useState('')
  const [allLetters, setAllLetters] = useState(false)

  const projects = allProjects(leads, projectEdits)
  const count = (status) => projects.filter((p) => p.status === status).length
  const q = search.trim().toLowerCase()
  const visible = projects
    .filter((p) => tab === 'All' || p.status === tab)
    .filter((p) => !q || `${p.name} ${p.id} ${p.lead.company} ${p.authority} ${p.site}`.toLowerCase().includes(q))
  const letters = projects
    .flatMap((p) => p.letters.map((letter) => ({ letter, project: p })))
    .sort((a, b) => b.letter.date.localeCompare(a.letter.date))
  const { rows: pageRows, pager } = usePaged(visible, 10, `${tab}|${q}`)
  const recentLetters = letters.filter(({ letter }) => letter.date >= monthAgoISO).length

  const openId = params.get('open')
  const open = projects.find((p) => p.id === openId)
  const close = useCallback(() => setParams({}, { replace: true }), [setParams])

  return (
    <div className="module-page">
      <header className="page-header">
        <div className="page-title">
          <h1>Projects &amp; Approvals</h1>
          <p>
            {projects.length} projects · {count('Awaiting approval')} with the authority
          </p>
        </div>
      </header>

      <section className="stat-grid">
        <KpiCard tone="tone-info" icon={FolderKanban} label="Work in Progress" value={count('In progress')}>
          <span className="muted">Survey, analysis or report</span>
        </KpiCard>
        <KpiCard tone="tone-attention" icon={Landmark} label="With the Authority" value={count('Awaiting approval')}>
          <span className="muted">Submitted, approval pending</span>
        </KpiCard>
        <KpiCard tone="tone-good" icon={ScrollText} label="Letters Received" value={recentLetters}>
          <span className="muted">In the last 30 days</span>
        </KpiCard>
        <KpiCard tone="tone-neutral" icon={CircleDashed} label="Not Started" value={count('Not started')}>
          <span className="muted">Waiting on onboarding</span>
        </KpiCard>
      </section>

      <section className="card">
        <div className="leads-toolbar">
          <label className="toolbar-search">
            <Search size={16} className="muted" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search project, client, authority or place" aria-label="Search projects" />
          </label>
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
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Project</th>
                  <th>Client</th>
                  <th>Authority</th>
                  <th>Now at</th>
                  <th>Progress</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {pageRows.map((p) => (
                  <tr key={p.id} className="clickable-row" onClick={() => setParams({ open: p.id }, { replace: true })}>
                    <td>
                      <button className="row-link">{p.name}</button>
                      <div className="cell-sub">{p.id}</div>
                    </td>
                    <td>
                      <div className="cell-strong">{p.lead.company}</div>
                      <div className="cell-sub">{p.site}</div>
                    </td>
                    <td>
                      <div className="cell-clip" title={p.authority}>
                        {p.code}
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
        {pager}
      </section>

      <section className="card">
        <header className="card-header">
          <ScrollText size={18} className="card-icon" />
          <h2>Government letters</h2>
          <div className="card-actions">{letters.length} on record</div>
        </header>
        <ul className="letter-list letters-page">
          {letters.slice(0, allLetters ? letters.length : 5).map(({ letter, project }) => (
            <li key={letter.id}>
              <ScrollText size={16} />
              <span>
                <strong>{letter.title}</strong>
                <span className="muted">
                  {project.lead.company} · {project.name} · {letter.ref} · {formatNearDate(letter.date)}
                </span>
              </span>
              <button className="icon-button small" onClick={() => downloadLetter(letter, { project, lead: project.lead, companyName: settings.companyName })} aria-label={`Download ${letter.title}`}>
                <Download size={15} />
              </button>
            </li>
          ))}
        </ul>
        {letters.length > 5 && (
          <button className="link-button show-more" onClick={() => setAllLetters(!allLetters)}>
            {allLetters ? 'Show fewer' : `Show all ${letters.length} letters`}
          </button>
        )}
      </section>

      {open && <ProjectDrawer key={open.id} project={open} onClose={close} />}
    </div>
  )
}
