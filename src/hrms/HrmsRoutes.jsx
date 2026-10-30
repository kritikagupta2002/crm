/* eslint-disable react/only-export-components -- a route table: lazy pages and small route helpers, not a component module */
import React, { Suspense, lazy } from 'react';
import { Navigate, Route } from 'react-router-dom';
import { HrOnly } from './RoleRoute';
import { useCrm } from '../context/crm';
import { hrRoleOf } from './bridge';

const HrmsShell = lazy(() => import('./HrmsShell'));
const LoadingFallback = () => (
  <div style={{ padding: '48px 24px', textAlign: 'center', color: '#64748b' }}>
    <p style={{ fontSize: '15px', fontWeight: 500 }}>Loading HRMS portal...</p>
  </div>
);

const Shell = () => (
  <Suspense fallback={<LoadingFallback />}>
    <HrmsShell />
  </Suspense>
);

const DashboardPage = lazy(() => import('@/modules/dashboard/pages/DashboardPage').then((m) => ({ default: m.DashboardPage })));
const EmployeeListPage = lazy(() => import('@/modules/employees/pages/EmployeeListPage').then((m) => ({ default: m.EmployeeListPage })));
const AddEmployeePage = lazy(() => import('@/modules/employees/pages/AddEmployeePage').then((m) => ({ default: m.AddEmployeePage })));
const EmployeeDetailPage = lazy(() => import('@/modules/employees/pages/EmployeeDetailPage').then((m) => ({ default: m.EmployeeDetailPage })));
const EditEmployeePage = lazy(() => import('@/modules/employees/pages/EditEmployeePage').then((m) => ({ default: m.EditEmployeePage })));
const PerformanceRecordsPage = lazy(() => import('@/modules/employees/pages/PerformanceRecordsPage').then((m) => ({ default: m.PerformanceRecordsPage })));
const EmployeeExitPage = lazy(() => import('@/modules/employees/pages/EmployeeExitPage').then((m) => ({ default: m.EmployeeExitPage })));
const TeamPage = lazy(() => import('@/modules/employees/pages/TeamPage').then((m) => ({ default: m.TeamPage })));
const OrgChartPage = lazy(() => import('@/modules/organization/pages/OrgChartPage').then((m) => ({ default: m.OrgChartPage })));
const DepartmentsPage = lazy(() => import('@/modules/organization/pages/DepartmentsPage').then((m) => ({ default: m.DepartmentsPage })));
const DesignationsPage = lazy(() => import('@/modules/organization/pages/DesignationsPage').then((m) => ({ default: m.DesignationsPage })));
const AttendanceDashboardPage = lazy(() => import('@/modules/attendance/pages/AttendanceDashboardPage').then((m) => ({ default: m.AttendanceDashboardPage })));
const DailyAttendancePage = lazy(() => import('@/modules/attendance/pages/DailyAttendancePage').then((m) => ({ default: m.DailyAttendancePage })));
const MonthlyAttendancePage = lazy(() => import('@/modules/attendance/pages/MonthlyAttendancePage').then((m) => ({ default: m.MonthlyAttendancePage })));
const AttendanceCorrectionsPage = lazy(() => import('@/modules/attendance/pages/AttendanceCorrectionsPage').then((m) => ({ default: m.AttendanceCorrectionsPage })));
const LeaveDashboardPage = lazy(() => import('@/modules/leave/pages/LeaveDashboardPage').then((m) => ({ default: m.LeaveDashboardPage })));
const ApplyLeavePage = lazy(() => import('@/modules/leave/pages/ApplyLeavePage').then((m) => ({ default: m.ApplyLeavePage })));
const LeaveRequestsPage = lazy(() => import('@/modules/leave/pages/LeaveRequestsPage').then((m) => ({ default: m.LeaveRequestsPage })));
const LeaveApprovalsPage = lazy(() => import('@/modules/leave/pages/LeaveApprovalsPage').then((m) => ({ default: m.LeaveApprovalsPage })));
const LeaveBalancePage = lazy(() => import('@/modules/leave/pages/LeaveBalancePage').then((m) => ({ default: m.LeaveBalancePage })));
const LeaveHistoryPage = lazy(() => import('@/modules/leave/pages/LeaveHistoryPage').then((m) => ({ default: m.LeaveHistoryPage })));
const LeaveTypesPage = lazy(() => import('@/modules/leave/pages/LeaveTypesPage').then((m) => ({ default: m.LeaveTypesPage })));
const ShiftListPage = lazy(() => import('@/modules/shifts/pages/ShiftListPage').then((m) => ({ default: m.ShiftListPage })));
const NewShiftPage = lazy(() => import('@/modules/shifts/pages/NewShiftPage').then((m) => ({ default: m.NewShiftPage })));
const ShiftAssignmentsPage = lazy(() => import('@/modules/shifts/pages/ShiftAssignmentsPage').then((m) => ({ default: m.ShiftAssignmentsPage })));
const NotificationsPage = lazy(() => import('@/modules/notifications/pages/NotificationsPage').then((m) => ({ default: m.NotificationsPage })));
const SettingsLayout = lazy(() => import('@/modules/settings/components/SettingsLayout').then((m) => ({ default: m.SettingsLayout })));
const CompanySettingsPage = lazy(() => import('@/modules/settings/pages/CompanySettingsPage').then((m) => ({ default: m.CompanySettingsPage })));
const ProfileSettingsPage = lazy(() => import('@/modules/settings/pages/ProfileSettingsPage').then((m) => ({ default: m.ProfileSettingsPage })));
const AttendanceSettingsPage = lazy(() => import('@/modules/settings/pages/AttendanceSettingsPage').then((m) => ({ default: m.AttendanceSettingsPage })));
const LeaveSettingsPage = lazy(() => import('@/modules/settings/pages/LeaveSettingsPage').then((m) => ({ default: m.LeaveSettingsPage })));
const NotificationSettingsPage = lazy(() => import('@/modules/settings/pages/NotificationSettingsPage').then((m) => ({ default: m.NotificationSettingsPage })));
const SecuritySettingsPage = lazy(() => import('@/modules/settings/pages/SecuritySettingsPage').then((m) => ({ default: m.SecuritySettingsPage })));

const SettingsIndex = () => <Navigate to={hrRoleOf(useCrm().role) === 'employee' ? '/hr/settings/profile' : '/hr/settings/company'} replace />;

export const hrmsRoutes = (
  <Route element={<Shell />}>
    {/* Index & Dashboard: Both root / and /hr open HRMS Dashboard */}
    <Route index element={<DashboardPage />} />
    <Route path="hr" element={<DashboardPage />} />

    {/* Attendance Management */}
    <Route path="hr/attendance" element={<AttendanceDashboardPage />} />
    <Route path="hr/attendance/monthly" element={<MonthlyAttendancePage />} />
    <Route path="hr/attendance/corrections" element={<AttendanceCorrectionsPage />} />
    <Route element={<HrOnly />}>
      <Route path="hr/attendance/daily" element={<DailyAttendancePage />} />
    </Route>

    {/* Employee Management */}
    <Route element={<HrOnly />}>
      <Route path="hr/employees" element={<EmployeeListPage />} />
      <Route path="hr/employees/new" element={<AddEmployeePage />} />
      <Route path="hr/employees/:id" element={<EmployeeDetailPage />} />
      <Route path="hr/employees/:id/edit" element={<EditEmployeePage />} />
      <Route path="hr/performance" element={<PerformanceRecordsPage />} />
      <Route path="hr/exit" element={<EmployeeExitPage />} />
      <Route path="hr/organization/departments" element={<DepartmentsPage />} />
      <Route path="hr/organization/designations" element={<DesignationsPage />} />
    </Route>
    <Route path="hr/team" element={<TeamPage />} />
    <Route path="hr/organization" element={<OrgChartPage />} />

    {/* Leave Management */}
    <Route path="hr/leave" element={<LeaveDashboardPage />} />
    <Route path="hr/leave/apply" element={<ApplyLeavePage />} />
    <Route path="hr/leave/balance" element={<LeaveBalancePage />} />
    <Route path="hr/leave/requests" element={<LeaveRequestsPage />} />
    <Route path="hr/leave/history" element={<LeaveHistoryPage />} />
    <Route element={<HrOnly />}>
      <Route path="hr/leave/approvals" element={<LeaveApprovalsPage />} />
      <Route path="hr/leave/types" element={<LeaveTypesPage />} />
    </Route>

    {/* Shift Management */}
    <Route path="hr/shifts" element={<ShiftListPage />} />
    <Route element={<HrOnly />}>
      <Route path="hr/shifts/new" element={<NewShiftPage />} />
      <Route path="hr/shifts/assignments" element={<ShiftAssignmentsPage />} />
    </Route>

    {/* Notifications & Settings */}
    <Route path="hr/notifications" element={<NotificationsPage />} />
    <Route path="hr/settings" element={<SettingsLayout />}>
      <Route index element={<SettingsIndex />} />
      <Route path="profile" element={<ProfileSettingsPage />} />
      <Route path="notifications" element={<NotificationSettingsPage />} />
      <Route element={<HrOnly />}>
        <Route path="company" element={<CompanySettingsPage />} />
        <Route path="attendance" element={<AttendanceSettingsPage />} />
        <Route path="leave" element={<LeaveSettingsPage />} />
        <Route path="security" element={<SecuritySettingsPage />} />
      </Route>
    </Route>
  </Route>
);
