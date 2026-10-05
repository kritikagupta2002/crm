import { X } from 'lucide-react'
import { useEffect, useId } from 'react'
import { Portal } from './Portal'

/* A panel from the right for one record (a subcontract, a vendor, an application, a tender). Esc or the backdrop closes it. */
export function SideDrawer({ title, sub, onClose, className = '', children }) {
  const titleId = useId()
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [onClose])
  return (
    <Portal>
      <div className="drawer-root">
        <div className="drawer-backdrop" onClick={onClose} />
        <aside className={`enquiry-drawer wo-drawer ${className}`} role="dialog" aria-modal="true" aria-labelledby={titleId}>
          <header className="drawer-header">
            <div className="lead-drawer-title">
              <h2 id={titleId}>{title}</h2>
              {sub && <span className="muted">{sub}</span>}
            </div>
            <button className="icon-button" onClick={onClose} aria-label="Close">
              <X size={20} />
            </button>
          </header>
          <div className="drawer-body">{children}</div>
        </aside>
      </div>
    </Portal>
  )
}
