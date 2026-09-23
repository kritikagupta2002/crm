import { HardHat, LogOut, Mail, MapPin, Phone, UserRound } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { Logo } from '../../components/common/Logo'
import { maskAccount, useCrm } from '../../context/crm'
import { formatDate, formatNearDate } from '../../utils/date'
import { allProjects, nextWorkStep } from '../../utils/projects'
import { WO_STATUS_TONE, vendorStats } from '../../utils/workOrders'
import { WorkOrderTrail, WorkStepForm } from '../erm/WorkOrderParts'
import { PortalBand } from '../portal/PortalBand'
import '../portal/portal.css'
import '../projects/erm.css'
import './vendor.css'

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

/*
 * The vendor portal (vendor sheet, flowchart 4): a subcontractor sees the work orders given to it, uploads the
 * delivered work and its bill, and follows the check and the payment. It never sees other vendors or our margins.
 */
export function VendorPortalPage() {
  const { vendorId, vendors, leads, projectEdits, settings, signOutVendor } = useCrm()
  const navigate = useNavigate()
  const vendor = vendors.find((v) => v.id === vendorId)

  useEffect(() => {
    if (vendor) document.title = `${vendor.name} · Vendor Portal`
  }, [vendor])

  if (!vendor) return <Navigate to="/login" replace state={{ tab: 'vendor' }} />

  const orders = allProjects(leads, projectEdits)
    .flatMap((p) => p.workOrders.map((w) => ({ ...w, project: p })))
    .filter((w) => w.vendor === vendor.name)
    .sort((a, b) => (a.status === 'Paid') - (b.status === 'Paid') || b.issuedOn.localeCompare(a.issuedOn))
  const stats = vendorStats(vendor, orders)
  const action = orders.filter((w) => ['start', 'deliver', 'bill'].includes(nextWorkStep(w)?.key)).length
  const paid = orders.filter((w) => w.payment)
  const received = paid.reduce((s, w) => s + w.payment.gross - w.payment.tds.amount, 0)
  const tdsTotal = paid.reduce((s, w) => s + w.payment.tds.amount, 0)

  return (
    <div className="portal vendor-portal">
      <header className="portal-top">
        <div className="portal-top-inner">
          <div className="portal-brand">
            <Logo />
            <span className="portal-tag">Vendor Portal</span>
          </div>
          <div className="portal-top-actions">
            <button
              className="btn"
              onClick={() => {
                signOutVendor()
                navigate('/login', { replace: true, state: { tab: 'vendor' } })
              }}
              aria-label="Sign out"
            >
              <LogOut size={15} /> <span className="hide-sm">Sign out</span>
            </button>
          </div>
        </div>
      </header>

      <PortalBand compact>
        <h1 className="band-title">{vendor.name}</h1>
        <p className="band-lead">
          {vendor.id} · {vendor.work} · {action ? `${action} order${action === 1 ? '' : 's'} waiting for you` : 'nothing waiting for you'}
        </p>
      </PortalBand>

      <main className="portal-main page-anim">
        <div className="portal-grid">
          <div className="portal-col">
            {orders.length === 0 ? (
              <section className="card portal-card">
                <p className="portal-empty">No work orders yet. Orders from Bansal Geo appear here as soon as they are issued.</p>
              </section>
            ) : (
              orders.map((w) => <OrderCard key={`${w.id}-${w.status}`} order={w} vendor={vendor} companyName={settings.companyName} />)
            )}
          </div>

          <aside className="portal-col">
            <section className="card portal-card">
              <h2 className="card-title-icon">
                <span className="title-icon">
                  <HardHat size={16} />
                </span>
                Your record
              </h2>
              <dl className="portal-facts">
                <div>
                  <dt>Orders</dt>
                  <dd>
                    {stats.orders.length} in all · {stats.open} open
                  </dd>
                </div>
                <div>
                  <dt>Delivered on time</dt>
                  <dd>{stats.onTimePct === null ? '—' : `${stats.onTimePct}%`}</dd>
                </div>
                <div>
                  <dt>Received</dt>
                  <dd>₹{received.toLocaleString('en-IN')}</dd>
                </div>
                <div>
                  <dt>TDS deducted</dt>
                  <dd>
                    ₹{tdsTotal.toLocaleString('en-IN')} {vendor.tds && `(${vendor.tds.section})`}
                  </dd>
                </div>
              </dl>
            </section>
            <section className="card portal-card">
              <h2 className="card-title-icon">
                <span className="title-icon">
                  <UserRound size={16} />
                </span>
                Your details with us
              </h2>
              <dl className="portal-facts">
                <div>
                  <dt>Contact</dt>
                  <dd>
                    {vendor.contact} · {vendor.phone}
                  </dd>
                </div>
                {vendor.gstin && (
                  <div>
                    <dt>GSTIN</dt>
                    <dd>{vendor.gstin}</dd>
                  </div>
                )}
                {vendor.bank && (
                  <div>
                    <dt>Payments to</dt>
                    <dd>
                      {vendor.bank.name} · {maskAccount(vendor.bank.accountNo, false)}
                    </dd>
                  </div>
                )}
              </dl>
              <p className="muted small">To change these, write to our Accounts team.</p>
            </section>
            <section className="card portal-card portal-contact">
              <h2>Bansal Geo Accounts</h2>
              <a href={`tel:${settings.phone.replace(/\s/g, '')}`}>
                <Phone size={14} /> {settings.phone}
              </a>
              <a href={`mailto:${settings.email}`}>
                <Mail size={14} /> {settings.email}
              </a>
              <span>
                <MapPin size={14} /> {settings.address}
              </span>
            </section>
          </aside>
        </div>
      </main>

      <footer className="portal-foot">
        © {new Date().getFullYear()} {settings.companyName}
      </footer>
    </div>
  )
}
