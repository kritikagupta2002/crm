import { useState } from 'react'
import { Check, X } from 'lucide-react'
import { useCrm } from '../../../core/permissions/crm'
import { listHasDesc } from '../data/fieldFormats'

/*
 * The small form under a dropdown after "+ Add new…": the new code (and what it means, for lists such
 * as ROCK_CODE that carry one). It joins the list for everyone and is picked straight away.
 */
export function AddOption({ list, codeLabel = 'Code', existing = [], onAdded, onCancel }) {
  const { addFieldCode } = useCrm()
  const withDesc = listHasDesc(list)
  const [code, setCode] = useState('')
  const [desc, setDesc] = useState('')
  const [error, setError] = useState('')

  const add = () => {
    // Already there under another list of names (the geologists): just pick it.
    const same = existing.find((x) => x.toLowerCase() === code.trim().toLowerCase())
    if (same) {
      onAdded({ code: same })
      return
    }
    try {
      const entry = addFieldCode({ list, code, desc })
      onAdded(entry)
    } catch (err) {
      setError(err.message)
    }
  }
  // Enter adds the option here instead of submitting the record form around it.
  const onKey = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      add()
    } else if (e.key === 'Escape') {
      e.stopPropagation()
      onCancel()
    }
  }

  return (
    <div className="ff-addnew" role="group" aria-label="Add a new option">
      <div className={`ff-addnew-inputs${withDesc ? '' : ' single'}`}>
        <input className="fd-input" autoFocus placeholder={codeLabel} value={code} maxLength={60} onChange={(e) => setCode(e.target.value)} onKeyDown={onKey} />
        {withDesc && <input className="fd-input" placeholder="Meaning" value={desc} maxLength={120} onChange={(e) => setDesc(e.target.value)} onKeyDown={onKey} />}
      </div>
      <div className="ff-addnew-actions">
        <button type="button" className="ff-icon ok" title="Add to the list" onClick={add}>
          <Check size={15} />
        </button>
        <button type="button" className="ff-icon" title="Cancel" onClick={onCancel}>
          <X size={15} />
        </button>
      </div>
      {error && <span className="fd-error-msg ff-addnew-error">{error}</span>}
    </div>
  )
}
