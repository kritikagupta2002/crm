import { AlertTriangle, Bell, CheckCircle2, Clock, FileWarning, FolderKanban, Globe, HardHat, IndianRupee, MessageCircleQuestion, Receipt, ScrollText, Sparkles } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { BILL_ROLES, useAccess, useCrm, useMoney } from '../../context/crm'
import { TODAY } from '../../data/mockData'
import { queriesOf } from '../../data/queries'
import { paymentsOf } from '../../utils/payments'
import { addDays, formatDayMonth, toISODate } from '../../utils/date'
import { ERM_STAGES, allProjects, nextWorkStep } from '../../utils/projects'
import { quoteFor } from '../../utils/workflow'
import { usePopover } from '../common/usePopover'

const SEEN_KEY = 'bansal-crm:seen-notifications'
const todayISO = toISODate(TODAY)
const soonISO = toISODate(addDays(TODAY, 5))
const weekAgoISO = toISODate(addDays(TODAY, -7))

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
  const { leads, followUps, settings, activities, projectEdits, role } = useCrm()
  const { can } = useAccess()
  const money = useMoney()
  const { open, setOpen, ref } = usePopover()
  const [seen, setSeen] = useState(readSeen)
  const company = (id) => leads.find((l) => l.id === id)?.company

  const questions = leads.flatMap((l) =>
    queriesOf(l)
      .filter((q) => q.status === 'Open')
      .map((q) => ({ id: `q-${q.id}`, tone: 'tone-attention', icon: MessageCircleQuestion, title: `Question from ${l.company}: ${q.topic}`, sub: q.message, to: `/leads/${l.id}?tab=activity` })),
  )

  // Payments the client reported from the portal wait for Accounts; the roles that don't see amounts aren't asked.
  const toVerify = money.hidden
    ? []
    : leads.flatMap((l) =>
        paymentsOf(l)
          .filter((p) => p.status === 'Submitted')
          .map((p) => ({ id: `pay-${p.id}`, tone: 'tone-attention', icon: IndianRupee, title: `Payment to verify: ${l.company}`, sub: `₹${Math.round(p.amount).toLocaleString('en-IN')} · ${p.title} · ref. ${p.utr}`, to: l.stage === 'Won' ? `/clients?open=${l.id}` : '/client-approval' })),
      )

  const fromPortal = activities
    .filter((a) => a.by === 'client' && a.type !== 'query' && a.type !== 'payment')
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

  // Project delivery: late tasks, projects waiting for a coordinator, new letters and projects ready to close.
  const projects = can('/projects') ? allProjects(leads, projectEdits) : []
  const running = projects.filter((p) => p.stageIndex < ERM_STAGES.length)
  const fromErm = [
    ...running.flatMap((p) =>
      p.tasks
        .filter((t) => t.overdue)
        .map((t) => ({ id: `tk-${p.id}-${t.key ?? t.id}-${t.due}`, tone: 'tone-urgent', icon: AlertTriangle, title: `Overdue task: ${t.title}`, sub: `${p.lead.company} · ${t.assignee ?? 'Unassigned'} · was due ${formatDayMonth(t.due)}`, to: `/projects/${p.id}?tab=tasks` })),
    ),
    ...running
      .filter((p) => ERM_STAGES[p.stageIndex].key === 'allocation' && p.startedOn)
      .map((p) => ({ id: `al-${p.id}`, tone: 'tone-attention', icon: FolderKanban, title: `Allocate: ${p.name}`, sub: `${p.lead.company} · needs a project coordinator`, to: `/projects/${p.id}` })),
    ...projects
      .flatMap((p) => p.letters.filter((l) => l.date >= weekAgoISO && l.date <= todayISO).map((l) => ({ l, p })))
      .map(({ l, p }) => ({ id: `lt-${l.id}`, tone: 'tone-good', icon: ScrollText, title: `Letter from ${p.code}: ${l.title}`, sub: `${p.lead.company} · ${formatDayMonth(l.date)}`, to: `/projects/${p.id}?tab=documents` })),
    ...running
      .filter((p) => p.status === 'Approved')
      .map((p) => ({ id: `rc-${p.id}`, tone: 'tone-info', icon: CheckCircle2, title: `Ready to close: ${p.name}`, sub: `${p.lead.company} · approval received`, to: `/projects/${p.id}` })),
  ]

  // Subcontracts: bills for Accounts to check and for the CFO to pay; what vendors sent from their portal.
  const orders = can('/subcontracts') ? (projects.length ? projects : allProjects(leads, projectEdits)).flatMap((p) => p.workOrders.map((w) => ({ ...w, project: p }))) : []
  const bills = orders
    .filter((w) => ['check', 'pay'].includes(nextWorkStep(w)?.key) && BILL_ROLES[nextWorkStep(w).key].includes(role))
    .map((w) => ({
      id: `wo-${w.id}-${nextWorkStep(w).key}-${w.bill.no}`,
      tone: nextWorkStep(w).key === 'check' ? 'tone-attention' : 'tone-urgent',
      icon: Receipt,
      title: `${nextWorkStep(w).key === 'check' ? 'Bill to check' : 'Ready to pay'}: ${w.vendor}`,
      sub: `${w.id} · ${w.bill.no}${money.hidden ? '' : ` · ₹${Math.round(w.bill.amount).toLocaleString('en-IN')}`}`,
      to: '/subcontracts?tab=Bills%20to%20pay',
    }))
  const fromVendors = activities
    .filter((a) => a.by === 'vendor' && a.at.slice(0, 10) >= weekAgoISO)
    .slice(-6)
    .reverse()
    .map((a) => ({ id: `vn-${a.id}`, tone: 'tone-info', icon: HardHat, title: `${a.vendor}: ${a.text.split(' — ').pop().replace(' (vendor portal)', '')}`, sub: `Vendor portal · ${formatDayMonth(a.at.slice(0, 10))}`, to: '/subcontracts' }))

  const items = [
    ...toVerify,
    ...bills,
    ...fromVendors,
    ...questions,
    ...fromPortal,
    ...fromErm,
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
  ].filter((item) => can(item.to)) // a role only hears about what it can open
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
          {items.length > 12 && <p className="popover-foot muted">+{items.length - 12} more on the Follow-ups, Quotations and Tasks pages</p>}
        </div>
      )}
    </div>
  )
}
