import { createContext, useContext } from 'react'
import { formatINR } from '../utils/format'

export const CrmContext = createContext(null)

export function useCrm() {
  const value = useContext(CrmContext)
  if (!value) throw new Error('useCrm must be used inside <CrmProvider>')
  return value
}

/*
 * Role-based access, in one place: which pages each role opens and whether it sees money.
 * The sidebar, the page guard, Settings and the sign-in screen all read this, so what is written
 * is what happens. Requirement: operational staff (Coordinators, Team Leads) never see amounts.
 */
/*
 * brief: what the role opens and changes, in a few words (the profile menu). note: the longer version (Settings).
 * masked: no amounts at all. pnl: sees profit & loss. bank: sees bank details (company and vendors).
 * Requirement E2: junior accounts staff are blocked from P&L and the bank master; E3: operations never see PO values.
 */
/*
 * HRMS & Finance (src/hrms). Everyone has HR self-service (own attendance, leave, payslips, expenses, documents);
 * the HR team also runs the employee master, approvals and payroll; Finance and Accounts open the finance books.
 */
const HR_SELF = ['/hr', '/hr/attendance', '/hr/leave', '/hr/payroll', '/hr/shifts', '/hr/expenses', '/hr/reimbursement', '/hr/documents', '/hr/settings', '/hr/notifications']
const HR_TEAM = [...HR_SELF, '/hr/employees', '/hr/performance', '/hr/exit', '/hr/team', '/hr/organization', '/hr/reports']
const FINANCE_BOOKS = ['/finance', '/finance/invoices', '/finance/receivables', '/finance/vendor-bills', '/finance/payments-receipts', '/finance/accounting-entries', '/finance/tax', '/finance/gst', '/finance/claims']
// Financial statements and budgets: not for junior accounts (E2).
const FINANCE_REPORTS = ['/finance/reports', '/finance/budget']

export const ROLE_ACCESS = {
  Admin: { brief: 'Everything', note: 'Everything, including settings and the audit log', pages: 'all', masked: false, pnl: true, bank: true, home: '/' },
  Management: {
    brief: 'Sees all, changes nothing',
    note: 'Every workspace, P&L and the audit log; hand-overs stay with the team',
    pages: ['/', '/leads', '/follow-ups', '/quotations', '/client-approval', '/client-onboarding', '/clients', '/reports', '/erm', '/projects', '/tasks', '/team', '/letters', '/subcontracts', '/audit-log', '/messages', '/questions', '/vendor-applications', '/tenders', ...HR_TEAM, ...FINANCE_BOOKS, ...FINANCE_REPORTS],
    masked: false,
    pnl: true,
    bank: true,
    home: '/',
  },
  Sales: { brief: 'Leads, quotations, approval', note: 'Leads, follow-ups, quotations and the client’s approval, up to the win', pages: ['/', '/leads', '/follow-ups', '/quotations', '/client-approval', '/clients', '/messages', '/questions', ...HR_SELF], masked: false, pnl: false, bank: false, home: '/' },
  'Project Coordinator': {
    brief: 'Projects & onboarding, no ₹',
    note: 'Onboarding, clients and ERM projects; amounts hidden',
    pages: ['/', '/leads', '/follow-ups', '/client-onboarding', '/clients', '/erm', '/projects', '/tasks', '/team', '/letters', '/subcontracts', '/reports', '/messages', '/questions', ...HR_SELF],
    masked: true,
    pnl: false,
    bank: false,
    home: '/erm',
  },
  'Team Lead': { brief: 'Tasks & field work, no ₹', note: 'ERM projects, tasks and approvals; amounts hidden', pages: ['/erm', '/projects', '/tasks', '/team', '/letters', '/subcontracts', '/clients', '/questions', ...HR_SELF], masked: true, pnl: false, bank: false, home: '/erm' },
  'Field Member': { brief: 'Own tasks & site visits', note: 'My tasks and field visits, on the phone', pages: ['/my-tasks', ...HR_SELF], masked: true, pnl: false, bank: false, home: '/my-tasks' },
  Finance: { brief: 'Payments, bills, P&L, bank', note: 'CFO: releases vendor payments, P&L, bank details and reports; the finance books', pages: ['/', '/quotations', '/client-approval', '/clients', '/reports', '/subcontracts', '/questions', ...HR_SELF, ...FINANCE_BOOKS, ...FINANCE_REPORTS], masked: false, pnl: true, bank: true, home: '/' },
  Accountant: { brief: 'Payments & bills, no P&L', note: 'Junior accounts: payments, vendor bills and the finance books; no P&L or bank details', pages: ['/', '/quotations', '/client-approval', '/clients', '/reports', '/subcontracts', '/questions', ...HR_SELF, ...FINANCE_BOOKS], masked: false, pnl: false, bank: false, home: '/' },
}
export const ROLES = Object.keys(ROLE_ACCESS)
export const MASKED = '₹ ••••'

/* The demo person behind each role, so the audit log can say who did what. */
export const ROLE_USERS = {
  Admin: { name: 'Kritika Gupta', title: 'CRM Admin' },
  Management: { name: 'Dr. Amit Kumar Bansal', title: 'Managing Director' },
  Sales: { name: 'P. Joshi', title: 'Business Development' },
  'Project Coordinator': { name: 'A. Singh', title: 'Project Coordinator' },
  'Team Lead': { name: 'Dr. Sunita Meena', title: 'Senior Geologist' },
  'Field Member': { name: 'Ravi Gurjar', title: 'Drone Operator' },
  Finance: { name: 'Chhavi Bansal', title: 'Director – Finance' },
  Accountant: { name: 'N. Jain', title: 'Accounts Executive' },
}

export const initialsOf = (name) =>
  name
    .replace(/^Dr\.\s*/, '')
    .replace(/\./g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

/* The page a path belongs to: /leads/BG-2026-004 → /leads; in HR and Finance one level deeper: /hr/leave/apply → /hr/leave. */
const pageOf = (path) => {
  const parts = path.split('?')[0].split('/').filter(Boolean)
  if (!parts.length) return '/'
  return ['hr', 'finance'].includes(parts[0]) && parts[1] ? `/${parts[0]}/${parts[1]}` : `/${parts[0]}`
}

export const canOpen = (role, path) => {
  const { pages } = ROLE_ACCESS[role] ?? ROLE_ACCESS.Admin
  return pages === 'all' || pages.includes(pageOf(path))
}

/*
 * What each role may change; pages (ROLE_ACCESS) only decide what it may see. A role that can open a page but
 * isn't listed for an action sees the same screen read-only. ERM stage hand-overs follow canActOn in utils/projects,
 * subcontract steps follow BILL_ROLES / WORK_ROLES below.
 */
export const PERMISSIONS = {
  // Add and edit enquiries, move stages, Won / Lost, quotations, the client's PO and agreement.
  sales: ['Admin', 'Sales'],
  // Talk to the client: notes, follow-ups, answering portal questions, sharing documents.
  contact: ['Admin', 'Sales', 'Project Coordinator'],
  // Money from clients: advance received, verifying and requesting payments.
  payments: ['Admin', 'Finance', 'Accountant'],
  // After the win: onboarding checklist and portal access.
  onboarding: ['Admin', 'Project Coordinator'],
  // Project work: tasks, approval steps, government letters and telling the client about them.
  projects: ['Admin', 'Project Coordinator', 'Team Lead'],
  // Vendor registrations: approve, send back or reject (the Admin alone).
  vendors: ['Admin'],
}

export const canDo = (role, action) => Boolean(PERMISSIONS[action]?.includes(role))

/* Who does it, in words, for a step another role can't tick ("Marked by Accounts"). */
export const PERMISSION_OWNERS = { sales: 'Sales', contact: 'Sales', payments: 'Accounts', onboarding: 'the Project Coordinator', projects: 'the project team' }

export function useAccess() {
  const { role } = useCrm()
  const access = ROLE_ACCESS[role] ?? ROLE_ACCESS.Admin
  return {
    role,
    can: (path) => canOpen(role, path),
    may: (action) => canDo(role, action),
    // For a checklist: why this role can't tick a step (its `by` permission isn't theirs), or null.
    locked: (step) => (step.by && !canDo(role, step.by) ? `Marked by ${PERMISSION_OWNERS[step.by]}` : null),
    pnl: access.pnl,
    bank: access.bank,
  }
}

/*
 * Subcontract bills follow the vendor sheet's flow: Accounts checks the bill against the order and the
 * delivery, then the CFO (or the Admin) releases the payment.
 */
export const BILL_ROLES = { record: ['Admin', 'Finance', 'Accountant'], check: ['Admin', 'Finance', 'Accountant'], pay: ['Admin', 'Finance'] }
export const WORK_ROLES = ['Admin', 'Project Coordinator', 'Team Lead']

/* Bank details show in full only to roles with bank access. */
export const maskAccount = (value, visible) => (visible || !value ? value : `•••• ${String(value).replace(/\s/g, '').slice(-4)}`)

/*
 * Every rupee amount on screen goes through this, so hiding amounts for a role is one switch.
 * short: ₹4.5 L style; full: ₹4,50,000 style.
 */
export function useMoney() {
  const { role } = useCrm()
  const hidden = Boolean(ROLE_ACCESS[role]?.masked)
  return {
    hidden,
    short: (n) => (hidden ? MASKED : formatINR(n)),
    full: (n) => (hidden ? MASKED : `₹${Math.round(n).toLocaleString('en-IN')}`),
  }
}

/* Company profile and quotation defaults; the Settings page overrides these. */
export const DEFAULT_SETTINGS = {
  companyName: 'Bansal Geo Solutions Pvt. Ltd.',
  address: 'Jaipur, Rajasthan',
  phone: '+91 98876 95208',
  email: 'info@bansalgeo.com',
  gstin: '',
  gstPct: 18,
  quoteValidityDays: 30,
  terms: '50% advance with work order, balance on submission of the final report. Government fees and site travel beyond 100 km are billed at actuals.',
  notifyOverdue: true,
  notifyNewEnquiry: true,
  // Where clients pay (shown with a UPI QR on the portal). Demo values; set the real ones in Settings.
  upiId: 'bansalgeo@icici',
  bankName: 'ICICI Bank, C-Scheme, Jaipur',
  accountName: 'Bansal Geo Solutions Pvt. Ltd.',
  accountNo: '6285 0500 1234',
  ifsc: 'ICIC0006285',
}
