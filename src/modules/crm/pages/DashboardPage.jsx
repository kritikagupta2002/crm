import { Plus } from 'lucide-react'
import { ContourLines } from '../../../shared/components/ContourLines'
import { PeriodSwitch } from '../../../shared/components/PeriodSwitch'
import { useAccess, useCrm } from '../../../core/permissions/crm'
import { useEnquiryForm } from '../../../core/constants/enquiryForm'
import { PERIOD_LABELS, usePeriod } from '../../../core/constants/period'
import { TODAY } from '../data/mockData'
import { formatLongDate } from '../../../shared/utils/date'
import { AccountsExecutiveDashboard } from './AccountsExecutiveDashboard'
import { ConversionOverview } from '../components/dashboard/ConversionOverview'
import { ApprovalsGlance } from '../components/dashboard/ApprovalsGlance'
import { EnquiryTrend } from '../components/dashboard/EnquiryTrend'
import { LeadPipeline } from '../components/dashboard/LeadPipeline'
import { RecentEnquiries } from '../components/dashboard/RecentEnquiries'
import { ServiceMix } from '../components/dashboard/ServiceMix'
import { StatCards } from '../components/dashboard/StatCards'
import { UpcomingFollowUps } from '../components/dashboard/UpcomingFollowUps'
import '../components/dashboard/dashboard.css'

export function DashboardPage() {
  const { openEnquiryForm } = useEnquiryForm()
  const { period } = usePeriod()
  const { can, may } = useAccess()
  const { role } = useCrm()

  if (role === 'Accounts Executive') {
    return <AccountsExecutiveDashboard />
  }

  return (
    <div className="dashboard">
      <header className="page-header">
        <ContourLines className="page-contours" lines={12} />
        <div className="page-title">
          <h1>CRM Dashboard</h1>
          <p>
            {formatLongDate(TODAY)} · {PERIOD_LABELS[period].current}
          </p>
        </div>
        <div className="page-actions">
          <PeriodSwitch />
          {may('sales') && (
            <button className="btn btn-primary" onClick={openEnquiryForm}>
              <Plus size={17} /> Add New Enquiry
            </button>
          )}
        </div>
      </header>

      <StatCards />
      <div className="dash-row row-pipeline">
        <LeadPipeline />
        <ConversionOverview />
      </div>
      {/* Enquiries and their follow-ups are sales work: only for the roles that open them. */}
      {can('/leads') && (
        <div className="dash-row row-activity">
          <RecentEnquiries />
          <UpcomingFollowUps />
        </div>
      )}
      <ApprovalsGlance />
      <div className="dash-row row-insights">
        <EnquiryTrend />
        <ServiceMix />
      </div>
    </div>
  )
}
