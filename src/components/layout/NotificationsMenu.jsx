import { AlertTriangle, Bell, Clock, FileWarning, Globe, Sparkles } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useCrm } from '../../context/crm'
import { TODAY } from '../../data/mockData'
import { addDays, formatDayMonth, toISODate } from '../../utils/date'
import { quoteFor } from '../../utils/workflow'
import { usePopover } from '../common/usePopover'

const SEEN_KEY = 'bansal-crm:seen-notifications'
const todayISO = toISODate(TODAY)
const soonISO = toISODate(addDays(TODAY, 5))

function readSeen() {
  try {
    return new Set(JSON.parse(localStorage.getItem(SEEN_KEY) || '[]'))
  } catch {
    return new Set()
  }
}

/*
 * What needs attention right now. The red dot shows while there are items not yet marked as read.
 * The Settings toggles decide whether overdue follow-ups and new enquiries are included.
 */
export function NotificationsMenu() {
  const { leads, followUps, settings, activities } = useCrm()
  const { open, setOpen, ref } = usePopover()
  const [seen, setSeen] = useState(readSeen)
  const company = (id) => leads.find((l) => l.id === id)?.company

  const fromPortal = activities
    .filter((a) => a.by === 'client')
    .slice(-8)
    .reverse()
    .map((a) => ({
      id: `cl-${a.id}`,
      tone: /accepted/.test(a.text) ? 'tone-good' : a.type === 'quote' ? 'tone-attention' : 'tone-info',
      icon: Globe,
      title: `${company(a.leadId)} ${(a.clientText ?? a.text).replace(/^You /, '')}`,
      sub: `Client portal · ${formatDayMonth(a.at.slice(0, 10))}`,
      to: a.type === 'quote' ? `/quotations?open=${a.leadId}` : `/leads/${a.leadId}?tab=activity`,
    }))

  const items = [
    ...fromPortal,
    ...(settings.notifyNewEnquiry
      ? leads
          .filter((l) => l.createdOn === todayISO)
          .map((l) => ({ id: `new-${l.id}`, tone: 'tone-info', icon: Sparkles, title: `New enquiry: ${l.company}`, sub: `${l.serviceDetail} · ${l.assignedTo}`, to: `/leads/${l.id}` }))
      : []),
    ...(settings.notifyOverdue
      ? followUps
          .filter((f) => f.date < todayISO)
          .map((f) => ({ id: `od-${f.id}`, tone: 'tone-urgent', icon: AlertTriangle, title: `Overdue: ${f.type} — ${company(f.leadId)}`, sub: `Was due ${formatDayMonth(f.date)}`, to: '/follow-ups' }))
      : []),
    ...followUps
      .filter((f) => f.date === todayISO)
      .map((f) => ({ id: `td-${f.id}`, tone: 'tone-attention', icon: Clock, title: `Today: ${f.type} — ${company(f.leadId)}`, sub: f.note, to: '/follow-ups' })),
    ...leads
      .map((l) => ({ lead: l, quote: quoteFor(l) }))
      .filter(({ quote }) => quote && (quote.status === 'Sent' || quote.status === 'Revised') && quote.validUntil <= soonISO)
      .map(({ lead, quote }) => ({
        id: `qx-${lead.id}-${quote.version}`,
        tone: 'tone-attention',
        icon: FileWarning,
        title: `${quote.number} ${quote.validUntil < todayISO ? 'has expired' : 'expires soon'}`,
        sub: `${lead.company} · valid till ${formatDayMonth(quote.validUntil)}`,
        to: `/quotations?open=${lead.id}`,
      })),
  ]
  const unread = items.filter((i) => !seen.has(i.id)).length

  const markAllRead = () => {
    const next = new Set([...seen, ...items.map((i) => i.id)])
    setSeen(next)
    try {
      localStorage.setItem(SEEN_KEY, JSON.stringify([...next]))
    } catch {
      // Only affects the dot.
    }
  }

  return (
    <div className="popover-wrap" ref={ref}>
      <button className="icon-button bell" onClick={() => setOpen(!open)} aria-label={unread ? `Notifications, ${unread} unread` : 'Notifications'} aria-expanded={open}>
        <Bell size={19} />
        {unread > 0 && <span className="bell-dot" />}
      </button>
      {open && (
        <div className="popover notifications" role="dialog" aria-label="Notifications">
          <header>
            <strong>Notifications</strong>
            {unread > 0 && (
              <button className="link-button" onClick={markAllRead}>
                Mark all as read
              </button>
            )}
          </header>
          {items.length === 0 ? (
            <p className="search-empty">You're all caught up.</p>
          ) : (
            <ul>
              {items.slice(0, 12).map((item) => (
                <li key={item.id} className={`${item.tone} ${seen.has(item.id) ? '' : 'is-unread'}`}>
                  <Link to={item.to} onClick={() => setOpen(false)}>
                    <span className="note-icon">
                      <item.icon size={15} />
                    </span>
                    <span>
                      <strong>{item.title}</strong>
                      <span className="muted">{item.sub}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          {items.length > 12 && <p className="popover-foot muted">+{items.length - 12} more on the Follow-ups and Quotations pages</p>}
        </div>
      )}
    </div>
  )
}
