import { useState } from 'react'
import { PeriodContext } from './period'

export function PeriodProvider({ children }) {
  const [period, setPeriod] = useState('quarter')
  return <PeriodContext.Provider value={{ period, setPeriod }}>{children}</PeriodContext.Provider>
}
