import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { useCrm } from '../../context/crm'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import './layout.css'

const isSmallScreen = () => window.matchMedia('(max-width: 1023px)').matches

/*
 * The menu button has one state with two meanings:
 * on desktop it collapses the sidebar to an icon rail, on small screens it opens the sidebar as a drawer.
 */
export function AppLayout() {
  const [menuToggled, setMenuToggled] = useState(false)
  const { changeCount, resetDemoData } = useCrm()

  return (
    <div className={`app-shell ${menuToggled ? 'menu-toggled' : ''}`}>
      <Sidebar onNavigate={() => isSmallScreen() && setMenuToggled(false)} />
      <div className="sidebar-backdrop" onClick={() => setMenuToggled(false)} />

      <div className="app-main">
        <Topbar onMenuClick={() => setMenuToggled((value) => !value)} />
        <main className="app-content">
          <Outlet />
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
