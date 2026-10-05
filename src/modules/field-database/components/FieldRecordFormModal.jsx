import { useState, useEffect, useMemo } from 'react'
import { X, AlertCircle, Save, CheckCircle2, MapPin, Compass, FileText, User, Calendar, FolderKanban } from 'lucide-react'
import { useCrm } from '../../../core/permissions/crm'
import { toISODate } from '../../../shared/utils/date'
import { allProjects } from '../../erm/utils/projects'
import { validateFieldRecord } from '../data/fieldDatabase'

export function FieldRecordFormModal({ isOpen, onClose, section, record = null, onSaved }) {
  const { leads, projectEdits, user, createFieldRecord, updateFieldRecord } = useCrm()
  const isEdit = Boolean(record)

  // Sourcing projects from existing CRM entity architecture
  const projects = useMemo(() => allProjects(leads, projectEdits) || [], [leads, projectEdits])

  const [formData, setFormData] = useState({
    projectId: '',
    projectName: '',
    date: toISODate(new Date()),
    employeeName: user?.name || '',
    employeeId: user?.employeeId || '',
    location: '',
    sampleOrBoreholeId: '',
    latitude: '',
    longitude: '',
    elevation: '',
    remarks: '',
    status: 'Submitted',
  })

  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  useEffect(() => {
    if (isOpen) {
      if (record) {
        setFormData({
          projectId: record.projectId || '',
          projectName: record.projectName || '',
          date: record.date || toISODate(new Date()),
          employeeName: record.employeeName || user?.name || '',
          employeeId: record.employeeId || user?.employeeId || '',
          location: record.metadata?.location || '',
          sampleOrBoreholeId: record.metadata?.sampleOrBoreholeId || '',
          latitude: record.metadata?.coordinates?.latitude || '',
          longitude: record.metadata?.coordinates?.longitude || '',
          elevation: record.metadata?.coordinates?.elevation || '',
          remarks: record.metadata?.remarks || '',
          status: record.status || 'Submitted',
        })
      } else {
        setFormData({
          projectId: projects[0]?.id || '',
          projectName: projects[0]?.name || '',
          date: toISODate(new Date()),
          employeeName: user?.name || '',
          employeeId: user?.employeeId || '',
          location: '',
          sampleOrBoreholeId: '',
          latitude: '',
          longitude: '',
          elevation: '',
          remarks: '',
          status: 'Submitted',
        })
      }
      setErrors({})
      setSubmitError('')
    }
  }, [isOpen, record, user, projects])

  if (!isOpen || !section) return null

  const handleProjectChange = (e) => {
    const pId = e.target.value
    const found = projects.find((p) => p.id === pId)
    setFormData((prev) => ({
      ...prev,
      projectId: pId,
      projectName: found?.name || pId,
    }))
    if (errors.projectId) setErrors((prev) => ({ ...prev, projectId: '' }))
  }

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setSubmitError('')

    const validationPayload = {
      projectId: formData.projectId,
      date: formData.date,
      employeeName: formData.employeeName,
      location: formData.location,
      status: formData.status,
    }

    const val = validateFieldRecord(validationPayload)
    if (!val.isValid) {
      setErrors(val.errors)
      return
    }

    setIsSubmitting(true)
    try {
      if (isEdit) {
        const patch = {
          projectId: formData.projectId,
          projectName: formData.projectName,
          date: formData.date,
          employeeName: formData.employeeName,
          status: formData.status,
          metadata: {
            location: formData.location,
            sampleOrBoreholeId: formData.sampleOrBoreholeId,
            coordinates: {
              latitude: formData.latitude,
              longitude: formData.longitude,
              elevation: formData.elevation,
            },
            remarks: formData.remarks,
          },
        }
        const updated = updateFieldRecord(record.id, patch)
        onSaved?.(updated, 'Record saved successfully.')
      } else {
        const newRecordPayload = {
          section: section.key,
          projectId: formData.projectId,
          projectName: formData.projectName,
          date: formData.date,
          employeeId: formData.employeeId,
          employeeName: formData.employeeName,
          metadata: {
            location: formData.location,
            sampleOrBoreholeId: formData.sampleOrBoreholeId,
            coordinates: {
              latitude: formData.latitude,
              longitude: formData.longitude,
              elevation: formData.elevation,
            },
            remarks: formData.remarks,
          },
          data: {},
          status: formData.status,
        }
        const created = createFieldRecord(newRecordPayload)
        onSaved?.(created, 'Record saved successfully.')
      }
      onClose()
    } catch (err) {
      console.error('Error saving field record:', err)
      setSubmitError(err.message || 'Unable to save record.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fd-modal-backdrop" onClick={onClose}>
      <div className="fd-modal" onClick={(e) => e.stopPropagation()}>
        <div className="fd-modal-header">
          <h2 className="fd-modal-title">
            {isEdit ? `Edit Record: ${record.id}` : `+ Add ${section.title} Record`}
          </h2>
          <button type="button" className="fd-modal-close" onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="fd-modal-body">
            {/* Extensible Shell Banner */}
            <div className="fd-notice-banner">
              <AlertCircle size={18} />
              <div>
                <strong>Final format awaited.</strong> Technical metadata and geospatial coordinates are captured below. Official domain-specific field schemas for {section.title} will be inserted into this record shell upon client format delivery.
              </div>
            </div>

            {submitError && (
              <div className="fd-notice-banner" style={{ background: '#fef2f2', borderColor: '#fecaca', color: '#991b1b' }}>
                <AlertCircle size={18} style={{ color: '#dc2626' }} />
                <div>
                  <strong>Error:</strong> {submitError}
                </div>
              </div>
            )}

            <div className="fd-form-grid">
              {/* Project Selection */}
              <div className="fd-field">
                <label className="fd-label" htmlFor="fd-project">
                  <FolderKanban size={14} /> Project <span className="fd-required">*</span>
                </label>
                <select
                  id="fd-project"
                  className={`fd-select ${errors.projectId ? 'has-error' : ''}`}
                  value={formData.projectId}
                  onChange={handleProjectChange}
                >
                  <option value="">Select Project</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.id} · {p.name}
                    </option>
                  ))}
                </select>
                {errors.projectId && <span className="fd-error-msg">{errors.projectId}</span>}
              </div>

              {/* Record Date */}
              <div className="fd-field">
                <label className="fd-label" htmlFor="fd-date">
                  <Calendar size={14} /> Observation Date <span className="fd-required">*</span>
                </label>
                <input
                  id="fd-date"
                  type="date"
                  className={`fd-input ${errors.date ? 'has-error' : ''}`}
                  value={formData.date}
                  onChange={(e) => handleChange('date', e.target.value)}
                />
                {errors.date && <span className="fd-error-msg">{errors.date}</span>}
              </div>

              {/* Recorded By / Geologist */}
              <div className="fd-field">
                <label className="fd-label" htmlFor="fd-employee">
                  <User size={14} /> Geologist / Recorded By <span className="fd-required">*</span>
                </label>
                <input
                  id="fd-employee"
                  type="text"
                  className={`fd-input ${errors.employeeName ? 'has-error' : ''}`}
                  value={formData.employeeName}
                  onChange={(e) => handleChange('employeeName', e.target.value)}
                  placeholder="e.g. Ajay Kumar"
                />
                {errors.employeeName && <span className="fd-error-msg">{errors.employeeName}</span>}
              </div>

              {/* Status */}
              <div className="fd-field">
                <label className="fd-label" htmlFor="fd-status">
                  <CheckCircle2 size={14} /> Record Status
                </label>
                <select
                  id="fd-status"
                  className="fd-select"
                  value={formData.status}
                  onChange={(e) => handleChange('status', e.target.value)}
                >
                  <option value="Submitted">Submitted</option>
                  <option value="Draft">Draft</option>
                </select>
              </div>

              {/* Location / Station */}
              <div className="fd-field full-width">
                <label className="fd-label" htmlFor="fd-location">
                  <MapPin size={14} /> Field Station / Location <span className="fd-required">*</span>
                </label>
                <input
                  id="fd-location"
                  type="text"
                  className={`fd-input ${errors.location ? 'has-error' : ''}`}
                  value={formData.location}
                  onChange={(e) => handleChange('location', e.target.value)}
                  placeholder="e.g. South Ridge Sector B Outcrop 4 or Borehole Site SK-01"
                />
                {errors.location && <span className="fd-error-msg">{errors.location}</span>}
              </div>

              {/* Sample / Borehole ID */}
              <div className="fd-field full-width">
                <label className="fd-label" htmlFor="fd-sample">
                  <FileText size={14} /> Sample / Borehole Identifier
                </label>
                <input
                  id="fd-sample"
                  type="text"
                  className="fd-input"
                  value={formData.sampleOrBoreholeId}
                  onChange={(e) => handleChange('sampleOrBoreholeId', e.target.value)}
                  placeholder={section.samplePlaceholder || 'e.g. WP-104 / BH-01'}
                />
              </div>

              {/* Coordinates Grid */}
              <div className="fd-field full-width">
                <label className="fd-label">
                  <Compass size={14} /> Coordinates & Elevation
                </label>
                <div className="fd-coords-grid">
                  <div>
                    <input
                      type="text"
                      className="fd-input"
                      value={formData.latitude}
                      onChange={(e) => handleChange('latitude', e.target.value)}
                      placeholder="Latitude (e.g. 25.3478° N)"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      className="fd-input"
                      value={formData.longitude}
                      onChange={(e) => handleChange('longitude', e.target.value)}
                      placeholder="Longitude (e.g. 74.6392° E)"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      className="fd-input"
                      value={formData.elevation}
                      onChange={(e) => handleChange('elevation', e.target.value)}
                      placeholder="Elevation (e.g. 420 m)"
                    />
                  </div>
                </div>
              </div>

              {/* Remarks */}
              <div className="fd-field full-width">
                <label className="fd-label" htmlFor="fd-remarks">
                  <FileText size={14} /> Field Remarks & Observations
                </label>
                <textarea
                  id="fd-remarks"
                  rows={3}
                  className="fd-textarea"
                  value={formData.remarks}
                  onChange={(e) => handleChange('remarks', e.target.value)}
                  placeholder="Record lithology notes, mineral occurrences, dip/strike, recovery percentage, or sample conditions..."
                />
              </div>

              {/* Extensible Future Fields Placeholder */}
              <div className="fd-field full-width">
                <div className="fd-extensible-shell">
                  <div className="fd-shell-header">
                    <span className="fd-shell-title">Domain Specific Fields</span>
                    <span className="fd-badge fd-badge-pending">Final format awaited</span>
                  </div>
                  <p className="fd-shell-desc">
                    Custom geology attributes for <strong>{section.title}</strong> (e.g. rock type codes, structural measurements, assay parameters, core run depths, drilling recovery metrics) will be rendered in this extensible block upon client format receipt.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="fd-modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={isSubmitting}>
              <Save size={15} /> {isSubmitting ? 'Saving...' : isEdit ? 'Update Record' : 'Save Record'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
