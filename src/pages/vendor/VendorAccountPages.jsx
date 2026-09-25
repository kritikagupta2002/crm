import { ArrowRight, Clock, Download, FileText, Gavel, HardHat, MapPin, Megaphone, Search, Wallet } from 'lucide-react'
import { Link, useOutletContext } from 'react-router-dom'
import { ContourLines } from '../../components/common/ContourLines'
import { KpiCard } from '../../components/common/KpiCard'
import { MountainRange } from '../../components/common/MountainRange'
import { maskAccount, useCrm } from '../../context/crm'
import { VENDOR_REGISTRATION_DOCS } from '../../data/vendors'
import { formatDate, formatNearDate } from '../../utils/date'
import { vendorCanSee } from '../../utils/documents'
import { downloadDocument, downloadLetter } from '../../utils/files'
import { nextWorkStep } from '../../utils/projects'
import { LIVE_BID, ORDER_STEPS, closingChip, closingOf, localDay, orderStep, tenderPhase, vendorNotices } from '../../utils/tenders'
import { vendorOrders } from '../../utils/workOrders'

const rupees = (n) => `₹${Math.round(n).toLocaleString('en-IN')}`

/* Home: who the firm is to us, what is open to bid on, where its bids stand, and how its work orders are going. */
export function VendorHomePage() {
  const { vendor } = useOutletContext()
  const { tenders, bids, clarifications, leads, projectEdits } = useCrm()
  const mine = bids.filter((b) => b.vendorId === vendor.id)
  const fresh = tenders.filter((t) => tenderPhase(t) === 'Open' && !mine.some((b) => b.tenderId === t.id)).sort((a, b) => closingOf(a).localeCompare(closingOf(b)))
  const orders = vendorOrders(vendor, leads, projectEdits)
  const running = orders.filter((w) => w.status !== 'Paid')
  const waiting = orders.filter((w) => ['start', 'deliver', 'bill'].includes(nextWorkStep(w)?.key))
  const received = orders.filter((w) => w.payment).reduce((s, w) => s + w.payment.gross - w.payment.tds.amount, 0)
  const news = vendorNotices(vendor.id, tenders, bids, clarifications).filter((n) => !n.id.startsWith('new-')).slice(0, 4)
  const categories = vendor.categories ?? vendor.work.split(', ')
  const nextStep = { start: 'Confirm start', deliver: 'Upload delivery', bill: 'Send bill' }

  return (
    <div className="module-page vendor-page">
      <section className="vendor-hero">
        <ContourLines className="band-contours" lines={16} />
        <MountainRange className="band-range" />
        <div className="vendor-hero-inner">
          <p className="vendor-hero-hello">Welcome back, {vendor.contact}</p>
          <h1>{vendor.name}</h1>
          <div className="vendor-hero-chips">
            <span className="hero-chip is-id">{vendor.id}</span>
            {categories.map((c) => (
              <span key={c} className="hero-chip">
                {c}
              </span>
            ))}
            <span className="hero-chip">
              <MapPin size={13} /> {vendor.place}
            </span>
            {vendor.since && <span className="hero-chip is-quiet">With us since {formatDate(vendor.since)}</span>}
          </div>
          <div className="vendor-hero-actions">
            <Link to="/vendor/tenders" className="btn btn-primary">
              <Search size={15} /> Search active tenders
            </Link>
            <Link to="/vendor/bids" className="btn">
              <Gavel size={15} /> My active bids
            </Link>
          </div>
        </div>
      </section>

      <section className="stat-grid">
        <KpiCard tone="tone-info" icon={Megaphone} label="Works to Bid On" value={fresh.length}>
          <span className="muted">Open, not yet bid by you</span>
        </KpiCard>
        <KpiCard tone="tone-attention" icon={Gavel} label="Active Bids" value={mine.filter((b) => LIVE_BID.includes(b.status)).length}>
          <span className="muted">Sealed or shortlisted</span>
        </KpiCard>
        <KpiCard tone={waiting.length ? 'tone-urgent' : 'tone-neutral'} icon={HardHat} label="Orders Waiting" value={waiting.length}>
          <span className="muted">To start, deliver or bill</span>
        </KpiCard>
        <KpiCard tone="tone-good" icon={Wallet} label="Received" value={rupees(received)}>
          <span className="muted">After TDS, all orders</span>
        </KpiCard>
      </section>

      <div className="vendor-home-grid">
        <section className="card">
          <div className="card-header">
            <Megaphone size={18} className="card-icon" />
            <h2>Open for bids</h2>
            <Link to="/vendor/tenders" className="card-actions link-button">
              All tenders →
            </Link>
          </div>
          {fresh.length === 0 ? (
            <p className="empty-state">No new works right now. You will hear of the next one by email and WhatsApp.</p>
          ) : (
            <div className="work-tiles">
              {fresh.slice(0, 3).map((t) => {
                const chip = closingChip(t)
                return (
                  <Link key={t.id} to={`/vendor/tenders/${t.id}`} className="work-tile">
                    <span className="work-tile-top">
                      <span className="cat-chip">{t.category}</span>
                      <span className={`pill status-pill ${chip.tone}`}>
                        <Clock size={12} /> {chip.label}
                      </span>
                    </span>
                    <strong>{t.title}</strong>
                    <span className="work-tile-meta">
                      <span>
                        <MapPin size={13} /> {t.location}
                      </span>
                      <span>{t.showEstimate ? rupees(t.estimate) : 'Value not disclosed'}</span>
                      <span>{t.periodDays} days</span>
                    </span>
                    <span className="work-tile-go">
                      View and bid <ArrowRight size={14} />
                    </span>
                  </Link>
                )
              })}
            </div>
          )}
        </section>

        <section className="card">
          <div className="card-header">
            <Gavel size={18} className="card-icon" />
            <h2>Latest on your bids</h2>
            <Link to="/vendor/status" className="card-actions link-button">
              Tender status →
            </Link>
          </div>
          {news.length === 0 ? (
            <p className="empty-state">No results yet. Decisions on your bids and answers to your questions show here.</p>
          ) : (
            <ol className="vendor-timeline">
              {news.map((n) => (
                <li key={n.id} className={n.tone}>
                  <Link to={n.to}>
                    <strong>{n.title}</strong>
                    <span className="muted small">{n.sub}</span>
                    <span className="muted small">{formatNearDate(localDay(n.at))}</span>
                  </Link>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>

      {running.length > 0 && (
        <section className="card">
          <div className="card-header">
            <HardHat size={18} className="card-icon" />
            <h2>Work in progress</h2>
            <Link to="/vendor/orders" className="card-actions link-button">
              Work orders →
            </Link>
          </div>
          <ul className="order-tracks">
            {running.map((w) => {
              const at = orderStep(w.status)
              const next = nextWorkStep(w)
              const yours = next && nextStep[next.key]
              return (
                <li key={w.id}>
                  <div className="order-track-head">
                    <span>
                      <strong>{w.work}</strong>
                      <span className="muted small">
                        {w.id} · {w.project.lead.company} · due {formatNearDate(w.dueOn)}
                      </span>
                    </span>
                    {yours ? (
                      <Link to="/vendor/orders" className="btn btn-small btn-primary">
                        {yours}
                      </Link>
                    ) : (
                      <span className="muted small">With our Accounts team</span>
                    )}
                  </div>
                  <ol className="order-steps" aria-label={`${w.id}: ${w.status}`}>
                    {ORDER_STEPS.map((step, i) => (
                      <li key={step} className={i < at ? 'is-done' : i === at ? 'is-now' : ''}>
                        <span className="order-step-dot" />
                        <span>{step}</span>
                      </li>
                    ))}
                  </ol>
                </li>
              )
            })}
          </ul>
        </section>
      )}
    </div>
  )
}

/* My Account: the firm as registered with us (eProc's "My Accounts"). Changes go through Accounts. */
export function VendorAccountPage() {
  const { vendor } = useOutletContext()
  const { vendorApplications, settings } = useCrm()
  const app = vendorApplications.find((a) => a.id === vendor.applicationId || a.vendorId === vendor.id)
  const sections = [
    [
      'Firm',
      [
        ['Name', vendor.name],
        ['Vendor ID', vendor.id],
        ['Registered with us since', vendor.since ? formatDate(vendor.since) : null],
        ['Company type', app?.firm.companyType],
        ['Legal status', app?.firm.legalStatus],
        ['Company category', app?.firm.category ?? (vendor.msme ? `${vendor.msme} Unit as per MSME` : null)],
        ['Registration no.', app?.firm.regNo],
        ['Nature of business', app?.firm.nature],
        ['Kinds of work', vendor.work],
      ],
    ],
    [
      'Contact',
      [
        ['Contact person', vendor.contact],
        ['Mobile (sign-in)', vendor.phone && `+91 ${vendor.phone}`],
        ['Email', vendor.email],
        ['Address', app ? [app.address.line, app.address.city, `${app.address.state} ${app.address.pincode}`].join(', ') : vendor.place],
      ],
    ],
    [
      'Tax',
      [
        ['PAN', vendor.pan],
        ['GSTIN', vendor.gstin || 'Not GST registered'],
        ['TDS on our payments', vendor.tds ? `Section ${vendor.tds.section} · ${vendor.tds.rate}%` : null],
      ],
    ],
    [
      'Bank account for payments',
      [
        ['Bank', vendor.bank?.name],
        ['Account no.', vendor.bank && maskAccount(vendor.bank.accountNo, false)],
        ['IFSC', vendor.bank?.ifsc],
      ],
    ],
  ]

  return (
    <div className="module-page vendor-page">
      <header className="page-header">
        <div className="page-title">
          <h1>My Account</h1>
          <p>{app ? `Registered through application ${app.id}` : 'Registered by our team'}</p>
        </div>
      </header>
      <div className="vendor-account-grid">
        {sections.map(([title, rows]) => (
          <section key={title} className="card app-section vendor-account-card">
            <h3>{title}</h3>
            <dl>
              {rows
                .filter(([, value]) => value)
                .map(([label, value]) => (
                  <div key={label}>
                    <dt>{label}</dt>
                    <dd>{value}</dd>
                  </div>
                ))}
            </dl>
          </section>
        ))}
      </div>
      <p className="muted small">
        To change any of these (a new bank account, a new mobile), write to our Accounts team at <a href={`mailto:${settings.email}`}>{settings.email}</a> with the proof; we update it after checking.
      </p>
    </div>
  )
}

/* My Documents: the papers the firm gave at registration and with each bid. */
export function VendorDocumentsPage() {
  const { vendor } = useOutletContext()
  const { vendorApplications, bids, tenders, settings, documents } = useCrm()
  const app = vendorApplications.find((a) => a.id === vendor.applicationId || a.vendorId === vendor.id)
  // Government letters on works the firm is on, which our team has checked and allowed it to see.
  const shared = documents.filter((d) => vendorCanSee(d, vendor.id))
  const rows = [
    ...(app ? app.documents.map((d) => ({ ...d, from: `Registration ${app.id}`, on: localDay(app.submittedAt) })) : (VENDOR_REGISTRATION_DOCS[vendor.id] ?? []).map((d) => ({ ...d, from: 'Registration' }))),
    ...bids
      .filter((b) => b.vendorId === vendor.id)
      .flatMap((b) => b.documents.map((d) => ({ ...d, from: `Bid ${b.id} · ${tenders.find((t) => t.id === b.tenderId)?.id ?? b.tenderId}`, on: localDay(b.submittedAt) }))),
  ].sort((a, b) => b.on.localeCompare(a.on))

  return (
    <div className="module-page vendor-page">
      <header className="page-header">
        <div className="page-title">
          <h1>My Documents</h1>
          <p>
            {rows.length} sent by you{shared.length ? ` · ${shared.length} shared by ${settings.companyName.split(' ').slice(0, 2).join(' ')}` : ''}
          </p>
        </div>
      </header>
      {shared.length > 0 && (
        <section className="card">
          <header className="card-header">
            <h2>Shared with you</h2>
          </header>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Document</th>
                  <th>Work</th>
                  <th>Dated</th>
                  <th aria-label="Download" />
                </tr>
              </thead>
              <tbody>
                {shared.map((d) => (
                  <tr key={d.id}>
                    <td>
                      <div className="cell-strong">{d.letter.title}</div>
                      <div className="cell-sub">
                        {d.kind} · {d.letter.ref} · {d.letter.authority}
                      </div>
                    </td>
                    <td>
                      <div className="cell-strong">{d.project.name}</div>
                      <div className="cell-sub">{d.project.site ?? d.lead.location}</div>
                    </td>
                    <td className="nowrap">{formatNearDate(d.letter.date)}</td>
                    <td>
                      <button className="icon-button small" onClick={() => downloadLetter(d.letter, { project: d.project, lead: d.lead, companyName: settings.companyName })} aria-label={`Download ${d.letter.title}`}>
                        <Download size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
      <section className="card">
        {shared.length > 0 && (
          <header className="card-header">
            <h2>Sent by you</h2>
          </header>
        )}
        {rows.length === 0 ? (
          <p className="empty-state">No documents yet. Papers you send with your registration and your bids show here.</p>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Document</th>
                  <th>File</th>
                  <th>Sent with</th>
                  <th>Date</th>
                  <th aria-label="Download" />
                </tr>
              </thead>
              <tbody>
                {rows.map((d) => (
                  <tr key={`${d.from}-${d.id}`}>
                    <td className="cell-strong">{d.kind}</td>
                    <td>
                      <span className="doc-name">
                        <FileText size={14} /> {d.name}
                      </span>
                    </td>
                    <td>{d.from}</td>
                    <td className="nowrap">{formatNearDate(d.on)}</td>
                    <td>
                      <button className="icon-button small" onClick={() => downloadDocument({ ...d, addedOn: d.on }, { company: vendor.name, companyName: settings.companyName })} aria-label={`Download ${d.name}`}>
                        <Download size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      <p className="muted small">Documents are kept as sent; to replace one, send the new copy with your next bid or write to our Accounts team.</p>
    </div>
  )
}
