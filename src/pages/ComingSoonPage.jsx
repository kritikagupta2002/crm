import { Construction } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { NAV_ITEMS } from '../components/layout/navigation'

export function ComingSoonPage() {
  const { pathname } = useLocation()
  const page = NAV_ITEMS.find((item) => item.path === pathname)

  return (
    <div className="card coming-soon">
      <Construction size={40} strokeWidth={1.5} />
      <h1>{page?.label ?? 'Page not found'}</h1>
      <p className="muted">This screen is part of the next build phase.</p>
      <Link to="/" className="btn btn-primary">
        Back to Dashboard
      </Link>
    </div>
  )
}
