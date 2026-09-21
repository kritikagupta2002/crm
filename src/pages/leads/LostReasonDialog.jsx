import { useEffect, useId, useRef, useState } from 'react'
import { LOST_REASONS } from '../../data/mockData'
import { Portal } from '../../components/common/Portal'

/* Asks why a lead was lost before marking it — the reason feeds lost-deal reporting later. */
export function LostReasonDialog({ company, onConfirm, onCancel }) {
  const [reason, setReason] = useState(LOST_REASONS[0])
  const titleId = useId()
  const firstRef = useRef(null)

  useEffect(() => {
    firstRef.current?.focus()
    const onKey = (event) => event.key === 'Escape' && onCancel()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onCancel])

  return (
    <Portal>
      <div className="dialog-root">
        <div className="drawer-backdrop" onClick={onCancel} />
        <div className="dialog" role="dialog" aria-modal="true" aria-labelledby={titleId}>
          <h2 id={titleId}>Mark as Lost</h2>
          <p className="muted">Why didn't {company} go ahead?</p>
          <div className="reason-list">
            {LOST_REASONS.map((option, index) => (
              <label key={option} className={`reason ${reason === option ? 'is-selected' : ''}`}>
                <input ref={index === 0 ? firstRef : undefined} type="radio" name="lost-reason" checked={reason === option} onChange={() => setReason(option)} />
                {option}
              </label>
            ))}
          </div>
          <div className="dialog-actions">
            <button className="btn" onClick={onCancel}>
              Cancel
            </button>
            <button className="btn btn-danger" onClick={() => onConfirm(reason)}>
              Mark as Lost
            </button>
          </div>
        </div>
      </div>
    </Portal>
  )
}
