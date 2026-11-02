import {
  BadgeIndianRupee,
  Building2,
  CalendarCheck,
  CalendarClock,
  CalendarDays,
  ClipboardCheck,
  ClipboardList,
  Clock,
  Contact,
  FileCheck,
  FileSpreadsheet,
  History,
  KeyRound,
  LayoutDashboard,
  ListChecks,
  Network,
  PlusCircle,
  Receipt,
  ScrollText,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  Tags,
  UserCheck,
  UserMinus,
  UserPlus,
  Users,
} from 'lucide-react'

/*
 * The sidebar. Which items a person sees follows canOpen() in core/permissions/crm.js, so the menu, the page
 * guards and the server's role checks always agree.
 */
export const NAV_GROUPS = [
  {
    title: 'Overview',
    items: [
      { label: 'Dashboard', path: '/', icon: LayoutDashboard, end: true },
      { label: 'Team Directory', path: '/hr/team', icon: Contact },
      { label: 'Organization Chart', path: '/hr/organization', icon: Network, end: true },
    ],
  },
  {
    title: 'Attendance',
    items: [
      { label: 'Attendance Overview', path: '/hr/attendance', icon: Clock, end: true },
      { label: 'Daily Register', path: '/hr/attendance/daily', icon: CalendarDays },
      { label: 'Monthly Register', path: '/hr/attendance/monthly', icon: CalendarCheck },
      { label: 'Corrections', path: '/hr/attendance/corrections', icon: ClipboardCheck, badge: 'correctionsPending' },
      { label: 'Shifts', path: '/hr/shifts', icon: CalendarClock, end: true },
      { label: 'Shift Assignments', path: '/hr/shifts/assignments', icon: ListChecks },
    ],
  },
  {
    title: 'Leave',
    items: [
      { label: 'Leave Overview', path: '/hr/leave', icon: CalendarDays, end: true },
      { label: 'Apply for Leave', path: '/hr/leave/apply', icon: PlusCircle },
      { label: 'Leave Requests', path: '/hr/leave/requests', icon: ClipboardList },
      { label: 'Leave Approvals', path: '/hr/leave/approvals', icon: ShieldCheck, badge: 'leavesPending' },
      { label: 'Leave Types', path: '/hr/leave/types', icon: Tags },
    ],
  },
  {
    title: 'People',
    items: [
      { label: 'Employee Directory', path: '/hr/employees', icon: Users, end: true },
      { label: 'Onboard Employee', path: '/hr/employees/new', icon: UserPlus },
      { label: 'Documents', path: '/hr/documents', icon: FileCheck },
      { label: 'Performance', path: '/hr/performance', icon: UserCheck },
      { label: 'Exits & Settlement', path: '/hr/exit', icon: UserMinus },
    ],
  },
  {
    title: 'Payroll',
    items: [
      { label: 'Payroll Overview', path: '/hr/payroll', icon: BadgeIndianRupee, end: true },
      { label: 'Salary Structures', path: '/hr/payroll/salary-structure', icon: SlidersHorizontal },
      { label: 'Run Payroll', path: '/hr/payroll/process', icon: FileSpreadsheet },
      { label: 'Payslips', path: '/hr/payroll/payslips', icon: Receipt },
      { label: 'Payroll History', path: '/hr/payroll/history', icon: History },
    ],
  },
  {
    title: 'Administration',
    items: [
      { label: 'Departments', path: '/hr/organization/departments', icon: Building2 },
      { label: 'Designations', path: '/hr/organization/designations', icon: Tags },
      { label: 'User Accounts', path: '/hr/settings/accounts', icon: ShieldCheck },
      { label: 'Roles & Permissions', path: '/hr/settings/permissions', icon: KeyRound },
      { label: 'Audit Log', path: '/hr/settings/audit', icon: ScrollText },
      { label: 'Company Settings', path: '/hr/settings/company', icon: Settings },
    ],
  },
]

export const NAV_ITEMS = [
  ...NAV_GROUPS.flatMap((group) => group.items),
  { label: 'Dashboard', path: '/hr' },
  { label: 'Add Shift', path: '/hr/shifts/new' },
  { label: 'Leave Balance', path: '/hr/leave/balance' },
  { label: 'Leave History', path: '/hr/leave/history' },
  { label: 'Settings', path: '/hr/settings' },
  { label: 'My Profile', path: '/hr/settings/profile' },
  { label: 'Password & Security', path: '/hr/settings/security' },
  { label: 'Notifications', path: '/hr/notifications' },
]
