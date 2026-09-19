import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { EnquiryFormProvider } from './components/enquiry/EnquiryFormProvider'
import { AppLayout } from './components/layout/AppLayout'
import { CrmProvider } from './context/CrmProvider'
import { PeriodProvider } from './context/PeriodProvider'
import { ComingSoonPage } from './pages/ComingSoonPage'
import { DashboardPage } from './pages/dashboard/DashboardPage'
import { LeadsPage } from './pages/leads/LeadsPage'

export default function App() {
  return (
    <CrmProvider>
      <PeriodProvider>
        <EnquiryFormProvider>
          <BrowserRouter>
            <Routes>
              <Route element={<AppLayout />}>
                <Route index element={<DashboardPage />} />
                <Route path="leads" element={<LeadsPage />} />
                <Route path="*" element={<ComingSoonPage />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </EnquiryFormProvider>
      </PeriodProvider>
    </CrmProvider>
  )
}
