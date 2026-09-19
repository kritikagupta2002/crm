import { ArrowDown, ArrowUp, CalendarPlus, CheckCircle2, ChevronLeft, ChevronRight, Eye, XCircle } from 'lucide-react'
import { useState } from 'react'
import { ActionMenu } from '../../components/common/ActionMenu'
import { StagePill } from '../../components/common/StagePill'
import { TODAY } from '../../data/mockData'
import { formatDayMonth, toISODate } from '../../utils/date'
import { leadAgeDays, sortLeads } from '../../utils/leads'
import { useMoney } from '../../context/crm'

const PAGE_SIZES = [10, 15, 25, 50]
const todayISO = toISODate(TODAY)

function SortHeader({ label, sortKey, sort, onSort }) {
  const active = sort.key === sortKey
  const Icon = sort.direction === 'asc' ? ArrowUp : ArrowDown
  return (
    <th aria-sort={active ? (sort.direction === 'asc' ? 'ascending' : 'descending') : 'none'}>
      <button className={`sort-button ${active ? 'is-active' : ''}`} onClick={() => onSort(sortKey)}>
        {label}
        {active && <Icon size={13} />}
      </button>
    </th>
  )
}

function FollowUpCell({ date }) {
  if (!date) return <span className="muted">—</span>
  const tone = date < todayISO ? 'tone-urgent' : date === todayISO ? 'tone-attention' : ''
  return <span className={`follow-date ${tone}`}>{date === todayISO ? 'Today' : formatDayMonth(date)}</span>
}

function ageLabel(lead) {
  const days = leadAgeDays(lead)
  return days === 0 ? 'Today' : days === 1 ? 'Yesterday' : `${days} days ago`
}

/* 1 … 4 5 6 … 12 — first, last and the pages around the current one. */
function pageList(current, count) {
  const pages = []
  for (let p = 0; p < count; p++) {
    if (p === 0 || p === count - 1 || Math.abs(p - current) <= 1) pages.push(p)
    else if (pages[pages.length - 1] !== '…') pages.push('…')
  }
  return pages
}

/*
 * Parent passes a `key` built from the filters, so paging restarts whenever the filters change.
 * Rows-per-page lives in the parent so it survives those restarts.
 */
export function LeadsTable({ leads, pageSize, onPageSizeChange, onOpen, onScheduleFollowUp, onMarkWon, onMarkLost }) {
  const money = useMoney()
  const [sort, setSort] = useState({ key: 'date', direction: 'desc' })
  const [page, setPage] = useState(0)

  const sorted = sortLeads(leads, sort.key, sort.direction)
  const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize))
  const current = Math.min(page, pageCount - 1)
  const rows = sorted.slice(current * pageSize, (current + 1) * pageSize)

  const onSort = (key) => {
    setSort((prev) => ({ key, direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc' }))
    setPage(0)
  }

  if (leads.length === 0) {
    return <p className="empty-state">No leads match these filters.</p>
  }

  return (
    <>
      <div className="table-wrap">
        <table className="data-table leads-table">
          <thead>
            <tr>
              <SortHeader label="Client / Company" sortKey="company" sort={sort} onSort={onSort} />
              <th>Service</th>
              <SortHeader label="Location" sortKey="location" sort={sort} onSort={onSort} />
              <SortHeader label="Quotation" sortKey="quote" sort={sort} onSort={onSort} />
              <th>Assigned</th>
              <th>Stage</th>
              <SortHeader label="Received" sortKey="date" sort={sort} onSort={onSort} />
              <SortHeader label="Follow-up" sortKey="followUp" sort={sort} onSort={onSort} />
              <th className="align-center">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((lead) => {
              const [district, state] = (lead.location ?? '').split(',').map((part) => part.trim())
              const isClosed = lead.stage === 'Won' || lead.stage === 'Lost'
              return (
                <tr key={lead.id} className="clickable-row" onClick={() => onOpen(lead.id)}>
                  <td>
                    {/* A real button so the row can be opened from the keyboard; its click bubbles to the row. */}
                    <button className="row-link">{lead.company}</button>
                    <div className="cell-sub mono-sub" title={lead.contactPerson}>
                      {lead.id}
                    </div>
                  </td>
                  <td>
                    <div className="cell-clip" title={`${lead.serviceDetail} — ${lead.service}`}>
                      {lead.serviceDetail}
                    </div>
                  </td>
                  <td className="nowrap">
                    {lead.location ? (
                      <>
                        <div className="cell-strong-soft">{state || district}</div>
                        {state && <div className="cell-sub">{district}</div>}
                      </>
                    ) : (
                      <span className="muted">—</span>
                    )}
                  </td>
                  <td className="nowrap">{lead.quoteValue ? <b className="text-ink">{money.short(lead.quoteValue)}</b> : <span className="muted">—</span>}</td>
                  <td className="nowrap">{lead.assignedTo}</td>
                  <td>
                    <StagePill stage={lead.stage} />
                  </td>
                  <td className="nowrap">
                    <div className="cell-strong-soft">{formatDayMonth(lead.createdOn)}</div>
                    <div className="cell-sub">{ageLabel(lead)}</div>
                  </td>
                  <td className="nowrap">
                    <FollowUpCell date={lead.nextFollowUp} />
                  </td>
                  <td className="align-center">
                    <ActionMenu
                      label={`Actions for ${lead.company}`}
                      items={[
                        { label: 'View details', icon: Eye, onSelect: () => onOpen(lead.id) },
                        ...(isClosed
                          ? []
                          : [
                              { label: 'Schedule follow-up', icon: CalendarPlus, onSelect: () => onScheduleFollowUp(lead.id) },
                              { label: 'Mark as Won', icon: CheckCircle2, onSelect: () => onMarkWon(lead.id), tone: 'good' },
                              { label: 'Mark as Lost', icon: XCircle, onSelect: () => onMarkLost(lead.id), tone: 'danger' },
                            ]),
                      ]}
                    />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="pager">
        <span className="muted">
          Showing {current * pageSize + 1}–{Math.min((current + 1) * pageSize, sorted.length)} of {sorted.length}
        </span>
        <nav className="pager-buttons" aria-label="Pages">
          <button className="page-button" onClick={() => setPage(current - 1)} disabled={current === 0} aria-label="Previous page">
            <ChevronLeft size={16} />
          </button>
          {pageList(current, pageCount).map((p, i) =>
            p === '…' ? (
              <span key={`gap-${i}`} className="page-gap">
                …
              </span>
            ) : (
              <button key={p} className={`page-button ${p === current ? 'is-current' : ''}`} onClick={() => setPage(p)} aria-current={p === current ? 'page' : undefined}>
                {p + 1}
              </button>
            ),
          )}
          <button className="page-button" onClick={() => setPage(current + 1)} disabled={current >= pageCount - 1} aria-label="Next page">
            <ChevronRight size={16} />
          </button>
        </nav>
        <select
          className="page-size"
          value={pageSize}
          onChange={(e) => {
            onPageSizeChange(Number(e.target.value))
            setPage(0)
          }}
          aria-label="Rows per page"
        >
          {PAGE_SIZES.map((size) => (
            <option key={size} value={size}>
              {size} per page
            </option>
          ))}
        </select>
      </div>
    </>
  )
}
