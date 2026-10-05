import React from 'react'
import { Navigate, Route } from 'react-router-dom'
import { ErmDashboard } from '../../modules/erm/pages/ErmDashboard'
import { ProjectsPage } from '../../modules/erm/pages/ProjectsPage'
import { ProjectDetailPage } from '../../modules/erm/pages/ProjectDetailPage'
import { TasksPage } from '../../modules/erm/pages/TasksPage'
import { MyTasksPage } from '../../modules/erm/pages/MyTasksPage'
import { TeamPage } from '../../modules/erm/pages/TeamPage'
import { SubcontractsPage } from '../../modules/erm/pages/SubcontractsPage'

export const ermRoutes = (
  <>
    <Route path="erm" element={<ErmDashboard />} />
    <Route path="projects" element={<ProjectsPage />} />
    <Route path="projects/:projectId" element={<ProjectDetailPage />} />
    <Route path="tasks" element={<TasksPage />} />
    <Route path="my-tasks" element={<MyTasksPage />} />
    <Route path="team" element={<TeamPage />} />
    <Route path="letters" element={<Navigate to="/projects?letters=To%20share" replace />} />
    <Route path="subcontracts" element={<SubcontractsPage />} />
    <Route path="work-orders" element={<Navigate to="/subcontracts" replace />} />
  </>
)
