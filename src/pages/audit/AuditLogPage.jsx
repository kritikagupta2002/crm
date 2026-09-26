import { Download, History, Search } from 'lucide-react'
import { useState } from 'react'
import { usePaged } from '../../components/common/Pager'
import { RoleLink } from '../../components/common/RoleLink'
import { ROLES, roleSlug, useCrm } from '../../context/crm'
import { TODAY } from '../../data/mockData'
import { seededInteractions } from '../../utils/clientHistory'
import { addDays, formatDayMonth, formatTime, toISODate } from '../../utils/date'
import { downloadCsv } from '../../utils/exportCsv'

const WHO_FILTERS = [...ROLES, 'Client', 'Vendor']
const PERIODS = { 7: 'Last 7 days', 30: 'Last 30 days', all: 'All time' }

const whenOf = (entry) => (entry.at ? `${formatDayMonth(entry.at.slice(0, 10))}, ${formatTime(`${new Date(entry.at).getHours()}:${new Date(entry.at).getMinutes()}`)}` : formatDayMonth(entry.date))

/*
 * Every change, with who made it and when (RBAC requirement: audit logs). Changes made in the app carry the
 * signed-in person and role, or the client / vendor on their portal. The demo's earlier history is shown
 * against the enquiry's owner.
 */
function buildEntries(leads, activities) {
  const byId = new Map(leads.map((l) => [l.id, l]))
  const logged = activities.map((a) => {
    const lead = byId.get(a.leadId)
    const actor = a.actor ?? { role: 'Unknown' }
    return {
      id: a.id,
      at: a.at,
      sort: a.at,
      who: actor.role === 'Client' ? lead?.contactPerson ?? 'Client' : actor.name ?? '—',
      role: actor.role,
      lead,
      text: a.text,
    }
  })
  const created = leads
    .filter((l) => l.createdBy)
    .map((l) => ({ id: `${l.id}-created`, at: l.createdAt, sort: l.createdAt ?? `${l.createdOn}T00:00`, who: l.createdBy.role === 'Client' ? l.contactPerson : l.createdBy.name, role: l.createdBy.role, lead: l, text: `Enquiry ${l.id} created${l.createdBy.role === 'Client' ? ' from the website' : ''}` }))
  const seeded = leads
    .filter((l) => !l.createdBy)
    .flatMap((l) =>
      seededInteractions(l).map((i, k) => ({
        id: i.id,
        date: i.date,
        sort: `${i.date}T00:00:${String(k).padStart(2, '0')}`,
        who: i.type === 'created' && /Website/.test(l.source ?? '') ? l.contactPerson : l.assignedTo,
        role: i.type === 'created' && /Website/.test(l.source ?? '') ? 'Client' : 'Employee',
        lead: l,
        text: i.text,
      })),
    )
  return [...logged, ...created, ...seeded].sort((a, b) => b.sort.localeCompare(a.sort))
}

export function AuditLogPage() {
  const { leads, activities } = useCrm()
  const [search, setSearch] = useState('')
  const [who, setWho] = useState('')
  const [period, setPeriod] = useState('30')

  const since = period === 'all' ? '' : toISODate(addDays(TODAY, -Number(period)))
  const q = search.trim().toLowerCase()
  const entries = buildEntries(leads, activities).filter(
    (e) => (!who || e.role === who) && (!since || e.sort.slice(0, 10) >= since) && (!q || `${e.who} ${e.text} ${e.lead?.company ?? ''} ${e.lead?.id ?? ''}`.toLowerCase().includes(q)),
  )
  const { rows, pager } = usePaged(entries, 15, `${q}|${who}|${period}`)
  // Enquiries created in the app are recorded on the enquiry itself, not in the activity log.
  const inApp = activities.filter((a) => a.actor).length + leads.filter((l) => l.createdBy).length

  return (
    <div className="module-page">
      <header className="page-header">
        <div className="page-title">
          <h1>Audit Log</h1>
          <p>{inApp ? `${inApp} changes made in the app, each with who made it` : 'Every change made in the app is recorded here with who made it'}</p>
        </div>
        <div className="page-actions">
          <button
            className="btn"
            onClick={() =>
              downloadCsv(
                `audit-log-${toISODate(TODAY)}.csv`,
                [
                  { label: 'When', value: (e) => e.at ?? e.date },
                  { label: 'Who', value: (e) => e.who },
                  { label: 'Role', value: (e) => e.role },
                  { label: 'Enquiry', value: (e) => e.lead?.id ?? '' },
                  { label: 'Client', value: (e) => e.lead?.company ?? '' },
                  { label: 'What', value: (e) => e.text },
                ],
                entries,
              )
            }
            disabled={entries.length === 0}
          >
            <Download size={16} /> Export CSV
          </button>
        </div>
      </header>

      <section className="card">
        <div className="leads-toolbar">
          <label className="toolbar-search">
            <Search size={16} className="muted" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search person, client or change" aria-label="Search the audit log" />
          </label>
          <select value={who} onChange={(e) => setWho(e.target.value)} aria-label="Role">
            <option value="">Everyone</option>
            {WHO_FILTERS.map((r) => (
              <option key={r}>{r}</option>
            ))}
          </select>
          <select value={period} onChange={(e) => setPeriod(e.target.value)} aria-label="Period">
            {Object.entries(PERIODS).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </div>
        {rows.length === 0 ? (
          <p className="empty-state">
            <History size={18} /> Nothing recorded for this filter.
          </p>
        ) : (
          <div className="table-wrap">
            <table className="data-table audit-table">
              <thead>
                <tr>
                  <th>When</th>
                  <th>Who</th>
                  <th>Client</th>
                  <th>What changed</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((e) => (
                  <tr key={e.id}>
                    <td className="nowrap">{whenOf(e)}</td>
                    <td>
                      <div className="cell-strong">{e.who}</div>
                      <span className={`pill role-pill role-pill-${roleSlug(e.role)} ${e.role === 'Client' ? 'tone-info' : e.role === 'Vendor' ? 'tone-attention' : ''}`}>{e.role}</span>
                    </td>
                    <td>
                      {e.lead ? (
                        <>
                          <RoleLink to={`/leads/${e.lead.id}`} className="cell-strong cell-link">
                            {e.lead.company}
                          </RoleLink>
                          <div className="cell-sub">{e.lead.id}</div>
                        </>
                      ) : (
                        <span className="muted">—</span>
                      )}
                    </td>
                    <td className="audit-what">{e.text}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {pager}
      </section>
    </div>
  )
}
