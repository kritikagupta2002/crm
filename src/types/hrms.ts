export interface EmployeePersonal {
  firstName?: string;
  lastName?: string;
  dob?: string;
  gender: 'Male' | 'Female' | 'Other';
  bloodGroup?: string;
  maritalStatus?: string;
  nationality?: string;
  personalEmail?: string;
  currentAddress?: string;
  permanentAddress?: string;
  city?: string;
  state?: string;
  pincode?: string;
}

export interface EmployeeContact {
  workEmail: string;
  personalEmail?: string;
  phone: string;
  currentAddress?: string;
  permanentAddress?: string;
  city?: string;
  state?: string;
  pincode?: string;
}

export interface EmployeeEmployment {
  employeeId?: string;
  department: string;
  designation: string;
  designationCode?: string;
  joiningDate: string;
  employmentType?: 'Full-Time' | 'Contract' | 'Part-Time' | 'Intern' | string;
  managerId?: string;
  managerName?: string;
  reportingManager?: string;
  workLocation: string;
  status: 'Active' | 'On Leave' | 'On Notice' | 'Notice Period' | 'Probation' | 'Terminated' | 'Resigned' | 'Retired';
  project?: string;
}

export interface EmployeeKyc {
  panNumber: string;
  aadhaarNumber?: string;
  uanNumber?: string;
  bankAccount: string;
  bankName?: string;
  accountHolderName?: string;
  ifscCode: string;
  status?: 'Verified' | 'Pending' | 'Submitted';
}

export interface EmployeeEmergency {
  name: string;
  relationship: string;
  phone: string;
}

export interface Employee {
  id: string;
  employeeId: string;
  name: string;
  email: string;
  phone: string;
  avatarUrl?: string;
  role: 'admin' | 'hr' | 'manager' | 'employee' | string;
  personal?: EmployeePersonal;
  contact?: EmployeeContact;
  employment: EmployeeEmployment;
  kyc: EmployeeKyc;
  emergency?: EmployeeEmergency;
  bank?: {
    accountHolderName: string;
    bankName: string;
    accountNumber: string;
    ifscCode: string;
    panNumber: string;
    uanNumber?: string;
  };
  baseSalary?: number;
  documents?: any[];
}

export type AttendanceStatus =
  | 'Present'
  | 'Half-Day'
  | 'Half Day'
  | 'Absent'
  | 'On-Leave'
  | 'On Leave'
  | 'Field Duty'
  | 'Late';

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  department?: string;
  date: string;
  status: AttendanceStatus;
  punchIn: string;
  punchOut: string;
  checkIn?: string;
  checkOut?: string;
  durationHours: number;
  workingHours?: string;
  lateBy?: string;
  overtime?: string;
  punchSource?: string;
  workLocation: string;
  location?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

export interface AttendanceCorrection {
  id: string;
  employeeId: string;
  employeeName: string;
  department?: string;
  date: string;
  currentCheckIn?: string;
  currentCheckOut?: string;
  requestedIn?: string;
  requestedOut?: string;
  requestedCheckIn?: string;
  requestedCheckOut?: string;
  reason: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  hrRemarks?: string;
  appliedAt?: string;
  appliedDate?: string;
  reviewedBy?: string;
  reviewComment?: string;
}

export type LeaveTypeCode = 'CL' | 'SL' | 'EL' | 'CO' | 'FDL' | 'ML';

export interface LeaveBalance {
  id?: string;
  leaveType: string;
  totalAllocated: number;
  allocated: number; // for backward compatibility
  used: number;
  pending: number;
  available: number;
  color?: string;
  employeeId: string;
  employeeName?: string;
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  department?: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  days: number;
  daysCount?: number;
  requestedDays?: number;
  approvedDays?: number;
  rejectedDays?: number;
  reason: string;
  contactDuringLeave?: string;
  status: 'Pending' | 'Approved' | 'Partially Approved' | 'Rejected' | 'Cancelled';
  rejectionReason?: string;
  approverName?: string;
  approverComment?: string;
  appliedAt: string;
  appliedOn?: string;
  reviewedAt?: string;
}

export type ExpenseCategory =
  | 'Travel & Conveyance'
  | 'Lodging & Accommodation'
  | 'Food & Meals'
  | 'Field Supplies';

export type ExpenseStatus =
  | 'Pending'
  | 'Approved'
  | 'Partially Approved'
  | 'Queried'
  | 'Rejected'
  | 'Settled';

export interface ExpenseAuditEntry {
  id: string;
  stage: string;
  action: string;
  actor: string;
  timestamp: string;
  remarks?: string;
  details?: string;
}

export interface ExpenseClaim {
  id: string;
  expenseNumber?: string;
  employeeId: string;
  employeeName: string;
  department: string;
  category: ExpenseCategory;
  requestedAmount: number;
  approvedAmount: number;
  rejectedAmount: number;
  settledAmount: number;
  amount?: number; // legacy alias
  date: string;
  project: string;
  description: string;
  status: ExpenseStatus;
  submittedOn?: string;
  hrStatus?: 'Pending' | 'Approved' | 'Partially Approved' | 'Rejected';
  hrApprovedAmount?: number;
  hrRejectedAmount?: number;
  hrReviewer?: string;
  hrReviewedOn?: string;
  hrRemarks?: string;
  financeStatus?: 'None' | 'Pending Review' | 'Approved' | 'Rejected';
  financeReviewer?: string;
  financeReviewedOn?: string;
  financeRemarks?: string;
  queryStatus?: 'No Query' | 'Query Raised' | 'Employee Responded' | 'Resolved';
  queryId?: string;
  queryRaisedBy?: string;
  queryRaisedOn?: string;
  queryMessage?: string;
  queryResponse?: string;
  queryRespondedOn?: string;
  receiptFileName?: string;
  receiptFileSize?: number;
  receiptFileType?: string;
  receiptUrl?: string;
  receiptDataUrl?: string;
  settlementStatus?: 'None' | 'Pending' | 'Settled';
  settlementReference?: string;
  settlementDate?: string;
  paymentMode?: 'Bank Transfer' | 'UPI' | 'Cheque';
  settledBy?: string;
  auditRemarks?: string;
  auditHistory?: ExpenseAuditEntry[];
}

export interface ExpenseQuery {
  id: string;
  expenseId: string;
  employeeId: string;
  employeeName?: string;
  queryMessage: string;
  responseMessage?: string;
  status: 'Open' | 'Resolved';
  createdAt: string;
  repliedAt?: string;
  raisedBy?: string;
}

export type ReimbursementCategory =
  | 'Vehicle Mileage'
  | 'Field Deployment Daily Allowance (DA)'
  | 'Remote Site Hardship'
  | 'Mobile & Internet'
  | 'Travel Daily Allowance'
  | 'Remote Hardship'
  | 'Mobile & Data';

export interface ReimbursementClaim {
  id: string;
  claimId?: string;
  employeeId: string;
  employeeName: string;
  department: string;
  project?: string;
  category: ReimbursementCategory;
  claimAmount: number;
  totalClaimAmount?: number;
  requestedAmount?: number;
  approvedAmount: number;
  rejectedAmount: number;
  settledAmount: number;
  date: string;
  tripPurpose?: string;
  origin?: string;
  destination?: string;
  departureDate?: string;
  kilometersDriven?: number;
  ratePerKm?: number;
  daDays?: number;
  daRate?: number;
  hardshipTier?: string;
  clientBillable?: boolean;
  remarks: string;
  status: 'Pending' | 'Approved' | 'Partially Approved' | 'Queried' | 'Rejected' | 'Settled';
  submittedOn?: string;
  receiptFileName?: string;
  receiptFileSize?: number;
  receiptFileType?: string;
  receiptUrl?: string;
  receiptDataUrl?: string;
  hrStatus?: 'Pending' | 'Approved' | 'Partially Approved' | 'Rejected';
  hrApprovedAmount?: number;
  hrRejectedAmount?: number;
  hrReviewer?: string;
  hrReviewedOn?: string;
  hrRemarks?: string;
  financeStatus?: 'None' | 'Pending Review' | 'Approved' | 'Rejected';
  queryStatus?: 'No Query' | 'Query Raised' | 'Employee Responded' | 'Resolved';
  queryId?: string;
  queryRaisedBy?: string;
  queryRaisedOn?: string;
  queryMessage?: string;
  queryResponse?: string;
  queryRespondedOn?: string;
  settlementStatus?: 'None' | 'Pending' | 'Settled';
  settlementReference?: string;
  settlementDate?: string;
  paymentMode?: 'Bank Transfer' | 'UPI' | 'Cheque';
  settledBy?: string;
  auditRemarks?: string;
  auditHistory?: ExpenseAuditEntry[];
}

export type { FinanceInvoice, VendorBill, FinanceVoucher } from './finance';

export interface SalaryStructure {
  id: string;
  employeeId: string;
  employeeName: string;
  department?: string;
  designation?: string;
  annualCtc?: number;
  monthlyGross: number;
  basic: number;
  baseSalary?: number;
  hra: number;
  conveyance: number;
  specialAllowance: number;
  siteAllowance?: number;
  providentFund?: number;
  epf: number;
  pfDeduction?: number;
  pf?: number;
  professionalTax?: number;
  pt: number;
  ptDeduction?: number;
  esi: number;
  tds?: number;
  monthlyNet: number;
  netSalary?: number;
  grossPay?: number;
  netPay?: number;
  effectiveDate?: string;
  status?: string;
}

export interface Payslip {
  id: string;
  payslipNumber?: string;
  payslipNo: string;
  employeeId: string;
  employeeName: string;
  department?: string;
  designation?: string;
  joiningDate?: string;
  pan?: string;
  uan?: string;
  bankName?: string;
  accountNumber?: string;
  month: string;
  monthKey?: string;
  year: number;
  workingDays?: number;
  paidDays?: number;
  payableDays: number;
  lopDays?: number;
  basic?: number;
  hra?: number;
  conveyance?: number;
  specialAllowance?: number;
  siteAllowance?: number;
  bonus?: number;
  grossEarnings: number;
  providentFund?: number;
  epfDeduction: number;
  professionalTax?: number;
  ptDeduction: number;
  esi?: number;
  esiDeduction: number;
  tds?: number;
  tdsDeduction: number;
  otherDeductions?: number;
  totalDeductions: number;
  netSalary?: number;
  netTakeHome: number;
  netSalaryInWords?: string;
  paymentStatus?: 'Paid' | 'Processing' | 'Pending' | string;
  status?: string;
  paymentDate?: string;
  transactionRef?: string;
}

export interface PayrollRun {
  id: string;
  month: string;
  monthKey: string;
  processedDate: string;
  totalEmployees: number;
  totalGross: number;
  totalDeductions: number;
  totalNetDisbursed: number;
  status: 'Draft' | 'Processing' | 'Completed' | string;
  processedBy: string;
}

export interface Department {
  id: string;
  code: string;
  name: string;
  headName: string;
  headEmployeeId?: string;
  staffCount: number;
  employeeCount?: number;
  location?: string;
  description?: string;
  status?: 'Active' | 'Inactive';
}

export interface Designation {
  id: string;
  code: string;
  title: string;
  grade: string;
  level?: string;
  minExperience?: string;
  departmentId: string;
  departmentName: string;
  department?: string;
  assignedStaffCount: number;
  employeeCount?: number;
  status?: 'Active' | 'Inactive';
}

export interface PerformanceGoal {
  id: string;
  title: string;
  description: string;
  weightage: number;
  targetScore: number;
  achievedScore: number;
}

export interface PerformanceAppraisal {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  designation: string;
  avatar?: string;
  reviewCycle: string;
  cycle?: string;
  reviewerName: string;
  reviewerDesignation: string;
  overallScore: number;
  goalsAchievementPercent: number;
  rating: 'Outstanding' | 'Exceeds Expectations' | 'Meets Expectations' | 'Needs Improvement' | 'Unsatisfactory';
  ratings?: any;
  status: 'Draft' | 'Self-Appraisal' | 'Manager Review' | 'HR Finalized';
  reviewDate: string;
  goals: PerformanceGoal[];
  strengths: string;
  areasOfImprovement: string;
  managerFeedback: string;
  promotionRecommended?: boolean;
  bonusMultiplier?: number;
}

export interface ClearanceItem {
  id: string;
  department: string;
  reviewerName: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  clearanceDate?: string;
  checklistNotes: string;
  pendingDuesOrAssets?: string;
}

export interface FullAndFinalSettlement {
  id: string;
  exitRequestId: string;
  employeeId: string;
  payableDaysSalary: number;
  leaveEncashmentAmount: number;
  gratuityAmount: number;
  annualBonusAmount: number;
  grossPayable: number;
  noticeShortfallDeduction: number;
  unsettledAdvanceDeduction: number;
  taxTdsDeduction: number;
  totalDeductions: number;
  netPayable: number;
  paymentStatus: 'Pending' | 'Processed';
  settlementDate?: string;
  bankReferenceNumber?: string;
}

export interface EmployeeExitRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  designation: string;
  avatar?: string;
  exitType: 'Resignation' | 'Mutual Separation' | 'Contract Expiry' | 'Retirement' | 'Termination';
  resignationDate: string;
  requestedLWD: string;
  approvedLWD: string;
  noticePeriodDays: number;
  noticeServedDays: number;
  reason: string;
  status: 'Initiated' | 'In Clearance' | 'FnF Pending' | 'Settled & Relieved' | 'Revoked';
  exitInterviewDone: boolean;
  exitInterviewFeedback?: string;
  clearances: ClearanceItem[];
  fnf?: FullAndFinalSettlement;
  relievingLetterIssued: boolean;
}

export interface Shift {
  id: string;
  name: string;
  code: string;
  startTime: string;
  endTime: string;
  workHours?: number;
  breakDuration?: string;
  gracePeriod?: string;
  weeklyOff?: string;
  location?: string;
  status: 'Active' | 'Inactive';
  assignedEmployeesCount?: number;
  description?: string;
}

export interface ShiftAssignment {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  shiftId: string;
  shiftName: string;
  effectiveFrom: string;
  weeklyOff?: string;
  status: 'Active' | 'Inactive';
}

export interface RosterEntry {
  id: string;
  employeeId: string;
  employeeName: string;
  department?: string;
  shiftId: string;
  shiftName: string;
  date: string;
  status: 'Scheduled' | 'Active Today' | 'Completed' | 'Weekly Off' | 'On Leave';
  notes?: string;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'warning' | 'info' | 'danger';
  timestamp: string;
  read: boolean;
  link?: string;
}

export type HrDocumentCategory =
  | 'Company Documents'
  | 'Identity'
  | 'Education'
  | 'Joining Documents'
  | 'Other';

export interface HrDocument {
  id: string;
  title: string;
  category: HrDocumentCategory | string;
  fileName: string;
  fileSize: string;
  fileType: string;
  uploadedBy: string;
  uploadDate: string;
  description?: string;
  accessRole?: 'all' | 'hr' | string;
  attachmentUri?: string;
  attachmentId?: string;
  mimeType?: string;
}

export type EmployeeDocumentType =
  | 'Aadhaar Card'
  | 'PAN Card'
  | 'Degree / Diploma'
  | 'DGMS Mining Competency'
  | 'UAV Remote Pilot License'
  | 'Appointment Letter'
  | 'NDA Agreement'
  | string;

export type EmployeeDocumentStatus =
  | 'Verified'
  | 'Pending Review'
  | 'Expired'
  | 'Rejected';

export interface EmployeeDocumentRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  documentType: EmployeeDocumentType;
  fileName: string;
  fileSize: string;
  uploadedOn: string;
  status: EmployeeDocumentStatus;
  expiryDate?: string;
  attachmentUri?: string;
  attachmentId?: string;
  mimeType?: string;
}

export interface StoredAttachment {
  id: string;
  fileName: string;
  fileSize: number;
  fileSizeFormatted: string;
  mimeType: string;
  fileUri: string;
  createdAt: number;
}
