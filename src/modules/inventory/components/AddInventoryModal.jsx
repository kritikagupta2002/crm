import { useState, useEffect, useId } from 'react'
import { AlertCircle, Plus, X } from 'lucide-react'
import { Portal } from '../../../shared/components/Portal'
import {
  INVENTORY_CATEGORIES,
  INVENTORY_LOCATIONS,
  INVENTORY_UNITS,
} from '../data/inventory'

export function AddInventoryModal({ onClose, onSave }) {
  const titleId = useId()

  const [formData, setFormData] = useState({
    name: '',
    category: INVENTORY_CATEGORIES[0] || 'Tools',
    assetId: '',
    quantity: '1',
    unit: 'Nos',
    location: INVENTORY_LOCATIONS[0] || 'Jaipur Corporate HQ',
    description: '',
    purchaseDate: '',
    purchaseCost: '',
    vendor: '',
    remarks: '',
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
    if (formData.quantity === '' || isNaN(qty) || qty <= 0) {
      setError('Quantity must be a valid positive number.')
      return
    }

    try {
      onSave({
        ...formData,
        name,
        category,
        quantity: qty,
        assetId: formData.assetId.trim(),
      })
    } catch (err) {
      setError(err.message || 'Failed to save inventory item.')
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
              <h2 id={titleId}>+ Add Inventory Item</h2>
              <p>Create a new stock record in the Bansal Geo inventory master</p>
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

          <form onSubmit={handleSubmit} id="add-inventory-form">
            <div className="inv-modal-body">
              {error && (
                <div className="inv-error-box" role="alert">
                  <AlertCircle size={16} />
                  <span>{error}</span>
                </div>
              )}

              <div className="inv-form-row">
                <div className="inv-form-group">
                  <label htmlFor="inv-name">
                    Item Name <span className="required">*</span>
                  </label>
                  <input
                    id="inv-name"
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
                  <label htmlFor="inv-category">
                    Category <span className="required">*</span>
                  </label>
                  <select
                    id="inv-category"
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
                  <label htmlFor="inv-asset-id">Item ID / Asset ID (Optional)</label>
                  <input
                    id="inv-asset-id"
                    type="text"
                    className="inv-form-input"
                    placeholder="Auto-generated if left blank (e.g. AST-2026-009)"
                    value={formData.assetId}
                    onChange={(e) => handleChange('assetId', e.target.value)}
                  />
                </div>

                <div className="inv-form-group">
                  <label htmlFor="inv-location">Stock Location</label>
                  <select
                    id="inv-location"
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
                  <label htmlFor="inv-quantity">
                    Total Quantity <span className="required">*</span>
                  </label>
                  <input
                    id="inv-quantity"
                    type="number"
                    min="1"
                    step="1"
                    className="inv-form-input"
                    placeholder="e.g. 5"
                    value={formData.quantity}
                    onChange={(e) => handleChange('quantity', e.target.value)}
                    required
                  />
                </div>

                <div className="inv-form-group">
                  <label htmlFor="inv-unit">Unit of Measure</label>
                  <select
                    id="inv-unit"
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
                <label htmlFor="inv-description">Description / Technical Specs</label>
                <textarea
                  id="inv-description"
                  rows={2}
                  className="inv-form-textarea"
                  placeholder="Key technical specifications, make, model or storage requirements…"
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                />
              </div>

              <div className="inv-form-row">
                <div className="inv-form-group">
                  <label htmlFor="inv-purchase-date">Purchase Date</label>
                  <input
                    id="inv-purchase-date"
                    type="date"
                    className="inv-form-input"
                    value={formData.purchaseDate}
                    onChange={(e) => handleChange('purchaseDate', e.target.value)}
                  />
                </div>

                <div className="inv-form-group">
                  <label htmlFor="inv-purchase-cost">Acquisition Cost (₹)</label>
                  <input
                    id="inv-purchase-cost"
                    type="number"
                    min="0"
                    className="inv-form-input"
                    placeholder="e.g. 85000"
                    value={formData.purchaseCost}
                    onChange={(e) => handleChange('purchaseCost', e.target.value)}
                  />
                </div>
              </div>

              <div className="inv-form-row">
                <div className="inv-form-group">
                  <label htmlFor="inv-vendor">Vendor / Supplier</label>
                  <input
                    id="inv-vendor"
                    type="text"
                    className="inv-form-input"
                    placeholder="e.g. Trimble Geospatial India"
                    value={formData.vendor}
                    onChange={(e) => handleChange('vendor', e.target.value)}
                  />
                </div>

                <div className="inv-form-group">
                  <label htmlFor="inv-remarks">Remarks</label>
                  <input
                    id="inv-remarks"
                    type="text"
                    className="inv-form-input"
                    placeholder="Condition notes, calibration status, etc."
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
                id="btn-save-inventory-item"
                className="btn btn-primary"
              >
                <Plus size={16} /> Save Inventory Item
              </button>
            </div>
          </form>
        </div>
      </div>
    </Portal>
  )
}
