import { ChevronDown } from 'lucide-react'
import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { useAccess, useCrm } from '../../context/crm'
import { countFollowUpsDue } from '../../utils/dashboardStats'
import { Logo } from '../common/Logo'
import { Mountains } from '../common/Mountains'
import { NAV_GROUPS } from './navigation'

export function Sidebar({ onNavigate }) {
  const { followUps } = useCrm()
  const { can } = useAccess()
  const badges = { followUpsDue: countFollowUpsDue(followUps).due }
  const { pathname } = useLocation()
  const groups = NAV_GROUPS.map((group) => ({ ...group, items: group.items.filter((item) => can(item.path)) })).filter((group) => group.items.length)

  // The module holding the current page opens by itself; a header click opens another one instead.
  const activeGroup = groups.find((group) => group.items.some((item) => (item.path === '/' ? pathname === '/' : pathname.startsWith(item.path))))?.title
  const [choice, setChoice] = useState({ path: pathname, title: activeGroup })
  const open = choice.path === pathname ? choice.title : (activeGroup ?? groups[0]?.title)
  const setChosen = (title) => setChoice({ path: pathname, title })

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <Logo />
      </div>

      <nav className="sidebar-nav" aria-label="Main">
        {groups.map((group) => {
          const isOpen = open === group.title
          return (
            <div key={group.title} className={`nav-group ${isOpen ? 'is-open' : ''}`}>
              <button
                type="button"
                className={`sidebar-section ${group.title === activeGroup ? 'has-active' : ''}`}
                aria-expanded={isOpen}
                onClick={() => setChosen(isOpen ? '' : group.title)}
              >
                {group.title}
                <ChevronDown size={15} />
              </button>
              <div className="nav-group-items">
                <div className="nav-group-inner" inert={isOpen ? undefined : true}>
                  {group.items.map(({ label, path, icon: Icon, badge }) => (
                    <NavLink
                      key={path}
                      to={path}
                      end={path === '/'}
                      onClick={onNavigate}
                      className={({ isActive }) => `nav-item ${isActive ? 'is-active' : ''}`}
                      title={label}
                    >
                      <Icon size={20} strokeWidth={1.8} />
                      <span>{label}</span>
                      {badge && badges[badge] > 0 && <span className="nav-badge">{badges[badge]}</span>}
                    </NavLink>
                  ))}
                </div>
              </div>
            </div>
          )
        })}
      </nav>

      <div className="sidebar-footer">
        <p className="sidebar-motto">
          Geology
          <br />
          for a Better
          <br />
          Tomorrow
        </p>
        <Mountains className="sidebar-mountains" />
      </div>
    </aside>
  )
}
