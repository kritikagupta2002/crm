import { Menu } from 'lucide-react'
import { GlobalSearch } from './GlobalSearch'
import { NotificationsMenu } from './NotificationsMenu'
import { UserMenu } from './UserMenu'

export function Topbar({ onMenuClick }) {
  return (
    <header className="topbar">
      <button className="icon-button" onClick={onMenuClick} aria-label="Toggle menu">
        <Menu size={20} />
      </button>

      <GlobalSearch />

      <div className="topbar-right">
        <NotificationsMenu />
        <UserMenu />
      </div>
    </header>
  )
}
