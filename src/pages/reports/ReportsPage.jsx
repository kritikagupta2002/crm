import { BarChart3, Download, Inbox, IndianRupee, Percent, Trophy, Users, XCircle } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { KpiCard } from '../../components/common/KpiCard'
import { PeriodSwitch } from '../../components/common/PeriodSwitch'
import { useCrm, useMoney } from '../../context/crm'
import { PERIOD_LABELS, usePeriod } from '../../context/period'
import { LEAD_SOURCES, TEAM, TODAY } from '../../data/mockData'
import { getMonthlyTrend, leadsForPeriod } from '../../utils/dashboardStats'
import { toISODate } from '../../utils/date'
import { downloadCsv } from '../../utils/exportCsv'
import { countBy } from '../../utils/leads'

const todayISO = toISODate(TODAY)
const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0)

function Bars({ rows, color }) {
  const max = Math.max(...rows.map((r) => r.count), 1)
  return (
    <ul className="insight-bars report-bars">
      {rows.map((row) => (
        <li key={row.label}>
          <div className="insight-bar-top">
            <span>{row.label}</span>
            <span>
              <b>{row.count}</b> {row.note && <span className="muted">{row.note}</span>}
            </span>
          </div>
          <div className="insight-track">
            <div style={{ width: `${(row.count / max) * 100}%`, background: color }} />
          </div>
        </li>
      ))}
    </ul>
  )
}

/* MIS view of the CRM for management: volume, conversion, where enquiries come from, why deals are lost, who is performing. */
export function ReportsPage() {
  const money = useMoney()
  const { leads, followUps } = useCrm()
  const { period } = usePeriod()
  const current = leadsForPeriod(leads, period)
  const won = current.filter((l) => l.stage === 'Won')
  const lost = current.filter((l) => l.stage === 'Lost')
  const wonValue = won.reduce((s, l) => s + (l.quoteValue ?? 0), 0)

  const monthly = getMonthlyTrend(leads).map((m) => ({ ...m, Enquiries: m.enquiries, Won: m.converted }))
  const sources = LEAD_SOURCES.map((source) => {
    const rows = current.filter((l) => l.source === source)
    const w = rows.filter((l) => l.stage === 'Won').length
    return { label: source, count: rows.length, note: `${w} won · ${pct(w, rows.length)}%` }
  }).sort((a, b) => b.count - a.count)
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
          <h1>Reports</h1>
          <p>{PERIOD_LABELS[period].current} · sales performance at a glance</p>
        </div>
        <div className="page-actions">
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
            <BarChart3 className="card-icon" size={22} strokeWidth={1.8} />
            <h2>Enquiries vs Won — last 6 months</h2>
          </header>
          <div className="report-chart">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthly} margin={{ top: 8, right: 12, left: -18, bottom: 0 }} barGap={4}>
                <CartesianGrid stroke="#edf1f3" vertical={false} />
                <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fill: '#7c8b96', fontSize: 12 }} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fill: '#7c8b96', fontSize: 12 }} />
                <Tooltip cursor={{ fill: 'rgba(31,111,120,0.06)' }} contentStyle={{ borderRadius: 8, border: '1px solid #e1e8eb', fontSize: 12 }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="Enquiries" fill="#2a8089" radius={[4, 4, 0, 0]} animationDuration={700} />
                <Bar dataKey="Won" fill="#c8943a" radius={[4, 4, 0, 0]} animationDuration={900} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="card">
          <header className="card-header">
            <Inbox className="card-icon" size={22} strokeWidth={1.8} />
            <h2>Enquiry Sources</h2>
          </header>
          <Bars rows={sources} color="var(--teal-600)" />
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
