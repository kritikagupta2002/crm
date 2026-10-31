import { Check, ChevronDown, LogOut, RotateCcw, Settings, UserRound } from 'lucide-react'
import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ROLE_ACCESS, ROLE_USERS, ROLES, canOpen, initialsOf, useCrm } from '../../core/permissions/crm'
import { RoleLink } from '../components/RoleLink'
import { usePopover } from '../hooks/usePopover'
import { FIELD_MEMBERS } from '../../core/constants/staff'
import { NAV_ITEMS } from './navigation'

/*
 * Profile menu with role switching and HR settings.
 */
export function UserMenu() {
  const { role, user, fieldMember, setRole, changeCount, signOut } = useCrm()
  const { open, setOpen, ref } = usePopover()
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const [teamOpen, setTeamOpen] = useState(false)

  const switchTo = (r, person) => {
    setRole(r, person)
    setOpen(false)
    setTeamOpen(false)
    const item = NAV_ITEMS.find((i) => i.path === pathname)
    if (!canOpen(r, pathname) || (item?.only && !item.only.includes(r))) {
      navigate(ROLE_ACCESS[r]?.home ?? '/')
    }
  }

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
          <p className="user-menu-label">Switch role</p>
          <div className="user-menu-roles">
            {ROLES.map((r) =>
              r === 'Employee' ? (
                <div key={r} className="role-group">
                  <button
                    className={`role-row ${role === r ? 'is-selected' : ''}`}
                    title={ROLE_ACCESS[r]?.note}
                    aria-expanded={teamOpen}
                    onClick={() => setTeamOpen(!teamOpen)}
                  >
                    <span className="role-row-text">
                      <span className="role-row-name">{r}</span>
                      <span className="role-row-brief">{ROLE_ACCESS[r]?.brief}</span>
                    </span>
                    <span className="role-row-person">{role === r ? fieldMember : `${FIELD_MEMBERS.length} people`}</span>
                    <ChevronDown size={15} className="role-row-toggle" aria-hidden="true" />
                  </button>
                  {teamOpen && (
                    <div className="role-members">
                      {FIELD_MEMBERS.map((m) => {
                        const current = role === r && fieldMember === m.name
                        return (
                          <button
                            key={m.name}
                            role="menuitemradio"
                            aria-checked={current}
                            className={`role-row role-member ${current ? 'is-selected' : ''}`}
                            onClick={() => switchTo(r, m.name)}
                          >
                            <span className="role-row-name">{m.name}</span>
                            <span className="role-row-person">{m.title}</span>
                            <Check size={15} className="role-row-check" aria-hidden="true" />
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              ) : (
                <button
                  key={r}
                  role="menuitemradio"
                  aria-checked={role === r}
                  className={`role-row ${role === r ? 'is-selected' : ''}`}
                  title={ROLE_ACCESS[r]?.note}
                  onClick={() => switchTo(r)}
                >
                  <span className="role-row-text">
                    <span className="role-row-name">{r}</span>
                    <span className="role-row-brief">{ROLE_ACCESS[r]?.brief}</span>
                  </span>
                  <span className="role-row-person">{ROLE_USERS[r]?.name}</span>
                  <Check size={15} className="role-row-check" aria-hidden="true" />
                </button>
              ),
            )}
          </div>

          <div className="popover-divider" />
          <RoleLink to="/hr/settings/profile" className="menu-action" role="menuitem" onClick={() => setOpen(false)}>
            <UserRound size={16} /> My Profile
          </RoleLink>
          <RoleLink to="/hr/settings" className="menu-action" role="menuitem" onClick={() => setOpen(false)} hideIfLocked>
            <Settings size={16} /> HR Settings
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
