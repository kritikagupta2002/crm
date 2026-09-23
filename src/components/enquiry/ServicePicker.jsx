import { Plus, X } from 'lucide-react'
import { SERVICE_DETAILS, SERVICES } from '../../data/mockData'
import { newService } from '../../utils/leads'

/*
 * One or more services for an enquiry: the service area, then the service within it. Clients often need
 * several together (a mine plan with the environment clearance), so another row can be added.
 * labels: [area label, service label].
 */
export function ServicePicker({ value, onChange, labels = ['Service area', 'Service needed'], required = false }) {
  const set = (index, key, next) =>
    onChange(value.map((row, i) => (i !== index ? row : key === 'service' ? newService(next) : { ...row, serviceDetail: next })))
  // A service already picked in another row isn't offered twice.
  const taken = (index) => new Set(value.filter((_, i) => i !== index).map((r) => r.serviceDetail))
  const firstFree = () => {
    for (const service of SERVICES) {
      const detail = SERVICE_DETAILS[service].find((d) => !value.some((r) => r.serviceDetail === d))
      if (detail) return { service, serviceDetail: detail }
    }
    return newService()
  }

  return (
    <div className="service-picker">
      {value.map((row, index) => (
        <div key={index} className="service-row">
          <label className="field">
            <span className="field-label">
              {index === 0 ? labels[0] : `${labels[0]} ${index + 1}`}
              {required && <em aria-hidden="true"> *</em>}
            </span>
            <select value={row.service} onChange={(e) => set(index, 'service', e.target.value)}>
              {SERVICES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </label>
          <label className="field">
            <span className="field-label">
              {labels[1]}
              {required && <em aria-hidden="true"> *</em>}
            </span>
            <select value={row.serviceDetail} onChange={(e) => set(index, 'serviceDetail', e.target.value)}>
              {SERVICE_DETAILS[row.service].map((d) => (
                <option key={d} disabled={taken(index).has(d)}>
                  {d}
                </option>
              ))}
            </select>
          </label>
          {value.length > 1 && (
            <button type="button" className="icon-button small service-remove" onClick={() => onChange(value.filter((_, i) => i !== index))} aria-label={`Remove ${row.serviceDetail}`}>
              <X size={15} />
            </button>
          )}
        </div>
      ))}
      {value.length < 4 && (
        <button type="button" className="link-button service-add" onClick={() => onChange([...value, firstFree()])}>
          <Plus size={14} /> Add another service
        </button>
      )}
    </div>
  )
}
