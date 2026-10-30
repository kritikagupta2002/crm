import { useState } from 'react'
import { useCrm } from '../../../core/permissions/crm'
import { FIELD_MEMBERS } from '../../erm/data/staff'
import { codeList } from '../data/fieldFormats'
import { ADD_NEW, heading } from '../utils/formatRows'
import { AddOption } from './AddOption'
import './fieldFormats.css'

/* The client's sheets hold at most 254 characters in a cell (their note on the CODES sheet). */
const MAX_TEXT = 254

const descOptions = (listKey) => [...new Set(codeList(listKey).map((c) => c.desc).filter(Boolean))]

/* The team who record field data: the field members, the senior geologists and anyone added from the dropdown. */
const TEAM = [...FIELD_MEMBERS.map((m) => m.name), 'Dr. Sunita Meena', 'Kavita Rawat']
const geologistNames = (...current) => [...new Set([...current, ...TEAM, ...codeList('GEOLOGIST').map((g) => g.code)].filter(Boolean))]

/* The GEOLOGIST dropdown, in the header or on a row; "+ Add new…" adds a name for everyone. An Employee records as themselves. */
export function GeologistSelect({ id, value, onChange, error }) {
  const { role } = useCrm()
  const [adding, setAdding] = useState(false)
  const names = geologistNames(value)
  if (role === 'Employee') return <input id={id} className="fd-input" value={value ?? ''} readOnly />
  return (
    <>
      <select id={id} className={`fd-select${error ? ' has-error' : ''}`} value={value ?? ''} onChange={(e) => (e.target.value === ADD_NEW ? setAdding(true) : onChange(e.target.value))}>
        <option value="">—</option>
        {names.map((n) => (
          <option key={n}>{n}</option>
        ))}
        <option value={ADD_NEW}>+ Add new…</option>
      </select>
      {adding && (
        <AddOption
          list="GEOLOGIST"
          codeLabel="Full name"
          existing={names}
          onCancel={() => setAdding(false)}
          onAdded={(entry) => {
            setAdding(false)
            onChange(entry.code)
          }}
        />
      )}
    </>
  )
}

/* One input of a format: a code picker, a description picker, a number, date, time or text. In the grid
   (compact) a long text is one line and a picked code shows its meaning on hover. */
export function FormatInput({ fld, value, onChange, error, readOnly, compact, idPrefix = 'ff' }) {
  const id = `${idPrefix}-${fld.id}`.replace(/[^a-zA-Z0-9_-]/g, '_')
  const cls = `fd-input${error ? ' has-error' : ''}`
  if (fld.calc || readOnly) {
    return <output id={id} className="ff-calc">{value === '' || value == null ? '—' : value}</output>
  }
  if (fld.bind === 'geologist') return <GeologistSelect id={id} value={value} onChange={onChange} error={error} />
  if (fld.type === 'code' || fld.type === 'desc') {
    return <CodeSelect id={id} fld={fld} value={value} onChange={onChange} error={error} compact={compact} />
  }
  if (fld.type === 'textarea' && !compact) {
    return <textarea id={id} className={`fd-textarea${error ? ' has-error' : ''}`} rows={2} maxLength={MAX_TEXT} value={value ?? ''} onChange={(e) => onChange(e.target.value)} />
  }
  const type = { number: 'number', date: 'date', time: 'time' }[fld.type] ?? 'text'
  return (
    <input
      id={id}
      type={type}
      step={type === 'number' ? 'any' : undefined}
      inputMode={type === 'number' ? 'decimal' : undefined}
      maxLength={type === 'text' ? MAX_TEXT : undefined}
      className={cls}
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value)}
    />
  )
}

/*
 * A dropdown of a code list (or of its descriptions). The last entry, "+ Add new…", opens a small form
 * to add an option that is missing; it joins the list and is picked.
 */
function CodeSelect({ id, fld, value, onChange, error, compact }) {
  const [adding, setAdding] = useState(false)
  const options =
    fld.type === 'code'
      ? codeList(fld.list).map((c) => ({ key: `${c.code}-${c.desc ?? ''}`, value: c.code, text: c.desc ? `${c.code} · ${c.desc}` : c.code, title: c.addedBy ? `Added by ${c.addedBy}` : c.note }))
      : descOptions(fld.list).map((d) => ({ key: d, value: d, text: d }))
  return (
    <>
      <select
        id={id}
        className={`fd-select${error ? ' has-error' : ''}`}
        title={compact ? options.find((o) => o.value === value)?.text : undefined}
        value={value ?? ''}
        onChange={(e) => (e.target.value === ADD_NEW ? setAdding(true) : onChange(e.target.value))}
      >
        <option value="">—</option>
        {options.map((o) => (
          <option key={o.key} value={o.value} title={o.title}>
            {o.text}
          </option>
        ))}
        <option value={ADD_NEW}>+ Add new…</option>
      </select>
      {adding && (
        <AddOption
          list={fld.list}
          onCancel={() => setAdding(false)}
          onAdded={(entry) => {
            setAdding(false)
            onChange(fld.type === 'desc' ? entry.desc ?? entry.code : entry.code)
          }}
        />
      )}
    </>
  )
}

/* One field under the client's heading, with its input. */
export function FormatField({ fld, value, onChange, error, idPrefix, children }) {
  return (
    <div className={`fd-field${fld.type === 'textarea' ? ' ff-wide' : ''}`}>
      <label className="fd-label" htmlFor={`${idPrefix ?? 'ff'}-${fld.id}`.replace(/[^a-zA-Z0-9_-]/g, '_')}>
        {heading(fld)}
        {fld.required && <span className="fd-required">*</span>}
        {fld.calc && <span className="ff-auto">auto</span>}
      </label>
      {children ?? <FormatInput fld={fld} value={value} onChange={onChange} error={error} idPrefix={idPrefix} />}
      {error && <span className="fd-error-msg">{error}</span>}
    </div>
  )
}
