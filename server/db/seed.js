/*
 * Initial data for a brand-new database: the company's real employees, their login accounts (without passwords,
 * which are issued by scripts/issue-temp-passwords.js) and the organisation's configuration. Transactional data
 * (attendance, leave, corrections, documents, notifications, payroll) starts empty and is created by people using
 * the portal.
 */
import {
  INITIAL_EMPLOYEES,
  INITIAL_DEPARTMENTS,
  INITIAL_DESIGNATIONS,
  INITIAL_LEAVE_TYPES,
  INITIAL_SHIFTS,
  INITIAL_SHIFT_ASSIGNMENTS,
  INITIAL_COMPANY_SETTINGS,
  INITIAL_ATTENDANCE_SETTINGS,
  INITIAL_LEAVE_SETTINGS,
  INITIAL_PAYROLL_SETTINGS,
} from '../../src/hrms/data/index.js';

const ROLE_BY_EMPLOYEE = {
  'BGS/DIR-01': 'Managing Director',
  'BGS/DIR-03': 'Director',
  'BGS/DEV-01': 'Developer',
  'BGS/01': 'Manager',
};

export const SEED_USERS = INITIAL_EMPLOYEES.map((e, i) => ({
  id: `usr-${i + 1}`,
  name: e.name,
  email: String(e.contact?.workEmail || '').toLowerCase(),
  role: ROLE_BY_EMPLOYEE[e.employeeId] || 'Employee',
  employeeId: e.employeeId,
  passwordHash: null,
  status: 'Active',
  tokenVersion: 0,
  mustChangePassword: true,
}));

export const SEED_DATA = {
  users: SEED_USERS,
  employees: INITIAL_EMPLOYEES,
  departments: INITIAL_DEPARTMENTS,
  designations: INITIAL_DESIGNATIONS,
  leave_types: INITIAL_LEAVE_TYPES,
  shifts: INITIAL_SHIFTS,
  shift_assignments: INITIAL_SHIFT_ASSIGNMENTS,
  company_settings: INITIAL_COMPANY_SETTINGS,
  attendance_settings: INITIAL_ATTENDANCE_SETTINGS,
  leave_settings: INITIAL_LEAVE_SETTINGS,
  payroll_settings: INITIAL_PAYROLL_SETTINGS,
  attendance: [],
  corrections: [],
  leaves: [],
  leave_balances: [],
  employee_documents: [],
  notifications: [],
  performance_records: [],
  exit_records: [],
  salary_structures: [],
  payroll_runs: [],
  payslips: [],
  audit_log: [],
};
