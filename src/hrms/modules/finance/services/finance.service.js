import { INITIAL_CLIENT_INVOICES, INITIAL_RECEIVABLES, INITIAL_VENDOR_BILLS, INITIAL_TRANSACTIONS, INITIAL_ACCOUNTING_ENTRIES, INITIAL_TAX_RECORDS, INITIAL_GST_RETURNS, INITIAL_GST_TRANSACTIONS, INITIAL_BUDGET_ITEMS, } from '@/data/finance/finance';
const KEYS = {
    INVOICES: 'bgspl_finance_invoices',
    RECEIVABLES: 'bgspl_finance_receivables',
    BILLS: 'bgspl_finance_bills',
    TRANSACTIONS: 'bgspl_finance_transactions',
    ENTRIES: 'bgspl_finance_entries',
    TAX_RECORDS: 'bgspl_finance_tax',
    GST_RETURNS: 'bgspl_finance_gst_returns',
    GST_TRANSACTIONS: 'bgspl_finance_gst_txns',
    BUDGETS: 'bgspl_finance_budgets',
};
function getStored(key, defaultVal) {
    try {
        const raw = localStorage.getItem(key);
        if (!raw) {
            localStorage.setItem(key, JSON.stringify(defaultVal));
            return defaultVal;
        }
        return JSON.parse(raw);
    }
    catch {
        return defaultVal;
    }
}
function setStored(key, val) {
    try {
        localStorage.setItem(key, JSON.stringify(val));
    }
    catch (err) {
        console.error(`Error saving finance data to ${key}`, err);
    }
}
export const financeService = {
    // Invoices
    async getInvoices() {
        return getStored(KEYS.INVOICES, INITIAL_CLIENT_INVOICES);
    },
    async createInvoice(data) {
        const invoices = await this.getInvoices();
        const newInvoice = {
            ...data,
            id: `inv-${Date.now()}`,
            paidAmount: 0,
        };
        const updated = [newInvoice, ...invoices];
        setStored(KEYS.INVOICES, updated);
        // Also synchronize into Receivables
        const receivables = await this.getReceivables();
        const newReceivable = {
            id: `rec-${Date.now()}`,
            invoiceId: newInvoice.id,
            invoiceNumber: newInvoice.invoiceNumber,
            clientName: newInvoice.clientName,
            invoiceDate: newInvoice.invoiceDate,
            dueDate: newInvoice.dueDate,
            totalAmount: newInvoice.totalAmount,
            receivedAmount: 0,
            outstandingAmount: newInvoice.totalAmount,
            status: 'Pending',
            agingBucket: '0-30',
        };
        setStored(KEYS.RECEIVABLES, [newReceivable, ...receivables]);
        // Also log automatic Accounting Sales Entry
        const entries = await this.getAccountingEntries();
        const autoEntry = {
            id: `entry-${Date.now()}`,
            entryNumber: `JV-${new Date().getFullYear()}-${String(entries.length + 1).padStart(4, '0')}`,
            date: newInvoice.invoiceDate,
            entryType: 'Sales Journal',
            reference: newInvoice.invoiceNumber,
            debitAccount: `1200 - Accounts Receivable (${newInvoice.clientName})`,
            debitAmount: newInvoice.totalAmount,
            creditAccount: '4001 - Geological Survey & Core Drilling Revenue',
            creditAmount: newInvoice.totalAmount,
            status: 'Posted',
            narration: `Client invoice ${newInvoice.invoiceNumber} booked for ${newInvoice.clientName}`,
        };
        setStored(KEYS.ENTRIES, [autoEntry, ...entries]);
        return newInvoice;
    },
    async updateInvoiceStatus(id, status, paidAmount) {
        const invoices = await this.getInvoices();
        const updated = invoices.map((inv) => {
            if (inv.id === id) {
                const nextPaid = paidAmount !== undefined ? paidAmount : status === 'Paid' ? inv.totalAmount : inv.paidAmount;
                return { ...inv, status, paidAmount: nextPaid };
            }
            return inv;
        });
        setStored(KEYS.INVOICES, updated);
    },
    // Receivables
    async getReceivables() {
        return getStored(KEYS.RECEIVABLES, INITIAL_RECEIVABLES);
    },
    async recordReceipt(receivableId, amountReceived, paymentMode, bankAccount = 'HDFC Bank - Jaipur Corporate A/C (..4910)', remarks = 'Payment received against client invoice') {
        const receivables = await this.getReceivables();
        let targetRec;
        const updatedReceivables = receivables.map((r) => {
            if (r.id === receivableId) {
                const newReceived = r.receivedAmount + amountReceived;
                const newOutstanding = Math.max(0, r.totalAmount - newReceived);
                const newStatus = newOutstanding === 0 ? 'Paid' : 'Partially Paid';
                targetRec = { ...r, receivedAmount: newReceived, outstandingAmount: newOutstanding, status: newStatus };
                return targetRec;
            }
            return r;
        });
        setStored(KEYS.RECEIVABLES, updatedReceivables);
        if (targetRec) {
            // Sync invoice status
            await this.updateInvoiceStatus(targetRec.invoiceId, targetRec.status, targetRec.receivedAmount);
            // Create transaction record
            const transactions = await this.getTransactions();
            const newTxn = {
                id: `txn-${Date.now()}`,
                transactionNumber: `TXN-${new Date().getFullYear()}-${String(transactions.length + 101)}`,
                date: new Date().toLocaleDateString('en-CA'),
                type: 'Receipt',
                partyName: targetRec.clientName,
                referenceDoc: targetRec.invoiceNumber,
                paymentMode,
                bankAccount,
                amount: amountReceived,
                status: 'Completed',
                remarks,
            };
            setStored(KEYS.TRANSACTIONS, [newTxn, ...transactions]);
            // Create double entry
            const entries = await this.getAccountingEntries();
            const autoEntry = {
                id: `entry-${Date.now()}`,
                entryNumber: `JV-${new Date().getFullYear()}-${String(entries.length + 1).padStart(4, '0')}`,
                date: new Date().toLocaleDateString('en-CA'),
                entryType: 'Bank Voucher',
                reference: targetRec.invoiceNumber,
                debitAccount: `1002 - ${bankAccount}`,
                debitAmount: amountReceived,
                creditAccount: `1200 - Accounts Receivable (${targetRec.clientName})`,
                creditAmount: amountReceived,
                status: 'Posted',
                narration: `Receipt recorded against ${targetRec.invoiceNumber} via ${paymentMode}`,
            };
            setStored(KEYS.ENTRIES, [autoEntry, ...entries]);
        }
    },
    // Vendor Bills
    async getVendorBills() {
        return getStored(KEYS.BILLS, INITIAL_VENDOR_BILLS);
    },
    async createVendorBill(data) {
        const bills = await this.getVendorBills();
        const newBill = {
            ...data,
            id: `vb-${Date.now()}`,
        };
        const updated = [newBill, ...bills];
        setStored(KEYS.BILLS, updated);
        // Auto accounting purchase entry
        const entries = await this.getAccountingEntries();
        const autoEntry = {
            id: `entry-${Date.now()}`,
            entryNumber: `JV-${new Date().getFullYear()}-${String(entries.length + 1).padStart(4, '0')}`,
            date: newBill.billDate,
            entryType: 'Purchase Journal',
            reference: newBill.billNumber,
            debitAccount: `5001 - Field Exploration Direct Expense (${newBill.category})`,
            debitAmount: newBill.baseAmount,
            creditAccount: `2001 - Accounts Payable (${newBill.vendorName})`,
            creditAmount: newBill.totalAmount,
            status: 'Posted',
            narration: `Vendor bill ${newBill.billNumber} from ${newBill.vendorName}`,
        };
        setStored(KEYS.ENTRIES, [autoEntry, ...entries]);
        return newBill;
    },
    async updateVendorBillStatus(id, status) {
        const bills = await this.getVendorBills();
        const updated = bills.map((b) => (b.id === id ? { ...b, status } : b));
        setStored(KEYS.BILLS, updated);
    },
    // Transactions
    async getTransactions() {
        return getStored(KEYS.TRANSACTIONS, INITIAL_TRANSACTIONS);
    },
    async recordTransaction(data) {
        const txns = await this.getTransactions();
        const newTxn = {
            ...data,
            id: `txn-${Date.now()}`,
        };
        setStored(KEYS.TRANSACTIONS, [newTxn, ...txns]);
        return newTxn;
    },
    // Accounting Entries
    async getAccountingEntries() {
        return getStored(KEYS.ENTRIES, INITIAL_ACCOUNTING_ENTRIES);
    },
    async createAccountingEntry(data) {
        const entries = await this.getAccountingEntries();
        const newEntry = {
            ...data,
            id: `entry-${Date.now()}`,
        };
        setStored(KEYS.ENTRIES, [newEntry, ...entries]);
        return newEntry;
    },
    // Tax Records
    async getTaxRecords() {
        return getStored(KEYS.TAX_RECORDS, INITIAL_TAX_RECORDS);
    },
    async createTaxRecord(data) {
        const records = await this.getTaxRecords();
        const newRecord = {
            ...data,
            id: `tax-${Date.now()}`,
        };
        setStored(KEYS.TAX_RECORDS, [newRecord, ...records]);
        return newRecord;
    },
    async updateTaxStatus(id, status) {
        const records = await this.getTaxRecords();
        const updated = records.map((r) => (r.id === id ? { ...r, status } : r));
        setStored(KEYS.TAX_RECORDS, updated);
    },
    // GST Returns & Transactions
    async getGstReturns() {
        return getStored(KEYS.GST_RETURNS, INITIAL_GST_RETURNS);
    },
    async getGstTransactions() {
        return getStored(KEYS.GST_TRANSACTIONS, INITIAL_GST_TRANSACTIONS);
    },
    // Budgets
    async getBudgets() {
        return getStored(KEYS.BUDGETS, INITIAL_BUDGET_ITEMS);
    },
    async createBudgetAllocation(data) {
        const budgets = await this.getBudgets();
        const variance = data.allocatedAmount - data.actualSpend;
        const ratio = data.actualSpend / data.allocatedAmount;
        const status = ratio > 1 ? 'Exceeded' : ratio >= 0.85 ? 'Near Limit' : 'On Track';
        const newItem = {
            ...data,
            id: `bgt-${Date.now()}`,
            variance,
            status,
        };
        setStored(KEYS.BUDGETS, [newItem, ...budgets]);
        return newItem;
    },
    // Metrics for Overview Dashboard
    async getOverviewMetrics() {
        const invoices = await this.getInvoices();
        const receivables = await this.getReceivables();
        const bills = await this.getVendorBills();
        const transactions = await this.getTransactions();
        const taxRecords = await this.getTaxRecords();
        const budgets = await this.getBudgets();
        const gstTxns = await this.getGstTransactions();
        const totalInvoicesAmount = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
        const outstandingReceivables = receivables.reduce((sum, r) => sum + r.outstandingAmount, 0);
        const overdueReceivablesCount = receivables.filter((r) => r.status === 'Overdue').length;
        const vendorBillsAmount = bills.reduce((sum, b) => sum + b.totalAmount, 0);
        const totalPayments = transactions.filter((t) => t.type === 'Payment').reduce((sum, t) => sum + t.amount, 0);
        const totalReceipts = transactions.filter((t) => t.type === 'Receipt').reduce((sum, t) => sum + t.amount, 0);
        const netCashFlow = totalReceipts - totalPayments;
        const outputGst = gstTxns.filter((g) => g.supplyType.includes('Outward')).reduce((sum, g) => sum + g.totalGst, 0);
        const inputGst = gstTxns.filter((g) => g.supplyType.includes('Inward')).reduce((sum, g) => sum + g.totalGst, 0);
        const netGstPayable = Math.max(0, outputGst - inputGst);
        const tdsPayable = taxRecords.filter((t) => t.status === 'Pending Deposit').reduce((sum, t) => sum + t.tdsAmount, 0);
        const totalBudget = budgets.reduce((sum, b) => sum + b.allocatedAmount, 0);
        const totalBudgetSpent = budgets.reduce((sum, b) => sum + b.actualSpend, 0);
        const budgetUtilizationPercent = totalBudget > 0 ? Math.round((totalBudgetSpent / totalBudget) * 100) : 0;
        return {
            totalInvoicesAmount,
            totalInvoicesCount: invoices.length,
            outstandingReceivables,
            overdueReceivablesCount,
            vendorBillsAmount,
            vendorBillsCount: bills.length,
            totalPayments,
            totalReceipts,
            netCashFlow,
            netGstPayable,
            tdsPayable,
            totalBudget,
            totalBudgetSpent,
            budgetUtilizationPercent,
        };
    },
};
