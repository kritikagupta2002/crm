import React from 'react'
import { Route } from 'react-router-dom'
import { VendorApplicationsPage } from '../../modules/vendors/pages/VendorApplicationsPage'
import { TendersPage } from '../../modules/vendors/pages/TendersPage'

export const vendorRoutes = (
  <>
    <Route path="vendor-applications" element={<VendorApplicationsPage />} />
    <Route path="tenders" element={<TendersPage />} />
  </>
)
