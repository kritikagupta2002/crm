import { ChevronDown, X } from 'lucide-react'
import { useLayoutEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { useAccess, useCrm } from '../../core/permissions/crm'
import { storage } from '@/core/storage/storage'
import { Logo } from '../components/Logo'
import { Mountains } from '../components/Mountains'
import { NAV_GROUPS } from './navigation'

/*
 * The HRMS sidebar menu with attendance and employee navigation.
 */
export function Sidebar({ onNavigate, onClose, nav, counts, expanded = false, footer, footerRoom = 200 }) {
  const { user } = useCrm()
  const { can, role } = useAccess()
  const badges = counts ?? {
    correctionsPending: ['Super Admin', 'Director'].includes(role)
      ? (storage.getCorrections?.() || []).filter((c) => c?.status === 'Pending').length
      : 0,
    leavesPending: ['Super Admin', 'Director'].includes(role)
      ? (storage.getLeaveRequests?.() || []).filter((l) => l?.status === 'Pending').length
      : 0,
  }
  const { pathname } = useLocation()
  const groups = nav ?? NAV_GROUPS.map((group) => ({ ...group, items: group.items.filter((item) => can(item.path) && (!item.only || item.only.includes(role))) })).filter((group) => group.items.length)

  // The module holding the current page opens by itself; a header click opens another one instead.
  const matches = (item) => (item.path === '/' ? pathname === '/' : pathname === item.path || pathname.startsWith(`${item.path}/`))
  const activeGroup = groups
    .flatMap((group) => group.items.filter(matches).map((item) => ({ title: group.title, length: item.path.length })))
    .sort((a, b) => b.length - a.length)[0]?.title
  const [choice, setChoice] = useState({ path: pathname, title: activeGroup })
  const open = choice.path === pathname ? choice.title : (activeGroup ?? groups[0]?.title)
  const setChosen = (title) => setChoice({ path: pathname, title })

  const navRef = useRef(null)
  const [crowded, setCrowded] = useState(false)
  useLayoutEffect(() => {
    const navEl = navRef.current
    if (!navEl) return
    const check = () => {
      const last = navEl.lastElementChild
      const room = last ? window.innerHeight - last.getBoundingClientRect().bottom : window.innerHeight
      setCrowded(room < footerRoom)
      if (navEl.parentElement) {
        navEl.parentElement.style.setProperty('--sidebar-room', `${Math.round(room)}px`)
      }
    }
    check()
    navEl.addEventListener('transitionend', check)
    window.addEventListener('resize', check)
    return () => {
      navEl.removeEventListener('transitionend', check)
      window.removeEventListener('resize', check)
    }
  }, [open, groups.length, footerRoom])

  return (
    <aside className={`sidebar ${crowded ? 'is-crowded' : ''}`}>
      <div className="sidebar-brand">
        <Link to="/" onClick={onNavigate} className="sidebar-brand-link" aria-label="Go to HRMS homepage">
          <Logo />
        </Link>
        {onClose && (
          <button
            type="button"
            className="sidebar-close-btn"
            onClick={onClose}
            aria-label="Close menu"
          >
            <X size={19} />
          </button>
        )}
      </div>

      <nav className="sidebar-nav" aria-label="Main" ref={navRef}>
        {groups.map((group) => {
          const isOpen = expanded || open === group.title
          return (
            <div key={group.title} className={`nav-group ${isOpen ? 'is-open' : ''}`}>
              <button
                type="button"
                className={`sidebar-section ${group.title === activeGroup ? 'has-active' : ''}`}
                aria-expanded={isOpen}
                onClick={() => setChosen(isOpen ? '' : group.title)}
              >
                <span className={`sidebar-section-label ${group.title.length > 20 ? 'is-long' : ''}`}>{group.title}</span>
                <ChevronDown size={15} />
              </button>
              <div className="nav-group-items">
                <div className="nav-group-inner" inert={isOpen ? undefined : true}>
                  {group.items.map(({ label, path, icon: Icon, badge, badgeTone, end }) => (
                    <NavLink
                      key={path}
                      to={path}
                      end={path === '/' || end}
                      onClick={onNavigate}
                      className={({ isActive }) => `nav-item ${isActive ? 'is-active' : ''}`}
                      title={label}
                    >
                      <span className="nav-icon">
                        <Icon size={20} strokeWidth={1.8} />
                      </span>
                      <span>{label}</span>
                      {badge && badges[badge] > 0 && <span className={`nav-badge ${badgeTone ?? ''}`}>{badges[badge]}</span>}
                    </NavLink>
                  ))}
                </div>
              </div>
            </div>
          )
        })}
      </nav>

      <div className={`sidebar-footer ${footer ? 'has-card' : ''}`}>
        {footer ?? (
          <p className="sidebar-motto">
            Bansal Geo
            <br />
            HRMS &amp;
            <br />
            Attendance
          </p>
        )}
        <Mountains className="sidebar-mountains" />
      </div>
    </aside>
  )
}
