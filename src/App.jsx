import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { EnquiryFormProvider } from './components/enquiry/EnquiryFormProvider'
import { AppLayout } from './components/layout/AppLayout'
import { CrmProvider } from './context/CrmProvider'
import { PeriodProvider } from './context/PeriodProvider'
import { ClientsPage } from './pages/clients/ClientsPage'
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
              <Route element={<AppLayout />}>
                <Route index element={<DashboardPage />} />
                <Route path="leads" element={<LeadsPage />} />
                <Route path="leads/:leadId" element={<LeadDetailsPage />} />
                <Route path="follow-ups" element={<FollowUpsPage />} />
                <Route path="quotations" element={<QuotationsPage />} />
                <Route path="client-approval" element={<ClientApprovalPage />} />
                <Route path="client-onboarding" element={<OnboardingPage />} />
                <Route path="clients" element={<ClientsPage />} />
                <Route path="reports" element={<ReportsPage />} />
                <Route path="settings" element={<SettingsPage />} />
                <Route path="*" element={<ComingSoonPage />} />
              </Route>
            </Routes>
          </EnquiryFormProvider>
        </BrowserRouter>
      </PeriodProvider>
    </CrmProvider>
  )
}
