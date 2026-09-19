import { CheckCircle2, ClipboardList, Rocket, UserPlus } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { KpiCard } from '../../components/common/KpiCard'
import { useCrm } from '../../context/crm'
import { formatDayMonth } from '../../utils/date'
import { ONBOARDING_STEPS, progressOf } from '../../utils/workflow'
import { WorkflowCard } from './WorkflowCard'

const isDone = (lead) => progressOf(ONBOARDING_STEPS, lead.onboarding) === ONBOARDING_STEPS.length

/* Won deals become active clients once KYC, documents, kick-off, team and portal access are done. */
export function OnboardingPage() {
  const { leads, updateLead } = useCrm()
  const [tab, setTab] = useState('progress')

  const won = leads.filter((l) => l.stage === 'Won')
  const inProgress = won.filter((l) => !isDone(l)).sort((a, b) => progressOf(ONBOARDING_STEPS, b.onboarding) - progressOf(ONBOARDING_STEPS, a.onboarding))
  const completed = won.filter(isDone)
  const visible = tab === 'progress' ? inProgress : completed
  const notStarted = inProgress.filter((l) => progressOf(ONBOARDING_STEPS, l.onboarding) === 0).length

  const toggle = (lead) => (key, value) => {
    const step = ONBOARDING_STEPS.find((s) => s.key === key)
    const next = { ...lead.onboarding, [key]: value }
    const finished = progressOf(ONBOARDING_STEPS, next) === ONBOARDING_STEPS.length
    updateLead(lead.id, { onboarding: next }, finished ? 'Onboarding complete — client is active' : `Onboarding: ${step.label} ${value ? 'done' : 'reopened'}`)
  }

  return (
    <div className="module-page">
      <header className="page-header">
        <div className="page-title">
          <h1>Client Onboarding</h1>
          <p>Getting won clients ready for project kick-off</p>
        </div>
      </header>

      <section className="stat-grid">
        <KpiCard tone="tone-attention" icon={ClipboardList} label="In Progress" value={inProgress.length - notStarted}>
          <span className="muted">Some steps done</span>
        </KpiCard>
        <KpiCard tone="tone-urgent" icon={UserPlus} label="Not Started" value={notStarted}>
          <span className="muted">Won, nothing collected yet</span>
        </KpiCard>
        <KpiCard tone="tone-good" icon={CheckCircle2} label="Active Clients" value={completed.length}>
          <span className="muted">Onboarding complete</span>
        </KpiCard>
        <KpiCard tone="tone-info" icon={Rocket} label="Won Deals" value={won.length}>
          <span className="muted">All time</span>
        </KpiCard>
      </section>

      <nav className="stage-tabs filter-tabs" aria-label="Filter">
        <button className={`stage-tab ${tab === 'progress' ? 'is-active' : ''}`} onClick={() => setTab('progress')} aria-pressed={tab === 'progress'}>
          In progress <span>{inProgress.length}</span>
        </button>
        <button className={`stage-tab ${tab === 'done' ? 'is-active' : ''}`} onClick={() => setTab('done')} aria-pressed={tab === 'done'}>
          Completed <span>{completed.length}</span>
        </button>
      </nav>

      {visible.length === 0 ? (
        <div className="card empty-state">
          {tab === 'progress' ? (
            <>
              Everyone is onboarded. New wins from <Link to="/client-approval">Client Approval</Link> appear here.
            </>
          ) : (
            'No completed onboardings yet.'
          )}
        </div>
      ) : (
        <div className="card-grid">
          {visible.map((lead) => (
            <WorkflowCard
              key={lead.id}
              lead={lead}
              steps={ONBOARDING_STEPS}
              values={lead.onboarding}
              onToggle={toggle(lead)}
              meta={`Won ${formatDayMonth(lead.wonOn ?? lead.createdOn)} · ${lead.assignedTo}`}
              footer={isDone(lead) ? <span className="pill tone-good active-pill">Active client</span> : null}
            />
          ))}
        </div>
      )}
    </div>
  )
}
