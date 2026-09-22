import { Link } from 'react-router-dom'
import { TODAY } from '../../data/mockData'
import { formatNearDate, monthShort, parseISODate, toISODate } from '../../utils/date'

const todayISO = toISODate(TODAY)

/* Where a project's bar ends: closed, else the final approval (done or planned), else the planned submission. */
const endOf = (p) => p.closure.closedOn ?? p.approvals[p.approvals.length - 1]?.date ?? p.dueOn

/*
 * Every project as a bar across the calendar: the work up to submission (teal), then the time with the
 * authority (gold), with today marked. Projects that haven't been scheduled yet are listed below the chart.
 */
export function ProjectTimeline({ projects }) {
  const scheduled = projects.filter((p) => p.startedOn)
  const waiting = projects.filter((p) => !p.startedOn)
  if (scheduled.length === 0) {
    return (
      <p className="empty-state">
        None of these projects has a start date yet; they start once the client's onboarding is complete: {waiting.map((p) => `${p.lead.company} — ${p.name}`).join(' · ')}
      </p>
    )
  }

  const first = parseISODate(scheduled.reduce((min, p) => (p.startedOn < min ? p.startedOn : min), todayISO))
  const last = parseISODate(scheduled.reduce((max, p) => (endOf(p) > max ? endOf(p) : max), todayISO))
  const start = new Date(first.getFullYear(), first.getMonth(), 1)
  const end = new Date(last.getFullYear(), last.getMonth() + 1, 1)
  const span = end - start
  const at = (iso) => `${(((parseISODate(iso) - start) / span) * 100).toFixed(2)}%`
  const width = (a, b) => `${Math.max(0.6, ((parseISODate(b) - parseISODate(a)) / span) * 100).toFixed(2)}%`

  const months = []
  for (let d = new Date(start); d < end; d = new Date(d.getFullYear(), d.getMonth() + 1, 1)) months.push(d)
  const every = Math.ceil(months.length / 12)

  return (
    <div className="timeline-view">
      <div className="tl-row tl-head">
        <span />
        <div className="tl-track">
          {months.map((m, i) =>
            i % every === 0 ? (
              <span key={m.toISOString()} className="tl-month" style={{ left: at(toISODate(m)) }}>
                {monthShort(m)}
                {i === 0 || months[i - every].getFullYear() !== m.getFullYear() ? ` ${String(m.getFullYear()).slice(2)}` : ''}
              </span>
            ) : null,
          )}
        </div>
      </div>

      {scheduled.map((p) => {
        const submitted = p.submission?.date ?? p.dueOn
        const finish = endOf(p)
        return (
          <div key={p.id} className="tl-row">
            <Link to={`/projects/${p.id}`} className="tl-label">
              <strong>{p.name}</strong>
              <span className="muted">
                {p.lead.company} · {p.id}
              </span>
            </Link>
            <div className="tl-track">
              <span className="tl-today" style={{ left: at(todayISO) }} />
              <span
                className={`tl-bar tl-work ${p.status === 'Not started' ? 'is-planned' : ''}`}
                style={{ left: at(p.startedOn), width: width(p.startedOn, submitted) }}
                title={`Work: ${formatNearDate(p.startedOn)} → submission ${formatNearDate(submitted)}`}
              />
              {finish > submitted && (
                <span
                  className={`tl-bar tl-approval ${p.closure.closedOn ? 'is-closed' : ''}`}
                  style={{ left: at(submitted), width: width(submitted, finish) }}
                  title={`${p.closure.closedOn ? 'Approval and closure' : 'With the authority'}: ${formatNearDate(submitted)} → ${formatNearDate(finish)}`}
                />
              )}
            </div>
          </div>
        )
      })}

      <div className="tl-legend">
        <span>
          <i className="tl-work" /> Work up to submission
        </span>
        <span>
          <i className="tl-approval" /> With the authority
        </span>
        <span>
          <i className="tl-approval is-closed" /> Approved &amp; closed
        </span>
        <span>
          <i className="tl-today-key" /> Today
        </span>
      </div>
      {waiting.length > 0 && (
        <p className="muted small tl-waiting">
          Not scheduled yet (start after onboarding): {waiting.map((p) => `${p.lead.company} — ${p.name}`).join(' · ')}
        </p>
      )}
    </div>
  )
}
