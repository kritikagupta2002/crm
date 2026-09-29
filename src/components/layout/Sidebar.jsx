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

export function Sidebar({ onNavigate, nav, counts, expanded = false, footer, footerRoom = 200 }) {
  const { followUps, leads, user, projectEdits, vendorApplications, tenders, bids, clarifications, documents, scanInbox } = useCrm()
  const { can, role, may } = useAccess()
  const badges = counts ?? {
    followUpsDue: countFollowUpsDue(followUps).due,
    questionsOpen: questionsFor({ role, userName: user.name, projectEdits }, leads).filter((q) => q.status === 'Open').length,
    vendorAppsNew: vendorApplications.filter((a) => a.status === 'New').length,
    tendersToDecide:
      tenders.filter((t) => tenderPhase(t) === 'Evaluation' && bids.some((b) => b.tenderId === t.id && ['Submitted', 'Shortlisted'].includes(b.status))).length + clarifications.filter((c) => !c.answer).length,
    docsToAct: may('documents') ? documents.filter((d) => ['To verify', 'To authorize', 'To share'].includes(d.stage) && !(d.stage === 'To verify' && !d.rescan && d.record.filedBy === user.name)).length : 0,
    scansToFile: may('documents') ? scanInbox.length : 0,
    originalsToSend: may('documents') ? documents.filter((d) => d.stage === 'To dispatch').length : 0,
  }
  const { pathname } = useLocation()
  const groups = nav ?? NAV_GROUPS.map((group) => ({ ...group, items: group.items.filter((item) => can(item.path) && (!item.only || item.only.includes(role))) })).filter((group) => group.items.length)

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
    const nav = navRef.current
    if (!nav) return
    const check = () => {
      const last = nav.lastElementChild
      const room = last ? window.innerHeight - last.getBoundingClientRect().bottom : window.innerHeight
      setCrowded(room < footerRoom)
      nav.parentElement.style.setProperty('--sidebar-room', `${Math.round(room)}px`)
    }
    check()
    nav.addEventListener('transitionend', check)
    window.addEventListener('resize', check)
    return () => {
      nav.removeEventListener('transitionend', check)
      window.removeEventListener('resize', check)
    }
  }, [open, groups.length, footerRoom])

  return (
    <aside className={`sidebar ${crowded ? 'is-crowded' : ''}`}>
      <div className="sidebar-brand">
        <Logo />
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
            Geology
            <br />
            for a Better
            <br />
            Tomorrow
          </p>
        )}
        <Mountains className="sidebar-mountains" />
      </div>
    </aside>
  )
}
