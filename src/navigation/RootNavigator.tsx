import React, { useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from './types';
import { useAuth } from '../context';
import { colors } from '../theme';

import { MainTabNavigator } from './MainTabNavigator';

import { LoginScreen, SplashScreen, RoleSelectionScreen } from '../screens/auth';
import { PublicEnquiryScreen } from '../screens/public';

import { ClientPortalScreen, VendorPortalScreen } from '../screens/portals';

import { NotificationsScreen, TasksScreen } from '../screens/main';

import {
  CrmWorkspaceHomeScreen,
  CrmDashboardScreen,
  LeadsScreen,
  LeadDetailScreen,
  FollowUpsScreen,
  QuotesScreen,
  QuoteBuilderScreen,
  QuoteApprovalsScreen,
  ClientApprovalsScreen,
  ClientQuestionsScreen,
  ClientOnboardingScreen,
  ClientsScreen,
  ClientDetailScreen,
  LeadConversionModal,
} from '../screens/crm';

import {
  ErmWorkspaceHomeScreen,
  ErmDashboardScreen,
  ProjectsScreen,
  ProjectDetailScreen,
  InventoryScreen,
} from '../screens/erm';

import {
  FieldDatabaseHomeScreen,
  FieldSectionScreen,
  FieldRecordFormScreen,
  FieldRecordDetailScreen,
  DispatchLetterScreen,
  QaqcScreen,
  QaqcResultsScreen,
} from '../screens/field';

import {
  VendorWorkspaceHomeScreen,
  VendorRegisterScreen,
  VendorApplicationsScreen,
  TendersScreen,
  TenderDetailScreen,
  SealedBiddingScreen,
  WorkOrdersScreen,
  WorkOrderDetailScreen,
  VendorsScreen,
  VendorDetailScreen,
} from '../screens/vendor';

import {
  DocumentWorkspaceHomeScreen,
  DocumentsScreen,
  DocumentDetailScreen,
  DocumentInboxScreen,
  ScanInboxScreen,
  DispatchRegisterScreen,
} from '../screens/documents';

import {
  HrmsOverviewScreen,
  AttendanceScreen,
  DailyAttendanceScreen,
  AttendanceCorrectionsScreen,
  NewCorrectionRequestScreen,
  MonthlyAttendanceScreen,
  LeaveScreen,
  LeaveApprovalsScreen,
  EmployeeDirectoryScreen,
  EmployeeDetailScreen,
  AddEmployeeScreen,
  EditEmployeeScreen,
  OrganizationScreen,
  ShiftsScreen,
  MonthlyRosterScreen,
  HrDocumentsScreen,
  EmployeeDocumentsScreen,
  HrDocumentsWorkspaceScreen,
} from '../screens/hrms';

import {
  ExpensesScreen,
  ExpenseClaimScreen,
  ExpenseReviewScreen,
  ExpenseQueriesScreen,
  ExpenseSettlementScreen,
  ReimbursementScreen,
} from '../screens/expenses';

import {
  FinanceDashboardScreen,
  InvoicesScreen,
  VendorBillsScreen,
  VouchersScreen,
  ReceivablesScreen,
  PaymentsReceiptsScreen,
  FinancialReportsScreen,
  BudgetCostScreen,
  TaxComplianceScreen,
  TdsRegisterScreen,
  GstOverviewScreen,
} from '../screens/finance';

import { PayrollScreen, PayslipsScreen } from '../screens/payroll';

import { MisReportsScreen } from '../screens/reports';
import {
  PersonalInfoScreen,
  AccountSecurityScreen,
  AppSettingsScreen,
  NotificationPreferencesScreen,
  LanguageScreen,
  AuditLogScreen,
  SentMessagesScreen,
  HelpSupportScreen,
} from '../screens/profile';

const Stack = createNativeStackNavigator<RootStackParamList>();

export const RootNavigator: React.FC = () => {
  const { session, canonicalRole, isLoading } = useAuth();
  const [showSplash, setShowSplash] = useState<boolean>(true);

  if (showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />;
  }

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#041527', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#c27a12" />
      </View>
    );
  }

  const isSuperAdmin = canonicalRole === 'super_admin';
  const isDirector = canonicalRole === 'director';
  const isManager = canonicalRole === 'manager';
  const isEmployee = canonicalRole === 'employee';
  const isFinanceMaster = canonicalRole === 'finance_master';
  const isAccountsExec = canonicalRole === 'accounts_executive';

  // Role capability groups
  const canAccessFinance = isSuperAdmin || isFinanceMaster || isAccountsExec;
  const canApproveFinance = isSuperAdmin || isFinanceMaster;
  const canAccessCrm = isSuperAdmin || isDirector;
  const canAccessErm = isSuperAdmin || isDirector || isManager;
  const canAccessVendor = isSuperAdmin || isDirector || isFinanceMaster;
  // Field Database as on the web: Super Admin, Manager and Employee.
  const canAccessField = isSuperAdmin || isManager || isEmployee;
  const canAccessDocs = isSuperAdmin || isDirector || isManager;
  const canManageHrms = isSuperAdmin || isDirector || isManager;
  const canAccessMis = isSuperAdmin || isDirector || isManager || isFinanceMaster;

  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      {!session ? (
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="PublicEnquiry" component={PublicEnquiryScreen} />
          <Stack.Screen name="VendorRegister" component={VendorRegisterScreen} />
        </>
      ) : session.accountType === 'client' ? (
        <>
          <Stack.Screen name="ClientPortal" component={ClientPortalScreen} />
          <Stack.Screen name="PublicEnquiry" component={PublicEnquiryScreen} />
        </>
      ) : session.accountType === 'vendor' ? (
        <>
          <Stack.Screen name="VendorPortal" component={VendorPortalScreen} />
          <Stack.Screen name="TenderDetail" component={TenderDetailScreen} />
          <Stack.Screen name="WorkOrderDetail" component={WorkOrderDetailScreen} />
          <Stack.Screen name="VendorRegister" component={VendorRegisterScreen} />
        </>
      ) : (
        <>
          <Stack.Screen name="MainTabs" component={MainTabNavigator} />
          <Stack.Screen name="Notifications" component={NotificationsScreen} />
          <Stack.Screen name="Tasks" component={TasksScreen} />
          <Stack.Screen name="RoleSelection" component={RoleSelectionScreen} />

          <Stack.Screen name="PersonalInfo" component={PersonalInfoScreen} />
          <Stack.Screen name="AccountSecurity" component={AccountSecurityScreen} />
          <Stack.Screen name="AppSettings" component={AppSettingsScreen} />
          <Stack.Screen name="NotificationPreferences" component={NotificationPreferencesScreen} />
          <Stack.Screen name="Language" component={LanguageScreen} />
          <Stack.Screen name="AuditLog" component={AuditLogScreen} />
          <Stack.Screen name="SentMessages" component={SentMessagesScreen} />
          <Stack.Screen name="HelpSupport" component={HelpSupportScreen} />
          {/* Inventory as on the web: Super Admin, Director, Manager and Finance Master. */}
          {(isSuperAdmin || isDirector || isManager || isFinanceMaster) && <Stack.Screen name="Inventory" component={InventoryScreen} />}
          {/* Every team role answers some client questions (billing, project, documents). */}
          <Stack.Screen name="ClientQuestions" component={ClientQuestionsScreen} />

          {canAccessCrm && (
            <>
              <Stack.Screen name="CrmWorkspaceHome" component={CrmWorkspaceHomeScreen} />
              <Stack.Screen name="CrmDashboard" component={CrmDashboardScreen} />
              <Stack.Screen name="Leads" component={LeadsScreen} />
              <Stack.Screen name="LeadDetail" component={LeadDetailScreen} />
              <Stack.Screen name="FollowUps" component={FollowUpsScreen} />
              <Stack.Screen name="Quotes" component={QuotesScreen} />
              <Stack.Screen name="QuoteBuilder" component={QuoteBuilderScreen} />
              <Stack.Screen name="QuoteApprovals" component={QuoteApprovalsScreen} />
              <Stack.Screen name="ClientApprovals" component={ClientApprovalsScreen} />
              <Stack.Screen name="ClientOnboarding" component={ClientOnboardingScreen} />
              <Stack.Screen name="Clients" component={ClientsScreen} />
              <Stack.Screen name="ClientDetail" component={ClientDetailScreen} />
              <Stack.Screen name="LeadConversion" component={LeadConversionModal} options={{ presentation: 'modal' }} />
            </>
          )}

          {canAccessErm && (
            <>
              <Stack.Screen name="ErmWorkspaceHome" component={ErmWorkspaceHomeScreen} />
              <Stack.Screen name="ErmDashboard" component={ErmDashboardScreen} />
              <Stack.Screen name="Projects" component={ProjectsScreen} />
              <Stack.Screen name="ProjectDetail" component={ProjectDetailScreen} />
            </>
          )}

          {canAccessField && (
            <>
              <Stack.Screen name="FieldDatabaseHome" component={FieldDatabaseHomeScreen} />
              <Stack.Screen name="FieldSection" component={FieldSectionScreen} />
              <Stack.Screen name="FieldRecordForm" component={FieldRecordFormScreen} />
              <Stack.Screen name="FieldRecordDetail" component={FieldRecordDetailScreen} />
              <Stack.Screen name="DispatchLetter" component={DispatchLetterScreen} />
              <Stack.Screen name="Qaqc" component={QaqcScreen} />
              <Stack.Screen name="QaqcResults" component={QaqcResultsScreen} />
            </>
          )}

          {canAccessVendor && (
            <>
              <Stack.Screen name="VendorWorkspaceHome" component={VendorWorkspaceHomeScreen} />
              <Stack.Screen name="VendorRegister" component={VendorRegisterScreen} />
              <Stack.Screen name="VendorApplications" component={VendorApplicationsScreen} />
              <Stack.Screen name="Tenders" component={TendersScreen} />
              <Stack.Screen name="TenderDetail" component={TenderDetailScreen} />
              <Stack.Screen name="SealedBidding" component={SealedBiddingScreen} />
              <Stack.Screen name="WorkOrders" component={WorkOrdersScreen} />
              <Stack.Screen name="WorkOrderDetail" component={WorkOrderDetailScreen} />
              <Stack.Screen name="Vendors" component={VendorsScreen} />
              <Stack.Screen name="VendorDetail" component={VendorDetailScreen} />
            </>
          )}

          {canAccessDocs && (
            <>
              <Stack.Screen name="DocumentWorkspaceHome" component={DocumentWorkspaceHomeScreen} />
              <Stack.Screen name="Documents" component={DocumentsScreen} />
              <Stack.Screen name="DocumentDetail" component={DocumentDetailScreen} />
              <Stack.Screen name="DocumentInbox" component={DocumentInboxScreen} />
              <Stack.Screen name="ScanInbox" component={ScanInboxScreen} />
              <Stack.Screen name="DispatchRegister" component={DispatchRegisterScreen} />
            </>
          )}

          {/* HRMS Management Screens (Manager, Director, Super Admin) */}
          {canManageHrms ? (
            <>
              <Stack.Screen name="HrmsOverview" component={HrmsOverviewScreen} />
              <Stack.Screen name="LeaveApprovals" component={LeaveApprovalsScreen} />
              <Stack.Screen name="EmployeeDirectory" component={EmployeeDirectoryScreen} />
              <Stack.Screen name="EmployeeDetail" component={EmployeeDetailScreen} />
              <Stack.Screen name="AddEmployee" component={AddEmployeeScreen} />
              <Stack.Screen name="EditEmployee" component={EditEmployeeScreen} />
              <Stack.Screen name="Organization" component={OrganizationScreen} />
              <Stack.Screen name="Shifts" component={ShiftsScreen} />
              <Stack.Screen name="MonthlyRoster" component={MonthlyRosterScreen} />
              <Stack.Screen name="HrDocumentsWorkspace" component={HrDocumentsWorkspaceScreen} />
            </>
          ) : null}

          {/* HRMS Personal Self-Service (Accessible to all roles) */}
          <Stack.Screen name="Attendance" component={AttendanceScreen} />
          <Stack.Screen name="DailyAttendance" component={DailyAttendanceScreen} />
          <Stack.Screen name="AttendanceCorrections" component={AttendanceCorrectionsScreen} />
          <Stack.Screen name="NewCorrectionRequest" component={NewCorrectionRequestScreen} />
          <Stack.Screen name="MonthlyAttendance" component={MonthlyAttendanceScreen} />
          <Stack.Screen name="Leave" component={LeaveScreen} />
          <Stack.Screen name="HrDocuments" component={HrDocumentsScreen} />
          <Stack.Screen name="EmployeeDocuments" component={EmployeeDocumentsScreen} />

          <Stack.Screen name="Expenses" component={ExpensesScreen} />
          <Stack.Screen name="ExpenseClaim" component={ExpenseClaimScreen} />
          <Stack.Screen name="ExpenseQueries" component={ExpenseQueriesScreen} />
          {canManageHrms && (
            <Stack.Screen name="ExpenseReview" component={ExpenseReviewScreen} />
          )}
          {canAccessFinance && (
            <Stack.Screen name="ExpenseSettlement" component={ExpenseSettlementScreen} />
          )}
          <Stack.Screen name="Reimbursement" component={ReimbursementScreen} />

          {/* Finance Workspace Screens (Protected from Director, Manager, Employee) */}
          {canAccessFinance && (
            <>
              <Stack.Screen name="FinanceDashboard" component={FinanceDashboardScreen} />
              <Stack.Screen name="Invoices" component={InvoicesScreen} />
              <Stack.Screen name="VendorBills" component={VendorBillsScreen} />
              <Stack.Screen name="Vouchers" component={VouchersScreen} />
              <Stack.Screen name="Receivables" component={ReceivablesScreen} />
              <Stack.Screen name="PaymentsReceipts" component={PaymentsReceiptsScreen} />
              <Stack.Screen name="FinancialReports" component={FinancialReportsScreen} />
              <Stack.Screen name="BudgetCost" component={BudgetCostScreen} />
              <Stack.Screen name="TaxCompliance" component={TaxComplianceScreen} />
              <Stack.Screen name="TdsRegister" component={TdsRegisterScreen} />
              <Stack.Screen name="GstOverview" component={GstOverviewScreen} />
            </>
          )}

          {/* Payroll Workspace (Super Admin & Finance Master) */}
          {canApproveFinance && (
            <Stack.Screen name="Payroll" component={PayrollScreen} />
          )}
          <Stack.Screen name="Payslips" component={PayslipsScreen} />

          {canAccessMis && (
            <Stack.Screen name="MisReports" component={MisReportsScreen} />
          )}
        </>
      )}
    </Stack.Navigator>
  );
};
