import { Download, Paperclip, Plus } from 'lucide-react'
import { useState } from 'react'
import { useCrm, useMoney } from '../../context/crm'
import { formatNearDate } from '../../utils/date'
import { downloadDocument } from '../../utils/files'
import { PAYMENT_TONE, duesFor, paymentsOf } from '../../utils/payments'
import { clientProjects } from '../../utils/projects'

function RequestForm({ lead, onDone }) {
  const { requestPayment } = useCrm()
  const [title, setTitle] = useState('')
  const [amount, setAmount] = useState('')
  return (
    <form
      className="query-reply pay-request"
      onSubmit={(e) => {
        e.preventDefault()
        requestPayment(lead.id, { title: title.trim(), amount: Number(amount) })
        onDone()
      }}
    >
      <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="What for, e.g. DMG application fee" aria-label="Payment for" autoFocus />
      <input value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^\d]/g, '').slice(0, 10))} inputMode="numeric" placeholder="Amount (₹)" aria-label="Amount" />
      <div className="portal-query-actions">
        <button type="button" className="btn btn-small" onClick={onDone}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary btn-small" disabled={!title.trim() || !(Number(amount) > 0)}>
          Ask the client to pay
        </button>
      </div>
    </form>
  )
}

/* A payment the client reported for one due (e.g. the advance), with Verify / Not received, for workflow cards. */
export function PaymentCheck({ lead, dueKey }) {
  const { settings, verifyPayment } = useCrm()
  const money = useMoney()
  const waiting = paymentsOf(lead).filter((p) => p.dueKey === dueKey && p.status === 'Submitted')
  if (waiting.length === 0) return null
  return (
    <ul className="pay-check">
      {waiting.map((p) => (
        <li key={p.id}>
          <span>
            <b>Client reported {money.full(p.amount)}</b> · {p.method} · {formatNearDate(p.paidOn)} · ref. <span className="mono-sub">{p.utr}</span>
            {p.file && (
              <button className="link-button" onClick={() => downloadDocument(p.file, { company: lead.company, companyName: settings.companyName })}>
                <Paperclip size={12} /> {p.file.name}
              </button>
            )}
          </span>
          {!money.hidden && (
            <span className="pay-check-actions">
              <button className="btn btn-small" onClick={() => verifyPayment(lead.id, p.id, false, '')}>
                Not received
              </button>
              <button className="btn btn-primary btn-small" onClick={() => verifyPayment(lead.id, p.id, true)}>
                Verify
              </button>
            </span>
          )}
        </li>
      ))}
    </ul>
  )
}

/*
 * Money from the client: what is due (advance, balance, anything requested) and the payments the client
 * reported from the portal with their screenshot. Accounts confirms each one against the bank account.
 */
export function ClientPayments({ lead }) {
  const { projectEdits, settings, verifyPayment } = useCrm()
  const money = useMoney()
  const [asking, setAsking] = useState(false)
  const [rejecting, setRejecting] = useState(null)
  const [reason, setReason] = useState('')
  const dues = duesFor(lead, clientProjects(lead, projectEdits))
  const reported = paymentsOf(lead)
  const toCheck = reported.filter((p) => p.status === 'Submitted').length
  // Amounts and verification stay with the roles that can see money.
  const canVerify = !money.hidden

  return (
    <>
      <div className="ov-head">
        <h3>
          Payments <span className="muted">{toCheck ? `${toCheck} to verify` : dues.some((d) => d.status === 'Due') ? 'payment due' : ''}</span>
        </h3>
        {canVerify && !asking && (
          <button className="link-button" onClick={() => setAsking(true)}>
            <Plus size={14} /> Request a payment
          </button>
        )}
      </div>
      {asking && <RequestForm lead={lead} onDone={() => setAsking(false)} />}
      {dues.length === 0 && reported.length === 0 ? (
        <p className="muted small">Nothing due yet. The advance appears once the client accepts a quotation.</p>
      ) : (
        <ul className="query-list">
          {dues.map((d) => (
            <li key={d.key}>
              <div className="query-head">
                <span className={`pill status-pill ${PAYMENT_TONE[d.status]}`}>{d.status}</span>
                <span className="muted">{d.note}</span>
              </div>
              <p>
                {d.title} · <b>{money.full(d.amount)}</b>
              </p>
            </li>
          ))}
          {reported.map((p) => (
            <li key={p.id} className={p.status === 'Submitted' ? 'is-open' : ''}>
              <div className="query-head">
                <span className={`pill status-pill ${PAYMENT_TONE[p.status === 'Submitted' ? 'Verifying' : p.status === 'Verified' ? 'Paid' : 'Rejected']}`}>
                  {p.status === 'Submitted' ? 'To verify' : p.status === 'Verified' ? 'Received' : 'Not received'}
                </span>
                <span className="muted">
                  Reported {formatNearDate(p.submittedAt.slice(0, 10))} by the client
                </span>
              </div>
              <p>
                {money.full(p.amount)} for {p.title} · {p.method} · paid {formatNearDate(p.paidOn)} · ref. <span className="mono-sub">{p.utr}</span>
              </p>
              {p.file && (
                <button className="link-button" onClick={() => downloadDocument(p.file, { company: lead.company, companyName: settings.companyName })}>
                  <Paperclip size={13} /> {p.file.name} <Download size={13} />
                </button>
              )}
              {p.status === 'Rejected' && p.checkNote && <p className="query-answer">Not found: {p.checkNote}</p>}
              {p.status === 'Submitted' &&
                canVerify &&
                (rejecting === p.id ? (
                  <form
                    className="query-reply"
                    onSubmit={(e) => {
                      e.preventDefault()
                      verifyPayment(lead.id, p.id, false, reason.trim())
                      setRejecting(null)
                      setReason('')
                    }}
                  >
                    <textarea rows={2} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="What the client should check, e.g. no credit with this UTR yet" aria-label="Reason" autoFocus />
                    <div className="portal-query-actions">
                      <button type="button" className="btn btn-small" onClick={() => setRejecting(null)}>
                        Cancel
                      </button>
                      <button type="submit" className="btn btn-small">
                        Mark not received
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="portal-query-actions">
                    <button className="btn btn-small" onClick={() => setRejecting(p.id)}>
                      Not received
                    </button>
                    <button className="btn btn-primary btn-small" onClick={() => verifyPayment(lead.id, p.id, true)}>
                      Verify — received
                    </button>
                  </div>
                ))}
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
