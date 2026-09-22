import { AlertTriangle, BarChart3, CheckCircle2, Download, FolderKanban, Landmark, Layers, Timer, Users } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Bars } from '../../components/common/Bars'
import { KpiCard } from '../../components/common/KpiCard'
import { tabLink } from '../../components/common/useTabParam'
import { useCrm } from '../../context/crm'
import { TODAY } from '../../data/mockData'
import { COORDINATORS, FIELD_MEMBERS, TEAM_LEADS } from '../../data/staff'
import { monthShort, parseISODate } from '../../utils/date'
import { downloadCsv } from '../../utils/exportCsv'
import { ERM_STAGES, allProjects } from '../../utils/projects'
import '../projects/erm.css'

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
  const projects = allProjects(leads, projectEdits)
  const active = projects.filter((p) => p.stageIndex < ERM_STAGES.length)
  const closedThisYear = projects.filter((p) => p.closure.closedOn?.startsWith(year))
  const approved = projects.filter((p) => p.approvalsDone === p.approvals.length && p.submission)
  const approvalDays = approved.map((p) => daysBetween(p.submission.date, p.approvals[p.approvals.length - 1].date))
  const openTasks = active.flatMap((p) => p.tasks.filter((t) => t.status !== 'done'))
  const overdue = openTasks.filter((t) => t.overdue)

  const byStage = ERM_STAGES.map((st, i) => ({ label: `${i + 1}. ${st.label}`, count: active.filter((p) => p.stageIndex === i).length, note: st.owner }))

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
            <BarChart3 className="card-icon" size={22} strokeWidth={1.8} />
            <h2>Started, Submitted &amp; Closed — last 6 months</h2>
          </header>
          <div className="report-chart">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyFlow(projects)} margin={{ top: 8, right: 12, left: -18, bottom: 0 }} barGap={4}>
                <CartesianGrid stroke="#edf1f3" vertical={false} />
                <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fill: '#7c8b96', fontSize: 12 }} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fill: '#7c8b96', fontSize: 12 }} />
                <Tooltip cursor={{ fill: 'rgba(31,111,120,0.06)' }} contentStyle={{ borderRadius: 8, border: '1px solid #e1e8eb', fontSize: 12 }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="Started" fill="#2a8089" radius={[4, 4, 0, 0]} animationDuration={700} />
                <Bar dataKey="Submitted" fill="#c8943a" radius={[4, 4, 0, 0]} animationDuration={800} />
                <Bar dataKey="Closed" fill="#2e9e6b" radius={[4, 4, 0, 0]} animationDuration={900} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="card">
          <header className="card-header">
            <Layers className="card-icon" size={22} strokeWidth={1.8} />
            <h2>Running Projects by Stage</h2>
          </header>
          <Bars rows={byStage} color="var(--teal-600)" />
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
    </div>
  )
}
