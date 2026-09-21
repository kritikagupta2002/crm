import { ArrowRight, Landmark } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAccess, useCrm } from '../../context/crm'
import { formatNearDate } from '../../utils/date'
import { allProjects } from '../../utils/projects'

/* Government approvals at a glance: how many projects are where, and which ones are waiting on an authority. */
export function ApprovalsGlance() {
  const { leads, projectEdits } = useCrm()
  const { can } = useAccess()
  const projects = allProjects(leads, projectEdits)
  const waiting = projects.filter((p) => p.status === 'Awaiting approval')
  // Roles without the Projects page still see the list, just not as links.
  const linkTo = (p, content) =>
    can('/projects') ? (
      <Link to={`/projects/${p.id}`} className="glance-item">
        {content}
      </Link>
    ) : (
      <span className="glance-item">{content}</span>
    )
  const figures = [
    ['Work in progress', projects.filter((p) => p.status === 'In progress').length, 'tone-info'],
    ['With the authority', waiting.length, 'tone-attention'],
    ['Approved', projects.filter((p) => p.status === 'Approved' || p.status === 'Completed').length, 'tone-good'],
  ]

  return (
    <section className="card approvals-glance">
      <header className="card-header">
        <Landmark size={18} className="card-icon" />
        <h2>Projects &amp; Government Approvals</h2>
        {can('/projects') && (
          <div className="card-actions">
            <Link to="/projects" className="link-button">
              View all <ArrowRight size={14} />
            </Link>
          </div>
        )}
      </header>
      <div className="glance-body">
        <dl className="glance-figures">
          {figures.map(([label, value, tone]) => (
            <div key={label} className={tone}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
        <div className="glance-waiting">
          <h3>Waiting on the authority</h3>
          {waiting.length === 0 ? (
            <p className="muted">Nothing pending.</p>
          ) : (
            <ul>
              {waiting.slice(0, 3).map((p) => (
                <li key={p.id}>
                  {linkTo(
                    p,
                    <>
                      <strong>{p.lead.company}</strong>
                      <span className="muted">
                        {p.now.label} · {p.code}
                      </span>
                    </>,
                  )}
                  <span className="glance-when">{p.now.date ? `planned ${formatNearDate(p.now.date)}` : ''}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  )
}
