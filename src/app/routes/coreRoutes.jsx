import React from 'react'
import { Route } from 'react-router-dom'
import { SettingsPage } from '../../core/settings/SettingsPage'
import { AuditLogPage } from '../../core/audit/AuditLogPage'
import { MessagesPage } from '../../core/messages/MessagesPage'

export const coreRoutes = (
  <>
    <Route path="settings" element={<SettingsPage />} />
    <Route path="audit-log" element={<AuditLogPage />} />
    <Route path="messages" element={<MessagesPage />} />
  </>
)
