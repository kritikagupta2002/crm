import { MoreHorizontal } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Portal } from './Portal'

const MENU_GAP = 4

/*
 * "⋯" button with a small menu. items: [{ label, icon, onSelect, tone?: 'good' | 'danger' }].
 * The menu is fixed-positioned next to the button so scrolling table wrappers can't clip it,
 * and it opens upwards when there isn't room below. Clicks inside don't bubble, so it can sit in a clickable row.
 */
export function ActionMenu({ label, items }) {
  const [position, setPosition] = useState(null) // null = closed
  const ref = useRef(null)
  const buttonRef = useRef(null)

  const toggle = () => {
    if (position) return setPosition(null)
    const rect = buttonRef.current.getBoundingClientRect()
    const menuHeight = items.length * 36 + 12
    const openUp = rect.bottom + menuHeight + MENU_GAP > window.innerHeight
    setPosition({
      right: window.innerWidth - rect.right,
      ...(openUp ? { top: 'auto', bottom: window.innerHeight - rect.top + MENU_GAP } : { top: rect.bottom + MENU_GAP }),
    })
  }

  useEffect(() => {
    if (!position) return
    const close = () => setPosition(null)
    const onDown = (event) => !ref.current?.contains(event.target) && close()
    const onKey = (event) => event.key === 'Escape' && close()
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    window.addEventListener('scroll', close, true)
    window.addEventListener('resize', close)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
      window.removeEventListener('scroll', close, true)
      window.removeEventListener('resize', close)
    }
  }, [position])

  return (
    <div className="row-menu" ref={ref} onClick={(e) => e.stopPropagation()}>
      <button ref={buttonRef} className="icon-button small" aria-label={label} aria-haspopup="menu" aria-expanded={Boolean(position)} onClick={toggle}>
        <MoreHorizontal size={16} />
      </button>
      {position && (
        <Portal>
          <div className="row-menu-list is-floating" role="menu" style={position} onClick={(e) => e.stopPropagation()}>
            {items.map(({ label: itemLabel, icon: Icon, onSelect, tone }) => (
              <button
                key={itemLabel}
                role="menuitem"
                className={tone ? `menu-${tone}` : undefined}
                onClick={() => {
                  setPosition(null)
                  onSelect()
                }}
              >
                <Icon size={15} /> {itemLabel}
              </button>
            ))}
          </div>
        </Portal>
      )}
    </div>
  )
}
