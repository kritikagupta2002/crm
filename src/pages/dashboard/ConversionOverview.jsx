import { ArrowDown, ArrowUp, BarChart3 } from 'lucide-react'
import { useCrm } from '../../context/crm'
import { PERIOD_LABELS, usePeriod } from '../../context/period'
import { getSummary } from '../../utils/dashboardStats'

export function ConversionOverview() {
  const { period } = usePeriod()
  const summary = getSummary(useCrm(), period)
  const { rate, changePoints, previousRate, proposalsSent } = summary.conversion
  const labels = PERIOD_LABELS[period]
  const won = summary.converted.value
  const max = Math.max(summary.totalLeads, 1)

  const funnel = [
    { label: 'Enquiries received', value: summary.totalLeads, color: 'var(--blue)' },
    { label: 'Quotations sent', value: proposalsSent, color: 'var(--amber)' },
    { label: 'Became clients', value: won, color: 'var(--green)' },
  ]

  return (
    <section className="card conversion-card">
      <header className="card-header">
        <BarChart3 className="card-icon" size={22} strokeWidth={1.8} />
        <h2>Conversion Overview</h2>
      </header>

      <div className="conversion-body">
        <div className="conversion-rate">
          <strong>{rate}%</strong>
          <span className="conversion-sentence">
            <b>{won}</b> of <b>{summary.totalLeads}</b> enquiries became clients
          </span>
          {changePoints !== null && changePoints !== 0 && (
            <span className="conversion-change">
              <span className={changePoints > 0 ? 'delta-pill up' : 'delta-pill down'}>
                {changePoints > 0 ? <ArrowUp size={13} strokeWidth={2.5} /> : <ArrowDown size={13} strokeWidth={2.5} />}
                {Math.abs(changePoints)} pts
              </span>
              <span className="muted">
                vs {labels.previous} ({previousRate}%)
              </span>
            </span>
          )}
          {changePoints === 0 && <span className="muted">Same as {labels.previous}</span>}
        </div>

        <ul className="funnel">
          {funnel.map((row) => (
            <li key={row.label}>
              <div className="funnel-top">
                <span>{row.label}</span>
                <strong>{row.value}</strong>
              </div>
              <div className="funnel-track">
                <div className="funnel-bar" style={{ width: `${(row.value / max) * 100}%`, background: row.color }} />
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
