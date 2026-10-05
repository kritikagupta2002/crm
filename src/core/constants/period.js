import { createContext, useContext } from 'react'

export const PERIOD_LABELS = {
  month: { current: 'This Month', previous: 'last month' },
  quarter: { current: 'This Quarter', previous: 'last quarter' },
  year: { current: 'This Financial Year', previous: 'last year' },
}

export const PeriodContext = createContext(null)

export function usePeriod() {
  const value = useContext(PeriodContext)
  if (!value) throw new Error('usePeriod must be used inside <PeriodProvider>')
  return value
}
