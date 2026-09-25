import React, { useState } from 'react';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Select } from '@/components/common/Select';
import { Textarea } from '@/components/common/Textarea';
import { useToast } from '@/contexts/ToastContext';
import { financeService } from '@/modules/finance/services/finance.service';
export const AddVendorBillModal = ({ isOpen, onClose, onBillAdded, }) => {
    const toast = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [billNumber, setBillNumber] = useState(() => `VB-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 900) + 100)}`);
    const [vendorName, setVendorName] = useState('');
    const [vendorGstin, setVendorGstin] = useState('');
    const [category, setCategory] = useState('Drilling & Coring');
    const [billDate, setBillDate] = useState(() => new Date().toLocaleDateString('en-CA'));
    const [dueDate, setDueDate] = useState(() => {
        const d = new Date();
        d.setDate(d.getDate() + 30);
        return d.toLocaleDateString('en-CA');
    });
    const [baseAmount, setBaseAmount] = useState(250000);
    const [taxRate, setTaxRate] = useState(18);
    const [notes, setNotes] = useState('');
    const taxAmount = Math.round((Number(baseAmount || 0) * taxRate) / 100);
    const totalAmount = Number(baseAmount || 0) + taxAmount;
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!vendorName.trim()) {
            toast.error('Please enter vendor name.', 'Validation Error');
            return;
        }
        if (!billNumber.trim()) {
            toast.error('Please enter bill number.', 'Validation Error');
            return;
        }
        if (baseAmount <= 0) {
            toast.error('Please enter a valid bill amount.', 'Validation Error');
            return;
        }
        setIsSubmitting(true);
        try {
            const created = await financeService.createVendorBill({
                billNumber,
                vendorName: vendorName.trim(),
                vendorGstin: vendorGstin.trim() || undefined,
                category,
                billDate,
                dueDate,
                baseAmount: Number(baseAmount),
                taxRate,
                taxAmount,
                totalAmount,
                status: 'Pending Approval',
                notes,
            });
            toast.success(`Bill ${created.billNumber} from ${created.vendorName} added successfully.`, 'Vendor Bill Recorded');
            onBillAdded(created);
            onClose();
        }
        catch {
            toast.error('Could not record vendor bill.', 'System Error');
        }
        finally {
            setIsSubmitting(false);
        }
    };
    return (<Modal isOpen={isOpen} onClose={onClose} title="Add Vendor Bill" description="Record incoming contractor or supplier bill for geological exploration, assays, or equipment lease." maxWidth="2xl">
      <form onSubmit={handleSubmit} className="space-y-4 font-inter">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input label="Bill / Invoice Number" value={billNumber} onChange={(e) => setBillNumber(e.target.value)} isRequired/>
          <Select label="Expense Category" value={category} onChange={(e) => setCategory(e.target.value)} options={[
            { value: 'Drilling & Coring', label: 'Drilling & Coring (Rig & Bits)' },
            { value: 'Assay & Testing', label: 'Assay & Testing (Geochemical Labs)' },
            { value: 'Equipment Lease', label: 'Equipment Lease (Generators & Winches)' },
            { value: 'Field Logistics', label: 'Field Logistics (4x4 & Camp Support)' },
            { value: 'Survey & Mapping', label: 'Survey & Mapping (DGPS & Total Station)' },
            { value: 'Consumables', label: 'Consumables (Safety gear & core boxes)' },
        ]}/>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input label="Vendor / Contractor Name" placeholder="e.g. Apex Diamond Core Drilling" value={vendorName} onChange={(e) => setVendorName(e.target.value)} isRequired/>
          <Input label="Vendor GSTIN" placeholder="e.g. 08AABCA3928L1ZU" value={vendorGstin} onChange={(e) => setVendorGstin(e.target.value)}/>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input label="Bill Date" type="date" value={billDate} onChange={(e) => setBillDate(e.target.value)} isRequired/>
          <Input label="Due Date" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} isRequired/>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input label="Base Pre-Tax Amount (₹)" type="number" min="1" value={baseAmount} onChange={(e) => setBaseAmount(Number(e.target.value))} isRequired/>
          <Select label="GST Tax Rate" value={String(taxRate)} onChange={(e) => setTaxRate(Number(e.target.value))} options={[
            { value: '18', label: '18% GST (Standard Services & Contracts)' },
            { value: '12', label: '12% GST (Maintenance & Testing)' },
            { value: '5', label: '5% GST (Transport Logistics)' },
            { value: '0', label: '0% (Exempted Supplies)' },
        ]}/>
        </div>

        {/* Totals computation */}
        <div className="bg-amber-50/70 dark:bg-amber-950/30 p-3 rounded-xl border border-amber-200/70 dark:border-amber-800/50 flex items-center justify-between">
          <div className="text-xs text-amber-800 dark:text-amber-300">
            GST Amount ({taxRate}%): <span className="font-mono font-bold">₹{taxAmount.toLocaleString('en-IN')}</span>
          </div>
          <div className="text-sm sm:text-base font-bold text-amber-900 dark:text-amber-100 font-mono">
            Total Payable: ₹{totalAmount.toLocaleString('en-IN')}
          </div>
        </div>

        <Textarea label="Notes & Service Verification Remarks" placeholder="Verified against drilling logs and site geologist inspection report." value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}/>

        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-200 dark:border-[#253344]">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting}>
            Record Vendor Bill
          </Button>
        </div>
      </form>
    </Modal>);
};
