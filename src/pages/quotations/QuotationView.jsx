import { CheckCircle2, MessageCircle, Pencil, Printer, X, XCircle } from 'lucide-react'
import { useEffect, useId } from 'react'
import { Link } from 'react-router-dom'
import { Logo } from '../../components/common/Logo'
import { useCrm, useMoney } from '../../context/crm'
import { formatDate } from '../../utils/date'
import { whatsappLink } from '../../utils/whatsapp'
import { QUOTE_STATUS_TONE, quoteFor } from '../../utils/workflow'

/* The quotation as the client sees it, with the actions that move it along. "Print" uses the browser's print / save-as-PDF. */
export function QuotationView({ leadId, onClose, onRevise, onReject }) {
  const money = useMoney()
  const { leads, settings, acceptQuotation, logActivity } = useCrm()
  const lead = leads.find((l) => l.id === leadId)
  const quote = lead && quoteFor(lead, settings)
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
  const open = quote.status === 'Sent' || quote.status === 'Revised'

  return (
    <div className="drawer-root">
      <div className="drawer-backdrop" onClick={onClose} />
      <aside className="enquiry-drawer quote-view" role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <header className="drawer-header no-print">
          <div className="lead-drawer-title">
            <h2 id={titleId}>{quote.number}</h2>
            <span className="muted">
              <span className={`pill quote-status ${QUOTE_STATUS_TONE[quote.displayStatus]}`}>{quote.displayStatus}</span> ·{' '}
              <Link to={`/leads/${lead.id}`}>{lead.id}</Link>
            </span>
          </div>
          <button className="icon-button" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </header>

        <div className="drawer-body">
          <article className="quote-doc print-area">
            <div className="quote-head">
              <Logo />
              <div className="quote-company">
                <strong>{settings.companyName}</strong>
                <span>{settings.address}</span>
                <span>
                  {settings.phone} · {settings.email}
                </span>
                {settings.gstin && <span>GSTIN {settings.gstin}</span>}
              </div>
            </div>
            <div className="quote-meta">
              <div>
                <span className="muted">Quotation for</span>
                <strong>{lead.company}</strong>
                <span>Attn: {lead.contactPerson}</span>
                <span>{lead.location}</span>
              </div>
              <dl>
                <dt>Quotation no.</dt>
                <dd>{quote.number}</dd>
                <dt>Date</dt>
                <dd>{formatDate(quote.sentOn)}</dd>
                <dt>Valid until</dt>
                <dd className={quote.displayStatus === 'Expired' ? 'text-red' : undefined}>{formatDate(quote.validUntil)}</dd>
              </dl>
            </div>
            <table className="quote-lines">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Description</th>
                  <th className="num">Qty</th>
                  <th className="num">Rate</th>
                  <th className="num">Amount</th>
                </tr>
              </thead>
              <tbody>
                {quote.items.map((item, i) => (
                  <tr key={i}>
                    <td>{i + 1}</td>
                    <td>{item.description}</td>
                    <td className="num">{item.qty}</td>
                    <td className="num">{money.full(item.rate)}</td>
                    <td className="num">{money.full(item.qty * item.rate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <dl className="totals quote-totals">
              <div>
                <dt>Subtotal</dt>
                <dd>{money.full(quote.gross)}</dd>
              </div>
              {quote.discount > 0 && (
                <div>
                  <dt>Discount ({quote.discountPct}%)</dt>
                  <dd>− {money.full(quote.discount)}</dd>
                </div>
              )}
              <div>
                <dt>GST {quote.gstPct}%</dt>
                <dd>{money.full(quote.gst)}</dd>
              </div>
              <div className="grand">
                <dt>Total payable</dt>
                <dd>{money.full(quote.total)}</dd>
              </div>
            </dl>
            <div className="quote-terms">
              <strong>Terms</strong>
              <p>{settings.terms}</p>
            </div>
          </article>
        </div>

        <footer className="drawer-footer no-print quote-actions">
          <button className="btn" onClick={() => window.print()}>
            <Printer size={15} /> Print / Save PDF
          </button>
          {lead.phone && !money.hidden && (
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
          {open && !money.hidden && (
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
            <Link to="/client-approval" className="btn btn-primary">
              Go to Client Approval
            </Link>
          )}
        </footer>
      </aside>
    </div>
  )
}
