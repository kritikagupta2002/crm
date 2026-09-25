import React, { useState } from 'react';
import { Plus, Trash2, Calculator } from 'lucide-react';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Select } from '@/components/common/Select';
import { Textarea } from '@/components/common/Textarea';
import { useToast } from '@/contexts/ToastContext';
import { financeService } from '@/modules/finance/services/finance.service';
export const CreateInvoiceModal = ({ isOpen, onClose, onInvoiceCreated, }) => {
    const toast = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    // Client Details
    const [clientName, setClientName] = useState('');
    const [clientGstin, setClientGstin] = useState('');
    const [clientEmail, setClientEmail] = useState('');
    const [billingAddress, setBillingAddress] = useState('');
    // Invoice Details
    const [invoiceNumber, setInvoiceNumber] = useState(() => `INV-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 900) + 100)}`);
    const [invoiceDate, setInvoiceDate] = useState(() => new Date().toLocaleDateString('en-CA'));
    const [dueDate, setDueDate] = useState(() => {
        const d = new Date();
        d.setDate(d.getDate() + 30);
        return d.toLocaleDateString('en-CA');
    });
    const [paymentTerms, setPaymentTerms] = useState('Net 30 Days');
    const [taxRate, setTaxRate] = useState(18);
    const [notes, setNotes] = useState('Payment by RTGS/NEFT to HDFC Jaipur Corporate Account.');
    // Line items
    const [items, setItems] = useState([
        {
            id: 'item-1',
            description: 'Diamond Core Drilling Logging & Core Sampling',
            quantity: 500,
            unitRate: 850,
            amount: 425000,
        },
    ]);
    const handleItemChange = (index, field, val) => {
        setItems((prev) => {
            const next = [...prev];
            const item = { ...next[index], [field]: val };
            if (field === 'quantity' || field === 'unitRate') {
                const qty = field === 'quantity' ? Number(val) : item.quantity;
                const rate = field === 'unitRate' ? Number(val) : item.unitRate;
                item.amount = (qty || 0) * (rate || 0);
            }
            next[index] = item;
            return next;
        });
    };
    const handleAddItem = () => {
        setItems((prev) => [
            ...prev,
            {
                id: `item-${Date.now()}`,
                description: '',
                quantity: 1,
                unitRate: 10000,
                amount: 10000,
            },
        ]);
    };
    const handleRemoveItem = (index) => {
        if (items.length <= 1)
            return;
        setItems((prev) => prev.filter((_, i) => i !== index));
    };
    const preTaxAmount = items.reduce((sum, it) => sum + (it.amount || 0), 0);
    const taxAmount = Math.round((preTaxAmount * taxRate) / 100);
    const totalAmount = preTaxAmount + taxAmount;
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!clientName.trim()) {
            toast.error('Please enter client name.', 'Validation Error');
            return;
        }
        if (!invoiceNumber.trim()) {
            toast.error('Please enter invoice number.', 'Validation Error');
            return;
        }
        if (items.length === 0 || preTaxAmount <= 0) {
            toast.error('Please add at least one valid invoice item.', 'Validation Error');
            return;
        }
        setIsSubmitting(true);
        try {
            const created = await financeService.createInvoice({
                invoiceNumber,
                clientName: clientName.trim(),
                clientGstin: clientGstin.trim() || undefined,
                clientEmail: clientEmail.trim() || undefined,
                billingAddress: billingAddress.trim() || undefined,
                invoiceDate,
                dueDate,
                items,
                preTaxAmount,
                taxRate,
                taxAmount,
                totalAmount,
                status: 'Pending',
                paymentTerms,
                notes,
            });
            toast.success(`Invoice ${created.invoiceNumber} created for ₹${created.totalAmount.toLocaleString('en-IN')}`, 'Invoice Generated');
            onInvoiceCreated(created);
            onClose();
        }
        catch {
            toast.error('Could not create invoice.', 'System Error');
        }
        finally {
            setIsSubmitting(false);
        }
    };
    return (<Modal isOpen={isOpen} onClose={onClose} title="Create Client Invoice" description="Issue a new GST-compliant invoice with line items, tax breakdown, and automatic receivables entry." maxWidth="3xl">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Client Details Section */}
        <div className="bg-slate-50 dark:bg-[#111821]/70 p-3.5 rounded-xl border border-slate-200/80 dark:border-[#253344] space-y-3">
          <span className="text-[11px] font-bold text-[var(--ink-2,#4a5b68)] dark:text-slate-300 uppercase tracking-wider font-mono">
            1. Client & Billing Information
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input label="Client Name" placeholder="e.g. Vedanta Mining Ltd / Tata Steel" value={clientName} onChange={(e) => setClientName(e.target.value)} isRequired/>
            <Input label="Client GSTIN" placeholder="e.g. 08AAACV4921K1ZM" value={clientGstin} onChange={(e) => setClientGstin(e.target.value)}/>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input label="Client Billing Email" type="email" placeholder="accounts@client.com" value={clientEmail} onChange={(e) => setClientEmail(e.target.value)}/>
            <Input label="Billing Address" placeholder="City, State, PIN" value={billingAddress} onChange={(e) => setBillingAddress(e.target.value)}/>
          </div>
        </div>

        {/* Invoice Header Details */}
        <div className="bg-slate-50 dark:bg-[#111821]/70 p-3.5 rounded-xl border border-slate-200/80 dark:border-[#253344] space-y-3">
          <span className="text-[11px] font-bold text-[var(--ink-2,#4a5b68)] dark:text-slate-300 uppercase tracking-wider font-mono">
            2. Invoice Dates & Terms
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input label="Invoice Number" value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} isRequired/>
            <Input label="Invoice Date" type="date" value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} isRequired/>
            <Input label="Due Date" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} isRequired/>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select label="Payment Terms" value={paymentTerms} onChange={(e) => setPaymentTerms(e.target.value)} options={[
            { value: 'Due on Receipt', label: 'Due on Receipt' },
            { value: 'Net 15 Days', label: 'Net 15 Days' },
            { value: 'Net 30 Days', label: 'Net 30 Days' },
            { value: 'Net 45 Days', label: 'Net 45 Days' },
            { value: 'Net 60 Days', label: 'Net 60 Days' },
        ]}/>
            <Select label="GST Tax Rate" value={String(taxRate)} onChange={(e) => setTaxRate(Number(e.target.value))} options={[
            { value: '18', label: '18% GST (Standard Exploration & Survey Rate)' },
            { value: '12', label: '12% GST (Equipment Testing & Labor)' },
            { value: '5', label: '5% GST (Concessional Mining Transport)' },
            { value: '0', label: '0% (Exempted / SEZ Export)' },
        ]}/>
          </div>
        </div>

        {/* Dynamic Line Items Section */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[var(--ink-2,#4a5b68)] dark:text-slate-300 uppercase tracking-wider font-mono">
              3. Invoice Line Items
            </span>
            <Button type="button" variant="outline" size="sm" leftIcon={<Plus className="w-3.5 h-3.5"/>} onClick={handleAddItem}>
              Add Item
            </Button>
          </div>

          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {items.map((item, idx) => (<div key={item.id} className="grid grid-cols-12 gap-2 items-center bg-white dark:bg-[#161F2E] p-2.5 rounded-lg border border-slate-200 dark:border-[#253344]">
                <div className="col-span-5">
                  <Input placeholder="Description (e.g. Borehole Core Logging)" value={item.description} onChange={(e) => handleItemChange(idx, 'description', e.target.value)} className="h-8 text-xs" isRequired/>
                </div>
                <div className="col-span-2">
                  <Input type="number" min="1" placeholder="Qty" value={item.quantity} onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)} className="h-8 text-xs" isRequired/>
                </div>
                <div className="col-span-2">
                  <Input type="number" min="0" placeholder="Rate" value={item.unitRate} onChange={(e) => handleItemChange(idx, 'unitRate', e.target.value)} className="h-8 text-xs" isRequired/>
                </div>
                <div className="col-span-2 text-right font-mono text-xs font-semibold text-[var(--ink,#0f2a3d)] dark:text-slate-200">
                  ₹{item.amount.toLocaleString('en-IN')}
                </div>
                <div className="col-span-1 text-center">
                  <button type="button" onClick={() => handleRemoveItem(idx)} disabled={items.length <= 1} className="text-rose-500 hover:text-rose-700 disabled:opacity-30 cursor-pointer p-1">
                    <Trash2 className="w-3.5 h-3.5"/>
                  </button>
                </div>
              </div>))}
          </div>
        </div>

        {/* Calculation & Totals Summary */}
        <div className="bg-teal-50/70 dark:bg-teal-950/30 p-3 rounded-xl border border-teal-200/80 dark:border-teal-800/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-inter">
          <div className="flex items-center gap-2 text-xs text-teal-800 dark:text-teal-300">
            <Calculator className="w-4 h-4"/>
            <span>Tax calculation: {taxRate}% GST applied automatically</span>
          </div>
          <div className="text-right space-y-0.5">
            <div className="text-xs text-slate-500 dark:text-slate-400">
              Pre-Tax: <span className="font-mono font-semibold">₹{preTaxAmount.toLocaleString('en-IN')}</span> + GST ({taxRate}%): <span className="font-mono font-semibold">₹{taxAmount.toLocaleString('en-IN')}</span>
            </div>
            <div className="text-sm sm:text-base font-bold text-teal-900 dark:text-teal-100 font-mono">
              Total Invoice Amount: ₹{totalAmount.toLocaleString('en-IN')}
            </div>
          </div>
        </div>

        {/* Notes */}
        <Textarea label="Notes & Remittance Instructions" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}/>

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-200 dark:border-[#253344]">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting}>
            Generate Invoice
          </Button>
        </div>
      </form>
    </Modal>);
};
