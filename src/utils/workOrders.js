import { formatNearDate } from './date'
import { allProjects } from './projects'

export const WO_STATUS_TONE = { Issued: 'tone-neutral', 'In progress': 'tone-info', Completed: 'tone-attention', 'Bill received': 'tone-urgent', Paid: 'tone-good' }

/* What a status means to the person looking at it. */
export function statusNote(w) {
  if (w.status === 'Bill received') return w.check?.ok ? 'Checked · ready to pay' : 'Bill to check'
  if (w.status === 'Completed') return w.returned?.length ? 'Bill returned · waiting for a corrected one' : 'Delivered · waiting for the bill'
  if (w.status === 'Issued') return 'Not started'
  if (w.status === 'In progress') return w.late ? 'Past the due date' : `Due ${formatNearDate(w.dueOn)}`
  return `Paid ${formatNearDate(w.payment.on)}`
}

/* Delivery record per vendor: on time, late by how much, and what is still open. */
export function vendorStats(vendor, orders) {
  const mine = orders.filter((w) => w.vendor === vendor.name)
  const delivered = mine.filter((w) => w.delivery)
  const onTime = delivered.filter((w) => w.delayDays <= 0).length
  const late = delivered.filter((w) => w.delayDays > 0)
  return {
    orders: mine,
    open: mine.filter((w) => w.status !== 'Paid').length,
    delivered: delivered.length,
    onTimePct: delivered.length ? Math.round((onTime / delivered.length) * 100) : null,
    avgDelay: late.length ? Math.round(late.reduce((s, w) => s + w.delayDays, 0) / late.length) : 0,
    value: mine.reduce((s, w) => s + w.amount, 0),
    returned: mine.reduce((s, w) => s + (w.returned?.length ?? 0), 0),
  }
}

/* The work orders given to one vendor, across every project (each with its project), open ones first. */
export function vendorOrders(vendor, leads, projectEdits) {
  return allProjects(leads, projectEdits)
    .flatMap((p) => p.workOrders.map((w) => ({ ...w, project: p })))
    .filter((w) => w.vendor === vendor.name)
    .sort((a, b) => (a.status === 'Paid') - (b.status === 'Paid') || b.issuedOn.localeCompare(a.issuedOn))
}
