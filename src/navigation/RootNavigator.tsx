import React, { useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from './types';
import { useAuth } from '../context';
import { colors } from '../theme';

import { MainTabNavigator } from './MainTabNavigator';

import { LoginScreen, SplashScreen } from '../screens/auth';
import { PublicEnquiryScreen } from '../screens/public';

import { ClientPortalScreen, VendorPortalScreen } from '../screens/portals';

import { NotificationsScreen } from '../screens/main';

import {
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

import { ErmDashboardScreen, ProjectsScreen, ProjectDetailScreen } from '../screens/erm';

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

const Stack = createNativeStackNavigator<RootStackParamList>();

export const RootNavigator: React.FC = () => {
  const { session, isLoading } = useAuth();
  const [showSplash, setShowSplash] = useState<boolean>(true);

  if (isLoading || showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />;
  }

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

          <Stack.Screen name="ErmDashboard" component={ErmDashboardScreen} />
          <Stack.Screen name="Projects" component={ProjectsScreen} />
          <Stack.Screen name="ProjectDetail" component={ProjectDetailScreen} />

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

          <Stack.Screen name="DocumentWorkspaceHome" component={DocumentWorkspaceHomeScreen} />
          <Stack.Screen name="Documents" component={DocumentsScreen} />
          <Stack.Screen name="DocumentDetail" component={DocumentDetailScreen} />
          <Stack.Screen name="DocumentInbox" component={DocumentInboxScreen} />
          <Stack.Screen name="ScanInbox" component={ScanInboxScreen} />
          <Stack.Screen name="DispatchRegister" component={DispatchRegisterScreen} />

          <Stack.Screen name="HrmsOverview" component={HrmsOverviewScreen} />
          <Stack.Screen name="Attendance" component={AttendanceScreen} />
          <Stack.Screen name="DailyAttendance" component={DailyAttendanceScreen} />
          <Stack.Screen name="AttendanceCorrections" component={AttendanceCorrectionsScreen} />
          <Stack.Screen name="NewCorrectionRequest" component={NewCorrectionRequestScreen} />
          <Stack.Screen name="MonthlyAttendance" component={MonthlyAttendanceScreen} />
          <Stack.Screen name="Leave" component={LeaveScreen} />
          <Stack.Screen name="LeaveApprovals" component={LeaveApprovalsScreen} />
          <Stack.Screen name="EmployeeDirectory" component={EmployeeDirectoryScreen} />
          <Stack.Screen name="EmployeeDetail" component={EmployeeDetailScreen} />
          <Stack.Screen name="AddEmployee" component={AddEmployeeScreen} />
          <Stack.Screen name="EditEmployee" component={EditEmployeeScreen} />
          <Stack.Screen name="Organization" component={OrganizationScreen} />
          <Stack.Screen name="Shifts" component={ShiftsScreen} />
          <Stack.Screen name="MonthlyRoster" component={MonthlyRosterScreen} />
          <Stack.Screen name="HrDocuments" component={HrDocumentsScreen} />
          <Stack.Screen name="EmployeeDocuments" component={EmployeeDocumentsScreen} />
          <Stack.Screen name="HrDocumentsWorkspace" component={HrDocumentsWorkspaceScreen} />

          <Stack.Screen name="Expenses" component={ExpensesScreen} />
          <Stack.Screen name="ExpenseClaim" component={ExpenseClaimScreen} />
          <Stack.Screen name="ExpenseReview" component={ExpenseReviewScreen} />
          <Stack.Screen name="ExpenseQueries" component={ExpenseQueriesScreen} />
          <Stack.Screen name="ExpenseSettlement" component={ExpenseSettlementScreen} />
          <Stack.Screen name="Reimbursement" component={ReimbursementScreen} />

          <Stack.Screen name="FinanceDashboard" component={FinanceDashboardScreen} />
          <Stack.Screen name="Invoices" component={InvoicesScreen} />
          <Stack.Screen name="VendorBills" component={VendorBillsScreen} />
          <Stack.Screen name="Vouchers" component={VouchersScreen} />
          <Stack.Screen name="TaxCompliance" component={TaxComplianceScreen} />
          <Stack.Screen name="TdsRegister" component={TdsRegisterScreen} />
          <Stack.Screen name="GstOverview" component={GstOverviewScreen} />

          <Stack.Screen name="Payroll" component={PayrollScreen} />
          <Stack.Screen name="Payslips" component={PayslipsScreen} />

          <Stack.Screen name="MisReports" component={MisReportsScreen} />
        </>
      )}
    </Stack.Navigator>
  );
};
