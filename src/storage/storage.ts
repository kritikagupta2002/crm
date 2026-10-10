import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  ActiveSession,
  Lead,
  Client,
  FollowUp,
  Quote,
  Project,
  Tender,
  WorkOrder,
  Vendor,
  VendorApplication,
  TenderClarification,
  DocumentItem,
  DispatchRecord,
  Employee,
  AttendanceRecord,
  AttendanceCorrection,
  LeaveBalance,
  LeaveRequest,
  ExpenseClaim,
  ExpenseQuery,
  ReimbursementClaim,
  FinanceInvoice,
  VendorBill,
  FinanceVoucher,
  TdsRecord,
  GstReturn,
  SalaryStructure,
  Payslip,
  PayrollRun,
  Department,
  Designation,
  Shift,
  ShiftAssignment,
  RosterEntry,
  AppNotification,
  ScanItem,
  GovtDocumentRecord,
  PerformanceAppraisal,
  EmployeeExitRequest,
  HrDocument,
  EmployeeDocumentRecord,
} from '../types';
import {
  INITIAL_CLIENTS,
  INITIAL_LEADS,
  INITIAL_FOLLOW_UPS,
  INITIAL_QUOTES,
  INITIAL_PROJECTS,
  INITIAL_VENDORS,
  INITIAL_TENDERS,
  INITIAL_WORK_ORDERS,
  INITIAL_VENDOR_APPLICATIONS,
  INITIAL_CLARIFICATIONS,
  INITIAL_DOCUMENTS,
  INITIAL_DISPATCHES,
  INITIAL_EMPLOYEES,
  INITIAL_LEAVE_BALANCES,
  INITIAL_LEAVES,
  INITIAL_EXPENSES,
  INITIAL_QUERIES,
  INITIAL_REIMBURSEMENTS,
  INITIAL_INVOICES,
  INITIAL_VENDOR_BILLS,
  INITIAL_VOUCHERS,
  INITIAL_TAX_RECORDS,
  INITIAL_GST_RETURNS,
  INITIAL_SALARY_STRUCTURES,
  INITIAL_PAYSLIPS,
  INITIAL_PAYROLL_RUNS,
  INITIAL_DEPARTMENTS,
  INITIAL_DESIGNATIONS,
  INITIAL_SHIFTS,
  INITIAL_SHIFT_ASSIGNMENTS,
  INITIAL_ROSTER,
  INITIAL_NOTIFICATIONS,
  INITIAL_APPRAISALS,
  INITIAL_EXITS,
  SEEDED_SCANS,
  SEEDED_DOC_RECORDS,
  INITIAL_CORRECTIONS,
  buildSeededAttendance,
  INITIAL_HR_DOCUMENTS,
  INITIAL_EMPLOYEE_DOCUMENTS,
} from '../constants';

const KEYS = {
  ACTIVE_SESSION: '@bgspl_active_session',
  CLIENTS: '@bgspl_clients',
  LEADS: '@bgspl_leads',
  FOLLOW_UPS: '@bgspl_follow_ups',
  QUOTES: '@bgspl_quotes',
  PROJECTS: '@bgspl_projects',
  VENDORS: '@bgspl_vendors',
  TENDERS: '@bgspl_tenders',
  WORK_ORDERS: '@bgspl_work_orders',
  VENDOR_APPLICATIONS: '@bgspl_vendor_applications',
  CLARIFICATIONS: '@bgspl_clarifications',
  SAVED_TENDERS: '@bgspl_saved_tenders',
  DOCUMENTS: '@bgspl_documents',
  DISPATCHES: '@bgspl_dispatches',
  SCAN_INBOX: '@bgspl_scan_inbox',
  GOVT_DOC_RECORDS: '@bgspl_govt_doc_records',
  EMPLOYEES: '@bgspl_employees',
  ATTENDANCE: '@bgspl_attendance',
  CORRECTIONS: '@bgspl_corrections',
  LEAVE_BALANCES: '@bgspl_leave_balances',
  LEAVES: '@bgspl_leaves',
  EXPENSES: '@bgspl_expenses',
  QUERIES: '@bgspl_queries',
  REIMBURSEMENTS: '@bgspl_reimbursements',
  INVOICES: '@bgspl_invoices',
  VENDOR_BILLS: '@bgspl_vendor_bills',
  VOUCHERS: '@bgspl_vouchers',
  TAX_RECORDS: '@bgspl_tax_records',
  GST_RETURNS: '@bgspl_gst_returns',
  SALARY_STRUCTURES: '@bgspl_salary_structures',
  PAYSLIPS: '@bgspl_payslips',
  PAYROLL_RUNS: '@bgspl_payroll_runs',
  DEPARTMENTS: '@bgspl_departments',
  DESIGNATIONS: '@bgspl_designations',
  SHIFTS: '@bgspl_shifts',
  SHIFT_ASSIGNMENTS: '@bgspl_shift_assignments',
  ROSTER: '@bgspl_roster',
  NOTIFICATIONS: '@bgspl_notifications',
  APPRAISALS: '@bgspl_appraisals',
  EXITS: '@bgspl_exits',
  HR_DOCUMENTS: '@bgspl_hr_documents',
  EMPLOYEE_DOCUMENTS: '@bgspl_employee_documents',
};

class MobileStorage {
  async initStorage(): Promise<void> {
    try {
      const initialized = await AsyncStorage.getItem('@bgspl_initialized');
      if (!initialized) {
        const initialPairs: [string, string][] = [
          [KEYS.CLIENTS, JSON.stringify(INITIAL_CLIENTS)],
          [KEYS.LEADS, JSON.stringify(INITIAL_LEADS)],
          [KEYS.FOLLOW_UPS, JSON.stringify(INITIAL_FOLLOW_UPS)],
          [KEYS.QUOTES, JSON.stringify(INITIAL_QUOTES)],
          [KEYS.PROJECTS, JSON.stringify(INITIAL_PROJECTS)],
          [KEYS.VENDORS, JSON.stringify(INITIAL_VENDORS)],
          [KEYS.TENDERS, JSON.stringify(INITIAL_TENDERS)],
          [KEYS.WORK_ORDERS, JSON.stringify(INITIAL_WORK_ORDERS)],
          [KEYS.VENDOR_APPLICATIONS, JSON.stringify(INITIAL_VENDOR_APPLICATIONS)],
          [KEYS.CLARIFICATIONS, JSON.stringify(INITIAL_CLARIFICATIONS)],
          [KEYS.SAVED_TENDERS, JSON.stringify({})],
          [KEYS.DOCUMENTS, JSON.stringify(INITIAL_DOCUMENTS)],
          [KEYS.DISPATCHES, JSON.stringify(INITIAL_DISPATCHES)],
          [KEYS.SCAN_INBOX, JSON.stringify(SEEDED_SCANS)],
          [KEYS.GOVT_DOC_RECORDS, JSON.stringify(SEEDED_DOC_RECORDS)],
          [KEYS.EMPLOYEES, JSON.stringify(INITIAL_EMPLOYEES)],
          [KEYS.ATTENDANCE, JSON.stringify(buildSeededAttendance(INITIAL_EMPLOYEES))],
          [KEYS.CORRECTIONS, JSON.stringify(INITIAL_CORRECTIONS)],
          [KEYS.LEAVE_BALANCES, JSON.stringify(INITIAL_LEAVE_BALANCES)],
          [KEYS.LEAVES, JSON.stringify(INITIAL_LEAVES)],
          [KEYS.EXPENSES, JSON.stringify(INITIAL_EXPENSES)],
          [KEYS.QUERIES, JSON.stringify(INITIAL_QUERIES)],
          [KEYS.REIMBURSEMENTS, JSON.stringify(INITIAL_REIMBURSEMENTS)],
          [KEYS.INVOICES, JSON.stringify(INITIAL_INVOICES)],
          [KEYS.VENDOR_BILLS, JSON.stringify(INITIAL_VENDOR_BILLS)],
          [KEYS.VOUCHERS, JSON.stringify(INITIAL_VOUCHERS)],
          [KEYS.TAX_RECORDS, JSON.stringify(INITIAL_TAX_RECORDS)],
          [KEYS.GST_RETURNS, JSON.stringify(INITIAL_GST_RETURNS)],
          [KEYS.SALARY_STRUCTURES, JSON.stringify(INITIAL_SALARY_STRUCTURES)],
          [KEYS.PAYSLIPS, JSON.stringify(INITIAL_PAYSLIPS)],
          [KEYS.PAYROLL_RUNS, JSON.stringify(INITIAL_PAYROLL_RUNS)],
          [KEYS.DEPARTMENTS, JSON.stringify(INITIAL_DEPARTMENTS)],
          [KEYS.DESIGNATIONS, JSON.stringify(INITIAL_DESIGNATIONS)],
          [KEYS.SHIFTS, JSON.stringify(INITIAL_SHIFTS)],
          [KEYS.SHIFT_ASSIGNMENTS, JSON.stringify(INITIAL_SHIFT_ASSIGNMENTS)],
          [KEYS.ROSTER, JSON.stringify(INITIAL_ROSTER)],
          [KEYS.NOTIFICATIONS, JSON.stringify(INITIAL_NOTIFICATIONS)],
          [KEYS.APPRAISALS, JSON.stringify(INITIAL_APPRAISALS)],
          [KEYS.EXITS, JSON.stringify(INITIAL_EXITS)],
          [KEYS.HR_DOCUMENTS, JSON.stringify(INITIAL_HR_DOCUMENTS)],
          [KEYS.EMPLOYEE_DOCUMENTS, JSON.stringify(INITIAL_EMPLOYEE_DOCUMENTS)],
          ['@bgspl_initialized', 'true'],
        ];
        await AsyncStorage.multiSet(initialPairs);
      } else {
        const [hrCheck, empCheck] = await Promise.all([
          AsyncStorage.getItem(KEYS.HR_DOCUMENTS),
          AsyncStorage.getItem(KEYS.EMPLOYEE_DOCUMENTS),
        ]);
        if (!hrCheck) {
          await this.setHrDocuments(INITIAL_HR_DOCUMENTS);
        }
        if (!empCheck) {
          await this.setEmployeeDocuments(INITIAL_EMPLOYEE_DOCUMENTS);
        }
      }
    } catch (e) {
      console.error('Storage initialization error:', e);
    }
  }

  async getActiveSession(): Promise<ActiveSession> {
    const raw = await AsyncStorage.getItem(KEYS.ACTIVE_SESSION);
    return raw ? JSON.parse(raw) : null;
  }
  async setActiveSession(session: ActiveSession): Promise<void> {
    if (!session) {
      await AsyncStorage.removeItem(KEYS.ACTIVE_SESSION);
    } else {
      await AsyncStorage.setItem(KEYS.ACTIVE_SESSION, JSON.stringify(session));
    }
  }

  private async getJson<T>(key: string, fallback: T): Promise<T> {
    try {
      const raw = await AsyncStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  }
  private async setJson<T>(key: string, val: T): Promise<void> {
    await AsyncStorage.setItem(key, JSON.stringify(val));
  }

  getClients = () => this.getJson<Client[]>(KEYS.CLIENTS, INITIAL_CLIENTS);
  setClients = (val: Client[]) => this.setJson(KEYS.CLIENTS, val);

  getLeads = async (): Promise<Lead[]> => {
    const stored = await this.getJson<Lead[]>(KEYS.LEADS, INITIAL_LEADS);
    const hasApprovalLeads = stored.some((l) => l.quoteStatus === 'Accepted');
    if (!hasApprovalLeads) {
      const merged = [...stored, ...INITIAL_LEADS.filter((il) => !stored.some((sl) => sl.id === il.id))];
      await this.setLeads(merged);
      return merged;
    }
    return stored;
  };
  setLeads = (val: Lead[]) => this.setJson(KEYS.LEADS, val);

  getFollowUps = () => this.getJson<FollowUp[]>(KEYS.FOLLOW_UPS, INITIAL_FOLLOW_UPS);
  setFollowUps = (val: FollowUp[]) => this.setJson(KEYS.FOLLOW_UPS, val);

  getQuotes = () => this.getJson<Quote[]>(KEYS.QUOTES, INITIAL_QUOTES);
  setQuotes = (val: Quote[]) => this.setJson(KEYS.QUOTES, val);

  getProjects = () => this.getJson<Project[]>(KEYS.PROJECTS, INITIAL_PROJECTS);
  setProjects = (val: Project[]) => this.setJson(KEYS.PROJECTS, val);

  getVendors = () => this.getJson<Vendor[]>(KEYS.VENDORS, INITIAL_VENDORS);
  setVendors = (val: Vendor[]) => this.setJson(KEYS.VENDORS, val);

  getTenders = () => this.getJson<Tender[]>(KEYS.TENDERS, INITIAL_TENDERS);
  setTenders = (val: Tender[]) => this.setJson(KEYS.TENDERS, val);

  getWorkOrders = () => this.getJson<WorkOrder[]>(KEYS.WORK_ORDERS, INITIAL_WORK_ORDERS);
  setWorkOrders = (val: WorkOrder[]) => this.setJson(KEYS.WORK_ORDERS, val);

  getVendorApplications = () => this.getJson<VendorApplication[]>(KEYS.VENDOR_APPLICATIONS, INITIAL_VENDOR_APPLICATIONS);
  setVendorApplications = (val: VendorApplication[]) => this.setJson(KEYS.VENDOR_APPLICATIONS, val);

  getClarifications = () => this.getJson<TenderClarification[]>(KEYS.CLARIFICATIONS, INITIAL_CLARIFICATIONS);
  setClarifications = (val: TenderClarification[]) => this.setJson(KEYS.CLARIFICATIONS, val);

  getSavedTenders = () => this.getJson<Record<string, string[]>>(KEYS.SAVED_TENDERS, {});
  setSavedTenders = (val: Record<string, string[]>) => this.setJson(KEYS.SAVED_TENDERS, val);

  getDocuments = () => this.getJson<DocumentItem[]>(KEYS.DOCUMENTS, INITIAL_DOCUMENTS);
  setDocuments = (val: DocumentItem[]) => this.setJson(KEYS.DOCUMENTS, val);

  getHrDocuments = () => this.getJson<HrDocument[]>(KEYS.HR_DOCUMENTS, INITIAL_HR_DOCUMENTS);
  setHrDocuments = (val: HrDocument[]) => this.setJson(KEYS.HR_DOCUMENTS, val);

  getEmployeeDocuments = () => this.getJson<EmployeeDocumentRecord[]>(KEYS.EMPLOYEE_DOCUMENTS, INITIAL_EMPLOYEE_DOCUMENTS);
  setEmployeeDocuments = (val: EmployeeDocumentRecord[]) => this.setJson(KEYS.EMPLOYEE_DOCUMENTS, val);

  getDispatches = () => this.getJson<DispatchRecord[]>(KEYS.DISPATCHES, INITIAL_DISPATCHES);
  setDispatches = (val: DispatchRecord[]) => this.setJson(KEYS.DISPATCHES, val);

  getScanInbox = () => this.getJson<ScanItem[]>(KEYS.SCAN_INBOX, SEEDED_SCANS as any);
  setScanInbox = (val: ScanItem[]) => this.setJson(KEYS.SCAN_INBOX, val);

  getGovtDocRecords = () => this.getJson<Record<string, GovtDocumentRecord>>(KEYS.GOVT_DOC_RECORDS, SEEDED_DOC_RECORDS);
  setGovtDocRecords = (val: Record<string, GovtDocumentRecord>) => this.setJson(KEYS.GOVT_DOC_RECORDS, val);

  getEmployees = () => this.getJson<Employee[]>(KEYS.EMPLOYEES, INITIAL_EMPLOYEES);
  setEmployees = (val: Employee[]) => this.setJson(KEYS.EMPLOYEES, val);

  getAttendance = () => this.getJson<AttendanceRecord[]>(KEYS.ATTENDANCE, buildSeededAttendance(INITIAL_EMPLOYEES));
  setAttendance = (val: AttendanceRecord[]) => this.setJson(KEYS.ATTENDANCE, val);

  getCorrections = () => this.getJson<AttendanceCorrection[]>(KEYS.CORRECTIONS, INITIAL_CORRECTIONS);
  setCorrections = (val: AttendanceCorrection[]) => this.setJson(KEYS.CORRECTIONS, val);

  getLeaveBalances = () => this.getJson<Record<string, LeaveBalance[]>>(KEYS.LEAVE_BALANCES, INITIAL_LEAVE_BALANCES);
  setLeaveBalances = (val: Record<string, LeaveBalance[]>) => this.setJson(KEYS.LEAVE_BALANCES, val);

  getLeaves = () => this.getJson<LeaveRequest[]>(KEYS.LEAVES, INITIAL_LEAVES);
  setLeaves = (val: LeaveRequest[]) => this.setJson(KEYS.LEAVES, val);

  getExpenses = () => this.getJson<ExpenseClaim[]>(KEYS.EXPENSES, INITIAL_EXPENSES);
  setExpenses = (val: ExpenseClaim[]) => this.setJson(KEYS.EXPENSES, val);

  getQueries = () => this.getJson<ExpenseQuery[]>(KEYS.QUERIES, INITIAL_QUERIES);
  setQueries = (val: ExpenseQuery[]) => this.setJson(KEYS.QUERIES, val);

  getReimbursements = () => this.getJson<ReimbursementClaim[]>(KEYS.REIMBURSEMENTS, INITIAL_REIMBURSEMENTS);
  setReimbursements = (val: ReimbursementClaim[]) => this.setJson(KEYS.REIMBURSEMENTS, val);

  getInvoices = async (): Promise<FinanceInvoice[]> => {
    const list = await this.getJson<FinanceInvoice[]>(KEYS.INVOICES, INITIAL_INVOICES);
    return list.map((inv) => {
      const seed = INITIAL_INVOICES.find((s) => s.id === inv.id || s.invoiceNo === inv.invoiceNo);
      return {
        ...inv,
        date: inv.date || inv.invoiceDate || seed?.date || '2026-08-10',
        invoiceDate: inv.invoiceDate || inv.date || seed?.invoiceDate || '2026-08-10',
        dueDate: inv.dueDate || (inv as any).due_date || seed?.dueDate || '2026-09-10',
      };
    });
  };
  setInvoices = (val: FinanceInvoice[]) => this.setJson(KEYS.INVOICES, val);

  getVendorBills = async (): Promise<VendorBill[]> => {
    const list = await this.getJson<VendorBill[]>(KEYS.VENDOR_BILLS, INITIAL_VENDOR_BILLS);
    return list.map((vb) => {
      const seed = INITIAL_VENDOR_BILLS.find((s) => s.id === vb.id || s.billNo === vb.billNo);
      return {
        ...vb,
        date: vb.date || vb.billDate || seed?.date || '2026-08-15',
        billDate: vb.billDate || vb.date || seed?.billDate || '2026-08-15',
        dueDate: vb.dueDate || seed?.dueDate || '2026-09-15',
      };
    });
  };
  setVendorBills = (val: VendorBill[]) => this.setJson(KEYS.VENDOR_BILLS, val);

  getVouchers = () => this.getJson<FinanceVoucher[]>(KEYS.VOUCHERS, INITIAL_VOUCHERS);
  setVouchers = (val: FinanceVoucher[]) => this.setJson(KEYS.VOUCHERS, val);

  getTaxRecords = () => this.getJson<TdsRecord[]>(KEYS.TAX_RECORDS, INITIAL_TAX_RECORDS);
  setTaxRecords = (val: TdsRecord[]) => this.setJson(KEYS.TAX_RECORDS, val);

  getGstReturns = () => this.getJson<GstReturn[]>(KEYS.GST_RETURNS, INITIAL_GST_RETURNS);
  setGstReturns = (val: GstReturn[]) => this.setJson(KEYS.GST_RETURNS, val);

  getSalaryStructures = () => this.getJson<SalaryStructure[]>(KEYS.SALARY_STRUCTURES, INITIAL_SALARY_STRUCTURES);
  setSalaryStructures = (val: SalaryStructure[]) => this.setJson(KEYS.SALARY_STRUCTURES, val);

  getPayslips = () => this.getJson<Payslip[]>(KEYS.PAYSLIPS, INITIAL_PAYSLIPS);
  setPayslips = (val: Payslip[]) => this.setJson(KEYS.PAYSLIPS, val);

  getPayrollRuns = () => this.getJson<PayrollRun[]>(KEYS.PAYROLL_RUNS, INITIAL_PAYROLL_RUNS);
  setPayrollRuns = (val: PayrollRun[]) => this.setJson(KEYS.PAYROLL_RUNS, val);

  getDepartments = () => this.getJson<Department[]>(KEYS.DEPARTMENTS, INITIAL_DEPARTMENTS);
  setDepartments = (val: Department[]) => this.setJson(KEYS.DEPARTMENTS, val);

  getDesignations = () => this.getJson<Designation[]>(KEYS.DESIGNATIONS, INITIAL_DESIGNATIONS);
  setDesignations = (val: Designation[]) => this.setJson(KEYS.DESIGNATIONS, val);

  getShifts = () => this.getJson<Shift[]>(KEYS.SHIFTS, INITIAL_SHIFTS);
  setShifts = (val: Shift[]) => this.setJson(KEYS.SHIFTS, val);

  getShiftAssignments = () => this.getJson<ShiftAssignment[]>(KEYS.SHIFT_ASSIGNMENTS, INITIAL_SHIFT_ASSIGNMENTS);
  setShiftAssignments = (val: ShiftAssignment[]) => this.setJson(KEYS.SHIFT_ASSIGNMENTS, val);

  getRoster = () => this.getJson<RosterEntry[]>(KEYS.ROSTER, INITIAL_ROSTER);
  setRoster = (val: RosterEntry[]) => this.setJson(KEYS.ROSTER, val);

  getNotifications = () => this.getJson<AppNotification[]>(KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);
  setNotifications = (val: AppNotification[]) => this.setJson(KEYS.NOTIFICATIONS, val);

  getAppraisals = () => this.getJson<PerformanceAppraisal[]>(KEYS.APPRAISALS, INITIAL_APPRAISALS);
  setAppraisals = (val: PerformanceAppraisal[]) => this.setJson(KEYS.APPRAISALS, val);

  getExits = () => this.getJson<EmployeeExitRequest[]>(KEYS.EXITS, INITIAL_EXITS);
  setExits = (val: EmployeeExitRequest[]) => this.setJson(KEYS.EXITS, val);

  async resetAllToDefaults(): Promise<void> {
    await AsyncStorage.clear();
    await this.initStorage();
  }
}

export const mobileStorage = new MobileStorage();
