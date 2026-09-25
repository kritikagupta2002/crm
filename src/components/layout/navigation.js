import { ArrowLeftRight, BadgeIndianRupee, BarChart3, BookOpen, Briefcase, Building2, CalendarCheck, CalendarClock, CalendarDays, ClipboardCheck, ClipboardList, Clock, Contact, FileSignature, Gavel, FileSpreadsheet, FileText, FolderKanban, FolderLock, Gauge, HandCoins, Home, Landmark, LayoutDashboard, ListTodo, MessageCircleQuestion, Network, Percent, PiggyBank, Receipt, Scale, Settings2, ShieldCheck, UserPlus, UserRound, Users, UsersRound, Wallet } from 'lucide-react'

// Roles that use the HRMS for themselves only (their own attendance, leave, pay, claims, documents).
const SELF_SERVICE = ['Sales', 'Project Coordinator', 'Team Lead', 'Field Member', 'Finance', 'Accountant']

/* Two workspaces in one app: sales (CRM) and project delivery (ERM). Each role sees only what it can open; `only` limits an item to the roles it is for. */
export const NAV_GROUPS = [
  {
    title: 'CRM Workspace',
    items: [
      { label: 'Dashboard', path: '/', icon: Home },
      { label: 'Leads & Enquiries', path: '/leads', icon: Users },
      { label: 'Follow-ups', path: '/follow-ups', icon: CalendarDays, badge: 'followUpsDue' },
      { label: 'Quotations & Proposals', path: '/quotations', icon: FileText },
      { label: 'Client Approval', path: '/client-approval', icon: ShieldCheck },
      { label: 'Client Onboarding', path: '/client-onboarding', icon: UserRound },
      { label: 'Client Master', path: '/clients', icon: Building2 },
      { label: 'Client Questions', path: '/questions', icon: MessageCircleQuestion, badge: 'questionsOpen' },
      { label: 'Reports', path: '/reports', icon: BarChart3 },
    ],
  },
  {
    title: 'ERM Workspace',
    items: [
      { label: 'ERM Dashboard', path: '/erm', icon: Gauge },
      { label: 'Projects', path: '/projects', icon: FolderKanban },
      { label: 'Tasks', path: '/tasks', icon: ListTodo },
      { label: 'My Tasks', path: '/my-tasks', icon: ClipboardCheck, only: ['Field Member'] },
      { label: 'Team', path: '/team', icon: UsersRound },
    ],
  },
  {
    // Outside firms: who may work for us (registrations), and the work given to them.
    title: 'Vendor Workspace',
    items: [
      { label: 'Vendor Applications', path: '/vendor-applications', icon: UserPlus, badge: 'vendorAppsNew' },
      { label: 'Tenders', path: '/tenders', icon: Gavel, badge: 'tendersToDecide' },
      { label: 'Subcontracts', path: '/subcontracts', icon: FileSignature },
    ],
  },
  {
    // Nikhil's HRMS (src/hrms), in his four modules. The HR team runs it; everyone else sees their own attendance, leave, pay and claims.
    title: 'HRMS & Attendance',
    items: [
      { label: 'HR Dashboard', path: '/hr', icon: LayoutDashboard, end: true },
      { label: 'Employees', path: '/hr/employees', icon: Briefcase },
      { label: 'Team Directory', path: '/hr/team', icon: Contact },
      { label: 'HR Documents', path: '/hr/documents', icon: FolderLock, only: ['Admin', 'Management'] },
      { label: 'Organization', path: '/hr/organization', icon: Network },
      { label: 'Attendance', path: '/hr/attendance', icon: Clock },
      { label: 'Leave Management', path: '/hr/leave', icon: CalendarCheck },
      { label: 'Payroll', path: '/hr/payroll', icon: Wallet },
      { label: 'Shift Management', path: '/hr/shifts', icon: CalendarClock },
      { label: 'My Documents', path: '/hr/documents/employee', icon: FolderLock, only: SELF_SERVICE },
      { label: 'My Profile', path: '/hr/settings/profile', icon: UserRound, only: SELF_SERVICE },
    ],
  },
  {
    title: 'Expense & Reimbursement',
    items: [
      { label: 'Expenses', path: '/hr/expenses', icon: Receipt, end: true },
      { label: 'Expense Approvals', path: '/hr/expenses/approvals', icon: ClipboardCheck, only: ['Admin', 'Management'] },
      { label: 'Reimbursements', path: '/hr/reimbursement', icon: HandCoins },
    ],
  },
  {
    title: 'Finance & Accounting',
    items: [
      { label: 'Finance Overview', path: '/finance', icon: Landmark, end: true },
      { label: 'Client Invoices', path: '/finance/invoices', icon: FileSpreadsheet },
      { label: 'Receivables', path: '/finance/receivables', icon: BadgeIndianRupee },
      { label: 'Vendor Bills', path: '/finance/vendor-bills', icon: ClipboardList },
      { label: 'Payments & Receipts', path: '/finance/payments-receipts', icon: ArrowLeftRight },
      { label: 'Accounting Entries', path: '/finance/accounting-entries', icon: BookOpen },
      { label: 'TDS & Tax', path: '/finance/tax', icon: Percent },
      { label: 'GST Compliance', path: '/finance/gst', icon: Scale },
      { label: 'Financial Reports', path: '/finance/reports', icon: BarChart3 },
      { label: 'Budget & Cost', path: '/finance/budget', icon: PiggyBank },
      { label: 'Claims Audit', path: '/finance/claims', icon: Receipt },
    ],
  },
  {
    // Roles & permissions stay in the CRM's own Settings (the eight roles), not a second copy here.
    title: 'MIS & Reports',
    items: [
      { label: 'Executive Reports', path: '/hr/reports', icon: BarChart3 },
      { label: 'HR Settings', path: '/hr/settings', icon: Settings2, only: ['Admin', 'Management'] },
    ],
  },
]

/* Settings and the audit log live in the profile menu; they are listed here so the pages still get their titles. */
export const NAV_ITEMS = [...NAV_GROUPS.flatMap((group) => group.items), { label: 'Settings', path: '/settings' }, { label: 'Audit Log', path: '/audit-log' }, { label: 'Sent messages', path: '/messages' }]
