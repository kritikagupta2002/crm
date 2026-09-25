import { HardHat, IndianRupee, Receipt, Wallet } from 'lucide-react'
import { useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { KpiCard } from '../../components/common/KpiCard'
import { useCrm } from '../../context/crm'
import { formatDate, formatNearDate } from '../../utils/date'
import { nextWorkStep } from '../../utils/projects'
import { WO_STATUS_TONE, vendorOrders, vendorStats } from '../../utils/workOrders'
import { WorkOrderTrail, WorkStepForm } from '../erm/WorkOrderParts'

/* What the vendor sees for each state of the order. */
const VENDOR_NOTE = {
  Issued: 'Please confirm when the work starts.',
  'In progress': 'Upload the report or data here when the work is done.',
  Completed: 'Work received. Send your bill here.',
  'Bill received': 'Your bill is with our Accounts team.',
  Paid: 'Paid.',
}

function OrderCard({ order, vendor, companyName }) {
  const { recordWorkStep } = useCrm()
  const [taking, setTaking] = useState(false)
  const next = nextWorkStep(order)
  // The vendor starts the work, delivers it and sends the bill; checking and paying are ours.
  const theirs = next && ['start', 'deliver', 'bill'].includes(next.key)
  const take = (details) => {
    recordWorkStep(order.project.lead.id, order.project, order, next.key, details, { byVendor: true })
    setTaking(false)
  }
  const returned = order.status === 'Completed' && order.returned?.length ? order.returned[order.returned.length - 1] : null

  return (
    <section className="card portal-card vendor-order">
      <div className="portal-card-head">
        <h2 className="card-title-icon">
          <span className="title-icon">
            <HardHat size={16} />
          </span>
          {order.id}
        </h2>
        <span className={`pill status-pill ${WO_STATUS_TONE[order.status]}`}>{order.status}</span>
      </div>
      <p className="vendor-order-work">{order.work}</p>
      <dl className="wo-facts">
        <div>
          <dt>Project</dt>
          <dd>
            {order.project.name} · {order.project.site}
          </dd>
        </div>
        <div>
          <dt>For</dt>
          <dd>{order.project.lead.company}</dd>
        </div>
        <div>
          <dt>Order value</dt>
          <dd>₹{order.amount.toLocaleString('en-IN')} + GST</dd>
        </div>
        <div>
          <dt>Due by</dt>
          <dd className={order.late && !order.delivery ? 'text-red' : undefined}>{formatDate(order.dueOn)}</dd>
        </div>
      </dl>

      {returned && (
        <p className="wo-diff">
          Bill {returned.no} was returned on {formatNearDate(returned.returnedOn)}: {returned.reason}. Please send a corrected bill.
        </p>
      )}
      {order.status !== 'Paid' && <p className="muted small">{order.status === 'Bill received' && order.check?.ok ? 'Checked by Accounts; payment is being released.' : VENDOR_NOTE[order.status]}</p>}

      {theirs &&
        (next.key === 'start' ? (
          <button className="btn btn-primary" onClick={() => take({})}>
            Work has started
          </button>
        ) : taking ? (
          <div className="wo-next">
            <WorkStepForm order={order} step={next.key} vendor={vendor} onSubmit={take} onCancel={() => setTaking(false)} forVendor />
          </div>
        ) : (
          <button className="btn btn-primary" onClick={() => setTaking(true)}>
            {next.key === 'deliver' ? 'Upload delivered work' : 'Send bill'}
          </button>
        ))}

      <details className="vendor-trail">
        <summary>History</summary>
        <WorkOrderTrail order={order} company={order.project.lead.company} companyName={companyName} />
      </details>
    </section>
  )
}

/* Work orders: the work allotted to this firm, from order to payment. The firm starts, delivers and bills here. */
export function VendorOrdersPage() {
  const { vendor } = useOutletContext()
  const { leads, projectEdits, settings } = useCrm()
  const orders = vendorOrders(vendor, leads, projectEdits)
  const waiting = orders.filter((w) => ['start', 'deliver', 'bill'].includes(nextWorkStep(w)?.key)).length

  return (
    <div className="module-page vendor-page">
      <header className="page-header">
        <div className="page-title">
          <h1>Work Orders</h1>
          <p>{waiting ? `${waiting} order${waiting === 1 ? '' : 's'} waiting for you` : 'Nothing waiting for you'}</p>
        </div>
      </header>
      {orders.length === 0 ? (
        <section className="card">
          <p className="empty-state">No work orders yet. When a bid of yours is allotted, its work order appears here.</p>
        </section>
      ) : (
        <div className="vendor-orders">
          {orders.map((w) => (
            <OrderCard key={`${w.id}-${w.status}`} order={w} vendor={vendor} companyName={settings.companyName} />
          ))}
        </div>
      )}
    </div>
  )
}

/* Payments: what has been paid on each order, the TDS deducted, and what is still to come. */
export function VendorPaymentsPage() {
  const { vendor } = useOutletContext()
  const { leads, projectEdits } = useCrm()
  const orders = vendorOrders(vendor, leads, projectEdits)
  const stats = vendorStats(vendor, orders)
  const paid = orders.filter((w) => w.payment)
  const received = paid.reduce((s, w) => s + w.payment.gross - w.payment.tds.amount, 0)
  const tds = paid.reduce((s, w) => s + w.payment.tds.amount, 0)
  const due = orders.filter((w) => w.bill && !w.payment).reduce((s, w) => s + w.bill.amount, 0)
  const rupees = (n) => `₹${Math.round(n).toLocaleString('en-IN')}`

  return (
    <div className="module-page vendor-page">
      <header className="page-header">
        <div className="page-title">
          <h1>Payments</h1>
          <p>Paid to {vendor.bank?.name ?? 'your bank account'} · TDS under section {vendor.tds?.section ?? '—'}</p>
        </div>
      </header>
      <section className="stat-grid">
        <KpiCard tone="tone-good" icon={Wallet} label="Received" value={rupees(received)}>
          <span className="muted">{paid.length} order{paid.length === 1 ? '' : 's'} paid</span>
        </KpiCard>
        <KpiCard tone="tone-neutral" icon={Receipt} label="TDS Deducted" value={rupees(tds)}>
          <span className="muted">Shows in your Form 26AS</span>
        </KpiCard>
        <KpiCard tone="tone-attention" icon={IndianRupee} label="Bills Under Check" value={rupees(due)}>
          <span className="muted">Before GST</span>
        </KpiCard>
        <KpiCard tone="tone-info" icon={HardHat} label="Delivered on Time" value={stats.onTimePct === null ? '—' : `${stats.onTimePct}%`}>
          <span className="muted">
            {stats.orders.length} order{stats.orders.length === 1 ? '' : 's'} in all · {stats.open} open
          </span>
        </KpiCard>
      </section>
      <section className="card">
        <div className="card-header">
          <h2>Payments received</h2>
        </div>
        {paid.length === 0 ? (
          <p className="empty-state">No payments yet.</p>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Paid on</th>
                  <th>Work order</th>
                  <th>Bill</th>
                  <th className="num">Gross</th>
                  <th className="num">TDS</th>
                  <th className="num">Net paid</th>
                  <th>Reference</th>
                </tr>
              </thead>
              <tbody>
                {paid.map((w) => (
                  <tr key={w.id}>
                    <td>{formatNearDate(w.payment.on)}</td>
                    <td>
                      <div className="cell-strong mono-sub">{w.id}</div>
                      <div className="cell-sub cell-clip">{w.work}</div>
                    </td>
                    <td className="mono-sub">{w.bill?.no ?? '—'}</td>
                    <td className="num">{rupees(w.payment.gross)}</td>
                    <td className="num">
                      {rupees(w.payment.tds.amount)} <span className="muted">({w.payment.tds.section})</span>
                    </td>
                    <td className="num cell-strong">{rupees(w.payment.gross - w.payment.tds.amount)}</td>
                    <td className="mono-sub">{w.payment.ref}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      {due > 0 && <p className="muted small">Bills under check are paid once Accounts has matched them with the order and the delivered work.</p>}
    </div>
  )
}
