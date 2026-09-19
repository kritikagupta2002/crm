import { createContext, useContext } from 'react'

export const EnquiryFormContext = createContext(null)

export function useEnquiryForm() {
  const value = useContext(EnquiryFormContext)
  if (!value) throw new Error('useEnquiryForm must be used inside <EnquiryFormProvider>')
  return value
}
