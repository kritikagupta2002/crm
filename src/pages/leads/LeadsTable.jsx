import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight } from 'lucide-react'
import { useState } from 'react'
import { StagePill } from '../../components/common/StagePill'
import { TODAY } from '../../data/mockData'
import { formatDayMonth, toISODate } from '../../utils/date'
import { formatINR } from '../../utils/format'
import { leadAgeDays, sortLeads } from '../../utils/leads'

const PAGE_SIZE = 15
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

/* Parent passes a `key` built from the filters, so paging restarts whenever the filters change. */
export function LeadsTable({ leads, onOpen }) {
  const [sort, setSort] = useState({ key: 'id', direction: 'desc' })
  const [page, setPage] = useState(0)

  const sorted = sortLeads(leads, sort.key, sort.direction)
  const pageCount = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE))
  const current = Math.min(page, pageCount - 1)
  const rows = sorted.slice(current * PAGE_SIZE, (current + 1) * PAGE_SIZE)

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
              <SortHeader label="Enquiry ID" sortKey="id" sort={sort} onSort={onSort} />
              <SortHeader label="Client / Company" sortKey="company" sort={sort} onSort={onSort} />
              <th>Service</th>
              <SortHeader label="Quotation" sortKey="quote" sort={sort} onSort={onSort} />
              <th>Assigned To</th>
              <th>Stage</th>
              <SortHeader label="Next Follow-up" sortKey="followUp" sort={sort} onSort={onSort} />
              <SortHeader label="Age" sortKey="age" sort={sort} onSort={onSort} />
            </tr>
          </thead>
          <tbody>
            {rows.map((lead) => (
              <tr key={lead.id} className="clickable-row" onClick={() => onOpen(lead.id)}>
                <td className="mono">{lead.id}</td>
                <td>
                  {/* A real button so the row can be opened from the keyboard; its click bubbles to the row. */}
                  <button className="row-link">{lead.company}</button>
                  <div className="cell-sub">{lead.contactPerson}</div>
                </td>
                <td>
                  <div className="cell-strong-soft">{lead.serviceDetail}</div>
                  <div className="cell-sub">{lead.service}</div>
                </td>
                <td className="nowrap">{lead.quoteValue ? <b className="text-ink">{formatINR(lead.quoteValue)}</b> : <span className="muted">—</span>}</td>
                <td className="nowrap">{lead.assignedTo}</td>
                <td>
                  <StagePill stage={lead.stage} />
                </td>
                <td className="nowrap">
                  <FollowUpCell date={lead.nextFollowUp} />
                </td>
                <td className="nowrap muted">{leadAgeDays(lead)}d</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="pager">
        <span className="muted">
          Showing {current * PAGE_SIZE + 1}–{Math.min((current + 1) * PAGE_SIZE, sorted.length)} of {sorted.length}
        </span>
        <div className="pager-buttons">
          <button className="icon-button" onClick={() => setPage(current - 1)} disabled={current === 0} aria-label="Previous page">
            <ChevronLeft size={18} />
          </button>
          <span>
            {current + 1} / {pageCount}
          </span>
          <button className="icon-button" onClick={() => setPage(current + 1)} disabled={current >= pageCount - 1} aria-label="Next page">
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
    </>
  )
}
