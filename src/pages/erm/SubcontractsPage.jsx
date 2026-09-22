import { ClipboardList, FilePlus2, HardHat, IndianRupee, Receipt, Search } from 'lucide-react'
import { useState } from 'react'
import { KpiCard } from '../../components/common/KpiCard'
import { RoleLink } from '../../components/common/RoleLink'
import { tabLink, useTabParam } from '../../components/common/useTabParam'
import { useCrm, useMoney } from '../../context/crm'
import { TODAY } from '../../data/mockData'
import { VENDORS, WORK_ORDER_STATUS } from '../../data/vendors'
import { addDays, formatNearDate, toISODate } from '../../utils/date'
import { ERM_STAGES, allProjects } from '../../utils/projects'
import '../projects/erm.css'

const todayISO = toISODate(TODAY)
const STATUS_TONE = { Issued: 'tone-neutral', 'In progress': 'tone-info', Completed: 'tone-attention', 'Bill received': 'tone-urgent', Paid: 'tone-good' }
const OPEN = ['Issued', 'In progress', 'Completed', 'Bill received']

function SubcontractForm({ projects, onDone }) {
  const { addWorkOrder } = useCrm()
  const [form, setForm] = useState({ projectId: '', vendor: VENDORS[0].name, work: '', amount: '', dueOn: toISODate(addDays(TODAY, 21)) })
  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value })
  const project = projects.find((p) => p.id === form.projectId)

  return (
    <form
      className="letter-form wo-form"
      onSubmit={(e) => {
        e.preventDefault()
        const id = `SC-${project.id.slice(3)}-${project.workOrders.length + 1}`
        addWorkOrder(project.lead.id, project, { id, vendor: form.vendor, work: form.work.trim(), amount: Number(form.amount), dueOn: form.dueOn })
        onDone()
      }}
    >
      <label className="field field-wide">
        <span className="field-label">Project</span>
        <select value={form.projectId} onChange={set('projectId')} required autoFocus>
          <option value="">Choose…</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.lead.company} — {p.name}
            </option>
          ))}
        </select>
      </label>
      <label className="field">
        <span className="field-label">Subcontractor</span>
        <select value={form.vendor} onChange={set('vendor')}>
          {VENDORS.map((v) => (
            <option key={v.name} value={v.name}>
              {v.name} — {v.work}
            </option>
          ))}
        </select>
      </label>
      <label className="field">
        <span className="field-label">Work</span>
        <input value={form.work} onChange={set('work')} placeholder="e.g. Core drilling, 3 holes × 50 m" required />
      </label>
      <label className="field">
        <span className="field-label">Contract value (₹, before GST)</span>
        <input type="number" min="1000" step="500" value={form.amount} onChange={set('amount')} required />
      </label>
      <label className="field">
        <span className="field-label">Work due by</span>
        <input type="date" value={form.dueOn} min={todayISO} onChange={set('dueOn')} required />
      </label>
      <div className="letter-form-actions">
        <button type="button" className="btn" onClick={onDone}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={!project || !form.work.trim() || !form.amount}>
          Issue subcontract
        </button>
      </div>
    </form>
  )
}

/*
 * Subcontracts: work given to outside firms against a project, from order to payment. (A client's
 * work order to us is the CRM's Client Approval step; this is the other direction.) Coordinators and team leads
 * run the work; the amounts stay hidden from them (Accounts sees them).
 */
export function SubcontractsPage() {
  const { leads, projectEdits, role, setWorkOrderStatus } = useCrm()
  const money = useMoney()
  const [tab, setTab] = useTabParam(['Open', 'Bills to pay', 'Paid', 'All'], 'Open')
  const [search, setSearch] = useState('')
  const [adding, setAdding] = useState(false)

  const projects = allProjects(leads, projectEdits)
  const orders = projects.flatMap((p) => p.workOrders.map((w) => ({ ...w, project: p }))).sort((a, b) => b.issuedOn.localeCompare(a.issuedOn))
  const tabs = { Open: (w) => OPEN.includes(w.status), 'Bills to pay': (w) => w.status === 'Bill received', Paid: (w) => w.status === 'Paid', All: () => true }
  const q = search.trim().toLowerCase()
  const visible = orders.filter(tabs[tab]).filter((w) => !q || `${w.id} ${w.vendor} ${w.work} ${w.project.lead.company} ${w.project.name}`.toLowerCase().includes(q))
  const sum = (list) => list.reduce((s, w) => s + w.amount, 0)
  const open = orders.filter(tabs.Open)
  const bills = orders.filter(tabs['Bills to pay'])
  const running = projects.filter((p) => p.stageIndex < ERM_STAGES.length && p.team.coordinator)
  const canIssue = ['Admin', 'Project Coordinator'].includes(role)

  return (
    <div className="module-page">
      <header className="page-header">
        <div className="page-title">
          <h1>Subcontracts</h1>
          <p>
            {orders.length} subcontracts with {new Set(orders.map((w) => w.vendor)).size} outside firms
          </p>
        </div>
        {canIssue && (
          <div className="page-actions">
            <button className="btn btn-primary" onClick={() => setAdding(true)}>
              <FilePlus2 size={16} /> New subcontract
            </button>
          </div>
        )}
      </header>

      <section className="stat-grid">
        <KpiCard tone="tone-info" icon={ClipboardList} label="Open Subcontracts" value={open.length} to={tabLink('/subcontracts', 'Open')}>
          <span className="muted">{open.filter((w) => w.dueOn < todayISO && ['Issued', 'In progress'].includes(w.status)).length} past their due date</span>
        </KpiCard>
        <KpiCard tone="tone-attention" icon={IndianRupee} to={tabLink('/subcontracts', 'Open')} label="Committed" value={money.hidden ? money.short(0) : sum(open)} format={money.short}>
          <span className="muted">Value of open subcontracts</span>
        </KpiCard>
        <KpiCard tone={bills.length ? 'tone-urgent' : 'tone-good'} icon={Receipt} label="Bills to Pay" value={bills.length} to={tabLink('/subcontracts', 'Bills to pay')}>
          <span className="muted">{money.hidden ? 'Amount with Accounts' : `${money.short(sum(bills))} to release`}</span>
        </KpiCard>
        <KpiCard tone="tone-neutral" icon={HardHat} label="Subcontractors" value={VENDORS.length}>
          <span className="muted">{new Set(open.map((w) => w.vendor)).size} working now</span>
        </KpiCard>
      </section>

      {adding && (
        <section className="card record-letter">
          <header className="card-header">
            <FilePlus2 size={18} className="card-icon" />
            <h2>New subcontract</h2>
          </header>
          <div className="record-letter-body">
            <SubcontractForm projects={running} onDone={() => setAdding(false)} />
          </div>
        </section>
      )}

      <section className="card">
        <div className="leads-toolbar">
          <label className="toolbar-search">
            <Search size={16} className="muted" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search subcontract, firm or client" aria-label="Search subcontracts" />
          </label>
        </div>
        <nav className="stage-tabs" aria-label="Filter subcontracts">
          {Object.keys(tabs).map((t) => (
            <button key={t} className={`stage-tab ${tab === t ? 'is-active' : ''}`} onClick={() => setTab(t)} aria-pressed={tab === t}>
              {t}
              <span>{orders.filter(tabs[t]).length}</span>
            </button>
          ))}
        </nav>
        {visible.length === 0 ? (
          <p className="empty-state">No subcontracts here.</p>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Subcontract</th>
                  <th>Subcontractor</th>
                  <th>Project</th>
                  <th className="num">Value</th>
                  <th>Due</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((w) => {
                  const late = w.dueOn < todayISO && ['Issued', 'In progress'].includes(w.status)
                  // Coordinators move the work along; paying the bill is for Accounts and the Admin.
                  const steps = WORK_ORDER_STATUS.filter((s) => money.hidden ? s !== 'Paid' || w.status === 'Paid' : true)
                  return (
                    <tr key={w.id}>
                      <td>
                        <div className="cell-strong mono-sub">{w.id}</div>
                        <div className="cell-sub">Issued {formatNearDate(w.issuedOn)}</div>
                      </td>
                      <td>
                        <div className="cell-strong">{w.vendor}</div>
                        <div className="cell-sub">{w.work}</div>
                      </td>
                      <td>
                        <RoleLink to={`/projects/${w.project.id}`} className="cell-strong cell-link">
                          {w.project.lead.company}
                        </RoleLink>
                        <div className="cell-sub">{w.project.name}</div>
                      </td>
                      <td className="num">
                        <b className="text-ink">{money.full(w.amount)}</b>
                      </td>
                      <td className={`nowrap ${late ? 'text-red' : ''}`}>
                        {formatNearDate(w.dueOn)}
                        {late && <div className="cell-sub text-red">Late</div>}
                      </td>
                      <td>
                        <select className={`wo-status ${STATUS_TONE[w.status]}`} value={w.status} onChange={(e) => setWorkOrderStatus(w.project.lead.id, w.project, w, e.target.value)} aria-label={`Status of ${w.id}`} disabled={w.status === 'Paid' && money.hidden}>
                          {steps.map((s) => (
                            <option key={s}>{s}</option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="card">
        <header className="card-header">
          <HardHat size={18} className="card-icon" />
          <h2>Subcontractors</h2>
        </header>
        <ul className="vendor-grid">
          {VENDORS.map((v) => {
            const mine = orders.filter((w) => w.vendor === v.name)
            return (
              <li key={v.name}>
                <strong>{v.name}</strong>
                <span className="muted">
                  {v.work} · {v.place}
                </span>
                <span className="vendor-count">
                  {mine.filter(tabs.Open).length} open · {mine.length} in all
                </span>
              </li>
            )
          })}
        </ul>
      </section>
    </div>
  )
}
