import { CheckCircle2, X } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { EnquiryFormContext } from '../../context/enquiryForm'
import { AddEnquiryDrawer } from './AddEnquiryDrawer'
import './enquiry.css'

/* Lets any button in the app open the "Add New Enquiry" drawer, and shows a toast once it's saved. */
export function EnquiryFormProvider({ children }) {
  const [open, setOpen] = useState(false)
  const [saved, setSaved] = useState(null)

  const openEnquiryForm = useCallback(() => setOpen(true), [])
  const closeEnquiryForm = useCallback(() => setOpen(false), [])

  useEffect(() => {
    if (!saved) return
    const timer = setTimeout(() => setSaved(null), 4500)
    return () => clearTimeout(timer)
  }, [saved])

  return (
    <EnquiryFormContext.Provider value={{ openEnquiryForm }}>
      {children}
      {open && (
        <AddEnquiryDrawer
          onClose={closeEnquiryForm}
          onSaved={(lead) => {
            setOpen(false)
            setSaved(lead)
          }}
        />
      )}
      {saved && (
        <div className="toast" role="status">
          <CheckCircle2 size={22} className="toast-icon" />
          <div>
            <strong>Enquiry {saved.id} added</strong>
            <span>
              {saved.company} · assigned to {saved.assignedTo}
            </span>
          </div>
          <button className="icon-button small" onClick={() => setSaved(null)} aria-label="Dismiss">
            <X size={16} />
          </button>
        </div>
      )}
    </EnquiryFormContext.Provider>
  )
}
