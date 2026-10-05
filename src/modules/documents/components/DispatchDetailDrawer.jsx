import { Building2, Calendar, FileText, FolderKanban, MapPin, Package, Pencil, Truck, User } from 'lucide-react'
import { Link } from 'react-router-dom'
import { SideDrawer } from '../../../shared/components/SideDrawer'
import { formatDate, formatNearDate } from '../../../shared/utils/date'
import { DISPATCH_TONE } from '../utils/documents'

export function DispatchDetailDrawer({
  dispatch,
  onClose,
  onEdit,
  canEdit = false,
  onOpenDocument,
}) {
  if (!dispatch) return null

  const isDelivered = dispatch.status === 'Received' || dispatch.status === 'Delivered'
  const isTransit = dispatch.status === 'Dispatched'

  return (
    <SideDrawer
      title={dispatch.dispatchNumber}
      sub={`${dispatch.courier || 'Dispatch'} · ${dispatch.recipient}`}
      onClose={onClose}
      className="doc-drawer dispatch-detail-drawer"
    >
      <div className="wo-head">
        <span className={`pill status-pill ${DISPATCH_TONE[dispatch.status] || 'tone-info'}`}>
          {dispatch.status === 'Dispatched' ? 'On the way' : dispatch.status}
        </span>
        <span className="muted small">
          Dispatched {dispatch.dispatchDate ? formatDate(dispatch.dispatchDate) : '—'}
        </span>
      </div>

      <section className="app-section">
        <h3>Dispatch Details</h3>
        <dl>
          <div>
            <dt>Dispatch Number</dt>
            <dd className="cell-strong">{dispatch.dispatchNumber}</dd>
          </div>
          <div>
            <dt>Dispatch Date</dt>
            <dd>{dispatch.dispatchDate ? `${formatDate(dispatch.dispatchDate)} (${formatNearDate(dispatch.dispatchDate)})` : '—'}</dd>
          </div>
          <div>
            <dt>Courier / Mode</dt>
            <dd>
              <div className="inline-icon-text">
                <Truck size={14} className="muted" />
                <span>{dispatch.courier || '—'}</span>
              </div>
            </dd>
          </div>
          <div>
            <dt>Docket / Tracking</dt>
            <dd className="mono-sub">{dispatch.docketNumber || 'None / By hand'}</dd>
          </div>
          <div>
            <dt>Status</dt>
            <dd>
              <span className={`pill status-pill ${DISPATCH_TONE[dispatch.status] || 'tone-info'}`}>
                {dispatch.status === 'Dispatched' ? 'On the way' : dispatch.status}
              </span>
              {dispatch.receivedOn && (
                <span className="muted small" style={{ marginLeft: '8px' }}>
                  Received on {formatNearDate(dispatch.receivedOn)}
                </span>
              )}
            </dd>
          </div>
        </dl>
      </section>

      <section className="app-section">
        <h3>Recipient Information</h3>
        <dl>
          <div>
            <dt>Recipient Name</dt>
            <dd>
              <div className="inline-icon-text">
                <User size={14} className="muted" />
                <span>{dispatch.recipient || '—'}</span>
              </div>
            </dd>
          </div>
          <div>
            <dt>Organization</dt>
            <dd>
              <div className="inline-icon-text">
                <Building2 size={14} className="muted" />
                <span>{dispatch.organization || '—'}</span>
              </div>
            </dd>
          </div>
          <div>
            <dt>Delivery Address</dt>
            <dd>
              <div className="inline-icon-text">
                <MapPin size={14} className="muted" />
                <span>{dispatch.address || '—'}</span>
              </div>
            </dd>
          </div>
        </dl>
      </section>

      {(dispatch.projectId || dispatch.documentId || dispatch.documentTitle) && (
        <section className="app-section">
          <h3>Related Records</h3>
          <dl>
            {dispatch.projectId && (
              <div>
                <dt>Related Project</dt>
                <dd>
                  <Link to={`/projects/${dispatch.projectId}?tab=documents`} className="cell-link">
                    <FolderKanban size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                    {dispatch.projectId} {dispatch.projectName ? `· ${dispatch.projectName}` : ''}
                  </Link>
                </dd>
              </div>
            )}
            {(dispatch.documentId || dispatch.documentTitle) && (
              <div>
                <dt>Related Document</dt>
                <dd>
                  {onOpenDocument && dispatch.documentId ? (
                    <button
                      type="button"
                      className="link-button"
                      onClick={() => onOpenDocument(dispatch.documentId)}
                    >
                      <FileText size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                      {dispatch.documentTitle || dispatch.documentId} {dispatch.documentRef ? `(${dispatch.documentRef})` : ''}
                    </button>
                  ) : (
                    <span>
                      <FileText size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                      {dispatch.documentTitle || dispatch.documentId} {dispatch.documentRef ? `(${dispatch.documentRef})` : ''}
                    </span>
                  )}
                </dd>
              </div>
            )}
          </dl>
        </section>
      )}

      {dispatch.remarks && (
        <section className="app-section">
          <h3>Remarks / Notes</h3>
          <p className="doc-step-lead" style={{ margin: 0 }}>
            {dispatch.remarks}
          </p>
        </section>
      )}

      <section className="app-section">
        <h3>Audit Metadata</h3>
        <dl>
          <div>
            <dt>Created By</dt>
            <dd>{dispatch.createdBy || 'System'}</dd>
          </div>
          {dispatch.createdAt && (
            <div>
              <dt>Created On</dt>
              <dd>{formatDate(dispatch.createdAt.slice(0, 10))}</dd>
            </div>
          )}
          {dispatch.updatedBy && (
            <div>
              <dt>Last Updated By</dt>
              <dd>{dispatch.updatedBy}</dd>
            </div>
          )}
        </dl>
      </section>

      <div className="dispatch-detail-footer">
        {canEdit && (
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              onClose()
              onEdit(dispatch)
            }}
          >
            <Pencil size={15} /> Edit Dispatch
          </button>
        )}
        <button type="button" className="btn" onClick={onClose}>
          Close
        </button>
      </div>
    </SideDrawer>
  )
}
