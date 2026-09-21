import { ArrowRight, CalendarPlus, ClipboardList, Eye, FileText } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { ActionMenu } from '../../components/common/ActionMenu'
import { StagePill } from '../../components/common/StagePill'
import { useAccess, useCrm } from '../../context/crm'
import { getRecentEnquiries } from '../../utils/dashboardStats'
import { formatDayMonth } from '../../utils/date'
import { RoleLink } from '../../components/common/RoleLink'

export function RecentEnquiries() {
  const enquiries = getRecentEnquiries(useCrm().leads)
  const navigate = useNavigate()
  const { can } = useAccess()
  const canLeads = can('/leads')

  return (
    <section className="card recent-card" id="recent-enquiries">
      <header className="card-header">
        <ClipboardList className="card-icon" size={22} strokeWidth={1.8} />
        <h2>Recent Enquiries</h2>
        <div className="card-actions">
          <RoleLink to="/leads" className="link-button" hideIfLocked>
            View all <ArrowRight size={15} />
          </RoleLink>
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
              <tr key={lead.id} className={canLeads ? 'clickable-row' : undefined} onClick={canLeads ? () => navigate(`/leads/${lead.id}`) : undefined}>
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
                  {canLeads && (
                    <ActionMenu
                      label={`Actions for ${lead.company}`}
                      items={[
                        { label: 'View details', icon: Eye, onSelect: () => navigate(`/leads/${lead.id}`) },
                        { label: 'Schedule follow-up', icon: CalendarPlus, onSelect: () => navigate(`/leads/${lead.id}?tab=activity`) },
                        ...(can('/quotations')
                          ? [
                              lead.quoteValue
                                ? { label: 'View quotation', icon: FileText, onSelect: () => navigate(`/quotations?open=${lead.id}`) }
                                : { label: 'Create quotation', icon: FileText, onSelect: () => navigate(`/quotations?new=${lead.id}`) },
                            ]
                          : []),
                      ]}
                    />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
