import { Menu } from 'lucide-react'
import { useCrm } from '../../context/crm'
import { GlobalSearch } from './GlobalSearch'
import { NotificationsMenu } from './NotificationsMenu'
import { UserMenu } from './UserMenu'

export function Topbar({ onMenuClick }) {
  const { role } = useCrm()

  return (
    <header className="topbar">
      <button className="icon-button" onClick={onMenuClick} aria-label="Toggle menu">
        <Menu size={20} />
      </button>

      <GlobalSearch />

      <div className="topbar-right">
        {role !== 'Admin' && <span className="role-badge">Viewing as {role}</span>}
        <NotificationsMenu />
        <UserMenu />
      </div>
    </header>
  )
}
