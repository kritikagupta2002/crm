import { Checklist, ProgressBar } from '../../components/common/Checklist'
import { StagePill } from '../../components/common/StagePill'
import { progressOf } from '../../utils/workflow'
import { useMoney } from '../../context/crm'
import { RoleLink } from '../../components/common/RoleLink'

/* One client's checklist card, shared by Client Approval and Onboarding. */
export function WorkflowCard({ lead, steps, values, onToggle, footer, meta, notice }) {
  const money = useMoney()
  const done = progressOf(steps, values)
  const complete = done === steps.length
  return (
    <article className={`card workflow-card lift ${complete ? 'is-complete' : ''}`}>
      <header>
        <div>
          <RoleLink to={`/leads/${lead.id}`} className="workflow-company">
            {lead.company}
          </RoleLink>
          <span className="muted">
            {lead.id} · {lead.serviceDetail}
          </span>
        </div>
        <StagePill stage={lead.stage} />
      </header>
      <div className="workflow-progress">
        <ProgressBar done={done} total={steps.length} tone={complete ? 'tone-good' : 'tone-attention'} />
        <span>
          {done}/{steps.length}
        </span>
      </div>
      <Checklist steps={steps} values={values} onToggle={onToggle} />
      {notice}
      <div className="workflow-foot">
        <span className="muted">{meta ?? (lead.quoteValue ? `${money.short(lead.quoteValue)} + GST` : '')}</span>
        {footer}
      </div>
    </article>
  )
}
