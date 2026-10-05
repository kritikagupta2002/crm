import { quoteFor } from './workflow'

export const PAYMENT_METHODS = ['UPI', 'Bank transfer (NEFT / RTGS / IMPS)', 'Cheque']

export const PAYMENT_TONE = { Due: 'tone-attention', Verifying: 'tone-info', Paid: 'tone-good', Rejected: 'tone-urgent' }

/* UPI link the client's app opens when the QR is scanned: payee, amount and a note that says what it's for. */
export const upiLink = (settings, amount, note) =>
  `upi://pay?pa=${encodeURIComponent(settings.upiId)}&pn=${encodeURIComponent(settings.companyName)}&am=${Math.round(amount)}&cu=INR&tn=${encodeURIComponent(note.slice(0, 50))}`

/*
 * What the client owes, as the terms say: 50% advance once the quotation is accepted, the balance
 * once the report is submitted, plus anything else the team has asked for. A payment the client has
 * reported stays "Verifying" until Accounts confirms it; then it is "Paid".
 */
export function duesFor(lead, projects) {
  const payments = lead.payments ?? []
  const reported = (key) => payments.some((p) => p.dueKey === key && p.status === 'Submitted')
  const status = (key, paid) => (paid ? 'Paid' : reported(key) ? 'Verifying' : 'Due')
  const dues = []

  const quote = quoteFor(lead)
  if (quote && (lead.approval?.quoteAccepted || lead.stage === 'Won')) {
    // The number the client sees on the quotation card (with its revision).
    const number = quote.number
    const advance = Math.round(quote.total / 2)
    dues.push({ key: 'advance', title: `Advance for ${number}`, note: '50% with the work order', amount: advance, status: status('advance', lead.approval?.advanceReceived) })
    // The project the quotation was for is the client's first one.
    const main = projects[0]
    if (main?.submission) {
      const paid = main.closure.steps.find((c) => c.key === 'payment')?.done
      dues.push({ key: 'balance', title: `Balance for ${number}`, note: 'On submission of the final report', amount: quote.total - advance, status: status('balance', paid) })
    }
  }
  ;(lead.paymentRequests ?? []).forEach((r) =>
    dues.push({ key: r.id, title: r.title, note: `Requested by ${r.by}`, amount: r.amount, status: status(r.id, payments.some((p) => p.dueKey === r.id && p.status === 'Verified')) }),
  )
  return dues
}

/* Payments the client has reported from the portal, newest first. */
export const paymentsOf = (lead) => [...(lead.payments ?? [])].sort((a, b) => b.submittedAt.localeCompare(a.submittedAt))
