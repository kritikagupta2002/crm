import { Check, ChevronDown, LogOut, RotateCcw, Settings } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ROLE_ACCESS, ROLES, canOpen, useCrm } from '../../context/crm'
import { CURRENT_USER } from '../../data/mockData'
import { RoleLink } from '../common/RoleLink'
import { usePopover } from '../common/usePopover'
import { NAV_ITEMS } from './navigation'

/* Profile menu. "View as" lets the demo show role-based access (e.g. Coordinators don't see amounts). */
export function UserMenu() {
  const { role, setRole, changeCount, resetDemoData, signOut } = useCrm()
  const { open, setOpen, ref } = usePopover()
  const { pathname } = useLocation()
  const navigate = useNavigate()

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
                // A page the new role can't open, or one that isn't in its menu, gives way to that role's home page.
                const item = NAV_ITEMS.find((i) => i.path === pathname)
                if (!canOpen(r, pathname) || (item?.only && !item.only.includes(r))) navigate(ROLE_ACCESS[r].home)
              }}
            >
              <span>
                <strong>{r}</strong>
                <span className="muted">{ROLE_ACCESS[r].note}</span>
              </span>
              {role === r && <Check size={16} />}
            </button>
          ))}
          <div className="popover-divider" />
          <RoleLink to="/settings" className="menu-row" role="menuitem" onClick={() => setOpen(false)} hideIfLocked>
            <Settings size={15} /> Settings
          </RoleLink>
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
