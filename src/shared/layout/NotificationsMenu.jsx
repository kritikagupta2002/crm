import { Bell, CalendarCheck, Clock, FileCheck2, Info, Sparkles, UserCheck } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAccess, useCrm } from '../../core/permissions/crm'
import { storage } from '@/core/storage/storage'
import { usePopover } from '../hooks/usePopover'

const SEEN_KEY = 'bansal-hrms:seen-notifications'

function readSeen() {
  try {
    return new Set(JSON.parse(localStorage.getItem(SEEN_KEY) || '[]'))
  } catch {
    return new Set()
  }
}

export function NotificationsMenu() {
  const { role, user } = useCrm()
  const { can } = useAccess()
  const { open, setOpen, ref } = usePopover()
  const [seen, setSeen] = useState(readSeen)

  const isHrAdmin = ['Super Admin', 'Director', 'Manager'].includes(role)

  // Pending attendance corrections
  const corrections = isHrAdmin
    ? (storage.getCorrections?.() || [])
        .filter((c) => c?.status === 'Pending')
        .map((c) => ({
          id: `corr-${c.id}`,
          tone: 'tone-attention',
          icon: Clock,
          title: `Attendance correction: ${c.employeeName || 'Employee'}`,
          sub: `${c.date} · ${c.reason || 'Punch time adjustment requested'}`,
          to: '/hr/attendance/corrections',
        }))
    : []

  // Pending leave requests
  const leaves = isHrAdmin
    ? (storage.getLeaveRequests?.() || [])
        .filter((l) => l?.status === 'Pending')
        .map((l) => ({
          id: `leave-${l.id}`,
          tone: 'tone-attention',
          icon: CalendarCheck,
          title: `Leave request: ${l.employeeName || 'Staff'}`,
          sub: `${l.leaveType} (${l.daysCount || 1} day${(l.daysCount || 1) > 1 ? 's' : ''}) · ${l.startDate}`,
          to: '/hr/leave/requests',
        }))
    : []

  // System notifications
  const sysNotifs = (storage.getNotifications?.() || [])
    .slice(0, 10)
    .map((n) => ({
      id: `sys-${n.id}`,
      tone: n.type === 'alert' ? 'tone-urgent' : 'tone-info',
      icon: Info,
      title: n.title,
      sub: n.message,
      to: n.actionUrl || '/hr/notifications',
    }))

  const items = [...corrections, ...leaves, ...sysNotifs].filter((item) => can(item.to))
  const unread = items.filter((i) => !seen.has(i.id)).length

  const markAllRead = () => {
    const next = new Set([...seen, ...items.map((i) => i.id)])
    setSeen(next)
    try {
      localStorage.setItem(SEEN_KEY, JSON.stringify([...next]))
    } catch {
      // Ignored
    }
  }

  return (
    <div className="popover-wrap" ref={ref}>
      <button
        className="icon-button bell"
        onClick={() => setOpen(!open)}
        aria-label={unread ? `Notifications, ${unread} unread` : 'Notifications'}
        aria-expanded={open}
      >
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
              {items.slice(0, 10).map((item) => (
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
        </div>
      )}
    </div>
  )
}
