import {
  CalendarCheck,
  CalendarClock,
  CalendarDays,
  ClipboardCheck,
  ClipboardList,
  Clock,
  Contact,
  FileCheck,
  LayoutDashboard,
  Network,
  PlusCircle,
  ShieldCheck,
  UserCheck,
  UserMinus,
  UserRound,
  Users,
} from 'lucide-react'

// Roles that have access to full HR administrative controls
const HR_ADMIN_ROLES = ['Managing Director', 'Super Admin', 'Director']
const HR_MANAGEMENT_ROLES = ['Managing Director', 'Super Admin', 'Director', 'Manager']

export const NAV_GROUPS = [
  {
    title: 'HRMS Overview',
    items: [
      { label: 'HR Dashboard', path: '/', icon: LayoutDashboard, end: true },
      { label: 'Team Directory', path: '/hr/team', icon: Contact },
      { label: 'Organization', path: '/hr/organization', icon: Network },
    ],
  },
  {
    title: 'Attendance Management',
    items: [
      { label: 'Attendance Dashboard', path: '/hr/attendance', icon: Clock, end: true },
      { label: 'Daily Attendance', path: '/hr/attendance/daily', icon: CalendarDays, only: HR_ADMIN_ROLES },
      { label: 'Monthly Attendance', path: '/hr/attendance/monthly', icon: CalendarCheck },
      { label: 'Attendance Corrections', path: '/hr/attendance/corrections', icon: ClipboardCheck, badge: 'correctionsPending' },
      { label: 'Shift Management', path: '/hr/shifts', icon: CalendarClock, only: HR_MANAGEMENT_ROLES },
    ],
  },
  {
    title: 'Employee Management',
    items: [
      { label: 'Employee Directory', path: '/hr/employees', icon: Users, only: HR_ADMIN_ROLES },
      { label: 'Document Verification', path: '/hr/documents', icon: FileCheck },
      { label: 'Performance Records', path: '/hr/performance', icon: UserCheck, only: HR_ADMIN_ROLES },
      { label: 'Employee Exit', path: '/hr/exit', icon: UserMinus, only: HR_ADMIN_ROLES },
    ],
  },
  {
    title: 'Leave Management',
    items: [
      { label: 'Leave Overview', path: '/hr/leave', icon: CalendarDays, end: true },
      { label: 'Apply Leave', path: '/hr/leave/apply', icon: PlusCircle },
      { label: 'Leave Requests', path: '/hr/leave/requests', icon: ClipboardList },
      { label: 'Leave Approvals', path: '/hr/leave/approvals', icon: ShieldCheck, only: HR_ADMIN_ROLES, badge: 'leavesPending' },
    ],
  },
]

export const NAV_ITEMS = [
  ...NAV_GROUPS.flatMap((group) => group.items),
  { label: 'HR Dashboard', path: '/hr' },
  { label: 'Add Employee', path: '/hr/employees/new' },
  { label: 'Settings', path: '/hr/settings' },
  { label: 'My Profile', path: '/hr/settings/profile' },
  { label: 'Notifications', path: '/hr/notifications' },
]
