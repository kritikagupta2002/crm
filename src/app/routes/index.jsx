import React from 'react'
import { Route, Routes } from 'react-router-dom'
import { LoginPage } from '../../core/auth/LoginPage'
import { AppLayout } from '../../shared/layout/AppLayout'
import { ComingSoonPage } from '../../shared/components/ComingSoonPage'
import { hrmsRoutes } from '../../hrms/HrmsRoutes'
import { crmRoutes } from './crmRoutes'
import { ermRoutes } from './ermRoutes'
import { documentRoutes } from './documentRoutes'
import { inventoryRoutes } from './inventoryRoutes'
import { fieldDatabaseRoutes } from './fieldDatabaseRoutes'
import { reportRoutes } from './reportRoutes'
import { vendorRoutes } from './vendorRoutes'
import { coreRoutes } from './coreRoutes'
import { portalRoutes } from './portalRoutes'

export function AppRoutes() {
  return (
    <Routes>
      <Route path="login" element={<LoginPage />} />
      {portalRoutes}
      <Route element={<AppLayout />}>
        {crmRoutes}
        {ermRoutes}
        {documentRoutes}
        {inventoryRoutes}
        {reportRoutes}
        {coreRoutes}
        {vendorRoutes}
        {fieldDatabaseRoutes}
        {hrmsRoutes}
        <Route path="*" element={<ComingSoonPage />} />
      </Route>
    </Routes>
  )
}
