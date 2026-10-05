import React from 'react'
import { Route } from 'react-router-dom'
import { FieldDatabaseDashboard } from '../../modules/field-database/pages/FieldDatabaseDashboard'
import { FieldDatabaseSectionPage } from '../../modules/field-database/pages/FieldDatabaseSectionPage'

export const fieldDatabaseRoutes = (
  <>
    <Route path="field-database" element={<FieldDatabaseDashboard />} />
    <Route path="field-database/geological-mapping" element={<FieldDatabaseSectionPage sectionKey="geological-mapping" />} />
    <Route path="field-database/trench-mapping" element={<FieldDatabaseSectionPage sectionKey="trench-mapping" />} />
    <Route path="field-database/soil-sampling" element={<FieldDatabaseSectionPage sectionKey="soil-sampling" />} />
    <Route path="field-database/stream-sediment" element={<FieldDatabaseSectionPage sectionKey="stream-sediment" />} />
    <Route path="field-database/channel-sampling" element={<FieldDatabaseSectionPage sectionKey="channel-sampling" />} />
    <Route path="field-database/core-drilling-dpr" element={<FieldDatabaseSectionPage sectionKey="core-drilling-dpr" />} />
    <Route path="field-database/drill-core-logging" element={<FieldDatabaseSectionPage sectionKey="drill-core-logging" />} />
    <Route path="field-database/non-core-drilling-dpr" element={<FieldDatabaseSectionPage sectionKey="non-core-drilling-dpr" />} />
    <Route path="field-database/non-core-logging" element={<FieldDatabaseSectionPage sectionKey="non-core-logging" />} />
    <Route path="field-database/dispatch-database" element={<FieldDatabaseSectionPage sectionKey="dispatch-database" />} />
    <Route path="field-database/:sectionSlug" element={<FieldDatabaseSectionPage />} />
  </>
)
