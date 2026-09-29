import { createContext, useContext } from 'react'
import { formatINR } from '../utils/format'

export const CrmContext = createContext(null)

export function useCrm() {
  const value = useContext(CrmContext)
  if (!value) throw new Error('useCrm must be used inside <CrmProvider>')
  return value
}

const HR_SELF = ['/hr', '/hr/attendance', '/hr/leave', '/hr/payroll', '/hr/shifts', '/hr/expenses', '/hr/reimbursement', '/hr/documents', '/hr/settings', '/hr/notifications']
const HR_TEAM = [...HR_SELF, '/hr/employees', '/hr/performance', '/hr/exit', '/hr/team', '/hr/organization', '/hr/reports']
const FINANCE_BOOKS = ['/finance', '/finance/invoices', '/finance/receivables', '/finance/vendor-bills', '/finance/payments-receipts', '/finance/accounting-entries', '/finance/tax', '/finance/gst', '/finance/claims']

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

export const OLD_ROLES = { Management: 'Admin', Finance: 'Accountant', 'Project Coordinator': 'Team Lead', Coordinator: 'Team Lead', Sales: 'Employee', 'Field Member': 'Employee' }

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

const pageOf = (path) => {
  const parts = path.split('?')[0].split('/').filter(Boolean)
  if (!parts.length) return '/'
  return ['hr', 'finance'].includes(parts[0]) && parts[1] ? `/${parts[0]}/${parts[1]}` : `/${parts[0]}`
}

export const canOpen = (role, path) => {
  const { pages } = ROLE_ACCESS[role] ?? ROLE_ACCESS.Admin
  return pages === 'all' || pages.includes(pageOf(path))
}

export const PERMISSIONS = {
  sales: ['Admin', 'Employee'],
  contact: ['Admin', 'Employee', 'Team Lead'],
  payments: ['Admin', 'Accountant'],
  onboarding: ['Admin', 'Team Lead'],
  projects: ['Admin', 'Team Lead'],
  vendors: ['Admin'],
  documents: ['Admin', 'Team Lead'],
}

export const canDo = (role, action) => Boolean(PERMISSIONS[action]?.includes(role))

export const PERMISSION_OWNERS = { sales: 'the sales team', contact: 'the sales team', payments: 'Accounts', onboarding: 'the Team Lead', projects: 'the project team' }

export function useAccess() {
  const { role } = useCrm()
  const access = ROLE_ACCESS[role] ?? ROLE_ACCESS.Admin
  return {
    role,
    can: (path) => canOpen(role, path),
    may: (action) => canDo(role, action),
    locked: (step) => (step.by && !canDo(role, step.by) ? `Marked by ${PERMISSION_OWNERS[step.by]}` : null),
    pnl: access.pnl,
    bank: access.bank,
  }
}

export const BILL_ROLES = { record: ['Admin', 'Accountant'], check: ['Admin', 'Accountant'], pay: ['Admin'] }
export const WORK_ROLES = ['Admin', 'Team Lead']

export const maskAccount = (value, visible) => (visible || !value ? value : `•••• ${String(value).replace(/\s/g, '').slice(-4)}`)

export function useMoney() {
  const { role } = useCrm()
  const hidden = Boolean(ROLE_ACCESS[role]?.masked)
  return {
    hidden,
    short: (n) => (hidden ? MASKED : formatINR(n)),
    full: (n) => (hidden ? MASKED : `₹${Math.round(n).toLocaleString('en-IN')}`),
  }
}

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
  upiId: 'bansalgeo@icici',
  bankName: 'ICICI Bank, C-Scheme, Jaipur',
  accountName: 'Bansal Geo Solutions Pvt. Ltd.',
  accountNo: '6285 0500 1234',
  ifsc: 'ICIC0006285',
}
