import { mobileStorage } from '../../storage';
import { WorkOrder, MilestoneBill } from '../../types';

export class WorkOrdersService {
  async getWorkOrders(): Promise<WorkOrder[]> {
    return mobileStorage.getWorkOrders();
  }

  async getWorkOrderById(id: string): Promise<WorkOrder | undefined> {
    const list = await mobileStorage.getWorkOrders();
    return list.find((w) => w.id === id || w.woNumber === id);
  }

  async updateWorkOrderStage(woId: string, stage: WorkOrder['currentStage']): Promise<WorkOrder> {
    const list = await mobileStorage.getWorkOrders();
    const wo = list.find((w) => w.id === woId || w.woNumber === woId);
    if (!wo) throw new Error('Work Order not found.');
    wo.currentStage = stage;
    wo.status = stage;
    await mobileStorage.setWorkOrders(list);
    return wo;
  }

  async startWorkOrder(woId: string, notes?: string, date?: string): Promise<WorkOrder> {
    const list = await mobileStorage.getWorkOrders();
    const wo = list.find((w) => w.id === woId || w.woNumber === woId);
    if (!wo) throw new Error('Work Order not found.');

    const today = date || new Date().toISOString().split('T')[0];
    wo.startedOn = today;
    wo.currentStage = 'Started';
    wo.status = 'Started';
    wo.history = wo.history || [];
    wo.history.push({ at: new Date().toISOString(), action: 'Work started / mobilized on site', by: wo.vendorName, note: notes });

    await mobileStorage.setWorkOrders(list);
    return wo;
  }

  async deliverWorkOrder(woId: string, deliveryData: { notes: string; files?: any[]; date?: string }): Promise<WorkOrder> {
    const list = await mobileStorage.getWorkOrders();
    const wo = list.find((w) => w.id === woId || w.woNumber === woId);
    if (!wo) throw new Error('Work Order not found.');

    const now = new Date().toISOString();
    const today = deliveryData.date || now.split('T')[0];
    const fileRecords = (deliveryData.files || []).map((f, i) => ({
      id: `del-f-${Date.now()}-${i}`,
      name: f.name || `Delivery-Report-${i + 1}.pdf`,
      size: f.size || 2500000,
      url: f.url || '',
    }));

    wo.delivery = {
      on: today,
      note: deliveryData.notes,
      files: fileRecords,
      by: wo.vendorName,
    };
    wo.currentStage = 'Delivered';
    wo.status = 'Delivered';
    wo.history = wo.history || [];
    wo.history.push({ at: now, action: `Delivery recorded (${fileRecords.length} attachment(s))`, by: wo.vendorName, note: deliveryData.notes });

    await mobileStorage.setWorkOrders(list);
    return wo;
  }

  async submitWorkOrderBill(woId: string, billNo: string, amount: number, tdsRate: number = 0.02): Promise<WorkOrder> {
    return this.billWorkOrder(woId, { billNo, amount, tdsRate });
  }

  async billWorkOrder(
    woId: string,
    billData: {
      billNo: string;
      amount: number;
      tdsRate?: number;
      invoiceUrl?: string;
      date?: string;
      notes?: string;
    }
  ): Promise<WorkOrder> {
    const list = await mobileStorage.getWorkOrders();
    const wo = list.find((w) => w.id === woId || w.woNumber === woId);
    if (!wo) throw new Error('Work Order not found.');

    const amt = Number(billData.amount);
    const contractVal = wo.contractValue || wo.amount || 0;
    const remainingCeiling = contractVal - (wo.billedAmount || 0);

    if (amt > remainingCeiling + 0.01) {
      throw new Error(`Bill amount (₹${amt.toLocaleString('en-IN')}) exceeds remaining unbilled contract ceiling (₹${remainingCeiling.toLocaleString('en-IN')}).`);
    }

    const rate = billData.tdsRate !== undefined ? billData.tdsRate : 0.02;
    const tdsAmount = Math.round(amt * rate);
    const netPayable = amt - tdsAmount;
    const now = new Date().toISOString();
    const today = billData.date || now.split('T')[0];

    const billItem: MilestoneBill = {
      id: 'bill-' + Date.now(),
      woId: wo.id,
      billNo: billData.billNo,
      date: today,
      amount: amt,
      tdsRate: rate,
      tdsAmount,
      netPayable,
      status: 'Submitted',
      notes: billData.notes,
    };

    wo.milestoneBills = wo.milestoneBills || [];
    wo.milestoneBills.push(billItem);
    wo.billedAmount = (wo.billedAmount || 0) + amt;
    wo.bill = {
      no: billData.billNo,
      date: today,
      amount: amt,
      file: billData.invoiceUrl ? { id: `inv-${Date.now()}`, name: `${billData.billNo}.pdf`, size: 1000000, url: billData.invoiceUrl } : null,
      by: wo.vendorName,
    };
    wo.check = undefined;
    wo.currentStage = 'Billed';
    wo.status = 'Billed';
    wo.history = wo.history || [];
    wo.history.push({ at: now, action: `Bill ${billData.billNo} recorded (₹${amt.toLocaleString('en-IN')})`, by: wo.vendorName });

    await mobileStorage.setWorkOrders(list);
    return wo;
  }

  async checkWorkOrderBill(
    woId: string,
    decision: 'approved' | 'returned',
    options?: { note?: string; actorName?: string }
  ): Promise<WorkOrder> {
    const list = await mobileStorage.getWorkOrders();
    const wo = list.find((w) => w.id === woId || w.woNumber === woId);
    if (!wo) throw new Error('Work Order not found.');

    const now = new Date().toISOString();
    const today = now.split('T')[0];
    const by = options?.actorName || 'Accountant';

    if (decision === 'approved') {
      wo.check = {
        on: today,
        ok: true,
        by,
        note: options?.note || 'Verified against contract scope and delivery logs.',
      };
      if (wo.milestoneBills && wo.milestoneBills.length > 0) {
        wo.milestoneBills[wo.milestoneBills.length - 1].status = 'Approved';
      }
      wo.currentStage = 'Verified';
      wo.status = 'Verified';
      wo.history = wo.history || [];
      wo.history.push({ at: now, action: 'Bill verified against work order & delivery inspection — ready for payment release', by, note: options?.note });
    } else {
      const returnedBill = wo.bill;
      wo.returned = wo.returned || [];
      if (returnedBill) {
        wo.returned.push({
          ...returnedBill,
          returnedOn: today,
          reason: options?.note || 'Discrepancy in billing quantity / rates',
          by,
        });
      }
      if (wo.milestoneBills && wo.milestoneBills.length > 0) {
        wo.milestoneBills[wo.milestoneBills.length - 1].status = 'Rejected';
      }
      wo.bill = undefined;
      wo.check = undefined;
      wo.currentStage = 'Delivered';
      wo.status = 'Delivered';
      wo.history = wo.history || [];
      wo.history.push({ at: now, action: `Bill returned to vendor — ${options?.note || 'correction required'}`, by });
    }

    await mobileStorage.setWorkOrders(list);
    return wo;
  }

  async verifyAndPayWorkOrderBill(woId: string, billId: string, utrRef: string): Promise<WorkOrder> {
    return this.payWorkOrder(woId, { utrRef });
  }

  async payWorkOrder(
    woId: string,
    paymentData: {
      utrRef: string;
      paymentMode?: string;
      tdsRate?: number;
      tdsSection?: string;
      date?: string;
      remarks?: string;
      actorName?: string;
    }
  ): Promise<WorkOrder> {
    const list = await mobileStorage.getWorkOrders();
    const wo = list.find((w) => w.id === woId || w.woNumber === woId);
    if (!wo) throw new Error('Work Order not found.');

    const now = new Date().toISOString();
    const today = paymentData.date || now.split('T')[0];
    const by = paymentData.actorName || 'Finance Officer';
    const grossAmount = wo.bill?.amount || wo.contractValue || wo.amount || 0;
    const rate = paymentData.tdsRate !== undefined ? paymentData.tdsRate : 0.02;
    const tdsAmount = Math.round(grossAmount * rate);
    const netPayable = grossAmount - tdsAmount;

    wo.payment = {
      on: today,
      gross: grossAmount,
      tds: {
        rate,
        section: paymentData.tdsSection || '194C',
        amount: tdsAmount,
      },
      ref: paymentData.utrRef,
      by,
    };

    if (wo.milestoneBills && wo.milestoneBills.length > 0) {
      const lastBill = wo.milestoneBills[wo.milestoneBills.length - 1];
      lastBill.status = 'Paid';
      lastBill.utrRef = paymentData.utrRef;
    }

    wo.paidAmount = (wo.paidAmount || 0) + netPayable;
    wo.currentStage = 'Paid';
    wo.status = 'Paid';
    wo.history = wo.history || [];
    wo.history.push({
      at: now,
      action: `Payment released ₹${netPayable.toLocaleString('en-IN')} (TDS ₹${tdsAmount.toLocaleString('en-IN')}) · UTR: ${paymentData.utrRef}`,
      by,
    });

    await mobileStorage.setWorkOrders(list);

    const vouchers = await mobileStorage.getVouchers();
    vouchers.unshift({
      id: 'vch-' + Date.now(),
      voucherNumber: 'VCH-WO-' + Date.now().toString().slice(-4),
      type: 'Payment Voucher',
      date: today,
      debitAccount: 'Subcontractor Payable Account',
      creditAccount: 'HDFC Corporate Operating Account',
      amount: netPayable,
      narration: `Payment for Work Order ${wo.woNumber} to ${wo.vendorName} - UTR: ${paymentData.utrRef}${paymentData.remarks ? ` (${paymentData.remarks})` : ''}`,
      referenceType: 'work_order',
      referenceId: wo.id,
    });
    await mobileStorage.setVouchers(vouchers);

    return wo;
  }
}

export const workOrdersService = new WorkOrdersService();
