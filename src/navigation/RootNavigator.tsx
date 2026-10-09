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
  ClientOnboardingScreen,
  ClientsScreen,
  ClientDetailScreen,
} from '../screens/crm';

import {
  ErmWorkspaceHomeScreen,
  ErmDashboardScreen,
  ProjectsScreen,
  ProjectDetailScreen,
} from '../screens/erm';

import {
  FieldDatabaseHomeScreen,
  GeologicalMappingScreen,
  SamplingActivityScreen,
  DrillingDprScreen,
  DispatchDatabaseScreen,
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

  if (isLoading || showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />;
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
  const canAccessField = isSuperAdmin || isDirector || isManager;
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
          {/* Universal Core App Screens */}
          <Stack.Screen name="MainTabs" component={MainTabNavigator} />
          <Stack.Screen name="Notifications" component={NotificationsScreen} />
          <Stack.Screen name="Tasks" component={TasksScreen} />
          <Stack.Screen name="RoleSelection" component={RoleSelectionScreen} />

          {/* Profile Sub-pages */}
          <Stack.Screen name="PersonalInfo" component={PersonalInfoScreen} />
          <Stack.Screen name="AccountSecurity" component={AccountSecurityScreen} />
          <Stack.Screen name="AppSettings" component={AppSettingsScreen} />
          <Stack.Screen name="NotificationPreferences" component={NotificationPreferencesScreen} />
          <Stack.Screen name="Language" component={LanguageScreen} />
          <Stack.Screen name="AuditLog" component={AuditLogScreen} />
          <Stack.Screen name="SentMessages" component={SentMessagesScreen} />
          <Stack.Screen name="HelpSupport" component={HelpSupportScreen} />

          {/* CRM Workspace Screens */}
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
            </>
          )}

          {/* ERM Workspace Screens */}
          {canAccessErm && (
            <>
              <Stack.Screen name="ErmWorkspaceHome" component={ErmWorkspaceHomeScreen} />
              <Stack.Screen name="ErmDashboard" component={ErmDashboardScreen} />
              <Stack.Screen name="Projects" component={ProjectsScreen} />
              <Stack.Screen name="ProjectDetail" component={ProjectDetailScreen} />
            </>
          )}

          {/* Field Database Workspace */}
          {canAccessField && (
            <>
              <Stack.Screen name="FieldDatabaseHome" component={FieldDatabaseHomeScreen} />
              <Stack.Screen name="GeologicalMapping" component={GeologicalMappingScreen} />
              <Stack.Screen name="SamplingActivity" component={SamplingActivityScreen} />
              <Stack.Screen name="DrillingDpr" component={DrillingDprScreen} />
              <Stack.Screen name="DispatchDatabase" component={DispatchDatabaseScreen} />
            </>
          )}

          {/* Vendor Workspace */}
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

          {/* Documents Workspace */}
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

          {/* Expenses & Claims */}
          <Stack.Screen name="Expenses" component={ExpensesScreen} />
          <Stack.Screen name="ExpenseClaim" component={ExpenseClaimScreen} />
          {canManageHrms && (
            <>
              <Stack.Screen name="ExpenseReview" component={ExpenseReviewScreen} />
              <Stack.Screen name="ExpenseQueries" component={ExpenseQueriesScreen} />
            </>
          )}
          {canApproveFinance && (
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
              <Stack.Screen name="TaxCompliance" component={TaxComplianceScreen} />
              <Stack.Screen name="TdsRegister" component={TdsRegisterScreen} />
              <Stack.Screen name="GstOverview" component={GstOverviewScreen} />
            </>
          )}

          {/* Payroll Workspace (Super Admin & Finance Master) */}
          {canApproveFinance && (
            <Stack.Screen name="Payroll" component={PayrollScreen} />
          )}
          {/* Payslips self-service view */}
          <Stack.Screen name="Payslips" component={PayslipsScreen} />

          {/* MIS Executive Reports */}
          {canAccessMis && (
            <Stack.Screen name="MisReports" component={MisReportsScreen} />
          )}
        </>
      )}
    </Stack.Navigator>
  );
};
