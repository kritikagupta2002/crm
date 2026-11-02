/*
 * The HRMS pages show either company-wide views ('hr') or personal views ('employee'). Company-wide views follow
 * the person's permissions, not their job title.
 */
export const hrRoleOf = (permissions = []) =>
    ['employees.view_all', 'attendance.view_all', 'leave.view_all'].some((p) => permissions.includes(p)) ? 'hr' : 'employee';
