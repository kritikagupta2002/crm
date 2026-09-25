import { Award, Bell, Bookmark, FolderOpen, Gavel, HardHat, History, Home, IndianRupee, ListChecks, LogOut, Mail, Megaphone, Menu, MessageCircleQuestion, Phone, Search, Star, Undo2, UserRound, XCircle } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { usePopover } from '../../components/common/usePopover'
import { Sidebar } from '../../components/layout/Sidebar'
import { initialsOf, useCrm } from '../../context/crm'
import { formatNearDate } from '../../utils/date'
import { nextWorkStep } from '../../utils/projects'
import { vendorOrders } from '../../utils/workOrders'
import { LIVE_BID, formatDateTime, localDay, tenderPhase, vendorNotices } from '../../utils/tenders'
import '../../components/layout/layout.css'
import '../portal/portal.css'
import '../projects/erm.css'
import '../vendors/vendors.css'
import './vendor.css'

const VENDOR_PAGES = [
  ['/vendor', 'Home'],
  ['/vendor/account', 'My Account'],
  ['/vendor/documents', 'My Documents'],
  ['/vendor/tenders', 'Search Active Tenders'],
  ['/vendor/my-tenders', 'My Tenders'],
  ['/vendor/bids', 'My Active Bids'],
  ['/vendor/clarifications', 'Clarification'],
  ['/vendor/status', 'Tender Status'],
  ['/vendor/history', 'My Bids History'],
  ['/vendor/withdrawn', 'My Withdrawn Bids'],
  ['/vendor/orders', 'Work Orders'],
  ['/vendor/payments', 'Payments'],
]
const ICONS = { 'tone-info': Megaphone, 'tone-attention': Star, 'tone-good': Award, 'tone-urgent': XCircle, 'tone-neutral': XCircle }
const isSmallScreen = () => window.matchMedia('(max-width: 1023px)').matches
const seenKey = (vendorId) => `bansal-crm:vendor-seen:${vendorId}`

function readSeen(vendorId) {
  try {
    return new Set(JSON.parse(localStorage.getItem(seenKey(vendorId)) || '[]'))
  } catch {
    return new Set()
  }
}

/* When this vendor signed in before the current visit (eProc shows it beside the name). */
function readPreviousLogin() {
  try {
    return JSON.parse(localStorage.getItem('bansal-crm:vendor-session') || 'null')?.previousLogin ?? null
  } catch {
    return null
  }
}

/* The vendor's bell: new works to bid on, every decision on its bids and answers to its questions. */
function VendorBell({ vendorId }) {
  const { tenders, bids, clarifications } = useCrm()
  const { open, setOpen, ref } = usePopover()
  const [seen, setSeen] = useState(() => readSeen(vendorId))
  const items = vendorNotices(vendorId, tenders, bids, clarifications)
  const unread = items.filter((i) => !seen.has(i.id)).length
  const markAllRead = () => {
    const next = new Set([...seen, ...items.map((i) => i.id)])
    setSeen(next)
    try {
      localStorage.setItem(seenKey(vendorId), JSON.stringify([...next]))
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
            <p className="search-empty">Nothing new. New works and news on your bids come here.</p>
          ) : (
            <ul>
              {items.slice(0, 12).map((item) => {
                const Icon = ICONS[item.tone] ?? Megaphone
                return (
                  <li key={item.id} className={`${item.tone} ${seen.has(item.id) ? '' : 'is-unread'}`}>
                    <Link to={item.to} onClick={() => setOpen(false)}>
                      <span className="note-icon">
                        <Icon size={15} />
                      </span>
                      <span>
                        <strong>{item.title}</strong>
                        <span className="muted">
                          {item.sub} · {formatNearDate(localDay(item.at))}
                        </span>
                      </span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}

/*
 * The vendor portal's frame, after eProc Rajasthan's bidder screens (account, documents, bid management) in the
 * CRM's own design: the same sidebar, top bar and page layout as the team's app.
 */
export function VendorLayout() {
  const { vendorId, vendors, tenders, bids, clarifications, savedTenders, leads, projectEdits, signOutVendor, settings } = useCrm()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [menuToggled, setMenuToggled] = useState(false)
  const [previousLogin] = useState(readPreviousLogin)
  const vendor = vendors.find((v) => v.id === vendorId)

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  useEffect(() => {
    const page = VENDOR_PAGES.filter(([path]) => pathname === path || pathname.startsWith(`${path}/`)).sort((a, b) => b[0].length - a[0].length)[0]
    document.title = `${pathname.startsWith('/vendor/tenders/') ? pathname.split('/').pop() : (page?.[1] ?? 'Home')} · Vendor Portal`
  }, [pathname])

  if (!vendor) return <Navigate to="/login" replace state={{ tab: 'vendor' }} />

  const mine = bids.filter((b) => b.vendorId === vendor.id)
  const openWorks = tenders.filter((t) => tenderPhase(t) === 'Open')
  const counts = {
    openWorks: openWorks.filter((t) => !mine.some((b) => b.tenderId === t.id)).length,
    activeBids: mine.filter((b) => LIVE_BID.includes(b.status)).length,
    saved: (savedTenders[vendor.id] ?? []).length,
    questions: clarifications.filter((c) => c.vendorId === vendor.id && !c.answer).length,
    ordersWaiting: vendorOrders(vendor, leads, projectEdits).filter((w) => ['start', 'deliver', 'bill'].includes(nextWorkStep(w)?.key)).length,
  }
  const nav = [
    { title: 'Overview', items: [{ label: 'Home', path: '/vendor', icon: Home, end: true }] },
    {
      title: 'My Account',
      items: [
        { label: 'My Account', path: '/vendor/account', icon: UserRound },
        { label: 'My Documents', path: '/vendor/documents', icon: FolderOpen },
      ],
    },
    {
      title: 'Bid Management',
      items: [
        { label: 'Active Tenders', path: '/vendor/tenders', icon: Search, badge: 'openWorks', badgeTone: 'is-info' },
        { label: 'My Tenders', path: '/vendor/my-tenders', icon: Bookmark, badge: 'saved', badgeTone: 'is-teal' },
        { label: 'My Active Bids', path: '/vendor/bids', icon: Gavel, badge: 'activeBids', badgeTone: 'is-attention' },
        { label: 'Clarification', path: '/vendor/clarifications', icon: MessageCircleQuestion, badge: 'questions', badgeTone: 'is-attention' },
        { label: 'Tender Status', path: '/vendor/status', icon: ListChecks },
        { label: 'My Bids History', path: '/vendor/history', icon: History },
        { label: 'My Withdrawn Bids', path: '/vendor/withdrawn', icon: Undo2 },
      ],
    },
    {
      title: 'My Work',
      items: [
        { label: 'Work Orders', path: '/vendor/orders', icon: HardHat, badge: 'ordersWaiting', badgeTone: 'is-urgent' },
        { label: 'Payments', path: '/vendor/payments', icon: IndianRupee },
      ],
    },
  ]

  return (
    <div className={`app-shell vendor-shell ${menuToggled ? 'menu-toggled' : ''}`}>
      <Sidebar
        nav={nav}
        counts={counts}
        expanded
        onNavigate={() => isSmallScreen() && setMenuToggled(false)}
        footer={
          <div className="vendor-help">
            <strong>Need help?</strong>
            <span>Our Accounts team, Mon–Sat</span>
            <a href={`tel:${settings.phone.replace(/\s/g, '')}`}>
              <Phone size={13} /> {settings.phone}
            </a>
            <a href={`mailto:${settings.email}`}>
              <Mail size={13} /> {settings.email}
            </a>
          </div>
        }
      />
      <div className="sidebar-backdrop" onClick={() => setMenuToggled(false)} />

      <div className="app-main">
        <header className="topbar">
          <button className="icon-button" onClick={() => setMenuToggled(!menuToggled)} aria-label="Toggle menu">
            <Menu size={20} />
          </button>
          <div className="vendor-topline">
            <strong>Vendor Portal</strong>
            <span className="muted">{previousLogin ? `Last login ${formatDateTime(previousLogin)}` : 'First sign-in'}</span>
          </div>
          <div className="topbar-right">
            <VendorBell vendorId={vendor.id} />
            <span className="user-chip is-static">
              <span className="avatar">{initialsOf(vendor.name)}</span>
              <span className="user-meta">
                <strong>{vendor.name}</strong>
                <span>{vendor.id}</span>
              </span>
            </span>
            <button
              className="icon-button"
              onClick={() => {
                signOutVendor()
                navigate('/login', { replace: true, state: { tab: 'vendor' } })
              }}
              aria-label="Sign out"
              title="Sign out"
            >
              <LogOut size={19} />
            </button>
          </div>
        </header>
        <main className="app-content">
          <div key={pathname} className="page-anim">
            <Outlet context={{ vendor }} />
          </div>
        </main>
        <footer className="app-footer">
          <span>© {new Date().getFullYear()} {settings.companyName}</span>
        </footer>
      </div>
    </div>
  )
}
