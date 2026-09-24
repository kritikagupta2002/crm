import { formatDate } from './date'

/*
 * Automatic messages (requirement WP7 / WP20, vendor sheet C2): when something the client or the field team
 * should hear about happens in the app, a WhatsApp and/or an email goes out on its own. Settings → Automations
 * decides which events send on which channel. The demo keeps every message in the outbox (Sent messages);
 * the live system sends them through the WhatsApp Business API and the mail server.
 */
export const CHANNELS = [
  { key: 'whatsapp', label: 'WhatsApp' },
  { key: 'email', label: 'Email' },
]

/* to: who receives it. channels: what each event sends on until Settings changes it. */
export const AUTOMATIONS = [
  { key: 'letter', label: 'Government letter received', to: 'Client', channels: { whatsapp: true, email: true }, note: 'with the scanned letter attached' },
  { key: 'submitted', label: 'Work filed with the authority', to: 'Client', channels: { whatsapp: true, email: true } },
  { key: 'approval', label: 'Approval step done', to: 'Client', channels: { whatsapp: true, email: false } },
  { key: 'closed', label: 'Project completed and handed over', to: 'Client', channels: { whatsapp: true, email: true } },
  { key: 'quotation', label: 'Quotation sent or revised', to: 'Client', channels: { whatsapp: false, email: true }, note: 'with the quotation PDF' },
  { key: 'payment', label: 'Payment received', to: 'Client', channels: { whatsapp: true, email: true }, note: 'as a receipt' },
  { key: 'reply', label: 'Answer to a portal question', to: 'Client', channels: { whatsapp: false, email: true } },
  { key: 'document', label: 'Document shared on the portal', to: 'Client', channels: { whatsapp: false, email: true } },
  { key: 'task', label: 'Task assigned', to: 'Field member', channels: { whatsapp: true, email: false } },
]

const DEFAULTS = Object.fromEntries(AUTOMATIONS.map((a) => [a.key, a.channels]))

/* An event's channels as set in Settings: { whatsapp, email }. */
export const automationOf = (settings, key) => ({ ...DEFAULTS[key], ...settings.automations?.[key] })

/* The channels a message can really go on: WhatsApp needs a number, email an address. */
export const channelsFor = (settings, key, to) => {
  const set = automationOf(settings, key)
  return CHANNELS.map((c) => c.key).filter((c) => set[c] && (c === 'whatsapp' ? to.phone : to.email))
}

const rupees = (n) => `₹${Math.round(n).toLocaleString('en-IN')}`
const portal = () => `${window.location.origin}/login`

/* The words of each message: { subject, text, attachment }. ctx carries what the event is about. */
export function messageFor(key, ctx) {
  const { lead, project, companyName } = ctx
  const dear = lead ? `Dear ${lead.contactPerson},` : ''
  const sign = `— ${companyName}`
  switch (key) {
    case 'letter':
      return {
        subject: `${ctx.letter.title} — ${project.name}`,
        text: `${dear} we have received the ${ctx.letter.title} (${ctx.letter.ref}) from ${project.authority} for ${project.name}. The letter is attached, and it is in your client portal: ${portal()} ${sign}`,
        attachment: ctx.fileName ?? `${ctx.letter.ref.replace(/[^A-Za-z0-9-]+/g, '-')}.pdf`,
      }
    case 'submitted':
      return {
        subject: `${project.name} filed with ${project.authority}`,
        text: `${dear} your ${project.name} work has been filed with ${project.authority} via ${ctx.mode}${ctx.ackNo ? ` (acknowledgement ${ctx.ackNo})` : ''}. We will keep you posted on the approval. ${sign}`,
      }
    case 'approval':
      return {
        subject: `${project.name}: ${ctx.step.label}`,
        text: `${dear} an update on ${project.name}: ${ctx.step.label.charAt(0).toLowerCase()}${ctx.step.label.slice(1)}. Follow each step in your client portal: ${portal()} ${sign}`,
      }
    case 'closed':
      return {
        subject: `${project.name} completed`,
        text: `${dear} ${project.name} is complete. The final report, the approval and every letter are in your client portal: ${portal()}. Thank you for working with us. ${sign}`,
      }
    case 'quotation':
      return {
        subject: `Quotation ${ctx.quote.number} — ${lead.serviceDetail}`,
        text: `${dear} please find our ${ctx.revised ? 'revised ' : ''}quotation ${ctx.quote.number} for ${lead.serviceDetail}: ${rupees(ctx.quote.total)} including GST, valid till ${formatDate(ctx.quote.validUntil)}. You can accept it or ask for changes in your client portal: ${portal()} ${sign}`,
        attachment: `${ctx.quote.number}.pdf`,
      }
    case 'payment':
      return {
        subject: `Payment received — ${rupees(ctx.payment.amount)}`,
        text: `${dear} we have received your payment of ${rupees(ctx.payment.amount)} for ${ctx.payment.title} (ref. ${ctx.payment.utr}). Thank you. ${sign}`,
        attachment: `Receipt-${ctx.payment.id}.pdf`,
      }
    case 'reply':
      return {
        subject: `Re: your question (${ctx.topic})`,
        text: `${dear} about your question on ${ctx.topic.toLowerCase()}: ${ctx.reply} ${sign}`,
      }
    case 'document':
      return {
        subject: `${ctx.file.name} is in your portal`,
        text: `${dear} ${ctx.file.name}${project ? ` for ${project.name}` : ''} is now in your client portal: ${portal()} ${sign}`,
      }
    case 'task':
      return {
        subject: `New task: ${ctx.task.title}`,
        text: `${ctx.to.name}, new task for you: ${ctx.task.title} — ${project.name}, ${lead.company} (${project.site}).${ctx.task.due ? ` Due ${formatDate(ctx.task.due)}.` : ''} Details in My Tasks. ${sign}`,
      }
    default:
      return null
  }
}
