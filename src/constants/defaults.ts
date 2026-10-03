export const LEAVE_TYPE_CONFIGS = [
  { leaveType: 'Casual Leave (CL)', code: 'CL', totalAllocated: 12, allocated: 12, color: '#3B82F6', description: 'Intended for short personal matters, family events and emergencies.' },
  { leaveType: 'Sick Leave (SL)', code: 'SL', totalAllocated: 10, allocated: 10, color: '#10B981', description: 'For medical recovery, physician consultation, and illness.' },
  { leaveType: 'Earned / Privilege Leave (EL)', code: 'EL', totalAllocated: 18, allocated: 18, color: '#F59E0B', description: 'Accrued annual vacation leave; can be encashed upon retirement or separation.' },
  { leaveType: 'Compensatory Off (CO)', code: 'CO', totalAllocated: 8, allocated: 8, color: '#8B5CF6', description: 'Earned by working on weekend shifts, site emergencies or government holidays.' },
  { leaveType: 'Field Duty Leave (FDL)', code: 'FDL', totalAllocated: 15, allocated: 15, color: '#06B6D4', description: 'Rest and recuperation (R&R) granted following extended continuous camp tours.' },
  { leaveType: 'Maternity / Paternity Leave', code: 'ML', totalAllocated: 180, allocated: 180, color: '#EC4899', description: 'Statutory paid parental leave under Indian Maternity Benefit Act.' },
];

export const DEFAULT_LEAVE_TYPES = LEAVE_TYPE_CONFIGS.map(c => ({
  leaveType: c.leaveType,
  allocated: c.allocated,
  totalAllocated: c.totalAllocated,
  used: 0,
  pending: 0,
  available: c.allocated,
  color: c.color,
}));

export const TAX_RATES = {
  standardGst: 0.18, // 18% standard geological survey rate
  cgst: 0.09,
  sgst: 0.09,
  igst: 0.18,
  tdsContractorIndividual: 0.01, // Section 194C 1%
  tdsContractorCompany: 0.02, // Section 194C 2%
  tdsProfessional: 0.10, // Section 194J 10%
  epfRate: 0.12, // 12% of basic
  esiRate: 0.0075, // 0.75% of gross if gross <= 21000
  ptSlab: 200, // Monthly Professional Tax in standard Indian bracket
};

export const QUOTATION_RULES = {
  directorApprovalAmountThreshold: 500000, // Quotes > 5 Lakhs require Director approval
  directorApprovalDiscountThreshold: 10, // Discount > 10% requires Director approval
  maxDiscountAllowed: 25, // Absolute ceiling
};

export const LEAVE_POLICIES = {
  maxConsecutiveCasualLeave: 3, // Casual Leave cannot exceed 3 consecutive calendar days
};
