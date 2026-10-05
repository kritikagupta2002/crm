import { ArrowLeft, CheckCircle2, PackageCheck, Plus, Search, Truck } from 'lucide-react'
import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { KpiCard } from '../../../shared/components/KpiCard'
import { usePaged } from '../../../shared/components/Pager'
import { useAccess, useCrm } from '../../../core/permissions/crm'
import { allProjects } from '../../erm/utils/projects'
import { TODAY } from '../../crm/data/mockData'
import { formatNearDate, toISODate } from '../../../shared/utils/date'
import { DISPATCH_TONE } from '../utils/documents'
import { DocumentDrawer } from '../components/DocumentDrawer'
import { DispatchFormDrawer } from '../components/DispatchFormDrawer'
import { DispatchDetailDrawer } from '../components/DispatchDetailDrawer'
import '../../crm/components/leads/leads.css'
import '../../erm/pages/erm.css'
import '../../vendors/pages/vendors.css'
import './documents.css'

/*
 * Document-backed dispatch records — the paper originals that went through the government-document
 * workflow and have a dispatch status set by DocumentDrawer.
 */
function useDocumentDispatches(documents) {
  return documents.filter(
    (d) => d.record.access && ['To dispatch', 'Dispatched', 'Received'].includes(d.record.dispatch?.status),
  )
}

/*
 * Merge document-backed dispatches and standalone dispatch records into one unified list,
 * sorted by dispatch date descending. Adds a `_type` field so the table knows which kind it is.
 */
function useMergedDispatches(docOriginals, standaloneDispatches) {
  const fromDocs = docOriginals.map((d) => ({
    _type: 'document',
    _id: `doc-${d.id}`,
    dispatchDate: d.record.dispatch?.on || '',
    dispatchNumber: d.record.dispatch?.dispatchNumber || '',
    recipient: d.lead.company,
    recipientPerson: d.lead.contactPerson,
    location: d.lead.location,
    courier: d.record.dispatch?.mode || '',
    docketNumber: d.record.dispatch?.docket || '',
    status: d.record.dispatch?.status,
    receivedOn: d.record.dispatch?.receivedOn || '',
    documentTitle: d.letter.title,
    documentRef: d.letter.ref,
    projectId: d.project.id,
    projectName: d.project.name,
    _doc: d,
  }))

  const fromStandalone = standaloneDispatches.map((r) => ({
    _type: 'standalone',
    _id: r.id,
    dispatchDate: r.dispatchDate || '',
    dispatchNumber: r.dispatchNumber || '',
    recipient: r.recipient || '',
    recipientPerson: '',
    location: '',
    organization: r.organization || '',
    address: r.address || '',
    courier: r.courier || '',
    docketNumber: r.docketNumber || '',
    status: r.status || 'Dispatched',
    receivedOn: r.receivedOn || '',
    documentTitle: r.documentTitle || '',
    documentRef: r.documentRef || '',
    projectId: r.projectId || '',
    projectName: r.projectName || '',
    remarks: r.remarks || '',
    createdBy: r.createdBy || '',
    createdAt: r.createdAt || '',
    _raw: r,
  }))

  // Sort newest dispatch date first; null dates go at the bottom
  return [...fromDocs, ...fromStandalone].sort((a, b) => {
    if (!a.dispatchDate && !b.dispatchDate) return 0
    if (!a.dispatchDate) return 1
    if (!b.dispatchDate) return -1
    return b.dispatchDate.localeCompare(a.dispatchDate)
  })
}

// Tab filter function
const TAB_FILTERS = {
  'To dispatch': (r) => r.status === 'To dispatch',
  'On the way': (r) => r.status === 'Dispatched' || r.status === 'Pending',
  Received: (r) => r.status === 'Received' || r.status === 'Delivered',
  Cancelled: (r) => r.status === 'Cancelled',
  All: () => true,
}

/*
 * Flowchart step "Government document dispatch": the paper originals that go to clients — which are still to send,
 * which are on their way (with the docket to track them) and which have arrived.
 * Phase 4: also allows creating standalone dispatch records.
 */
export function DispatchRegisterPage() {
  const { documents, dispatches, createDispatch, updateDispatch, leads, projectEdits } = useCrm()
  const { may } = useAccess()
  const canAct = may('documents')

  const [params, setParams] = useSearchParams()
  const [search, setSearch] = useState('')

  // Drawer state
  const [showForm, setShowForm] = useState(false)
  const [editingDispatch, setEditingDispatch] = useState(null) // standalone record being edited
  const [viewingDocId, setViewingDocId] = useState(null) // document drawer
  const [viewingStandalone, setViewingStandalone] = useState(null) // standalone detail drawer

  // Toast notification
  const [toast, setToast] = useState(null)
  const showToast = (title, detail, isError = false) => {
    setToast({ title, detail, isError })
    setTimeout(() => setToast(null), 4500)
  }

  const tab = TAB_FILTERS[params.get('tab')] ? params.get('tab') : 'To dispatch'

  const docOriginals = useDocumentDispatches(documents)
  const merged = useMergedDispatches(docOriginals, dispatches)

  const q = search.trim().toLowerCase()
  const visible = merged
    .filter(TAB_FILTERS[tab])
    .filter(
      (r) =>
        !q ||
        [
          r.dispatchNumber,
          r.recipient,
          r.organization,
          r.courier,
          r.docketNumber,
          r.documentRef,
          r.documentTitle,
          r.projectId,
        ].some((v) => v?.toLowerCase().includes(q)),
    )

  const { rows, pager } = usePaged(visible, 10, `${tab}-${q}`)

  // For document drawer
  const openDoc = viewingDocId ? documents.find((d) => d.id === viewingDocId) : null

  const set = (key, value) => {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value)
    else next.delete(key)
    setParams(next, { replace: true })
  }

  const monthKey = toISODate(TODAY).slice(0, 7)
  const receivedThisMonth = merged.filter(
    (r) => (r.status === 'Received' || r.status === 'Delivered') && r.receivedOn?.slice(0, 7) === monthKey,
  ).length

  const projects = allProjects(leads, projectEdits)

  // --- Handlers ---
  const handleOpenNewForm = () => {
    setEditingDispatch(null)
    setShowForm(true)
  }

  const handleEditStandalone = (record) => {
    setEditingDispatch(record._raw)
    setShowForm(true)
  }

  const handleSaveForm = (formData) => {
    try {
      if (editingDispatch) {
        updateDispatch(editingDispatch.id, formData)
        showToast('Dispatch updated.', `${formData.dispatchNumber} saved successfully.`)
      } else {
        createDispatch(formData)
        showToast('Dispatch created successfully.', `${formData.dispatchNumber} added to the register.`)
      }
      setShowForm(false)
      setEditingDispatch(null)
    } catch (err) {
      showToast(
        editingDispatch ? 'Unable to update dispatch.' : 'Unable to create dispatch.',
        err.message || 'An error occurred.',
        true,
      )
      // Re-throw so the form can show the error too
      throw err
    }
  }

  const handleRowClick = (row) => {
    if (row._type === 'document') {
      set('open', row._doc.id)
    } else {
      setViewingStandalone(row)
    }
  }

  const countByTab = (tabKey) => merged.filter(TAB_FILTERS[tabKey]).length

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
        {canAct && (
          <div className="page-actions">
            <button
              id="btn-new-dispatch"
              className="btn btn-primary"
              onClick={handleOpenNewForm}
              aria-label="Create a new dispatch entry"
            >
              <Plus size={16} /> New Dispatch
            </button>
          </div>
        )}
      </header>

      <section className="stat-grid doc-stats">
        <KpiCard tone="tone-attention" icon={Truck} label="To Dispatch" value={countByTab('To dispatch')}>
          <span className="muted">Verified, original still in the office</span>
        </KpiCard>
        <KpiCard tone="tone-info" icon={Truck} label="On the Way" value={countByTab('On the way')}>
          <span className="muted">Sent, not yet confirmed</span>
        </KpiCard>
        <KpiCard tone="tone-good" icon={PackageCheck} label="Received" value={countByTab('Received')}>
          <span className="muted">{receivedThisMonth ? `${receivedThisMonth} this month` : 'Confirmed by the client'}</span>
        </KpiCard>
      </section>

      <section className="card">
        <div className="leads-toolbar">
          <label className="toolbar-search">
            <Search size={16} className="muted" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search dispatch no., recipient, docket, document or project…"
              aria-label="Search the dispatch register"
            />
          </label>
          {canAct && (
            <button className="btn" onClick={handleOpenNewForm}>
              <Plus size={15} /> New Dispatch
            </button>
          )}
        </div>

        <nav className="stage-tabs" aria-label="Filter dispatches">
          {Object.keys(TAB_FILTERS).map((t) => (
            <button
              key={t}
              className={`stage-tab ${tab === t ? 'is-active' : ''}`}
              onClick={() => set('tab', t === 'To dispatch' ? null : t)}
              aria-pressed={tab === t}
            >
              {t}
              <span>{countByTab(t)}</span>
            </button>
          ))}
        </nav>

        {visible.length === 0 ? (
          <div className="dispatch-empty-state">
            <Truck size={40} className="muted" />
            <p className="empty-state">
              {tab === 'To dispatch'
                ? 'Every original has been dispatched.'
                : tab === 'On the way'
                  ? 'No dispatches currently in transit.'
                  : tab === 'Received'
                    ? 'No received dispatches yet.'
                    : tab === 'Cancelled'
                      ? 'No cancelled dispatches.'
                      : 'No dispatch records found.'}
            </p>
            {canAct && (
              <button className="btn btn-primary" onClick={handleOpenNewForm}>
                <Plus size={15} /> New Dispatch
              </button>
            )}
          </div>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Dispatch No.</th>
                  <th>Document / Description</th>
                  <th>To</th>
                  <th>Sent</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row._id} className="clickable-row" onClick={() => handleRowClick(row)}>
                    <td>
                      <div className="cell-strong mono-sub">
                        {row.dispatchNumber || <span className="muted">No ref.</span>}
                      </div>
                      {row.projectId && (
                        <div className="cell-sub">{row.projectId}</div>
                      )}
                    </td>
                    <td>
                      {row.documentTitle ? (
                        <>
                          <div className="cell-strong">{row.documentTitle}</div>
                          {row.documentRef && (
                            <div className="cell-sub mono-sub">{row.documentRef}</div>
                          )}
                        </>
                      ) : row.remarks ? (
                        <>
                          <div className="cell-strong dispatch-standalone-label">Standalone</div>
                          <div className="cell-sub">{row.remarks}</div>
                        </>
                      ) : (
                        <span className="muted">Standalone dispatch</span>
                      )}
                    </td>
                    <td>
                      <div className="cell-strong">
                        {row.recipient}
                        {row.organization && row.organization !== row.recipient && (
                          <> · {row.organization}</>
                        )}
                      </div>
                      {(row.recipientPerson || row.location) && (
                        <div className="cell-sub">
                          {[row.recipientPerson, row.location].filter(Boolean).join(' · ')}
                        </div>
                      )}
                      {!row.recipientPerson && row.address && (
                        <div className="cell-sub">{row.address}</div>
                      )}
                    </td>
                    <td>
                      {row.dispatchDate ? (
                        <>
                          <div className="cell-strong">
                            {row.courier} · {formatNearDate(row.dispatchDate)}
                          </div>
                          {row.docketNumber && (
                            <div className="cell-sub mono-sub">{row.docketNumber}</div>
                          )}
                        </>
                      ) : (
                        <span className="muted">Not sent yet</span>
                      )}
                    </td>
                    <td>
                      <span
                        className={`pill status-pill ${DISPATCH_TONE[row.status] || 'tone-info'}`}
                      >
                        {row.status === 'Dispatched' ? 'On the way' : row.status}
                      </span>
                      {row.receivedOn && (
                        <div className="cell-sub">{formatNearDate(row.receivedOn)}</div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {pager}
      </section>

      {/* Document drawer for document-backed dispatches */}
      {openDoc && (
        <DocumentDrawer
          key={openDoc.id}
          doc={openDoc}
          onClose={() => set('open', null)}
        />
      )}

      {/* New / Edit dispatch form drawer */}
      {showForm && (
        <DispatchFormDrawer
          isOpen={showForm}
          onClose={() => {
            setShowForm(false)
            setEditingDispatch(null)
          }}
          onSave={handleSaveForm}
          initialData={editingDispatch}
          isEdit={Boolean(editingDispatch)}
          allDispatches={dispatches}
          documents={documents}
          projects={projects}
        />
      )}

      {/* Standalone dispatch detail drawer */}
      {viewingStandalone && (
        <DispatchDetailDrawer
          dispatch={{
            ...viewingStandalone._raw,
            documentTitle: documents.find((d) => d.id === viewingStandalone._raw?.documentId)?.letter?.title || '',
            documentRef: documents.find((d) => d.id === viewingStandalone._raw?.documentId)?.letter?.ref || '',
            projectName: projects.find((p) => p.id === viewingStandalone._raw?.projectId)?.name || '',
          }}
          onClose={() => setViewingStandalone(null)}
          onEdit={canAct ? handleEditStandalone : undefined}
          canEdit={canAct}
          onOpenDocument={
            viewingStandalone._raw?.documentId
              ? (docId) => {
                  setViewingStandalone(null)
                  set('open', docId)
                }
              : undefined
          }
        />
      )}

      {/* Toast notification */}
      {toast && (
        <div className={`toast dispatch-toast ${toast.isError ? 'toast-error' : ''}`} role="status">
          {toast.isError ? (
            <span className="toast-icon" style={{ color: 'var(--red, #e53e3e)' }}>✕</span>
          ) : (
            <CheckCircle2 size={22} className="toast-icon" />
          )}
          <div>
            <strong>{toast.title}</strong>
            {toast.detail && <span>{toast.detail}</span>}
          </div>
          <button
            className="icon-button small"
            onClick={() => setToast(null)}
            aria-label="Dismiss notification"
            style={{ marginLeft: 'auto' }}
          >
            ✕
          </button>
        </div>
      )}
    </div>
  )
}
