import { MapPin, Megaphone } from 'lucide-react'
import { countBy, stateOf } from '../../utils/leads'

function BarList({ rows, total, color }) {
  const max = Math.max(...rows.map((row) => row.count), 1)
  return (
    <ul className="insight-bars">
      {rows.map((row) => (
        <li key={row.label}>
          <div className="insight-bar-top">
            <span>{row.label}</span>
            <span>
              <b>{row.count}</b> <span className="muted">{total ? Math.round((row.count / total) * 100) : 0}%</span>
            </span>
          </div>
          <div className="insight-track">
            <div style={{ width: `${(row.count / max) * 100}%`, background: color }} />
          </div>
        </li>
      ))}
    </ul>
  )
}

/* Where the (filtered) enquiries come from — both breakdowns follow the page's filters. */
export function LeadsInsights({ leads }) {
  const sources = countBy(leads, (lead) => lead.source)
  const states = countBy(leads, stateOf, 5)

  return (
    <aside className="leads-insights">
      <section className="card insight-card">
        <header className="card-header">
          <Megaphone className="card-icon" size={20} strokeWidth={1.8} />
          <h2>Enquiry Sources</h2>
        </header>
        <BarList rows={sources} total={leads.length} color="var(--teal-600)" />
      </section>

      <section className="card insight-card">
        <header className="card-header">
          <MapPin className="card-icon" size={20} strokeWidth={1.8} />
          <h2>Top Locations</h2>
        </header>
        <BarList rows={states} total={leads.length} color="var(--gold-500)" />
      </section>
    </aside>
  )
}
