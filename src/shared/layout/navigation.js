import { ArrowLeftRight, BadgeIndianRupee, BarChart3, BookOpen, Boxes, Briefcase, Building2, CalendarCheck, CalendarClock, CalendarDays, ClipboardCheck, ClipboardList, Clock, Contact, Database, Drill, FileScan, FileSignature, Files, FileSpreadsheet, FileText, FlaskConical, FolderKanban, FolderLock, Gauge, Gavel, Hammer, HandCoins, Home, Landmark, LayoutDashboard, Layers, ListTodo, MessageCircleQuestion, Mountain, Network, Percent, PiggyBank, Receipt, Scale, ScrollText, Settings2, ShieldCheck, Shovel, Truck, UserPlus, UserRound, Users, UsersRound, Wallet, Waves } from 'lucide-react'

// Roles that use the HRMS for themselves only (their own attendance, leave, pay, claims, documents).
const SELF_SERVICE = ['Manager', 'Employee', 'Accounts Executive']

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
      { label: 'MIS Reports', path: '/reports', icon: BarChart3 },
    ],
  },
  {
    title: 'ERM Workspace',
    items: [
      { label: 'ERM Dashboard', path: '/erm', icon: Gauge },
      { label: 'Projects', path: '/projects', icon: FolderKanban },
      { label: 'Tasks', path: '/tasks', icon: ListTodo },
      { label: 'My Tasks', path: '/my-tasks', icon: ClipboardCheck, only: ['Employee', 'Manager'] },
      { label: 'Team', path: '/team', icon: UsersRound },
      { label: 'Inventory / Stock', path: '/inventory', icon: Boxes },
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
    // Government documents from the scanner to the client: file, verify, set access, share, dispatch the original.
    title: 'Document Management',
    items: [
      { label: 'Documents', path: '/documents', icon: Files, badge: 'docsToAct', end: true },
      { label: 'Scan Inbox', path: '/documents/scan-inbox', icon: FileScan, badge: 'scansToFile' },
      { label: 'Dispatch Register', path: '/documents/dispatch', icon: Truck, badge: 'originalsToSend' },
    ],
  },
  {
    // HRMS (src/hrms). Super Admin, Director & Finance Master manage it; others have self-service.
    title: 'HRMS & Attendance',
    items: [
      { label: 'HR Dashboard', path: '/hr', icon: LayoutDashboard, end: true },
      { label: 'Employees', path: '/hr/employees', icon: Briefcase },
      { label: 'Team Directory', path: '/hr/team', icon: Contact },
      { label: 'HR Documents', path: '/hr/documents', icon: FolderLock, only: ['Super Admin', 'Director', 'Finance Master'] },
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
      { label: 'Expense Approvals', path: '/hr/expenses/approvals', icon: ClipboardCheck, only: ['Super Admin', 'Director', 'Finance Master'] },
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
    // Roles & permissions stay in the CRM's own Settings, not a second copy here.
    title: 'MIS & Reports',
    items: [
      { label: 'Executive Reports', path: '/hr/reports', icon: BarChart3 },
      { label: 'HR Settings', path: '/hr/settings', icon: Settings2, only: ['Super Admin', 'Director', 'Finance Master'] },
    ],
  },
  {
    // Field Database: geological & drilling field data — Super Admin, Manager, Employee only.
    title: 'Field Database',
    items: [
      { label: 'Field Database', path: '/field-database', icon: Database, end: true, only: ['Super Admin', 'Manager', 'Employee'] },
      { label: 'Geological Mapping', path: '/field-database/geological-mapping', icon: Mountain, only: ['Super Admin', 'Manager', 'Employee'] },
      { label: 'Trench Mapping', path: '/field-database/trench-mapping', icon: Shovel, only: ['Super Admin', 'Manager', 'Employee'] },
      { label: 'Soil Sampling', path: '/field-database/soil-sampling', icon: FlaskConical, only: ['Super Admin', 'Manager', 'Employee'] },
      { label: 'Stream Sediment Sampling', path: '/field-database/stream-sediment', icon: Waves, only: ['Super Admin', 'Manager', 'Employee'] },
      { label: 'Channel Sampling', path: '/field-database/channel-sampling', icon: Layers, only: ['Super Admin', 'Manager', 'Employee'] },
      { label: 'Core Drilling DPR', path: '/field-database/core-drilling-dpr', icon: Drill, only: ['Super Admin', 'Manager', 'Employee'] },
      { label: 'Drill Core Logging', path: '/field-database/drill-core-logging', icon: FileSpreadsheet, only: ['Super Admin', 'Manager', 'Employee'] },
      { label: 'Non-Core DPR', path: '/field-database/non-core-drilling-dpr', icon: Hammer, only: ['Super Admin', 'Manager', 'Employee'] },
      { label: 'Non-Core Logging', path: '/field-database/non-core-logging', icon: ScrollText, only: ['Super Admin', 'Manager', 'Employee'] },
      { label: 'Dispatch Database', path: '/field-database/dispatch-database', icon: Truck, only: ['Super Admin', 'Manager', 'Employee'] },
    ],
  },
]

/* Settings and the audit log live in the profile menu; they are listed here so the pages still get their titles. */
export const NAV_ITEMS = [...NAV_GROUPS.flatMap((group) => group.items), { label: 'Settings', path: '/settings' }, { label: 'Audit Log', path: '/audit-log' }, { label: 'Sent messages', path: '/messages' }]
