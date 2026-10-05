import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
import {
  AttendanceRecord,
  AttendanceCorrection,
  LeaveBalance,
  LeaveRequest,
  ExpenseClaim,
  ExpenseQuery,
  ReimbursementClaim,
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
  refreshAttendance?: () => Promise<void>;
  refreshLeaves?: () => Promise<void>;
  refreshExpenses?: () => Promise<void>;
  refreshReimbursements?: () => Promise<void>;
  refreshEmployees?: () => Promise<void>;
  refreshOrganization?: () => Promise<void>;
  refreshAppraisals?: () => Promise<void>;
  refreshExits?: () => Promise<void>;
  refreshPayroll?: () => Promise<void>;
  refreshShifts?: () => Promise<void>;
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
  const activeDepartment = session?.accountType === 'team' ? (session as any).department || 'Geology & Mineral Exploration' : 'Geology & Mineral Exploration';

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [todayAttendance, setTodayAttendance] = useState<AttendanceRecord | null>(null);
  const [corrections, setCorrections] = useState<AttendanceCorrection[]>([]);
  const [leaveBalances, setLeaveBalances] = useState<LeaveBalance[]>([]);
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [expenses, setExpenses] = useState<ExpenseClaim[]>([]);
  const [queries, setQueries] = useState<ExpenseQuery[]>([]);
  const [reimbursements, setReimbursements] = useState<ReimbursementClaim[]>([]);
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

  const refreshAttendance = useCallback(async () => {
    try {
      const [att, today, corr] = await Promise.all([
        attendanceService.getAllRecords(),
        attendanceService.getTodayRecord(activeEmployeeId),
        mobileStorage.getCorrections(),
      ]);
      setAttendance(att);
      setTodayAttendance(today);
      setCorrections(corr);
    } catch (e) {
      console.error('Error refreshing attendance:', e);
    }
  }, [activeEmployeeId]);

  const refreshLeaves = useCallback(async () => {
    try {
      const [bal, l] = await Promise.all([
        leaveService.getBalances(activeEmployeeId),
        leaveService.getAllRequests(),
      ]);
      setLeaveBalances(bal);
      setLeaves(l);
    } catch (e) {
      console.error('Error refreshing leaves:', e);
    }
  }, [activeEmployeeId]);

  const refreshExpenses = useCallback(async () => {
    try {
      const [exp, qry] = await Promise.all([
        expenseService.getAllExpenses(),
        mobileStorage.getQueries(),
      ]);
      setExpenses(exp);
      setQueries(qry);
    } catch (e) {
      console.error('Error refreshing expenses:', e);
    }
  }, []);

  const refreshReimbursements = useCallback(async () => {
    try {
      const reimb = await reimbursementService.getAllClaims();
      setReimbursements(reimb);
    } catch (e) {
      console.error('Error refreshing reimbursements:', e);
    }
  }, []);

  const refreshEmployees = useCallback(async () => {
    try {
      const emp = await employeeService.getEmployees();
      setEmployees(emp);
    } catch (e) {
      console.error('Error refreshing employees:', e);
    }
  }, []);

  const refreshOrganization = useCallback(async () => {
    try {
      const [dept, desig] = await Promise.all([
        organizationService.getDepartments(),
        organizationService.getDesignations(),
      ]);
      setDepartments(dept);
      setDesignations(desig);
    } catch (e) {
      console.error('Error refreshing organization:', e);
    }
  }, []);

  const refreshAppraisals = useCallback(async () => {
    try {
      const appr = await performanceService.getAppraisals();
      setAppraisals(appr);
    } catch (e) {
      console.error('Error refreshing appraisals:', e);
    }
  }, []);

  const refreshExits = useCallback(async () => {
    try {
      const ext = await exitService.getExits();
      setExits(ext);
    } catch (e) {
      console.error('Error refreshing exits:', e);
    }
  }, []);

  const refreshPayroll = useCallback(async () => {
    try {
      const [sal, ps, pr] = await Promise.all([
        payrollService.getSalaryStructures(),
        payrollService.getPayslips(),
        payrollService.getPayrollRuns(),
      ]);
      setSalaryStructures(sal);
      setPayslips(ps);
      setPayrollRuns(pr);
    } catch (e) {
      console.error('Error refreshing payroll:', e);
    }
  }, []);

  const refreshShifts = useCallback(async () => {
    try {
      const [shf, asgn, rst] = await Promise.all([
        shiftService.getShifts(),
        shiftService.getAssignments(),
        shiftService.getRoster(),
      ]);
      setShifts(shf);
      setShiftAssignments(asgn);
      setRoster(rst);
    } catch (e) {
      console.error('Error refreshing shifts:', e);
    }
  }, []);

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

  const punchIn = useCallback(async (
    location: string = 'Jaipur Corporate HQ',
    coords?: { latitude: number; longitude: number },
    punchSource?: string
  ) => {
    const dept = activeDepartment;
    const record = await attendanceService.punchIn(
      activeEmployeeId,
      activeEmployeeName,
      dept,
      location,
      punchSource,
      coords
    );
    await refreshAttendance();
    return record;
  }, [activeEmployeeId, activeEmployeeName, activeDepartment, refreshAttendance]);

  const punchOut = useCallback(async () => {
    const record = await attendanceService.punchOut(activeEmployeeId);
    await refreshAttendance();
    return record;
  }, [activeEmployeeId, refreshAttendance]);

  const submitCorrection = useCallback(async (
    date: string,
    reqIn: string,
    reqOut: string,
    reason: string,
    currIn?: string,
    currOut?: string
  ) => {
    const dept = activeDepartment;
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
    await refreshAttendance();
    return corr;
  }, [activeEmployeeId, activeEmployeeName, activeDepartment, refreshAttendance]);

  const reviewCorrection = useCallback(async (id: string, status: 'Approved' | 'Rejected', comment: string) => {
    await attendanceService.reviewCorrection(id, status, activeEmployeeName, comment);
    await refreshAttendance();
  }, [activeEmployeeName, refreshAttendance]);

  const approveCorrection = useCallback(async (id: string, hrRemarks?: string) => {
    await reviewCorrection(id, 'Approved', hrRemarks || 'Approved by HR');
  }, [reviewCorrection]);

  const applyLeave = useCallback(async (
    leaveType: string,
    startDate: string,
    endDate: string,
    reason: string,
    contactDuringLeave?: string
  ) => {
    const req = await leaveService.applyLeave({
      employeeId: activeEmployeeId,
      employeeName: activeEmployeeName,
      department: activeDepartment,
      leaveType,
      startDate,
      endDate,
      reason,
      contactDuringLeave,
    });
    await refreshLeaves();
    return req;
  }, [activeEmployeeId, activeEmployeeName, activeDepartment, refreshLeaves]);

  const reviewLeave = useCallback(async (
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
    if (decision === 'Approved' || decision === 'Partially Approved') {
      await Promise.all([refreshLeaves(), refreshAttendance()]);
    } else {
      await refreshLeaves();
    }
    return res;
  }, [activeEmployeeId, activeEmployeeName, refreshLeaves, refreshAttendance]);

  const approveLeave = useCallback(async (id: string, comment?: string) => {
    await leaveService.reviewLeave(
      id,
      'Approved',
      activeEmployeeName,
      comment || 'Approved in full.',
      undefined,
      activeEmployeeId
    );
    await Promise.all([refreshLeaves(), refreshAttendance()]);
  }, [activeEmployeeId, activeEmployeeName, refreshLeaves, refreshAttendance]);

  const rejectLeave = useCallback(async (id: string, reason: string) => {
    await leaveService.reviewLeave(
      id,
      'Rejected',
      activeEmployeeName,
      reason,
      undefined,
      activeEmployeeId
    );
    await refreshLeaves();
  }, [activeEmployeeId, activeEmployeeName, refreshLeaves]);

  const cancelLeave = useCallback(async (id: string) => {
    const res = await leaveService.cancelLeave(id);
    await refreshLeaves();
    return res;
  }, [refreshLeaves]);

  const submitExpense = useCallback(async (data: any) => {
    const exp = await expenseService.submitExpense({
      employeeId: activeEmployeeId,
      employeeName: activeEmployeeName,
      department: activeDepartment,
      ...data,
    });
    await refreshExpenses();
    return exp;
  }, [activeEmployeeId, activeEmployeeName, activeDepartment, refreshExpenses]);

  const updateExpenseStatus = useCallback(async (id: string, status: any, remarks: string, approvedAmount?: number) => {
    const exp = await expenseService.updateExpenseStatus(id, status, remarks, approvedAmount);
    await refreshExpenses();
    return exp;
  }, [refreshExpenses]);

  const reviewExpense = useCallback(async (id: string, reviewData: any) => {
    const exp = await expenseService.reviewExpense(id, {
      reviewerName: activeEmployeeName,
      ...reviewData,
    });
    await refreshExpenses();
    return exp;
  }, [activeEmployeeName, refreshExpenses]);

  const raiseExpenseQuery = useCallback(async (expenseId: string, message: string, raisedBy?: string) => {
    const q = await expenseService.raiseQuery(expenseId, activeEmployeeId, message, raisedBy || activeEmployeeName);
    await refreshExpenses();
    return q;
  }, [activeEmployeeId, activeEmployeeName, refreshExpenses]);

  const resolveExpenseQuery = useCallback(async (queryId: string, response: string) => {
    await expenseService.resolveQuery(queryId, response);
    await refreshExpenses();
  }, [refreshExpenses]);

  const respondExpenseQuery = useCallback(async (queryIdOrExpenseId: string, response: string) => {
    await expenseService.respondQuery(queryIdOrExpenseId, response, activeEmployeeName);
    await refreshExpenses();
  }, [activeEmployeeName, refreshExpenses]);

  const settleExpense = useCallback(async (id: string, utrRefOrData: any, date?: string) => {
    const settlementPayload =
      typeof utrRefOrData === 'string'
        ? { settlementReference: utrRefOrData, settlementDate: date, settledBy: activeEmployeeName }
        : { settledBy: activeEmployeeName, ...utrRefOrData };
    const exp = await expenseService.settleExpense(id, settlementPayload);
    await refreshExpenses();
    return exp;
  }, [activeEmployeeName, refreshExpenses]);

  const submitReimbursement = useCallback(async (data: any) => {
    const r = await reimbursementService.submitClaim({
      employeeId: activeEmployeeId,
      employeeName: activeEmployeeName,
      department: activeDepartment,
      ...data,
    });
    await refreshReimbursements();
    return r;
  }, [activeEmployeeId, activeEmployeeName, activeDepartment, refreshReimbursements]);

  const updateReimbursementStatus = useCallback(async (id: string, status: any, approvedAmount?: number) => {
    const r = await reimbursementService.updateClaimStatus(id, status, approvedAmount);
    await refreshReimbursements();
    return r;
  }, [refreshReimbursements]);

  const reviewReimbursement = useCallback(async (id: string, reviewData: any) => {
    const r = await reimbursementService.reviewClaim(id, {
      reviewerName: activeEmployeeName,
      ...reviewData,
    });
    await refreshReimbursements();
    return r;
  }, [activeEmployeeName, refreshReimbursements]);

  const raiseReimbursementQuery = useCallback(async (claimId: string, message: string) => {
    const r = await reimbursementService.raiseQuery(claimId, message, activeEmployeeName);
    await refreshReimbursements();
    return r;
  }, [activeEmployeeName, refreshReimbursements]);

  const respondReimbursementQuery = useCallback(async (claimId: string, response: string) => {
    const r = await reimbursementService.respondQuery(claimId, response, activeEmployeeName);
    await refreshReimbursements();
    return r;
  }, [activeEmployeeName, refreshReimbursements]);

  const settleReimbursement = useCallback(async (id: string, utrRefOrData: any) => {
    const settlementPayload =
      typeof utrRefOrData === 'string'
        ? { settlementReference: utrRefOrData, settledBy: activeEmployeeName }
        : { settledBy: activeEmployeeName, ...utrRefOrData };
    const r = await reimbursementService.settleClaim(id, settlementPayload);
    await refreshReimbursements();
    return r;
  }, [activeEmployeeName, refreshReimbursements]);

  const createEmployee = useCallback(async (data: any) => {
    const emp = await employeeService.createEmployee(data);
    await Promise.all([refreshEmployees(), refreshLeaves(), refreshPayroll()]);
    return emp;
  }, [refreshEmployees, refreshLeaves, refreshPayroll]);

  const updateEmployee = useCallback(async (id: string, data: any) => {
    const emp = await employeeService.updateEmployee(id, data);
    await refreshEmployees();
    return emp;
  }, [refreshEmployees]);

  const deleteEmployee = useCallback(async (id: string) => {
    await employeeService.deleteEmployee(id);
    await refreshEmployees();
  }, [refreshEmployees]);

  const createDepartment = useCallback(async (data: any) => {
    const dept = await organizationService.createDepartment(data);
    await refreshOrganization();
    return dept;
  }, [refreshOrganization]);

  const updateDepartment = useCallback(async (id: string, data: any) => {
    const dept = await organizationService.updateDepartment(id, data);
    await refreshOrganization();
    return dept;
  }, [refreshOrganization]);

  const deleteDepartment = useCallback(async (id: string) => {
    await organizationService.deleteDepartment(id);
    await refreshOrganization();
  }, [refreshOrganization]);

  const createDesignation = useCallback(async (data: any) => {
    const des = await organizationService.createDesignation(data);
    await refreshOrganization();
    return des;
  }, [refreshOrganization]);

  const updateDesignation = useCallback(async (id: string, data: any) => {
    const des = await organizationService.updateDesignation(id, data);
    await refreshOrganization();
    return des;
  }, [refreshOrganization]);

  const saveDesignation = useCallback(async (data: any) => {
    if (data.id) {
      return updateDesignation(data.id, data);
    }
    return createDesignation(data);
  }, [updateDesignation, createDesignation]);

  const deleteDesignation = useCallback(async (id: string) => {
    await organizationService.deleteDesignation(id);
    await refreshOrganization();
  }, [refreshOrganization]);

  const getOrganizationHierarchy = useCallback(async () => {
    return organizationService.getOrganizationHierarchy();
  }, []);

  const createAppraisal = useCallback(async (data: any) => {
    const appr = await performanceService.createAppraisal(data);
    await refreshAppraisals();
    return appr;
  }, [refreshAppraisals]);

  const initiateExit = useCallback(async (data: any) => {
    const ext = await exitService.initiateExit(data);
    await refreshExits();
    return ext;
  }, [refreshExits]);

  const updateClearance = useCallback(async (
    exitId: string,
    department: string,
    status: 'Pending' | 'Approved' | 'Rejected',
    notes: string
  ) => {
    const ext = await exitService.updateClearance(exitId, department, status, notes);
    await refreshExits();
    return ext;
  }, [refreshExits]);

  const finalizeFnF = useCallback(async (exitId: string, bankReference?: string) => {
    const ext = await exitService.finalizeFnF(exitId, bankReference);
    await Promise.all([refreshExits(), refreshEmployees()]);
    return ext;
  }, [refreshExits, refreshEmployees]);

  const runMonthlyPayroll = useCallback(async (month: string, year: number) => {
    const ps = await payrollService.runMonthlyPayroll(month, year);
    await refreshPayroll();
    return ps;
  }, [refreshPayroll]);

  const processPayroll = useCallback(async (monthKey: string, monthLabel?: string) => {
    const res = await payrollService.processPayroll(monthKey, monthLabel, activeEmployeeName);
    await refreshPayroll();
    return res;
  }, [activeEmployeeName, refreshPayroll]);

  const updateSalaryStructure = useCallback(async (id: string, data: Partial<SalaryStructure>) => {
    const res = await payrollService.updateSalaryStructure(id, data);
    await refreshPayroll();
    return res;
  }, [refreshPayroll]);

  const createShift = useCallback(async (data: any) => {
    const s = await shiftService.createShift(data);
    await refreshShifts();
    return s;
  }, [refreshShifts]);

  const updateShift = useCallback(async (id: string, data: any) => {
    const s = await shiftService.updateShift(id, data);
    await refreshShifts();
    return s;
  }, [refreshShifts]);

  const deleteShift = useCallback(async (id: string) => {
    await shiftService.deleteShift(id);
    await refreshShifts();
  }, [refreshShifts]);

  const toggleShiftStatus = useCallback(async (id: string) => {
    const s = await shiftService.toggleShiftStatus(id);
    await refreshShifts();
    return s;
  }, [refreshShifts]);

  const assignShift = useCallback(async (data: any) => {
    const a = await shiftService.assignShift(data);
    await refreshShifts();
    return a;
  }, [refreshShifts]);

  const saveRosterEntry = useCallback(async (entry: any) => {
    const r = await shiftService.saveRosterEntry(entry);
    await refreshShifts();
    return r;
  }, [refreshShifts]);

  const uploadHrDocument = useCallback(async (input: UploadHrDocInput) => {
    const doc = await hrmsDocumentService.uploadHrDocument(input);
    setHrDocuments((prev) => [doc, ...prev]);
    return doc;
  }, []);

  const deleteHrDocument = useCallback(async (id: string) => {
    const ok = await hrmsDocumentService.deleteHrDocument(id);
    if (ok) {
      setHrDocuments((prev) => prev.filter((d) => d.id !== id));
    }
    return ok;
  }, []);

  const uploadEmployeeDocument = useCallback(async (input: UploadEmployeeDocInput) => {
    const doc = await hrmsDocumentService.uploadEmployeeDocument(input);
    const current = await hrmsDocumentService.getEmployeeDocuments();
    setEmployeeDocuments(current);
    return doc;
  }, []);

  const replaceEmployeeDocument = useCallback(async (existingDocId: string, input: Partial<UploadEmployeeDocInput>) => {
    const doc = await hrmsDocumentService.replaceEmployeeDocument(existingDocId, input);
    const current = await hrmsDocumentService.getEmployeeDocuments();
    setEmployeeDocuments(current);
    return doc;
  }, []);

  const verifyEmployeeDocument = useCallback(async (docId: string) => {
    const doc = await hrmsDocumentService.verifyEmployeeDocument(docId);
    setEmployeeDocuments((prev) => prev.map((d) => (d.id === docId ? doc : d)));
    return doc;
  }, []);

  const deleteEmployeeDocument = useCallback(async (id: string) => {
    const ok = await hrmsDocumentService.deleteEmployeeDocument(id);
    if (ok) {
      setEmployeeDocuments((prev) => prev.filter((d) => d.id !== id));
    }
    return ok;
  }, []);

  const refreshDocuments = useCallback(async () => {
    const [hDocs, eDocs] = await Promise.all([
      hrmsDocumentService.getHrDocuments(),
      hrmsDocumentService.getEmployeeDocuments(),
    ]);
    setHrDocuments(hDocs);
    setEmployeeDocuments(eDocs);
  }, []);

  const value = useMemo<HrmsContextType>(() => ({
    employees,
    attendance,
    todayAttendance,
    corrections,
    leaveBalances,
    leaves,
    expenses,
    queries,
    reimbursements,
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
    refreshAttendance,
    refreshLeaves,
    refreshExpenses,
    refreshReimbursements,
    refreshEmployees,
    refreshOrganization,
    refreshAppraisals,
    refreshExits,
    refreshPayroll,
    refreshShifts,
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
    uploadHrDocument,
    deleteHrDocument,
    uploadEmployeeDocument,
    replaceEmployeeDocument,
    verifyEmployeeDocument,
    deleteEmployeeDocument,
    refreshDocuments,
  }), [
    employees,
    attendance,
    todayAttendance,
    corrections,
    leaveBalances,
    leaves,
    expenses,
    queries,
    reimbursements,
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
    loadData,
    refreshAttendance,
    refreshLeaves,
    refreshExpenses,
    refreshReimbursements,
    refreshEmployees,
    refreshOrganization,
    refreshAppraisals,
    refreshExits,
    refreshPayroll,
    refreshShifts,
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
    uploadHrDocument,
    deleteHrDocument,
    uploadEmployeeDocument,
    replaceEmployeeDocument,
    verifyEmployeeDocument,
    deleteEmployeeDocument,
    refreshDocuments,
  ]);

  return (
    <HrmsContext.Provider value={value}>
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
