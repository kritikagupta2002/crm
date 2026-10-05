import { Compass } from 'lucide-react'
import { Link } from 'react-router-dom'

/* Shown for any URL that doesn't match a page. */
export function ComingSoonPage() {
  return (
    <div className="card coming-soon">
      <Compass size={40} strokeWidth={1.5} />
      <h1>Page not found</h1>
      <p className="muted">This link doesn't lead anywhere in the CRM.</p>
      <Link to="/" className="btn btn-primary">
        Back to Dashboard
      </Link>
    </div>
  )
}
