import { createContext, useContext } from 'react'
import { formatINR } from '../../shared/utils/format.js'

export const CrmContext = createContext(null)

export function useCrm() {
  const value = useContext(CrmContext)
  if (!value) throw new Error('useCrm must be used inside <CrmProvider>')
  return value
}

// Role-based access definitions and page permissions
const HR_SELF = ['/hr', '/hr/organization', '/hr/attendance', '/hr/leave', '/hr/payroll', '/hr/shifts', '/hr/expenses', '/hr/reimbursement', '/hr/documents', '/hr/settings', '/hr/notifications']
const HR_TEAM = [...HR_SELF, '/hr/employees', '/hr/performance', '/hr/exit', '/hr/team', '/hr/reports']
const FINANCE_BOOKS = ['/finance', '/finance/invoices', '/finance/receivables', '/finance/vendor-bills', '/finance/payments-receipts', '/finance/accounting-entries', '/finance/tax', '/finance/gst', '/finance/reports', '/finance/budget', '/finance/claims']

export const ROLE_ACCESS = {
  'Super Admin': {
    brief: 'Everything',
    note: 'Everything, including settings, P&L, bank details, releasing payments and the audit log',
    pages: 'all',
    masked: false,
    pnl: true,
    bank: true,
    home: '/',
  },
  Director: {
    brief: 'All except Finance',
    note: 'All rights across CRM, ERM, HRMS, documents and reports, except the Finance dataset',
    pages: [
      '/',
      '/leads',
      '/follow-ups',
      '/quotations',
      '/client-approval',
      '/client-onboarding',
      '/clients',
      '/questions',
      '/reports',
      '/erm',
      '/projects',
      '/tasks',
      '/team',
      '/letters',
      '/subcontracts',
      '/vendor-applications',
      '/tenders',
      '/documents',
      '/documents/scan-inbox',
      '/documents/dispatch',
      '/inventory',
      '/settings',
      '/audit-log',
      '/messages',
      ...HR_TEAM,
    ],
    masked: false,
    pnl: false,
    bank: false,
    home: '/',
  },
  Manager: {
    brief: 'ERM, HRMS & projects',
    note: 'Project delivery (ERM), tasks, team, documents, subcontracts and HRMS self-service',
    pages: [
      '/erm',
      '/projects',
      '/tasks',
      '/my-tasks',
      '/team',
      '/letters',
      '/subcontracts',
      '/vendor-applications',
      '/tenders',
      '/documents',
      '/documents/scan-inbox',
      '/documents/dispatch',
      '/inventory',
      '/messages',
      '/field-database',
      ...HR_SELF,
    ],
    masked: true,
    pnl: false,
    bank: false,
    home: '/erm',
  },
  Employee: {
    brief: 'My tasks & HR self-service',
    note: 'Assigned project tasks and field visits; attendance, leave, payslips and reimbursement',
    pages: ['/my-tasks', '/messages', '/field-database', ...HR_SELF],
    masked: false,
    pnl: false,
    bank: false,
    home: '/my-tasks',
  },
  'Finance Master': {
    brief: 'Full access & Finance',
    note: 'Full rights across the application: CRM, ERM, HRMS, Finance books, P&L, and bank details',
    pages: 'all',
    masked: false,
    pnl: true,
    bank: true,
    home: '/',
  },
  'Accounts Executive': {
    brief: 'Billing, accounts & books',
    note: 'Client billing, vendor bills, finance books, awarded projects and subcontracts; no enquiries or quotations',
    pages: [
      '/',
      '/clients',
      '/client-onboarding',
      '/erm',
      '/projects',
      '/subcontracts',
      '/vendor-applications',
      '/tenders',
      '/documents',
      '/documents/dispatch',
      '/reports',
      '/questions',
      '/messages',
      ...HR_SELF,
      ...FINANCE_BOOKS,
    ],
    masked: false,
    pnl: false,
    bank: false,
    home: '/',
  },
}
export const ROLES = Object.keys(ROLE_ACCESS)
export const MASKED = '₹ ••••'

// Legacy role mappings so previously saved roles in localStorage resolve cleanly.
export const OLD_ROLES = {
  Admin: 'Super Admin',
  HR: 'Super Admin',
  Accountant: 'Finance Master',
  'Team Lead': 'Manager',
  Management: 'Super Admin',
  Finance: 'Finance Master',
  'Project Coordinator': 'Manager',
  Coordinator: 'Manager',
  Sales: 'Employee',
  'Field Member': 'Employee',
}

/* The demo person behind each role, so the audit log can say who did what. Employees sign in one by one (FIELD_MEMBERS). */
export const ROLE_USERS = {
  'Super Admin': { name: 'Kritika Gupta', title: 'Super Admin' },
  Director: { name: 'Dr. Sunita Meena', title: 'Director' },
  Manager: { name: 'Kavita Rawat', title: 'Operations Manager' },
  Employee: { name: 'Ravi Gurjar', title: 'Drone Operator' },
  'Finance Master': { name: 'N. Jain', title: 'Finance Master' },
  'Accounts Executive': { name: 'Pooja Sharma', title: 'Accounts Executive' },
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
  const parts = path.split('?')[0].split('#')[0].split('/').filter(Boolean)
  if (!parts.length) return '/'
  return ['hr', 'finance', 'documents'].includes(parts[0]) && parts[1] ? `/${parts[0]}/${parts[1]}` : `/${parts[0]}`
}

export const canOpen = (role, path) => {
  const access = ROLE_ACCESS[role] ?? ROLE_ACCESS['Super Admin']
  if (!access) return false

  const cleanPath = path.split('?')[0].split('#')[0]

  // Director: "All rights except Finance dataset" -> Block all finance routes
  if (role === 'Director') {
    if (cleanPath === '/finance' || cleanPath.startsWith('/finance/')) {
      return false
    }
  }

  // Field Database: Restricted strictly to Super Admin, Manager, and Employee
  if (role === 'Director' || role === 'Finance Master' || role === 'Accounts Executive') {
    if (cleanPath === '/field-database' || cleanPath.startsWith('/field-database/')) {
      return false
    }
  }

  // Accounts Executive: Block Enquiries, Quotations, Proposals, Inventory management
  if (role === 'Accounts Executive') {
    if (
      cleanPath === '/leads' ||
      cleanPath.startsWith('/leads/') ||
      cleanPath === '/quotations' ||
      cleanPath.startsWith('/quotations/') ||
      cleanPath === '/client-approval' ||
      cleanPath.startsWith('/client-approval/') ||
      cleanPath === '/follow-ups' ||
      cleanPath.startsWith('/follow-ups/') ||
      cleanPath === '/inventory' ||
      cleanPath.startsWith('/inventory/')
    ) {
      return false
    }
  }

  // Employee: Block CRM Workspace (Dashboard, Leads, Quotations, Clients, etc.) and Inventory management
  if (role === 'Employee') {
    if (
      cleanPath === '/' ||
      cleanPath === '/leads' ||
      cleanPath.startsWith('/leads/') ||
      cleanPath === '/quotations' ||
      cleanPath.startsWith('/quotations/') ||
      cleanPath === '/clients' ||
      cleanPath.startsWith('/clients/') ||
      cleanPath === '/client-approval' ||
      cleanPath.startsWith('/client-approval/') ||
      cleanPath === '/client-onboarding' ||
      cleanPath.startsWith('/client-onboarding/') ||
      cleanPath === '/follow-ups' ||
      cleanPath.startsWith('/follow-ups/') ||
      cleanPath === '/questions' ||
      cleanPath === '/reports' ||
      cleanPath === '/erm' ||
      cleanPath === '/projects' ||
      cleanPath.startsWith('/projects/') ||
      cleanPath === '/tasks' ||
      cleanPath === '/team' ||
      cleanPath === '/subcontracts' ||
      cleanPath === '/vendor-applications' ||
      cleanPath === '/tenders' ||
      cleanPath === '/documents' ||
      cleanPath.startsWith('/documents/') ||
      cleanPath === '/inventory' ||
      cleanPath.startsWith('/inventory/') ||
      cleanPath === '/finance' ||
      cleanPath.startsWith('/finance/') ||
      cleanPath === '/settings' ||
      cleanPath === '/audit-log'
    ) {
      return false
    }
  }

  // Manager: Block CRM Workspace and Finance routes
  if (role === 'Manager') {
    if (
      cleanPath === '/' ||
      cleanPath === '/leads' ||
      cleanPath.startsWith('/leads/') ||
      cleanPath === '/quotations' ||
      cleanPath.startsWith('/quotations/') ||
      cleanPath === '/clients' ||
      cleanPath.startsWith('/clients/') ||
      cleanPath === '/client-approval' ||
      cleanPath.startsWith('/client-approval/') ||
      cleanPath === '/client-onboarding' ||
      cleanPath.startsWith('/client-onboarding/') ||
      cleanPath === '/follow-ups' ||
      cleanPath.startsWith('/follow-ups/') ||
      cleanPath === '/finance' ||
      cleanPath.startsWith('/finance/')
    ) {
      return false
    }
  }

  const { pages } = access
  return pages === 'all' || pages.includes(pageOf(cleanPath))
}

/*
 * What each role may change; pages (ROLE_ACCESS) only decide what it may see. A role that can open a page but
 * isn't listed for an action sees the same screen read-only.
 */
export const PERMISSIONS = {
  // Master data: add service categories, services, minerals.
  masters: ['Super Admin', 'Director', 'Finance Master'],
  // Issue formal warning letters for tasks overdue by 3+ days
  warningLetters: ['Super Admin', 'Director', 'Manager'],
  // Add and edit enquiries, move stages, Won / Lost, quotations, the client's PO and agreement.
  sales: ['Super Admin', 'Director', 'Finance Master'],
  // Talk to the client: notes, follow-ups, answering portal questions, sharing documents.
  contact: ['Super Admin', 'Director', 'Manager', 'Finance Master'],
  // Money from clients: advance received, verifying and requesting payments.
  payments: ['Super Admin', 'Finance Master', 'Accounts Executive'],
  // After the win: onboarding checklist and portal access.
  onboarding: ['Super Admin', 'Director', 'Manager', 'Finance Master', 'Accounts Executive'],
  // Project work: tasks, approval steps, government letters and telling the client about them.
  projects: ['Super Admin', 'Director', 'Manager', 'Finance Master'],
  // Vendor registrations: approve, send back or reject.
  vendors: ['Super Admin', 'Director', 'Finance Master'],
  // Government documents: file scans, verify (never your own filing), set access, share, dispatch originals.
  documents: ['Super Admin', 'Director', 'Manager', 'Finance Master'],
  // Inventory: manage stock, assign to employees, return items, view stock
  inventory: ['Super Admin', 'Director', 'Manager', 'Finance Master'],
  // Add/edit new inventory items to catalog
  inventoryManage: ['Super Admin', 'Director', 'Finance Master'],
  // Field Database: add, view, and update field database records
  fieldDatabase: ['Super Admin', 'Manager', 'Employee'],
}

export const canDo = (role, action) => Boolean(PERMISSIONS[action]?.includes(role))

/* Who does it, in words, for a step another role can't tick ("Marked by Accounts"). */
export const PERMISSION_OWNERS = { masters: 'Admin', warningLetters: 'Project Management', sales: 'Sales / Admin', contact: 'the client contact team', payments: 'Finance & Accounts', onboarding: 'the Project Manager', projects: 'the project team' }

export function useAccess() {
  const { role } = useCrm()
  const access = ROLE_ACCESS[role] ?? ROLE_ACCESS['Super Admin']
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
 * Subcontract bills: Accounts / Finance checks the bill against the order and delivery;
 * Super Admin or Finance Master releases payment.
 */
export const BILL_ROLES = {
  record: ['Super Admin', 'Finance Master', 'Accounts Executive'],
  check: ['Super Admin', 'Finance Master', 'Accounts Executive'],
  pay: ['Super Admin', 'Finance Master'],
}
export const WORK_ROLES = ['Super Admin', 'Director', 'Manager', 'Finance Master']

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
    short: (n) => (hidden ? MASKED : formatINR(Number(n) || 0)),
    full: (n) => (hidden ? MASKED : `₹${Math.round(Number(n) || 0).toLocaleString('en-IN')}`),
    format: (n) => (hidden ? MASKED : formatINR(Number(n) || 0)),
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
