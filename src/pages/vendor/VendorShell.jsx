import { Award, Bell, LogOut, Megaphone, Star, XCircle } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Logo } from '../../components/common/Logo'
import { usePopover } from '../../components/common/usePopover'
import { useCrm } from '../../context/crm'
import { formatNearDate } from '../../utils/date'
import { localDay, vendorNotices } from '../../utils/tenders'

const ICONS = { 'tone-info': Megaphone, 'tone-attention': Star, 'tone-good': Award, 'tone-urgent': XCircle, 'tone-neutral': XCircle }

const seenKey = (vendorId) => `bansal-crm:vendor-seen:${vendorId}`

function readSeen(vendorId) {
  try {
    return new Set(JSON.parse(localStorage.getItem(seenKey(vendorId)) || '[]'))
  } catch {
    return new Set()
  }
}

/* The vendor's bell: new works to bid on and every decision on its bids (they also get these by email/WhatsApp). */
function VendorBell({ vendorId }) {
  const { tenders, bids } = useCrm()
  const { open, setOpen, ref } = usePopover()
  const [seen, setSeen] = useState(() => readSeen(vendorId))
  const items = vendorNotices(vendorId, tenders, bids)
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

/* The vendor portal's top bar: logo, the bell and sign out. Shared by the portal and the tender pages. */
export function VendorTop({ vendorId }) {
  const { signOutVendor } = useCrm()
  const navigate = useNavigate()
  return (
    <header className="portal-top">
      <div className="portal-top-inner">
        <Link to="/vendor" className="portal-brand">
          <Logo />
          <span className="portal-tag">Vendor Portal</span>
        </Link>
        <div className="portal-top-actions">
          <VendorBell vendorId={vendorId} />
          <button
            className="btn"
            onClick={() => {
              signOutVendor()
              navigate('/login', { replace: true, state: { tab: 'vendor' } })
            }}
            aria-label="Sign out"
          >
            <LogOut size={15} /> <span className="hide-sm">Sign out</span>
          </button>
        </div>
      </div>
    </header>
  )
}
