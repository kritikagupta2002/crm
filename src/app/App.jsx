import React from 'react'
import { BrowserRouter } from 'react-router-dom'
import { AppProviders } from './providers/AppProviders'
import { EnquiryFormProvider } from '../modules/crm/components/enquiry/EnquiryFormProvider'
import { AppRoutes } from './routes/index'
import '../shared/styles/modules.css'

export default function App() {
  return (
    <AppProviders>
      <BrowserRouter>
        {/* Inside the router so saving a new enquiry can open its details page. */}
        <EnquiryFormProvider>
          <AppRoutes />
        </EnquiryFormProvider>
      </BrowserRouter>
    </AppProviders>
  )
}
