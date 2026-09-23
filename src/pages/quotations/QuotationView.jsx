import { CheckCircle2, MessageCircle, Pencil, Printer, X, XCircle } from 'lucide-react'
import { useEffect, useId } from 'react'
import { useAccess, useCrm, useMoney } from '../../context/crm'
import { formatDate, formatDayMonth } from '../../utils/date'
import { whatsappLink } from '../../utils/whatsapp'
import { QUOTE_STATUS_TONE, quoteFor } from '../../utils/workflow'
import { Portal } from '../../components/common/Portal'
import { QuoteDocument } from './QuoteDocument'
import { RoleLink } from '../../components/common/RoleLink'

/* The quotation as the client sees it, with the actions that move it along. "Print" uses the browser's print / save-as-PDF. */
export function QuotationView({ leadId, onClose, onRevise, onReject }) {
  const money = useMoney()
  const { leads, settings, acceptQuotation, logActivity } = useCrm()
  const canSell = useAccess().may('sales')
  const lead = leads.find((l) => l.id === leadId)
  const quote = lead && quoteFor(lead)
  const titleId = useId()

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && !document.querySelector('.dialog-root') && onClose()
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [onClose])

  if (!quote) return null
  const open = quote.status === 'Sent' || quote.status === 'Revised' || quote.status === 'Changes requested'

  return (
    <Portal>
      <div className="drawer-root">
        <div className="drawer-backdrop" onClick={onClose} />
        <aside className="enquiry-drawer quote-view" role="dialog" aria-modal="true" aria-labelledby={titleId}>
          <header className="drawer-header no-print">
            <div className="lead-drawer-title">
              <h2 id={titleId}>{quote.number}</h2>
              <span className="muted">
                <span className={`pill quote-status ${QUOTE_STATUS_TONE[quote.displayStatus]}`}>{quote.displayStatus}</span> ·{' '}
                <RoleLink to={`/leads/${lead.id}`}>{lead.id}</RoleLink>
              </span>
            </div>
            <button className="icon-button" onClick={onClose} aria-label="Close">
              <X size={20} />
            </button>
          </header>

          <div className="drawer-body">
            {quote.status === 'Changes requested' && lead.changeRequest && (
              <div className="change-request no-print">
                <strong>Client asked for changes · {formatDayMonth(lead.changeRequest.at.slice(0, 10))}</strong>
                <p>{lead.changeRequest.text}</p>
                <span className="muted">Revise the quotation to send them a new version.</span>
              </div>
            )}
            <QuoteDocument lead={lead} quote={quote} settings={settings} amount={money.full} />
          </div>

          <footer className="drawer-footer no-print quote-actions">
            <button className="btn" onClick={() => window.print()}>
              <Printer size={15} /> Print / Save PDF
            </button>
            {lead.phone && canSell && (
              <a
                className="btn btn-whatsapp"
                target="_blank"
                rel="noreferrer"
                href={whatsappLink(
                  lead.phone,
                  `Dear ${lead.contactPerson}, please find our quotation ${quote.number} for ${lead.serviceDetail}: ${money.full(quote.total)} including GST, valid till ${formatDate(quote.validUntil)}. — ${settings.companyName}`,
                )}
                onClick={() => logActivity(lead.id, 'contact', `Quotation ${quote.number} shared on WhatsApp`)}
              >
                <MessageCircle size={15} /> WhatsApp
              </a>
            )}
            {open && canSell && (
              <>
                <button className="btn" onClick={() => onRevise(lead.id)}>
                  <Pencil size={15} /> Revise
                </button>
                <button className="btn btn-outline-danger" onClick={() => onReject(lead.id)}>
                  <XCircle size={15} /> Rejected
                </button>
                <button className="btn btn-success" onClick={() => acceptQuotation(lead.id)}>
                  <CheckCircle2 size={15} /> Accepted
                </button>
              </>
            )}
            {quote.status === 'Accepted' && lead.stage !== 'Won' && (
              <RoleLink to="/client-approval" className="btn btn-primary" hideIfLocked>
                Go to Client Approval
              </RoleLink>
            )}
          </footer>
        </aside>
      </div>
    </Portal>
  )
}
