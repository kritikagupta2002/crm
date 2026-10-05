import React from 'react'
import { CrmProvider } from './CrmProvider'
import { PeriodProvider } from './PeriodProvider'

export function AppProviders({ children }) {
  return (
    <CrmProvider>
      <PeriodProvider>
        {children}
      </PeriodProvider>
    </CrmProvider>
  )
}
