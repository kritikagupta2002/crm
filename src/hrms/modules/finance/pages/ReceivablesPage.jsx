import React, { useState, useEffect, useMemo } from 'react';
import { Clock, CheckCircle2, AlertTriangle, ArrowDownRight, Send } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { StatCard } from '@/components/common/StatCard';
import { DataTable } from '@/components/common/DataTable';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';
import { Input } from '@/components/common/Input';
import { Select } from '@/components/common/Select';
import { financeService } from '@/modules/finance/services/finance.service';
import { useToast } from '@/contexts/ToastContext';
export const ReceivablesPage = () => {
    const toast = useToast();
    const [receivables, setReceivables] = useState([]);
    const [agingFilter, setAgingFilter] = useState('all');
    const [selectedReceivable, setSelectedReceivable] = useState(null);
    const [collectionAmount, setCollectionAmount] = useState(0);
    const [collectionMode, setCollectionMode] = useState('NEFT/RTGS');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const loadData = async () => {
        const data = await financeService.getReceivables();
        setReceivables(data);
    };
    useEffect(() => {
        loadData();
    }, []);
    const totalReceivable = useMemo(() => receivables.reduce((sum, r) => sum + r.totalAmount, 0), [receivables]);
    const totalCollected = useMemo(() => receivables.reduce((sum, r) => sum + r.receivedAmount, 0), [receivables]);
    const totalOutstanding = useMemo(() => receivables.reduce((sum, r) => sum + r.outstandingAmount, 0), [receivables]);
    const overdueAmount = useMemo(() => receivables
        .filter((r) => r.status === 'Overdue')
        .reduce((sum, r) => sum + r.outstandingAmount, 0), [receivables]);
    const dueSoonAmount = useMemo(() => receivables
        .filter((r) => r.status === 'Pending' || r.status === 'Partially Paid')
        .reduce((sum, r) => sum + r.outstandingAmount, 0), [receivables]);
    const filteredReceivables = useMemo(() => {
        if (agingFilter === 'all')
            return receivables;
        return receivables.filter((r) => r.agingBucket === agingFilter);
    }, [receivables, agingFilter]);
    const handleRecordCollectionSubmit = async (e) => {
        e.preventDefault();
        if (!selectedReceivable)
            return;
        if (collectionAmount <= 0) {
            toast.error('Please enter a valid received amount.', 'Validation Error');
            return;
        }
        if (collectionAmount > selectedReceivable.outstandingAmount) {
            toast.error('Amount received cannot exceed outstanding balance.', 'Validation Error');
            return;
        }
        setIsSubmitting(true);
        try {
            await financeService.recordReceipt(selectedReceivable.id, Number(collectionAmount), collectionMode);
            toast.success(`₹${collectionAmount.toLocaleString('en-IN')} received for invoice ${selectedReceivable.invoiceNumber}`, 'Payment Recorded');
            setSelectedReceivable(null);
            loadData();
        }
        catch {
            toast.error('Could not record collection.', 'System Error');
        }
        finally {
            setIsSubmitting(false);
        }
    };
    const columns = [
        {
            key: 'invoiceNumber',
            header: 'Invoice',
            sortable: true,
            render: (rec) => (<span className="font-mono text-xs font-semibold text-teal-800 dark:text-teal-300">
          {rec.invoiceNumber}
        </span>),
        },
        {
            key: 'clientName',
            header: 'Client',
            sortable: true,
            render: (rec) => (<div className="font-medium text-xs text-[var(--ink,#0f2a3d)] dark:text-slate-200">
          {rec.clientName}
        </div>),
        },
        {
            key: 'invoiceDate',
            header: 'Invoice Date',
            sortable: true,
            render: (rec) => (<span className="text-xs text-[var(--ink-3,#7c8b96)] dark:text-slate-400">
          {rec.invoiceDate}
        </span>),
        },
        {
            key: 'dueDate',
            header: 'Due Date',
            sortable: true,
            render: (rec) => (<span className="text-xs text-[var(--ink-2,#4a5b68)] dark:text-slate-300">
          {rec.dueDate}
        </span>),
        },
        {
            key: 'totalAmount',
            header: 'Total (₹)',
            sortable: true,
            render: (rec) => (<span className="font-mono text-xs text-slate-600 dark:text-slate-400">
          ₹{rec.totalAmount.toLocaleString('en-IN')}
        </span>),
        },
        {
            key: 'receivedAmount',
            header: 'Received (₹)',
            sortable: true,
            render: (rec) => (<span className="font-mono text-xs text-emerald-600 dark:text-emerald-400 font-medium">
          ₹{rec.receivedAmount.toLocaleString('en-IN')}
        </span>),
        },
        {
            key: 'outstandingAmount',
            header: 'Outstanding (₹)',
            sortable: true,
            render: (rec) => (<span className={`font-mono text-xs font-bold ${rec.outstandingAmount > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-400'}`}>
          ₹{rec.outstandingAmount.toLocaleString('en-IN')}
        </span>),
        },
        {
            key: 'status',
            header: 'Status',
            sortable: true,
            render: (rec) => <StatusBadge status={rec.status} size="sm"/>,
        },
        {
            key: 'actions',
            header: 'Actions',
            render: (rec) => (<div className="flex items-center gap-1.5">
          {rec.outstandingAmount > 0 ? (<>
              <Button variant="primary" size="sm" className="h-7 text-[11px] px-2" onClick={(e) => {
                        e.stopPropagation();
                        setSelectedReceivable(rec);
                        setCollectionAmount(rec.outstandingAmount);
                    }}>
                Record Collection
              </Button>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-slate-500" onClick={(e) => {
                        e.stopPropagation();
                        toast.info(`Payment reminder email dispatched to ${rec.clientName}`, 'Reminder Sent');
                    }} title="Send Payment Reminder">
                <Send className="w-3.5 h-3.5"/>
              </Button>
            </>) : (<span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3"/> Fully Settled
            </span>)}
        </div>),
        },
    ];
    return (<div className="space-y-6 font-inter">
      <PageHeader title="Receivables Management" description="Monitor outstanding customer dues, aging buckets, cash inflow collections, and automated reminder schedules." breadcrumbs={[
            { label: 'Dashboard', path: '/hr' },
            { label: 'Finance & Accounting', path: '/finance' },
            { label: 'Receivables' },
        ]}/>

      {/* 5 Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
        <StatCard title="Total Receivable" value={`₹${(totalReceivable / 100000).toFixed(1)}L`} caption="Gross client billed" icon={<Clock className="w-5 h-5 text-teal-700 dark:text-teal-300"/>} iconBgColor="bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300"/>
        <StatCard title="Collected" value={`₹${(totalCollected / 100000).toFixed(1)}L`} caption="In bank account" change="Deposited" changeType="increase" icon={<CheckCircle2 className="w-5 h-5 text-emerald-700 dark:text-emerald-300"/>} iconBgColor="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300"/>
        <StatCard title="Outstanding" value={`₹${(totalOutstanding / 100000).toFixed(1)}L`} caption="Unpaid balance" change="Pending Inflow" changeType="neutral" icon={<ArrowDownRight className="w-5 h-5 text-amber-700 dark:text-amber-300"/>} iconBgColor="bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300"/>
        <StatCard title="Overdue Dues" value={`₹${(overdueAmount / 100000).toFixed(1)}L`} caption="Past invoice due date" change="Urgent" changeType="decrease" icon={<AlertTriangle className="w-5 h-5 text-rose-700 dark:text-rose-300"/>} iconBgColor="bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300"/>
        <StatCard title="Due Soon" value={`₹${(dueSoonAmount / 100000).toFixed(1)}L`} caption="Within 30 days" icon={<Clock className="w-5 h-5 text-blue-700 dark:text-blue-300"/>} iconBgColor="bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300"/>
      </div>

      {/* Aging Schedule Filter Buttons */}
      <div className="flex items-center gap-2 p-1 bg-white dark:bg-[#142028] rounded-xl border border-[var(--line,#e1e8eb)] dark:border-[#1e2c37] overflow-x-auto w-fit">
        {[
            { key: 'all', label: 'All Aging' },
            { key: '0-30', label: 'Current (0-30 Days)' },
            { key: '31-60', label: '31-60 Days Overdue' },
            { key: '61-90', label: '61-90 Days Overdue' },
            { key: '90+', label: '90+ Days Critical' },
        ].map((bucket) => (<button key={bucket.key} onClick={() => setAgingFilter(bucket.key)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${agingFilter === bucket.key
                ? 'bg-[var(--teal-700,#1f6f78)] text-white shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}>
            {bucket.label}
          </button>))}
      </div>

      {/* Main Table */}
      <DataTable columns={columns} data={filteredReceivables} keyField="id" searchable searchPlaceholder="Search receivables by invoice, client, or status..." searchFields={['invoiceNumber', 'clientName', 'status']} pageSize={10} emptyTitle="No receivables found" emptyDescription="All invoices in this aging bucket are settled."/>

      {/* Record Collection Modal */}
      {selectedReceivable && (<Modal isOpen={!!selectedReceivable} onClose={() => setSelectedReceivable(null)} title={`Record Collection - ${selectedReceivable.invoiceNumber}`} description={`Record customer payment from ${selectedReceivable.clientName}`} maxWidth="md">
          <form onSubmit={handleRecordCollectionSubmit} className="space-y-4 font-inter">
            <div className="bg-slate-50 dark:bg-[#111821] p-3 rounded-xl border border-slate-200 dark:border-[#253344] space-y-1 text-xs">
              <div className="flex justify-between text-slate-500">
                <span>Invoice Total:</span>
                <span className="font-mono">₹{selectedReceivable.totalAmount.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Previously Received:</span>
                <span className="font-mono text-emerald-600">₹{selectedReceivable.receivedAmount.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between font-bold text-rose-600 dark:text-rose-400 border-t pt-1 border-slate-200 dark:border-[#253344]">
                <span>Outstanding Balance:</span>
                <span className="font-mono">₹{selectedReceivable.outstandingAmount.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <Input label="Amount Received (₹)" type="number" min="1" max={selectedReceivable.outstandingAmount} value={collectionAmount} onChange={(e) => setCollectionAmount(Number(e.target.value))} isRequired/>

            <Select label="Receipt Mode" value={collectionMode} onChange={(e) => setCollectionMode(e.target.value)} options={[
                { value: 'NEFT/RTGS', label: 'NEFT / RTGS Bank Transfer' },
                { value: 'UPI', label: 'UPI Instant Transfer' },
                { value: 'Cheque', label: 'Bank Cheque / DD' },
                { value: 'Wire Transfer', label: 'Wire Transfer' },
            ]}/>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-200 dark:border-[#253344]">
              <Button type="button" variant="secondary" onClick={() => setSelectedReceivable(null)} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" isLoading={isSubmitting}>
                Confirm Collection
              </Button>
            </div>
          </form>
        </Modal>)}
    </div>);
};
