import { mobileStorage } from '../storage';
import {
  FinanceInvoice,
  VendorBill,
  FinanceVoucher,
  TdsRecord,
  GstReturn,
  GstTransaction,
  FinanceOverviewMetrics,
  InvoiceItem,
} from '../types';
import { TAX_RATES } from '../constants';

export class FinanceService {
  // ==========================================
  // INVOICE MODULE (ACCOUNTS RECEIVABLE)
  // ==========================================

  async getInvoices(): Promise<FinanceInvoice[]> {
    return mobileStorage.getInvoices();
  }

  async createInvoice(data: {
    clientId: string;
    clientName: string;
    clientGstin?: string;
    clientEmail?: string;
    billingAddress?: string;
    projectTitle: string;
    projectId?: string;
    baseAmount: number;
    preTaxAmount?: number;
    dueDate: string;
    invoiceDate?: string;
    date?: string;
    taxRate?: number;
    isInterState?: boolean;
    items?: InvoiceItem[];
    paymentTerms?: string;
    notes?: string;
    expectedTdsRate?: number;
  }): Promise<FinanceInvoice> {
    const base = Number(data.preTaxAmount !== undefined ? data.preTaxAmount : data.baseAmount);

    // Validation 1: Base Amount > 0
    if (!base || base <= 0) {
      throw new Error('Invoice base taxable amount must be strictly greater than ₹0.');
    }

    // Validation 2: Client must exist and be active
    const clients = await mobileStorage.getClients();
    const client = clients.find(
      (c) =>
        c.id === data.clientId ||
        c.name.toLowerCase() === data.clientName.trim().toLowerCase()
    );

    if (client) {
      const isContractActive = client.contractStatus === 'Active';

      if (!isContractActive) {
        throw new Error(
          `Client "${client.name}" is currently "${client.contractStatus || 'Inactive'}". Invoices can only be issued to active commercial clients.`
        );
      }
    }


    // GST Calculation: CGST 9% + SGST 9% OR IGST 18% (or based on slab)
    const slab = data.taxRate !== undefined ? data.taxRate : 18;
    const isInterState =
      data.isInterState !== undefined
        ? data.isInterState
        : client && client.state && client.state.toLowerCase() !== 'rajasthan';

    let cgst = 0;
    let sgst = 0;
    let igst = 0;

    if (isInterState) {
      igst = Math.round((base * slab) / 100);
    } else {
      cgst = Math.round((base * slab) / 200);
      sgst = Math.round((base * slab) / 200);
    }
    const taxAmount = cgst + sgst + igst;
    const totalAmount = base + taxAmount;

    // Expected TDS withholding from client
    const tdsRate = data.expectedTdsRate !== undefined ? data.expectedTdsRate : 0.02;
    const tdsAmount = Math.round(base * tdsRate);

    const invoices = await mobileStorage.getInvoices();
    const invDate = data.invoiceDate || data.date || new Date().toISOString().split('T')[0];
    const invoiceNumber = `INV-${new Date().getFullYear()}-${(invoices.length + 1).toString().padStart(3, '0')}`;

    const newInv: FinanceInvoice = {
      id: `inv-${Date.now()}`,
      invoiceNo: invoiceNumber,
      invoiceNumber: invoiceNumber,
      clientId: client?.id || data.clientId,
      clientName: client?.name || data.clientName.trim(),
      clientGstin: client?.gstin || data.clientGstin,
      clientEmail: client?.email || data.clientEmail,
      billingAddress: client?.billingAddress || data.billingAddress,
      projectTitle: data.projectTitle.trim(),
      projectId: data.projectId,
      date: invDate,
      invoiceDate: invDate,
      dueDate: data.dueDate,
      items: data.items && data.items.length > 0 ? data.items : [
        {
          id: `item-${Date.now()}`,
          description: data.projectTitle.trim(),
          quantity: 1,
          unitRate: base,
          amount: base,
        },
      ],
      baseAmount: base,
      preTaxAmount: base,
      taxRate: slab,
      cgst,
      sgst,
      igst,
      taxAmount,
      tdsRate: tdsRate * 100,
      tdsAmount,
      totalAmount,
      paidAmount: 0,
      status: 'Pending',
      paymentTerms: data.paymentTerms || 'Net 30 Days',
      notes: data.notes || `Payment via RTGS/NEFT to HDFC Bank Jaipur Corporate Account.`,
    };

    invoices.unshift(newInv);
    await mobileStorage.setInvoices(invoices);

    // Cross-Module Side Effect: Auto-post Sales Journal Voucher (with double-entry parity)
    const vouchers = await mobileStorage.getVouchers();
    const existingVoucher = vouchers.find(
      (v) => v.reference === newInv.invoiceNo || (v.referenceType === 'invoice' && v.referenceId === newInv.id)
    );

    if (!existingVoucher) {
      const voucherNum = `JV-${new Date().getFullYear()}-${String(vouchers.length + 1).padStart(4, '0')}`;
      vouchers.unshift({
        id: `vch-${Date.now()}`,
        voucherNumber: voucherNum,
        type: 'Sales Journal',
        date: invDate,
        debitAccount: `1200 - Accounts Receivable (${newInv.clientName})`,
        debitAmount: totalAmount,
        creditAccount: '4001 - Geological Survey & Core Drilling Revenue',
        creditAmount: totalAmount,
        amount: totalAmount,
        status: 'Posted',
        narration: `Client invoice ${newInv.invoiceNo} booked for ${newInv.clientName}`,
        reference: newInv.invoiceNo,
        referenceType: 'invoice',
        referenceId: newInv.id,
      });
      await mobileStorage.setVouchers(vouchers);
    }

    return newInv;
  }

  async updateInvoiceStatus(
    id: string,
    status: 'Unpaid' | 'Paid' | 'Partially Paid' | 'Pending' | 'Overdue' | 'Draft',
    paidAmount?: number,
    paymentMode = 'NEFT/RTGS'
  ): Promise<FinanceInvoice> {
    const invoices = await mobileStorage.getInvoices();
    const inv = invoices.find((i) => i.id === id || i.invoiceNo === id || i.invoiceNumber === id);
    if (!inv) throw new Error(`Invoice "${id}" not found.`);

    const nextPaid =
      paidAmount !== undefined
        ? paidAmount
        : status === 'Paid'
        ? inv.totalAmount
        : inv.paidAmount || 0;

    inv.status = status;
    inv.paidAmount = nextPaid;
    await mobileStorage.setInvoices(invoices);

    // If marked Paid, post double-entry Bank Receipt Voucher with idempotency
    if (status === 'Paid') {
      const vouchers = await mobileStorage.getVouchers();
      const existingReceipt = vouchers.find(
        (v) =>
          v.referenceType === 'invoice_receipt' &&
          (v.referenceId === inv.id || v.reference === inv.invoiceNo)
      );

      if (!existingReceipt) {
        const receiptAmount = nextPaid || inv.totalAmount;
        const voucherNum = `JV-${new Date().getFullYear()}-${String(vouchers.length + 1).padStart(4, '0')}`;
        vouchers.unshift({
          id: `vch-${Date.now()}`,
          voucherNumber: voucherNum,
          type: 'Bank Voucher',
          date: new Date().toISOString().split('T')[0],
          debitAccount: '1002 - HDFC Bank Corporate A/c',
          debitAmount: receiptAmount,
          creditAccount: `1200 - Accounts Receivable (${inv.clientName})`,
          creditAmount: receiptAmount,
          amount: receiptAmount,
          status: 'Posted',
          narration: `Receipt recorded against ${inv.invoiceNo} (${inv.clientName}) via ${paymentMode}`,
          reference: inv.invoiceNo,
          referenceType: 'invoice_receipt',
          referenceId: inv.id,
        });
        await mobileStorage.setVouchers(vouchers);
      }
    }

    return inv;
  }

  // ==========================================
  // VENDOR BILL MODULE (ACCOUNTS PAYABLE)
  // ==========================================

  async getVendorBills(): Promise<VendorBill[]> {
    return mobileStorage.getVendorBills();
  }

  async recordVendorBill(data: {
    vendorId: string;
    vendorName: string;
    vendorGstin?: string;
    billNo: string;
    billNumber?: string;
    category?: string;
    date?: string;
    billDate?: string;
    dueDate?: string;
    baseAmount: number;
    taxRate?: number;
    tdsCategory?: '194C' | '194J';
    tdsRate?: number;
    itcEligible?: boolean;
    notes?: string;
    workOrderId?: string;
  }): Promise<VendorBill> {
    const rawBillNo = (data.billNumber || data.billNo || '').trim();
    if (!rawBillNo) {
      throw new Error('Vendor bill number is required.');
    }

    // Validation 1: Bill Number Uniqueness
    const bills = await mobileStorage.getVendorBills();
    const existingBill = bills.find(
      (b) =>
        (b.billNo && b.billNo.toLowerCase() === rawBillNo.toLowerCase()) ||
        (b.billNumber && b.billNumber.toLowerCase() === rawBillNo.toLowerCase())
    );
    if (existingBill) {
      throw new Error(
        `Duplicate Bill: Bill number "${rawBillNo}" has already been recorded in the ledger.`
      );
    }

    // Validation 2: Vendor must exist and be active
    const vendors = await mobileStorage.getVendors();
    const vendor = vendors.find(
      (v) =>
        v.id === data.vendorId ||
        v.vendorCode === data.vendorId ||
        v.name.toLowerCase() === data.vendorName.trim().toLowerCase()
    );

    if (vendor) {
      const isVendorActive = vendor.empanelledStatus === 'Active';

      if (!isVendorActive) {
        throw new Error(
          `Vendor "${vendor.name}" is currently "${vendor.empanelledStatus || 'Inactive'}". Bills can only be processed for active empanelled vendors.`
        );
      }
    }

    // Validation 3: Base Amount > 0
    const base = Number(data.baseAmount);
    if (!base || base <= 0) {
      throw new Error('Vendor bill base taxable amount must be strictly greater than ₹0.');
    }

    const taxRate = data.taxRate !== undefined ? data.taxRate : 18;
    const gstAmount = Math.round((base * taxRate) / 100);
    const totalAmount = base + gstAmount;

    // TDS Category & Rate Preservation
    // Section 194C: Contractor payments (1% or 2%)
    // Section 194J: Professional geological & assay testing fees (10% or 2%)
    const vendorTdsSection =
      typeof vendor?.tds === 'object' && vendor.tds !== null ? (vendor.tds as any).section : undefined;
    const vendorTdsRate =
      typeof vendor?.tds === 'object' && vendor.tds !== null
        ? (vendor.tds as any).rate
        : typeof vendor?.tds === 'number'
        ? vendor.tds
        : undefined;

    const tdsCategory =
      data.tdsCategory ||
      (vendorTdsSection as '194C' | '194J') ||
      (data.category?.includes('Assay') || data.category?.includes('Testing')
        ? '194J'
        : '194C');

    const defaultTdsRate =
      vendorTdsRate !== undefined
        ? vendorTdsRate / 100
        : tdsCategory === '194J'
        ? 0.10
        : 0.02;

    const tdsRate = data.tdsRate !== undefined ? data.tdsRate : defaultTdsRate;
    const tdsAmount = Math.round(base * tdsRate);


    const bDate = data.billDate || data.date || new Date().toISOString().split('T')[0];
    const category = data.category || vendor?.category || 'Drilling & Coring';

    const newBill: VendorBill = {
      id: `vb-${Date.now()}`,
      billNo: rawBillNo,
      billNumber: rawBillNo,
      vendorId: vendor?.id || data.vendorId,
      vendorName: vendor?.name || data.vendorName.trim(),
      vendorGstin: vendor?.gstin || data.vendorGstin,
      category,
      date: bDate,
      billDate: bDate,
      dueDate: data.dueDate || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      baseAmount: base,
      taxRate,
      gstAmount,
      taxAmount: gstAmount,
      cgst: Math.round(gstAmount / 2),
      sgst: Math.round(gstAmount / 2),
      igst: 0,
      totalAmount,
      tdsCategory,
      tdsRate,
      tdsAmount,
      itcEligible: data.itcEligible !== undefined ? data.itcEligible : true,
      status: 'Pending Approval',
      notes: data.notes || `Verified against geological field logs & site supervisor report.`,
      workOrderId: data.workOrderId,
    };

    bills.unshift(newBill);
    await mobileStorage.setVendorBills(bills);

    // Cross-Module Side Effect 1: Auto-post Purchase Journal Voucher (with double-entry parity)
    const vouchers = await mobileStorage.getVouchers();
    const existingVoucher = vouchers.find(
      (v) => v.reference === newBill.billNo || (v.referenceType === 'bill' && v.referenceId === newBill.id)
    );

    if (!existingVoucher) {
      const voucherNum = `JV-${new Date().getFullYear()}-${String(vouchers.length + 1).padStart(4, '0')}`;
      vouchers.unshift({
        id: `vch-${Date.now()}`,
        voucherNumber: voucherNum,
        type: 'Purchase Journal',
        date: bDate,
        debitAccount: `5001 - Field Exploration Direct Expense (${category})`,
        debitAmount: base,
        creditAccount: `2001 - Accounts Payable (${newBill.vendorName})`,
        creditAmount: totalAmount,
        amount: totalAmount,
        status: 'Posted',
        narration: `Vendor bill ${newBill.billNo} from ${newBill.vendorName} for ${category}`,
        reference: newBill.billNo,
        referenceType: 'bill',
        referenceId: newBill.id,
      });
      await mobileStorage.setVouchers(vouchers);
    }

    // Cross-Module Side Effect 2: Flow into TDS Register
    const taxRecords = await mobileStorage.getTaxRecords();
    const challanNum = `CHL-TDS-${new Date().getFullYear()}-${String(taxRecords.length + 1).padStart(3, '0')}`;
    taxRecords.unshift({
      id: `tax-${Date.now()}`,
      challanNumber: challanNum,
      section: tdsCategory,
      deducteeName: newBill.vendorName,
      panNumber: vendor?.pan || (vendor?.gstin ? vendor.gstin.slice(2, 12) : 'AABCA3928L'),
      grossAmount: base,
      tdsRate: tdsRate * 100,
      tdsAmount,
      quarter: 'Q2',
      financialYear: '2026-27',
      status: 'Pending Deposit',
      referenceDoc: newBill.billNo,
    });
    await mobileStorage.setTaxRecords(taxRecords);

    return newBill;
  }

  async updateVendorBillStatus(
    id: string,
    status: 'Unpaid' | 'Pending Approval' | 'Approved' | 'Paid' | 'Overdue',
    paymentDetails?: {
      paymentMode?: string;
      bankAccount?: string;
      utrRef?: string;
    }
  ): Promise<VendorBill> {
    const bills = await mobileStorage.getVendorBills();
    const bill = bills.find((b) => b.id === id || b.billNo === id || b.billNumber === id);
    if (!bill) throw new Error(`Vendor bill "${id}" not found.`);

    bill.status = status;
    await mobileStorage.setVendorBills(bills);

    // If marked Paid, post Payment Voucher for net disbursement (Total - TDS) with idempotency
    if (status === 'Paid') {
      const vouchers = await mobileStorage.getVouchers();
      const existingPayment = vouchers.find(
        (v) =>
          v.referenceType === 'bill_payment' &&
          (v.referenceId === bill.id || v.reference === bill.billNo)
      );

      if (!existingPayment) {
        const netDisbursed = bill.totalAmount - bill.tdsAmount;
        const paymentMode = paymentDetails?.paymentMode || 'NEFT/RTGS';
        const bankAccount = paymentDetails?.bankAccount || 'HDFC Bank Corporate A/c';
        const voucherNum = `JV-${new Date().getFullYear()}-${String(vouchers.length + 1).padStart(4, '0')}`;

        vouchers.unshift({
          id: `vch-${Date.now()}`,
          voucherNumber: voucherNum,
          type: 'Payment Voucher',
          date: new Date().toISOString().split('T')[0],
          debitAccount: `2001 - Accounts Payable (${bill.vendorName})`,
          debitAmount: netDisbursed,
          creditAccount: `1002 - ${bankAccount}`,
          creditAmount: netDisbursed,
          amount: netDisbursed,
          status: 'Posted',
          narration: `Payment disbursed for bill ${bill.billNo} (${bill.vendorName}) via ${paymentMode}${
            paymentDetails?.utrRef ? ' - UTR: ' + paymentDetails.utrRef : ''
          }`,
          reference: bill.billNo,
          referenceType: 'bill_payment',
          referenceId: bill.id,
        });
        await mobileStorage.setVouchers(vouchers);
      }
    }

    return bill;
  }

  // ==========================================
  // DOUBLE-ENTRY VOUCHERS MODULE
  // ==========================================

  async getVouchers(): Promise<FinanceVoucher[]> {
    return mobileStorage.getVouchers();
  }

  async createVoucher(data: {
    voucherNumber?: string;
    type: 'Payment Voucher' | 'Receipt Voucher' | 'Journal Voucher' | 'Sales Journal' | 'Purchase Journal' | 'Bank Voucher';
    date?: string;
    debitAccount: string;
    creditAccount: string;
    amount: number;
    debitAmount?: number;
    creditAmount?: number;
    narration: string;
    reference?: string;
    referenceType?: string;
    referenceId?: string;
  }): Promise<FinanceVoucher> {
    const dr = Number(data.debitAmount !== undefined ? data.debitAmount : data.amount);
    const cr = Number(data.creditAmount !== undefined ? data.creditAmount : data.amount);

    if (!dr || dr <= 0 || !cr || cr <= 0) {
      throw new Error('Voucher amount must be strictly greater than ₹0.');
    }

    if (!data.debitAccount?.trim() || !data.creditAccount?.trim()) {
      throw new Error('Both Debit Account (Dr.) and Credit Account (Cr.) are required for double-entry ledger posting.');
    }

    if (data.debitAccount.trim() === data.creditAccount.trim()) {
      throw new Error('Debit Account and Credit Account cannot be the same ledger head.');
    }

    // CRITICAL DOUBLE-ENTRY PARITY VALIDATION
    if (dr !== cr) {
      throw new Error(
        `Double-entry parity violation: Debit amount (₹${dr.toLocaleString('en-IN')}) does not equal Credit amount (₹${cr.toLocaleString('en-IN')}). Difference: ₹${Math.abs(
          dr - cr
        ).toLocaleString('en-IN')}. Unbalanced vouchers cannot be saved.`
      );
    }

    if (!data.narration?.trim()) {
      throw new Error('An accounting narration explaining the journal transaction is mandatory.');
    }

    const vouchers = await mobileStorage.getVouchers();
    const vDate = data.date || new Date().toISOString().split('T')[0];
    const voucherNumber =
      data.voucherNumber ||
      `JV-${new Date().getFullYear()}-${String(vouchers.length + 1).padStart(4, '0')}`;

    const newVoucher: FinanceVoucher = {
      id: `vch-${Date.now()}`,
      voucherNumber,
      type: data.type,
      date: vDate,
      debitAccount: data.debitAccount.trim(),
      debitAmount: dr,
      creditAccount: data.creditAccount.trim(),
      creditAmount: cr,
      amount: dr,
      narration: data.narration.trim(),
      reference: data.reference?.trim() || 'MANUAL-ENTRY',
      referenceType: data.referenceType,
      referenceId: data.referenceId,
      status: 'Posted',
    };

    vouchers.unshift(newVoucher);
    await mobileStorage.setVouchers(vouchers);
    return newVoucher;
  }

  // ==========================================
  // TDS REGISTER MODULE
  // ==========================================

  async getTaxRecords(): Promise<TdsRecord[]> {
    return mobileStorage.getTaxRecords();
  }

  async createTaxRecord(data: Omit<TdsRecord, 'id'>): Promise<TdsRecord> {
    const records = await mobileStorage.getTaxRecords();
    const newRecord: TdsRecord = {
      ...data,
      id: `tax-${Date.now()}`,
    };
    records.unshift(newRecord);
    await mobileStorage.setTaxRecords(records);
    return newRecord;
  }

  async updateTaxStatus(
    id: string,
    status: 'Deposited' | 'Pending Deposit',
    challanDetails?: {
      challanNumber?: string;
      bsrCode?: string;
      paymentDate?: string;
      bankAccount?: string;
    }
  ): Promise<TdsRecord> {
    const records = await mobileStorage.getTaxRecords();
    const rec = records.find((r) => r.id === id || r.challanNumber === id);
    if (!rec) throw new Error(`TDS record "${id}" not found.`);

    rec.status = status;
    if (status === 'Deposited') {
      rec.paymentDate = challanDetails?.paymentDate || new Date().toISOString().split('T')[0];
      if (challanDetails?.challanNumber) {
        rec.challanNumber = challanDetails.challanNumber;
      }

      // Auto-post statutory settlement Payment Voucher
      const vouchers = await mobileStorage.getVouchers();
      const existingVoucher = vouchers.find(
        (v) => v.reference === rec.challanNumber || (v.referenceType === 'tds_deposit' && v.referenceId === rec.id)
      );

      if (!existingVoucher) {
        const voucherNum = `JV-${new Date().getFullYear()}-${String(vouchers.length + 1).padStart(4, '0')}`;
        vouchers.unshift({
          id: `vch-${Date.now()}`,
          voucherNumber: voucherNum,
          type: 'Payment Voucher',
          date: rec.paymentDate,
          debitAccount: `2201 - TDS Payable (Sec ${rec.section})`,
          debitAmount: rec.tdsAmount,
          creditAccount: `1002 - ${challanDetails?.bankAccount || 'HDFC Bank Corporate A/c'}`,
          creditAmount: rec.tdsAmount,
          amount: rec.tdsAmount,
          status: 'Posted',
          narration: `Government statutory challan deposit for TDS withheld under Section ${rec.section} from ${rec.deducteeName}`,
          reference: rec.challanNumber,
          referenceType: 'tds_deposit',
          referenceId: rec.id,
        });
        await mobileStorage.setVouchers(vouchers);
      }
    }

    await mobileStorage.setTaxRecords(records);
    return rec;
  }

  // ==========================================
  // GST OVERVIEW & RETURNS MODULE
  // ==========================================

  async getGstReturns(): Promise<GstReturn[]> {
    return mobileStorage.getGstReturns();
  }

  async getGstTransactions(): Promise<GstTransaction[]> {
    const invoices = await mobileStorage.getInvoices();
    const bills = await mobileStorage.getVendorBills();

    const txns: GstTransaction[] = [];

    // Outward Supplies from Invoices
    for (const inv of invoices) {
      txns.push({
        id: `gst-out-${inv.id}`,
        docNumber: inv.invoiceNo || inv.invoiceNumber || 'INV',
        counterPartyName: inv.clientName,
        counterPartyGstin: inv.clientGstin || '08AAACH1234F1Z8',
        supplyType: 'B2B Outward',
        invoiceDate: inv.date || inv.invoiceDate || '',
        taxableValue: inv.baseAmount || inv.preTaxAmount || 0,
        cgst: inv.cgst || 0,
        sgst: inv.sgst || 0,
        igst: inv.igst || 0,
        totalGst: (inv.cgst || 0) + (inv.sgst || 0) + (inv.igst || 0),
        itcEligibility: 'Not Applicable',
      });
    }

    // Inward Supplies from Vendor Bills
    for (const b of bills) {
      const isEligible = b.itcEligible !== false;
      txns.push({
        id: `gst-in-${b.id}`,
        docNumber: b.billNo || b.billNumber || 'VB',
        counterPartyName: b.vendorName,
        counterPartyGstin: b.vendorGstin || '08AAKFR4521M1Z3',
        supplyType: 'Inward B2B (ITC)',
        invoiceDate: b.date || b.billDate || '',
        taxableValue: b.baseAmount || 0,
        cgst: b.cgst || Math.round((b.gstAmount || 0) / 2),
        sgst: b.sgst || Math.round((b.gstAmount || 0) / 2),
        igst: b.igst || 0,
        totalGst: b.gstAmount || 0,
        itcEligibility: isEligible ? 'Eligible' : 'Ineligible',
      });
    }

    return txns;
  }

  // ==========================================
  // METRICS & RECONCILIATION SUMMARY
  // ==========================================

  async getOverviewMetrics(): Promise<FinanceOverviewMetrics> {
    const invoices = await mobileStorage.getInvoices();
    const bills = await mobileStorage.getVendorBills();
    const vouchers = await mobileStorage.getVouchers();
    const taxRecords = await mobileStorage.getTaxRecords();

    // Invoices metrics
    const totalInvoicesAmount = invoices.reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);
    const totalInvoicesCount = invoices.length;

    const totalCollected = invoices
      .filter((inv) => inv.status === 'Paid')
      .reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);

    const outstandingReceivables = Math.max(0, totalInvoicesAmount - totalCollected);
    const overdueReceivablesCount = invoices.filter((inv) => inv.status === 'Overdue').length;

    // Vendor Bills metrics
    const vendorBillsAmount = bills.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
    const vendorBillsCount = bills.length;

    // Cash flow metrics from vouchers and receipts
    const totalPayments = vouchers
      .filter((v) => v.type === 'Payment Voucher')
      .reduce((sum, v) => sum + (v.amount || 0), 0);

    const totalReceipts = vouchers
      .filter((v) => v.type === 'Receipt Voucher' || v.type === 'Bank Voucher')
      .reduce((sum, v) => sum + (v.amount || 0), 0) || totalCollected;

    const netCashFlow = totalReceipts - totalPayments;

    // GST metrics: Output GST - Input Tax Credit
    const outputGst = invoices.reduce(
      (sum, inv) => sum + ((inv.cgst || 0) + (inv.sgst || 0) + (inv.igst || 0)),
      0
    );

    const inputTaxCredit = bills
      .filter((b) => b.itcEligible)
      .reduce((sum, b) => sum + (b.gstAmount || 0), 0);

    const netGstPayable = Math.max(0, outputGst - inputTaxCredit);

    // TDS metrics
    const totalTdsWithheld = taxRecords.reduce((sum, t) => sum + (t.tdsAmount || 0), 0);
    const totalTdsDeposited = taxRecords
      .filter((t) => t.status === 'Deposited')
      .reduce((sum, t) => sum + (t.tdsAmount || 0), 0);
    const tdsPayable = taxRecords
      .filter((t) => t.status === 'Pending Deposit')
      .reduce((sum, t) => sum + (t.tdsAmount || 0), 0);

    return {
      totalInvoicesAmount,
      totalInvoicesCount,
      outstandingReceivables,
      overdueReceivablesCount,
      vendorBillsAmount,
      vendorBillsCount,
      totalPayments,
      totalReceipts,
      netCashFlow,
      netGstPayable,
      outputGst,
      inputTaxCredit,
      tdsPayable,
      totalTdsWithheld,
      totalTdsDeposited,
    };
  }

  // Backwards compatible tax summary
  async getTaxSummary() {
    const metrics = await this.getOverviewMetrics();
    return {
      outputGst: metrics.outputGst,
      inputTaxCredit: metrics.inputTaxCredit,
      netGstLiability: metrics.netGstPayable,
      totalTdsWithheld: metrics.totalTdsWithheld,
    };
  }
}

export const financeService = new FinanceService();
