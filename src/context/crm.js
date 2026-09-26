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
// Financial statements and budgets (/finance/reports, /finance/budget) are the Admin's alone (E2).

/*
 * The client's five roles. Admin also covers the MD's view and the CFO's work (P&L, bank details, releasing payments);
 * HR runs the HRMS; Accountant keeps the books without P&L or bank details (E2); Team Lead runs projects, the
 * coordinator's work included; Employee is everyone else: sales work on enquiries, their own tasks and field
 * visits, and HR self-service.
 */
export const ROLE_ACCESS = {
  Admin: { brief: 'Everything', note: 'Everything, including settings, P&L, bank details, releasing payments and the audit log', pages: 'all', masked: false, pnl: true, bank: true, home: '/' },
  HR: { brief: 'People, attendance, payroll', note: 'The HRMS: employees, attendance, leave approvals, payroll, expense approvals and HR documents', pages: [...HR_TEAM], masked: true, pnl: false, bank: false, home: '/hr' },
  Accountant: { brief: 'Payments, bills & books', note: 'Client payments, vendor bills and the finance books; P&L, bank details and releasing payments stay with the Admin', pages: ['/', '/quotations', '/client-approval', '/clients', '/reports', '/subcontracts', '/questions', ...HR_SELF, ...FINANCE_BOOKS], masked: false, pnl: false, bank: false, home: '/' },
  'Team Lead': {
    brief: 'Projects & documents, no\u00A0₹',
    note: 'Onboarding, ERM projects, tasks, government documents and subcontracts; amounts hidden',
    pages: ['/', '/leads', '/follow-ups', '/client-onboarding', '/clients', '/erm', '/projects', '/tasks', '/team', '/letters', '/subcontracts', '/documents', '/reports', '/messages', '/questions', ...HR_SELF],
    masked: true,
    pnl: false,
    bank: false,
    home: '/erm',
  },
  Employee: { brief: 'Enquiries, own tasks, self-service', note: 'Enquiries, follow-ups and quotations; their own tasks and field visits; their attendance, leave, pay and claims', pages: ['/', '/leads', '/follow-ups', '/quotations', '/client-approval', '/clients', '/messages', '/questions', '/my-tasks', ...HR_SELF], masked: false, pnl: false, bank: false, home: '/my-tasks' },
}
export const ROLES = Object.keys(ROLE_ACCESS)

export const ROLE_COLORS = {
  Admin: { color: '#3e6b7c', bg: '#edf4f7', border: 'rgba(62, 107, 124, 0.35)', text: '#2d5361' },
  HR: { color: '#388e3c', bg: '#e5f5e0', border: 'rgba(56, 142, 60, 0.35)', text: '#1b5e20' },
  Accountant: { color: '#6ed8e8', bg: '#edfbfd', border: 'rgba(110, 216, 232, 0.45)', text: '#0e5f6b' },
  'Team Lead': { color: '#e7e098', bg: '#fdfceb', border: 'rgba(231, 224, 152, 0.6)', text: '#786c12' },
  Employee: { color: '#f12a6c', bg: '#fef1f5', border: 'rgba(241, 42, 108, 0.35)', text: '#c91450' },
}

export const roleSlug = (r) => (r || '').toLowerCase().replace(/\s+/g, '-')
export const MASKED = '₹ ••••'

// Roles saved by the eight-role builds, and where each went.
export const OLD_ROLES = { Management: 'Admin', Finance: 'Accountant', 'Project Coordinator': 'Team Lead', Coordinator: 'Team Lead', Sales: 'Employee', 'Field Member': 'Employee' }

/* The demo person behind each role, so the audit log can say who did what. Employees sign in one by one (FIELD_MEMBERS). */
export const ROLE_USERS = {
  Admin: { name: 'Kritika Gupta', title: 'CRM Admin' },
  HR: { name: 'Kavita Rawat', title: 'HR Executive' },
  Accountant: { name: 'N. Jain', title: 'Accounts Executive' },
  'Team Lead': { name: 'Dr. Sunita Meena', title: 'Senior Geologist' },
  Employee: { name: 'Ravi Gurjar', title: 'Drone Operator' },
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
  sales: ['Admin', 'Employee'],
  // Talk to the client: notes, follow-ups, answering portal questions, sharing documents.
  contact: ['Admin', 'Employee', 'Team Lead'],
  // Money from clients: advance received, verifying and requesting payments.
  payments: ['Admin', 'Accountant'],
  // After the win: onboarding checklist and portal access.
  onboarding: ['Admin', 'Team Lead'],
  // Project work: tasks, approval steps, government letters and telling the client about them.
  projects: ['Admin', 'Team Lead'],
  // Vendor registrations: approve, send back or reject (the Admin alone).
  vendors: ['Admin'],
  // Government documents: file scans, verify (never your own filing), set access, share, dispatch originals.
  documents: ['Admin', 'Team Lead'],
}

export const canDo = (role, action) => Boolean(PERMISSIONS[action]?.includes(role))

/* Who does it, in words, for a step another role can't tick ("Marked by Accounts"). */
export const PERMISSION_OWNERS = { sales: 'the sales team', contact: 'the sales team', payments: 'Accounts', onboarding: 'the Team Lead', projects: 'the project team' }

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
 * delivery, then the Admin (who holds the CFO's work) releases the payment.
 */
export const BILL_ROLES = { record: ['Admin', 'Accountant'], check: ['Admin', 'Accountant'], pay: ['Admin'] }
export const WORK_ROLES = ['Admin', 'Team Lead']

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
