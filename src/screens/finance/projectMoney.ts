/*
 * Money per project, worked out from the books: revenue from its invoices, vendor cost from the bills
 * on its work orders (subcontracts), and field expenses claimed against it.
 */
const norm = (s: any) => String(s || '').trim().toLowerCase();

export function projectMoney(project: any, { invoices, vendorBills, workOrders, expenses }: any) {
  const names = [project.id, project.title, project.name, project.projectCode].map(norm).filter(Boolean);
  const mine = (v: any) => names.includes(norm(v));
  const orders = (workOrders || []).filter((w: any) => w.projectId === project.id);
  const revenue = (invoices || [])
    .filter((i: any) => i.status !== 'Draft' && (mine(i.projectId) || mine(i.projectTitle)))
    .reduce((s: number, i: any) => s + (i.baseAmount || 0), 0);
  // A subcontract's bill is kept on its work order; a vendor bill entered in Finance against the order counts once.
  const ids = orders.map((w: any) => w.id);
  const vendor =
    orders.reduce((s: number, w: any) => s + (w.bill?.amount || 0), 0) +
    (vendorBills || []).filter((b: any) => ids.includes(b.workOrderId) && !orders.find((w: any) => w.id === b.workOrderId)?.bill).reduce((s: number, b: any) => s + (b.baseAmount || 0), 0);
  const field = (expenses || [])
    .filter((e: any) => mine(e.project) && ['Approved', 'Partially Approved', 'Settled'].includes(e.status))
    .reduce((s: number, e: any) => s + (e.approvedAmount || e.requestedAmount || 0), 0);
  return { revenue, vendor, field, cost: vendor + field };
}

/* The web's budget rule: past 100 % is exceeded, from 85 % it is near the limit. */
export const budgetStatus = (ratio: number) => (ratio > 1 ? 'Exceeded' : ratio >= 0.85 ? 'Near limit' : 'On track');
