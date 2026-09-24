import { MessageCircleQuestion } from 'lucide-react'
import { useState } from 'react'
import { RoleLink } from '../../components/common/RoleLink'
import { QueryItem } from '../../components/lead/ClientQueries'
import { useCrm } from '../../context/crm'
import { questionsFor } from '../../utils/questions'

const TABS = { Waiting: (q) => q.status === 'Open', Answered: (q) => q.status !== 'Open', All: () => true }

/* Who sees what here, in words, for the page's subtitle. */
const SCOPE = {
  Admin: 'every question from the client portal',
  Management: 'every question from the client portal',
  Sales: 'questions from enquiries not yet won, and general ones',
  'Project Coordinator': 'questions about projects and documents from your clients',
  'Team Lead': 'questions about the projects you lead',
  Finance: 'billing questions',
  Accountant: 'billing questions',
}

/*
 * Questions clients asked on the portal, in one place and sent to whoever answers them (utils/questions):
 * Accounts for billing, the project team for the work, Sales before the deal is won.
 */
export function QuestionsPage() {
  const { leads, role, user, projectEdits } = useCrm()
  const [tab, setTab] = useState('Waiting')
  const mine = questionsFor({ role, userName: user.name, projectEdits }, leads)
  // Longest waiting first; answered ones newest first.
  const visible = mine.filter(TABS[tab]).sort((a, b) => (tab === 'Waiting' ? a.at.localeCompare(b.at) : b.at.localeCompare(a.at)))

  return (
    <div className="module-page">
      <header className="page-header">
        <div className="page-title">
          <h1>Client Questions</h1>
          <p>
            {mine.filter(TABS.Waiting).length} waiting for a reply · {SCOPE[role]}
          </p>
        </div>
      </header>

      <section className="card">
        <nav className="stage-tabs" aria-label="Filter questions">
          {Object.keys(TABS).map((t) => (
            <button key={t} className={`stage-tab ${tab === t ? 'is-active' : ''}`} onClick={() => setTab(t)} aria-pressed={tab === t}>
              {t}
              <span>{mine.filter(TABS[t]).length}</span>
            </button>
          ))}
        </nav>
        {visible.length === 0 ? (
          <p className="empty-state">
            <MessageCircleQuestion size={18} /> {tab === 'Waiting' ? 'Nothing waiting. New questions from the client portal come here.' : 'No questions here.'}
          </p>
        ) : (
          <ul className="query-list questions-inbox">
            {visible.map((q) => (
              <QueryItem
                key={q.id}
                lead={q.lead}
                query={q}
                head={
                  <RoleLink to={`/leads/${q.lead.id}?tab=activity`} className="cell-strong cell-link">
                    {q.lead.company}
                  </RoleLink>
                }
              />
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
