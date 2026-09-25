import React, { useState } from 'react';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Select } from '@/components/common/Select';
import { Textarea } from '@/components/common/Textarea';
import { useToast } from '@/contexts/ToastContext';
import { financeService } from '@/modules/finance/services/finance.service';
export const RecordTransactionModal = ({ isOpen, onClose, onTransactionRecorded, defaultType = 'Receipt', }) => {
    const toast = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [type, setType] = useState(defaultType);
    const [transactionNumber, setTransactionNumber] = useState(() => `TXN-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 900) + 100)}`);
    const [date, setDate] = useState(() => new Date().toLocaleDateString('en-CA'));
    const [partyName, setPartyName] = useState('');
    const [referenceDoc, setReferenceDoc] = useState('');
    const [paymentMode, setPaymentMode] = useState('NEFT/RTGS');
    const [bankAccount, setBankAccount] = useState('HDFC Bank - Jaipur Corp A/C (..4910)');
    const [amount, setAmount] = useState(150000);
    const [remarks, setRemarks] = useState('');
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!partyName.trim()) {
            toast.error('Please enter the party name.', 'Validation Error');
            return;
        }
        if (amount <= 0) {
            toast.error('Please enter a valid amount.', 'Validation Error');
            return;
        }
        setIsSubmitting(true);
        try {
            const created = await financeService.recordTransaction({
                transactionNumber,
                date,
                type,
                partyName: partyName.trim(),
                referenceDoc: referenceDoc.trim() || (type === 'Receipt' ? 'INV-DIRECT' : 'VB-DIRECT'),
                paymentMode,
                bankAccount,
                amount: Number(amount),
                status: 'Completed',
                remarks: remarks.trim() || undefined,
            });
            toast.success(`${type} of ₹${created.amount.toLocaleString('en-IN')} recorded successfully.`, 'Transaction Recorded');
            onTransactionRecorded(created);
            onClose();
        }
        catch {
            toast.error('Could not record transaction.', 'System Error');
        }
        finally {
            setIsSubmitting(false);
        }
    };
    return (<Modal isOpen={isOpen} onClose={onClose} title="Record Payment / Receipt" description="Post an incoming receipt from a client or a disbursement payment to a vendor." maxWidth="2xl">
      <form onSubmit={handleSubmit} className="space-y-4 font-inter">
        {/* Transaction Type Segmented Toggle */}
        <div className="flex items-center gap-2 p-1 bg-slate-100 dark:bg-[#111821] rounded-xl border border-slate-200 dark:border-[#253344]">
          <button type="button" onClick={() => setType('Receipt')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${type === 'Receipt'
            ? 'bg-emerald-600 text-white shadow-xs'
            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}>
            Receipt (Inflow from Client)
          </button>
          <button type="button" onClick={() => setType('Payment')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${type === 'Payment'
            ? 'bg-rose-600 text-white shadow-xs'
            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}>
            Payment (Disbursement to Vendor)
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input label="Transaction Number" value={transactionNumber} onChange={(e) => setTransactionNumber(e.target.value)} isRequired/>
          <Input label="Transaction Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} isRequired/>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input label={type === 'Receipt' ? 'Received From (Client)' : 'Paid To (Vendor / Beneficiary)'} placeholder={type === 'Receipt' ? 'e.g. Vedanta Mining Corp' : 'e.g. Apex Core Drilling'} value={partyName} onChange={(e) => setPartyName(e.target.value)} isRequired/>
          <Input label="Reference (Invoice / Bill / PO #)" placeholder="e.g. INV-2026-001 or VB-2026-084" value={referenceDoc} onChange={(e) => setReferenceDoc(e.target.value)}/>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Select label="Payment Mode" value={paymentMode} onChange={(e) => setPaymentMode(e.target.value)} options={[
            { value: 'NEFT/RTGS', label: 'NEFT / RTGS Bank Transfer' },
            { value: 'UPI', label: 'UPI Instant Transfer' },
            { value: 'Cheque', label: 'Bank Cheque / Demand Draft' },
            { value: 'Wire Transfer', label: 'International Wire / SWIFT' },
            { value: 'Net Banking', label: 'Corporate Net Banking' },
        ]}/>
          <Input label="Amount (₹)" type="number" min="1" value={amount} onChange={(e) => setAmount(Number(e.target.value))} isRequired/>
        </div>

        <Select label="Bank & Ledger Account" value={bankAccount} onChange={(e) => setBankAccount(e.target.value)} options={[
            { value: 'HDFC Bank - Jaipur Corp A/C (..4910)', label: 'HDFC Bank - Jaipur Corp A/C (..4910)' },
            { value: 'ICICI Bank - Operations A/C (..8821)', label: 'ICICI Bank - Operations A/C (..8821)' },
            { value: 'SBI - Statutory Remittance A/C (..1102)', label: 'SBI - Statutory Remittance A/C (..1102)' },
            { value: 'Petty Cash - Exploration Bhilwara Camp', label: 'Petty Cash - Exploration Bhilwara Camp' },
        ]}/>

        <Textarea label="Transaction Remarks & Bank UTR" placeholder="UTR Ref / Bank advice confirmation note." value={remarks} onChange={(e) => setRemarks(e.target.value)} rows={2}/>

        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-200 dark:border-[#253344]">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant={type === 'Receipt' ? 'success' : 'danger'} isLoading={isSubmitting}>
            Record {type}
          </Button>
        </div>
      </form>
    </Modal>);
};
