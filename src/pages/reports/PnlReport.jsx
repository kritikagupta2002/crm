import { Download, HardHat, IndianRupee, Layers, Percent, Scale, TrendingUp } from 'lucide-react'
import { Bars } from '../../components/common/Bars'
import { KpiCard } from '../../components/common/KpiCard'
import { PeriodSwitch } from '../../components/common/PeriodSwitch'
import { RoleLink } from '../../components/common/RoleLink'
import { useCrm, useMoney } from '../../context/crm'
import { PERIOD_LABELS, usePeriod } from '../../context/period'
import { leadsForPeriod } from '../../utils/dashboardStats'
import { downloadCsv } from '../../utils/exportCsv'
import { clientProjects } from '../../utils/projects'

const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0)

/*
 * Project profit & loss: what each won job is worth (the accepted quotation, before GST) against what was
 * spent on outside firms for it. Only the Admin sees this (requirement E2: junior
 * accounts staff are kept out of P&L).
 */
export function PnlReport({ switcher }) {
  const { leads, projectEdits } = useCrm()
  const money = useMoney()
  const { period } = usePeriod()

  const rows = leadsForPeriod(leads, period)
    .filter((l) => l.stage === 'Won' && l.quoteValue)
    .map((lead) => {
      // The quotation was for the client's first project; its subcontracts are the job's outside cost.
      const project = clientProjects(lead, projectEdits)[0]
      const orders = project?.workOrders ?? []
      const cost = orders.reduce((s, w) => s + (w.bill?.amount ?? w.amount), 0)
      const paidOut = orders.filter((w) => w.payment).reduce((s, w) => s + (w.bill?.amount ?? w.amount), 0)
      return { lead, project, revenue: lead.quoteValue, cost, paidOut, margin: lead.quoteValue - cost, pct: pct(lead.quoteValue - cost, lead.quoteValue), orders: orders.length }
    })
    .sort((a, b) => b.revenue - a.revenue)

  const revenue = rows.reduce((s, r) => s + r.revenue, 0)
  const cost = rows.reduce((s, r) => s + r.cost, 0)
  const margin = revenue - cost
  const thin = rows.filter((r) => r.pct < 40)

  const services = [...new Set(rows.map((r) => r.lead.service))]
    .map((service) => {
      const mine = rows.filter((r) => r.lead.service === service)
      const rev = mine.reduce((s, r) => s + r.revenue, 0)
      const m = mine.reduce((s, r) => s + r.margin, 0)
      return { label: service, count: pct(m, rev), note: `% margin · ${money.short(m)} on ${money.short(rev)}` }
    })
    .sort((a, b) => b.count - a.count)

  const exportRows = () =>
    downloadCsv(`project-pnl-${period}.csv`, [
      { label: 'Client', value: (r) => r.lead.company },
      { label: 'Enquiry', value: (r) => r.lead.id },
      { label: 'Project', value: (r) => r.project?.id ?? '' },
      { label: 'Service', value: (r) => r.lead.serviceDetail },
      { label: 'Contract value (INR, before GST)', value: (r) => r.revenue },
      { label: 'Subcontract cost (INR)', value: (r) => r.cost },
      { label: 'Gross margin (INR)', value: (r) => r.margin },
      { label: 'Margin %', value: (r) => r.pct },
    ], rows)

  return (
    <div className="module-page">
      <header className="page-header">
        <div className="page-title">
          <h1>Reports</h1>
          <p>{PERIOD_LABELS[period].current} · profit & loss on won projects</p>
        </div>
        <div className="page-actions">
          {switcher}
          <PeriodSwitch />
        </div>
      </header>

      <section className="stat-grid">
        <KpiCard tone="tone-good" icon={IndianRupee} label="Contract Value" value={revenue} format={money.short}>
          <span className="muted">{rows.length} won projects, before GST</span>
        </KpiCard>
        <KpiCard tone="tone-attention" icon={HardHat} label="Subcontract Cost" value={cost} format={money.short}>
          <span className="muted">{pct(cost, revenue)}% of contract value</span>
        </KpiCard>
        <KpiCard tone="tone-info" icon={TrendingUp} label="Gross Margin" value={margin} format={money.short}>
          <span className="muted">Before salaries and overheads</span>
        </KpiCard>
        <KpiCard tone={thin.length ? 'tone-urgent' : 'tone-good'} icon={Percent} label="Margin" value={pct(margin, revenue)} format={(n) => `${Math.round(n)}%`}>
          <span className="muted">{thin.length ? `${thin.length} project${thin.length === 1 ? '' : 's'} under 40%` : 'Every project above 40%'}</span>
        </KpiCard>
      </section>

      <div className="dash-row report-row">
        <section className="card">
          <header className="card-header">
            <Scale className="card-icon" size={22} strokeWidth={1.8} />
            <h2>Project P&amp;L</h2>
            <div className="card-actions">
              <button className="btn" onClick={exportRows} disabled={rows.length === 0}>
                <Download size={15} /> Export
              </button>
            </div>
          </header>
          {rows.length === 0 ? (
            <p className="empty-state">No won projects in this period.</p>
          ) : (
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Client · project</th>
                    <th className="num">Contract value</th>
                    <th className="num">Subcontracts</th>
                    <th className="num">Gross margin</th>
                    <th className="num">Margin</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.lead.id}>
                      <td>
                        <RoleLink to={`/leads/${r.lead.id}`} className="cell-strong cell-link">
                          {r.lead.company}
                        </RoleLink>
                        <div className="cell-sub">
                          {r.project?.id ?? r.lead.id} · {r.lead.serviceDetail}
                        </div>
                      </td>
                      <td className="num">{money.full(r.revenue)}</td>
                      <td className="num">
                        {r.orders ? money.full(r.cost) : <span className="muted">none</span>}
                        {r.orders > 0 && r.paidOut < r.cost && <div className="cell-sub">{money.short(r.cost - r.paidOut)} still to pay</div>}
                      </td>
                      <td className="num">
                        <b className="text-ink">{money.full(r.margin)}</b>
                      </td>
                      <td className={`num ${r.pct < 40 ? 'text-red' : ''}`}>{r.pct}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="card">
          <header className="card-header">
            <Layers className="card-icon" size={22} strokeWidth={1.8} />
            <h2>Margin by Service</h2>
          </header>
          {services.length ? <Bars rows={services} color="var(--teal-600)" /> : <p className="empty-state">No won projects in this period.</p>}
        </section>
      </div>
    </div>
  )
}
