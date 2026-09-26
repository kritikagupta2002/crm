/*
 * How the app's five roles map onto the HRMS, which knows two kinds of user: 'hr' (the whole workforce: employees,
 * attendance, leave approvals, payroll, company documents) and 'employee' (self-service: own attendance, leave,
 * payslips, expenses, documents). Admin and HR are 'hr', everyone else is an employee in the HR pages. The Finance pages are opened by role through the CRM's own access table (ROLE_ACCESS).
 */
const HR_TEAM = ['Admin', 'HR']

export const hrRoleOf = (role) => (HR_TEAM.includes(role) ? 'hr' : 'employee')
