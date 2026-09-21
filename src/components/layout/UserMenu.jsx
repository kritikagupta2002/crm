import { Check, ChevronDown, LogOut, RotateCcw, Settings } from 'lucide-react'
import { Link } from 'react-router-dom'
import { ROLES, useCrm } from '../../context/crm'
import { CURRENT_USER } from '../../data/mockData'
import { usePopover } from '../common/usePopover'

const ROLE_NOTES = {
  Admin: 'Sees everything',
  Sales: 'Leads, quotations and clients',
  Coordinator: 'Amounts hidden, no quotations',
  Accountant: 'Quotations and approvals',
}

/* Profile menu. "View as" lets the demo show role-based access (e.g. Coordinators don't see amounts). */
export function UserMenu() {
  const { role, setRole, changeCount, resetDemoData, signOut } = useCrm()
  const { open, setOpen, ref } = usePopover()

  return (
    <div className="popover-wrap" ref={ref}>
      <button className="user-chip" onClick={() => setOpen(!open)} aria-expanded={open} aria-haspopup="menu">
        <span className="avatar">{CURRENT_USER.initials}</span>
        <span className="user-meta">
          <strong>{CURRENT_USER.name}</strong>
          <span>{role === 'Admin' ? CURRENT_USER.team : `Viewing as ${role}`}</span>
        </span>
        <ChevronDown size={16} className="muted" />
      </button>
      {open && (
        <div className="popover user-menu" role="menu">
          <p className="popover-label">View as</p>
          {ROLES.map((r) => (
            <button
              key={r}
              role="menuitemradio"
              aria-checked={role === r}
              className={`menu-row ${role === r ? 'is-selected' : ''}`}
              onClick={() => {
                setRole(r)
                setOpen(false)
              }}
            >
              <span>
                <strong>{r}</strong>
                <span className="muted">{ROLE_NOTES[r]}</span>
              </span>
              {role === r && <Check size={16} />}
            </button>
          ))}
          <div className="popover-divider" />
          <Link to="/settings" className="menu-row" role="menuitem" onClick={() => setOpen(false)}>
            <Settings size={15} /> Settings
          </Link>
          <button
            className="menu-row"
            role="menuitem"
            disabled={!changeCount}
            onClick={() => {
              setOpen(false)
              if (window.confirm('Undo every change made in this demo?')) resetDemoData()
            }}
          >
            <RotateCcw size={15} /> Reset demo data
          </button>
          <button className="menu-row" role="menuitem" onClick={signOut}>
            <LogOut size={15} /> Sign out
          </button>
        </div>
      )}
    </div>
  )
}
