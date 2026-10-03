import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import {
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
  GstTransaction,
  FinanceOverviewMetrics,
  SalaryStructure,
  Payslip,
  PayrollRun,
  Employee,
  Department,
  Designation,
  Shift,
  ShiftAssignment,
  RosterEntry,
  PerformanceAppraisal,
  EmployeeExitRequest,
  HrDocument,
  EmployeeDocumentRecord,
} from '../types';
import {
  attendanceService,
  leaveService,
  expenseService,
  reimbursementService,
  financeService,
  employeeService,
  payrollService,
  organizationService,
  performanceService,
  exitService,
  shiftService,
  hrmsDocumentService,
  UploadHrDocInput,
  UploadEmployeeDocInput,
  HierarchyNode,
} from '../services';
import { mobileStorage } from '../storage';
import { useAuth } from './AuthContext';

interface HrmsContextType {
  employees: Employee[];
  attendance: AttendanceRecord[];
  todayAttendance: AttendanceRecord | null;
  corrections: AttendanceCorrection[];
  leaveBalances: LeaveBalance[];
  leaves: LeaveRequest[];
  expenses: ExpenseClaim[];
  queries: ExpenseQuery[];
  reimbursements: ReimbursementClaim[];
  invoices: FinanceInvoice[];
  vendorBills: VendorBill[];
  vouchers: FinanceVoucher[];
  taxRecords: TdsRecord[];
  gstReturns: GstReturn[];
  gstTransactions: GstTransaction[];
  salaryStructures: SalaryStructure[];
  payslips: Payslip[];
  payrollRuns: PayrollRun[];
  departments: Department[];
  designations: Designation[];
  shifts: Shift[];
  shiftAssignments: ShiftAssignment[];
  roster: RosterEntry[];
  appraisals: PerformanceAppraisal[];
  exits: EmployeeExitRequest[];
  isLoading: boolean;
  refreshHrms: () => Promise<void>;
  punchIn: (location?: string, coords?: { latitude: number; longitude: number }, punchSource?: string) => Promise<AttendanceRecord>;
  punchOut: () => Promise<AttendanceRecord>;
  submitCorrection: (
    date: string,
    reqIn: string,
    reqOut: string,
    reason: string,
    currIn?: string,
    currOut?: string
  ) => Promise<AttendanceCorrection>;
  reviewCorrection: (id: string, status: 'Approved' | 'Rejected', comment: string) => Promise<void>;
  approveCorrection: (id: string, hrRemarks?: string) => Promise<void>;
  applyLeave: (
    leaveType: string,
    startDate: string,
    endDate: string,
    reason: string,
    contactDuringLeave?: string
  ) => Promise<LeaveRequest>;
  reviewLeave: (
    id: string,
    decision: 'Approved' | 'Partially Approved' | 'Rejected',
    comment: string,
    customApprovedDays?: number
  ) => Promise<boolean>;
  approveLeave: (id: string, comment?: string) => Promise<void>;
  rejectLeave: (id: string, reason: string) => Promise<void>;
  cancelLeave: (id: string) => Promise<boolean>;
  submitExpense: (data: any) => Promise<ExpenseClaim>;
  updateExpenseStatus: (id: string, status: any, remarks: string, approvedAmount?: number) => Promise<ExpenseClaim>;
  reviewExpense: (id: string, reviewData: any) => Promise<ExpenseClaim>;
  raiseExpenseQuery: (expenseId: string, message: string, raisedBy?: string) => Promise<ExpenseQuery>;
  resolveExpenseQuery: (queryId: string, response: string) => Promise<void>;
  respondExpenseQuery: (queryIdOrExpenseId: string, response: string) => Promise<void>;
  settleExpense: (id: string, utrRefOrData: any, date?: string) => Promise<ExpenseClaim>;
  submitReimbursement: (data: any) => Promise<ReimbursementClaim>;
  updateReimbursementStatus: (id: string, status: any, approvedAmount?: number) => Promise<ReimbursementClaim>;
  reviewReimbursement: (id: string, reviewData: any) => Promise<ReimbursementClaim>;
  raiseReimbursementQuery: (claimId: string, message: string) => Promise<ReimbursementClaim>;
  respondReimbursementQuery: (claimId: string, response: string) => Promise<ReimbursementClaim>;
  settleReimbursement: (id: string, utrRefOrData: any) => Promise<ReimbursementClaim>;
  createInvoice: (data: any) => Promise<FinanceInvoice>;
  updateInvoiceStatus: (id: string, status: any, paidAmount?: number, paymentMode?: string) => Promise<FinanceInvoice>;
  recordVendorBill: (data: any) => Promise<VendorBill>;
  updateVendorBillStatus: (id: string, status: any, paymentDetails?: any) => Promise<VendorBill>;
  createVoucher: (data: any) => Promise<FinanceVoucher>;
  updateTaxStatus: (id: string, status: 'Deposited' | 'Pending Deposit', challanDetails?: any) => Promise<TdsRecord>;
  getOverviewMetrics: () => Promise<FinanceOverviewMetrics>;
  createEmployee: (data: any) => Promise<Employee>;
  updateEmployee: (id: string, data: any) => Promise<Employee>;
  deleteEmployee: (id: string) => Promise<void>;
  createDepartment: (data: any) => Promise<Department>;
  updateDepartment: (id: string, data: any) => Promise<Department>;
  deleteDepartment: (id: string) => Promise<void>;
  createDesignation: (data: any) => Promise<Designation>;
  updateDesignation: (id: string, data: any) => Promise<Designation>;
  saveDesignation: (data: any) => Promise<Designation>;
  deleteDesignation: (id: string) => Promise<void>;
  getOrganizationHierarchy: () => Promise<HierarchyNode[]>;
  createAppraisal: (data: any) => Promise<PerformanceAppraisal>;
  initiateExit: (data: any) => Promise<EmployeeExitRequest>;
  updateClearance: (
    exitId: string,
    department: string,
    status: 'Pending' | 'Approved' | 'Rejected',
    notes: string
  ) => Promise<EmployeeExitRequest>;
  finalizeFnF: (exitId: string, bankReference?: string) => Promise<EmployeeExitRequest>;
  runMonthlyPayroll: (month: string, year: number) => Promise<Payslip[]>;
  processPayroll: (monthKey: string, monthLabel?: string) => Promise<{ run: PayrollRun; payslips: Payslip[] }>;
  updateSalaryStructure: (id: string, data: Partial<SalaryStructure>) => Promise<SalaryStructure>;
  createShift: (data: any) => Promise<Shift>;
  updateShift: (id: string, data: any) => Promise<Shift>;
  deleteShift: (id: string) => Promise<void>;
  toggleShiftStatus: (id: string) => Promise<Shift>;
  assignShift: (data: any) => Promise<ShiftAssignment>;
  saveRosterEntry: (entry: any) => Promise<RosterEntry>;
  hrDocuments: HrDocument[];
  employeeDocuments: EmployeeDocumentRecord[];
  uploadHrDocument: (input: UploadHrDocInput) => Promise<HrDocument>;
  deleteHrDocument: (id: string) => Promise<boolean>;
  uploadEmployeeDocument: (input: UploadEmployeeDocInput) => Promise<EmployeeDocumentRecord>;
  replaceEmployeeDocument: (existingDocId: string, input: Partial<UploadEmployeeDocInput>) => Promise<EmployeeDocumentRecord>;
  verifyEmployeeDocument: (docId: string) => Promise<EmployeeDocumentRecord>;
  deleteEmployeeDocument: (id: string) => Promise<boolean>;
  refreshDocuments: () => Promise<void>;
}

const HrmsContext = createContext<HrmsContextType | undefined>(undefined);

export const HrmsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { session } = useAuth();
  const activeEmployeeId = session?.accountType === 'team' ? (session as any).employeeId : 'BGS-2021-001';
  const activeEmployeeName = session?.accountType === 'team' ? (session as any).name : 'Active User';

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [todayAttendance, setTodayAttendance] = useState<AttendanceRecord | null>(null);
  const [corrections, setCorrections] = useState<AttendanceCorrection[]>([]);
  const [leaveBalances, setLeaveBalances] = useState<LeaveBalance[]>([]);
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [expenses, setExpenses] = useState<ExpenseClaim[]>([]);
  const [queries, setQueries] = useState<ExpenseQuery[]>([]);
  const [reimbursements, setReimbursements] = useState<ReimbursementClaim[]>([]);
  const [invoices, setInvoices] = useState<FinanceInvoice[]>([]);
  const [vendorBills, setVendorBills] = useState<VendorBill[]>([]);
  const [vouchers, setVouchers] = useState<FinanceVoucher[]>([]);
  const [taxRecords, setTaxRecords] = useState<TdsRecord[]>([]);
  const [gstReturns, setGstReturns] = useState<GstReturn[]>([]);
  const [gstTransactions, setGstTransactions] = useState<GstTransaction[]>([]);
  const [salaryStructures, setSalaryStructures] = useState<SalaryStructure[]>([]);
  const [payslips, setPayslips] = useState<Payslip[]>([]);
  const [payrollRuns, setPayrollRuns] = useState<PayrollRun[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [designations, setDesignations] = useState<Designation[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [shiftAssignments, setShiftAssignments] = useState<ShiftAssignment[]>([]);
  const [roster, setRoster] = useState<RosterEntry[]>([]);
  const [appraisals, setAppraisals] = useState<PerformanceAppraisal[]>([]);
  const [exits, setExits] = useState<EmployeeExitRequest[]>([]);
  const [hrDocuments, setHrDocuments] = useState<HrDocument[]>([]);
  const [employeeDocuments, setEmployeeDocuments] = useState<EmployeeDocumentRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const loadData = useCallback(async () => {
    try {
      const [
        emp,
        att,
        today,
        corr,
        bal,
        l,
        exp,
        qry,
        reimb,
        inv,
        vb,
        vch,
        txR,
        gstR,
        gstT,
        sal,
        ps,
        pr,
        dept,
        desig,
        appr,
        ext,
        shf,
        asgn,
        rst,
        hrDocs,
        empDocs,
      ] = await Promise.all([
        employeeService.getEmployees(),
        attendanceService.getAllRecords(),
        attendanceService.getTodayRecord(activeEmployeeId),
        mobileStorage.getCorrections(),
        leaveService.getBalances(activeEmployeeId),
        leaveService.getAllRequests(),
        expenseService.getAllExpenses(),
        mobileStorage.getQueries(),
        reimbursementService.getAllClaims(),
        financeService.getInvoices(),
        financeService.getVendorBills(),
        financeService.getVouchers(),
        financeService.getTaxRecords(),
        financeService.getGstReturns(),
        financeService.getGstTransactions(),
        payrollService.getSalaryStructures(),
        payrollService.getPayslips(),
        payrollService.getPayrollRuns(),
        organizationService.getDepartments(),
        organizationService.getDesignations(),
        performanceService.getAppraisals(),
        exitService.getExits(),
        shiftService.getShifts(),
        shiftService.getAssignments(),
        shiftService.getRoster(),
        hrmsDocumentService.getHrDocuments(),
        hrmsDocumentService.getEmployeeDocuments(),
      ]);

      setEmployees(emp);
      setAttendance(att);
      setTodayAttendance(today);
      setCorrections(corr);
      setLeaveBalances(bal);
      setLeaves(l);
      setExpenses(exp);
      setQueries(qry);
      setReimbursements(reimb);
      setInvoices(inv);
      setVendorBills(vb);
      setVouchers(vch);
      setTaxRecords(txR);
      setGstReturns(gstR);
      setGstTransactions(gstT);
      setSalaryStructures(sal);
      setPayslips(ps);
      setPayrollRuns(pr);
      setDepartments(dept);
      setDesignations(desig);
      setAppraisals(appr);
      setExits(ext);
      setShifts(shf);
      setShiftAssignments(asgn);
      setRoster(rst);
      setHrDocuments(hrDocs);
      setEmployeeDocuments(empDocs);
    } catch (e) {
      console.error('Error loading HRMS data:', e);
    } finally {
      setIsLoading(false);
    }
  }, [activeEmployeeId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const punchIn = async (
    location: string = 'Jaipur Corporate HQ',
    coords?: { latitude: number; longitude: number },
    punchSource?: string
  ) => {
    const dept = (session as any)?.department || 'Geology & Mineral Exploration';
    const record = await attendanceService.punchIn(
      activeEmployeeId,
      activeEmployeeName,
      dept,
      location,
      punchSource,
      coords
    );
    await loadData();
    return record;
  };

  const punchOut = async () => {
    const record = await attendanceService.punchOut(activeEmployeeId);
    await loadData();
    return record;
  };

  const submitCorrection = async (
    date: string,
    reqIn: string,
    reqOut: string,
    reason: string,
    currIn?: string,
    currOut?: string
  ) => {
    const dept = (session as any)?.department || 'Geology & Mineral Exploration';
    const corr = await attendanceService.submitCorrection(
      activeEmployeeId,
      activeEmployeeName,
      dept,
      date,
      currIn || '-',
      currOut || '-',
      reqIn,
      reqOut,
      reason
    );
    await loadData();
    return corr;
  };

  const reviewCorrection = async (id: string, status: 'Approved' | 'Rejected', comment: string) => {
    await attendanceService.reviewCorrection(id, status, activeEmployeeName, comment);
    await loadData();
  };

  const approveCorrection = async (id: string, hrRemarks?: string) => {
    await reviewCorrection(id, 'Approved', hrRemarks || 'Approved by HR');
  };

  const applyLeave = async (
    leaveType: string,
    startDate: string,
    endDate: string,
    reason: string,
    contactDuringLeave?: string
  ) => {
    const req = await leaveService.applyLeave({
      employeeId: activeEmployeeId,
      employeeName: activeEmployeeName,
      department: (session as any)?.department || 'Geology & Mineral Exploration',
      leaveType,
      startDate,
      endDate,
      reason,
      contactDuringLeave,
    });
    await loadData();
    return req;
  };

  const reviewLeave = async (
    id: string,
    decision: 'Approved' | 'Partially Approved' | 'Rejected',
    comment: string,
    customApprovedDays?: number
  ) => {
    const res = await leaveService.reviewLeave(
      id,
      decision,
      activeEmployeeName,
      comment,
      customApprovedDays,
      activeEmployeeId
    );
    await loadData();
    return res;
  };

  const approveLeave = async (id: string, comment?: string) => {
    await leaveService.reviewLeave(
      id,
      'Approved',
      activeEmployeeName,
      comment || 'Approved in full.',
      undefined,
      activeEmployeeId
    );
    await loadData();
  };

  const rejectLeave = async (id: string, reason: string) => {
    await leaveService.reviewLeave(
      id,
      'Rejected',
      activeEmployeeName,
      reason,
      undefined,
      activeEmployeeId
    );
    await loadData();
  };

  const cancelLeave = async (id: string) => {
    const res = await leaveService.cancelLeave(id);
    await loadData();
    return res;
  };

  const submitExpense = async (data: any) => {
    const exp = await expenseService.submitExpense({
      employeeId: activeEmployeeId,
      employeeName: activeEmployeeName,
      department: (session as any)?.department || 'Geology & Mineral Exploration',
      ...data,
    });
    await loadData();
    return exp;
  };

  const updateExpenseStatus = async (id: string, status: any, remarks: string, approvedAmount?: number) => {
    const exp = await expenseService.updateExpenseStatus(id, status, remarks, approvedAmount);
    await loadData();
    return exp;
  };

  const reviewExpense = async (id: string, reviewData: any) => {
    const exp = await expenseService.reviewExpense(id, {
      reviewerName: activeEmployeeName,
      ...reviewData,
    });
    await loadData();
    return exp;
  };

  const raiseExpenseQuery = async (expenseId: string, message: string, raisedBy?: string) => {
    const q = await expenseService.raiseQuery(expenseId, activeEmployeeId, message, raisedBy || activeEmployeeName);
    await loadData();
    return q;
  };

  const resolveExpenseQuery = async (queryId: string, response: string) => {
    await expenseService.resolveQuery(queryId, response);
    await loadData();
  };

  const respondExpenseQuery = async (queryIdOrExpenseId: string, response: string) => {
    await expenseService.respondQuery(queryIdOrExpenseId, response, activeEmployeeName);
    await loadData();
  };

  const settleExpense = async (id: string, utrRefOrData: any, date?: string) => {
    const settlementPayload =
      typeof utrRefOrData === 'string'
        ? { settlementReference: utrRefOrData, settlementDate: date, settledBy: activeEmployeeName }
        : { settledBy: activeEmployeeName, ...utrRefOrData };
    const exp = await expenseService.settleExpense(id, settlementPayload);
    await loadData();
    return exp;
  };

  const submitReimbursement = async (data: any) => {
    const r = await reimbursementService.submitClaim({
      employeeId: activeEmployeeId,
      employeeName: activeEmployeeName,
      department: (session as any)?.department || 'Geology & Mineral Exploration',
      ...data,
    });
    await loadData();
    return r;
  };

  const updateReimbursementStatus = async (id: string, status: any, approvedAmount?: number) => {
    const r = await reimbursementService.updateClaimStatus(id, status, approvedAmount);
    await loadData();
    return r;
  };

  const reviewReimbursement = async (id: string, reviewData: any) => {
    const r = await reimbursementService.reviewClaim(id, {
      reviewerName: activeEmployeeName,
      ...reviewData,
    });
    await loadData();
    return r;
  };

  const raiseReimbursementQuery = async (claimId: string, message: string) => {
    const r = await reimbursementService.raiseQuery(claimId, message, activeEmployeeName);
    await loadData();
    return r;
  };

  const respondReimbursementQuery = async (claimId: string, response: string) => {
    const r = await reimbursementService.respondQuery(claimId, response, activeEmployeeName);
    await loadData();
    return r;
  };

  const settleReimbursement = async (id: string, utrRefOrData: any) => {
    const settlementPayload =
      typeof utrRefOrData === 'string'
        ? { settlementReference: utrRefOrData, settledBy: activeEmployeeName }
        : { settledBy: activeEmployeeName, ...utrRefOrData };
    const r = await reimbursementService.settleClaim(id, settlementPayload);
    await loadData();
    return r;
  };

  const createInvoice = async (data: any) => {
    const inv = await financeService.createInvoice(data);
    await loadData();
    return inv;
  };

  const updateInvoiceStatus = async (id: string, status: any, paidAmount?: number, paymentMode?: string) => {
    const inv = await financeService.updateInvoiceStatus(id, status, paidAmount, paymentMode);
    await loadData();
    return inv;
  };

  const recordVendorBill = async (data: any) => {
    const b = await financeService.recordVendorBill(data);
    await loadData();
    return b;
  };

  const updateVendorBillStatus = async (id: string, status: any, paymentDetails?: any) => {
    const b = await financeService.updateVendorBillStatus(id, status, paymentDetails);
    await loadData();
    return b;
  };

  const createVoucher = async (data: any) => {
    const v = await financeService.createVoucher(data);
    await loadData();
    return v;
  };

  const updateTaxStatus = async (id: string, status: 'Deposited' | 'Pending Deposit', challanDetails?: any) => {
    const t = await financeService.updateTaxStatus(id, status, challanDetails);
    await loadData();
    return t;
  };

  const getOverviewMetrics = async () => {
    return financeService.getOverviewMetrics();
  };

  const createEmployee = async (data: any) => {
    const emp = await employeeService.createEmployee(data);
    await loadData();
    return emp;
  };

  const updateEmployee = async (id: string, data: any) => {
    const emp = await employeeService.updateEmployee(id, data);
    await loadData();
    return emp;
  };

  const deleteEmployee = async (id: string) => {
    await employeeService.deleteEmployee(id);
    await loadData();
  };

  const createDepartment = async (data: any) => {
    const dept = await organizationService.createDepartment(data);
    await loadData();
    return dept;
  };

  const updateDepartment = async (id: string, data: any) => {
    const dept = await organizationService.updateDepartment(id, data);
    await loadData();
    return dept;
  };

  const deleteDepartment = async (id: string) => {
    await organizationService.deleteDepartment(id);
    await loadData();
  };

  const createDesignation = async (data: any) => {
    const des = await organizationService.createDesignation(data);
    await loadData();
    return des;
  };

  const updateDesignation = async (id: string, data: any) => {
    const des = await organizationService.updateDesignation(id, data);
    await loadData();
    return des;
  };

  const saveDesignation = async (data: any) => {
    if (data.id) {
      return updateDesignation(data.id, data);
    }
    return createDesignation(data);
  };

  const deleteDesignation = async (id: string) => {
    await organizationService.deleteDesignation(id);
    await loadData();
  };

  const getOrganizationHierarchy = async () => {
    return organizationService.getOrganizationHierarchy();
  };

  const createAppraisal = async (data: any) => {
    const appr = await performanceService.createAppraisal(data);
    await loadData();
    return appr;
  };

  const initiateExit = async (data: any) => {
    const ext = await exitService.initiateExit(data);
    await loadData();
    return ext;
  };

  const updateClearance = async (
    exitId: string,
    department: string,
    status: 'Pending' | 'Approved' | 'Rejected',
    notes: string
  ) => {
    const ext = await exitService.updateClearance(exitId, department, status, notes);
    await loadData();
    return ext;
  };

  const finalizeFnF = async (exitId: string, bankReference?: string) => {
    const ext = await exitService.finalizeFnF(exitId, bankReference);
    await loadData();
    return ext;
  };

  const runMonthlyPayroll = async (month: string, year: number) => {
    const ps = await payrollService.runMonthlyPayroll(month, year);
    await loadData();
    return ps;
  };

  const processPayroll = async (monthKey: string, monthLabel?: string) => {
    const res = await payrollService.processPayroll(monthKey, monthLabel, activeEmployeeName);
    await loadData();
    return res;
  };

  const updateSalaryStructure = async (id: string, data: Partial<SalaryStructure>) => {
    const res = await payrollService.updateSalaryStructure(id, data);
    await loadData();
    return res;
  };

  const createShift = async (data: any) => {
    const s = await shiftService.createShift(data);
    await loadData();
    return s;
  };

  const updateShift = async (id: string, data: any) => {
    const s = await shiftService.updateShift(id, data);
    await loadData();
    return s;
  };

  const deleteShift = async (id: string) => {
    await shiftService.deleteShift(id);
    await loadData();
  };

  const toggleShiftStatus = async (id: string) => {
    const s = await shiftService.toggleShiftStatus(id);
    await loadData();
    return s;
  };

  const assignShift = async (data: any) => {
    const a = await shiftService.assignShift(data);
    await loadData();
    return a;
  };

  const saveRosterEntry = async (entry: any) => {
    const r = await shiftService.saveRosterEntry(entry);
    await loadData();
    return r;
  };

  return (
    <HrmsContext.Provider
      value={{
        employees,
        attendance,
        todayAttendance,
        corrections,
        leaveBalances,
        leaves,
        expenses,
        queries,
        reimbursements,
        invoices,
        vendorBills,
        vouchers,
        taxRecords,
        gstReturns,
        gstTransactions,
        salaryStructures,
        payslips,
        payrollRuns,
        departments,
        designations,
        shifts,
        shiftAssignments,
        roster,
        appraisals,
        exits,
        isLoading,
        refreshHrms: loadData,
        punchIn,
        punchOut,
        submitCorrection,
        reviewCorrection,
        approveCorrection,
        applyLeave,
        reviewLeave,
        approveLeave,
        rejectLeave,
        cancelLeave,
        submitExpense,
        updateExpenseStatus,
        reviewExpense,
        raiseExpenseQuery,
        resolveExpenseQuery,
        respondExpenseQuery,
        settleExpense,
        submitReimbursement,
        updateReimbursementStatus,
        reviewReimbursement,
        raiseReimbursementQuery,
        respondReimbursementQuery,
        settleReimbursement,
        createInvoice,
        updateInvoiceStatus,
        recordVendorBill,
        updateVendorBillStatus,
        createVoucher,
        updateTaxStatus,
        getOverviewMetrics,
        createEmployee,
        updateEmployee,
        deleteEmployee,
        createDepartment,
        updateDepartment,
        deleteDepartment,
        createDesignation,
        updateDesignation,
        saveDesignation,
        deleteDesignation,
        getOrganizationHierarchy,
        createAppraisal,
        initiateExit,
        updateClearance,
        finalizeFnF,
        runMonthlyPayroll,
        processPayroll,
        updateSalaryStructure,
        createShift,
        updateShift,
        deleteShift,
        toggleShiftStatus,
        assignShift,
        saveRosterEntry,
        hrDocuments,
        employeeDocuments,
        uploadHrDocument: async (input: UploadHrDocInput) => {
          const doc = await hrmsDocumentService.uploadHrDocument(input);
          setHrDocuments((prev) => [doc, ...prev]);
          return doc;
        },
        deleteHrDocument: async (id: string) => {
          const ok = await hrmsDocumentService.deleteHrDocument(id);
          if (ok) {
            setHrDocuments((prev) => prev.filter((d) => d.id !== id));
          }
          return ok;
        },
        uploadEmployeeDocument: async (input: UploadEmployeeDocInput) => {
          const doc = await hrmsDocumentService.uploadEmployeeDocument(input);
          const current = await hrmsDocumentService.getEmployeeDocuments();
          setEmployeeDocuments(current);
          return doc;
        },
        replaceEmployeeDocument: async (existingDocId: string, input: Partial<UploadEmployeeDocInput>) => {
          const doc = await hrmsDocumentService.replaceEmployeeDocument(existingDocId, input);
          const current = await hrmsDocumentService.getEmployeeDocuments();
          setEmployeeDocuments(current);
          return doc;
        },
        verifyEmployeeDocument: async (docId: string) => {
          const doc = await hrmsDocumentService.verifyEmployeeDocument(docId);
          setEmployeeDocuments((prev) => prev.map((d) => (d.id === docId ? doc : d)));
          return doc;
        },
        deleteEmployeeDocument: async (id: string) => {
          const ok = await hrmsDocumentService.deleteEmployeeDocument(id);
          if (ok) {
            setEmployeeDocuments((prev) => prev.filter((d) => d.id !== id));
          }
          return ok;
        },
        refreshDocuments: async () => {
          const [hDocs, eDocs] = await Promise.all([
            hrmsDocumentService.getHrDocuments(),
            hrmsDocumentService.getEmployeeDocuments(),
          ]);
          setHrDocuments(hDocs);
          setEmployeeDocuments(eDocs);
        },
      }}
    >
      {children}
    </HrmsContext.Provider>
  );
};

export const useHrms = () => {
  const context = useContext(HrmsContext);
  if (!context) {
    throw new Error('useHrms must be used within an HrmsProvider');
  }
  return context;
};
