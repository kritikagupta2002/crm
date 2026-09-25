/* eslint-disable react/only-export-components -- a route table: lazy pages and small route helpers, not a component module */
import React, { Suspense, lazy } from 'react';
import { Navigate, Route } from 'react-router-dom';
import { HrOnly, FinanceOnly } from './RoleRoute';
import { useCrm } from '../context/crm';
import { hrRoleOf } from './bridge';

/*
 * The HRMS and Finance pages, mounted inside the CRM's layout (App.jsx). Paths moved under /hr so they don't
 * collide with the CRM's own /team, /reports and /settings; Finance stays at /finance. Pages load on first visit.
 */
const HrmsShell = lazy(() => import('./HrmsShell'));
const Shell = () => (
  <Suspense fallback={null}>
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
const DocumentsListPage = lazy(() => import('@/modules/documents/pages/DocumentsListPage').then((m) => ({ default: m.DocumentsListPage })));
const EmployeeDocumentsPage = lazy(() => import('@/modules/documents/pages/EmployeeDocumentsPage').then((m) => ({ default: m.EmployeeDocumentsPage })));
const PayrollDashboardPage = lazy(() => import('@/modules/payroll/pages/PayrollDashboardPage').then((m) => ({ default: m.PayrollDashboardPage })));
const SalaryStructurePage = lazy(() => import('@/modules/payroll/pages/SalaryStructurePage').then((m) => ({ default: m.SalaryStructurePage })));
const PayrollProcessingPage = lazy(() => import('@/modules/payroll/pages/PayrollProcessingPage').then((m) => ({ default: m.PayrollProcessingPage })));
const PayslipsPage = lazy(() => import('@/modules/payroll/pages/PayslipsPage').then((m) => ({ default: m.PayslipsPage })));
const PayrollHistoryPage = lazy(() => import('@/modules/payroll/pages/PayrollHistoryPage').then((m) => ({ default: m.PayrollHistoryPage })));
const ExpenseListPage = lazy(() => import('@/modules/expenses/pages/ExpenseListPage').then((m) => ({ default: m.ExpenseListPage })));
const NewExpensePage = lazy(() => import('@/modules/expenses/pages/NewExpensePage').then((m) => ({ default: m.NewExpensePage })));
const ExpenseApprovalsPage = lazy(() => import('@/modules/expenses/pages/ExpenseApprovalsPage').then((m) => ({ default: m.ExpenseApprovalsPage })));
const ReimbursementListPage = lazy(() => import('@/modules/reimbursement/pages/ReimbursementListPage').then((m) => ({ default: m.ReimbursementListPage })));
const ReimbursementHistoryPage = lazy(() => import('@/modules/reimbursement/pages/ReimbursementHistoryPage').then((m) => ({ default: m.ReimbursementHistoryPage })));
const FinanceOverviewPage = lazy(() => import('@/modules/finance/pages/FinanceOverviewPage').then((m) => ({ default: m.FinanceOverviewPage })));
const ClientInvoicesPage = lazy(() => import('@/modules/finance/pages/ClientInvoicesPage').then((m) => ({ default: m.ClientInvoicesPage })));
const ReceivablesPage = lazy(() => import('@/modules/finance/pages/ReceivablesPage').then((m) => ({ default: m.ReceivablesPage })));
const VendorBillsPage = lazy(() => import('@/modules/finance/pages/VendorBillsPage').then((m) => ({ default: m.VendorBillsPage })));
const PaymentsReceiptsPage = lazy(() => import('@/modules/finance/pages/PaymentsReceiptsPage').then((m) => ({ default: m.PaymentsReceiptsPage })));
const AccountingEntriesPage = lazy(() => import('@/modules/finance/pages/AccountingEntriesPage').then((m) => ({ default: m.AccountingEntriesPage })));
const TdsTaxPage = lazy(() => import('@/modules/finance/pages/TdsTaxPage').then((m) => ({ default: m.TdsTaxPage })));
const GstCompliancePage = lazy(() => import('@/modules/finance/pages/GstCompliancePage').then((m) => ({ default: m.GstCompliancePage })));
const FinancialReportsPage = lazy(() => import('@/modules/finance/pages/FinancialReportsPage').then((m) => ({ default: m.FinancialReportsPage })));
const BudgetCostPage = lazy(() => import('@/modules/finance/pages/BudgetCostPage').then((m) => ({ default: m.BudgetCostPage })));
const FinanceExpenseClaimsPage = lazy(() => import('@/modules/finance/pages/FinanceExpenseClaimsPage').then((m) => ({ default: m.FinanceExpenseClaimsPage })));
const ReportsPage = lazy(() => import('@/modules/reports/pages/ReportsPage').then((m) => ({ default: m.ReportsPage })));
const NotificationsPage = lazy(() => import('@/modules/notifications/pages/NotificationsPage').then((m) => ({ default: m.NotificationsPage })));
const SettingsLayout = lazy(() => import('@/modules/settings/components/SettingsLayout').then((m) => ({ default: m.SettingsLayout })));
const CompanySettingsPage = lazy(() => import('@/modules/settings/pages/CompanySettingsPage').then((m) => ({ default: m.CompanySettingsPage })));
const ProfileSettingsPage = lazy(() => import('@/modules/settings/pages/ProfileSettingsPage').then((m) => ({ default: m.ProfileSettingsPage })));
const AttendanceSettingsPage = lazy(() => import('@/modules/settings/pages/AttendanceSettingsPage').then((m) => ({ default: m.AttendanceSettingsPage })));
const LeaveSettingsPage = lazy(() => import('@/modules/settings/pages/LeaveSettingsPage').then((m) => ({ default: m.LeaveSettingsPage })));
const PayrollSettingsPage = lazy(() => import('@/modules/settings/pages/PayrollSettingsPage').then((m) => ({ default: m.PayrollSettingsPage })));
const NotificationSettingsPage = lazy(() => import('@/modules/settings/pages/NotificationSettingsPage').then((m) => ({ default: m.NotificationSettingsPage })));
const SecuritySettingsPage = lazy(() => import('@/modules/settings/pages/SecuritySettingsPage').then((m) => ({ default: m.SecuritySettingsPage })));

// Role-aware landing pages, as in the HRMS: employees go to their own payslips and profile.
const PayrollIndex = () => (hrRoleOf(useCrm().role) === 'employee' ? <Navigate to="/hr/payroll/payslips" replace /> : <PayrollDashboardPage />);
const SettingsIndex = () => <Navigate to={hrRoleOf(useCrm().role) === 'employee' ? '/hr/settings/profile' : '/hr/settings/company'} replace />;

export const hrmsRoutes = (
  <Route element={<Shell />}>
    {/* Self-service: every signed-in person (what they see adapts to their role) */}
    <Route path="hr" element={<DashboardPage />} />
    <Route path="hr/attendance" element={<AttendanceDashboardPage />} />
    <Route path="hr/attendance/monthly" element={<MonthlyAttendancePage />} />
    <Route path="hr/attendance/corrections" element={<AttendanceCorrectionsPage />} />
    <Route path="hr/leave" element={<LeaveDashboardPage />} />
    <Route path="hr/leave/apply" element={<ApplyLeavePage />} />
    <Route path="hr/leave/balance" element={<LeaveBalancePage />} />
    <Route path="hr/leave/requests" element={<LeaveRequestsPage />} />
    <Route path="hr/leave/history" element={<LeaveHistoryPage />} />
    <Route path="hr/shifts" element={<ShiftListPage />} />
    <Route path="hr/documents/employee" element={<EmployeeDocumentsPage />} />
    <Route path="hr/payroll" element={<PayrollIndex />} />
    <Route path="hr/payroll/payslips" element={<PayslipsPage />} />
    <Route path="hr/expenses" element={<ExpenseListPage />} />
    <Route path="hr/expenses/new" element={<NewExpensePage />} />
    <Route path="hr/reimbursement" element={<ReimbursementListPage />} />
    <Route path="hr/reimbursement/history" element={<ReimbursementHistoryPage />} />
    <Route path="hr/notifications" element={<NotificationsPage />} />
    <Route path="hr/settings" element={<SettingsLayout />}>
      <Route index element={<SettingsIndex />} />
      <Route path="profile" element={<ProfileSettingsPage />} />
      <Route path="notifications" element={<NotificationSettingsPage />} />
      <Route element={<HrOnly />}>
        <Route path="company" element={<CompanySettingsPage />} />
        <Route path="attendance" element={<AttendanceSettingsPage />} />
        <Route path="leave" element={<LeaveSettingsPage />} />
        <Route path="payroll" element={<PayrollSettingsPage />} />
        <Route path="security" element={<SecuritySettingsPage />} />
      </Route>
    </Route>

    {/* The HR team (Admin, Management) */}
    <Route element={<HrOnly />}>
      <Route path="hr/employees" element={<EmployeeListPage />} />
      <Route path="hr/employees/new" element={<AddEmployeePage />} />
      <Route path="hr/employees/:id" element={<EmployeeDetailPage />} />
      <Route path="hr/employees/:id/edit" element={<EditEmployeePage />} />
      <Route path="hr/performance" element={<PerformanceRecordsPage />} />
      <Route path="hr/exit" element={<EmployeeExitPage />} />
      <Route path="hr/team" element={<TeamPage />} />
      <Route path="hr/organization" element={<Navigate to="/hr/organization/departments" replace />} />
      <Route path="hr/organization/departments" element={<DepartmentsPage />} />
      <Route path="hr/organization/designations" element={<DesignationsPage />} />
      <Route path="hr/attendance/daily" element={<DailyAttendancePage />} />
      <Route path="hr/leave/approvals" element={<LeaveApprovalsPage />} />
      <Route path="hr/leave/types" element={<LeaveTypesPage />} />
      <Route path="hr/shifts/new" element={<NewShiftPage />} />
      <Route path="hr/shifts/assignments" element={<ShiftAssignmentsPage />} />
      <Route path="hr/documents" element={<DocumentsListPage />} />
      <Route path="hr/payroll/salary-structure" element={<SalaryStructurePage />} />
      <Route path="hr/payroll/process" element={<PayrollProcessingPage />} />
      <Route path="hr/payroll/history" element={<PayrollHistoryPage />} />
      <Route path="hr/expenses/approvals" element={<ExpenseApprovalsPage />} />
      <Route path="hr/reports" element={<ReportsPage />} />
    </Route>

    {/* Finance & accounting: who opens each page is set in the CRM's ROLE_ACCESS */}
    <Route element={<FinanceOnly />}>
      <Route path="finance" element={<FinanceOverviewPage />} />
      <Route path="finance/invoices" element={<ClientInvoicesPage />} />
      <Route path="finance/receivables" element={<ReceivablesPage />} />
      <Route path="finance/vendor-bills" element={<VendorBillsPage />} />
      <Route path="finance/payments-receipts" element={<PaymentsReceiptsPage />} />
      <Route path="finance/accounting-entries" element={<AccountingEntriesPage />} />
      <Route path="finance/tax" element={<TdsTaxPage />} />
      <Route path="finance/gst" element={<GstCompliancePage />} />
      <Route path="finance/reports" element={<FinancialReportsPage />} />
      <Route path="finance/budget" element={<BudgetCostPage />} />
      <Route path="finance/claims" element={<FinanceExpenseClaimsPage />} />
    </Route>
  </Route>
);
