import { DEFAULT_SETTINGS } from '../context/crm'
import { LEADS, TODAY } from '../data/mockData'
import { FIELD_MEMBERS } from '../data/staff'
import { channelsFor, messageFor } from './automations'
import { seededInteractions } from './clientHistory'
import { addDays, toISODate } from './date'
import { clientProjects } from './projects'
import { quoteFor } from './workflow'

const SINCE = toISODate(addDays(TODAY, -45))
const todayISO = toISODate(TODAY)
const num = (lead) => Number(lead.id.split('-').pop()) || 1

/* A time of day for a past message, so the list reads like a working day. */
const at = (date, n) => {
  const [y, m, d] = date.split('-').map(Number)
  return new Date(y, m - 1, d, 10 + (n % 7), (n * 13) % 60).toISOString()
}

/*
 * The messages the automations sent before the demo was opened (the last six weeks): quotations, advance
 * receipts, filings, letters, approval steps, completed projects and field tasks, on the same dates the rest of the demo
 * shows. Built from the generated data only; everything done in the app goes to the outbox instead.
 */
export function seededMessages() {
  const out = []
  const push = (key, lead, date, ctx, n, recipient) => {
    if (!date || date < SINCE || date > todayISO) return
    const to = recipient ?? { audience: 'client', name: lead.contactPerson, phone: lead.phone, email: lead.email }
    const channels = channelsFor(DEFAULT_SETTINGS, key, to)
    if (!channels.length) return
    out.push({ id: `SM-${lead.id}-${key}-${n}`, at: at(date, num(lead) + n), key, leadId: lead.id, to, channels, seeded: true, ...messageFor(key, { lead, companyName: DEFAULT_SETTINGS.companyName, ...ctx }) })
  }

  LEADS.forEach((lead) => {
    const quote = quoteFor(lead)
    if (quote) push('quotation', lead, quote.sentOn, { quote, revised: quote.version > 1 }, 1)

    const advance = seededInteractions(lead).find((i) => i.key === 'advance')
    if (quote && advance) {
      const payment = { id: `ADV-${lead.id.slice(3)}`, amount: Math.round(quote.total / 2), title: `Advance for ${quote.number}`, utr: `UTR${String(num(lead) * 7919).padStart(10, '0')}` }
      push('payment', lead, advance.date, { payment }, 2)
    }

    clientProjects(lead, {}).forEach((project, p) => {
      const base = 10 * (p + 1)
      if (project.submission) push('submitted', lead, project.submission.date, { project, mode: project.submission.mode, ackNo: project.submission.ackNo }, base)
      // A step with its letter is one message (the letter); a step without one is an approval update.
      project.approvals.slice(1).forEach((step, i) => {
        if (step.done && !step.letter) push('approval', lead, step.date, { project, step }, base + 1 + i)
      })
      project.letters.filter((l) => l.sharedOn).forEach((letter, i) => push('letter', lead, letter.sharedOn, { project, letter }, base + 5 + i))
      if (project.closure.closedOn) push('closed', lead, project.closure.closedOn, { project }, base + 9)
      // Field tasks reached their owner on WhatsApp when the team lead handed them out, about a week ahead.
      project.tasks
        .filter((t) => !t.standard && t.due)
        .forEach((task, i) => {
          const member = FIELD_MEMBERS.find((m) => m.name === task.assignee)
          if (!member) return
          const to = { audience: 'field', name: member.name, phone: member.phone }
          push('task', lead, toISODate(addDays(new Date(`${task.due}T00:00`), -6)), { project, task, to }, base + 20 + i, to)
        })
    })
  })
  return out
}
