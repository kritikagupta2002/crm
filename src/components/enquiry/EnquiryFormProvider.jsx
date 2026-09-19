import { CheckCircle2, X } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { EnquiryFormContext } from '../../context/enquiryForm'
import { AddEnquiryDrawer } from './AddEnquiryDrawer'
import './enquiry.css'

/*
 * Lets any button in the app open the enquiry drawer — blank for a new enquiry, or filled in to edit one.
 * A new enquiry lands on its Enquiry Details page; either way a toast confirms the save.
 */
export function EnquiryFormProvider({ children }) {
  const navigate = useNavigate()
  const [form, setForm] = useState(null) // null = closed, { lead: null } = new, { lead } = edit
  const [toast, setToast] = useState(null)

  const openEnquiryForm = useCallback(() => setForm({ lead: null }), [])
  const openEditForm = useCallback((lead) => setForm({ lead }), [])
  const closeForm = useCallback(() => setForm(null), [])

  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(null), 4500)
    return () => clearTimeout(timer)
  }, [toast])

  return (
    <EnquiryFormContext.Provider value={{ openEnquiryForm, openEditForm }}>
      {children}
      {form && (
        <AddEnquiryDrawer
          lead={form.lead}
          onClose={closeForm}
          onSaved={(lead) => {
            const isEdit = Boolean(form.lead)
            setForm(null)
            setToast(
              isEdit
                ? { title: `${lead.id} updated`, detail: lead.company }
                : { title: `Enquiry ${lead.id} added`, detail: `${lead.company} · assigned to ${lead.assignedTo}` },
            )
            if (!isEdit) navigate(`/leads/${lead.id}`)
          }}
        />
      )}
      {toast && (
        <div className="toast" role="status">
          <CheckCircle2 size={22} className="toast-icon" />
          <div>
            <strong>{toast.title}</strong>
            <span>{toast.detail}</span>
          </div>
          <button className="icon-button small" onClick={() => setToast(null)} aria-label="Dismiss">
            <X size={16} />
          </button>
        </div>
      )}
    </EnquiryFormContext.Provider>
  )
}
