import { useState, useEffect, useId } from 'react'
import { AlertCircle, RotateCcw, X } from 'lucide-react'
import { Portal } from '../../../shared/components/Portal'
import { toISODate } from '../../../shared/utils/date'
import { TODAY } from '../../crm/data/mockData'

export function ReturnInventoryModal({ assignment, onClose, onReturn }) {
  const titleId = useId()
  const todayISO = toISODate(TODAY)

  const [returnDate, setReturnDate] = useState(todayISO)
  const [remarks, setRemarks] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const handleSubmit = (e) => {
    e.preventDefault()

    if (!returnDate) {
      setError('Return Date is required.')
      return
    }

    try {
      onReturn(assignment.id, {
        returnDate,
        remarks: remarks.trim(),
      })
    } catch (err) {
      setError(err.message || 'Failed to process inventory return.')
    }
  }

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
              <h2 id={titleId}>Return Inventory to Stock</h2>
              <p>Process equipment/material check-in and restore available stock level</p>
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

          <form onSubmit={handleSubmit} id="return-inventory-form">
            <div className="inv-modal-body">
              {/* Assignment Summary Banner */}
              <div className="inv-info-card">
                <div className="flex items-center justify-between">
                  <span className="inv-info-card-title">{assignment.itemName}</span>
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                    {assignment.assetId || assignment.inventoryItemId}
                  </span>
                </div>
                <div className="space-y-1 text-xs text-sky-900 mt-2">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Currently Assigned To:</span>
                    <strong>{assignment.employeeName} ({assignment.employeeId})</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Quantity Being Returned:</span>
                    <strong>{assignment.quantity} {assignment.unit || 'Nos'}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Originally Checked Out On:</span>
                    <span>{assignment.assignedDate || '—'}</span>
                  </div>
                  {assignment.projectName && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Project:</span>
                      <span>{assignment.projectName}</span>
                    </div>
                  )}
                </div>
              </div>

              {error && (
                <div className="inv-error-box" role="alert">
                  <AlertCircle size={16} />
                  <span>{error}</span>
                </div>
              )}

              <div className="inv-form-group">
                <label htmlFor="inv-return-date-input">
                  Actual Return Date <span className="required">*</span>
                </label>
                <input
                  id="inv-return-date-input"
                  type="date"
                  className="inv-form-input"
                  value={returnDate}
                  onChange={(e) => setReturnDate(e.target.value)}
                  required
                />
              </div>

              <div className="inv-form-group">
                <label htmlFor="inv-return-remarks">
                  Return Condition & Inspection Remarks
                </label>
                <textarea
                  id="inv-return-remarks"
                  rows={2}
                  className="inv-form-textarea"
                  placeholder="Checked by site storekeeper. Cleaned, fully functional, all accessories verified intact."
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
                id="btn-confirm-return"
                className="btn btn-primary"
              >
                <RotateCcw size={16} /> Confirm Return
              </button>
            </div>
          </form>
        </div>
      </div>
    </Portal>
  )
}
