import { ArrowLeft, PackageCheck, Search, Truck } from 'lucide-react'
import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { KpiCard } from '../../components/common/KpiCard'
import { usePaged } from '../../components/common/Pager'
import { useCrm } from '../../context/crm'
import { TODAY } from '../../data/mockData'
import { formatNearDate, toISODate } from '../../utils/date'
import { DISPATCH_TONE } from '../../utils/documents'
import { DocumentDrawer } from './DocumentDrawer'
import '../leads/leads.css'
import '../projects/erm.css'
import '../vendors/vendors.css'
import './documents.css'

const TABS = { 'To dispatch': (d) => d.record.dispatch.status === 'To dispatch', 'On the way': (d) => d.record.dispatch.status === 'Dispatched', Received: (d) => d.record.dispatch.status === 'Received', All: () => true }

/*
 * Flowchart step "Government document dispatch": the paper originals that go to clients — which are still to send,
 * which are on their way (with the docket to track them) and which have arrived. A row opens the document.
 */
export function DispatchRegisterPage() {
  const { documents } = useCrm()
  const [params, setParams] = useSearchParams()
  const [search, setSearch] = useState('')
  const tab = TABS[params.get('tab')] ? params.get('tab') : 'To dispatch'
  const originals = documents.filter((d) => d.record.access && ['To dispatch', 'Dispatched', 'Received'].includes(d.record.dispatch?.status))
  const q = search.trim().toLowerCase()
  const visible = originals.filter(TABS[tab]).filter((d) => !q || [d.letter.title, d.letter.ref, d.lead.company, d.record.dispatch.docket, d.project.id].some((v) => v?.toLowerCase().includes(q)))
  const { rows, pager } = usePaged(visible, 10, `${tab}-${q}`)
  const open = documents.find((d) => d.id === params.get('open'))
  const set = (key, value) => {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value)
    else next.delete(key)
    setParams(next, { replace: true })
  }
  const monthKey = toISODate(TODAY).slice(0, 7)
  const receivedThisMonth = originals.filter((d) => d.record.dispatch.receivedOn?.slice(0, 7) === monthKey).length

  return (
    <div className="module-page">
      <header className="page-header">
        <div className="page-title">
          <Link to="/documents" className="back-link">
            <ArrowLeft size={15} /> Documents
          </Link>
          <h1>Dispatch Register</h1>
          <p>Paper originals of government documents sent to clients</p>
        </div>
      </header>

      <section className="stat-grid doc-stats">
        <KpiCard tone="tone-attention" icon={Truck} label="To Dispatch" value={originals.filter(TABS['To dispatch']).length}>
          <span className="muted">Verified, original still in the office</span>
        </KpiCard>
        <KpiCard tone="tone-info" icon={Truck} label="On the Way" value={originals.filter(TABS['On the way']).length}>
          <span className="muted">Sent, not yet confirmed</span>
        </KpiCard>
        <KpiCard tone="tone-good" icon={PackageCheck} label="Received" value={originals.filter(TABS.Received).length}>
          <span className="muted">{receivedThisMonth ? `${receivedThisMonth} this month` : 'Confirmed by the client'}</span>
        </KpiCard>
      </section>

      <section className="card">
        <div className="leads-toolbar">
          <label className="toolbar-search">
            <Search size={16} className="muted" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search letter, client or docket no." aria-label="Search the dispatch register" />
          </label>
        </div>
        <nav className="stage-tabs" aria-label="Filter originals">
          {Object.keys(TABS).map((t) => (
            <button key={t} className={`stage-tab ${tab === t ? 'is-active' : ''}`} onClick={() => set('tab', t === 'To dispatch' ? null : t)} aria-pressed={tab === t}>
              {t}
              <span>{originals.filter(TABS[t]).length}</span>
            </button>
          ))}
        </nav>
        {visible.length === 0 ? (
          <p className="empty-state">{tab === 'To dispatch' ? 'Every original has gone out.' : 'Nothing here.'}</p>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Document</th>
                  <th>To</th>
                  <th>Sent</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((d) => {
                  const x = d.record.dispatch
                  return (
                    <tr key={d.id} className="clickable-row" onClick={() => set('open', d.id)}>
                      <td>
                        <div className="cell-strong">{d.letter.title}</div>
                        <div className="cell-sub">
                          {d.letter.ref} · {d.project.id}
                        </div>
                      </td>
                      <td>
                        <div className="cell-strong">{d.lead.company}</div>
                        <div className="cell-sub">
                          {d.lead.contactPerson} · {d.lead.location}
                        </div>
                      </td>
                      <td>
                        {x.on ? (
                          <>
                            <div className="cell-strong">
                              {x.mode} · {formatNearDate(x.on)}
                            </div>
                            <div className="cell-sub mono-sub">{x.docket || `by ${x.by}`}</div>
                          </>
                        ) : (
                          <span className="muted">Waiting since {formatNearDate(d.record.access.at.slice(0, 10))}</span>
                        )}
                      </td>
                      <td>
                        <span className={`pill status-pill ${DISPATCH_TONE[x.status]}`}>{x.status === 'Dispatched' ? 'On the way' : x.status}</span>
                        {x.receivedOn && <div className="cell-sub">{formatNearDate(x.receivedOn)}</div>}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
        {pager}
      </section>

      {open && <DocumentDrawer key={open.id} doc={open} onClose={() => set('open', null)} />}
    </div>
  )
}
