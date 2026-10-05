import React from 'react'
import { Route } from 'react-router-dom'
import { ClientPortalPage } from '../../modules/portals/client/pages/ClientPortalPage'
import { VendorLayout } from '../../modules/portals/vendor/pages/VendorShell'
import { VendorAccountPage, VendorDocumentsPage, VendorHomePage } from '../../modules/portals/vendor/pages/VendorAccountPages'
import { VendorActiveBidsPage, VendorBidsHistoryPage, VendorClarificationsPage, VendorMyTendersPage, VendorSearchTendersPage, VendorTenderStatusPage } from '../../modules/portals/vendor/pages/VendorBidPages'
import { VendorOrdersPage, VendorPaymentsPage } from '../../modules/portals/vendor/pages/VendorWorkPages'
import { VendorRegisterPage } from '../../modules/portals/vendor/pages/VendorRegisterPage'
import { VendorTenderPage } from '../../modules/portals/vendor/pages/VendorTenderPage'
import { PublicEnquiryPage } from '../../modules/crm/pages/PublicEnquiryPage'

export const portalRoutes = (
  <>
    <Route path="portal" element={<ClientPortalPage />} />
    <Route path="vendor" element={<VendorLayout />}>
      <Route index element={<VendorHomePage />} />
      <Route path="account" element={<VendorAccountPage />} />
      <Route path="documents" element={<VendorDocumentsPage />} />
      <Route path="tenders" element={<VendorSearchTendersPage />} />
      <Route path="tenders/:tenderId" element={<VendorTenderPage />} />
      <Route path="my-tenders" element={<VendorMyTendersPage />} />
      <Route path="bids" element={<VendorActiveBidsPage />} />
      <Route path="clarifications" element={<VendorClarificationsPage />} />
      <Route path="status" element={<VendorTenderStatusPage />} />
      <Route path="history" element={<VendorBidsHistoryPage />} />
      <Route path="withdrawn" element={<VendorBidsHistoryPage withdrawn />} />
      <Route path="orders" element={<VendorOrdersPage />} />
      <Route path="payments" element={<VendorPaymentsPage />} />
    </Route>
    <Route path="vendor/register" element={<VendorRegisterPage />} />
    <Route path="enquiry" element={<PublicEnquiryPage />} />
  </>
)
