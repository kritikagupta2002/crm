import { ChevronDown } from 'lucide-react'
import { useLayoutEffect, useRef, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { useAccess, useCrm } from '../../context/crm'
import { countFollowUpsDue } from '../../utils/dashboardStats'
import { questionsFor } from '../../utils/questions'
import { tenderPhase } from '../../utils/tenders'
import { Logo } from '../common/Logo'
import { Mountains } from '../common/Mountains'
import { NAV_GROUPS } from './navigation'

export function Sidebar({ onNavigate }) {
  const { followUps, leads, user, projectEdits, vendorApplications, tenders, bids } = useCrm()
  const { can, role } = useAccess()
  const badges = {
    followUpsDue: countFollowUpsDue(followUps).due,
    // Questions this person answers that are still waiting.
    questionsOpen: questionsFor({ role, userName: user.name, projectEdits }, leads).filter((q) => q.status === 'Open').length,
    // Registrations waiting for the Admin's decision.
    vendorAppsNew: vendorApplications.filter((a) => a.status === 'New').length,
    // Tenders whose bidding has closed with bids still to shortlist, reject or allot.
    tendersToDecide: tenders.filter((t) => tenderPhase(t) === 'Evaluation' && bids.some((b) => b.tenderId === t.id && ['Submitted', 'Shortlisted'].includes(b.status))).length,
  }
  const { pathname } = useLocation()
  const groups = NAV_GROUPS.map((group) => ({ ...group, items: group.items.filter((item) => can(item.path) && (!item.only || item.only.includes(role))) })).filter((group) => group.items.length)

  // The module holding the current page opens by itself; a header click opens another one instead.
  // The closest match wins: /hr/expenses belongs to Expenses, not to the HR Dashboard at /hr.
  const matches = (item) => (item.path === '/' ? pathname === '/' : pathname === item.path || pathname.startsWith(`${item.path}/`))
  const activeGroup = groups
    .flatMap((group) => group.items.filter(matches).map((item) => ({ title: group.title, length: item.path.length })))
    .sort((a, b) => b.length - a.length)[0]?.title
  const [choice, setChoice] = useState({ path: pathname, title: activeGroup })
  const open = choice.path === pathname ? choice.title : (activeGroup ?? groups[0]?.title)
  const setChosen = (title) => setChoice({ path: pathname, title })

  // A long open menu (HR has a dozen pages) would run into the mountain at the bottom: then the mountain steps aside.
  const navRef = useRef(null)
  const [crowded, setCrowded] = useState(false)
  useLayoutEffect(() => {
    const nav = navRef.current
    if (!nav) return
    const check = () => {
      const last = nav.querySelector('.nav-group.is-open .nav-item:last-child') ?? nav.lastElementChild
      setCrowded(Boolean(last) && last.getBoundingClientRect().bottom > window.innerHeight - 200)
    }
    check()
    // Menus slide open and shut: measure again when they have.
    nav.addEventListener('transitionend', check)
    window.addEventListener('resize', check)
    return () => {
      nav.removeEventListener('transitionend', check)
      window.removeEventListener('resize', check)
    }
  }, [open, groups.length])

  return (
    <aside className={`sidebar ${crowded ? 'is-crowded' : ''}`}>
      <div className="sidebar-brand">
        <Logo />
      </div>

      <nav className="sidebar-nav" aria-label="Main" ref={navRef}>
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
                  {group.items.map(({ label, path, icon: Icon, badge, end }) => (
                    <NavLink
                      key={path}
                      to={path}
                      end={path === '/' || end}
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
