import { Award, CheckCircle2, ExternalLink, FileSpreadsheet, FolderKanban, HardHat, IndianRupee, Layers } from 'lucide-react'
import { Link } from 'react-router-dom'
import { ContourLines } from '../../../shared/components/ContourLines'
import { KpiCard as StatCard } from '../../../shared/components/KpiCard'
import { PeriodSwitch } from '../../../shared/components/PeriodSwitch'
import { useCrm, useMoney } from '../../../core/permissions/crm'
import { PERIOD_LABELS, usePeriod } from '../../../core/constants/period'
import { TODAY } from '../data/mockData'
import { leadsForPeriod } from '../../reports/utils/dashboardStats'
import { formatDate, formatLongDate } from '../../../shared/utils/date'
import { ERM_STAGES, allProjects } from '../../erm/utils/projects'
import { WO_STATUS_TONE } from '../../erm/utils/workOrders'
import '../components/dashboard/dashboard.css'

export function AccountsExecutiveDashboard() {
  const { leads, projectEdits } = useCrm()
  const money = useMoney()
  const { period } = usePeriod()

  // All won/awarded projects derived from real application data
  const currentLeads = leadsForPeriod(leads, period)
  const wonLeads = currentLeads.filter((l) => l.stage === 'Won')
  const projects = allProjects(leads, projectEdits)

  // Filter projects belonging to won clients
  const wonLeadIds = new Set(wonLeads.map((l) => l.id))
  const awardedProjects = projects.filter((p) => wonLeadIds.has(p.lead.id))
  const runningProjects = awardedProjects.filter((p) => p.stageIndex < ERM_STAGES.length)

  // Financial operational metrics for awarded projects
  const totalContractValue = wonLeads.reduce((s, l) => s + (l.quoteValue ?? 0), 0)
  const awardedWorkOrders = awardedProjects.flatMap((p) => p.workOrders.map((w) => ({ ...w, project: p })))
  const totalSubcontractValue = awardedWorkOrders.reduce((s, w) => s + (w.amount ?? 0), 0)

  return (
    <div className="dashboard accounts-executive-dashboard">
      <header className="page-header">
        <ContourLines className="page-contours" lines={12} />
        <div className="page-title">
          <h1>Accounts Dashboard</h1>
          <p>
            {formatLongDate(TODAY)} · {PERIOD_LABELS[period].current} · Awarded Projects &amp; Accounts Ledger
          </p>
        </div>
        <div className="page-actions">
          <PeriodSwitch />
        </div>
      </header>

      {/* Accounts Executive KPI Grid (Strictly Awarded Projects, Zero Enquiries/Proposals) */}
      <section className="stat-grid" aria-label="Accounts Key Figures">
        <StatCard tone="tone-good" icon={Award} label="Awarded Projects" value={awardedProjects.length} to="/projects">
          <span className="muted">{runningProjects.length} actively executing</span>
        </StatCard>

        <StatCard tone="tone-info" icon={FolderKanban} label="In-Execution Projects" value={runningProjects.length} to="/projects">
          <span className="muted">{awardedProjects.length - runningProjects.length} completed / closed</span>
        </StatCard>

        <StatCard tone="tone-good" icon={IndianRupee} label="Awarded Contract Value" value={totalContractValue} format={money.short}>
          <span className="muted">Across {wonLeads.length} awarded contracts</span>
        </StatCard>

        <StatCard tone="tone-attention" icon={HardHat} label="Subcontract Commitments" value={totalSubcontractValue} format={money.short}>
          <span className="muted">{awardedWorkOrders.length} vendor work orders issued</span>
        </StatCard>
      </section>

      {/* Row 1: Awarded Projects Ledger */}
      <div className="dash-row">
        <section className="card">
          <header className="card-header">
            <Layers className="card-icon" size={22} strokeWidth={1.8} />
            <div>
              <h2>Awarded Projects Register ({awardedProjects.length})</h2>
              <p className="card-subtitle">Real project execution status, timelines, and contract values for awarded jobs</p>
            </div>
            <div className="card-actions">
              <Link to="/projects" className="btn btn-outline">
                View All Projects <ExternalLink size={14} />
              </Link>
            </div>
          </header>

          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Project ID</th>
                  <th>Client / Company</th>
                  <th>Service</th>
                  <th className="num">Contract Value</th>
                  <th>Execution Stage</th>
                  <th>Started On</th>
                  <th className="num">Subcontracts</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {awardedProjects.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="empty-state">
                      No awarded projects found for {PERIOD_LABELS[period].current}.
                    </td>
                  </tr>
                ) : (
                  awardedProjects.map((p) => (
                    <tr key={p.id}>
                      <td className="cell-strong">{p.id}</td>
                      <td>
                        <div className="cell-strong">{p.lead.company}</div>
                        <div className="cell-sub">{p.lead.contactPerson}</div>
                      </td>
                      <td>{p.service}</td>
                      <td className="num">
                        <b className="text-ink">{money.format(p.lead.quoteValue ?? 0)}</b>
                      </td>
                      <td>
                        <span className="badge badge-subtle">{p.status}</span>
                      </td>
                      <td className="cell-sub">{p.startedOn ? formatDate(p.startedOn) : 'Pending onboarding'}</td>
                      <td className="num">{p.workOrders?.length || 0}</td>
                      <td>
                        <Link to={`/projects/${p.id}`} className="btn btn-xs">
                          Details
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {/* Row 2: Vendor Subcontracts & Outside Costs */}
      <div className="dash-row">
        <section className="card">
          <header className="card-header">
            <HardHat className="card-icon" size={22} strokeWidth={1.8} />
            <div>
              <h2>Vendor Subcontracts &amp; Billing Overview ({awardedWorkOrders.length})</h2>
              <p className="card-subtitle">Operational outside commitments issued for awarded project delivery</p>
            </div>
            <div className="card-actions">
              <Link to="/subcontracts" className="btn btn-outline">
                <FileSpreadsheet size={14} /> Subcontracts Register
              </Link>
            </div>
          </header>

          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Subcontract ID</th>
                  <th>Vendor</th>
                  <th>Assigned Project</th>
                  <th>Work Scope</th>
                  <th className="num">Subcontract Value</th>
                  <th>Status</th>
                  <th>Issued On</th>
                </tr>
              </thead>
              <tbody>
                {awardedWorkOrders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="empty-state">
                      No vendor subcontracts found for the awarded projects.
                    </td>
                  </tr>
                ) : (
                  awardedWorkOrders.map((w) => (
                    <tr key={w.id}>
                      <td className="cell-strong">{w.id}</td>
                      <td>
                        <div className="cell-strong">{w.vendor}</div>
                      </td>
                      <td>
                        <div>{w.project.name}</div>
                        <div className="cell-sub">{w.project.lead.company}</div>
                      </td>
                      <td>{w.work}</td>
                      <td className="num">
                        <b className="text-ink">{money.format(w.amount)}</b>
                      </td>
                      <td>
                        <span className={`badge ${WO_STATUS_TONE[w.status] ?? 'tone-neutral'}`}>{w.status}</span>
                      </td>
                      <td className="cell-sub">{w.issuedOn ? formatDate(w.issuedOn) : '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  )
}
