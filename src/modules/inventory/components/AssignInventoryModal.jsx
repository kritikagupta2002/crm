import { useState, useEffect, useId, useMemo } from 'react'
import { AlertCircle, CheckCircle2, UserCheck, X } from 'lucide-react'
import { Portal } from '../../../shared/components/Portal'
import { storage } from '../../../hrms/core/storage/storage'
import { toISODate } from '../../../shared/utils/date'
import { TODAY } from '../../crm/data/mockData'

export function AssignInventoryModal({ item, projects = [], onClose, onAssign }) {
  const titleId = useId()
  const todayISO = toISODate(TODAY)

  // Re-use official employee master list from storage
  const employees = useMemo(() => {
    try {
      const emps = storage.getEmployees() || []
      return emps.filter((e) => e.employment?.status !== 'Terminated')
    } catch {
      return []
    }
  }, [])

  const [selectedEmpId, setSelectedEmpId] = useState(
    employees[0]?.employeeId || employees[0]?.id || '',
  )
  const [quantity, setQuantity] = useState('1')
  const [assignedDate, setAssignedDate] = useState(todayISO)
  const [expectedReturnDate, setExpectedReturnDate] = useState('')
  const [projectId, setProjectId] = useState(projects[0]?.id || '')
  const [remarks, setRemarks] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const selectedEmployee = employees.find(
    (e) => e.employeeId === selectedEmpId || e.id === selectedEmpId,
  )

  const selectedProject = projects.find((p) => p.id === projectId)

  const handleSubmit = (e) => {
    e.preventDefault()

    if (!selectedEmployee) {
      setError('Please select an employee.')
      return
    }

    const qty = Number(quantity)
    if (quantity === '' || isNaN(qty) || qty <= 0) {
      setError('Quantity must be a positive number greater than 0.')
      return
    }

    const available = item.availableQuantity !== undefined ? item.availableQuantity : item.quantity
    if (qty > available) {
      setError(
        `Cannot assign ${qty} ${item.unit || 'units'}. Only ${available} available in stock.`,
      )
      return
    }

    if (!assignedDate) {
      setError('Assignment Date is required.')
      return
    }

    try {
      onAssign({
        inventoryItemId: item.id,
        assetId: item.assetId,
        itemName: item.name,
        category: item.category,
        employeeId: selectedEmployee.employeeId || selectedEmployee.id,
        employeeName: selectedEmployee.name,
        quantity: qty,
        unit: item.unit || 'Nos',
        assignedDate,
        expectedReturnDate,
        projectId: selectedProject?.id || null,
        projectName: selectedProject?.name || null,
        remarks: remarks.trim(),
      })
    } catch (err) {
      setError(err.message || 'Failed to assign inventory.')
    }
  }

  const availableStock = item.availableQuantity !== undefined ? item.availableQuantity : item.quantity

  return (
    <Portal>
      <div className="inv-modal-backdrop" onClick={onClose}>
        <div
          className="inv-modal-box"
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
        >
          <div className="inv-modal-header">
            <div>
              <h2 id={titleId}>Assign to Employee</h2>
              <p>Issue equipment or material stock to an employee for project/field duty</p>
            </div>
            <button
              type="button"
              className="btn-icon-soft"
              onClick={onClose}
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleSubmit} id="assign-inventory-form">
            <div className="inv-modal-body">
              {/* Item Summary Banner */}
              <div className="inv-info-card">
                <div className="flex items-center justify-between">
                  <span className="inv-info-card-title">{item.name}</span>
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-sky-100 text-sky-800">
                    {item.assetId || item.id}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-xs text-sky-900 mt-1">
                  <span>Category: <strong>{item.category}</strong></span>
                  <span>Available Stock: <strong className="text-emerald-700">{availableStock} {item.unit || 'Nos'}</strong></span>
                  <span>Total Stock: <strong>{item.quantity} {item.unit || 'Nos'}</strong></span>
                </div>
              </div>

              {error && (
                <div className="inv-error-box" role="alert">
                  <AlertCircle size={16} />
                  <span>{error}</span>
                </div>
              )}

              {/* Employee Selection */}
              <div className="inv-form-group">
                <label htmlFor="inv-assign-employee">
                  Employee <span className="required">*</span>
                </label>
                <select
                  id="inv-assign-employee"
                  className="inv-form-select"
                  value={selectedEmpId}
                  onChange={(e) => {
                    setSelectedEmpId(e.target.value)
                    if (error) setError('')
                  }}
                  required
                >
                  {employees.map((emp) => (
                    <option key={emp.employeeId || emp.id} value={emp.employeeId || emp.id}>
                      {emp.name} ({emp.employment?.designation || 'Staff'} · {emp.employeeId})
                    </option>
                  ))}
                </select>
                {selectedEmployee && (
                  <span className="text-[11px] text-slate-500">
                    Department: {selectedEmployee.employment?.department || 'Operations'} · Location: {selectedEmployee.employment?.workLocation || 'Jaipur HQ'}
                  </span>
                )}
              </div>

              {/* Quantity */}
              <div className="inv-form-row">
                <div className="inv-form-group">
                  <label htmlFor="inv-assign-quantity">
                    Quantity to Assign <span className="required">*</span>
                  </label>
                  <input
                    id="inv-assign-quantity"
                    type="number"
                    min="1"
                    max={availableStock}
                    step="1"
                    className="inv-form-input"
                    value={quantity}
                    onChange={(e) => {
                      setQuantity(e.target.value)
                      if (error) setError('')
                    }}
                    required
                  />
                  <span className="text-[11px] text-slate-500">
                    Maximum available: {availableStock} {item.unit || 'Nos'}
                  </span>
                </div>

                <div className="inv-form-group">
                  <label htmlFor="inv-assign-date">
                    Assignment Date <span className="required">*</span>
                  </label>
                  <input
                    id="inv-assign-date"
                    type="date"
                    className="inv-form-input"
                    value={assignedDate}
                    onChange={(e) => setAssignedDate(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Expected Return Date & Project */}
              <div className="inv-form-row">
                <div className="inv-form-group">
                  <label htmlFor="inv-return-date">Expected Return Date</label>
                  <input
                    id="inv-return-date"
                    type="date"
                    className="inv-form-input"
                    value={expectedReturnDate}
                    onChange={(e) => setExpectedReturnDate(e.target.value)}
                  />
                </div>

                <div className="inv-form-group">
                  <label htmlFor="inv-project">Associated Project / Site</label>
                  <select
                    id="inv-project"
                    className="inv-form-select"
                    value={projectId}
                    onChange={(e) => setProjectId(e.target.value)}
                  >
                    <option value="">-- No specific project (General duty) --</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.lead?.company || p.lead?.clientName || 'Client'})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Remarks */}
              <div className="inv-form-group">
                <label htmlFor="inv-assign-remarks">Assignment Remarks / Equipment Condition</label>
                <textarea
                  id="inv-assign-remarks"
                  rows={2}
                  className="inv-form-textarea"
                  placeholder="Purpose of check-out, accessories included, flight kit condition, etc."
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                />
              </div>
            </div>

            <div className="inv-modal-footer">
              <button
                type="button"
                className="btn btn-outline"
                onClick={onClose}
              >
                Cancel
              </button>
              <button
                type="submit"
                id="btn-confirm-assign"
                className="btn btn-primary"
                disabled={availableStock <= 0}
              >
                <UserCheck size={16} /> Confirm Assignment
              </button>
            </div>
          </form>
        </div>
      </div>
    </Portal>
  )
}
