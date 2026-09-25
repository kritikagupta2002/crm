import { ArrowRight, CheckCircle2, Download, FileScan, FileText, FolderLock, Inbox, PackageCheck, RotateCcw, Search, Share2, ShieldCheck, Truck } from 'lucide-react'
import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { usePaged } from '../../components/common/Pager'
import { useAccess, useCrm } from '../../context/crm'
import { DOC_KINDS } from '../../data/documents'
import { TODAY } from '../../data/mockData'
import { VENDORS, VENDOR_REGISTRATION_DOCS } from '../../data/vendors'
import { formatNearDate, toISODate } from '../../utils/date'
import { STAGE_TONE, accessLabel } from '../../utils/documents'
import { downloadDocument, downloadLetter } from '../../utils/files'
import { allProjects } from '../../utils/projects'
import { DocumentDrawer } from './DocumentDrawer'
import '../leads/leads.css'
import '../projects/erm.css'
import '../vendors/vendors.css'
import './documents.css'

/* The flowchart as a row of steps: the scan inbox first, then where the filed documents wait. */
const PIPELINE = [
  { key: 'To file', icon: Inbox, hint: 'Scans in the inbox' },
  { key: 'To verify', icon: ShieldCheck, hint: 'Second person checks' },
  { key: 'To authorize', icon: FolderLock, hint: 'Who can see it' },
  { key: 'To share', icon: Share2, hint: 'Tell the client' },
  { key: 'To dispatch', icon: Truck, hint: 'Paper original' },
  { key: 'Done', icon: CheckCircle2, hint: 'All steps done' },
]
const VIEWS = ['Government documents', 'Other documents']
const ACCESS_FILTERS = { 'Any access': () => true, 'Client can see': (d) => d.record.access?.client, 'Vendor can see': (d) => d.record.access?.vendor, 'Office only': (d) => d.record.access && !d.record.access.client && !d.record.access.vendor }

/* Every other file the system holds, read-only here, with where it lives: enquiries, projects, vendors, tenders. */
function otherDocuments({ leads, projects, vendorApplications, tenders, can }) {
  const rows = []
  if (can('/leads'))
    leads.forEach((lead) =>
      (lead.documents ?? []).forEach((d) => rows.push({ key: `l-${lead.id}-${d.id}`, doc: d, name: d.name, kind: d.byClient ? 'From the client' : 'Team file', source: 'Clients & enquiries', owner: lead.company, sub: lead.id, date: d.addedOn, to: `/leads/${lead.id}?tab=documents` })),
    )
  if (can('/projects'))
    projects.forEach((p) => {
      const files = [...p.documents.map((d) => ({ ...d, kind: d.category ?? 'Report' })), ...(p.submission?.files ?? []).map((f) => ({ ...f, addedOn: f.addedOn ?? p.submission.date, kind: 'Submission' })), ...p.fieldVisits.flatMap((v) => v.files.map((f) => ({ ...f, addedOn: f.addedOn ?? v.date, kind: 'Field data' })))]
      files.forEach((d) => rows.push({ key: `p-${p.id}-${d.id}`, doc: d, name: d.name, kind: d.kind, source: 'Project files', owner: p.lead.company, sub: `${p.id} · ${p.name}`, date: d.addedOn, to: `/projects/${p.id}?tab=documents` }))
    })
  if (can('/vendor-applications')) {
    VENDORS.forEach((v) => (VENDOR_REGISTRATION_DOCS[v.id] ?? []).forEach((d) => rows.push({ key: `v-${d.id}`, doc: d, name: d.name, kind: d.kind, source: 'Vendors', owner: v.name, sub: v.id, date: d.on, to: '/subcontracts' })))
    vendorApplications.forEach((a) => a.documents.forEach((d) => rows.push({ key: `a-${a.id}-${d.id}`, doc: d, name: d.name, kind: d.kind, source: 'Vendors', owner: a.firm.name, sub: `${a.id} · ${a.status}`, date: a.submittedAt.slice(0, 10), to: `/vendor-applications?open=${a.id}` })))
  }
  if (can('/tenders')) tenders.forEach((t) => (t.documents ?? []).forEach((d) => rows.push({ key: `t-${t.id}-${d.id}`, doc: d, name: d.name, kind: d.kind, source: 'Tenders', owner: t.title, sub: t.id, date: t.publishedAt.slice(0, 10), to: `/tenders?open=${t.id}` })))
  return rows.filter((r) => r.date && r.date <= toISODate(TODAY)).sort((a, b) => b.date.localeCompare(a.date))
}

function OtherDocuments() {
  const { leads, projectEdits, vendorApplications, tenders, settings } = useCrm()
  const { can } = useAccess()
  const [search, setSearch] = useState('')
  const [source, setSource] = useState('All')
  const rows = otherDocuments({ leads, projects: allProjects(leads, projectEdits), vendorApplications, tenders, can })
  const sources = ['All', ...new Set(rows.map((r) => r.source))]
  const q = search.trim().toLowerCase()
  const visible = rows.filter((r) => (source === 'All' || r.source === source) && (!q || [r.name, r.kind, r.owner, r.sub].some((v) => v?.toLowerCase().includes(q))))
  const { rows: pageRows, pager } = usePaged(visible, 12, `${source}-${q}`)

  return (
    <>
      <div className="leads-toolbar">
        <label className="toolbar-search">
          <Search size={16} className="muted" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search file, client, vendor or tender" aria-label="Search other documents" />
        </label>
        {can('/hr/employees') && (
          <Link to="/hr/documents" className="btn btn-small doc-hr-link">
            <FolderLock size={14} /> Employee documents (HRMS)
          </Link>
        )}
      </div>
      <nav className="stage-tabs" aria-label="Filter by where the file lives">
        {sources.map((s) => (
          <button key={s} className={`stage-tab ${source === s ? 'is-active' : ''}`} onClick={() => setSource(s)} aria-pressed={source === s}>
            {s}
            <span>{s === 'All' ? rows.length : rows.filter((r) => r.source === s).length}</span>
          </button>
        ))}
      </nav>
      {visible.length === 0 ? (
        <p className="empty-state">No files match.</p>
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>File</th>
                <th>Belongs to</th>
                <th>Added</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {pageRows.map((r) => (
                <tr key={r.key}>
                  <td>
                    <div className="cell-strong doc-name">
                      <FileText size={15} /> {r.name}
                    </div>
                    <div className="cell-sub">
                      {r.kind} · {r.source}
                    </div>
                  </td>
                  <td>
                    <Link to={r.to} className="cell-strong cell-link">
                      {r.owner}
                    </Link>
                    <div className="cell-sub">{r.sub}</div>
                  </td>
                  <td className="nowrap">{formatNearDate(r.date)}</td>
                  <td className="num">
                    <button className="icon-button small" onClick={() => downloadDocument({ ...r.doc, addedOn: r.date }, { company: r.owner, companyName: settings.companyName })} aria-label={`Download ${r.name}`}>
                      <Download size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {pager}
    </>
  )
}

/*
 * Document Management (the flowchart): government documents from the scanner to the client, each step done by
 * someone and kept on its audit trail. The pipeline filters the list; a row opens the document. The other files the
 * system holds (enquiries, projects, vendors, tenders) are listed under Other documents, read-only.
 */
export function DocumentsPage() {
  const { documents, scanInbox, settings, vendors } = useCrm()
  const [params, setParams] = useSearchParams()
  const [search, setSearch] = useState('')
  const [kind, setKind] = useState('All kinds')
  const [client, setClient] = useState('All clients')
  const [access, setAccess] = useState('Any access')
  const view = VIEWS.includes(params.get('view')) ? params.get('view') : VIEWS[0]
  const stage = PIPELINE.some((p) => p.key === params.get('step')) ? params.get('step') : null
  const open = documents.find((d) => d.id === params.get('open'))

  const setParam = (key, value) => {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value)
    else next.delete(key)
    setParams(next, { replace: true })
  }
  const count = (key) => (key === 'To file' ? scanInbox.length : documents.filter((d) => d.stage === key).length)
  const rescans = documents.filter((d) => d.rescan).length
  const clients = [...new Set(documents.map((d) => d.lead.company))].sort()
  const q = search.trim().toLowerCase()
  const visible = documents.filter(
    (d) =>
      (!stage || d.stage === stage) &&
      (kind === 'All kinds' || d.kind === kind) &&
      (client === 'All clients' || d.lead.company === client) &&
      ACCESS_FILTERS[access](d) &&
      (!q || [d.letter.title, d.letter.ref, d.lead.company, d.project.id, d.project.name, d.record.links.leaseNo, d.vendor?.name].some((v) => v?.toLowerCase().includes(q))),
  )
  const { rows: pageRows, pager } = usePaged(visible, 10, `${stage}-${kind}-${client}-${access}-${q}`)
  const waiting = documents.filter((d) => d.stage !== 'Done').length

  return (
    <div className="module-page">
      <header className="page-header">
        <div className="page-title">
          <h1>Documents</h1>
          <p>
            {documents.length} government documents · {waiting} on their way{rescans ? ` · ${rescans} to rescan` : ''}
          </p>
        </div>
        <div className="page-actions">
          <Link to="/documents/dispatch" className="btn">
            <Truck size={16} /> Dispatch register
          </Link>
          <Link to="/documents/scan-inbox" className="btn btn-primary">
            <FileScan size={16} /> Scan inbox{scanInbox.length ? ` (${scanInbox.length})` : ''}
          </Link>
        </div>
      </header>

      <nav className="doc-pipeline" aria-label="Document steps">
        {PIPELINE.map((p, i) => {
          const Icon = p.icon
          const n = count(p.key)
          const body = (
            <>
              <span className="doc-pipe-icon">
                <Icon size={18} />
              </span>
              <span className="doc-pipe-text">
                <strong>{n}</strong>
                <span>{p.key}</span>
                <small>{p.key === 'To verify' && rescans ? `${rescans} rescan${rescans === 1 ? '' : 's'} asked` : p.hint}</small>
              </span>
              {i < PIPELINE.length - 1 && <ArrowRight size={15} className="doc-pipe-arrow" aria-hidden="true" />}
            </>
          )
          const cls = `doc-pipe ${stage === p.key ? 'is-active' : ''} ${n && p.key !== 'Done' ? 'has-items' : ''}`
          return p.key === 'To file' ? (
            <Link key={p.key} to="/documents/scan-inbox" className={cls}>
              {body}
            </Link>
          ) : (
            <button
              key={p.key}
              className={cls}
              aria-pressed={stage === p.key}
              onClick={() => {
                const next = new URLSearchParams(params)
                if (stage === p.key) next.delete('step')
                else next.set('step', p.key)
                next.delete('view')
                setParams(next, { replace: true })
              }}
            >
              {body}
            </button>
          )
        })}
      </nav>

      <section className="card">
        <nav className="stage-tabs doc-views" aria-label="Which documents">
          {VIEWS.map((v) => (
            <button key={v} className={`stage-tab ${view === v ? 'is-active' : ''}`} onClick={() => setParam('view', v === VIEWS[0] ? null : v)} aria-pressed={view === v}>
              {v}
              {v === VIEWS[0] && <span>{documents.length}</span>}
            </button>
          ))}
        </nav>

        {view === 'Other documents' ? (
          <OtherDocuments />
        ) : (
          <>
            <div className="leads-toolbar">
              <label className="toolbar-search">
                <Search size={16} className="muted" />
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search letter, reference, client, lease or vendor" aria-label="Search documents" />
              </label>
              <select value={kind} onChange={(e) => setKind(e.target.value)} aria-label="Kind of document">
                <option>All kinds</option>
                {DOC_KINDS.map((k) => (
                  <option key={k}>{k}</option>
                ))}
              </select>
              <select value={client} onChange={(e) => setClient(e.target.value)} aria-label="Client">
                <option>All clients</option>
                {clients.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
              <select value={access} onChange={(e) => setAccess(e.target.value)} aria-label="Who can see it">
                {Object.keys(ACCESS_FILTERS).map((a) => (
                  <option key={a}>{a}</option>
                ))}
              </select>
            </div>
            {stage && (
              <p className="doc-filter-note">
                Showing <b>{stage.toLowerCase()}</b>
                <button className="link-button" onClick={() => setParam('step', null)}>
                  Show all
                </button>
              </p>
            )}
            {visible.length === 0 ? (
              <p className="empty-state">{stage && stage !== 'Done' ? `Nothing ${stage.toLowerCase()}.` : 'No documents match.'}</p>
            ) : (
              <div className="table-wrap">
                <table className="data-table doc-table">
                  <thead>
                    <tr>
                      <th>Document</th>
                      <th>Client &amp; project</th>
                      <th>Dated</th>
                      <th>Who can see it</th>
                      <th>Step</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {pageRows.map((d) => (
                      <tr key={d.id} className="clickable-row" onClick={() => setParam('open', d.id)}>
                        <td>
                          <div className="cell-strong">{d.letter.title}</div>
                          <div className="cell-sub">
                            {d.kind} · {d.letter.ref}
                            {d.record.links.leaseNo && ` · lease ${d.record.links.leaseNo}`}
                          </div>
                        </td>
                        <td>
                          <div className="cell-strong">{d.lead.company}</div>
                          <div className="cell-sub">
                            {d.project.id} · {d.project.name}
                          </div>
                        </td>
                        <td className="nowrap">{formatNearDate(d.letter.date)}</td>
                        <td>
                          <span className="cell-sub doc-access-cell">{d.record.access ? accessLabel(d.record.access, d.record.links, vendors) : 'Not set yet'}</span>
                        </td>
                        <td>
                          {d.rescan ? (
                            <span className="pill status-pill tone-urgent">
                              <RotateCcw size={12} /> Rescan
                            </span>
                          ) : (
                            <span className={`pill status-pill ${STAGE_TONE[d.stage]}`}>
                              {d.stage === 'Done' && d.record.dispatch?.status === 'Dispatched' ? (
                                <>
                                  <PackageCheck size={12} /> Original sent
                                </>
                              ) : (
                                d.stage
                              )}
                            </span>
                          )}
                        </td>
                        <td className="num">
                          <button
                            className="icon-button small"
                            onClick={(e) => {
                              e.stopPropagation()
                              downloadLetter(d.letter, { project: d.project, lead: d.lead, companyName: settings.companyName })
                            }}
                            aria-label={`Download ${d.letter.title}`}
                          >
                            <Download size={15} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {pager}
          </>
        )}
      </section>

      {open && <DocumentDrawer key={open.id} doc={open} onClose={() => setParam('open', null)} />}
    </div>
  )
}
