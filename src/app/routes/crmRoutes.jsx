import React from 'react'
import { Route } from 'react-router-dom'
import { DashboardPage } from '../../modules/crm/pages/DashboardPage'
import { LeadsPage } from '../../modules/crm/pages/LeadsPage'
import { LeadDetailsPage } from '../../modules/crm/pages/LeadDetailsPage'
import { FollowUpsPage } from '../../modules/crm/pages/FollowUpsPage'
import { QuotationsPage } from '../../modules/crm/pages/QuotationsPage'
import { ClientApprovalPage } from '../../modules/crm/pages/ClientApprovalPage'
import { OnboardingPage } from '../../modules/crm/pages/OnboardingPage'
import { ClientsPage } from '../../modules/crm/pages/ClientsPage'
import { QuestionsPage } from '../../modules/crm/pages/QuestionsPage'

export const crmRoutes = (
  <>
    <Route index element={<DashboardPage />} />
    <Route path="leads" element={<LeadsPage />} />
    <Route path="leads/:leadId" element={<LeadDetailsPage />} />
    <Route path="follow-ups" element={<FollowUpsPage />} />
    <Route path="quotations" element={<QuotationsPage />} />
    <Route path="client-approval" element={<ClientApprovalPage />} />
    <Route path="client-onboarding" element={<OnboardingPage />} />
    <Route path="clients" element={<ClientsPage />} />
    <Route path="questions" element={<QuestionsPage />} />
  </>
)
