import { Mail, MessageCircle, Paperclip, Search, Send } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { usePaged } from '../../components/common/Pager'
import { RoleLink } from '../../components/common/RoleLink'
import { useAccess, useCrm } from '../../context/crm'
import { formatDayMonth, formatTime } from '../../utils/date'
import { seededMessages } from '../../utils/seededMessages'

const AUDIENCES = { all: 'Everyone', client: 'Clients', field: 'Field team', vendor: 'Vendors' }
const CHANNEL = {
  whatsapp: { label: 'WhatsApp', icon: MessageCircle },
  email: { label: 'Email', icon: Mail },
}

const whenOf = (iso) => {
  const d = new Date(iso)
  return `${formatDayMonth(iso.slice(0, 10))}, ${formatTime(`${d.getHours()}:${d.getMinutes()}`)}`
}

/*
 * Every message the automations sent (Settings → Automations): who got it, on which channel, and what it said.
 * Demo: the messages are recorded here; the live system sends them through the WhatsApp Business API and email.
 */
export function MessagesPage() {
  const { outbox, leads } = useCrm()
  const { can } = useAccess()
  const [audience, setAudience] = useState('all')
  const [search, setSearch] = useState('')

  // What went out before the demo was opened, then everything sent in the app.
  const past = useMemo(() => seededMessages(), [])
  const q = search.trim().toLowerCase()
  const all = [...past, ...outbox].sort((a, b) => b.at.localeCompare(a.at))
  const count = (key) => (key === 'all' ? all.length : all.filter((m) => m.to.audience === key).length)
  const visible = all.filter((m) => (audience === 'all' || m.to.audience === audience) && (!q || `${m.to.name} ${m.subject} ${m.text}`.toLowerCase().includes(q)))
  const { rows, pager } = usePaged(visible, 12, `${audience}|${q}`)
  const by = (channel) => all.filter((m) => m.channels.includes(channel)).length

  return (
    <div className="module-page">
      <header className="page-header">
        <div className="page-title">
          <h1>Sent messages</h1>
          <p>{all.length ? `${all.length} sent automatically · ${by('whatsapp')} on WhatsApp · ${by('email')} by email` : 'Messages the automations send appear here'}</p>
        </div>
      </header>

      <section className="card">
        <nav className="stage-tabs" aria-label="Filter by recipient">
          {Object.entries(AUDIENCES).map(([key, label]) => (
            <button key={key} className={`stage-tab ${audience === key ? 'is-active' : ''}`} onClick={() => setAudience(key)} aria-pressed={audience === key}>
              {label}
              <span>{count(key)}</span>
            </button>
          ))}
        </nav>
        <div className="leads-toolbar">
          <label className="toolbar-search">
            <Search size={16} className="muted" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search person or message" aria-label="Search sent messages" />
          </label>
        </div>

        {rows.length === 0 ? (
          <p className="empty-state">
            <Send size={18} /> {all.length ? 'No messages for this filter.' : 'No messages yet. They go out on their own when a letter is filed, a quotation is sent, a payment is verified or a task is assigned.'}
          </p>
        ) : (
          <div className="table-wrap">
            <table className="data-table messages-table">
              <thead>
                <tr>
                  <th>When</th>
                  <th>To</th>
                  <th>Message</th>
                  <th>Client</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((m) => {
                  const lead = leads.find((l) => l.id === m.leadId)
                  return (
                    <tr key={m.id}>
                      <td className="nowrap">{whenOf(m.at)}</td>
                      <td>
                        <div className="cell-strong">{m.to.name}</div>
                        <div className="message-via">
                          {m.channels.map((c) => {
                            const Icon = CHANNEL[c].icon
                            return (
                              <span key={c} className={`pill via-pill via-${c}`}>
                                <Icon size={12} /> {CHANNEL[c].label}
                              </span>
                            )
                          })}
                        </div>
                      </td>
                      <td className="message-body">
                        <div className="cell-strong">{m.subject}</div>
                        <p>{m.text}</p>
                        {m.attachment && (
                          <span className="message-attachment">
                            <Paperclip size={12} /> {m.attachment}
                          </span>
                        )}
                      </td>
                      <td>
                        {lead ? (
                          <>
                            <RoleLink to={`/leads/${lead.id}?tab=activity`} className="cell-strong cell-link">
                              {lead.company}
                            </RoleLink>
                            <div className="cell-sub">{lead.id}</div>
                          </>
                        ) : (
                          <span className="muted">—</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
        {pager}
        <p className="muted small messages-note">
          Demo: messages are recorded here, not sent. The live system sends them through the WhatsApp Business API and the mail server.{' '}
          {can('/settings') ? (
            <>
              Choose what goes out in <Link to="/settings">Settings → Automations</Link>.
            </>
          ) : (
            'The Admin chooses what goes out.'
          )}
        </p>
      </section>
    </div>
  )
}
