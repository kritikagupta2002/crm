import { useState, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  ArrowLeft,
  Plus,
  Search,
  Eye,
  Edit3,
  AlertCircle,
  FileSpreadsheet,
  CheckCircle2,
  Clock,
  RotateCcw,
  Building,
} from 'lucide-react'
import { useAccess, useCrm } from '../../../core/permissions/crm'
import { getFieldSectionByKey, filterFieldRecordsByRole } from '../data/fieldDatabase'
import { allProjects } from '../../erm/utils/projects'
import { FieldRecordFormModal } from '../components/FieldRecordFormModal'
import { FieldRecordDetailModal } from '../components/FieldRecordDetailModal'
import './fieldDatabase.css'

export function FieldDatabaseSectionPage({ sectionKey: propSectionKey }) {
  const params = useParams()
  const activeSlug = propSectionKey || params.sectionSlug
  const section = getFieldSectionByKey(activeSlug)

  const { fieldRecords = [], leads = [], projectEdits = {}, role, user } = useCrm()
  const { may } = useAccess()
  const canManageFieldData = may('fieldDatabase')

  // Toast feedback state
  const [toast, setToast] = useState(null)
  const showToast = (message, isError = false) => {
    setToast({ message, isError })
    setTimeout(() => setToast(null), 4000)
  }

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingRecord, setEditingRecord] = useState(null)
  const [viewingRecord, setViewingRecord] = useState(null)

  // Filters state
  const [searchQuery, setSearchQuery] = useState('')
  const [projectFilter, setProjectFilter] = useState('ALL')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [geologistFilter, setGeologistFilter] = useState('ALL')

  // Projects list
  const projects = useMemo(() => allProjects(leads, projectEdits) || [], [leads, projectEdits])

  // 1. Filter all records belonging to this specific section
  const sectionRecords = useMemo(() => {
    if (!section) return []
    return fieldRecords.filter((r) => r.section === section.key)
  }, [fieldRecords, section])

  // 2. Filter strictly by role isolation (Super Admin sees all, Manager sees team, Employee sees own)
  const roleFilteredRecords = useMemo(() => {
    return filterFieldRecordsByRole(sectionRecords, role, user)
  }, [sectionRecords, role, user])

  // 3. Extract distinct geologists for filter dropdown
  const distinctGeologists = useMemo(() => {
    const names = new Set()
    roleFilteredRecords.forEach((r) => {
      if (r.employeeName) names.add(r.employeeName)
      else if (r.createdBy) names.add(r.createdBy)
    })
    return Array.from(names).sort()
  }, [roleFilteredRecords])

  // 4. Apply UI search and toolbar filters
  const displayedRecords = useMemo(() => {
    return roleFilteredRecords.filter((rec) => {
      // Project filter
      if (projectFilter !== 'ALL' && rec.projectId !== projectFilter) {
        return false
      }

      // Status filter
      if (statusFilter !== 'ALL' && rec.status !== statusFilter) {
        return false
      }

      // Geologist filter
      if (geologistFilter !== 'ALL') {
        const name = rec.employeeName || rec.createdBy || ''
        if (name.toLowerCase() !== geologistFilter.toLowerCase()) {
          return false
        }
      }

      // Keyword search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim()
        const idMatch = rec.id?.toLowerCase().includes(q)
        const projMatch = rec.projectName?.toLowerCase().includes(q) || rec.projectId?.toLowerCase().includes(q)
        const sampleMatch = rec.metadata?.sampleOrBoreholeId?.toLowerCase().includes(q)
        const locMatch = rec.metadata?.location?.toLowerCase().includes(q)
        const remarksMatch = rec.metadata?.remarks?.toLowerCase().includes(q)
        const geoMatch = rec.employeeName?.toLowerCase().includes(q) || rec.createdBy?.toLowerCase().includes(q)
        if (!idMatch && !projMatch && !sampleMatch && !locMatch && !remarksMatch && !geoMatch) {
          return false
        }
      }

      return true
    })
  }, [roleFilteredRecords, projectFilter, statusFilter, geologistFilter, searchQuery])

  // KPI Calculations
  const stats = useMemo(() => {
    const total = roleFilteredRecords.length
    const submitted = roleFilteredRecords.filter((r) => r.status === 'Submitted').length
    const drafts = roleFilteredRecords.filter((r) => r.status === 'Draft').length
    const projectSet = new Set(roleFilteredRecords.map((r) => r.projectId).filter(Boolean))
    return {
      total,
      submitted,
      drafts,
      projectsCount: projectSet.size,
    }
  }, [roleFilteredRecords])

  const handleResetFilters = () => {
    setSearchQuery('')
    setProjectFilter('ALL')
    setStatusFilter('ALL')
    setGeologistFilter('ALL')
  }

  const hasActiveFilters = searchQuery !== '' || projectFilter !== 'ALL' || statusFilter !== 'ALL' || geologistFilter !== 'ALL'

  // Permission check for editing a specific record
  const checkCanEdit = (rec) => {
    if (!canManageFieldData) return false
    if (role === 'Super Admin' || role === 'Manager') return true
    if (role === 'Employee') {
      const currentName = (user?.name || '').trim().toLowerCase()
      const currentEmpId = (user?.employeeId || '').trim().toLowerCase()
      const createdBy = (rec.createdBy || '').trim().toLowerCase()
      const empName = (rec.employeeName || '').trim().toLowerCase()
      const empId = (rec.employeeId || '').trim().toLowerCase()
      return (
        (currentName && (createdBy === currentName || empName === currentName)) ||
        (currentEmpId && empId === currentEmpId)
      )
    }
    return false
  }

  if (!section) {
    return (
      <div className="fd-page">
        <div className="fd-notice-banner" style={{ background: '#fef2f2', borderColor: '#fecaca', color: '#991b1b' }}>
          <AlertCircle size={20} style={{ color: '#dc2626' }} />
          <div>
            <strong>Section Not Found:</strong> The requested Field Database section "{activeSlug}" does not exist.
            <div style={{ marginTop: 8 }}>
              <Link to="/field-database" className="fd-btn-action">
                ← Return to Field Database Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const SectionIcon = section.icon || FileSpreadsheet

  return (
    <div className="fd-page">
      {/* Toast Notification */}
      {toast && (
        <div className={`fd-toast ${toast.isError ? 'error' : 'success'}`}>
          {toast.isError ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="fd-header">
        <div className="fd-header-titles">
          <div style={{ marginBottom: 4 }}>
            <Link to="/field-database" className="fd-section-cta" style={{ fontSize: 13, gap: 6 }}>
              <ArrowLeft size={14} /> Back to Field Database Overview
            </Link>
          </div>
          <div className="fd-header-top">
            <h1 className="fd-header-title">{section.title}</h1>
            <span className="fd-badge fd-badge-prefix">{section.prefix}</span>
            <span className="fd-badge fd-badge-category">{section.category}</span>
            <span className="fd-badge fd-badge-pending">Final format awaited</span>
          </div>
          <p className="fd-header-subtitle">{section.description}</p>
        </div>

        <div className="fd-header-actions">
          {canManageFieldData && (
            <button
              type="button"
              className="btn-primary"
              onClick={() => {
                setEditingRecord(null)
                setIsFormOpen(true)
              }}
            >
              <Plus size={16} /> Add Record
            </button>
          )}
        </div>
      </div>

      {/* Section Notice Banner */}
      <div className="fd-notice-banner">
        <AlertCircle size={18} />
        <div>
          <strong>Final format awaited:</strong> Official client-provided field formats for {section.title} will be inserted into this modular form shell without restructuring routing, storage, or permissions. Common project metadata and location logging are fully operational.
        </div>
      </div>

      {/* KPI Stats */}
      <div className="fd-stats">
        <div className="fd-stat-card">
          <div className="fd-stat-icon">
            <SectionIcon size={22} />
          </div>
          <div className="fd-stat-info">
            <span className="fd-stat-value">{stats.total}</span>
            <span className="fd-stat-label">Total Records</span>
          </div>
        </div>

        <div className="fd-stat-card">
          <div className="fd-stat-icon" style={{ background: '#dcfce7', color: '#15803d' }}>
            <CheckCircle2 size={22} />
          </div>
          <div className="fd-stat-info">
            <span className="fd-stat-value">{stats.submitted}</span>
            <span className="fd-stat-label">Submitted</span>
          </div>
        </div>

        <div className="fd-stat-card">
          <div className="fd-stat-icon" style={{ background: '#f1f5f9', color: '#475569' }}>
            <Clock size={22} />
          </div>
          <div className="fd-stat-info">
            <span className="fd-stat-value">{stats.drafts}</span>
            <span className="fd-stat-label">Drafts</span>
          </div>
        </div>

        <div className="fd-stat-card">
          <div className="fd-stat-icon" style={{ background: '#fef3c7', color: '#b45309' }}>
            <Building size={22} />
          </div>
          <div className="fd-stat-info">
            <span className="fd-stat-value">{stats.projectsCount}</span>
            <span className="fd-stat-label">Projects Represented</span>
          </div>
        </div>
      </div>

      {/* Toolbar & Filters */}
      <div className="fd-toolbar">
        <div className="fd-search-box">
          <Search size={16} style={{ color: '#64748b' }} />
          <input
            type="text"
            placeholder={`Search ${section.shortTitle} records (ID, sample, location, project)...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="fd-filter-group">
          {/* Project filter */}
          <select
            className="fd-filter-select"
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
          >
            <option value="ALL">All Projects</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.id} · {p.name}
              </option>
            ))}
          </select>

          {/* Status filter */}
          <select
            className="fd-filter-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ALL">All Statuses</option>
            <option value="Submitted">Submitted</option>
            <option value="Draft">Draft</option>
          </select>

          {/* Geologist filter (Manager & Super Admin) */}
          {role !== 'Employee' && distinctGeologists.length > 0 && (
            <select
              className="fd-filter-select"
              value={geologistFilter}
              onChange={(e) => setGeologistFilter(e.target.value)}
            >
              <option value="ALL">All Staff / Geologists</option>
              {distinctGeologists.map((geo) => (
                <option key={geo} value={geo}>
                  {geo}
                </option>
              ))}
            </select>
          )}

          {hasActiveFilters && (
            <button type="button" className="fd-btn-action" onClick={handleResetFilters}>
              <RotateCcw size={13} /> Reset
            </button>
          )}
        </div>
      </div>

      {/* Records Table or Empty State */}
      {displayedRecords.length === 0 ? (
        <div className="fd-empty">
          <div className="fd-empty-icon">
            <SectionIcon size={28} />
          </div>
          <h3 className="fd-empty-title">No {section.title} records found.</h3>
          <p className="fd-empty-desc">
            {hasActiveFilters
              ? 'No records match the current filter and search criteria.'
              : `No observations or logs have been recorded for ${section.title} yet.`}
          </p>
          {canManageFieldData && (
            <button
              type="button"
              className="btn-primary"
              onClick={() => {
                setEditingRecord(null)
                setIsFormOpen(true)
              }}
            >
              <Plus size={16} /> Add Record
            </button>
          )}
        </div>
      ) : (
        <div className="fd-table-card">
          <div className="fd-table-wrap">
            <table className="fd-table">
              <thead>
                <tr>
                  <th>Record ID</th>
                  <th>Project</th>
                  <th>Date</th>
                  <th>Geologist</th>
                  <th>Location / Coordinates</th>
                  <th>Sample / Borehole ID</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {displayedRecords.map((record) => {
                  const isSubmitted = record.status === 'Submitted'
                  const canEditThis = checkCanEdit(record)
                  return (
                    <tr key={record.id}>
                      <td>
                        <span className="fd-mono">{record.id}</span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <strong style={{ fontSize: 13, color: '#0f172a' }}>{record.projectName || record.projectId}</strong>
                          <span style={{ fontSize: 11.5, color: '#64748b' }}>{record.projectId}</span>
                        </div>
                      </td>
                      <td style={{ whiteSpace: 'nowrap' }}>{record.date}</td>
                      <td>{record.employeeName || record.createdBy || '—'}</td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', maxWidth: 260 }}>
                          <span style={{ fontSize: 13, color: '#1e293b' }}>{record.metadata?.location || '—'}</span>
                          {record.metadata?.coordinates?.latitude && (
                            <span style={{ fontSize: 11.5, color: '#64748b' }}>
                              {record.metadata.coordinates.latitude}, {record.metadata.coordinates.longitude}
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        {record.metadata?.sampleOrBoreholeId ? (
                          <span className="fd-mono" style={{ color: '#0f172a', background: '#f1f5f9', padding: '2px 6px', borderRadius: 4 }}>
                            {record.metadata.sampleOrBoreholeId}
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td>
                        <span className={`fd-status-pill ${isSubmitted ? 'fd-status-submitted' : 'fd-status-draft'}`}>
                          {record.status || 'Submitted'}
                        </span>
                      </td>
                      <td>
                        <div className="fd-actions">
                          <button
                            type="button"
                            className="fd-btn-action"
                            onClick={() => setViewingRecord(record)}
                            title="View record details"
                          >
                            <Eye size={13} /> View
                          </button>
                          {canEditThis && (
                            <button
                              type="button"
                              className="fd-btn-action"
                              onClick={() => {
                                setEditingRecord(record)
                                setIsFormOpen(true)
                              }}
                              title="Edit record"
                            >
                              <Edit3 size={13} /> Edit
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Modal */}
      <FieldRecordFormModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false)
          setEditingRecord(null)
        }}
        section={section}
        record={editingRecord}
        onSaved={(_rec, msg) => showToast(msg || 'Record saved successfully.')}
      />

      {/* View Detail Modal */}
      <FieldRecordDetailModal
        isOpen={Boolean(viewingRecord)}
        onClose={() => setViewingRecord(null)}
        record={viewingRecord}
        section={section}
        canEdit={viewingRecord ? checkCanEdit(viewingRecord) : false}
        onEdit={(rec) => {
          setViewingRecord(null)
          setEditingRecord(rec)
          setIsFormOpen(true)
        }}
      />
    </div>
  )
}
