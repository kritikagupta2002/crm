export type RootStackParamList = {
  Login: undefined;
  PublicEnquiry: undefined;
  ClientPortal: undefined;
  VendorPortal: undefined;
  MainTabs: undefined;
  Notifications: undefined;

  CrmDashboard: undefined;
  Leads: undefined;
  LeadDetail: { leadId: string };
  LeadConversion: { leadId: string };
  FollowUps: undefined;
  Quotes: undefined;
  QuoteBuilder: { initialQuoteId?: string } | undefined;
  QuoteApprovals: undefined;
  ClientApprovals: undefined;
  ClientOnboarding: undefined;
  Clients: undefined;
  ClientDetail: { clientId: string };

  ErmDashboard: undefined;
  Projects: { stageKey?: string; view?: 'list' | 'timeline' } | undefined;
  ProjectDetail: { projectId: string; initialTab?: string };

  VendorWorkspaceHome: undefined;
  VendorRegister: undefined;
  VendorApplications: { openId?: string } | undefined;
  Tenders: undefined;
  TenderDetail: { tenderId: string };
  SealedBidding: { tenderId: string };
  WorkOrders: undefined;
  WorkOrderDetail: { woId: string };
  Vendors: undefined;
  VendorDetail: { vendorId: string };

  DocumentWorkspaceHome: undefined;
  Documents: { step?: string; view?: 'Government documents' | 'Other documents'; openId?: string } | undefined;
  DocumentDetail: { docId: string };
  DocumentInbox: undefined;
  ScanInbox: undefined;
  DispatchRegister: { tab?: string; openId?: string } | undefined;

  HrmsOverview: undefined;
  Attendance: undefined;
  DailyAttendance: { date?: string } | undefined;
  AttendanceCorrections: undefined;
  NewCorrectionRequest: { defaultDate?: string } | undefined;
  MonthlyAttendance: undefined;
  AttendanceHistory: { employeeId?: string } | undefined;
  Leave: undefined;
  LeaveApprovals: undefined;
  EmployeeDirectory: undefined;
  EmployeeDetail: { employeeId: string };
  AddEmployee: undefined;
  EditEmployee: { employeeId: string };
  Organization: undefined;
  Shifts: undefined;
  MonthlyRoster: { month?: string } | undefined;
  HrDocuments: { initialTab?: 'policies' | 'kyc' } | undefined;
  EmployeeDocuments: { employeeId?: string; filterType?: string } | undefined;
  HrDocumentsWorkspace: { initialTab?: 'policies' | 'kyc'; employeeId?: string } | undefined;

  Expenses: undefined;
  ExpenseClaim: undefined;
  ExpenseReview: { expenseId: string };
  ExpenseQueries: { expenseId?: string } | undefined;
  ExpenseSettlement: { expenseId: string };
  Reimbursement: undefined;

  FinanceDashboard: undefined;
  Invoices: undefined;
  VendorBills: undefined;
  Vouchers: undefined;
  TaxCompliance: undefined;
  TdsRegister: undefined;
  GstOverview: undefined;

  Payroll: undefined;
  Payslips: { payslipId?: string } | undefined;

  MisReports: undefined;
};

export type MainTabParamList = {
  HomeTab: undefined;
  TasksTab: undefined;
  WorkspacesTab: undefined;
  ProfileTab: undefined;
};
