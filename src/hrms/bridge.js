/*
 * How the 6 CRM roles map onto the HRMS, which knows two kinds of user: 'hr' (the whole workforce: employees,
 * attendance, leave approvals, payroll, company documents) and 'employee' (self-service: own attendance, leave,
 * payslips, expenses, documents).
 * Super Admin, Director, and Finance Master have full HR management access ('hr').
 * Manager, Employee, and Accounts Executive have self-service access ('employee').
 */
const HR_TEAM = ['Super Admin', 'Director', 'Finance Master']

export const hrRoleOf = (role) => (HR_TEAM.includes(role) ? 'hr' : 'employee')
