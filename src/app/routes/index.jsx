import React from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { LoginPage } from '../../core/auth/LoginPage'
import { AppLayout } from '../../shared/layout/AppLayout'
import { hrmsRoutes } from '../../hrms/HrmsRoutes'

export function AppRoutes() {
  return (
    <Routes>
      <Route path="login" element={<LoginPage />} />
      <Route element={<AppLayout />}>
        {hrmsRoutes}
        <Route path="settings" element={<Navigate to="/hr/settings" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
