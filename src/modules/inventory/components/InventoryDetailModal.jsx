import { useEffect, useId } from 'react'
import { Boxes, Calendar, CheckCircle2, Clock, MapPin, Pencil, RotateCcw, User, UserCheck, X } from 'lucide-react'
import { Portal } from '../../../shared/components/Portal'
import { formatINR } from '../../../shared/utils/format'

export function InventoryDetailModal({ item, assignments = [], onClose, onAssign, onReturn, onEdit, canManage }) {
  const titleId = useId()

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const itemAssignments = assignments.filter(
    (a) => a.inventoryItemId === item.id || (item.assetId && a.assetId === item.assetId),
  )

  const activeAssignments = itemAssignments.filter((a) => a.status === 'Assigned')
  const returnedAssignments = itemAssignments.filter((a) => a.status === 'Returned')

  const availableStock = item.availableQuantity !== undefined ? item.availableQuantity : item.quantity
  const totalStock = item.totalQuantity !== undefined ? item.totalQuantity : item.quantity
  const assignedStock = item.assignedQuantity || 0

  const pct = totalStock > 0 ? Math.round((availableStock / totalStock) * 100) : 0
  const barClass = pct > 50 ? 'good' : pct > 20 ? 'medium' : 'low'

  return (
    <Portal>
      <div className="inv-modal-backdrop" onClick={onClose}>
        <div
          className="inv-modal-box"
          style={{ maxWidth: '640px' }}
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
        >
          <div className="inv-modal-header">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 whitespace-nowrap">
                  {item.assetId || item.id}
                </span>
                <span className="cat-badge">{item.category}</span>
              </div>
              <h2 id={titleId} className="mt-1">{item.name}</h2>
            </div>
            <div className="flex items-center gap-2">
              {canManage && onEdit && (
                <button
                  type="button"
                  className="btn btn-small btn-outline flex items-center gap-1.5"
                  onClick={() => {
                    onClose()
                    onEdit(item)
                  }}
                  title="Edit item specifications"
                >
                  <Pencil size={13} /> Edit
                </button>
              )}
              <button
                type="button"
                className="btn-icon-soft"
                onClick={onClose}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          <div className="inv-modal-body">
            {/* Stock Level Card */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="font-semibold text-slate-700">Stock Availability</span>
                <span className="font-bold text-slate-900">{pct}% Available</span>
              </div>
              <div className="stock-bar-track">
                <div className={`stock-bar-fill ${barClass}`} style={{ width: `${pct}%` }} />
              </div>
              <div className="grid grid-cols-3 gap-2 mt-3 pt-2 border-t border-slate-200/80 text-center text-xs">
                <div>
                  <span className="text-[11px] text-slate-500 block">Total</span>
                  <strong className="text-slate-900 text-sm">{totalStock} {item.unit || 'Nos'}</strong>
                </div>
                <div>
                  <span className="text-[11px] text-slate-500 block">Available</span>
                  <strong className="text-emerald-700 text-sm">{availableStock} {item.unit || 'Nos'}</strong>
                </div>
                <div>
                  <span className="text-[11px] text-slate-500 block">Assigned</span>
                  <strong className="text-blue-700 text-sm">{assignedStock} {item.unit || 'Nos'}</strong>
                </div>
              </div>
            </div>

            {/* Specifications & Location */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-lg border border-slate-200 space-y-1">
                <span className="text-slate-500 block text-[11px]">Location</span>
                <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                  <MapPin size={14} className="text-amber-500" />
                  <span>{item.location || 'Jaipur Corporate HQ'}</span>
                </div>
              </div>

              <div className="p-3 rounded-lg border border-slate-200 space-y-1">
                <span className="text-slate-500 block text-[11px]">Vendor / Supplier</span>
                <span className="font-semibold text-slate-800 block truncate">
                  {item.vendor || '—'}
                </span>
              </div>

              {item.purchaseDate && (
                <div className="p-3 rounded-lg border border-slate-200 space-y-1">
                  <span className="text-slate-500 block text-[11px]">Acquisition Date</span>
                  <span className="font-medium text-slate-800">{item.purchaseDate}</span>
                </div>
              )}

              {item.purchaseCost ? (
                <div className="p-3 rounded-lg border border-slate-200 space-y-1">
                  <span className="text-slate-500 block text-[11px]">Acquisition Cost</span>
                  <span className="font-bold text-slate-900">{formatINR(item.purchaseCost)}</span>
                </div>
              ) : null}
            </div>

            {item.description && (
              <div className="text-xs">
                <span className="font-semibold text-slate-700 block mb-1">Description</span>
                <p className="text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-200 m-0">
                  {item.description}
                </p>
              </div>
            )}

            {item.remarks && (
              <div className="text-xs">
                <span className="font-semibold text-slate-700 block mb-1">Remarks</span>
                <p className="text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-200 m-0">
                  {item.remarks}
                </p>
              </div>
            )}

            {/* Currently Active Checkouts */}
            <div className="mt-2">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Active Checkouts ({activeAssignments.length})
                </h3>
                {canManage && availableStock > 0 && (
                  <button
                    type="button"
                    className="btn btn-small btn-primary"
                    onClick={() => {
                      onClose()
                      onAssign(item)
                    }}
                  >
                    <UserCheck size={14} /> Assign Item
                  </button>
                )}
              </div>

              {activeAssignments.length === 0 ? (
                <p className="text-xs text-slate-500 italic p-3 rounded-lg bg-slate-50 border border-slate-200 text-center m-0">
                  No active assignments. All units are currently in warehouse stock.
                </p>
              ) : (
                <div className="space-y-2">
                  {activeAssignments.map((asg) => (
                    <div
                      key={asg.id || asg.assignmentId}
                      className="p-3 rounded-lg bg-white border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <User size={13} className="text-blue-600" />
                          <strong className="text-slate-900">{asg.employeeName}</strong>
                          <span className="text-[11px] font-mono text-slate-500">({asg.employeeId})</span>
                          <span className="inv-badge inv-badge-assigned">
                            {asg.quantity} {asg.unit || 'Nos'}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-1">
                          <span>Out: {asg.assignedDate || '—'}</span>
                          {asg.expectedReturnDate && (
                            <span>Due: <strong className="text-amber-700">{asg.expectedReturnDate}</strong></span>
                          )}
                          {asg.projectName && <span>Site: {asg.projectName}</span>}
                        </div>
                        {asg.remarks && (
                          <p className="text-[11px] text-slate-500 italic mt-1 m-0">
                            "{asg.remarks}"
                          </p>
                        )}
                      </div>

                      {canManage && (
                        <button
                          type="button"
                          className="btn-return shrink-0"
                          onClick={() => {
                            onClose()
                            onReturn(asg)
                          }}
                        >
                          <RotateCcw size={13} /> Return
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Historical Returns */}
            {returnedAssignments.length > 0 && (
              <div className="mt-2">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
                  Return History ({returnedAssignments.length})
                </h3>
                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                  {returnedAssignments.map((asg) => (
                    <div
                      key={asg.id || asg.assignmentId}
                      className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs flex justify-between items-start"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <CheckCircle2 size={13} className="text-emerald-600" />
                          <span className="font-medium text-slate-800">{asg.employeeName}</span>
                          <span className="inv-badge inv-badge-returned">
                            {asg.quantity} {asg.unit || 'Nos'} Returned
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          Assigned: {asg.assignedDate} · Returned: {asg.returnDate || 'Completed'}
                        </div>
                        {asg.returnRemarks && (
                          <p className="text-[11px] text-slate-600 mt-0.5 m-0 italic">
                            Condition: "{asg.returnRemarks}"
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="inv-modal-footer">
            <button
              type="button"
              className="btn btn-outline"
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </Portal>
  )
}
