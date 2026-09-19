import { Plus } from 'lucide-react'
import { ContourLines } from '../../components/common/ContourLines'
import { PeriodSwitch } from '../../components/common/PeriodSwitch'
import { useEnquiryForm } from '../../context/enquiryForm'
import { PERIOD_LABELS, usePeriod } from '../../context/period'
import { TODAY } from '../../data/mockData'
import { formatLongDate } from '../../utils/date'
import { ConversionOverview } from './ConversionOverview'
import { EnquiryTrend } from './EnquiryTrend'
import { LeadPipeline } from './LeadPipeline'
import { RecentEnquiries } from './RecentEnquiries'
import { ServiceMix } from './ServiceMix'
import { StatCards } from './StatCards'
import { UpcomingFollowUps } from './UpcomingFollowUps'
import './dashboard.css'

export function DashboardPage() {
  const { openEnquiryForm } = useEnquiryForm()
  const { period } = usePeriod()

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
          <button className="btn btn-primary" onClick={openEnquiryForm}>
            <Plus size={17} /> Add New Enquiry
          </button>
        </div>
      </header>

      <StatCards />
      <div className="dash-row row-pipeline">
        <LeadPipeline />
        <ConversionOverview />
      </div>
      <div className="dash-row row-activity">
        <RecentEnquiries />
        <UpcomingFollowUps />
      </div>
      <div className="dash-row row-insights">
        <EnquiryTrend />
        <ServiceMix />
      </div>
    </div>
  )
}
