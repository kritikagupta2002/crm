import { useState } from 'react'
import { AlertTriangle, BarChart3, Calendar, CheckCircle2, Download, ExternalLink, FolderKanban, Landmark, Layers, PieChart as PieIcon, Timer, Users } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Link } from 'react-router-dom'
import { Bars } from '../../../shared/components/Bars'
import { KpiCard } from '../../../shared/components/KpiCard'
import { tabLink } from '../../../shared/hooks/useTabParam'
import { useCrm } from '../../../core/permissions/crm'
import { TODAY } from '../../crm/data/mockData'
import { COORDINATORS, FIELD_MEMBERS, TEAM_LEADS } from '../../erm/data/staff'
import { formatDate, monthShort, parseISODate } from '../../../shared/utils/date'
import { downloadCsv } from '../../../shared/utils/exportCsv'
import { ERM_STAGES, allProjects } from '../../erm/utils/projects'
import { ONBOARDING_STEPS, progressOf } from '../../crm/utils/workflow'
import '../../erm/pages/erm.css'

const DAY = 86_400_000
const daysBetween = (a, b) => Math.round((parseISODate(b) - parseISODate(a)) / DAY)
const avg = (list) => (list.length ? Math.round(list.reduce((s, n) => s + n, 0) / list.length) : 0)
const year = String(TODAY.getFullYear())

/* Started, submitted and closed projects in each of the last six months. */
function monthlyFlow(projects) {
  return Array.from({ length: 6 }, (_, i) => {
    const month = new Date(TODAY.getFullYear(), TODAY.getMonth() - 5 + i, 1)
    const key = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, '0')}`
    const inMonth = (iso) => Boolean(iso) && iso.slice(0, 7) === key
    return {
      month: monthShort(month),
      Started: projects.filter((p) => p.started && inMonth(p.startedOn)).length,
      Submitted: projects.filter((p) => p.submission && inMonth(p.submission.date)).length,
      Closed: projects.filter((p) => inMonth(p.closure.closedOn)).length,
    }
  })
}

/* MIS view of project delivery: flow of work, where projects sit, how long approvals take and who is carrying the load. */
export function ProjectReports({ switcher }) {
  const { leads, projectEdits } = useCrm()
  const [statusFilter, setStatusFilter] = useState('all')
  const [timelineServiceFilter, setTimelineServiceFilter] = useState('all')

  const projects = allProjects(leads, projectEdits)

  // Real client status derived from won leads
  const wonClients = leads.filter((l) => l.stage === 'Won')
  const activeClientsCount = wonClients.filter((l) => progressOf(ONBOARDING_STEPS, l.onboarding) === ONBOARDING_STEPS.length).length
  const onboardingClientsCount = wonClients.length - activeClientsCount
  const clientStatusData = [
    { name: 'Active', value: activeClientsCount, color: '#10B981' },
    { name: 'Onboarding', value: onboardingClientsCount, color: '#0D9488' },
  ].filter((item) => item.value > 0)

  // Real timeline projects filtered by status and service
  const timelineProjects = projects.filter((p) => {
    if (statusFilter === 'running' && p.stageIndex >= ERM_STAGES.length) return false
    if (statusFilter === 'completed' && !p.closure.closedOn) return false
    if (statusFilter === 'approval' && p.status !== 'Awaiting approval') return false
    if (timelineServiceFilter !== 'all' && p.service !== timelineServiceFilter) return false
    return true
  })
  const active = projects.filter((p) => p.stageIndex < ERM_STAGES.length)
  const closedThisYear = projects.filter((p) => p.closure.closedOn?.startsWith(year))
  const approved = projects.filter((p) => p.approvalsDone === p.approvals.length && p.submission)
  const approvalDays = approved.map((p) => daysBetween(p.submission.date, p.approvals[p.approvals.length - 1].date))
  const openTasks = active.flatMap((p) => p.tasks.filter((t) => t.status !== 'done'))
  const overdue = openTasks.filter((t) => t.overdue)

  const byStage = ERM_STAGES.map((st, i) => ({ label: `${i + 1}. ${st.label}`, count: active.filter((p) => p.stageIndex === i).length, note: st.owner }))

  const projectExecutionStatusData = [
    { name: 'Delivered & Closed', value: projects.filter((p) => p.closure.closedOn).length, color: '#10B981' },
    { name: 'With Approval Authority', value: active.filter((p) => ERM_STAGES[p.stageIndex]?.key === 'approval').length, color: '#F59E0B' },
    { name: 'Active Field Execution', value: active.filter((p) => ERM_STAGES[p.stageIndex]?.key !== 'approval').length, color: '#2563EB' },
  ].filter((item) => item.value > 0)

  const STAGE_COLORS = ['#2563EB', '#0D9488', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4', '#64748B']
  const stagePieData = byStage.map((st, idx) => ({
    name: st.label,
    value: st.count,
    owner: st.note,
    color: STAGE_COLORS[idx % STAGE_COLORS.length],
  })).filter((st) => st.value > 0)

  const authorities = [...new Set(projects.map((p) => p.code))].map((code) => {
    const mine = projects.filter((p) => p.code === code)
    const done = approved.filter((p) => p.code === code)
    const waiting = mine.filter((p) => p.status === 'Awaiting approval').length
    return {
      label: code,
      count: avg(done.map((p) => daysBetween(p.submission.date, p.approvals[p.approvals.length - 1].date))),
      note: done.length ? `days avg · ${done.length} approved${waiting ? ` · ${waiting} waiting` : ''}` : `no approval yet${waiting ? ` · ${waiting} waiting` : ''}`,
    }
  }).sort((a, b) => b.count - a.count)

  const services = [...new Set(projects.map((p) => p.service))]
    .map((service) => {
      const mine = projects.filter((p) => p.service === service)
      return { label: service, count: mine.length, note: `${mine.filter((p) => p.stageIndex < ERM_STAGES.length).length} running` }
    })
    .sort((a, b) => b.count - a.count)

  const everyone = [
    ...COORDINATORS.map((p) => ({ ...p, key: 'coordinator' })),
    ...TEAM_LEADS.map((p) => ({ ...p, key: 'teamLead' })),
    ...FIELD_MEMBERS.map((p) => ({ ...p, key: 'member' })),
  ]
  const team = everyone.map((person) => {
    const onProject = (p) => (person.key === 'member' ? p.team.members?.includes(person.name) : p.team[person.key] === person.name)
    const tasks = projects.flatMap((p) => p.tasks).filter((t) => t.assignee === person.name)
    return {
      name: person.name,
      title: person.title,
      running: active.filter(onProject).length,
      delivered: projects.filter((p) => p.closure.closedOn && onProject(p)).length,
      done: tasks.filter((t) => t.status === 'done').length,
      open: tasks.filter((t) => t.status !== 'done').length,
      overdue: tasks.filter((t) => t.overdue).length,
      visits: projects.flatMap((p) => p.fieldVisits).filter((v) => v.by === person.name).length,
    }
  })

  const exportTeam = () =>
    downloadCsv('erm-team-performance.csv', [
      { label: 'Person', value: (r) => r.name },
      { label: 'Role', value: (r) => r.title },
      { label: 'Running projects', value: (r) => r.running },
      { label: 'Projects delivered', value: (r) => r.delivered },
      { label: 'Tasks done', value: (r) => r.done },
      { label: 'Open tasks', value: (r) => r.open },
      { label: 'Overdue tasks', value: (r) => r.overdue },
      { label: 'Field visits', value: (r) => r.visits },
    ], team)

  return (
    <div className="module-page">
      <header className="page-header">
        <div className="page-title">
          <h1>Reports</h1>
          <p>{projects.length} projects on record · project delivery at a glance</p>
        </div>
        {switcher && <div className="page-actions">{switcher}</div>}
      </header>

      <section className="stat-grid">
        <KpiCard tone="tone-info" icon={FolderKanban} label="Running Projects" value={active.length} to="/projects">
          <span className="muted">{active.filter((p) => ERM_STAGES[p.stageIndex].key === 'approval').length} with the authority</span>
        </KpiCard>
        <KpiCard tone="tone-good" icon={CheckCircle2} label={`Closed in ${year}`} value={closedThisYear.length} to={tabLink('/projects', 'Completed')}>
          <span className="muted">{projects.filter((p) => p.closure.closedOn).length} closed in all</span>
        </KpiCard>
        <KpiCard tone="tone-attention" icon={Timer} label="Approval Time" value={avg(approvalDays)} format={(n) => `${Math.round(n)} days`}>
          <span className="muted">Submission to final approval, average</span>
        </KpiCard>
        <KpiCard tone={overdue.length ? 'tone-urgent' : 'tone-good'} icon={AlertTriangle} label="Overdue Tasks" value={overdue.length} to={tabLink('/tasks', 'Overdue')}>
          <span className="muted">of {openTasks.length} open tasks</span>
        </KpiCard>
      </section>

      <div className="dash-row report-row">
        <section className="card">
          <header className="card-header">
            <PieIcon className="card-icon" size={22} strokeWidth={1.8} />
            <div>
              <h2>Project Execution &amp; Delivery Status</h2>
              <p className="card-subtitle">Distribution across {projects.length} lifetime projects</p>
            </div>
          </header>
          <div className="report-chart" style={{ height: 260 }}>
            {projectExecutionStatusData.length === 0 ? (
              <p className="empty-state" style={{ padding: '2rem', textAlign: 'center' }}>No projects on record.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={projectExecutionStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={85}
                    paddingAngle={4}
                    dataKey="value"
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  >
                    {projectExecutionStatusData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ borderRadius: 8, border: '1px solid #e1e8eb', fontSize: 12 }}
                    formatter={(val, name) => [`${val} projects (${Math.round((val / (projects.length || 1)) * 100)}%)`, name]}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </section>

        <section className="card">
          <header className="card-header">
            <PieIcon className="card-icon" size={22} strokeWidth={1.8} />
            <div>
              <h2>Running Projects by Stage</h2>
              <p className="card-subtitle">Workflow stage allocation of {active.length} active jobs</p>
            </div>
          </header>
          <div className="report-chart" style={{ height: 260 }}>
            {stagePieData.length === 0 ? (
              <p className="empty-state" style={{ padding: '2rem', textAlign: 'center' }}>No active projects in stages.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stagePieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  >
                    {stagePieData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ borderRadius: 8, border: '1px solid #e1e8eb', fontSize: 12 }}
                    formatter={(val, name, item) => [`${val} projects (Lead: ${item.payload.owner || 'Assigned'})`, name]}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </section>
      </div>

      <div className="dash-row report-row">
        <section className="card">
          <header className="card-header">
            <Users className="card-icon" size={22} strokeWidth={1.8} />
            <h2>Team Performance</h2>
            <div className="card-actions">
              <button className="btn" onClick={exportTeam}>
                <Download size={15} /> Export
              </button>
            </div>
          </header>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Person</th>
                  <th className="num">Running</th>
                  <th className="num">Delivered</th>
                  <th className="num">Tasks done</th>
                  <th className="num">Open</th>
                  <th className="num">Overdue</th>
                  <th className="num">Visits</th>
                </tr>
              </thead>
              <tbody>
                {team.map((r) => (
                  <tr key={r.name}>
                    <td>
                      <div className="cell-strong">{r.name}</div>
                      <div className="cell-sub">{r.title}</div>
                    </td>
                    <td className="num">{r.running}</td>
                    <td className="num">{r.delivered}</td>
                    <td className="num">{r.done}</td>
                    <td className="num">{r.open}</td>
                    <td className={`num ${r.overdue ? 'text-red' : 'muted'}`}>{r.overdue}</td>
                    <td className="num">{r.visits}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <div className="report-stack">
          <section className="card">
            <header className="card-header">
              <Landmark className="card-icon" size={22} strokeWidth={1.8} />
              <h2>Approval Time by Authority</h2>
            </header>
            <Bars rows={authorities} color="var(--gold-500)" />
          </section>
          <section className="card">
            <header className="card-header">
              <FolderKanban className="card-icon" size={22} strokeWidth={1.8} />
              <h2>Projects by Service</h2>
            </header>
            <Bars rows={services} color="var(--teal-600)" />
          </section>
        </div>
      </div>

      {/* Row: Client Status Pie Chart */}
      <div className="dash-row report-row">
        <section className="card">
          <header className="card-header">
            <PieIcon className="card-icon" size={22} strokeWidth={1.8} />
            <div>
              <h2>Client Status Distribution ({wonClients.length})</h2>
              <p className="card-subtitle">Active clients vs ongoing onboarding accounts</p>
            </div>
          </header>
          <div className="report-chart" style={{ height: 260 }}>
            {wonClients.length === 0 ? (
              <p className="empty-state" style={{ padding: '2rem', textAlign: 'center' }}>No client data found for the selected filters.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={clientStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={85}
                    paddingAngle={4}
                    dataKey="value"
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  >
                    {clientStatusData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ borderRadius: 8, border: '1px solid #e1e8eb', fontSize: 12 }}
                    formatter={(val, name) => [`${val} clients (${Math.round((val / wonClients.length) * 100)}%)`, name]}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </section>

        <section className="card">
          <header className="card-header">
            <FolderKanban className="card-icon" size={22} strokeWidth={1.8} />
            <div>
              <h2>Client Distribution Metrics</h2>
              <p className="card-subtitle">Account health and operational onboarding progress</p>
            </div>
          </header>
          <div style={{ padding: '1.25rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ padding: '1rem', background: '#ecfdf5', borderRadius: '8px', border: '1px solid #a7f3d0' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#065f46', textTransform: 'uppercase' }}>Active Clients</div>
                <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#047857', marginTop: '0.25rem' }}>{activeClientsCount}</div>
                <div style={{ fontSize: '0.75rem', color: '#059669', marginTop: '0.25rem' }}>Onboarding complete &amp; live</div>
              </div>
              <div style={{ padding: '1rem', background: '#f0fdfa', borderRadius: '8px', border: '1px solid #99f6e4' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#115e59', textTransform: 'uppercase' }}>Onboarding Clients</div>
                <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0f766e', marginTop: '0.25rem' }}>{onboardingClientsCount}</div>
                <div style={{ fontSize: '0.75rem', color: '#0d9488', marginTop: '0.25rem' }}>Checklist steps in progress</div>
              </div>
            </div>
            <p className="cell-sub">
              Client statuses update dynamically as onboarding verification steps are completed in the CRM workflow.
            </p>
          </div>
        </section>
      </div>

      {/* Row: Project Status Report + Assigned Timeline */}
      <div className="dash-row">
        <section className="card">
          <header className="card-header">
            <Calendar className="card-icon" size={22} strokeWidth={1.8} />
            <div>
              <h2>Project Status &amp; Assigned Timeline Report ({timelineProjects.length})</h2>
              <p className="card-subtitle">Real project execution stages, assignment timelines, and milestone schedules</p>
            </div>
            <div className="card-actions" style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <select
                className="select select-sm"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                aria-label="Filter by execution status"
              >
                <option value="all">All Execution Statuses</option>
                <option value="running">Running / In Execution</option>
                <option value="approval">Awaiting Authority Approval</option>
                <option value="completed">Completed / Closed</option>
              </select>

              <select
                className="select select-sm"
                value={timelineServiceFilter}
                onChange={(e) => setTimelineServiceFilter(e.target.value)}
                aria-label="Filter by service"
              >
                <option value="all">All Services ({services.length})</option>
                {services.map((s) => (
                  <option key={s.label} value={s.label}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          </header>

          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Project ID</th>
                  <th>Client / Company</th>
                  <th>Service</th>
                  <th>Status &amp; Stage</th>
                  <th>Timeline &amp; Dates</th>
                  <th>Assigned Team</th>
                  <th className="num">Progress</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {timelineProjects.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="empty-state" style={{ padding: '2.5rem', textAlign: 'center' }}>
                      No project data found for the selected filters.
                    </td>
                  </tr>
                ) : (
                  timelineProjects.map((p) => {
                    const doneStages = p.stages.filter((s) => s.done).length
                    const progressPct = Math.round((doneStages / p.stages.length) * 100)
                    const nextTask = p.tasks.find((t) => t.status !== 'done' && t.due)
                    return (
                      <tr key={p.id}>
                        <td className="cell-strong">{p.id}</td>
                        <td>
                          <div className="cell-strong">{p.lead.company}</div>
                          <div className="cell-sub">{p.site}</div>
                        </td>
                        <td>{p.service}</td>
                        <td>
                          <span className="badge badge-subtle">{p.status}</span>
                          <div className="cell-sub">{p.stages[p.stageIndex]?.label || 'Closed'}</div>
                        </td>
                        <td className="cell-sub">
                          <div>Started: <b>{p.startedOn ? formatDate(p.startedOn) : 'Pending onboarding'}</b></div>
                          {p.closure.closedOn ? (
                            <div className="text-good font-semibold">Closed: {formatDate(p.closure.closedOn)}</div>
                          ) : nextTask ? (
                            <div className={nextTask.overdue ? 'text-red' : 'muted'}>Next Due: {formatDate(nextTask.due)}</div>
                          ) : (
                            <div className="muted">In progress</div>
                          )}
                        </td>
                        <td>
                          <div className="cell-strong">{p.team.coordinator || 'Unassigned'}</div>
                          <div className="cell-sub">Lead: {p.team.teamLead || 'Unassigned'}</div>
                        </td>
                        <td className="num">
                          <span className="conv-cell">
                            <span className="conv-track">
                              <span style={{ width: `${progressPct}%`, backgroundColor: progressPct === 100 ? '#10B981' : '#2a8089' }} />
                            </span>
                            {progressPct}%
                          </span>
                        </td>
                        <td>
                          <Link to={`/projects/${p.id}`} className="btn btn-xs">
                            Details <ExternalLink size={12} />
                          </Link>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  )
}
