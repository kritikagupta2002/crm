import { ChevronDown, LogOut, Settings, ShieldCheck, UserRound } from 'lucide-react'
import { initialsOf, useCrm } from '../../core/permissions/crm'
import { RoleLink } from '../components/RoleLink'
import { usePopover } from '../hooks/usePopover'

/* The signed-in person's menu: profile, settings and sign out. Roles are assigned by HR, not chosen here. */
export function UserMenu() {
  const { role, user, signOut } = useCrm()
  const { open, setOpen, ref } = usePopover()

  if (!user) return null

  return (
    <div className="popover-wrap" ref={ref}>
      <button className="user-chip" onClick={() => setOpen(!open)} aria-expanded={open} aria-haspopup="menu">
        <span className="avatar">{initialsOf(user.name)}</span>
        <span className="user-meta">
          <strong>{user.name}</strong>
          <span>{user.title}</span>
        </span>
        <ChevronDown size={16} className="muted" />
      </button>
      {open && (
        <div className="popover user-menu" role="menu">
          <div className="user-menu-head">
            <strong>{user.name}</strong>
            <span>{user.email}</span>
            <span className="user-menu-role">
              <ShieldCheck size={13} aria-hidden="true" /> {role}
            </span>
          </div>

          <div className="popover-divider" />
          <RoleLink to="/hr/settings/profile" className="menu-action" role="menuitem" onClick={() => setOpen(false)}>
            <UserRound size={16} /> My profile
          </RoleLink>
          <RoleLink to="/hr/settings/security" className="menu-action" role="menuitem" onClick={() => setOpen(false)}>
            <ShieldCheck size={16} /> Change password
          </RoleLink>
          <RoleLink to="/hr/settings" className="menu-action" role="menuitem" onClick={() => setOpen(false)} hideIfLocked>
            <Settings size={16} /> HR settings
          </RoleLink>

          <div className="popover-divider" />
          <button className="menu-action menu-action-exit" role="menuitem" onClick={signOut}>
            <LogOut size={16} /> Sign out
          </button>
        </div>
      )}
    </div>
  )
}
