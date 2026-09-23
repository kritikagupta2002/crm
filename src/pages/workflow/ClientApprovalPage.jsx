import { BadgeCheck, CircleDollarSign, FileSignature, Hourglass, Trophy } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { KpiCard } from '../../components/common/KpiCard'
import { useAccess, useCrm, useMoney } from '../../context/crm'
import { APPROVAL_STEPS, progressOf } from '../../utils/workflow'
import { PaymentCheck } from '../../components/lead/ClientPayments'
import { WorkflowCard } from './WorkflowCard'

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'po', label: 'Waiting for PO', test: (a) => !a.poReceived },
  { id: 'advance', label: 'Waiting for advance', test: (a) => a.poReceived && !a.advanceReceived },
  { id: 'ready', label: 'Ready to close', test: (a) => progressOf(APPROVAL_STEPS, a) === APPROVAL_STEPS.length },
]

/*
 * After the client accepts a quotation: collect the work order, advance and signed agreement,
 * then close the deal as Won — which starts onboarding.
 */
export function ClientApprovalPage() {
  const money = useMoney()
  const { leads, updateLead, changeStage } = useCrm()
  // Sales ticks the PO and agreement, Accounts the advance; closing as Won is Sales'.
  const { may, locked } = useAccess()
  const [filter, setFilter] = useState('all')

  const pending = leads
    .filter((l) => l.quoteStatus === 'Accepted' && l.stage !== 'Won' && l.stage !== 'Lost')
    .sort((a, b) => progressOf(APPROVAL_STEPS, b.approval) - progressOf(APPROVAL_STEPS, a.approval))
  const test = FILTERS.find((f) => f.id === filter).test
  const visible = test ? pending.filter((l) => test(l.approval ?? {})) : pending
  const count = (key) => pending.filter((l) => l.approval?.[key]).length
  const ready = pending.filter((l) => progressOf(APPROVAL_STEPS, l.approval) === APPROVAL_STEPS.length)

  const toggle = (lead) => (key, value) => {
    const step = APPROVAL_STEPS.find((s) => s.key === key)
    updateLead(lead.id, { approval: { ...lead.approval, [key]: value } }, `${step.label} — ${value ? 'done' : 'marked pending'}`)
  }

  return (
    <div className="module-page">
      <header className="page-header">
        <div className="page-title">
          <h1>Client Approval</h1>
          <p>
            {pending.length} accepted quotations · {money.short(pending.reduce((s, l) => s + (l.quoteValue ?? 0), 0))} being finalised
          </p>
        </div>
      </header>

      <section className="stat-grid">
        <KpiCard tone="tone-attention" icon={Hourglass} label="Awaiting Approval" value={pending.length}>
          <span className="muted">Quotation accepted, not yet won</span>
        </KpiCard>
        <KpiCard tone="tone-info" icon={FileSignature} label="PO Received" value={count('poReceived')}>
          <span className="muted">of {pending.length}</span>
        </KpiCard>
        <KpiCard tone="tone-info" icon={CircleDollarSign} label="Advance Received" value={count('advanceReceived')}>
          <span className="muted">of {pending.length}</span>
        </KpiCard>
        <KpiCard tone="tone-good" icon={BadgeCheck} label="Ready to Close" value={ready.length}>
          <span className="muted">All steps done</span>
        </KpiCard>
      </section>

      <nav className="stage-tabs filter-tabs" aria-label="Filter">
        {FILTERS.map((f) => (
          <button key={f.id} className={`stage-tab ${filter === f.id ? 'is-active' : ''}`} onClick={() => setFilter(f.id)} aria-pressed={filter === f.id}>
            {f.label}
            <span>{f.test ? pending.filter((l) => f.test(l.approval ?? {})).length : pending.length}</span>
          </button>
        ))}
      </nav>

      {visible.length === 0 ? (
        <div className="card empty-state">
          Nothing waiting here. When a client accepts a quotation it shows up on this page — see <Link to="/quotations">Quotations</Link>.
        </div>
      ) : (
        <div className="card-grid">
          {visible.map((lead) => {
            const complete = progressOf(APPROVAL_STEPS, lead.approval) === APPROVAL_STEPS.length
            return (
              <WorkflowCard
                key={lead.id}
                lead={lead}
                steps={APPROVAL_STEPS}
                values={lead.approval}
                onToggle={toggle(lead)}
                locked={locked}
                notice={<PaymentCheck lead={lead} dueKey="advance" />}
                footer={
                  may('sales') && (
                  <button className="btn btn-success" disabled={!complete} onClick={() => changeStage(lead.id, 'Won')} title={complete ? undefined : 'Finish all steps first'}>
                    <Trophy size={15} /> Mark as Won
                  </button>
                  )
                }
              />
            )
          })}
        </div>
      )}
    </div>
  )
}
