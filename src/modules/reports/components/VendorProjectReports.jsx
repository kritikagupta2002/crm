import { useState } from 'react'
import { CheckCircle2, Download, FileSpreadsheet, HardHat, IndianRupee, Layers, RotateCcw, Search, Truck, X } from 'lucide-react'
import { KpiCard } from '../../../shared/components/KpiCard'
import { useCrm, useMoney } from '../../../core/permissions/crm'
import { formatDate } from '../../../shared/utils/date'
import { downloadCsv } from '../../../shared/utils/exportCsv'
import { allProjects } from '../../erm/utils/projects'
import { WO_STATUS_TONE } from '../../erm/utils/workOrders'

export function VendorProjectReports({ switcher }) {
  const { leads, projectEdits, role } = useCrm()
  const money = useMoney()

  // Filter states
  const [selectedVendor, setSelectedVendor] = useState('all')
  const [selectedProject, setSelectedProject] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [search, setSearch] = useState('')

  // All work orders from projects
  const rawProjects = allProjects(leads, projectEdits)
  // For Accounts Executive, ensure awarded projects only
  const projects = role === 'Accounts Executive' ? rawProjects.filter((p) => p.lead?.stage === 'Won') : rawProjects

  const allOrders = projects.flatMap((p) => p.workOrders.map((w) => ({ ...w, project: p })))

  // Distinct dropdown options
  const vendors = [...new Set(allOrders.map((w) => w.vendor))].sort()
  const statuses = ['Issued', 'In progress', 'Completed', 'Bill received', 'Paid']

  // Filter logic
  const filteredOrders = allOrders.filter((w) => {
    if (selectedVendor !== 'all' && w.vendor !== selectedVendor) return false
    if (selectedProject !== 'all' && w.project.id !== selectedProject) return false
    if (selectedStatus !== 'all' && w.status !== selectedStatus) return false
    if (search.trim()) {
      const q = search.toLowerCase()
      const match =
        w.id.toLowerCase().includes(q) ||
        w.vendor.toLowerCase().includes(q) ||
        w.work.toLowerCase().includes(q) ||
        w.project.name.toLowerCase().includes(q) ||
        (w.project.lead?.company && w.project.lead.company.toLowerCase().includes(q))
      if (!match) return false
    }
    return true
  })

  // Metrics from filtered records
  const totalAmount = filteredOrders.reduce((s, w) => s + (w.amount ?? 0), 0)
  const billedAmount = filteredOrders.filter((w) => w.bill).reduce((s, w) => s + (w.bill.amount ?? w.amount ?? 0), 0)
  const paidAmount = filteredOrders.filter((w) => w.payment).reduce((s, w) => s + (w.bill?.amount ?? w.amount ?? 0), 0)
  const pendingCheckCount = filteredOrders.filter((w) => w.status === 'Bill received' && !w.check?.ok).length

  const exportVendorCsv = () => {
    downloadCsv(`vendor-projects-${selectedVendor}-${selectedProject}.csv`, [
      { label: 'Subcontract ID', value: (w) => w.id },
      { label: 'Vendor', value: (w) => w.vendor },
      { label: 'Project ID', value: (w) => w.project.id },
      { label: 'Project Name', value: (w) => w.project.name },
      { label: 'Client', value: (w) => w.project.lead?.company ?? '' },
      { label: 'Work Scope', value: (w) => w.work },
      { label: 'Amount (INR)', value: (w) => w.amount },
      { label: 'Billed Amount (INR)', value: (w) => w.bill?.amount ?? '' },
      { label: 'Status', value: (w) => w.status },
      { label: 'Issued On', value: (w) => w.issuedOn ?? '' },
      { label: 'Due On', value: (w) => w.dueOn ?? '' },
    ], filteredOrders)
  }

  return (
    <div className="module-page vendor-project-reports">
      <header className="page-header">
        <div className="page-title">
          <h1>Vendor &amp; Subcontract Projects Report</h1>
          <p>
            {allOrders.length} vendor subcontracts on record · outside contractor commitments, billing &amp; delivery
          </p>
        </div>
        <div className="page-actions">
          {switcher}
        </div>
      </header>

      {/* KPI Cards */}
      <section className="stat-grid" aria-label="Vendor Project KPIs">
        <KpiCard tone="tone-info" icon={Truck} label="Subcontract Orders" value={filteredOrders.length}>
          <span className="muted">Across {vendors.length} external partners</span>
        </KpiCard>

        <KpiCard tone="tone-attention" icon={HardHat} label="Committed Value" value={totalAmount} format={money.short}>
          <span className="muted">Total subcontract commitment</span>
        </KpiCard>

        <KpiCard tone="tone-info" icon={FileSpreadsheet} label="Bills Received" value={billedAmount} format={money.short}>
          <span className="muted">{pendingCheckCount} pending inspection</span>
        </KpiCard>

        <KpiCard tone="tone-good" icon={CheckCircle2} label="Disbursed / Paid" value={paidAmount} format={money.short}>
          <span className="muted">{money.short(totalAmount - paidAmount)} outstanding</span>
        </KpiCard>
      </section>

      {/* Filter Toolbar */}
      <section className="card" style={{ padding: '14px 18px', marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center', flex: 1, minWidth: 0 }}>
            <div style={{ minWidth: 180, flex: '1 1 180px', maxWidth: 220 }}>
              <select
                className="select"
                value={selectedVendor}
                onChange={(e) => setSelectedVendor(e.target.value)}
                style={{ width: '100%' }}
                aria-label="Filter by Vendor"
              >
                <option value="all">All Vendors ({vendors.length})</option>
                {vendors.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ minWidth: 200, flex: '1 1 200px', maxWidth: 260 }}>
              <select
                className="select"
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
                style={{ width: '100%' }}
                aria-label="Filter by Project"
              >
                <option value="all">All Projects ({projects.length})</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.id} — {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ minWidth: 140, flex: '1 1 140px', maxWidth: 170 }}>
              <select
                className="select"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                style={{ width: '100%' }}
                aria-label="Filter by Status"
              >
                <option value="all">All Statuses</option>
                {statuses.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <label className="toolbar-search" style={{ minWidth: 220, flex: '1 1 220px', maxWidth: 320 }}>
              <Search size={15} className="muted" />
              <input
                type="text"
                placeholder="Search vendor, work, client..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                aria-label="Search vendor, work, client"
              />
            </label>

            {(selectedVendor !== 'all' || selectedProject !== 'all' || selectedStatus !== 'all' || search.trim()) && (
              <button
                className="btn btn-ghost"
                onClick={() => {
                  setSelectedVendor('all')
                  setSelectedProject('all')
                  setSelectedStatus('all')
                  setSearch('')
                }}
                style={{ height: '38px', gap: '6px', fontSize: '13px' }}
                title="Reset all filters"
              >
                <X size={14} /> Reset
              </button>
            )}
          </div>

          <div>
            <button className="btn" onClick={exportVendorCsv} style={{ height: '38px' }}>
              <Download size={15} /> Export CSV
            </button>
          </div>
        </div>
      </section>

      {/* Subcontracts Table */}
      <section className="card">
        <header className="card-header">
          <Layers className="card-icon" size={22} strokeWidth={1.8} />
          <div>
            <h2>Vendor Subcontract Orders ({filteredOrders.length} records)</h2>
            <p className="card-subtitle">Itemized contractor engagements for core drilling, assaying, geophysical surveys, and machinery leases</p>
          </div>
        </header>

        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Subcontract ID</th>
                <th>Vendor</th>
                <th>Project &amp; Client</th>
                <th>Work Scope</th>
                <th className="num">Order Value</th>
                <th className="num">Billed Amount</th>
                <th>Status</th>
                <th>Timeline / Issued</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="empty-state" style={{ padding: '3rem 1rem', textAlign: 'center' }}>
                    <FileSpreadsheet size={32} className="text-muted mb-2" style={{ margin: '0 auto 0.5rem', opacity: 0.6 }} />
                    <div style={{ fontWeight: 600 }}>No vendor project records found for the selected filters.</div>
                    <div className="text-muted text-xs mt-1">Try resetting the vendor, project, or status filters.</div>
                  </td>
                </tr>
              ) : (
                filteredOrders.map((w) => (
                  <tr key={w.id}>
                    <td className="cell-strong">{w.id}</td>
                    <td>
                      <div className="cell-strong">{w.vendor}</div>
                    </td>
                    <td>
                      <div>{w.project.name}</div>
                      <div className="cell-sub">{w.project.lead?.company} ({w.project.id})</div>
                    </td>
                    <td>{w.work}</td>
                    <td className="num">
                      <b className="text-ink">{money.format(w.amount)}</b>
                    </td>
                    <td className="num">
                      {w.bill ? <b>{money.format(w.bill.amount)}</b> : <span className="muted">—</span>}
                    </td>
                    <td>
                      <span className={`badge ${WO_STATUS_TONE[w.status] ?? 'tone-neutral'}`}>{w.status}</span>
                    </td>
                    <td className="cell-sub">
                      <div>Issued {w.issuedOn ? formatDate(w.issuedOn) : '—'}</div>
                      {w.dueOn && <div className="text-muted text-xs">Due {formatDate(w.dueOn)}</div>}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
