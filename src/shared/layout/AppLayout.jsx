import { useEffect, useState } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { canOpen, useCrm } from '../../core/permissions/crm'
import { NAV_ITEMS } from './navigation'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import { ProfileCompletionModal } from '../components/ProfileCompletionModal'
import { employeeService } from '../../hrms/modules/employees/services/employee.service'
import { attendanceService } from '../../hrms/modules/attendance/services/attendance.service'
import { leaveService } from '../../hrms/modules/leave/services/leave.service'
import { notificationService } from '../../hrms/modules/notifications/services/notification.service'
import { settingsService } from '../../hrms/modules/settings/services/settings.service'
import { shiftService } from '../../hrms/modules/shifts/services/shift.service'
import './layout.css'
import '../../styles/theme.css'

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
  const item = NAV_ITEMS.find((i) => i.path === pathname)
  if (item) return item.label
  if (pathname.startsWith('/hr/employees/')) return pathname.endsWith('/edit') ? 'Edit Employee' : 'Employee Details'
  if (pathname.startsWith('/hr/settings/')) return 'Settings'
  return 'HRMS'
}

/*
 * The menu button has one state with two meanings:
 * on desktop it collapses the sidebar to an icon rail, on small screens it opens the sidebar as a drawer.
 */
export function AppLayout() {
  const [desktopCollapsed, setDesktopCollapsed] = useState(readCollapsed)
  const [mobileOpen, setMobileOpen] = useState(false)
  const { status, role, user } = useCrm()
  const { pathname } = useLocation()
  const [synced, setSynced] = useState(false)
  const [syncError, setSyncError] = useState('')

  // On route change: close mobile drawer, scroll to top, update document title
  useEffect(() => {
    document.title = `${pageTitle(pathname)} · Bansal Geo HRMS`
    window.scrollTo(0, 0)
    setMobileOpen(false)
  }, [pathname])

  // Load the shared records once per session before pages render, so every page reads current server data.
  useEffect(() => {
    if (status !== 'authenticated' || user?.mustChangePassword) return undefined
    let cancelled = false
    Promise.allSettled([
      employeeService.getAll(),
      attendanceService.getAttendance(),
      attendanceService.getCorrections(),
      leaveService.getRequests(),
      notificationService.getNotifications(),
      settingsService.getAttendanceSettings(),
      settingsService.getLeaveSettings(),
      settingsService.getCompanySettings(),
      shiftService.getShifts(),
      shiftService.getAssignments(),
      leaveService.getLeaveTypes(),
    ]).then((results) => {
      if (cancelled) return
      const failed = results.find((r) => r.status === 'rejected')
      setSyncError(failed ? failed.reason?.message || 'Some data could not be loaded.' : '')
      setSynced(true)
    })
    return () => {
      cancelled = true
    }
  }, [status, user?.mustChangePassword])

  // Keep shared data fresh: re-fetch when the person returns to the tab and every two minutes while it is visible.
  // Badges, notifications and any page opened afterwards then reflect changes made by others.
  const [, setRefreshTick] = useState(0)
  useEffect(() => {
    if (!synced) return undefined
    let last = Date.now()
    const refresh = () => {
      if (document.hidden || Date.now() - last < 30000) return
      last = Date.now()
      Promise.allSettled([
        attendanceService.getAttendance(),
        attendanceService.getCorrections(),
        leaveService.getRequests(),
        notificationService.getNotifications(),
        employeeService.getAll(),
      ]).then(() => setRefreshTick((n) => n + 1))
    }
    const timer = setInterval(refresh, 120000)
    document.addEventListener('visibilitychange', refresh)
    window.addEventListener('focus', refresh)
    return () => {
      clearInterval(timer)
      document.removeEventListener('visibilitychange', refresh)
      window.removeEventListener('focus', refresh)
    }
  }, [synced])

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

  if (status === 'loading') return <div className="app-boot" role="status">Loading your workspace…</div>
  if (status === 'offline') {
    return (
      <div className="app-boot" role="alert">
        <p>Cannot reach the server. Check your connection.</p>
        <button type="button" className="btn btn-primary" onClick={() => window.location.reload()}>
          Try again
        </button>
      </div>
    )
  }
  if (status !== 'authenticated') return <Navigate to="/login" replace state={{ from: pathname }} />
  if (user?.mustChangePassword) return <Navigate to="/login" replace state={{ from: pathname }} />
  // Pages outside the person's role redirect to the dashboard (the server refuses their data either way).
  if (!canOpen(user?.permissions, pathname, user?.employeeId)) return <Navigate to="/" replace />


  return (
    <div className={`app-shell ${desktopCollapsed ? 'desktop-collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}>
      <Sidebar
        onNavigate={() => setMobileOpen(false)}
        onClose={() => setMobileOpen(false)}
      />
      <div className="sidebar-backdrop" onClick={() => setMobileOpen(false)} />

      <div className="app-main">
        <Topbar onMenuClick={toggleMenu} />
        <main className="app-content">
          {/* Keyed by path so each page plays its entrance animation. */}
          {syncError && (
            <div className="app-alert" role="alert">
              {syncError}
            </div>
          )}
          {synced ? (
            <div key={pathname} className="page-anim">
              <Outlet />
            </div>
          ) : (
            <div className="app-boot app-boot-inline" role="status">Loading…</div>
          )}
        </main>
        <footer className="app-footer">
          <span>© {new Date().getFullYear()} Bansal Geo Solutions Pvt. Ltd.</span>
        </footer>
      </div>

      {synced && <ProfileCompletionModal user={user} role={role} />}
    </div>
  )
}
