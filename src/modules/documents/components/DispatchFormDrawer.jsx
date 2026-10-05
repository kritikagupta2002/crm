import { AlertCircle, Truck, X } from 'lucide-react'
import { useEffect, useId, useState } from 'react'
import { SideDrawer } from '../../../shared/components/SideDrawer'
import { DISPATCH_MODES } from '../data/documents'
import { TODAY } from '../../crm/data/mockData'
import { toISODate } from '../../../shared/utils/date'

const STATUS_OPTIONS = [
  { value: 'Dispatched', label: 'Dispatched (On the way)' },
  { value: 'To dispatch', label: 'To dispatch (Pending)' },
  { value: 'Received', label: 'Received (Delivered)' },
  { value: 'Cancelled', label: 'Cancelled' },
]

export function DispatchFormDrawer({
  isOpen,
  onClose,
  onSave,
  initialData = null,
  isEdit = false,
  allDispatches = [],
  documents = [],
  projects = [],
}) {
  const titleId = useId()
  const todayISO = toISODate(TODAY)

  const generateDispatchNumber = () => {
    const year = TODAY.getFullYear()
    const count = (allDispatches?.length || 0) + 1
    return `BGS/DSP/${year}/${String(count).padStart(3, '0')}`
  }

  const [form, setForm] = useState({
    dispatchDate: todayISO,
    dispatchNumber: '',
    courier: DISPATCH_MODES[0],
    docketNumber: '',
    recipient: '',
    organization: '',
    address: '',
    projectId: '',
    documentId: '',
    status: 'Dispatched',
    remarks: '',
  })

  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  // Initialize form when opening or changing initialData
  useEffect(() => {
    if (!isOpen) return

    if (initialData) {
      setForm({
        dispatchDate: initialData.dispatchDate || todayISO,
        dispatchNumber: initialData.dispatchNumber || '',
        courier: initialData.courier || DISPATCH_MODES[0],
        docketNumber: initialData.docketNumber || '',
        recipient: initialData.recipient || '',
        organization: initialData.organization || '',
        address: initialData.address || '',
        projectId: initialData.projectId || '',
        documentId: initialData.documentId || '',
        status: initialData.status || 'Dispatched',
        remarks: initialData.remarks || '',
      })
    } else {
      setForm({
        dispatchDate: todayISO,
        dispatchNumber: generateDispatchNumber(),
        courier: DISPATCH_MODES[0],
        docketNumber: '',
        recipient: '',
        organization: '',
        address: '',
        projectId: '',
        documentId: '',
        status: 'Dispatched',
        remarks: '',
      })
    }
    setErrors({})
    setSubmitting(false)
  }, [isOpen, initialData])

  if (!isOpen) return null

  const byHand = form.courier === 'By hand'

  // Filter documents by selected project if any
  const availableDocs = form.projectId
    ? documents.filter((d) => d.project?.id === form.projectId)
    : documents

  const handleProjectChange = (e) => {
    const projId = e.target.value
    const proj = projects.find((p) => p.id === projId)

    setForm((prev) => {
      const next = { ...prev, projectId: projId }
      // If selected doc doesn't belong to the newly picked project, reset doc
      if (prev.documentId) {
        const currentDoc = documents.find((d) => d.id === prev.documentId)
        if (currentDoc && currentDoc.project?.id !== projId) {
          next.documentId = ''
        }
      }
      // Auto-fill recipient information from project lead if currently blank or previously auto-filled
      if (proj?.lead) {
        if (!prev.recipient || prev.recipient === prev._autofilledRecipient) {
          next.recipient = proj.lead.contactPerson || ''
          next._autofilledRecipient = proj.lead.contactPerson || ''
        }
        if (!prev.organization || prev.organization === prev._autofilledOrg) {
          next.organization = proj.lead.company || ''
          next._autofilledOrg = proj.lead.company || ''
        }
        if (!prev.address || prev.address === prev._autofilledAddress) {
          next.address = proj.lead.location || ''
          next._autofilledAddress = proj.lead.location || ''
        }
      }
      return next
    })

    if (errors.projectId) {
      setErrors((prev) => ({ ...prev, projectId: '' }))
    }
  }

  const handleDocumentChange = (e) => {
    const docId = e.target.value
    const doc = documents.find((d) => d.id === docId)

    setForm((prev) => {
      const next = { ...prev, documentId: docId }
      if (doc) {
        if (doc.project?.id) {
          next.projectId = doc.project.id
        }
        if (doc.lead) {
          if (!prev.recipient || prev.recipient === prev._autofilledRecipient) {
            next.recipient = doc.lead.contactPerson || ''
            next._autofilledRecipient = doc.lead.contactPerson || ''
          }
          if (!prev.organization || prev.organization === prev._autofilledOrg) {
            next.organization = doc.lead.company || ''
            next._autofilledOrg = doc.lead.company || ''
          }
          if (!prev.address || prev.address === prev._autofilledAddress) {
            next.address = doc.lead.location || ''
            next._autofilledAddress = doc.lead.location || ''
          }
        }
      }
      return next
    })

    if (errors.documentId) {
      setErrors((prev) => ({ ...prev, documentId: '' }))
    }
  }

  const validate = () => {
    const nextErrors = {}

    // Dispatch Date validation
    if (!form.dispatchDate || !form.dispatchDate.trim()) {
      nextErrors.dispatchDate = 'Dispatch date is required.'
    }

    // Dispatch Number validation
    const dispNo = form.dispatchNumber?.trim()
    if (!dispNo) {
      nextErrors.dispatchNumber = 'Dispatch number is required.'
    } else {
      // Check for duplicates
      const isDuplicate = (allDispatches || []).some((d) => {
        if (isEdit && initialData && d.id === initialData.id) return false
        return d.dispatchNumber?.trim().toLowerCase() === dispNo.toLowerCase()
      })
      if (isDuplicate) {
        nextErrors.dispatchNumber = `Dispatch number "${dispNo}" already exists.`
      }
    }

    // Recipient validation
    if (!form.recipient || !form.recipient.trim()) {
      nextErrors.recipient = 'Recipient name is required.'
    }

    // Courier validation
    if (!form.courier || !form.courier.trim()) {
      nextErrors.courier = 'Dispatch / Courier mode is required.'
    }

    // Tracking / Docket validation
    if (form.courier !== 'By hand' && (!form.docketNumber || !form.docketNumber.trim())) {
      nextErrors.docketNumber = 'Docket / Tracking number is required for courier and postal dispatches.'
    }

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!validate()) {
      return
    }

    setSubmitting(true)
    try {
      const payload = {
        ...form,
        dispatchDate: form.dispatchDate.trim(),
        dispatchNumber: form.dispatchNumber.trim(),
        courier: form.courier.trim(),
        docketNumber: form.docketNumber.trim(),
        recipient: form.recipient.trim(),
        organization: form.organization.trim(),
        address: form.address.trim(),
        documentId: form.documentId || null,
        projectId: form.projectId || null,
        status: form.status,
        remarks: form.remarks.trim(),
      }
      onSave(payload)
    } catch (err) {
      setErrors((prev) => ({ ...prev, submit: err.message || 'Unable to create dispatch.' }))
      setSubmitting(false)
    }
  }

  return (
    <SideDrawer
      title={isEdit ? 'Edit Dispatch' : 'New Dispatch'}
      sub={isEdit ? form.dispatchNumber : 'Create a new dispatch record in the register'}
      onClose={onClose}
      className="doc-drawer dispatch-form-drawer"
    >
      <form onSubmit={handleSubmit} noValidate className="dispatch-entry-form">
        {errors.submit && (
          <div className="form-error-banner" role="alert">
            <AlertCircle size={16} />
            <span>{errors.submit}</span>
          </div>
        )}

        <div className="doc-form-row form-grid-2">
          <label className={`field ${errors.dispatchDate ? 'has-error' : ''}`}>
            <span className="field-label">
              Dispatch Date <em aria-hidden="true">*</em>
            </span>
            <input
              type="date"
              value={form.dispatchDate}
              onChange={(e) => {
                setForm((prev) => ({ ...prev, dispatchDate: e.target.value }))
                if (errors.dispatchDate) setErrors((prev) => ({ ...prev, dispatchDate: '' }))
              }}
              required
            />
            {errors.dispatchDate && <span className="field-error">{errors.dispatchDate}</span>}
          </label>

          <label className={`field ${errors.dispatchNumber ? 'has-error' : ''}`}>
            <span className="field-label">
              Dispatch / Ref Number <em aria-hidden="true">*</em>
            </span>
            <input
              type="text"
              value={form.dispatchNumber}
              onChange={(e) => {
                setForm((prev) => ({ ...prev, dispatchNumber: e.target.value }))
                if (errors.dispatchNumber) setErrors((prev) => ({ ...prev, dispatchNumber: '' }))
              }}
              placeholder="e.g. BGS/DSP/2026/001"
              required
            />
            {errors.dispatchNumber && <span className="field-error">{errors.dispatchNumber}</span>}
          </label>
        </div>

        <div className="doc-form-row form-grid-2">
          <label className={`field ${errors.courier ? 'has-error' : ''}`}>
            <span className="field-label">
              Dispatch Mode <em aria-hidden="true">*</em>
            </span>
            <select
              value={form.courier}
              onChange={(e) => {
                setForm((prev) => ({ ...prev, courier: e.target.value }))
                if (errors.courier) setErrors((prev) => ({ ...prev, courier: '' }))
              }}
            >
              {DISPATCH_MODES.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
            {errors.courier && <span className="field-error">{errors.courier}</span>}
          </label>

          <label className={`field ${errors.docketNumber ? 'has-error' : ''}`}>
            <span className="field-label">
              {byHand ? 'Carried By / Person' : 'Docket / Tracking No.'}{' '}
              {!byHand && <em aria-hidden="true">*</em>}
            </span>
            <input
              type="text"
              value={form.docketNumber}
              onChange={(e) => {
                setForm((prev) => ({ ...prev, docketNumber: e.target.value }))
                if (errors.docketNumber) setErrors((prev) => ({ ...prev, docketNumber: '' }))
              }}
              placeholder={byHand ? 'e.g. Office runner' : 'e.g. EE123456789IN / DTDC D4001'}
              required={!byHand}
            />
            {errors.docketNumber && <span className="field-error">{errors.docketNumber}</span>}
          </label>
        </div>

        <div className="doc-form-row form-grid-2">
          <label className={`field ${errors.recipient ? 'has-error' : ''}`}>
            <span className="field-label">
              Recipient Name <em aria-hidden="true">*</em>
            </span>
            <input
              type="text"
              value={form.recipient}
              onChange={(e) => {
                setForm((prev) => ({ ...prev, recipient: e.target.value }))
                if (errors.recipient) setErrors((prev) => ({ ...prev, recipient: '' }))
              }}
              placeholder="e.g. Rajesh Kumar"
              required
            />
            {errors.recipient && <span className="field-error">{errors.recipient}</span>}
          </label>

          <label className="field">
            <span className="field-label">Recipient Organization / Company</span>
            <input
              type="text"
              value={form.organization}
              onChange={(e) => setForm((prev) => ({ ...prev, organization: e.target.value }))}
              placeholder="e.g. Hindustan Zinc Ltd"
            />
          </label>
        </div>

        <label className="field field-full">
          <span className="field-label">Recipient Address / Location</span>
          <textarea
            rows={2}
            value={form.address}
            onChange={(e) => setForm((prev) => ({ ...prev, address: e.target.value }))}
            placeholder="e.g. Chanderiya Lead Zinc Smelter, Chittorgarh, Rajasthan"
          />
        </label>

        <div className="doc-form-row form-grid-2">
          <label className="field">
            <span className="field-label">Related Project</span>
            <select value={form.projectId} onChange={handleProjectChange}>
              <option value="">None (General Dispatch)</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.id} · {p.name || p.lead?.company || 'Project'}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span className="field-label">Related Document</span>
            <select value={form.documentId} onChange={handleDocumentChange}>
              <option value="">None (Standalone Dispatch)</option>
              {availableDocs.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.letter.ref} · {d.letter.title}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="doc-form-row form-grid-2">
          <label className="field">
            <span className="field-label">Dispatch Status</span>
            <select
              value={form.status}
              onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value }))}
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="field field-full">
          <span className="field-label">Description / Remarks</span>
          <textarea
            rows={3}
            value={form.remarks}
            onChange={(e) => setForm((prev) => ({ ...prev, remarks: e.target.value }))}
            placeholder="Contents, reference instructions, or special delivery notes..."
          />
        </label>

        <div className="letter-form-actions dispatch-form-footer">
          <button type="button" className="btn" onClick={onClose} disabled={submitting}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            <Truck size={15} /> {isEdit ? 'Save Changes' : 'Create Dispatch'}
          </button>
        </div>
      </form>
    </SideDrawer>
  )
}
