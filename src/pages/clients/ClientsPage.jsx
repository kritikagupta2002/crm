import { Building2, CheckCircle2, Download, ExternalLink, IndianRupee, Mail, MapPin, Phone, Search, UserPlus, X } from 'lucide-react'
import { useCallback, useEffect, useId, useState } from 'react'
import { Link } from 'react-router-dom'
import { ProgressBar } from '../../components/common/Checklist'
import { KpiCard } from '../../components/common/KpiCard'
import { useCrm, useMoney } from '../../context/crm'
import { formatDate } from '../../utils/date'
import { downloadCsv } from '../../utils/exportCsv'
import { stateOf } from '../../utils/leads'
import { ONBOARDING_STEPS, progressOf } from '../../utils/workflow'
import { Portal } from '../../components/common/Portal'
import { SharePortalButton } from '../../components/lead/SharePortalButton'
import { ClientDocuments } from './ClientDocuments'
import { ProjectPanel } from './ProjectPanel'
import { RoleLink } from '../../components/common/RoleLink'

const statusOf = (lead) => (progressOf(ONBOARDING_STEPS, lead.onboarding) === ONBOARDING_STEPS.length ? 'Active' : 'Onboarding')
const sinceOf = (lead) => lead.wonOn ?? lead.createdOn

/* Business value is left blank in the export when amounts are hidden for the current role. */
const clientColumns = (hideMoney) => [
  { label: 'Client', value: (c) => c.company },
  { label: 'Contact person', value: (c) => c.contactPerson },
  { label: 'Phone', value: (c) => c.phone },
  { label: 'Email', value: (c) => c.email },
  { label: 'Location', value: (c) => c.location },
  { label: 'Service', value: (c) => c.serviceDetail },
  { label: 'Business (INR)', value: (c) => (hideMoney ? '' : c.quoteValue) },
  { label: 'Owner', value: (c) => c.assignedTo },
  { label: 'Client since', value: (c) => sinceOf(c) },
  { label: 'Status', value: (c) => statusOf(c) },
]

function ClientDrawer({ client, onClose }) {
  const money = useMoney()
  const titleId = useId()
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [onClose])

  const done = progressOf(ONBOARDING_STEPS, client.onboarding)
  return (
    <Portal>
      <div className="drawer-root">
        <div className="drawer-backdrop" onClick={onClose} />
        <aside className="enquiry-drawer lead-drawer" role="dialog" aria-modal="true" aria-labelledby={titleId}>
          <header className="drawer-header">
            <div className="lead-drawer-title">
              <h2 id={titleId}>{client.company}</h2>
              <span className="muted">
                Client since {formatDate(sinceOf(client))} · <span className={`pill ${statusOf(client) === 'Active' ? 'tone-good' : 'tone-attention'} status-pill`}>{statusOf(client)}</span>
              </span>
            </div>
            <button className="icon-button" onClick={onClose} aria-label="Close">
              <X size={20} />
            </button>
          </header>
          <div className="drawer-body lead-drawer-body">
            <section className="contact-card">
              <strong>{client.contactPerson}</strong>
              <div className="contact-lines">
                {client.phone && (
                  <a href={`tel:+91${client.phone}`}>
                    <Phone size={14} /> +91 {client.phone.slice(0, 5)} {client.phone.slice(5)}
                  </a>
                )}
                {client.email && (
                  <a href={`mailto:${client.email}`}>
                    <Mail size={14} /> {client.email}
                  </a>
                )}
                {client.location && (
                  <span>
                    <MapPin size={14} /> {client.location}
                  </span>
                )}
              </div>
              <div className="portal-links">
                <Link to={`/portal?lead=${client.id}`} className="link-button">
                  <ExternalLink size={14} /> Preview client portal
                </Link>
                <SharePortalButton lead={client} className="link-button" label="Send portal login" />
              </div>
            </section>
            <dl className="fact-grid">
              <div>
                <dt>Business</dt>
                <dd>{client.quoteValue ? money.short(client.quoteValue) : '—'}</dd>
              </div>
              <div>
                <dt>Account owner</dt>
                <dd>{client.assignedTo}</dd>
              </div>
              <div>
                <dt>Client type</dt>
                <dd>{client.clientType ?? 'Company'}</dd>
              </div>
              <div>
                <dt>Documents</dt>
                <dd>{client.documents?.length ?? 0} files</dd>
              </div>
            </dl>
            <ClientDocuments client={client} />
            <section className="lead-section">
              <h3>Onboarding</h3>
              <div className="workflow-progress">
                <ProgressBar done={done} total={ONBOARDING_STEPS.length} tone={done === ONBOARDING_STEPS.length ? 'tone-good' : 'tone-attention'} />
                <span>
                  {done}/{ONBOARDING_STEPS.length}
                </span>
              </div>
              {done < ONBOARDING_STEPS.length && (
                <RoleLink to="/client-onboarding" className="link-button" hideIfLocked>
                  Continue onboarding
                </RoleLink>
              )}
            </section>
            <section className="lead-section">
              <h3>Enquiry &amp; quotation</h3>
              <ul className="mini-list">
                <li className="tone-good">
                  <i />
                  <span>
                    <RoleLink to={`/leads/${client.id}`}>
                      <strong>{client.serviceDetail}</strong>
                    </RoleLink>{' '}
                    · {client.id}
                  </span>
                  <RoleLink to={`/quotations?open=${client.id}`} className="mini-when" hideIfLocked>
                    Quotation
                  </RoleLink>
                </li>
              </ul>
            </section>
            <ProjectPanel lead={client} />
          </div>
        </aside>
      </div>
    </Portal>
  )
}

/* Every won enquiry becomes a client; the list shows who they are, what they bought and whether onboarding is done. */
export function ClientsPage() {
  const money = useMoney()
  const { leads } = useCrm()
  const [filters, setFilters] = useState({ search: '', state: '', status: '' })
  const [openId, setOpenId] = useState(null)
  const close = useCallback(() => setOpenId(null), [])

  const clients = leads.filter((l) => l.stage === 'Won').sort((a, b) => sinceOf(b).localeCompare(sinceOf(a)))
  const states = [...new Set(clients.map(stateOf).filter(Boolean))].sort()
  const q = filters.search.trim().toLowerCase()
  const visible = clients.filter(
    (c) =>
      (!filters.state || stateOf(c) === filters.state) &&
      (!filters.status || statusOf(c) === filters.status) &&
      (!q || `${c.company} ${c.contactPerson} ${c.location} ${c.id}`.toLowerCase().includes(q)),
  )
  const business = clients.reduce((s, c) => s + (c.quoteValue ?? 0), 0)
  const active = clients.filter((c) => statusOf(c) === 'Active').length
  const set = (key) => (e) => setFilters({ ...filters, [key]: e.target.value })
  const openClient = clients.find((c) => c.id === openId)

  return (
    <div className="module-page">
      <header className="page-header">
        <div className="page-title">
          <h1>Client Master</h1>
          <p>Everyone Bansal Geo is working with</p>
        </div>
        <div className="page-actions">
          <button className="btn" onClick={() => downloadCsv('clients.csv', clientColumns(money.hidden), visible)}>
            <Download size={16} /> Export
          </button>
        </div>
      </header>

      <section className="stat-grid">
        <KpiCard tone="tone-info" icon={Building2} label="Total Clients" value={clients.length}>
          <span className="muted">Won enquiries</span>
        </KpiCard>
        <KpiCard tone="tone-good" icon={CheckCircle2} label="Active" value={active}>
          <span className="muted">Onboarding complete</span>
        </KpiCard>
        <KpiCard tone="tone-attention" icon={UserPlus} label="Onboarding" value={clients.length - active}>
          <span className="muted">Still being set up</span>
        </KpiCard>
        <KpiCard tone="tone-good" icon={IndianRupee} label="Total Business" value={business} format={money.short}>
          <span className="muted">Before GST</span>
        </KpiCard>
      </section>

      <section className="card">
        <div className="leads-toolbar">
          <label className="toolbar-search">
            <Search size={16} className="muted" />
            <input value={filters.search} onChange={set('search')} placeholder="Search client, contact or location" aria-label="Search clients" />
          </label>
          <select value={filters.state} onChange={set('state')} aria-label="Location">
            <option value="">All locations</option>
            {states.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
          <select value={filters.status} onChange={set('status')} aria-label="Status">
            <option value="">All statuses</option>
            <option>Active</option>
            <option>Onboarding</option>
          </select>
        </div>
        {visible.length === 0 ? (
          <p className="empty-state">No clients match.</p>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Client</th>
                  <th>Location</th>
                  <th>Service</th>
                  <th className="num">Business</th>
                  <th>Owner</th>
                  <th>Client since</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((c) => (
                  <tr key={c.id} className="clickable-row" onClick={() => setOpenId(c.id)}>
                    <td>
                      <button className="row-link">{c.company}</button>
                      <div className="cell-sub">{c.contactPerson}</div>
                    </td>
                    <td className="nowrap">{c.location}</td>
                    <td>
                      <div className="cell-clip">{c.serviceDetail}</div>
                    </td>
                    <td className="num nowrap">
                      <b className="text-ink">{c.quoteValue ? money.short(c.quoteValue) : '—'}</b>
                    </td>
                    <td className="nowrap">{c.assignedTo}</td>
                    <td className="nowrap">{formatDate(sinceOf(c))}</td>
                    <td>
                      <span className={`pill status-pill ${statusOf(c) === 'Active' ? 'tone-good' : 'tone-attention'}`}>{statusOf(c)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {openClient && <ClientDrawer client={openClient} onClose={close} />}
    </div>
  )
}
