import { ArrowRight, CalendarDays } from 'lucide-react'
import { useCrm } from '../../context/crm'
import { getUpcomingFollowUps } from '../../utils/dashboardStats'
import { formatTime, monthShort, parseISODate } from '../../utils/date'
import { RoleLink } from '../../components/common/RoleLink'

/* Same colour code as the rest of the dashboard: red = overdue, amber = today, blue = coming up. */
const STATUS_TONE = {
  Overdue: 'tone-urgent',
  Today: 'tone-attention',
  Upcoming: 'tone-info',
}

export function UpcomingFollowUps() {
  const followUps = getUpcomingFollowUps(useCrm())

  return (
    <section className="card followups-card" id="follow-ups">
      <header className="card-header">
        <CalendarDays className="card-icon" size={22} strokeWidth={1.8} />
        <h2>Upcoming Follow-ups</h2>
        <div className="card-actions">
          <RoleLink to="/follow-ups" className="link-button" hideIfLocked>
            View all <ArrowRight size={15} />
          </RoleLink>
        </div>
      </header>

      <ul className="followup-list">
        {followUps.map((item) => {
          const date = parseISODate(item.date)
          return (
            <li key={item.id} className={`followup-item ${STATUS_TONE[item.status]}`}>
              <div className="date-block">
                <strong>{String(date.getDate()).padStart(2, '0')}</strong>
                <span>{monthShort(date)}</span>
              </div>
              <div className="followup-text">
                <strong>{item.title}</strong>
                <span>{item.note}</span>
              </div>
              <span className="followup-time">{formatTime(item.time)}</span>
              <span className="pill followup-status">{item.status}</span>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
