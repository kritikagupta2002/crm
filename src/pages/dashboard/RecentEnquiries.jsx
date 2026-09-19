import { ArrowRight, CalendarPlus, ClipboardList, Eye, FileText, MoreHorizontal } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { StagePill } from '../../components/common/StagePill'
import { useCrm } from '../../context/crm'
import { getRecentEnquiries } from '../../utils/dashboardStats'
import { formatDayMonth } from '../../utils/date'

function RowMenu({ label }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    const close = (event) => {
      if (!ref.current?.contains(event.target)) setOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [open])

  return (
    <div className="row-menu" ref={ref}>
      <button className="icon-button small" aria-label={`Actions for ${label}`} aria-expanded={open} onClick={() => setOpen(!open)}>
        <MoreHorizontal size={16} />
      </button>
      {open && (
        <div className="row-menu-list" role="menu">
          <button role="menuitem" onClick={() => setOpen(false)}>
            <Eye size={15} /> View details
          </button>
          <button role="menuitem" onClick={() => setOpen(false)}>
            <CalendarPlus size={15} /> Schedule follow-up
          </button>
          <button role="menuitem" onClick={() => setOpen(false)}>
            <FileText size={15} /> Create proposal
          </button>
        </div>
      )}
    </div>
  )
}

export function RecentEnquiries() {
  const enquiries = getRecentEnquiries(useCrm().leads)

  return (
    <section className="card recent-card" id="recent-enquiries">
      <header className="card-header">
        <ClipboardList className="card-icon" size={22} strokeWidth={1.8} />
        <h2>Recent Enquiries</h2>
        <div className="card-actions">
          <Link to="/leads" className="link-button">
            View all <ArrowRight size={15} />
          </Link>
        </div>
      </header>

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Enquiry ID</th>
              <th>Client / Company</th>
              <th>Service Required</th>
              <th>Assigned To</th>
              <th>Status</th>
              <th>Follow-up</th>
              <th className="align-center">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {enquiries.map((lead) => (
              <tr key={lead.id}>
                <td className="mono">{lead.id}</td>
                <td>
                  <div className="cell-strong">{lead.company}</div>
                  <div className="cell-sub">{lead.contactPerson}</div>
                </td>
                <td>{lead.serviceDetail}</td>
                <td className="nowrap">{lead.assignedTo}</td>
                <td>
                  <StagePill stage={lead.stage} />
                </td>
                <td className="nowrap">{lead.nextFollowUp ? formatDayMonth(lead.nextFollowUp) : <span className="muted">—</span>}</td>
                <td className="align-center">
                  <RowMenu label={lead.id} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
