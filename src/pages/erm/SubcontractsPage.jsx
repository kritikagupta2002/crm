import { ClipboardList, FilePlus2, HardHat, IndianRupee, Plus, Receipt, Search } from 'lucide-react'
import { useState } from 'react'
import { KpiCard } from '../../components/common/KpiCard'
import { SideDrawer as Drawer } from '../../components/common/SideDrawer'
import { RoleLink } from '../../components/common/RoleLink'
import { tabLink, useTabParam } from '../../components/common/useTabParam'
import { BILL_ROLES, WORK_ROLES, maskAccount, useAccess, useCrm, useMoney } from '../../context/crm'
import { TODAY } from '../../data/mockData'
import { TDS_SECTIONS } from '../../data/vendors'
import { addDays, formatDate, formatNearDate, toISODate } from '../../utils/date'
import { ERM_STAGES, allProjects, nextWorkStep } from '../../utils/projects'
import { WO_STATUS_TONE, statusNote, vendorStats } from '../../utils/workOrders'
import { WorkOrderTrail, WorkStepForm } from './WorkOrderParts'
import '../projects/erm.css'

const todayISO = toISODate(TODAY)
const OPEN = ['Issued', 'In progress', 'Completed', 'Bill received']

/* Who may take a step: the project side runs the work, Accounts records and checks bills, the CFO pays. */
const canTake = (role, step) => (step.who === 'work' ? WORK_ROLES.includes(role) : BILL_ROLES[step.who].includes(role))

function SubcontractForm({ projects, vendors, onDone }) {
  const { addWorkOrder } = useCrm()
  const [form, setForm] = useState({ projectId: '', vendor: vendors[0].name, work: '', amount: '', dueOn: toISODate(addDays(TODAY, 21)) })
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
          {vendors.map((v) => (
            <option key={v.id} value={v.name}>
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

/* Vendor master: a new subcontractor with the details Accounts needs (GSTIN, PAN, TDS section, bank). */
function VendorForm({ withBank, onDone }) {
  const { addVendor } = useCrm()
  const [form, setForm] = useState({ name: '', work: '', place: '', contact: '', phone: '', email: '', gstin: '', pan: '', tds: '1', bankName: '', accountNo: '', ifsc: '' })
  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value })
  const phoneOk = /^[6-9]\d{9}$/.test(form.phone.replace(/\D/g, '').slice(-10))
  const gstinOk = !form.gstin || /^\d{2}[A-Z]{5}\d{4}[A-Z][A-Z\d]Z[A-Z\d]$/.test(form.gstin.toUpperCase())
  const panOk = !form.pan || /^[A-Z]{5}\d{4}[A-Z]$/.test(form.pan.toUpperCase())

  return (
    <form
      className="letter-form wo-form"
      onSubmit={(e) => {
        e.preventDefault()
        const tds = TDS_SECTIONS[Number(form.tds)]
        addVendor({
          name: form.name.trim(),
          work: form.work.trim(),
          place: form.place.trim(),
          contact: form.contact.trim(),
          phone: form.phone.replace(/\D/g, '').slice(-10),
          email: form.email.trim() || undefined,
          gstin: form.gstin.trim().toUpperCase() || undefined,
          pan: form.pan.trim().toUpperCase() || undefined,
          tds: { section: tds.section, rate: tds.rate },
          bank: withBank && form.accountNo.trim() ? { name: form.bankName.trim(), accountNo: form.accountNo.trim(), ifsc: form.ifsc.trim().toUpperCase() } : undefined,
        })
        onDone()
      }}
    >
      <label className="field">
        <span className="field-label">Firm name</span>
        <input value={form.name} onChange={set('name')} required autoFocus />
      </label>
      <label className="field">
        <span className="field-label">Work they do</span>
        <input value={form.work} onChange={set('work')} placeholder="e.g. Core drilling" required />
      </label>
      <label className="field">
        <span className="field-label">City</span>
        <input value={form.place} onChange={set('place')} required />
      </label>
      <label className="field">
        <span className="field-label">Contact person</span>
        <input value={form.contact} onChange={set('contact')} required />
      </label>
      <label className={`field ${form.phone && !phoneOk ? 'has-error' : ''}`}>
        <span className="field-label">Mobile (vendor portal login)</span>
        <input type="tel" inputMode="numeric" value={form.phone} onChange={set('phone')} required />
        {form.phone && !phoneOk && <span className="field-error">Enter a 10-digit mobile number</span>}
      </label>
      <label className="field">
        <span className="field-label">Email</span>
        <input type="email" value={form.email} onChange={set('email')} />
      </label>
      <label className={`field ${gstinOk ? '' : 'has-error'}`}>
        <span className="field-label">GSTIN</span>
        <input value={form.gstin} onChange={set('gstin')} placeholder="08ABCDE1234F1Z5" />
        {!gstinOk && <span className="field-error">Check the GSTIN (15 characters)</span>}
      </label>
      <label className={`field ${panOk ? '' : 'has-error'}`}>
        <span className="field-label">PAN</span>
        <input value={form.pan} onChange={set('pan')} placeholder="ABCDE1234F" />
        {!panOk && <span className="field-error">Check the PAN (10 characters)</span>}
      </label>
      <label className="field field-wide">
        <span className="field-label">TDS on payments</span>
        <select value={form.tds} onChange={set('tds')}>
          {TDS_SECTIONS.map((t, i) => (
            <option key={t.label} value={i}>
              {t.label}
            </option>
          ))}
        </select>
      </label>
      {withBank && (
        <>
          <label className="field">
            <span className="field-label">Bank & branch</span>
            <input value={form.bankName} onChange={set('bankName')} />
          </label>
          <label className="field">
            <span className="field-label">Account no.</span>
            <input value={form.accountNo} onChange={set('accountNo')} inputMode="numeric" />
          </label>
          <label className="field">
            <span className="field-label">IFSC</span>
            <input value={form.ifsc} onChange={set('ifsc')} />
          </label>
        </>
      )}
      <div className="letter-form-actions">
        <button type="button" className="btn" onClick={onDone}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={!form.name.trim() || !form.work.trim() || !form.contact.trim() || !phoneOk || !gstinOk || !panOk}>
          Register subcontractor
        </button>
      </div>
    </form>
  )
}


/* One subcontract: its next step (for whoever may take it) and its record so far. */
function WorkOrderDrawer({ order, vendor, onClose }) {
  const { role, recordWorkStep, settings } = useCrm()
  const money = useMoney()
  const [taking, setTaking] = useState(false)
  const next = nextWorkStep(order)
  const allowed = next && canTake(role, next)
  const take = (details) => {
    recordWorkStep(order.project.lead.id, order.project, order, next.key, details)
    setTaking(false)
  }
  const facts = [
    ['Project', order.project.name, order.project.lead.company],
    ['Value', money.full(order.amount), 'before GST'],
    ['Issued', formatDate(order.issuedOn)],
    ['Due', formatDate(order.dueOn), order.late && !order.delivery ? 'late' : ''],
  ]

  return (
    <Drawer title={`${order.id} · ${order.vendor}`} sub={order.work} onClose={onClose}>
      <div className="wo-head">
        <span className={`pill status-pill ${WO_STATUS_TONE[order.status]}`}>{order.status}</span>
        <span className="muted">{statusNote(order)}</span>
        <RoleLink to={`/projects/${order.project.id}`} className="link-button" hideIfLocked>
          Open project →
        </RoleLink>
      </div>
      <dl className="wo-facts">
        {facts.map(([label, value, sub]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>
              {value}
              {sub && <span className="muted"> · {sub}</span>}
            </dd>
          </div>
        ))}
      </dl>

      {next && (
        <section className="wo-next">
          <h3>Next: {next.label.toLowerCase()}</h3>
          {!allowed ? (
            <p className="muted small">{next.who === 'work' ? 'The project team records this.' : next.who === 'pay' ? 'The CFO or the Admin releases the payment.' : 'Accounts records and checks the bill.'}</p>
          ) : next.key === 'start' ? (
            <button className="btn btn-primary" onClick={() => take({})}>
              Mark started today
            </button>
          ) : taking ? (
            <WorkStepForm order={order} step={next.key} vendor={vendor} onSubmit={take} onCancel={() => setTaking(false)} />
          ) : (
            <button className="btn btn-primary" onClick={() => setTaking(true)}>
              {next.label}
            </button>
          )}
        </section>
      )}

      <h3 className="wo-trail-title">Record</h3>
      <WorkOrderTrail order={order} money={money} company={order.project.lead.company} companyName={settings.companyName} />
    </Drawer>
  )
}

/* One subcontractor: the vendor master details and how they have delivered. Bank details only for Finance and the Admin. */
function VendorDrawer({ vendor, stats, onOpenOrder, onClose }) {
  const money = useMoney()
  const { bank } = useAccess()
  const details = [
    ['Vendor ID', vendor.id, 'vendor portal login'],
    ['Contact', vendor.contact, vendor.phone],
    ['Email', vendor.email],
    ['GSTIN', vendor.gstin],
    ['PAN', vendor.pan],
    ['TDS', vendor.tds && `${vendor.tds.section} @ ${vendor.tds.rate}%`],
    ['Bank', vendor.bank ? `${vendor.bank.name} · ${maskAccount(vendor.bank.accountNo, bank)}` : null, vendor.bank && bank ? vendor.bank.ifsc : ''],
    ['Registered', vendor.since && formatDate(vendor.since)],
  ].filter(([, v]) => v)

  return (
    <Drawer title={vendor.name} sub={`${vendor.work} · ${vendor.place}`} onClose={onClose}>
      <div className="vendor-scores">
        <div>
          <strong>{stats.onTimePct === null ? '—' : `${stats.onTimePct}%`}</strong>
          <span>on time</span>
        </div>
        <div>
          <strong>{stats.avgDelay ? `${stats.avgDelay} d` : '—'}</strong>
          <span>average delay when late</span>
        </div>
        <div>
          <strong>{stats.orders.length}</strong>
          <span>subcontracts · {stats.open} open</span>
        </div>
        <div>
          <strong>{stats.returned}</strong>
          <span>bills returned</span>
        </div>
      </div>
      <dl className="wo-facts">
        {details.map(([label, value, sub]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>
              {value}
              {sub && <span className="muted"> · {sub}</span>}
            </dd>
          </div>
        ))}
      </dl>
      {!bank && vendor.bank && <p className="muted small">Bank details are shown only to Finance and the Admin.</p>}
      <h3 className="wo-trail-title">Subcontracts</h3>
      {stats.orders.length === 0 ? (
        <p className="muted small">No work given yet.</p>
      ) : (
        <ul className="letter-list">
          {stats.orders.map((w) => (
            <li key={w.id}>
              <HardHat size={16} />
              <span>
                <button className="link-button cell-strong" onClick={() => onOpenOrder(w.id)}>
                  {w.id} — {w.work}
                </button>
                <span className="muted">
                  {w.project.lead.company} · {money.full(w.amount)} · {statusNote(w)}
                </span>
              </span>
              <span className={`pill status-pill ${WO_STATUS_TONE[w.status]}`}>{w.status}</span>
            </li>
          ))}
        </ul>
      )}
    </Drawer>
  )
}

/*
 * Subcontracts: work given to outside firms against a project, from order to payment, in the vendor sheet's
 * steps — delivery, bill, a 3-way check by Accounts (order, delivery, bill), then payment with TDS by the CFO.
 * (A client's work order to us is the CRM's Client Approval step; this is the other direction.) Coordinators
 * and team leads run the work; the amounts stay hidden from them.
 */
export function SubcontractsPage() {
  const { leads, projectEdits, role, vendors } = useCrm()
  const money = useMoney()
  const { bank } = useAccess()
  const [tab, setTab] = useTabParam(['Open', 'Bills to pay', 'Paid', 'All'], 'Open')
  const [search, setSearch] = useState('')
  const [adding, setAdding] = useState(null)
  const [openId, setOpenId] = useState(null)
  const [vendorId, setVendorId] = useState(null)

  const projects = allProjects(leads, projectEdits)
  const orders = projects.flatMap((p) => p.workOrders.map((w) => ({ ...w, project: p }))).sort((a, b) => b.issuedOn.localeCompare(a.issuedOn))
  const tabs = { Open: (w) => OPEN.includes(w.status), 'Bills to pay': (w) => w.status === 'Bill received', Paid: (w) => w.status === 'Paid', All: () => true }
  const q = search.trim().toLowerCase()
  const visible = orders.filter(tabs[tab]).filter((w) => !q || `${w.id} ${w.vendor} ${w.work} ${w.project.lead.company} ${w.project.name}`.toLowerCase().includes(q))
  const sum = (list) => list.reduce((s, w) => s + w.amount, 0)
  const open = orders.filter(tabs.Open)
  const bills = orders.filter(tabs['Bills to pay'])
  const toCheck = bills.filter((w) => !w.check?.ok)
  const running = projects.filter((p) => p.stageIndex < ERM_STAGES.length && p.team.coordinator)
  const canIssue = ['Admin', 'Project Coordinator'].includes(role)
  const canRegister = ['Admin', 'Project Coordinator', 'Finance'].includes(role)
  const delivered = orders.filter((w) => w.delivery)
  const onTimePct = delivered.length ? Math.round((delivered.filter((w) => w.delayDays <= 0).length / delivered.length) * 100) : null
  const order = orders.find((w) => w.id === openId)
  const vendor = vendors.find((v) => v.id === vendorId)

  return (
    <div className="module-page">
      <header className="page-header">
        <div className="page-title">
          <h1>Subcontracts</h1>
          <p>
            {orders.length} subcontracts with {new Set(orders.map((w) => w.vendor)).size} outside firms
          </p>
        </div>
        {(canIssue || canRegister) && (
          <div className="page-actions">
            {canRegister && (
              <button className="btn" onClick={() => setAdding('vendor')}>
                <Plus size={16} /> Add subcontractor
              </button>
            )}
            {canIssue && (
              <button className="btn btn-primary" onClick={() => setAdding('order')}>
                <FilePlus2 size={16} /> New subcontract
              </button>
            )}
          </div>
        )}
      </header>

      <section className="stat-grid">
        <KpiCard tone="tone-info" icon={ClipboardList} label="Open Subcontracts" value={open.length} to={tabLink('/subcontracts', 'Open')}>
          <span className="muted">{open.filter((w) => w.late && !w.delivery).length} past their due date</span>
        </KpiCard>
        <KpiCard tone="tone-attention" icon={IndianRupee} to={tabLink('/subcontracts', 'Open')} label="Committed" value={money.hidden ? money.short(0) : sum(open)} format={money.short}>
          <span className="muted">Value of open subcontracts</span>
        </KpiCard>
        <KpiCard tone={bills.length ? 'tone-urgent' : 'tone-good'} icon={Receipt} label="Bills" value={bills.length} to={tabLink('/subcontracts', 'Bills to pay')}>
          <span className="muted">
            {toCheck.length} to check · {bills.length - toCheck.length} ready to pay
          </span>
        </KpiCard>
        <KpiCard tone="tone-neutral" icon={HardHat} label="Subcontractors" value={vendors.length}>
          <span className="muted">{onTimePct === null ? 'No deliveries yet' : `${onTimePct}% of work delivered on time`}</span>
        </KpiCard>
      </section>

      {adding && (
        <section className="card record-letter">
          <header className="card-header">
            {adding === 'order' ? <FilePlus2 size={18} className="card-icon" /> : <HardHat size={18} className="card-icon" />}
            <h2>{adding === 'order' ? 'New subcontract' : 'New subcontractor'}</h2>
          </header>
          <div className="record-letter-body">
            {adding === 'order' ? <SubcontractForm projects={running} vendors={vendors} onDone={() => setAdding(null)} /> : <VendorForm withBank={bank} onDone={() => setAdding(null)} />}
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
                  <th />
                </tr>
              </thead>
              <tbody>
                {visible.map((w) => {
                  const next = nextWorkStep(w)
                  const mine = next && canTake(role, next)
                  return (
                    <tr key={w.id} className="clickable-row" onClick={() => setOpenId(w.id)}>
                      <td>
                        <div className="cell-strong mono-sub">{w.id}</div>
                        <div className="cell-sub">Issued {formatNearDate(w.issuedOn)}</div>
                      </td>
                      <td>
                        <div className="cell-strong">{w.vendor}</div>
                        <div className="cell-sub">{w.work}</div>
                      </td>
                      <td>
                        <div className="cell-strong">{w.project.lead.company}</div>
                        <div className="cell-sub">{w.project.name}</div>
                      </td>
                      <td className="num">
                        <b className="text-ink">{money.full(w.amount)}</b>
                        {!money.hidden && w.match && !w.match.amount && <div className="cell-sub text-red">bill {w.match.diff > 0 ? '+' : '−'}{money.full(Math.abs(w.match.diff))}</div>}
                      </td>
                      <td className={`nowrap ${w.late && !w.delivery ? 'text-red' : ''}`}>
                        {formatNearDate(w.dueOn)}
                        {w.late && !w.delivery && <div className="cell-sub text-red">Late</div>}
                        {w.delayDays > 0 && <div className="cell-sub">delivered {w.delayDays} d late</div>}
                      </td>
                      <td>
                        <span className={`pill status-pill ${WO_STATUS_TONE[w.status]}`}>{w.status}</span>
                        <div className="cell-sub">{statusNote(w)}</div>
                      </td>
                      <td className="num">
                        {mine && (
                          <button
                            className="btn btn-small"
                            onClick={(e) => {
                              e.stopPropagation()
                              setOpenId(w.id)
                            }}
                          >
                            {next.label}
                          </button>
                        )}
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
          {vendors.map((v) => {
            const stats = vendorStats(v, orders)
            return (
              <li key={v.id}>
                <button className="vendor-card" onClick={() => setVendorId(v.id)}>
                  <strong>{v.name}</strong>
                  <span className="muted">
                    {v.work} · {v.place}
                  </span>
                  <span className="vendor-count">
                    {stats.open} open · {stats.orders.length} in all
                    {stats.onTimePct !== null && (
                      <b className={stats.onTimePct >= 75 ? 'text-green' : 'text-red'}>
                        {' '}
                        · {stats.onTimePct}% on time
                      </b>
                    )}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      </section>

      {order && <WorkOrderDrawer key={`${order.id}-${order.status}`} order={order} vendor={vendors.find((v) => v.name === order.vendor)} onClose={() => setOpenId(null)} />}
      {vendor && !order && (
        <VendorDrawer
          vendor={vendor}
          stats={vendorStats(vendor, orders)}
          onOpenOrder={(id) => {
            setVendorId(null)
            setOpenId(id)
          }}
          onClose={() => setVendorId(null)}
        />
      )}
    </div>
  )
}
