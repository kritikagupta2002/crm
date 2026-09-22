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
export const ROLE_ACCESS = {
  Admin: { note: 'Everything, including reports and settings', pages: 'all', masked: false, home: '/' },
  Sales: { note: 'Leads, follow-ups, quotations, work orders and clients', pages: ['/', '/leads', '/follow-ups', '/quotations', '/client-approval', '/clients'], masked: false, home: '/' },
  'Project Coordinator': {
    note: 'Onboarding, clients and ERM projects; amounts hidden',
    pages: ['/', '/leads', '/follow-ups', '/client-onboarding', '/clients', '/erm', '/projects', '/tasks', '/team', '/letters', '/subcontracts', '/reports'],
    masked: true,
    home: '/erm',
  },
  'Team Lead': { note: 'ERM projects, tasks and approvals; amounts hidden', pages: ['/erm', '/projects', '/tasks', '/team', '/letters', '/subcontracts', '/clients'], masked: true, home: '/erm' },
  'Field Member': { note: 'My tasks and field visits, on the phone', pages: ['/my-tasks'], masked: true, home: '/my-tasks' },
  Accountant: { note: 'Quotations, work orders & advances, clients and reports', pages: ['/', '/quotations', '/client-approval', '/clients', '/reports', '/subcontracts'], masked: false, home: '/' },
}
export const ROLES = Object.keys(ROLE_ACCESS)
export const MASKED = '₹ ••••'

/* The page a path belongs to: /leads/BG-2026-004 → /leads. */
const pageOf = (path) => (path === '/' ? '/' : `/${path.split('?')[0].split('/')[1]}`)

export const canOpen = (role, path) => {
  const { pages } = ROLE_ACCESS[role] ?? ROLE_ACCESS.Admin
  return pages === 'all' || pages.includes(pageOf(path))
}

export function useAccess() {
  const { role } = useCrm()
  return { role, can: (path) => canOpen(role, path) }
}

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
