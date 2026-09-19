import { createContext, useContext } from 'react'
import { formatINR } from '../utils/format'

export const CrmContext = createContext(null)

export function useCrm() {
  const value = useContext(CrmContext)
  if (!value) throw new Error('useCrm must be used inside <CrmProvider>')
  return value
}

/* "View as" roles for the demo. Coordinators don't see money (requirement: mask quotation values). */
export const ROLES = ['Admin', 'Sales', 'Coordinator', 'Accountant']
export const MASKED = '₹ ••••'

/*
 * Every rupee amount on screen goes through this, so hiding amounts for a role is one switch.
 * short: ₹4.5 L style; full: ₹4,50,000 style.
 */
export function useMoney() {
  const { role } = useCrm()
  const hidden = role === 'Coordinator'
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
}
