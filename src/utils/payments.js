import { quoteFor } from './workflow'

export const PAYMENT_METHODS = ['UPI', 'Bank transfer (NEFT / RTGS / IMPS)', 'Cheque']

export const PAYMENT_TONE = { Due: 'tone-attention', Verifying: 'tone-info', Paid: 'tone-good', Rejected: 'tone-urgent' }

export const upiLink = (settings, amount, note) =>
  `upi://pay?pa=${encodeURIComponent(settings.upiId)}&pn=${encodeURIComponent(settings.companyName)}&am=${Math.round(amount)}&cu=INR&tn=${encodeURIComponent(note.slice(0, 50))}`

export function duesFor(lead, projects) {
  const payments = lead.payments ?? []
  const reported = (key) => payments.some((p) => p.dueKey === key && p.status === 'Submitted')
  const status = (key, paid) => (paid ? 'Paid' : reported(key) ? 'Verifying' : 'Due')
  const dues = []

  const quote = quoteFor(lead)
  if (quote && (lead.approval?.quoteAccepted || lead.stage === 'Won')) {
    const number = quote.number
    const advance = Math.round(quote.total / 2)
    dues.push({ key: 'advance', title: `Advance for ${number}`, note: '50% with the work order', amount: advance, status: status('advance', lead.approval?.advanceReceived) })
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

export const paymentsOf = (lead) => [...(lead.payments ?? [])].sort((a, b) => b.submittedAt.localeCompare(a.submittedAt))
