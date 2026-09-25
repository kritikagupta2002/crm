import React, { useState } from 'react';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Select } from '@/components/common/Select';
import { Textarea } from '@/components/common/Textarea';
import { useToast } from '@/contexts/ToastContext';
import { financeService } from '@/modules/finance/services/finance.service';
export const NewAccountingEntryModal = ({ isOpen, onClose, onEntryCreated, }) => {
    const toast = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [entryNumber, setEntryNumber] = useState(() => `JV-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 900) + 100)}`);
    const [date, setDate] = useState(() => new Date().toLocaleDateString('en-CA'));
    const [entryType, setEntryType] = useState('Journal Voucher');
    const [reference, setReference] = useState('');
    const [debitAccount, setDebitAccount] = useState('5002 - Direct Field Drilling Rig Expenses');
    const [debitAmount, setDebitAmount] = useState(125000);
    const [creditAccount, setCreditAccount] = useState('1002 - HDFC Bank Jaipur Corporate Account');
    const [creditAmount, setCreditAmount] = useState(125000);
    const [narration, setNarration] = useState('');
    const isBalanced = Number(debitAmount) === Number(creditAmount);
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!isBalanced) {
            toast.error('Debit and Credit amounts must match for a balanced entry.', 'Out of Balance');
            return;
        }
        if (debitAmount <= 0) {
            toast.error('Amount must be greater than zero.', 'Validation Error');
            return;
        }
        if (!narration.trim()) {
            toast.error('Please enter a narration description for this accounting voucher.', 'Validation Error');
            return;
        }
        setIsSubmitting(true);
        try {
            const created = await financeService.createAccountingEntry({
                entryNumber,
                date,
                entryType,
                reference: reference.trim() || 'MANUAL-ENTRY',
                debitAccount,
                debitAmount: Number(debitAmount),
                creditAccount,
                creditAmount: Number(creditAmount),
                status: 'Posted',
                narration: narration.trim(),
            });
            toast.success(`Journal entry ${created.entryNumber} posted for ₹${created.debitAmount.toLocaleString('en-IN')}`, 'Accounting Entry Posted');
            onEntryCreated(created);
            onClose();
        }
        catch {
            toast.error('Could not post accounting entry.', 'System Error');
        }
        finally {
            setIsSubmitting(false);
        }
    };
    return (<Modal isOpen={isOpen} onClose={onClose} title="New Accounting Journal Entry" description="Create a double-entry general ledger voucher with balanced debit and credit allocations." maxWidth="2xl">
      <form onSubmit={handleSubmit} className="space-y-4 font-inter">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Input label="Entry Number" value={entryNumber} onChange={(e) => setEntryNumber(e.target.value)} isRequired/>
          <Input label="Posting Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} isRequired/>
          <Select label="Voucher Type" value={entryType} onChange={(e) => setEntryType(e.target.value)} options={[
            { value: 'Journal Voucher', label: 'Journal Voucher (JV)' },
            { value: 'Sales Journal', label: 'Sales Journal' },
            { value: 'Purchase Journal', label: 'Purchase Journal' },
            { value: 'Bank Voucher', label: 'Bank Payment/Receipt' },
        ]}/>
        </div>

        <Input label="Supporting Document Reference" placeholder="e.g. INV-2026-001 / BILL-89 / BOARD-APPROVAL" value={reference} onChange={(e) => setReference(e.target.value)}/>

        {/* Double Entry Rows */}
        <div className="space-y-3 p-3.5 rounded-xl bg-slate-50 dark:bg-[#111821] border border-slate-200 dark:border-[#253344]">
          <span className="text-[11px] font-bold text-[var(--ink-2,#4a5b68)] dark:text-slate-300 uppercase tracking-wider font-mono">
            Double Entry Ledger Accounts
          </span>

          {/* Debit Row */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
            <div className="sm:col-span-8">
              <Select label="Debit Account (Dr.)" value={debitAccount} onChange={(e) => setDebitAccount(e.target.value)} options={[
            { value: '5002 - Direct Field Drilling Rig Expenses', label: '5002 - Direct Field Drilling Rig Expenses' },
            { value: '5003 - Mineral Assay & Laboratory Testing', label: '5003 - Mineral Assay & Laboratory Testing' },
            { value: '5100 - Geological Staff Salaries Expense', label: '5100 - Geological Staff Salaries Expense' },
            { value: '1002 - HDFC Bank Jaipur Corporate Account', label: '1002 - HDFC Bank Jaipur Corporate Account' },
            { value: '1200 - Accounts Receivable Control', label: '1200 - Accounts Receivable Control' },
            { value: '2201 - TDS Payable (Statutory)', label: '2201 - TDS Payable (Statutory)' },
        ]}/>
            </div>
            <div className="sm:col-span-4">
              <Input label="Debit Amount (₹)" type="number" min="1" value={debitAmount} onChange={(e) => setDebitAmount(Number(e.target.value))} isRequired/>
            </div>
          </div>

          {/* Credit Row */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
            <div className="sm:col-span-8">
              <Select label="Credit Account (Cr.)" value={creditAccount} onChange={(e) => setCreditAccount(e.target.value)} options={[
            { value: '1002 - HDFC Bank Jaipur Corporate Account', label: '1002 - HDFC Bank Jaipur Corporate Account' },
            { value: '2001 - Accounts Payable (Vendors & Contractors)', label: '2001 - Accounts Payable (Vendors & Contractors)' },
            { value: '4001 - Geological Survey & Drilling Revenue', label: '4001 - Geological Survey & Drilling Revenue' },
            { value: '2100 - Salaries Payable Control Account', label: '2100 - Salaries Payable Control Account' },
            { value: '1200 - Accounts Receivable Control', label: '1200 - Accounts Receivable Control' },
        ]}/>
            </div>
            <div className="sm:col-span-4">
              <Input label="Credit Amount (₹)" type="number" min="1" value={creditAmount} onChange={(e) => setCreditAmount(Number(e.target.value))} isRequired/>
            </div>
          </div>

          {/* Balance validation alert */}
          <div className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center justify-between ${isBalanced
            ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50'
            : 'bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-800/50'}`}>
            <span>
              {isBalanced
            ? '✓ Voucher is in balance (Debit = Credit)'
            : `⚠ Difference: ₹${Math.abs(debitAmount - creditAmount).toLocaleString('en-IN')}`}
            </span>
            <span className="font-mono">
              ₹{Number(debitAmount || 0).toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        <Textarea label="Narration / Purpose" placeholder="Being payment disbursed for core logging and highwall structural assessment..." value={narration} onChange={(e) => setNarration(e.target.value)} rows={2} isRequired/>

        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-200 dark:border-[#253344]">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting} disabled={!isBalanced}>
            Post Accounting Entry
          </Button>
        </div>
      </form>
    </Modal>);
};
