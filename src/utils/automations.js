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
  { key: 'vendorApproved', label: 'Vendor registration approved', to: 'Vendor', channels: { whatsapp: true, email: true }, note: 'with the vendor ID and portal link' },
  { key: 'vendorChanges', label: 'Vendor registration sent back', to: 'Vendor', channels: { whatsapp: false, email: true }, note: 'with what to correct' },
  { key: 'vendorRejected', label: 'Vendor registration rejected', to: 'Vendor', channels: { whatsapp: false, email: true }, note: 'with the reason' },
  { key: 'tenderPublished', label: 'New work put out for bids', to: 'Vendor', channels: { whatsapp: true, email: true }, note: 'to every approved vendor' },
  { key: 'bidReceived', label: 'Bid received', to: 'Vendor', channels: { whatsapp: false, email: true }, note: 'acknowledgement, bid stays sealed' },
  { key: 'bidShortlisted', label: 'Bid shortlisted', to: 'Vendor', channels: { whatsapp: false, email: true } },
  { key: 'bidRejected', label: 'Bid rejected', to: 'Vendor', channels: { whatsapp: false, email: true }, note: 'with the reason' },
  { key: 'bidAllotted', label: 'Work allotted', to: 'Vendor', channels: { whatsapp: true, email: true }, note: 'with the work order' },
  { key: 'bidNotSelected', label: 'Bid not selected', to: 'Vendor', channels: { whatsapp: false, email: true } },
  { key: 'bidWithdrawn', label: 'Bid withdrawn', to: 'Vendor', channels: { whatsapp: false, email: true }, note: 'acknowledgement' },
  { key: 'clarificationAnswered', label: 'Tender question answered', to: 'Vendor', channels: { whatsapp: false, email: true } },
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
    case 'vendorApproved':
      return {
        subject: `Registration approved — vendor ID ${ctx.vendorId}`,
        text: `Dear ${ctx.application.contact.name}, ${ctx.application.firm.name} is now a registered vendor of ${companyName.replace(/\.$/, '')}. Your vendor ID is ${ctx.vendorId}. Sign in to the vendor portal with this ID and your registered mobile: ${window.location.origin}/login. Every work we put out for bids will reach you there and by email and WhatsApp. ${sign}`,
      }
    case 'vendorChanges':
      return {
        subject: `Registration ${ctx.application.id}: please correct and resubmit`,
        text: `Dear ${ctx.application.contact.name}, we have reviewed your vendor registration ${ctx.application.id}. Please correct the following and resubmit: ${ctx.note} Open your application at ${window.location.origin}/vendor/register with the application number and your mobile. ${sign}`,
      }
    case 'vendorRejected':
      return {
        subject: `Registration ${ctx.application.id} not approved`,
        text: `Dear ${ctx.application.contact.name}, we are unable to approve the vendor registration ${ctx.application.id} for ${ctx.application.firm.name}. Reason: ${ctx.reason}.${ctx.note ? ` ${ctx.note}` : ''} ${sign}`,
      }
    case 'tenderPublished':
      return {
        subject: `New work: ${ctx.tender.title} (${ctx.tender.id})`,
        text: `Dear ${ctx.to.name}, ${companyName} invites bids for ${ctx.tender.title} at ${ctx.tender.location}. Bids close ${ctx.closes}. See the details and bid in the vendor portal: ${portal()} ${sign}`,
      }
    case 'bidReceived':
      return {
        subject: `Bid ${ctx.bid.id} received — ${ctx.tender.title}`,
        text: `Dear ${ctx.to.name}, we have received your bid ${ctx.bid.id} for ${ctx.tender.title} (${ctx.tender.id}). It stays sealed until bidding closes on ${ctx.closes}; you can revise it in the vendor portal until then. ${sign}`,
      }
    case 'bidShortlisted':
      return {
        subject: `Bid ${ctx.bid.id} shortlisted — ${ctx.tender.title}`,
        text: `Dear ${ctx.to.name}, your bid ${ctx.bid.id} for ${ctx.tender.title} (${ctx.tender.id}) is shortlisted. We will confirm the allotment shortly. ${sign}`,
      }
    case 'bidRejected':
      return {
        subject: `Bid ${ctx.bid.id} not accepted — ${ctx.tender.title}`,
        text: `Dear ${ctx.to.name}, we are unable to accept your bid ${ctx.bid.id} for ${ctx.tender.title} (${ctx.tender.id}). Reason: ${ctx.reason}.${ctx.note ? ` ${ctx.note}` : ''} Thank you for bidding. ${sign}`,
      }
    case 'bidAllotted':
      return {
        subject: `Work allotted: ${ctx.tender.title} — work order ${ctx.orderId}`,
        text: `Dear ${ctx.to.name}, ${ctx.tender.title} (${ctx.tender.id}) is allotted to you. Work order ${ctx.orderId}: ${rupees(ctx.bid.amount)} + GST, to be completed by ${formatDate(ctx.dueOn)}. Please confirm the start in the vendor portal: ${portal()} ${sign}`,
      }
    case 'bidNotSelected':
      return {
        subject: `${ctx.tender.title} — result`,
        text: `Dear ${ctx.to.name}, thank you for your bid ${ctx.bid.id} for ${ctx.tender.title} (${ctx.tender.id}). The work has been allotted to another firm. We look forward to your bids on our next works. ${sign}`,
      }
    case 'bidWithdrawn':
      return {
        subject: `Bid ${ctx.bid.id} withdrawn — ${ctx.tender.title}`,
        text: `Dear ${ctx.to.name}, your bid ${ctx.bid.id} for ${ctx.tender.title} (${ctx.tender.id}) has been withdrawn as you asked. A withdrawn bid cannot be submitted again on this tender. ${sign}`,
      }
    case 'clarificationAnswered':
      return {
        subject: `Answer to your question on ${ctx.tender.id}`,
        text: `Dear ${ctx.to.name}, about ${ctx.tender.title} (${ctx.tender.id}) you asked: "${ctx.clarification.question}" Our answer: ${ctx.clarification.answer} The answer is also on the tender page in the vendor portal. ${sign}`,
      }
    default:
      return null
  }
}
