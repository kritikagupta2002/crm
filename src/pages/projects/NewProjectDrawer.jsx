import { Building2, ClipboardList, X } from 'lucide-react'
import { useEffect, useId, useRef, useState } from 'react'
import { Portal } from '../../components/common/Portal'
import { useCrm } from '../../context/crm'
import { SERVICE_DETAILS, SERVICES, TODAY } from '../../data/mockData'
import { addDays, toISODate } from '../../utils/date'
import '../../components/enquiry/enquiry.css'

const DURATIONS = [30, 45, 60, 90, 120, 180]

/* New projects run in their own number series, clear of the ones that come from won enquiries. */
function nextProjectId(projects) {
  const year = String(TODAY.getFullYear()).slice(2)
  const used = projects.filter((p) => p.id.startsWith(`PR-${year}-`)).map((p) => Number(p.id.split('-').pop()))
  const n = Math.max(500, ...used.filter((u) => u > 500)) + 1
  return `PR-${year}-${n}`
}

/* Repeat work for a client already on the books: the project starts in Allocation, waiting for a coordinator. */
export function NewProjectDrawer({ clients, projects, onClose, onCreated }) {
  const { createProject } = useCrm()
  const titleId = useId()
  const firstRef = useRef(null)
  const [form, setForm] = useState(() => {
    const client = clients[0]
    return { leadId: client?.id ?? '', service: client?.service ?? SERVICES[0], name: SERVICE_DETAILS[client?.service ?? SERVICES[0]][0], site: client?.location ?? '', startedOn: toISODate(addDays(TODAY, 7)), days: 60 }
  })

  useEffect(() => {
    firstRef.current?.focus()
    const onKey = (event) => event.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = previousOverflow
    }
  }, [onClose])

  const update = (key, value) => {
    const next = { ...form, [key]: value }
    if (key === 'leadId') {
      const client = clients.find((c) => c.id === value)
      Object.assign(next, { service: client.service, name: SERVICE_DETAILS[client.service][0], site: client.location ?? '' })
    }
    if (key === 'service') next.name = SERVICE_DETAILS[value][0]
    setForm(next)
  }

  const client = clients.find((c) => c.id === form.leadId)
  const earlier = projects.filter((p) => p.leadId === form.leadId)

  return (
    <Portal>
      <div className="drawer-root">
        <div className="drawer-backdrop" onClick={onClose} />
        <aside className="enquiry-drawer" role="dialog" aria-modal="true" aria-labelledby={titleId}>
          <header className="drawer-header">
            <h2 id={titleId}>New Project</h2>
            <button className="icon-button" onClick={onClose} aria-label="Close">
              <X size={22} />
            </button>
          </header>

          <form
            className="drawer-form"
            onSubmit={(e) => {
              e.preventDefault()
              const id = nextProjectId(projects)
              createProject(form.leadId, { id, name: form.name, service: form.service, site: form.site.trim() || client.location, startedOn: form.startedOn, days: Number(form.days) })
              onCreated(id)
            }}
          >
            <div className="drawer-body">
              <fieldset className="form-section">
                <legend>
                  <Building2 size={18} /> Client
                </legend>
                <div className="form-grid">
                  <label className="field field-wide">
                    <span className="field-label">
                      Client<em aria-hidden="true"> *</em>
                    </span>
                    <select ref={firstRef} value={form.leadId} onChange={(e) => update('leadId', e.target.value)} required>
                      {clients.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.company} — {c.location ?? c.id}
                        </option>
                      ))}
                    </select>
                    {client && (
                      <span className="field-hint">
                        {earlier.length} project{earlier.length === 1 ? '' : 's'} so far · {client.contactPerson}
                      </span>
                    )}
                  </label>
                </div>
              </fieldset>

              <fieldset className="form-section">
                <legend>
                  <ClipboardList size={18} /> Project
                </legend>
                <div className="form-grid">
                  <label className="field">
                    <span className="field-label">Service line</span>
                    <select value={form.service} onChange={(e) => update('service', e.target.value)}>
                      {SERVICES.map((s) => (
                        <option key={s}>{s}</option>
                      ))}
                    </select>
                  </label>
                  <label className="field">
                    <span className="field-label">Work</span>
                    <select value={form.name} onChange={(e) => update('name', e.target.value)}>
                      {SERVICE_DETAILS[form.service].map((d) => (
                        <option key={d}>{d}</option>
                      ))}
                    </select>
                  </label>
                  <label className="field field-wide">
                    <span className="field-label">Site</span>
                    <input value={form.site} onChange={(e) => update('site', e.target.value)} placeholder="Village, district, state" />
                  </label>
                  <label className="field">
                    <span className="field-label">Planned start</span>
                    <input type="date" value={form.startedOn} onChange={(e) => update('startedOn', e.target.value)} required />
                  </label>
                  <label className="field">
                    <span className="field-label">Time to submission</span>
                    <select value={form.days} onChange={(e) => update('days', e.target.value)}>
                      {DURATIONS.map((d) => (
                        <option key={d} value={d}>
                          {d} days
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <p className="field-hint">The project opens in Allocation: pick its coordinator next, then the team.</p>
              </fieldset>
            </div>
            <footer className="drawer-footer">
              <button type="button" className="btn" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={!form.leadId}>
                Create project
              </button>
            </footer>
          </form>
        </aside>
      </div>
    </Portal>
  )
}
