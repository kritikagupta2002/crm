import { useEffect, useState } from 'react'
import { Link, Navigate, Outlet, useLocation } from 'react-router-dom'
import { Lock } from 'lucide-react'
import { ROLE_ACCESS, canOpen, useCrm } from '../../context/crm'
import { NAV_ITEMS } from './navigation'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import './layout.css'

const isSmallScreen = () => window.matchMedia('(max-width: 1023px)').matches
const COLLAPSED_KEY = 'bansal-crm:sidebar-collapsed'

/* Desktop only: remember whether the sidebar was collapsed to icons. */
function readCollapsed() {
  try {
    return !isSmallScreen() && localStorage.getItem(COLLAPSED_KEY) === '1'
  } catch {
    return false
  }
}

function pageTitle(pathname) {
  if (pathname.startsWith('/leads/')) return `${pathname.split('/')[2]} · Enquiry`
  if (pathname.startsWith('/projects/')) return `${pathname.split('/')[2]} · Project`
  const item = NAV_ITEMS.find((i) => i.path === pathname)
  return item ? item.label : 'Page not found'
}

/*
 * The menu button has one state with two meanings:
 * on desktop it collapses the sidebar to an icon rail, on small screens it opens the sidebar as a drawer.
 */
export function AppLayout() {
  const [menuToggled, setMenuToggled] = useState(readCollapsed)
  const { changeCount, resetDemoData, teamSignedIn, role } = useCrm()
  const { pathname } = useLocation()

  useEffect(() => {
    document.title = `${pageTitle(pathname)} · Bansal Geo CRM`
    // A new page starts at the top; otherwise it opens at the previous page's scroll position.
    // Only the path counts, so switching tabs or filters (?tab=…) doesn't jump.
    window.scrollTo(0, 0)
  }, [pathname])

  const toggleMenu = () =>
    setMenuToggled((value) => {
      if (!isSmallScreen()) {
        try {
          localStorage.setItem(COLLAPSED_KEY, value ? '0' : '1')
        } catch {
          // Only a convenience.
        }
      }
      return !value
    })

  // The CRM is for the team; clients and vendors have their own portals and sign-ins.
  if (!teamSignedIn) return <Navigate to="/login" replace state={{ from: pathname }} />
  const home = ROLE_ACCESS[role]?.home ?? '/'
  if (pathname === '/' && !canOpen(role, '/')) return <Navigate to={home} replace />

  return (
    <div className={`app-shell ${menuToggled ? 'menu-toggled' : ''}`}>
      <Sidebar onNavigate={() => isSmallScreen() && setMenuToggled(false)} />
      <div className="sidebar-backdrop" onClick={() => setMenuToggled(false)} />

      <div className="app-main">
        <Topbar onMenuClick={toggleMenu} />
        <main className="app-content">
          {/* Keyed by path so each page plays its entrance animation. */}
          <div key={pathname} className="page-anim">
            {canOpen(role, pathname) ? (
              <Outlet />
            ) : (
              <div className="card coming-soon no-access">
                <Lock size={28} />
                <h1>Not part of the {role} role</h1>
                <p className="muted">This page is only open to other roles. Ask an admin if you need access.</p>
                <Link to={home} className="btn btn-primary">
                  Go to {NAV_ITEMS.find((item) => item.path === home)?.label ?? 'your home page'}
                </Link>
              </div>
            )}
          </div>
        </main>
        <footer className="app-footer">
          <span>© {new Date().getFullYear()} Bansal Geo Solutions Pvt. Ltd.</span>
          {changeCount > 0 && (
              <button
                className="footer-reset"
                onClick={() => window.confirm(`Undo all ${changeCount} changes made in this demo?`) && resetDemoData()}
              >
                Reset demo data ({changeCount})
              </button>
          )}
        </footer>
      </div>
    </div>
  )
}
