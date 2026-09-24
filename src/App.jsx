import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { EnquiryFormProvider } from './components/enquiry/EnquiryFormProvider'
import { AppLayout } from './components/layout/AppLayout'
import { LoginPage } from './pages/auth/LoginPage'
import { PublicEnquiryPage } from './pages/enquiry/PublicEnquiryPage'
import { ClientPortalPage } from './pages/portal/ClientPortalPage'
import { VendorPortalPage } from './pages/vendor/VendorPortalPage'
import { AuditLogPage } from './pages/audit/AuditLogPage'
import { MessagesPage } from './pages/messages/MessagesPage'
import { QuestionsPage } from './pages/questions/QuestionsPage'
import { CrmProvider } from './context/CrmProvider'
import { PeriodProvider } from './context/PeriodProvider'
import { ClientsPage } from './pages/clients/ClientsPage'
import { ErmDashboard } from './pages/erm/ErmDashboard'
import { SubcontractsPage } from './pages/erm/SubcontractsPage'
import { MyTasksPage } from './pages/erm/MyTasksPage'
import { TasksPage } from './pages/erm/TasksPage'
import { TeamPage } from './pages/erm/TeamPage'
import { ProjectDetailPage } from './pages/projects/ProjectDetailPage'
import { ProjectsPage } from './pages/projects/ProjectsPage'
import { ComingSoonPage } from './pages/ComingSoonPage'
import { DashboardPage } from './pages/dashboard/DashboardPage'
import { LeadDetailsPage } from './pages/leads/LeadDetailsPage'
import { FollowUpsPage } from './pages/followups/FollowUpsPage'
import { LeadsPage } from './pages/leads/LeadsPage'
import { QuotationsPage } from './pages/quotations/QuotationsPage'
import { ReportsPage } from './pages/reports/ReportsPage'
import { SettingsPage } from './pages/settings/SettingsPage'
import { ClientApprovalPage } from './pages/workflow/ClientApprovalPage'
import { OnboardingPage } from './pages/workflow/OnboardingPage'
import './styles/modules.css'

export default function App() {
  return (
    <CrmProvider>
      <PeriodProvider>
        <BrowserRouter>
          {/* Inside the router so saving a new enquiry can open its details page. */}
          <EnquiryFormProvider>
            <Routes>
              <Route path="login" element={<LoginPage />} />
              <Route path="portal" element={<ClientPortalPage />} />
              <Route path="vendor" element={<VendorPortalPage />} />
              <Route path="enquiry" element={<PublicEnquiryPage />} />
              <Route element={<AppLayout />}>
                <Route index element={<DashboardPage />} />
                <Route path="leads" element={<LeadsPage />} />
                <Route path="leads/:leadId" element={<LeadDetailsPage />} />
                <Route path="follow-ups" element={<FollowUpsPage />} />
                <Route path="quotations" element={<QuotationsPage />} />
                <Route path="client-approval" element={<ClientApprovalPage />} />
                <Route path="client-onboarding" element={<OnboardingPage />} />
                <Route path="clients" element={<ClientsPage />} />
                <Route path="erm" element={<ErmDashboard />} />
                <Route path="projects" element={<ProjectsPage />} />
                <Route path="projects/:projectId" element={<ProjectDetailPage />} />
                <Route path="tasks" element={<TasksPage />} />
                <Route path="my-tasks" element={<MyTasksPage />} />
                <Route path="team" element={<TeamPage />} />
                <Route path="letters" element={<Navigate to="/projects?letters=To%20share" replace />} />
                <Route path="subcontracts" element={<SubcontractsPage />} />
                <Route path="work-orders" element={<Navigate to="/subcontracts" replace />} />
                <Route path="erm-reports" element={<Navigate to="/reports?view=projects" replace />} />
                <Route path="reports" element={<ReportsPage />} />
                <Route path="settings" element={<SettingsPage />} />
                <Route path="audit-log" element={<AuditLogPage />} />
                <Route path="messages" element={<MessagesPage />} />
                <Route path="questions" element={<QuestionsPage />} />
                <Route path="*" element={<ComingSoonPage />} />
              </Route>
            </Routes>
          </EnquiryFormProvider>
        </BrowserRouter>
      </PeriodProvider>
    </CrmProvider>
  )
}
