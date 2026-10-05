import { useEffect, useId, useRef, useState } from 'react'
import { X } from 'lucide-react'
import { Portal } from '../../../../shared/components/Portal'
import { useCrm } from '../../../../core/permissions/crm'

/*
 * Modal dialog for adding a new Service Category
 */
export function AddCategoryModal({ onClose, onSaved }) {
  const { addServiceCategory } = useCrm()
  const [name, setName] = useState('')
  const [status, setStatus] = useState('Active')
  const [error, setError] = useState('')
  const inputRef = useRef(null)
  const titleId = useId()

  useEffect(() => {
    inputRef.current?.focus()
    const onKey = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const handleSubmit = (e) => {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) {
      setError('Category name is required')
      inputRef.current?.focus()
      return
    }
    try {
      const created = addServiceCategory({ name: trimmed, status })
      onSaved?.(created)
      onClose()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <Portal>
      <div className="dialog-root">
        <div className="dialog-backdrop" onClick={onClose} />
        <div className="dialog master-modal" role="dialog" aria-modal="true" aria-labelledby={titleId}>
          <div className="dialog-header">
            <div>
              <h2 id={titleId}>Add Service Category</h2>
              <p className="dialog-subtitle">Create a new service area for client enquiries and projects.</p>
            </div>
            <button type="button" className="modal-close-btn" onClick={onClose} aria-label="Close dialog">
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleSubmit} noValidate>
            <div className="dialog-body">
              <label className={`field ${error ? 'has-error' : ''}`}>
                <span className="field-label">
                  Category Name <em aria-hidden="true">*</em>
                </span>
                <input
                  ref={inputRef}
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value)
                    setError('')
                  }}
                  placeholder="e.g. Geotechnical Engineering"
                  autoFocus
                />
                {error && <span className="field-error">{error}</span>}
              </label>

              <div className="field">
                <span className="field-label">Status</span>
                <div className="choice-chips">
                  <label className={`choice-chip ${status === 'Active' ? 'is-selected' : ''}`}>
                    <input
                      type="radio"
                      name="category-status"
                      value="Active"
                      checked={status === 'Active'}
                      onChange={() => setStatus('Active')}
                    />
                    <i aria-hidden="true" style={{ background: 'var(--green)' }} />
                    Active
                  </label>
                  <label className={`choice-chip ${status === 'Inactive' ? 'is-selected' : ''}`}>
                    <input
                      type="radio"
                      name="category-status"
                      value="Inactive"
                      checked={status === 'Inactive'}
                      onChange={() => setStatus('Inactive')}
                    />
                    <i aria-hidden="true" style={{ background: 'var(--ink-3)' }} />
                    Inactive
                  </label>
                </div>
              </div>
            </div>

            <div className="dialog-actions">
              <button type="button" className="btn" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                Save Category
              </button>
            </div>
          </form>
        </div>
      </div>
    </Portal>
  )
}

/*
 * Modal dialog for adding a new Service under a Category
 */
export function AddServiceModal({ initialCategory, onClose, onSaved }) {
  const { serviceCategories, addService } = useCrm()
  const [category, setCategory] = useState(initialCategory || serviceCategories[0]?.name || '')
  const [name, setName] = useState('')
  const [status, setStatus] = useState('Active')
  const [error, setError] = useState('')
  const inputRef = useRef(null)
  const titleId = useId()

  useEffect(() => {
    inputRef.current?.focus()
    const onKey = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const handleSubmit = (e) => {
    e.preventDefault()
    const trimmedCat = category.trim()
    const trimmedName = name.trim()

    if (!trimmedCat) {
      setError('Please select or specify a category')
      return
    }
    if (!trimmedName) {
      setError('Service name is required')
      inputRef.current?.focus()
      return
    }

    try {
      const created = addService({ category: trimmedCat, name: trimmedName, status })
      onSaved?.(created)
      onClose()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <Portal>
      <div className="dialog-root">
        <div className="dialog-backdrop" onClick={onClose} />
        <div className="dialog master-modal" role="dialog" aria-modal="true" aria-labelledby={titleId}>
          <div className="dialog-header">
            <div>
              <h2 id={titleId}>Add Service</h2>
              <p className="dialog-subtitle">Add a specific service under a category.</p>
            </div>
            <button type="button" className="modal-close-btn" onClick={onClose} aria-label="Close dialog">
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleSubmit} noValidate>
            <div className="dialog-body">
              <label className="field">
                <span className="field-label">
                  Service Category <em aria-hidden="true">*</em>
                </span>
                <select value={category} onChange={(e) => setCategory(e.target.value)}>
                  {serviceCategories.map((cat) => (
                    <option key={cat.id || cat.name} value={cat.name}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className={`field ${error ? 'has-error' : ''}`}>
                <span className="field-label">
                  Service Name <em aria-hidden="true">*</em>
                </span>
                <input
                  ref={inputRef}
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value)
                    setError('')
                  }}
                  placeholder="e.g. Slope Stability Analysis"
                  autoFocus
                />
                {error && <span className="field-error">{error}</span>}
              </label>

              <div className="field">
                <span className="field-label">Status</span>
                <div className="choice-chips">
                  <label className={`choice-chip ${status === 'Active' ? 'is-selected' : ''}`}>
                    <input
                      type="radio"
                      name="service-status"
                      value="Active"
                      checked={status === 'Active'}
                      onChange={() => setStatus('Active')}
                    />
                    <i aria-hidden="true" style={{ background: 'var(--green)' }} />
                    Active
                  </label>
                  <label className={`choice-chip ${status === 'Inactive' ? 'is-selected' : ''}`}>
                    <input
                      type="radio"
                      name="service-status"
                      value="Inactive"
                      checked={status === 'Inactive'}
                      onChange={() => setStatus('Inactive')}
                    />
                    <i aria-hidden="true" style={{ background: 'var(--ink-3)' }} />
                    Inactive
                  </label>
                </div>
              </div>
            </div>

            <div className="dialog-actions">
              <button type="button" className="btn" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                Save Service
              </button>
            </div>
          </form>
        </div>
      </div>
    </Portal>
  )
}

/*
 * Modal dialog for adding a new Mineral
 */
export function AddMineralModal({ onClose, onSaved }) {
  const { addMineral } = useCrm()
  const [name, setName] = useState('')
  const [status, setStatus] = useState('Active')
  const [error, setError] = useState('')
  const inputRef = useRef(null)
  const titleId = useId()

  useEffect(() => {
    inputRef.current?.focus()
    const onKey = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const handleSubmit = (e) => {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) {
      setError('Mineral name is required')
      inputRef.current?.focus()
      return
    }

    try {
      const created = addMineral({ name: trimmed, status })
      onSaved?.(created)
      onClose()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <Portal>
      <div className="dialog-root">
        <div className="dialog-backdrop" onClick={onClose} />
        <div className="dialog master-modal" role="dialog" aria-modal="true" aria-labelledby={titleId}>
          <div className="dialog-header">
            <div>
              <h2 id={titleId}>Add Mineral</h2>
              <p className="dialog-subtitle">Add a new mineral to the CRM Mineral Master.</p>
            </div>
            <button type="button" className="modal-close-btn" onClick={onClose} aria-label="Close dialog">
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleSubmit} noValidate>
            <div className="dialog-body">
              <label className={`field ${error ? 'has-error' : ''}`}>
                <span className="field-label">
                  Mineral Name <em aria-hidden="true">*</em>
                </span>
                <input
                  ref={inputRef}
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value)
                    setError('')
                  }}
                  placeholder="e.g. Lithium, Potash, Cobalt"
                  autoFocus
                />
                {error && <span className="field-error">{error}</span>}
              </label>

              <div className="field">
                <span className="field-label">Status</span>
                <div className="choice-chips">
                  <label className={`choice-chip ${status === 'Active' ? 'is-selected' : ''}`}>
                    <input
                      type="radio"
                      name="mineral-status"
                      value="Active"
                      checked={status === 'Active'}
                      onChange={() => setStatus('Active')}
                    />
                    <i aria-hidden="true" style={{ background: 'var(--green)' }} />
                    Active
                  </label>
                  <label className={`choice-chip ${status === 'Inactive' ? 'is-selected' : ''}`}>
                    <input
                      type="radio"
                      name="mineral-status"
                      value="Inactive"
                      checked={status === 'Inactive'}
                      onChange={() => setStatus('Inactive')}
                    />
                    <i aria-hidden="true" style={{ background: 'var(--ink-3)' }} />
                    Inactive
                  </label>
                </div>
              </div>
            </div>

            <div className="dialog-actions">
              <button type="button" className="btn" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                Save Mineral
              </button>
            </div>
          </form>
        </div>
      </div>
    </Portal>
  )
}
