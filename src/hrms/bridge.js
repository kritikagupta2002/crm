/*
 * How the CRM's eight roles map onto the HRMS, which knows two kinds of user: 'hr' (the whole workforce: employees,
 * attendance, leave approvals, payroll, company documents) and 'employee' (self-service: own attendance, leave,
 * payslips, expenses, documents). No new roles: Admin and Management are 'hr', everyone else is an employee in the
 * HR pages. The Finance pages are opened by role through the CRM's own access table (ROLE_ACCESS).
 */
const HR_TEAM = ['Admin', 'Management']

export const hrRoleOf = (role) => (HR_TEAM.includes(role) ? 'hr' : 'employee')
