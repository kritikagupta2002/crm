import { X, Edit3 } from 'lucide-react'


export function FieldRecordDetailModal({ isOpen, onClose, record, section, onEdit, canEdit = true }) {
  if (!isOpen || !record || !section) return null

  const isSubmitted = record.status === 'Submitted'

  return (
    <div className="fd-modal-backdrop" onClick={onClose}>
      <div className="fd-modal" onClick={(e) => e.stopPropagation()}>
        <div className="fd-modal-header">
          <div className="fd-header-titles">
            <div className="fd-header-top">
              <h2 className="fd-modal-title">
                <span className="fd-mono">{record.id}</span>
              </h2>
              <span className={`fd-status-pill ${isSubmitted ? 'fd-status-submitted' : 'fd-status-draft'}`}>
                {record.status || 'Submitted'}
              </span>
              <span className="fd-badge fd-badge-category">{section.category}</span>
            </div>
            <span className="fd-header-subtitle">{section.title}</span>
          </div>
          <button type="button" className="fd-modal-close" onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        <div className="fd-modal-body">
          {/* Metadata Grid */}
          <div className="fd-detail-grid">
            <div className="fd-detail-item">
              <span className="fd-detail-label">Project</span>
              <span className="fd-detail-value">
                <strong>{record.projectId}</strong> · {record.projectName || record.projectId}
              </span>
            </div>

            <div className="fd-detail-item">
              <span className="fd-detail-label">Observation Date</span>
              <span className="fd-detail-value">{record.date || '—'}</span>
            </div>

            <div className="fd-detail-item">
              <span className="fd-detail-label">Geologist / Recorded By</span>
              <span className="fd-detail-value">{record.employeeName || record.createdBy || '—'}</span>
            </div>

            <div className="fd-detail-item">
              <span className="fd-detail-label">Sample / Borehole ID</span>
              <span className="fd-detail-value">
                {record.metadata?.sampleOrBoreholeId ? (
                  <span className="fd-mono" style={{ color: '#0f172a', background: '#f1f5f9', padding: '2px 6px', borderRadius: 4 }}>
                    {record.metadata.sampleOrBoreholeId}
                  </span>
                ) : (
                  '—'
                )}
              </span>
            </div>

            <div className="fd-detail-item" style={{ gridColumn: '1 / -1' }}>
              <span className="fd-detail-label">Field Station / Location</span>
              <span className="fd-detail-value">{record.metadata?.location || '—'}</span>
            </div>

            <div className="fd-detail-item" style={{ gridColumn: '1 / -1' }}>
              <span className="fd-detail-label">Coordinates & Elevation</span>
              <span className="fd-detail-value">
                {record.metadata?.coordinates?.latitude || record.metadata?.coordinates?.longitude || record.metadata?.coordinates?.elevation ? (
                  <span>
                    <strong>Lat:</strong> {record.metadata.coordinates.latitude || '—'} &nbsp;|&nbsp;{' '}
                    <strong>Long:</strong> {record.metadata.coordinates.longitude || '—'} &nbsp;|&nbsp;{' '}
                    <strong>Elev:</strong> {record.metadata.coordinates.elevation || '—'}
                  </span>
                ) : (
                  'Not specified'
                )}
              </span>
            </div>

            <div className="fd-detail-item" style={{ gridColumn: '1 / -1' }}>
              <span className="fd-detail-label">Field Remarks & Notes</span>
              <span className="fd-detail-value" style={{ whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
                {record.metadata?.remarks || 'No remarks recorded.'}
              </span>
            </div>
          </div>

          {/* Extensible Future Fields Notice */}
          <div className="fd-extensible-shell">
            <div className="fd-shell-header">
              <span className="fd-shell-title">Domain-Specific Measurements</span>
              <span className="fd-badge fd-badge-pending">Final format awaited</span>
            </div>
            <p className="fd-shell-desc">
              Custom geology fields and laboratory parameters for <strong>{section.title}</strong> will populate here dynamically once finalized client formats are integrated.
            </p>
          </div>

          {/* Audit trail */}
          <div style={{ fontSize: '11.5px', color: '#64748b', borderTop: '1px solid #f1f5f9', paddingTop: '12px', display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
            <span>Created: {record.createdAt ? new Date(record.createdAt).toLocaleString('en-IN') : '—'} by {record.createdBy || 'Staff'}</span>
            {record.updatedAt && record.updatedAt !== record.createdAt && (
              <span>Last updated: {new Date(record.updatedAt).toLocaleString('en-IN')} by {record.updatedBy || record.createdBy}</span>
            )}
          </div>
        </div>

        <div className="fd-modal-footer">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Close
          </button>
          {canEdit && (
            <button
              type="button"
              className="btn-primary"
              onClick={() => {
                onClose()
                onEdit(record)
              }}
            >
              <Edit3 size={15} /> Edit Record
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
