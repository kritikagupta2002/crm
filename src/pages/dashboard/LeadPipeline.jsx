import { Workflow } from 'lucide-react'
import { STAGE_COLORS } from '../../components/common/stageColors'
import { useCrm } from '../../context/crm'
import { usePeriod } from '../../context/period'
import { getPipeline } from '../../utils/dashboardStats'

export function LeadPipeline() {
  const { period } = usePeriod()
  const stages = getPipeline(useCrm().leads, period)
  const total = stages.reduce((sum, s) => sum + s.count, 0)

  return (
    <section className="card pipeline-card" id="pipeline">
      <header className="card-header">
        <Workflow className="card-icon" size={22} strokeWidth={1.8} />
        <h2>Lead Pipeline</h2>
        <div className="card-actions">
          Total leads: <strong className="text-ink">{total}</strong>
        </div>
      </header>

      <ol className="pipeline">
        {stages.map(({ stage, count, share }) => {
          const color = STAGE_COLORS[stage]
          return (
            <li key={stage} className="pipeline-step" style={{ background: color.bg }}>
              <span className="pipeline-label" style={{ color: color.fg }}>
                {stage}
              </span>
              <strong className="pipeline-count">{count}</strong>
              <span className="pipeline-share">
                <i style={{ background: color.dot }} />
                {share}%
              </span>
            </li>
          )
        })}
      </ol>
    </section>
  )
}
