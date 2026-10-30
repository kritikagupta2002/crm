import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Search, Plus, ArrowRight, Eye, Mountain } from 'lucide-react'
import { useAccess, useCrm } from '../../../core/permissions/crm'
import { FIELD_SECTIONS, filterFieldRecordsByRole, getFieldSectionByKey } from '../data/fieldDatabase'
import { FieldRecordDetailModal } from '../components/FieldRecordDetailModal'
import { FieldRecordFormModal } from '../components/FieldRecordFormModal'
import { FieldOverview } from '../components/FieldOverview'
import { formatOf } from '../data/fieldFormats'
import { allProjects } from '../../erm/utils/projects'
import './fieldDatabase.css'

export function FieldDatabaseDashboard() {
  const { fieldRecords = [], role, user, leads = [], projectEdits = {} } = useCrm()
  const projects = useMemo(() => allProjects(leads, projectEdits) || [], [leads, projectEdits])
  const { may } = useAccess()
  const canManageFieldData = may('fieldDatabase')

  const [searchQuery, setSearchQuery] = useState('')
  const [viewingRecord, setViewingRecord] = useState(null)
  const [selectedSectionForAdd, setSelectedSectionForAdd] = useState(null)

  // 1. Role-isolated records
  const roleFilteredRecords = useMemo(() => {
    return filterFieldRecordsByRole(fieldRecords, role, user)
  }, [fieldRecords, role, user])

  // 2. Count records per section for the current user
  const sectionCounts = useMemo(() => {
    const counts = {}
    FIELD_SECTIONS.forEach((s) => {
      counts[s.key] = 0
    })
    roleFilteredRecords.forEach((r) => {
      if (counts[r.section] !== undefined) {
        counts[r.section]++
      }
    })
    return counts
  }, [roleFilteredRecords])

  // 4. Recent records table (max 8)
  const recentRecords = useMemo(() => {
    let list = [...roleFilteredRecords]
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      list = list.filter((r) => {
        const idMatch = r.id?.toLowerCase().includes(q)
        const projMatch = r.projectName?.toLowerCase().includes(q) || r.projectId?.toLowerCase().includes(q)
        const locMatch = r.metadata?.location?.toLowerCase().includes(q)
        const secMatch = r.section?.toLowerCase().includes(q)
        const staffMatch = r.employeeName?.toLowerCase().includes(q) || r.createdBy?.toLowerCase().includes(q)
        return idMatch || projMatch || locMatch || secMatch || staffMatch
      })
    }
    return list.slice(0, 10)
  }, [roleFilteredRecords, searchQuery])

  const viewingSection = viewingRecord ? getFieldSectionByKey(viewingRecord.section) : null

  return (
    <div className="fd-page">
      {/* Page Header */}
      <div className="fd-header">
        <div className="fd-header-titles">
          <div className="fd-header-top">
            <h1 className="fd-header-title">Field Database</h1>
            <span className="fd-badge fd-badge-category">Geological & Drilling</span>
          </div>
          <p className="fd-header-subtitle">
            Mapping, sampling, drilling and lab dispatch in the client's own formats. Every section downloads as their Excel workbook.
          </p>
        </div>

        <div className="fd-header-actions">
          {canManageFieldData && (
            <button
              type="button"
              className="btn-primary"
              onClick={() => setSelectedSectionForAdd(FIELD_SECTIONS[0])}
            >
              <Plus size={16} /> New Field Record
            </button>
          )}
        </div>
      </div>

      <FieldOverview records={roleFilteredRecords} allRecords={fieldRecords} projects={projects} />

      {/* Section Search Toolbar */}
      <div className="fd-toolbar">
        <div className="fd-search-box">
          <Search size={16} style={{ color: '#64748b' }} />
          <input
            type="text"
            placeholder={`Search recent field records across all ${FIELD_SECTIONS.length} sections...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* 10 Sections Grid */}
      <div style={{ marginTop: 4 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, color: '#1e293b', marginBottom: 12 }}>
          Sections ({FIELD_SECTIONS.length})
        </h2>
        <div className="fd-sections-grid">
          {FIELD_SECTIONS.map((sec) => {
            const Icon = sec.icon || Mountain
            const count = sectionCounts[sec.key] || 0
            return (
              <Link key={sec.key} to={sec.route} className="fd-section-card">
                <div>
                  <div className="fd-section-top">
                    <div className="fd-section-icon">
                      <Icon size={20} />
                    </div>
                    <div className="fd-section-badges">
                      <span className="fd-badge fd-badge-category" style={{ fontSize: 10.5 }}>
                        {sec.category}
                      </span>
                      <span className="fd-badge fd-badge-prefix" style={{ fontSize: 10.5 }}>
                        {sec.prefix}
                      </span>
                      {!formatOf(sec.key) && (
                        <span className="fd-badge fd-badge-pending" style={{ fontSize: 10.5 }}>
                          Format awaited
                        </span>
                      )}
                    </div>
                  </div>

                  <h3 className="fd-section-title">{sec.title}</h3>
                  <p className="fd-section-desc">{sec.description}</p>
                </div>

                <div className="fd-section-footer">
                  <span className="fd-section-count">
                    {count} {count === 1 ? 'record' : 'records'}
                  </span>
                  <span className="fd-section-cta">
                    Open Section <ArrowRight size={14} />
                  </span>
                </div>
              </Link>
            )
          })}
        </div>
      </div>

      {/* Recent Field Observations */}
      <div style={{ marginTop: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, color: '#1e293b', margin: 0 }}>
            Recent Field Records {searchQuery && `(Filtered: ${recentRecords.length})`}
          </h2>
          <span style={{ fontSize: 12.5, color: '#64748b' }}>
            Showing {recentRecords.length} most recent records
          </span>
        </div>

        {recentRecords.length === 0 ? (
          <div className="fd-empty">
            <h3 className="fd-empty-title">No field records found</h3>
            <p className="fd-empty-desc">
              {searchQuery
                ? 'No records match your search criteria.'
                : 'No observations have been recorded yet.'}
            </p>
          </div>
        ) : (
          <div className="fd-table-card">
            <div className="fd-table-wrap">
              <table className="fd-table">
                <thead>
                  <tr>
                    <th>Record ID</th>
                    <th>Section</th>
                    <th>Project</th>
                    <th>Date</th>
                    <th>Recorded By</th>
                    <th>Location / Station</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {recentRecords.map((record) => {
                    const sec = getFieldSectionByKey(record.section)
                    const isSubmitted = record.status === 'Submitted'
                    return (
                      <tr key={record.id}>
                        <td>
                          <span className="fd-mono">{record.id}</span>
                        </td>
                        <td>
                          <Link
                            to={sec ? sec.route : '#'}
                            style={{ textDecoration: 'none', color: '#0369a1', fontWeight: 500 }}
                          >
                            {sec ? sec.shortTitle : record.section}
                          </Link>
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
                          <span style={{ fontSize: 13, color: '#1e293b' }}>
                            {record.metadata?.location || '—'}
                          </span>
                        </td>
                        <td>
                          <span className={`fd-status-pill ${isSubmitted ? 'fd-status-submitted' : 'fd-status-draft'}`}>
                            {record.status || 'Submitted'}
                          </span>
                        </td>
                        <td>
                          <button
                            type="button"
                            className="fd-btn-action"
                            onClick={() => setViewingRecord(record)}
                          >
                            <Eye size={13} /> View
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* View Detail Modal */}
      {viewingRecord && viewingSection && (
        <FieldRecordDetailModal
          isOpen={Boolean(viewingRecord)}
          onClose={() => setViewingRecord(null)}
          record={viewingRecord}
          section={viewingSection}
          canEdit={false}
          onEdit={() => {}}
        />
      )}

      {/* Quick Add Modal */}
      {selectedSectionForAdd && (
        <FieldRecordFormModal
          isOpen={Boolean(selectedSectionForAdd)}
          onClose={() => setSelectedSectionForAdd(null)}
          section={selectedSectionForAdd}
          onSaved={() => setSelectedSectionForAdd(null)}
        />
      )}
    </div>
  )
}
