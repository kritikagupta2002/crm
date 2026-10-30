import { createContext, useContext } from 'react'
import { formatINR } from '../../shared/utils/format.js'

export const CrmContext = createContext(null)

export function useCrm() {
  const value = useContext(CrmContext)
  if (!value) throw new Error('useCrm must be used inside <CrmProvider>')
  return value
}

// Role-based access definitions and page permissions for HRMS & Attendance
const HR_SELF = [
  '/',
  '/hr',
  '/hr/team',
  '/hr/organization',
  '/hr/attendance',
  '/hr/attendance/monthly',
  '/hr/attendance/corrections',
  '/hr/leave',
  '/hr/leave/apply',
  '/hr/leave/balance',
  '/hr/leave/requests',
  '/hr/leave/history',
  '/hr/shifts',
  '/hr/settings',
  '/hr/settings/profile',
  '/hr/notifications',
]

const HR_TEAM = [
  ...HR_SELF,
  '/hr/employees',
  '/hr/employees/new',
  '/hr/performance',
  '/hr/exit',
  '/hr/attendance/daily',
  '/hr/organization/departments',
  '/hr/organization/designations',
  '/hr/leave/approvals',
  '/hr/leave/types',
  '/hr/shifts/new',
  '/hr/shifts/assignments',
]

export const ROLE_ACCESS = {
  'Super Admin': {
    brief: 'Full HR Administration',
    note: 'Complete access to all employee records, attendance tracking, shift scheduling, approvals, and HR settings',
    pages: 'all',
    masked: false,
    pnl: false,
    bank: false,
    home: '/',
  },
  Director: {
    brief: 'Executive & Approvals',
    note: 'Executive access across all employee records, attendance overview, team directory and approvals',
    pages: 'all',
    masked: false,
    pnl: false,
    bank: false,
    home: '/',
  },
  Manager: {
    brief: 'Team & Attendance',
    note: 'Team attendance oversight, leave approvals, shifts management and self-service',
    pages: HR_TEAM,
    masked: false,
    pnl: false,
    bank: false,
    home: '/',
  },
  Employee: {
    brief: 'Attendance & Self-Service',
    note: 'Personal attendance punch-in/out, monthly attendance logs, leave applications, and profile',
    pages: HR_SELF,
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
  Accountant: 'Super Admin',
  'Team Lead': 'Manager',
  Management: 'Director',
  Finance: 'Director',
  'Project Coordinator': 'Manager',
  Coordinator: 'Manager',
  Sales: 'Employee',
  'Field Member': 'Employee',
  'Finance Master': 'Super Admin',
  'Accounts Executive': 'Manager',
}

/* Real company personnel for roles */
export const ROLE_USERS = {
  'Super Admin': { name: 'Kritika Gupta', title: 'HR & Operations Lead', email: 'kritika.gupta@bansalgeo.com' },
  Director: { name: 'Dharmendra Goyal', title: 'Executive Director', email: 'dharmendra.goyal@bansalgeo.com' },
  Manager: { name: 'Inder Nogiya', title: 'Manager (Survey)', email: 'inder.nogiya@bansalgeo.com' },
  Employee: { name: 'Vikas Verma', title: 'Surveyor', email: 'vikas.verma@bansalgeo.com' },
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
  const parts = path.split('?')[0].split('#')[0].split('/').filter(Boolean)
  if (!parts.length) return '/'
  return parts[0] === 'hr' && parts[1] ? `/hr/${parts[1]}` : `/${parts[0]}`
}

export const canOpen = (role, path) => {
  const access = ROLE_ACCESS[role] ?? ROLE_ACCESS['Super Admin']
  if (!access) return false
  if (access.pages === 'all') return true

  const cleanPath = path.split('?')[0].split('#')[0].replace(/\/+$/, '') || '/'
  if (cleanPath === '/' || cleanPath === '/hr') return true

  return access.pages.includes(cleanPath) || access.pages.includes(pageOf(cleanPath))
}

export const PERMISSIONS = {
  masters: ['Super Admin', 'Director'],
  warningLetters: ['Super Admin', 'Director', 'Manager'],
  sales: ['Super Admin', 'Director'],
  contact: ['Super Admin', 'Director', 'Manager'],
  payments: ['Super Admin'],
  onboarding: ['Super Admin', 'Director', 'Manager'],
  projects: ['Super Admin', 'Director', 'Manager'],
  vendors: ['Super Admin', 'Director'],
  documents: ['Super Admin', 'Director', 'Manager'],
  inventory: ['Super Admin', 'Director', 'Manager'],
  inventoryManage: ['Super Admin', 'Director'],
  fieldDatabase: ['Super Admin', 'Manager', 'Employee'],
}

export const canDo = (role, action) => Boolean(PERMISSIONS[action]?.includes(role))

export const PERMISSION_OWNERS = {
  masters: 'Admin',
  warningLetters: 'HR Management',
  sales: 'Admin',
  contact: 'the HR team',
  payments: 'Admin',
  onboarding: 'HR Manager',
  projects: 'the team',
}

export function useAccess() {
  const { role } = useCrm()
  const access = ROLE_ACCESS[role] ?? ROLE_ACCESS['Super Admin']
  return {
    role,
    can: (path) => canOpen(role, path),
    may: (action) => canDo(role, action),
    locked: (step) => (step.by && !canDo(role, step.by) ? `Marked by ${PERMISSION_OWNERS[step.by]}` : null),
    pnl: access.pnl,
    bank: access.bank,
  }
}

export const BILL_ROLES = {
  record: ['Super Admin'],
  check: ['Super Admin'],
  pay: ['Super Admin'],
}
export const WORK_ROLES = ['Super Admin', 'Director', 'Manager']

export const maskAccount = (value, visible) => (visible || !value ? value : `•••• ${String(value).replace(/\s/g, '').slice(-4)}`)

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

export const DEFAULT_SETTINGS = {
  companyName: 'Bansal Geo Solutions Pvt. Ltd.',
  address: 'Jaipur, Rajasthan',
  phone: '+91 98876 95208',
  email: 'info@bansalgeo.com',
  gstin: '',
  gstPct: 18,
  quoteValidityDays: 30,
  terms: 'HRMS and attendance management system.',
  notifyOverdue: true,
  notifyNewEnquiry: true,
  upiId: 'bansalgeo@icici',
  bankName: 'ICICI Bank, C-Scheme, Jaipur',
  accountName: 'Bansal Geo Solutions Pvt. Ltd.',
  accountNo: '6285 0500 1234',
  ifsc: 'ICIC0006285',
}
