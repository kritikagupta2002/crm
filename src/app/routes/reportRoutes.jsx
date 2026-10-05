import React from 'react'
import { Navigate, Route } from 'react-router-dom'
import { ReportsPage } from '../../modules/reports/pages/ReportsPage'

export const reportRoutes = (
  <>
    <Route path="erm-reports" element={<Navigate to="/reports?view=projects" replace />} />
    <Route path="reports" element={<ReportsPage />} />
  </>
)
