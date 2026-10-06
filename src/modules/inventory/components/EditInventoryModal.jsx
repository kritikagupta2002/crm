import { useState, useEffect, useId } from 'react'
import { AlertCircle, Pencil, X } from 'lucide-react'
import { Portal } from '../../../shared/components/Portal'
import {
  INVENTORY_CATEGORIES,
  INVENTORY_LOCATIONS,
  INVENTORY_UNITS,
} from '../data/inventory'

export function EditInventoryModal({ item, onClose, onSave }) {
  const titleId = useId()

  const [formData, setFormData] = useState({
    name: item.name || '',
    category: item.category || INVENTORY_CATEGORIES[0] || 'Tools',
    assetId: item.assetId || '',
    quantity: String(item.totalQuantity ?? item.quantity ?? 1),
    unit: item.unit || 'Nos',
    location: item.location || INVENTORY_LOCATIONS[0] || 'Jaipur Corporate HQ',
    description: item.description || '',
    purchaseDate: item.purchaseDate || '',
    purchaseCost: item.purchaseCost !== undefined ? String(item.purchaseCost) : '',
    vendor: item.vendor || '',
    remarks: item.remarks || '',
  })

  const [error, setError] = useState('')

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (error) setError('')
  }

  const assignedQty = Number(item.assignedQuantity) || 0

  const handleSubmit = (e) => {
    e.preventDefault()

    const name = formData.name.trim()
    if (!name) {
      setError('Item Name is required.')
      return
    }

    const category = formData.category.trim()
    if (!category) {
      setError('Category is required.')
      return
    }

    const qty = Number(formData.quantity)
    if (formData.quantity === '' || isNaN(qty) || qty < 0) {
      setError('Quantity must be a valid non-negative number.')
      return
    }

    if (qty < assignedQty) {
      setError(
        `Total quantity cannot be less than ${assignedQty} (currently assigned to staff). Please return assigned items first.`,
      )
      return
    }

    try {
      onSave(item.id, {
        name,
        category,
        assetId: formData.assetId.trim(),
        quantity: qty,
        unit: formData.unit.trim() || 'Nos',
        location: formData.location.trim() || 'Jaipur Corporate HQ',
        description: formData.description.trim(),
        purchaseDate: formData.purchaseDate || '',
        purchaseCost: formData.purchaseCost ? Number(formData.purchaseCost) : 0,
        vendor: formData.vendor.trim(),
        remarks: formData.remarks.trim(),
      })
    } catch (err) {
      setError(err.message || 'Failed to update inventory item.')
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
              <h2 id={titleId}>Edit Inventory Item</h2>
              <p>Update item specifications, stock count, and location details</p>
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

          <form onSubmit={handleSubmit} id="edit-inventory-form">
            <div className="inv-modal-body">
              {error && (
                <div className="inv-error-box" role="alert">
                  <AlertCircle size={16} />
                  <span>{error}</span>
                </div>
              )}

              <div className="inv-form-row">
                <div className="inv-form-group">
                  <label htmlFor="edit-inv-name">
                    Item Name <span className="required">*</span>
                  </label>
                  <input
                    id="edit-inv-name"
                    type="text"
                    className="inv-form-input"
                    placeholder="e.g. DJI Matrice 300 RTK Drone"
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    autoFocus
                    required
                  />
                </div>

                <div className="inv-form-group">
                  <label htmlFor="edit-inv-category">
                    Category <span className="required">*</span>
                  </label>
                  <select
                    id="edit-inv-category"
                    className="inv-form-select"
                    value={formData.category}
                    onChange={(e) => handleChange('category', e.target.value)}
                    required
                  >
                    {INVENTORY_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="inv-form-row">
                <div className="inv-form-group">
                  <label htmlFor="edit-inv-asset-id">Item ID / Asset ID</label>
                  <input
                    id="edit-inv-asset-id"
                    type="text"
                    className="inv-form-input font-mono"
                    placeholder="e.g. AST-2026-009"
                    value={formData.assetId}
                    onChange={(e) => handleChange('assetId', e.target.value)}
                  />
                </div>

                <div className="inv-form-group">
                  <label htmlFor="edit-inv-location">Warehouse / Site Location</label>
                  <select
                    id="edit-inv-location"
                    className="inv-form-select"
                    value={formData.location}
                    onChange={(e) => handleChange('location', e.target.value)}
                  >
                    {INVENTORY_LOCATIONS.map((loc) => (
                      <option key={loc} value={loc}>
                        {loc}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="inv-form-row">
                <div className="inv-form-group">
                  <label htmlFor="edit-inv-quantity">
                    Total Quantity <span className="required">*</span>
                  </label>
                  <input
                    id="edit-inv-quantity"
                    type="number"
                    min={assignedQty}
                    step="1"
                    className="inv-form-input"
                    value={formData.quantity}
                    onChange={(e) => handleChange('quantity', e.target.value)}
                    required
                  />
                  {assignedQty > 0 && (
                    <span className="text-[11px] text-amber-700">
                      Note: {assignedQty} unit(s) currently checked out. Minimum quantity is {assignedQty}.
                    </span>
                  )}
                </div>

                <div className="inv-form-group">
                  <label htmlFor="edit-inv-unit">Unit of Measure</label>
                  <select
                    id="edit-inv-unit"
                    className="inv-form-select"
                    value={formData.unit}
                    onChange={(e) => handleChange('unit', e.target.value)}
                  >
                    {INVENTORY_UNITS.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="inv-form-group">
                <label htmlFor="edit-inv-description">Description & Specifications</label>
                <textarea
                  id="edit-inv-description"
                  rows={2}
                  className="inv-form-textarea"
                  placeholder="Make, model, serial numbers, calibration date, or accessories included..."
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                />
              </div>

              <div className="inv-form-row">
                <div className="inv-form-group">
                  <label htmlFor="edit-inv-vendor">Supplier / Vendor</label>
                  <input
                    id="edit-inv-vendor"
                    type="text"
                    className="inv-form-input"
                    placeholder="e.g. Trimble India Pvt Ltd"
                    value={formData.vendor}
                    onChange={(e) => handleChange('vendor', e.target.value)}
                  />
                </div>

                <div className="inv-form-group">
                  <label htmlFor="edit-inv-purchase-date">Purchase / Acquisition Date</label>
                  <input
                    id="edit-inv-purchase-date"
                    type="date"
                    className="inv-form-input"
                    value={formData.purchaseDate}
                    onChange={(e) => handleChange('purchaseDate', e.target.value)}
                  />
                </div>
              </div>

              <div className="inv-form-row">
                <div className="inv-form-group">
                  <label htmlFor="edit-inv-cost">Acquisition Cost (₹)</label>
                  <input
                    id="edit-inv-cost"
                    type="number"
                    min="0"
                    step="0.01"
                    className="inv-form-input"
                    placeholder="e.g. 850000"
                    value={formData.purchaseCost}
                    onChange={(e) => handleChange('purchaseCost', e.target.value)}
                  />
                </div>

                <div className="inv-form-group">
                  <label htmlFor="edit-inv-remarks">Internal Remarks</label>
                  <input
                    id="edit-inv-remarks"
                    type="text"
                    className="inv-form-input"
                    placeholder="Warranty, AMC, calibration cycle, storage bin..."
                    value={formData.remarks}
                    onChange={(e) => handleChange('remarks', e.target.value)}
                  />
                </div>
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
                id="btn-save-edit-inventory"
                className="btn btn-primary"
              >
                <Pencil size={15} /> Save Changes
              </button>
            </div>
          </form>
        </div>
      </div>
    </Portal>
  )
}
