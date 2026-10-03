export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitRate: number;
  amount: number;
}

export interface FinanceInvoice {
  id: string;
  invoiceNo: string;
  invoiceNumber?: string; // alias for web parity
  clientId: string;
  clientName: string;
  clientGstin?: string;
  clientEmail?: string;
  billingAddress?: string;
  projectTitle: string;
  projectId?: string;
  date: string;
  invoiceDate?: string; // alias for web parity
  dueDate: string;
  items?: InvoiceItem[];
  baseAmount: number;
  preTaxAmount?: number; // alias for web parity
  taxRate?: number; // 18, 12, 5, 0
  cgst: number;
  sgst: number;
  igst: number;
  taxAmount?: number; // total tax amount
  tdsRate?: number; // expected TDS withholding % (e.g. 2% or 10%)
  tdsAmount?: number;
  totalAmount: number;
  paidAmount?: number;
  status: 'Unpaid' | 'Paid' | 'Partially Paid' | 'Pending' | 'Overdue' | 'Draft';
  paymentTerms?: string;
  notes?: string;
}

export interface VendorBill {
  id: string;
  billNo: string;
  billNumber?: string; // alias for web parity
  vendorId: string;
  vendorName: string;
  vendorGstin?: string;
  category?: string; // Drilling & Coring, Assay & Testing, Equipment Lease, Field Logistics, Survey & Mapping, Consumables
  date: string;
  billDate?: string; // alias for web parity
  dueDate?: string;
  baseAmount: number;
  taxRate?: number;
  gstAmount: number;
  taxAmount?: number; // alias for web parity
  cgst?: number;
  sgst?: number;
  igst?: number;
  totalAmount: number;
  tdsCategory?: '194C' | '194J';
  tdsRate?: number; // decimal e.g. 0.02 or 0.10
  tdsAmount: number;
  itcEligible: boolean;
  status: 'Unpaid' | 'Pending Approval' | 'Approved' | 'Paid' | 'Overdue';
  notes?: string;
  workOrderId?: string;
}

export interface FinanceVoucher {
  id: string;
  voucherNumber: string;
  type: 'Payment Voucher' | 'Receipt Voucher' | 'Journal Voucher' | 'Sales Journal' | 'Purchase Journal' | 'Bank Voucher';
  date: string;
  debitAccount: string;
  creditAccount: string;
  amount: number;
  debitAmount?: number;
  creditAmount?: number;
  reference?: string;
  referenceType?: string;
  referenceId?: string;

  status?: 'Posted' | 'Audited' | 'Draft';
  narration: string;
}

export interface TdsRecord {
  id: string;
  challanNumber: string;
  section: '194C' | '194J' | '194I' | '192';
  deducteeName: string;
  panNumber: string;
  grossAmount: number;
  tdsRate: number; // e.g. 2.0 or 10.0
  tdsAmount: number;
  quarter: 'Q1' | 'Q2' | 'Q3' | 'Q4';
  financialYear: string; // e.g. '2026-27'
  status: 'Deposited' | 'Pending Deposit';
  paymentDate?: string;
  paidDate?: string;
  depositDueDate?: string;
  referenceDoc?: string;
}

export interface GstTransaction {
  id: string;
  docNumber: string;
  counterPartyName: string;
  counterPartyGstin: string;
  supplyType: 'B2B Outward' | 'Inward B2B (ITC)';
  invoiceDate: string;
  taxableValue: number;
  cgst: number;
  sgst: number;
  igst: number;
  totalGst: number;
  itcEligibility: 'Eligible' | 'Ineligible' | 'Not Applicable';
}

export interface GstReturn {
  id: string;
  returnType: 'GSTR-1' | 'GSTR-3B' | 'GSTR-9';
  period: string;
  dueDate: string;
  status: 'Filed' | 'Ready to File' | 'Due Soon' | 'Pending';
  arnNumber?: string;
  filingDate?: string;
}

export interface FinanceOverviewMetrics {
  totalInvoicesAmount: number;
  totalInvoicesCount: number;
  outstandingReceivables: number;
  overdueReceivablesCount: number;
  vendorBillsAmount: number;
  vendorBillsCount: number;
  totalPayments: number;
  totalReceipts: number;
  netCashFlow: number;
  netGstPayable: number;
  outputGst: number;
  inputTaxCredit: number;
  tdsPayable: number;
  totalTdsWithheld: number;
  totalTdsDeposited: number;
}
