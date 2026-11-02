import { createContext, useContext } from 'react'

export const CrmContext = createContext(null)

export function useCrm() {
  const value = useContext(CrmContext)
  if (!value) throw new Error('useCrm must be used inside <CrmProvider>')
  return value
}

/*
 * Page access by permission. Permissions are issued by the server (server/config/permissions.js) for each
 * account; the server enforces them on every request, and these rules only decide which pages and menu items
 * to show. The longest matching path prefix wins; a page is visible when the person has ANY listed permission.
 * Paths without a rule (the dashboard) are open to every signed-in person.
 */
const ATTENDANCE_ANY = ['attendance.view_own', 'attendance.view_all']
const LEAVE_ANY = ['leave.apply', 'leave.view_all', 'leave.approve']
const ROUTE_RULES = [
  { prefix: '/hr/team', any: ['directory.view', 'employees.view_all'] },
  { prefix: '/hr/organization', any: ['directory.view', 'employees.view_all'] },
  { prefix: '/hr/organization/departments', any: ['organization.manage'] },
  { prefix: '/hr/organization/designations', any: ['organization.manage'] },
  { prefix: '/hr/attendance', any: ATTENDANCE_ANY },
  { prefix: '/hr/attendance/daily', any: ['attendance.view_all'] },
  { prefix: '/hr/attendance/corrections', any: ['attendance.view_own', 'attendance.manage'] },
  { prefix: '/hr/shifts', any: ['shifts.manage', 'attendance.view_all'] },
  { prefix: '/hr/shifts/new', any: ['shifts.manage'] },
  { prefix: '/hr/shifts/assignments', any: ['shifts.manage'] },
  { prefix: '/hr/leave', any: LEAVE_ANY },
  { prefix: '/hr/leave/apply', any: ['leave.apply'] },
  { prefix: '/hr/leave/approvals', any: ['leave.approve'] },
  { prefix: '/hr/leave/types', any: ['organization.manage'] },
  { prefix: '/hr/employees', any: ['employees.view_all'] },
  { prefix: '/hr/employees/new', any: ['employees.manage'] },
  { prefix: '/hr/documents', any: ['profile.edit_own', 'documents.verify'] },
  { prefix: '/hr/performance', any: ['performance.manage'] },
  { prefix: '/hr/exit', any: ['exits.manage'] },
  { prefix: '/hr/payroll', any: ['payroll.manage'] },
  { prefix: '/hr/payroll/payslips', any: ['payroll.view_own', 'payroll.manage'] },
  { prefix: '/hr/settings', any: ['settings.manage'] },
  { prefix: '/hr/settings/profile', any: [] },
  { prefix: '/hr/settings/security', any: [] },
  { prefix: '/hr/settings/notifications', any: [] },
  { prefix: '/hr/settings/accounts', any: ['accounts.manage', 'permissions.manage'] },
  { prefix: '/hr/settings/permissions', any: ['permissions.manage'] },
  { prefix: '/hr/settings/audit', any: ['audit.view'] },
  { prefix: '/hr/notifications', any: [] },
]

const clean = (path) => path.split('?')[0].split('#')[0].replace(/\/+$/, '') || '/'

export function canOpen(permissions, path, employeeId) {
  if (!Array.isArray(permissions)) return false
  const target = clean(path)
  // Everyone may open their own employee page.
  if (employeeId && (target === `/hr/employees/${encodeURIComponent(employeeId)}` || target === `/hr/employees/${employeeId}`)) return true
  if (/^\/hr\/employees\/[^/]+\/edit$/.test(target)) return permissions.includes('employees.manage')
  const rule = ROUTE_RULES.filter((r) => target === r.prefix || target.startsWith(`${r.prefix}/`)).sort((a, b) => b.prefix.length - a.prefix.length)[0]
  if (!rule || rule.any.length === 0) return true
  return rule.any.some((p) => permissions.includes(p))
}

export function useAccess() {
  const { role, user } = useCrm()
  const permissions = user?.permissions || []
  const has = (...keys) => keys.flat().some((k) => permissions.includes(k))
  return {
    role,
    permissions,
    has,
    can: (path) => canOpen(permissions, path, user?.employeeId),
    // Company-wide views (all employees) versus personal views.
    isHr: has('employees.view_all', 'attendance.view_all', 'leave.view_all'),
    isHrAdmin: has('employees.manage'),
  }
}

export const PRIVILEGED_ROLES = ['Developer', 'Managing Director']

export const initialsOf = (name = '') =>
  name
    .replace(/^Dr\.\s*/, '')
    .replace(/\./g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

export const DEFAULT_SETTINGS = {
  companyName: 'Bansal Geo Solutions Pvt. Ltd.',
}
