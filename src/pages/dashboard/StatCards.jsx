import { ArrowDown, ArrowUp, CalendarClock, FileText, Inbox, UserCheck } from 'lucide-react'
import { KpiCard as StatCard } from '../../components/common/KpiCard'
import { useCrm, useMoney } from '../../context/crm'
import { PERIOD_LABELS, usePeriod } from '../../context/period'
import { getSummary } from '../../utils/dashboardStats'

function Trend({ value, suffix = '', vs }) {
  if (value === null) return null
  if (value === 0) return <span className="muted">Same as {vs}</span>
  const up = value > 0
  const Icon = up ? ArrowUp : ArrowDown
  return (
    <span>
      <span className={up ? 'delta-up' : 'delta-down'}>
        <Icon size={13} strokeWidth={2.5} />
        {Math.abs(value)}
        {suffix}
      </span>{' '}
      <span className="muted">vs {vs}</span>
    </span>
  )
}

export function StatCards() {
  const money = useMoney()
  const { period } = usePeriod()
  const summary = getSummary(useCrm(), period)
  const vs = PERIOD_LABELS[period].previous
  const { followUpsDue } = summary
  const dueToday = followUpsDue.value - followUpsDue.overdue
  const followUpTone = followUpsDue.overdue > 0 ? 'tone-urgent' : followUpsDue.value > 0 ? 'tone-attention' : 'tone-good'

  return (
    <section className="stat-grid" aria-label="Key figures">
      <StatCard tone="tone-info" icon={Inbox} label="Enquiries Received" value={summary.totalLeads} to="/leads">
        {summary.totalLeadsChange !== null ? (
          <Trend value={summary.totalLeadsChange} suffix="%" vs={vs} />
        ) : (
          <span className="muted">{PERIOD_LABELS[period].current}</span>
        )}
      </StatCard>

      <StatCard tone={followUpTone} icon={CalendarClock} label="Follow-ups Due" value={followUpsDue.value} to="/follow-ups">
        {followUpsDue.value === 0 ? (
          <span className="muted">Nothing pending</span>
        ) : (
          <span className="muted">
            {followUpsDue.overdue > 0 && <span className="text-red">{followUpsDue.overdue} overdue</span>}
            {followUpsDue.overdue > 0 && dueToday > 0 && ' · '}
            {dueToday > 0 && `${dueToday} today`}
          </span>
        )}
      </StatCard>

      <StatCard tone="tone-attention" icon={FileText} label="Awaiting Client Reply" value={summary.pendingProposals} to="/quotations">
        <span className="muted">
          Quotations worth <b className="text-ink">{money.short(summary.pendingProposalsValue)}</b>
        </span>
      </StatCard>

      <StatCard tone="tone-good" icon={UserCheck} label="Clients Won" value={summary.converted.value} to="/clients">
        <span className="muted">
          <b className="text-ink">{money.short(summary.converted.amount)}</b> business won
        </span>
        {summary.converted.hasPrevious && <Trend value={summary.converted.change} vs={vs} />}
      </StatCard>
    </section>
  )
}
