import { ClipboardPlus, Pencil } from 'lucide-react'
import { useState } from 'react'
import { useCrm, useMoney } from '../../context/crm'
import { PROJECT_TYPES } from '../../data/mockData'
import { formatDayMonth } from '../../utils/date'

const EMPTY_PROJECT = { title: '', type: '', siteLocation: '', scope: '', technical: '', startDate: '', budget: '', instructions: '' }

function ProjectForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState({ ...EMPTY_PROJECT, ...initial, budget: initial?.budget ? String(initial.budget) : '' })
  const [error, setError] = useState('')
  const set = (key) => (e) => {
    setForm({ ...form, [key]: key === 'budget' ? e.target.value.replace(/[^\d]/g, '') : e.target.value })
    setError('')
  }

  const submit = (e) => {
    e.preventDefault()
    if (!form.title.trim()) return setError('Give the project a title')
    onSave({
      ...form,
      title: form.title.trim(),
      siteLocation: form.siteLocation.trim(),
      scope: form.scope.trim(),
      technical: form.technical.trim(),
      instructions: form.instructions.trim(),
      budget: form.budget ? Number(form.budget) : '',
    })
  }

  return (
    <form className="project-form" onSubmit={submit} noValidate>
      <div className="form-grid">
        <label className={`field field-wide ${error ? 'has-error' : ''}`}>
          <span className="field-label">
            Project title <em aria-hidden="true">*</em>
          </span>
          <input value={form.title} onChange={set('title')} placeholder="Mining plan for Kankroli limestone lease" autoFocus />
          {error && <span className="field-error">{error}</span>}
        </label>
        <label className="field">
          <span className="field-label">Project type</span>
          <select value={form.type} onChange={set('type')}>
            <option value="">Not specified</option>
            {PROJECT_TYPES.map((type) => (
              <option key={type}>{type}</option>
            ))}
          </select>
        </label>
        <label className="field">
          <span className="field-label">Site location / area</span>
          <input value={form.siteLocation} onChange={set('siteLocation')} placeholder="Kankroli, Rajsamand · 4.85 ha" />
        </label>
        <label className="field field-wide">
          <span className="field-label">Scope of work</span>
          <textarea rows={3} value={form.scope} onChange={set('scope')} placeholder="What we'll deliver — surveys, reports, approvals…" />
        </label>
        <label className="field field-wide">
          <span className="field-label">Technical requirements</span>
          <textarea rows={2} value={form.technical} onChange={set('technical')} placeholder="Data the client will share, equipment needed, standards to follow…" />
        </label>
        <label className="field">
          <span className="field-label">Expected start date</span>
          <input type="date" value={form.startDate} onChange={set('startDate')} />
        </label>
        <label className="field">
          <span className="field-label">Client's budget (₹)</span>
          <input value={form.budget} onChange={set('budget')} placeholder="450000" inputMode="numeric" />
        </label>
        <label className="field field-wide">
          <span className="field-label">Special instructions</span>
          <textarea rows={2} value={form.instructions} onChange={set('instructions')} placeholder="Site access, deadlines, government submission dates…" />
        </label>
      </div>
      <div className="inline-form-actions">
        <button type="button" className="btn" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary">
          Save Requirements
        </button>
      </div>
    </form>
  )
}

/* Project scope, site and technical details — usually filled in after the first few conversations. */
export function ProjectRequirements({ lead }) {
  const money = useMoney()
  const { updateLead } = useCrm()
  const [editing, setEditing] = useState(false)
  const project = lead.project

  const save = (next) => {
    updateLead(lead.id, { project: next }, project ? 'Project requirements updated' : 'Project requirements added')
    setEditing(false)
  }

  if (editing) return <ProjectForm initial={project} onSave={save} onCancel={() => setEditing(false)} />

  if (!project) {
    return (
      <div className="empty-panel">
        <ClipboardPlus size={28} strokeWidth={1.6} />
        <p>
          <strong>No project requirements yet</strong>
          <span>Add the site, scope and technical details once the client has shared them.</span>
        </p>
        <button className="btn btn-primary" onClick={() => setEditing(true)}>
          Add project requirements
        </button>
      </div>
    )
  }

  const rows = [
    ['Project type', project.type],
    ['Site location / area', project.siteLocation],
    ['Expected start', project.startDate ? formatDayMonth(project.startDate) : ''],
    ["Client's budget", project.budget ? money.short(project.budget) : ''],
  ]

  return (
    <div className="project-view">
      <div className="panel-head">
        <h3>{project.title}</h3>
        <button className="btn" onClick={() => setEditing(true)}>
          <Pencil size={14} /> Edit
        </button>
      </div>
      <dl className="detail-list">
        {rows.map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{value || <span className="muted">Not set</span>}</dd>
          </div>
        ))}
      </dl>
      {[
        ['Scope of work', project.scope],
        ['Technical requirements', project.technical],
        ['Special instructions', project.instructions],
      ].map(([label, value]) => (
        <div key={label} className="detail-block">
          <h4>{label}</h4>
          <p>{value || <span className="muted">Not set</span>}</p>
        </div>
      ))}
    </div>
  )
}
