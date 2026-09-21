import { NavLink } from 'react-router-dom'
import { useCrm } from '../../context/crm'
import { countFollowUpsDue } from '../../utils/dashboardStats'
import { Logo } from '../common/Logo'
import { Mountains } from '../common/Mountains'
import { NAV_GROUPS } from './navigation'

export function Sidebar({ onNavigate }) {
  const { followUps } = useCrm()
  const badges = { followUpsDue: countFollowUpsDue(followUps).due }

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <Logo />
      </div>

      <nav className="sidebar-nav" aria-label="Main">
        {NAV_GROUPS.map((group) => (
          <div key={group.title ?? 'main'} className="nav-group">
            {group.title && <p className="sidebar-section">{group.title}</p>}
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
        ))}
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
