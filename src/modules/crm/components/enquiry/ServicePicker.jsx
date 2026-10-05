import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import { useAccess, useCrm } from '../../../../core/permissions/crm'
import { DEFAULT_SERVICES, DEFAULT_SERVICE_CATEGORIES } from '../../data/masters'
import { AddCategoryModal, AddServiceModal } from './MasterModals'

/*
 * Dynamic ServicePicker
 * Supports data-driven Categories and Services (filtered by Category).
 * Preserves multi-service rows (up to 4 services).
 * Authorized administrative roles can use "+ Add Service Category" and "+ Add Service".
 * Shows proper empty state if a category has no services.
 */
export function ServicePicker({
  value,
  onChange,
  labels = ['Service category', 'Service required'],
  required = false,
  allowAdd = true,
}) {
  const crm = useCrm()
  const access = useAccess()
  const canManageMasters = allowAdd && Boolean(access?.may?.('masters'))

  const serviceCategories = crm.serviceCategories?.length ? crm.serviceCategories : DEFAULT_SERVICE_CATEGORIES
  const services = crm.services?.length ? crm.services : DEFAULT_SERVICES

  const [activeCategoryModalRow, setActiveCategoryModalRow] = useState(null)
  const [activeServiceModalCategory, setActiveServiceModalCategory] = useState(null)

  // Active categories
  const activeCategories = serviceCategories.filter((c) => c.status !== 'Inactive')

  // Find active services belonging to a category
  const servicesForCategory = (catName) => {
    if (!catName) return []
    return services.filter(
      (s) => s.category.toLowerCase() === catName.toLowerCase() && s.status !== 'Inactive',
    )
  }

  const setRow = (index, key, next) => {
    onChange(
      value.map((row, i) => {
        if (i !== index) return row
        if (key === 'service') {
          // Changed category -> select the first active service for this category, or empty
          const avail = servicesForCategory(next)
          return { service: next, serviceDetail: avail[0]?.name || '' }
        }
        return { ...row, [key]: next }
      }),
    )
  }

  // Set of services already selected in OTHER rows
  const taken = (index) => new Set(value.filter((_, i) => i !== index).map((r) => r.serviceDetail))

  const handleAddAnother = () => {
    // Find the first category with a free, unpicked service
    for (const cat of activeCategories) {
      const avail = servicesForCategory(cat.name)
      const free = avail.find((s) => !value.some((r) => r.serviceDetail === s.name))
      if (free) {
        onChange([...value, { service: cat.name, serviceDetail: free.name }])
        return
      }
    }
    // Fallback: pick the first category and its first service
    const firstCat = activeCategories[0]?.name || ''
    const avail = servicesForCategory(firstCat)
    onChange([...value, { service: firstCat, serviceDetail: avail[0]?.name || '' }])
  }

  return (
    <div className="service-picker">
      {value.map((row, index) => {
        const availableServices = servicesForCategory(row.service)
        return (
          <div key={index} className="service-row-container">
            <div className="service-row">
              <label className="field">
                <span className="field-label-row">
                  <span className="field-label">
                    {index === 0 ? labels[0] : `${labels[0]} ${index + 1}`}
                    {required && <em aria-hidden="true"> *</em>}
                  </span>
                  {canManageMasters && (
                    <button
                      type="button"
                      className="master-add-btn"
                      onClick={() => setActiveCategoryModalRow(index)}
                      title="Add a new service category"
                    >
                      <Plus size={12} /> Add Category
                    </button>
                  )}
                </span>
                <select
                  value={row.service}
                  onChange={(e) => setRow(index, 'service', e.target.value)}
                  className="service-category-select"
                >
                  {activeCategories.map((c) => (
                    <option key={c.id || c.name} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </label>

              <div className="field">
                <div className="field-label-row">
                  <span className="field-label">
                    {labels[1]}
                    {required && <em aria-hidden="true"> *</em>}
                  </span>
                  {canManageMasters && (
                    <button
                      type="button"
                      className="master-add-btn"
                      onClick={() => setActiveServiceModalCategory({ category: row.service, rowIndex: index })}
                      title="Add a new service under this category"
                    >
                      <Plus size={12} /> Add Service
                    </button>
                  )}
                </div>
                {availableServices.length > 0 ? (
                  <select
                    value={row.serviceDetail}
                    onChange={(e) => setRow(index, 'serviceDetail', e.target.value)}
                    className="service-detail-select"
                  >
                    {availableServices.map((d) => (
                      <option key={d.id || d.name} value={d.name} disabled={taken(index).has(d.name)}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="empty-master-state">No services available for this category</div>
                )}
              </div>

              {value.length > 1 && (
                <button
                  type="button"
                  className="icon-button small service-remove"
                  onClick={() => onChange(value.filter((_, i) => i !== index))}
                  aria-label={`Remove ${row.serviceDetail || row.service}`}
                >
                  <X size={15} />
                </button>
              )}
            </div>
          </div>
        )
      })}

      {value.length < 4 && (
        <button type="button" className="link-button service-add" onClick={handleAddAnother}>
          <Plus size={14} /> Add another service
        </button>
      )}

      {activeCategoryModalRow !== null && (
        <AddCategoryModal
          onClose={() => setActiveCategoryModalRow(null)}
          onSaved={(newCat) => {
            setRow(activeCategoryModalRow, 'service', newCat.name)
          }}
        />
      )}

      {activeServiceModalCategory !== null && (
        <AddServiceModal
          initialCategory={activeServiceModalCategory.category}
          onClose={() => setActiveServiceModalCategory(null)}
          onSaved={(newSrv) => {
            const idx = activeServiceModalCategory.rowIndex
            if (value[idx]?.service.toLowerCase() === newSrv.category.toLowerCase()) {
              setRow(idx, 'serviceDetail', newSrv.name)
            } else {
              onChange(
                value.map((r, i) => (i === idx ? { service: newSrv.category, serviceDetail: newSrv.name } : r)),
              )
            }
          }}
        />
      )}
    </div>
  )
}
