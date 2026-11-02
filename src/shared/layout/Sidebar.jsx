import { ChevronDown, X } from 'lucide-react'
import { useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { useAccess } from '../../core/permissions/crm'
import { storage } from '@/core/storage/storage'
import { Logo } from '../components/Logo'
import { ContourLines } from '../components/ContourLines'
import { NAV_GROUPS } from './navigation'

const matches = (item, pathname) =>
  item.path === '/' ? pathname === '/' : pathname === item.path || pathname.startsWith(`${item.path}/`)

/*
 * Main navigation. Each person sees only the sections their permissions allow. The section holding the current
 * page opens by itself; other sections open on click. The sidebar is fixed and scrolls on its own, so it always
 * fills the window height.
 */
export function Sidebar({ onNavigate, onClose }) {
  const { can, has } = useAccess()
  const { pathname } = useLocation()

  const badges = {
    correctionsPending: has('attendance.manage') ? (storage.getCorrections?.() || []).filter((c) => c?.status === 'Pending').length : 0,
    leavesPending: has('leave.approve') ? (storage.getLeaveRequests?.() || []).filter((l) => l?.status === 'Pending').length : 0,
  }

  const groups = NAV_GROUPS.map((group) => ({ ...group, items: group.items.filter((item) => can(item.path)) })).filter((g) => g.items.length)

  // The most specific matching item decides the active section.
  const activeGroup = groups
    .flatMap((g) => g.items.filter((item) => matches(item, pathname)).map((item) => ({ title: g.title, length: item.path.length })))
    .sort((a, b) => b.length - a.length)[0]?.title

  const [openGroups, setOpenGroups] = useState(() => new Set(activeGroup ? [activeGroup] : [groups[0]?.title]))
  const isOpen = (title) => openGroups.has(title) || title === activeGroup
  const toggle = (title) =>
    setOpenGroups((prev) => {
      const next = new Set(prev)
      if (next.has(title) || title === activeGroup) next.delete(title)
      else next.add(title)
      return next
    })

  return (
    <aside className="sidebar" aria-label="Main navigation">
      <ContourLines className="sidebar-contours" lines={18} color="rgba(255,255,255,0.07)" accent="rgba(184,121,43,0.18)" />

      <div className="sidebar-brand">
        <Link to="/" onClick={onNavigate} className="sidebar-brand-link" aria-label="Bansal Geo HRMS home">
          <Logo />
        </Link>
        {onClose && (
          <button type="button" className="sidebar-close-btn" onClick={onClose} aria-label="Close menu">
            <X size={18} />
          </button>
        )}
      </div>

      <nav className="sidebar-nav">
        {groups.map((group) => {
          const open = isOpen(group.title)
          const id = `nav-${group.title.toLowerCase().replace(/\W+/g, '-')}`
          return (
            <div key={group.title} className={`nav-group ${open ? 'is-open' : ''} ${group.title === activeGroup ? 'has-active' : ''}`}>
              <button type="button" className="sidebar-section" aria-expanded={open} aria-controls={id} onClick={() => toggle(group.title)}>
                <span className="sidebar-section-label">{group.title}</span>
                <ChevronDown size={14} aria-hidden="true" />
              </button>
              <div id={id} className="nav-group-items">
                <div className="nav-group-inner" inert={open ? undefined : true}>
                {group.items.map(({ label, path, icon: Icon, badge, end }) => (
                  <NavLink
                    key={path}
                    to={path}
                    end={path === '/' || end}
                    onClick={onNavigate}
                    className={({ isActive }) => `nav-item ${isActive ? 'is-active' : ''}`}
                    title={label}
                  >
                    <Icon className="nav-icon" size={18} strokeWidth={1.75} aria-hidden="true" />
                    <span className="nav-label">{label}</span>
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
        <span>Bansal Geo Solutions Pvt. Ltd.</span>
        <span>Jaipur, Rajasthan</span>
      </div>
    </aside>
  )
}
