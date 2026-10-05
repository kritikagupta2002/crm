import React from 'react'
import { Route } from 'react-router-dom'
import { DocumentsPage } from '../../modules/documents/pages/DocumentsPage'
import { ScanInboxPage } from '../../modules/documents/pages/ScanInboxPage'
import { DispatchRegisterPage } from '../../modules/documents/pages/DispatchRegisterPage'

export const documentRoutes = (
  <>
    <Route path="documents" element={<DocumentsPage />} />
    <Route path="documents/scan-inbox" element={<ScanInboxPage />} />
    <Route path="documents/dispatch" element={<DispatchRegisterPage />} />
  </>
)
