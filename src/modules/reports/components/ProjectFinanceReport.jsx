import { useState } from 'react'
import { Download, ExternalLink, FileSpreadsheet, HardHat, IndianRupee, Layers, TrendingUp, Wallet } from 'lucide-react'
import { Link } from 'react-router-dom'
import { KpiCard } from '../../../shared/components/KpiCard'
import { useCrm, useMoney } from '../../../core/permissions/crm'
import { formatDate } from '../../../shared/utils/date'
import { downloadCsv } from '../../../shared/utils/exportCsv'
import { allProjects } from '../../erm/utils/projects'
import { WO_STATUS_TONE } from '../../erm/utils/workOrders'

const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0)

export function ProjectFinanceReport({ switcher }) {
  const { leads, projectEdits, role } = useCrm()
  const money = useMoney()
  const [selectedProjectId, setSelectedProjectId] = useState('all')

  // Real projects from application state
  const rawProjects = allProjects(leads, projectEdits)
  // For Accounts Executive, restrict project dropdown strictly to won/awarded projects
  const awardedProjects = rawProjects.filter((p) => p.lead?.stage === 'Won')
  const visibleProjects = role === 'Accounts Executive' ? awardedProjects : rawProjects

  // Single project finance selection
  const isAll = selectedProjectId === 'all'
  const targetProject = isAll ? null : visibleProjects.find((p) => p.id === selectedProjectId)

  // Financial aggregates
  const activeSet = isAll ? visibleProjects : targetProject ? [targetProject] : []
  const totalContractValue = activeSet.reduce((s, p) => s + (p.lead?.quoteValue ?? 0), 0)
  const allOrders = activeSet.flatMap((p) => p.workOrders.map((w) => ({ ...w, project: p })))
  const totalSubcontractCost = allOrders.reduce((s, w) => s + (w.bill?.amount ?? w.amount ?? 0), 0)
  const totalPaidOut = allOrders.filter((w) => w.payment).reduce((s, w) => s + (w.bill?.amount ?? w.amount ?? 0), 0)
  const grossMargin = totalContractValue - totalSubcontractCost
  const marginPct = pct(grossMargin, totalContractValue)

  // Empty state check for selected project
  const hasFinanceData = activeSet.length > 0 && (totalContractValue > 0 || totalSubcontractCost > 0 || allOrders.length > 0)

  const exportFinanceCsv = () => {
    downloadCsv(`project-finance-${selectedProjectId}.csv`, [
      { label: 'Project ID', value: (r) => r.id },
      { label: 'Project Name', value: (r) => r.name },
      { label: 'Client', value: (r) => r.lead?.company ?? '' },
      { label: 'Contract Value (INR)', value: (r) => r.lead?.quoteValue ?? 0 },
      { label: 'Subcontract Cost (INR)', value: (r) => r.workOrders.reduce((s, w) => s + (w.bill?.amount ?? w.amount ?? 0), 0) },
      { label: 'Margin (INR)', value: (r) => (r.lead?.quoteValue ?? 0) - r.workOrders.reduce((s, w) => s + (w.bill?.amount ?? w.amount ?? 0), 0) },
      { label: 'Margin %', value: (r) => pct((r.lead?.quoteValue ?? 0) - r.workOrders.reduce((s, w) => s + (w.bill?.amount ?? w.amount ?? 0), 0), r.lead?.quoteValue ?? 0) },
      { label: 'Subcontracts Count', value: (r) => r.workOrders.length },
    ], activeSet)
  }

  return (
    <div className="module-page project-finance-report">
      <header className="page-header">
        <div className="page-title">
          <h1>Project Finance &amp; Billing Report</h1>
          <p>
            {visibleProjects.length} projects on record · project-level contract revenues, subcontract expenditures &amp; billing
          </p>
        </div>
        <div className="page-actions">
          {switcher}
          <div style={{ margin: 0, minWidth: 240, maxWidth: 360 }}>
            <label htmlFor="finance-project-select" className="sr-only">
              Filter by Project
            </label>
            <select
              id="finance-project-select"
              className="select"
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              style={{ width: '100%', fontWeight: 500 }}
              aria-label="Filter financial ledger by project"
            >
              <option value="all">All Awarded Projects ({visibleProjects.length})</option>
              {visibleProjects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.id} — {p.name} ({p.lead?.company})
                </option>
              ))}
            </select>
          </div>
        </div>
      </header>

      {/* Project Financial Summary KPIs */}
      <section className="stat-grid" aria-label="Project Finance Key Metrics">
        <KpiCard tone="tone-good" icon={IndianRupee} label="Contract Value" value={totalContractValue} format={money.short}>
          <span className="muted">{isAll ? `Across ${visibleProjects.length} projects` : `${targetProject?.name}`}</span>
        </KpiCard>

        <KpiCard tone="tone-attention" icon={HardHat} label="Subcontract Costs" value={totalSubcontractCost} format={money.short}>
          <span className="muted">{allOrders.length} outside work orders</span>
        </KpiCard>

        <KpiCard tone="tone-good" icon={TrendingUp} label="Operating Gross Margin" value={grossMargin} format={money.short}>
          <span className="muted">{marginPct}% operating margin</span>
        </KpiCard>

        <KpiCard tone={totalPaidOut === totalSubcontractCost && totalSubcontractCost > 0 ? 'tone-good' : 'tone-info'} icon={Wallet} label="Subcontract Paid Out" value={totalPaidOut} format={money.short}>
          <span className="muted">{money.short(totalSubcontractCost - totalPaidOut)} pending clearance</span>
        </KpiCard>
      </section>

      {!hasFinanceData ? (
        <section className="card p-6">
          <div className="empty-state" style={{ padding: '3rem 1rem', textAlign: 'center' }}>
            <FileSpreadsheet size={36} className="text-muted mb-2" style={{ margin: '0 auto 0.75rem', opacity: 0.6 }} />
            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--ink)' }}>No finance data found for this project.</h3>
            <p className="text-muted text-sm mt-1">There are no awarded contract figures or vendor work orders recorded for this selection.</p>
          </div>
        </section>
      ) : (
        <>
          {/* Detailed Projects Ledger */}
          <div className="dash-row">
            <section className="card">
              <header className="card-header">
                <Layers className="card-icon" size={22} strokeWidth={1.8} />
                <div>
                  <h2>{isAll ? 'Awarded Projects Financial Ledger' : `${targetProject?.name} — Financial Breakdown`}</h2>
                  <p className="card-subtitle">Contract revenue, vendor commitments, and realized project profitability</p>
                </div>
                <div className="card-actions">
                  <button className="btn" onClick={exportFinanceCsv}>
                    <Download size={15} /> Export
                  </button>
                </div>
              </header>

              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Project</th>
                      <th>Client</th>
                      <th>Service</th>
                      <th className="num">Contract Value</th>
                      <th className="num">Subcontract Cost</th>
                      <th className="num">Gross Margin</th>
                      <th className="num">Margin %</th>
                      <th className="num">Subcontracts</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeSet.map((p) => {
                      const rev = p.lead?.quoteValue ?? 0
                      const cost = p.workOrders.reduce((s, w) => s + (w.bill?.amount ?? w.amount ?? 0), 0)
                      const m = rev - cost
                      const mpct = pct(m, rev)
                      return (
                        <tr key={p.id}>
                          <td>
                            <div className="cell-strong">{p.id}</div>
                            <div className="cell-sub">{p.name}</div>
                          </td>
                          <td className="cell-strong">{p.lead?.company}</td>
                          <td>{p.service}</td>
                          <td className="num">
                            <b className="text-ink">{money.format(rev)}</b>
                          </td>
                          <td className="num">
                            <span className={cost > 0 ? 'text-ink' : 'muted'}>{money.format(cost)}</span>
                          </td>
                          <td className="num">
                            <b className={m >= 0 ? 'text-good' : 'text-red'}>{money.format(m)}</b>
                          </td>
                          <td className="num">
                            <span className="badge badge-subtle">{mpct}%</span>
                          </td>
                          <td className="num">{p.workOrders.length}</td>
                          <td>
                            <Link to={`/projects/${p.id}`} className="btn btn-xs">
                              View <ExternalLink size={12} />
                            </Link>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          </div>

          {/* Subcontract Orders Breakdown for Project(s) */}
          <div className="dash-row">
            <section className="card">
              <header className="card-header">
                <HardHat className="card-icon" size={22} strokeWidth={1.8} />
                <div>
                  <h2>Vendor Subcontract Line Items ({allOrders.length})</h2>
                  <p className="card-subtitle">Individual purchase orders, bills received, and vendor disbursement states</p>
                </div>
              </header>

              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Order ID</th>
                      <th>Vendor</th>
                      <th>Project</th>
                      <th>Work Scope</th>
                      <th className="num">Order Value</th>
                      <th className="num">Billed Amount</th>
                      <th>Status</th>
                      <th>Due Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allOrders.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="empty-state">
                          No subcontract orders issued for this project.
                        </td>
                      </tr>
                    ) : (
                      allOrders.map((w) => (
                        <tr key={w.id}>
                          <td className="cell-strong">{w.id}</td>
                          <td className="cell-strong">{w.vendor}</td>
                          <td>
                            <div>{w.project.id}</div>
                            <div className="cell-sub">{w.project.lead.company}</div>
                          </td>
                          <td>{w.work}</td>
                          <td className="num">{money.format(w.amount)}</td>
                          <td className="num">
                            {w.bill ? <b>{money.format(w.bill.amount)}</b> : <span className="muted">—</span>}
                          </td>
                          <td>
                            <span className={`badge ${WO_STATUS_TONE[w.status] ?? 'tone-neutral'}`}>{w.status}</span>
                          </td>
                          <td className="cell-sub">{w.dueOn ? formatDate(w.dueOn) : '—'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        </>
      )}
    </div>
  )
}
