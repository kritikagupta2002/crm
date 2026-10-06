import { BarChart3, Building2, Download, Inbox, IndianRupee, Percent, PieChart as PieIcon, Trophy, Users, XCircle } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Bars } from '../../../shared/components/Bars'
import { KpiCard } from '../../../shared/components/KpiCard'
import { PeriodSwitch } from '../../../shared/components/PeriodSwitch'
import { Link, useSearchParams } from 'react-router-dom'
import { ROLE_ACCESS, useCrm, useMoney } from '../../../core/permissions/crm'
import { PERIOD_LABELS, usePeriod } from '../../../core/constants/period'
import { LEAD_SOURCES, TEAM, TODAY } from '../../crm/data/mockData'
import { getMonthlyTrend, leadsForPeriod } from '../utils/dashboardStats'
import { toISODate } from '../../../shared/utils/date'
import { downloadCsv } from '../../../shared/utils/exportCsv'
import { countBy } from '../../crm/utils/leads'
import { ONBOARDING_STEPS, progressOf } from '../../crm/utils/workflow'
import { PnlReport } from '../components/PnlReport'
import { ProjectFinanceReport } from '../components/ProjectFinanceReport'
import { ProjectReports } from '../components/ProjectReports'
import { VendorProjectReports } from '../components/VendorProjectReports'

const todayISO = toISODate(TODAY)
const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0)

/*
 * Who sees which report:
 * Super Admin & Finance Master: Sales, Projects, Vendor Projects, Project Finance, P&L
 * Director: Sales, Projects, Vendor Projects
 * Manager: Projects, Vendor Projects
 * Accounts Executive: Awarded Projects, Vendor Projects, Project Finance (no Sales, no P&L)
 */
const REPORT_VIEWS = [
  { key: 'sales', label: 'Sales', roles: ['Super Admin', 'Director', 'Finance Master'] },
  { key: 'projects', label: 'Projects', roles: ['Super Admin', 'Director', 'Manager', 'Finance Master', 'Accounts Executive'] },
  { key: 'vendor-projects', label: 'Vendor Projects', roles: ['Super Admin', 'Director', 'Manager', 'Finance Master', 'Accounts Executive'] },
  { key: 'finance', label: 'Project Finance', roles: ['Super Admin', 'Finance Master', 'Accounts Executive'] },
  { key: 'pnl', label: 'P&L', roles: Object.keys(ROLE_ACCESS).filter((r) => ROLE_ACCESS[r].pnl) },
]

/* Reports page with role-aware segmented view switcher. */
export function ReportsPage() {
  const { role } = useCrm()
  const [params, setParams] = useSearchParams()
  const views = REPORT_VIEWS.filter((v) => v.roles.includes(role))

  // For Accounts Executive, display "Awarded Projects"
  const formattedViews = views.map((v) => {
    if (role === 'Accounts Executive' && v.key === 'projects') {
      return { ...v, label: 'Awarded Projects' }
    }
    return v
  })

  // Resolve active view: strictly clamp to authorized views
  const requestedKey = params.get('view')
  const matchedView = formattedViews.find((v) => v.key === requestedKey)
  const defaultKey = formattedViews[0]?.key ?? 'projects'
  const view = matchedView ? matchedView.key : defaultKey

  const switcher =
    formattedViews.length > 1 ? (
      <div className="segmented" role="group" aria-label="Report">
        {formattedViews.map((v) => (
          <button
            key={v.key}
            aria-pressed={view === v.key}
            className={view === v.key ? 'is-selected' : ''}
            onClick={() => setParams(v.key === defaultKey ? {} : { view: v.key }, { replace: true })}
          >
            {v.label}
          </button>
        ))}
      </div>
    ) : null

  if (view === 'projects') return <ProjectReports switcher={switcher} />
  if (view === 'vendor-projects') return <VendorProjectReports switcher={switcher} />
  if (view === 'finance') return <ProjectFinanceReport switcher={switcher} />
  if (view === 'pnl' && ROLE_ACCESS[role]?.pnl) return <PnlReport switcher={switcher} />
  if (view === 'sales' && ['Super Admin', 'Director', 'Finance Master'].includes(role)) {
    return <SalesReports switcher={switcher} />
  }
  return <ProjectReports switcher={switcher} />
}

/* MIS view of the CRM for management: volume, conversion, where enquiries come from, why deals are lost, who is performing. */
function SalesReports({ switcher }) {
  const money = useMoney()
  const { leads, followUps } = useCrm()
  const { period } = usePeriod()
  const current = leadsForPeriod(leads, period)
  const won = current.filter((l) => l.stage === 'Won')
  const lost = current.filter((l) => l.stage === 'Lost')
  const wonValue = won.reduce((s, l) => s + (l.quoteValue ?? 0), 0)

  // Real client status derived from won leads (all won leads are official clients)
  const wonClients = leads.filter((l) => l.stage === 'Won')
  const activeClientsCount = wonClients.filter((l) => progressOf(ONBOARDING_STEPS, l.onboarding) === ONBOARDING_STEPS.length).length
  const onboardingClientsCount = wonClients.length - activeClientsCount
  const totalClientBusiness = wonClients.reduce((sum, l) => sum + (l.quoteValue || 0), 0)
  const avgClientValue = wonClients.length ? Math.round(totalClientBusiness / wonClients.length) : 0

  const clientStatusData = [
    { name: 'Active', value: activeClientsCount, color: '#10B981' },
    { name: 'Onboarding', value: onboardingClientsCount, color: '#0D9488' },
  ].filter((item) => item.value > 0)

  const monthly = getMonthlyTrend(leads).map((m) => ({ ...m, Enquiries: m.enquiries, Won: m.converted }))
  const pipelineStatusData = [
    { name: 'Won Deals', value: won.length, color: '#10B981' },
    { name: 'Active Pipeline', value: Math.max(0, current.length - won.length - lost.length), color: '#2563EB' },
    { name: 'Lost / Dropped', value: lost.length, color: '#EF4444' },
  ].filter((item) => item.value > 0)

  const SOURCE_COLORS = ['#2563EB', '#0D9488', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4', '#64748B']
  const sources = LEAD_SOURCES.map((source) => {
    const rows = current.filter((l) => l.source === source)
    const w = rows.filter((l) => l.stage === 'Won').length
    return { label: source, count: rows.length, note: `${w} won · ${pct(w, rows.length)}%` }
  }).sort((a, b) => b.count - a.count)
  const sourcePieData = sources.map((s, idx) => ({
    name: s.label,
    value: s.count,
    note: s.note,
    color: SOURCE_COLORS[idx % SOURCE_COLORS.length],
  })).filter((s) => s.value > 0)
  const lostReasons = countBy(lost, (l) => l.lostReason)

  const team = TEAM.map((member) => {
    const mine = current.filter((l) => l.assignedTo === member)
    const w = mine.filter((l) => l.stage === 'Won')
    return {
      member,
      leads: mine.length,
      open: mine.filter((l) => l.stage !== 'Won' && l.stage !== 'Lost').length,
      won: w.length,
      conversion: pct(w.length, mine.length),
      business: w.reduce((s, l) => s + (l.quoteValue ?? 0), 0),
      overdue: followUps.filter((f) => f.date < todayISO && leads.find((l) => l.id === f.leadId)?.assignedTo === member).length,
    }
  }).sort((a, b) => b.business - a.business)

  const exportTeam = () =>
    downloadCsv(`team-performance-${period}.csv`, [
      { label: 'Team member', value: (r) => r.member },
      { label: 'Leads', value: (r) => r.leads },
      { label: 'Open', value: (r) => r.open },
      { label: 'Won', value: (r) => r.won },
      { label: 'Conversion %', value: (r) => r.conversion },
      { label: 'Business won (INR)', value: (r) => r.business },
      { label: 'Overdue follow-ups', value: (r) => r.overdue },
    ], team)

  return (
    <div className="module-page">
      <header className="page-header">
        <div className="page-title">
          <h1>MIS Reports</h1>
          <p>{PERIOD_LABELS[period].current} · sales &amp; client performance at a glance</p>
        </div>
        <div className="page-actions">
          {switcher}
          <PeriodSwitch />
        </div>
      </header>

      <section className="stat-grid">
        <KpiCard tone="tone-info" icon={Inbox} label="Enquiries" value={current.length}>
          <span className="muted">{current.length - won.length - lost.length} still open</span>
        </KpiCard>
        <KpiCard tone="tone-good" icon={Trophy} label="Won" value={won.length}>
          <span className="muted">{lost.length} lost</span>
        </KpiCard>
        <KpiCard tone="tone-attention" icon={Percent} label="Conversion" value={pct(won.length, current.length)} format={(n) => `${Math.round(n)}%`}>
          <span className="muted">Enquiry to client</span>
        </KpiCard>
        <KpiCard tone="tone-good" icon={IndianRupee} label="Business Won" value={wonValue} format={money.short}>
          <span className="muted">Avg. deal {money.short(won.length ? wonValue / won.length : 0)}</span>
        </KpiCard>
      </section>

      <div className="dash-row report-row">
        <section className="card">
          <header className="card-header">
            <PieIcon className="card-icon" size={22} strokeWidth={1.8} />
            <div>
              <h2>Lead Pipeline &amp; Conversion Status</h2>
              <p className="card-subtitle">Outcome breakdown of {current.length} total enquiries in period</p>
            </div>
          </header>
          <div className="report-chart" style={{ height: 260 }}>
            {pipelineStatusData.length === 0 ? (
              <p className="empty-state" style={{ padding: '2rem', textAlign: 'center' }}>No enquiries found in this period.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pipelineStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={85}
                    paddingAngle={4}
                    dataKey="value"
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  >
                    {pipelineStatusData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ borderRadius: 8, border: '1px solid #e1e8eb', fontSize: 12 }}
                    formatter={(val, name) => [`${val} leads (${Math.round((val / (current.length || 1)) * 100)}%)`, name]}
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
              <h2>Enquiry Origin &amp; Sources Distribution</h2>
              <p className="card-subtitle">Lead acquisition channels share</p>
            </div>
          </header>
          <div className="report-chart" style={{ height: 260 }}>
            {sourcePieData.length === 0 ? (
              <p className="empty-state" style={{ padding: '2rem', textAlign: 'center' }}>No lead sources recorded.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={sourcePieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  >
                    {sourcePieData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ borderRadius: 8, border: '1px solid #e1e8eb', fontSize: 12 }}
                    formatter={(val, name, item) => [`${val} leads (${item.payload.note || ''})`, name]}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </section>
      </div>

      {/* Row: Client Status Pie Chart & Distribution Metrics */}
      <div className="dash-row report-row">
        <section className="card">
          <header className="card-header">
            <PieIcon className="card-icon" size={22} strokeWidth={1.8} />
            <div>
              <h2>Client Status Distribution ({wonClients.length})</h2>
              <p className="card-subtitle">Active clients vs ongoing onboarding accounts</p>
            </div>
            <div className="card-actions">
              <Link to="/clients" className="btn btn-small" title="Open Client Master">
                <Building2 size={14} /> Client Master
              </Link>
            </div>
          </header>
          <div className="report-chart" style={{ height: 260 }}>
            {wonClients.length === 0 ? (
              <p className="empty-state" style={{ padding: '2rem', textAlign: 'center' }}>No client accounts found.</p>
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
                    formatter={(val, name) => [`${val} clients (${Math.round((val / (wonClients.length || 1)) * 100)}%)`, name]}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </section>

        <section className="card">
          <header className="card-header">
            <Building2 className="card-icon" size={22} strokeWidth={1.8} />
            <div>
              <h2>Client Distribution Metrics</h2>
              <p className="card-subtitle">Account health and operational onboarding progress</p>
            </div>
          </header>
          <div style={{ padding: '1.25rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginBottom: '1.25rem' }}>
              <div style={{ padding: '1rem', background: '#ecfdf5', borderRadius: '8px', border: '1px solid #a7f3d0' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#065f46', textTransform: 'uppercase' }}>Active Clients</div>
                <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#047857', marginTop: '0.25rem' }}>{activeClientsCount}</div>
                <div style={{ fontSize: '0.75rem', color: '#059669', marginTop: '0.25rem' }}>
                  {wonClients.length ? Math.round((activeClientsCount / wonClients.length) * 100) : 0}% of client base · Live
                </div>
              </div>
              <div style={{ padding: '1rem', background: '#f0fdfa', borderRadius: '8px', border: '1px solid #99f6e4' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#115e59', textTransform: 'uppercase' }}>Onboarding Clients</div>
                <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0f766e', marginTop: '0.25rem' }}>{onboardingClientsCount}</div>
                <div style={{ fontSize: '0.75rem', color: '#0d9488', marginTop: '0.25rem' }}>
                  {wonClients.length ? Math.round((onboardingClientsCount / wonClients.length) * 100) : 0}% of client base · In Setup
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginBottom: '1rem' }}>
              <div style={{ padding: '0.85rem 1rem', background: 'var(--bg-alt, #f8fafc)', borderRadius: '8px', border: '1px solid var(--line)' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--ink-3)', textTransform: 'uppercase' }}>Total Client Value</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--ink)', marginTop: '0.2rem' }}>{money.short(totalClientBusiness)}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--ink-2)', marginTop: '0.15rem' }}>Cumulative won contracts</div>
              </div>
              <div style={{ padding: '0.85rem 1rem', background: 'var(--bg-alt, #f8fafc)', borderRadius: '8px', border: '1px solid var(--line)' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--ink-3)', textTransform: 'uppercase' }}>Avg Deal Size</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--ink)', marginTop: '0.2rem' }}>{money.short(avgClientValue)}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--ink-2)', marginTop: '0.15rem' }}>Per won client</div>
              </div>
            </div>

            <p className="cell-sub" style={{ margin: 0 }}>
              Client statuses update dynamically as onboarding verification steps are completed in the CRM workflow.
            </p>
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
                  <th>Team member</th>
                  <th className="num">Leads</th>
                  <th className="num">Open</th>
                  <th className="num">Won</th>
                  <th className="num">Conversion</th>
                  <th className="num">Business won</th>
                  <th className="num">Overdue</th>
                </tr>
              </thead>
              <tbody>
                {team.map((r) => (
                  <tr key={r.member}>
                    <td className="cell-strong">{r.member}</td>
                    <td className="num">{r.leads}</td>
                    <td className="num">{r.open}</td>
                    <td className="num">{r.won}</td>
                    <td className="num">
                      <span className="conv-cell">
                        <span className="conv-track">
                          <span style={{ width: `${r.conversion}%` }} />
                        </span>
                        {r.conversion}%
                      </span>
                    </td>
                    <td className="num">
                      <b className="text-ink">{money.short(r.business)}</b>
                    </td>
                    <td className={`num ${r.overdue ? 'text-red' : 'muted'}`}>{r.overdue}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="card">
          <header className="card-header">
            <XCircle className="card-icon" size={22} strokeWidth={1.8} />
            <h2>Why Deals Were Lost</h2>
          </header>
          {lostReasons.length ? <Bars rows={lostReasons} color="var(--red)" /> : <p className="empty-state">No lost deals in this period.</p>}
        </section>
      </div>
    </div>
  )
}
