import { useMemo, useState } from 'react'
import { AlertCircle, FileText, Save, X } from 'lucide-react'
import { useCrm } from '../../../core/permissions/crm'
import { toISODate } from '../../../shared/utils/date'
import { allProjects } from '../../erm/utils/projects'
import { fieldsOf, formatOf, summaryMetadata } from '../data/fieldFormats'
import { FormatField, GeologistSelect } from './FormatFields'
import { FormatTable } from './FormatTable'
import { applyChange, inClientOrder } from '../utils/formatRows'
import { DispatchBatch } from './DispatchBatch'


const LAB_DETAILS = ['LAB_ADDRESS', 'LAB_CONTACT', 'LAB_OWNER', 'LAB_MAIL', 'SENDER_CONTACT', 'SENDER_MAIL', 'SENDER_ADDRESS']

function initialState(section, record, user, projects) {
  const fmt = formatOf(section.key)
  const today = toISODate(new Date())
  if (record) {
    // A row's own date and geologist (columns of the client's sheet) start as the record's.
    const own = (t, r) => {
      const out = { ...r }
      t.columns.forEach((c) => {
        if (c.bind === 'date' && (out[c.id] === '' || out[c.id] == null)) out[c.id] = record.date || ''
        if (c.bind === 'geologist' && (out[c.id] === '' || out[c.id] == null)) out[c.id] = record.employeeName || ''
      })
      return out
    }
    return {
      projectId: record.projectId || '',
      projectName: record.projectName || '',
      date: record.date || today,
      employeeName: record.employeeName || user?.name || '',
      fields: { ...fieldsOf(record) },
      rows: Object.fromEntries(fmt.tables.map((t) => [t.key, (record.data?.rows?.[t.key] ?? []).map((r) => own(t, r))])),
    }
  }
  return {
    projectId: projects[0]?.id || '',
    projectName: projects[0]?.name || '',
    date: today,
    employeeName: user?.name || '',
    fields: {},
    rows: Object.fromEntries(fmt.tables.map((t) => [t.key, []])),
  }
}

/*
 * Add / edit a record in the client's own format: the header of their sheet once, then its
 * repeating rows (intervals, runs, survey readings, assay samples). Dropdowns read the code lists.
 */
export function FormatRecordForm({ section, record, onClose, onSaved }) {
  const { leads, projectEdits, user, role, fieldRecords = [], createFieldRecord, updateFieldRecord } = useCrm()
  const fmt = formatOf(section.key)
  const isEdit = Boolean(record)
  const projects = useMemo(() => allProjects(leads, projectEdits) || [], [leads, projectEdits])
  const [state, setState] = useState(() => initialState(section, record, user, projects))
  const [tried, setTried] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const set = (patch) => setState((s) => ({ ...s, ...patch }))
  const setField = (id, value) =>
    setState((s) => {
      const fields = applyChange(fmt.header, s.fields, id, value)
      // A lab used before: its address and contacts come from the last batch sent there.
      if (section.key === 'dispatch-database' && id === 'LAB' && !s.fields.LAB_ADDRESS) {
        const last = fieldRecords.filter((r) => r.section === section.key && fieldsOf(r).LAB === value).sort((a, b) => (b.date || '').localeCompare(a.date || ''))[0]
        if (last) LAB_DETAILS.forEach((k) => (fields[k] = fields[k] || fieldsOf(last)[k] || ''))
      }
      return { ...s, fields }
    })
  const setRows = (key, rows) => setState((s) => ({ ...s, rows: { ...s.rows, [key]: rows } }))

  // Where the client's sheet keeps the date and geologist: in the header, or on every row.
  const headerHas = (to) => fmt.header.some((f) => f.bind === to)
  const fromRows = (to) => {
    for (const t of fmt.tables) {
      const c = t.columns.find((x) => x.bind === to)
      const v = c && (state.rows[t.key] ?? []).map((r) => r[c.id]).find((x) => x)
      if (v) return v
    }
    return ''
  }
  const recordDate = headerHas('date') ? state.date : fromRows('date') || state.date
  const recordGeologist = role === 'Employee' ? user?.name || '' : headerHas('geologist') ? state.employeeName : fromRows('geologist') || state.employeeName
  // The client's sheets mark nothing as compulsory; a record only needs its project to be kept under.
  const blocked = !state.projectId

  const save = (e) => {
    e.preventDefault()
    setTried(true)
    setSubmitError('')
    if (blocked) return
    const meta = summaryMetadata(section.key, state.fields)
    const remarks = state.fields.DESCRIPTION1 || state.fields.COMMENTS || ''
    const payload = {
      projectId: state.projectId,
      projectName: state.projectName,
      date: recordDate,
      employeeName: recordGeologist.trim(),
      status: record?.status || 'Submitted',
      metadata: { ...meta, location: meta.location || state.projectName, remarks },
      data: { format: fmt.workbook, fields: state.fields, rows: state.rows },
    }
    try {
      const saved = isEdit ? updateFieldRecord(record.id, payload) : createFieldRecord({ ...payload, section: section.key, employeeId: user?.employeeId || '' })
      onSaved?.(saved, isEdit ? 'Record updated.' : 'Record saved.')
      onClose()
    } catch (err) {
      setSubmitError(err.message || 'Unable to save record.')
    }
  }

  return (
    <div className="fd-modal-backdrop" onClick={onClose}>
      <div className="fd-modal ff-modal" onClick={(e) => e.stopPropagation()}>
        <div className="fd-modal-header">
          <div className="fd-header-titles">
            <h2 className="fd-modal-title">{isEdit ? `Edit ${record.id}` : `New ${section.shortTitle} record`}</h2>
            <span className="ff-format-name">
              <FileText size={13} /> Format: {fmt.workbook}
            </span>
          </div>
          <button type="button" className="fd-modal-close" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={save} className="ff-form">
          <div className="fd-modal-body">
            {submitError && (
              <div className="fd-notice-banner ff-banner-error">
                <AlertCircle size={18} />
                <div>{submitError}</div>
              </div>
            )}

            <div className="ff-grid ff-header-grid">
              {inClientOrder(fmt, fmt.header.filter((f) => !f.inherit)).map((fld) => {
                if (fld.bind === 'project')
                  return (
                    <FormatField key={fld.id} fld={{ ...fld, required: true }} idPrefix="hd" error={tried && !state.projectId ? 'Required' : ''}>
                      <select
                        id={`hd-${fld.id}`}
                        className={`fd-select${tried && !state.projectId ? ' has-error' : ''}`}
                        value={state.projectId}
                        onChange={(e) => set({ projectId: e.target.value, projectName: projects.find((p) => p.id === e.target.value)?.name || e.target.value })}
                      >
                        <option value="">Select project</option>
                        {projects.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.id} · {p.name} · {p.lead?.company}
                          </option>
                        ))}
                      </select>
                    </FormatField>
                  )
                if (fld.bind === 'date')
                  return (
                    <FormatField key={fld.id} fld={fld} idPrefix="hd">
                      <input id={`hd-${fld.id}`} type="date" className="fd-input" value={state.date} onChange={(e) => set({ date: e.target.value })} />
                    </FormatField>
                  )
                if (fld.bind === 'geologist')
                  return (
                    <FormatField key={fld.id} fld={fld} idPrefix="hd">
                      <GeologistSelect id={`hd-${fld.id}`} value={state.employeeName} onChange={(v) => set({ employeeName: v })} />
                    </FormatField>
                  )
                return <FormatField key={fld.id} fld={fld} value={state.fields[fld.id]} idPrefix="hd" onChange={(v) => setField(fld.id, v)} />
              })}
            </div>

            {fmt.tables.map((table) =>
              section.key === 'dispatch-database' ? (
                <DispatchBatch
                  key={table.key}
                  fields={state.fields}
                  rows={state.rows[table.key] ?? []}
                  onRowsChange={(rows) => setRows(table.key, rows)}
                  projectId={state.projectId}
                  records={fieldRecords}
                  recordId={record?.id}
                />
              ) : (
                <FormatTable
                  key={table.key}
                  table={table}
                  rows={state.rows[table.key] ?? []}
                  onChange={(rows) => setRows(table.key, rows)}
                  header={state.fields}
                  recordDate={state.date}
                  geologist={state.employeeName}
                />
              ),
            )}
          </div>

          <div className="fd-modal-footer ff-footer">
            {tried && blocked && (
              <span className="fd-error-msg ff-footer-msg">
                <AlertCircle size={14} />
                Choose the project.
              </span>
            )}
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              <Save size={15} /> {isEdit ? 'Save changes' : 'Save record'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
