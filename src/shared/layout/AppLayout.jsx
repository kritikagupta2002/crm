import { useEffect, useState } from 'react'
import { Link, Navigate, Outlet, useLocation } from 'react-router-dom'
import { Lock } from 'lucide-react'
import { ROLE_ACCESS, canOpen, useCrm } from '../../core/permissions/crm'
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
  const [desktopCollapsed, setDesktopCollapsed] = useState(readCollapsed)
  const [mobileOpen, setMobileOpen] = useState(false)
  const { changeCount, resetDemoData, teamSignedIn, role } = useCrm()
  const { pathname } = useLocation()

  // On route change: close mobile drawer, scroll to top, update document title
  useEffect(() => {
    document.title = `${pageTitle(pathname)} · Bansal Geo CRM`
    window.scrollTo(0, 0)
    setMobileOpen(false)
  }, [pathname])

  // Lock body scroll on small screens when mobile drawer is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.classList.add('mobile-drawer-open')
    } else {
      document.body.classList.remove('mobile-drawer-open')
    }
    return () => {
      document.body.classList.remove('mobile-drawer-open')
    }
  }, [mobileOpen])

  // Auto-close mobile drawer on window resize to desktop
  useEffect(() => {
    const handleResize = () => {
      if (!isSmallScreen()) {
        setMobileOpen(false)
      }
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const toggleMenu = () => {
    if (isSmallScreen()) {
      setMobileOpen((prev) => !prev)
    } else {
      setDesktopCollapsed((prev) => {
        const next = !prev
        try {
          localStorage.setItem(COLLAPSED_KEY, next ? '1' : '0')
        } catch {
          // Only a convenience.
        }
        return next
      })
    }
  }

  // The CRM is for the team; clients and vendors have their own portals and sign-ins.
  if (!teamSignedIn) return <Navigate to="/login" replace state={{ from: pathname }} />
  const home = ROLE_ACCESS[role]?.home ?? '/'

  // Strict route protection: Block and immediately redirect unauthorized route attempts
  if (!canOpen(role, pathname)) {
    if (pathname !== home) {
      return <Navigate to={home} replace />
    }
  }

  const isMenuToggled = isSmallScreen() ? mobileOpen : desktopCollapsed

  return (
    <div className={`app-shell ${desktopCollapsed ? 'desktop-collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''} ${isMenuToggled ? 'menu-toggled' : ''}`}>
      <Sidebar
        onNavigate={() => setMobileOpen(false)}
        onClose={() => setMobileOpen(false)}
      />
      <div className="sidebar-backdrop" onClick={() => setMobileOpen(false)} />

      <div className="app-main">
        <Topbar onMenuClick={toggleMenu} />
        <main className="app-content">
          {/* Keyed by path so each page plays its entrance animation. */}
          <div key={pathname} className="page-anim">
            <Outlet />
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
