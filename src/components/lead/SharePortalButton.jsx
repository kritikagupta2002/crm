import { MessageCircle } from 'lucide-react'
import { useAccess, useCrm } from '../../context/crm'
import { portalInvite } from '../../utils/projects'
import { whatsappLink } from '../../utils/whatsapp'

/* Sends the client their portal login on WhatsApp (link, enquiry ID, "use your mobile") and records it. */
export function SharePortalButton({ lead, className = 'btn btn-whatsapp', label = 'Share portal access' }) {
  const { settings, markPortalShared } = useCrm()
  const { may } = useAccess()
  if (!lead.phone || !may('contact')) return null
  return (
    <a className={className} target="_blank" rel="noreferrer" href={whatsappLink(lead.phone, portalInvite(lead, settings))} onClick={() => markPortalShared(lead.id)}>
      <MessageCircle size={15} /> {label}
    </a>
  )
}
