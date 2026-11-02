/*
 * Access control: every account has a role, and every role grants a set of permissions. The Managing Director
 * (and the Developer) can override any account's permissions individually, for example giving someone only
 * "Mark own attendance" and "View own attendance".
 *
 * The same catalogue is served to the browser (GET /api/users/permissions) so the UI and the server always agree.
 */
export const PERMISSIONS = [
  // Self-service
  { key: 'attendance.mark', group: 'Attendance', label: 'Mark own attendance (punch in / out)' },
  { key: 'attendance.view_own', group: 'Attendance', label: 'View own attendance and request corrections' },
  { key: 'leave.apply', group: 'Leave', label: 'Apply for leave and view own balance' },
  { key: 'payroll.view_own', group: 'Payroll', label: 'View own salary structure and payslips' },
  { key: 'profile.edit_own', group: 'Profile', label: 'Edit own profile, bank details and documents' },

  // Team and company data
  { key: 'directory.view', group: 'People', label: 'View colleague directory and organization chart (work contact only)' },
  { key: 'attendance.view_all', group: 'Attendance', label: 'View everyone\'s attendance' },
  { key: 'attendance.manage', group: 'Attendance', label: 'Approve corrections and record attendance for others' },
  { key: 'leave.view_all', group: 'Leave', label: 'View everyone\'s leave' },
  { key: 'leave.approve', group: 'Leave', label: 'Approve or reject leave requests' },
  { key: 'shifts.manage', group: 'Attendance', label: 'Create shifts and assign them' },
  { key: 'employees.view_all', group: 'People', label: 'View full employee records' },
  { key: 'employees.manage', group: 'People', label: 'Onboard, edit and deactivate employees' },
  { key: 'documents.verify', group: 'People', label: 'Verify or reject employee documents' },
  { key: 'performance.manage', group: 'People', label: 'View and record performance appraisals' },
  { key: 'exits.manage', group: 'People', label: 'Process exits and full & final settlements' },
  { key: 'payroll.manage', group: 'Payroll', label: 'Manage salary structures and run payroll' },
  { key: 'organization.manage', group: 'Administration', label: 'Manage departments, designations and leave types' },
  { key: 'settings.manage', group: 'Administration', label: 'Change company, attendance, leave and payroll settings' },

  // System administration
  { key: 'accounts.manage', group: 'Administration', label: 'Reset passwords and enable or disable logins' },
  { key: 'permissions.manage', group: 'Administration', label: 'Assign roles and permissions' },
  { key: 'audit.view', group: 'Administration', label: 'View the complete audit log' },
];

export const PERMISSION_KEYS = PERMISSIONS.map((p) => p.key);

const SELF_SERVICE = ['attendance.mark', 'attendance.view_own', 'leave.apply', 'payroll.view_own', 'profile.edit_own'];
const HR_DATA = [
  ...SELF_SERVICE,
  'directory.view',
  'attendance.view_all',
  'attendance.manage',
  'leave.view_all',
  'leave.approve',
  'shifts.manage',
  'employees.view_all',
  'employees.manage',
  'documents.verify',
  'performance.manage',
  'exits.manage',
  'payroll.manage',
  'organization.manage',
  'settings.manage',
];

export const ROLE_PRESETS = {
  Developer: { description: 'Builds and maintains the portal. Full access, including logs and permissions.', permissions: PERMISSION_KEYS },
  'Managing Director': { description: 'Complete access to all data, logs, roles and permissions.', permissions: PERMISSION_KEYS },
  Director: { description: 'All HR data: people, attendance, leave, payroll and settings. No system logs or permissions.', permissions: HR_DATA },
  'HR Admin': { description: 'Runs HR operations and manages logins. No system logs or permissions.', permissions: [...HR_DATA, 'accounts.manage'] },
  Manager: {
    description: 'Team attendance and leave approvals, plus self-service.',
    permissions: [...SELF_SERVICE, 'directory.view', 'attendance.view_all', 'attendance.manage', 'leave.view_all', 'leave.approve', 'performance.manage'],
  },
  Employee: { description: 'Self-service only: own attendance, leave, payslips and profile.', permissions: SELF_SERVICE },
};

export const ROLES = Object.keys(ROLE_PRESETS);

/* Roles only the top of the organisation may grant. */
export const PRIVILEGED_ROLES = ['Developer', 'Managing Director'];

/* Older role names stored on accounts before this catalogue existed. */
export const LEGACY_ROLE_NAMES = { 'Super Admin': 'HR Admin' };
export const normalizeRole = (role) => LEGACY_ROLE_NAMES[role] || role;

/* The permissions an account actually has: its custom list if the MD set one, otherwise its role's preset. */
export function effectivePermissions(account) {
  if (!account) return [];
  if (Array.isArray(account.permissions)) return account.permissions.filter((p) => PERMISSION_KEYS.includes(p));
  return ROLE_PRESETS[normalizeRole(account.role)]?.permissions || [];
}

export const can = (user, permission) => Boolean(user?.permissions?.includes(permission));
export const canAny = (user, ...permissions) => permissions.flat().some((p) => can(user, p));

/*
 * For people without company-wide access to an area, any employeeId in a request is replaced with their own,
 * so nobody can read or write someone else's records by editing a request.
 */
export const scopedEmployeeId = (req, requested, permission) => (can(req.user, permission) ? requested : req.user?.employeeId);
