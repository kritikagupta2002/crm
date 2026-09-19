import { Layers } from 'lucide-react'
import { useCrm } from '../../context/crm'
import { usePeriod } from '../../context/period'
import { getServiceMix } from '../../utils/dashboardStats'

/* Simple ranked bars — easier to read than a seven-slice donut. */
export function ServiceMix() {
  const { period } = usePeriod()
  const mix = getServiceMix(useCrm().leads, period).sort((a, b) => b.count - a.count)
  const max = Math.max(...mix.map((row) => row.count), 1)

  return (
    <section className="card service-card">
      <header className="card-header">
        <Layers className="card-icon" size={22} strokeWidth={1.8} />
        <h2>Enquiries by Service</h2>
      </header>

      <ul className="service-bars">
        {mix.map((row) => (
          <li key={row.service}>
            <div className="service-bar-top">
              <span>{row.service}</span>
              <strong>{row.count}</strong>
            </div>
            <div className="service-bar-track">
              <div className="service-bar" style={{ width: `${(row.count / max) * 100}%` }} />
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
