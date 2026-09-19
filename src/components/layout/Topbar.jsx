import { Bell, ChevronDown, Menu, Search } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { useCrm } from '../../context/crm'
import { CURRENT_USER } from '../../data/mockData'
import { countFollowUpsDue } from '../../utils/dashboardStats'

export function Topbar({ onMenuClick }) {
  const { followUps } = useCrm()
  const overdue = countFollowUpsDue(followUps).overdue
  const searchRef = useRef(null)

  // "/" jumps to search, unless the user is already typing somewhere.
  useEffect(() => {
    const onKey = (event) => {
      const typing = ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)
      if (event.key === '/' && !typing) {
        event.preventDefault()
        searchRef.current?.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  return (
    <header className="topbar">
      <button className="icon-button" onClick={onMenuClick} aria-label="Toggle menu">
        <Menu size={20} />
      </button>

      <label className="search">
        <Search size={16} className="muted" />
        <span className="sr-only">Search</span>
        <input ref={searchRef} type="search" placeholder="Search clients, enquiries, quotations" />
        <kbd>/</kbd>
      </label>

      <div className="topbar-right">
        <button className="icon-button bell" aria-label={overdue > 0 ? `Notifications: ${overdue} overdue follow-ups` : 'Notifications'}>
          <Bell size={19} />
          {overdue > 0 && <span className="bell-dot" />}
        </button>

        <button className="user-chip">
          <span className="avatar">{CURRENT_USER.initials}</span>
          <span className="user-meta">
            <strong>{CURRENT_USER.name}</strong>
            <span>{CURRENT_USER.team}</span>
          </span>
          <ChevronDown size={16} className="muted" />
        </button>
      </div>
    </header>
  )
}
