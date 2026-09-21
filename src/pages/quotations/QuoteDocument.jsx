import { Logo } from '../../components/common/Logo'
import { formatDate } from '../../utils/date'

/* The printable quotation. amount() formats rupees — masked for some staff roles, always shown to the client. */
export function QuoteDocument({ lead, quote, settings, amount }) {
  return (
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
              <td className="num">{amount(item.rate)}</td>
              <td className="num">{amount(item.qty * item.rate)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <dl className="totals quote-totals">
        <div>
          <dt>Subtotal</dt>
          <dd>{amount(quote.gross)}</dd>
        </div>
        {quote.discount > 0 && (
          <div>
            <dt>Discount ({quote.discountPct}%)</dt>
            <dd>− {amount(quote.discount)}</dd>
          </div>
        )}
        <div>
          <dt>GST {quote.gstPct}%</dt>
          <dd>{amount(quote.gst)}</dd>
        </div>
        <div className="grand">
          <dt>Total payable</dt>
          <dd>{amount(quote.total)}</dd>
        </div>
      </dl>
      <div className="quote-terms">
        <strong>Terms</strong>
        <p>{settings.terms}</p>
      </div>
    </article>
  )
}
