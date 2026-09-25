import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Download, ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { DataTable } from '@/components/common/DataTable';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Button } from '@/components/common/Button';
import { Tabs } from '@/components/common/Tabs';
import { RecordTransactionModal } from '@/modules/finance/components/RecordTransactionModal';
import { financeService } from '@/modules/finance/services/finance.service';
import { useToast } from '@/contexts/ToastContext';
export const PaymentsReceiptsPage = () => {
    const toast = useToast();
    const [transactions, setTransactions] = useState([]);
    const [activeTab, setActiveTab] = useState('all');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const loadData = async () => {
        const data = await financeService.getTransactions();
        setTransactions(data);
    };
    useEffect(() => {
        loadData();
    }, []);
    const totalReceipts = useMemo(() => transactions
        .filter((t) => t.type === 'Receipt')
        .reduce((sum, t) => sum + t.amount, 0), [transactions]);
    const totalPayments = useMemo(() => transactions
        .filter((t) => t.type === 'Payment')
        .reduce((sum, t) => sum + t.amount, 0), [transactions]);
    const netCash = totalReceipts - totalPayments;
    const filteredTransactions = useMemo(() => {
        if (activeTab === 'receipts')
            return transactions.filter((t) => t.type === 'Receipt');
        if (activeTab === 'payments')
            return transactions.filter((t) => t.type === 'Payment');
        return transactions;
    }, [transactions, activeTab]);
    const handleExport = () => {
        const csvContent = 'data:text/csv;charset=utf-8,' +
            ['Date,Transaction Number,Type,Party,Reference,Payment Mode,Bank Account,Amount,Status']
                .concat(transactions.map((t) => `"${t.date}","${t.transactionNumber}","${t.type}","${t.partyName}","${t.referenceDoc}","${t.paymentMode}","${t.bankAccount}",${t.amount},"${t.status}"`))
                .join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `Payments_Receipts_${new Date().toLocaleDateString('en-CA')}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success('Transactions exported to CSV', 'Export Completed');
    };
    const columns = [
        {
            key: 'date',
            header: 'Transaction Date',
            sortable: true,
            className: 'whitespace-nowrap w-32',
            render: (t) => (<span className="text-xs text-[var(--ink-2,#4a5b68)] dark:text-slate-300 font-medium">
          {t.date}
        </span>),
        },
        {
            key: 'transactionNumber',
            header: 'Transaction #',
            sortable: true,
            className: 'whitespace-nowrap w-32',
            render: (t) => (<span className="font-mono text-xs font-semibold text-teal-800 dark:text-teal-300">
          {t.transactionNumber}
        </span>),
        },
        {
            key: 'type',
            header: 'Type',
            sortable: true,
            className: 'whitespace-nowrap w-28',
            render: (t) => (<span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border whitespace-nowrap ${t.type === 'Receipt'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/50'
                    : 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/50'}`}>
          {t.type === 'Receipt' ? <ArrowDownLeft className="w-3 h-3"/> : <ArrowUpRight className="w-3 h-3"/>}
          {t.type}
        </span>),
        },
        {
            key: 'partyName',
            header: 'Party',
            sortable: true,
            className: 'min-w-[180px]',
            render: (t) => (<div>
          <p className="font-semibold text-xs text-[var(--ink,#0f2a3d)] dark:text-slate-200 leading-snug">
            {t.partyName}
          </p>
          <p className="text-[10.5px] text-[var(--ink-3,#7c8b96)] dark:text-slate-400">
            {t.bankAccount}
          </p>
        </div>),
        },
        {
            key: 'referenceDoc',
            header: 'Reference',
            sortable: true,
            className: 'whitespace-nowrap w-32',
            render: (t) => (<span className="font-mono text-xs text-slate-600 dark:text-slate-400 whitespace-nowrap">
          {t.referenceDoc}
        </span>),
        },
        {
            key: 'paymentMode',
            header: 'Payment Mode',
            sortable: true,
            className: 'whitespace-nowrap w-28',
            render: (t) => (<span className="text-xs text-[var(--ink-2,#4a5b68)] dark:text-slate-300 font-medium">
          {t.paymentMode}
        </span>),
        },
        {
            key: 'amount',
            header: 'Amount',
            sortable: true,
            className: 'whitespace-nowrap w-28',
            render: (t) => (<span className={`text-xs font-bold tabular-nums ${t.type === 'Receipt'
                    ? 'text-emerald-700 dark:text-emerald-300'
                    : 'text-slate-700 dark:text-slate-300'}`}>
          {t.type === 'Receipt' ? '+' : '-'}₹{t.amount.toLocaleString('en-IN')}
        </span>),
        },
        {
            key: 'status',
            header: 'Status',
            sortable: true,
            className: 'whitespace-nowrap w-24 text-center',
            render: (t) => (<div className="flex justify-center">
          <StatusBadge status={t.status} size="sm"/>
        </div>),
        },
        {
            key: 'actions',
            header: 'Actions',
            className: 'whitespace-nowrap w-24 text-right',
            render: (t) => (<div className="flex justify-end">
          <Button variant="outline" size="sm" className="h-7 text-[11px] px-2.5 whitespace-nowrap" onClick={(e) => {
                    e.stopPropagation();
                    toast.info(`Transaction voucher ${t.transactionNumber} downloaded.`, 'Receipt Advice');
                }}>
            Voucher
          </Button>
        </div>),
        },
    ];
    return (<div className="space-y-6 font-inter">
      <PageHeader title="Payments & Receipts" description="Unified cash and bank transaction ledger for customer receipts and vendor supplier disbursements." breadcrumbs={[
            { label: 'Dashboard', path: '/hr' },
            { label: 'Finance & Accounting', path: '/finance' },
            { label: 'Payments & Receipts' },
        ]} actions={<div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" leftIcon={<Download className="w-4 h-4"/>} onClick={handleExport}>
              Export CSV
            </Button>
            <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4"/>} onClick={() => setIsModalOpen(true)}>
              Add Transaction
            </Button>
          </div>}/>

      {/* Cash Flow Summary Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-xl border border-emerald-200/80 dark:border-emerald-800/40 bg-emerald-50/50 dark:bg-emerald-950/20">
          <span className="text-xs text-emerald-800 dark:text-emerald-300 font-medium">
            Total Inflow (Receipts)
          </span>
          <div className="text-xl sm:text-2xl font-bold font-fraunces text-emerald-900 dark:text-emerald-100 mt-1">
            +₹{totalReceipts.toLocaleString('en-IN')}
          </div>
        </div>

        <div className="p-4 rounded-xl border border-rose-200/80 dark:border-rose-800/40 bg-rose-50/50 dark:bg-rose-950/20">
          <span className="text-xs text-rose-800 dark:text-rose-300 font-medium">
            Total Outflow (Payments)
          </span>
          <div className="text-xl sm:text-2xl font-bold font-fraunces text-rose-900 dark:text-rose-100 mt-1">
            -₹{totalPayments.toLocaleString('en-IN')}
          </div>
        </div>

        <div className="p-4 rounded-xl border border-teal-200/80 dark:border-teal-800/40 bg-teal-50/50 dark:bg-teal-950/20">
          <span className="text-xs text-teal-800 dark:text-teal-300 font-medium">
            Net Surplus / Cash Position
          </span>
          <div className="text-xl sm:text-2xl font-bold font-fraunces text-teal-900 dark:text-teal-100 mt-1">
            ₹{netCash.toLocaleString('en-IN')}
          </div>
        </div>
      </div>

      {/* Segmented Tabs */}
      <Tabs variant="pills" activeTab={activeTab} onChange={setActiveTab} tabs={[
            { id: 'all', label: 'All Transactions', count: transactions.length },
            {
                id: 'receipts',
                label: 'Receipts (Inflow)',
                count: transactions.filter((t) => t.type === 'Receipt').length,
            },
            {
                id: 'payments',
                label: 'Payments (Outflow)',
                count: transactions.filter((t) => t.type === 'Payment').length,
            },
        ]}/>

      {/* Main Table */}
      <DataTable columns={columns} data={filteredTransactions} keyField="id" searchable searchPlaceholder="Search transactions by party, reference, or voucher #..." searchFields={['partyName', 'transactionNumber', 'referenceDoc', 'paymentMode']} pageSize={10} emptyTitle="No transactions recorded" emptyDescription="Record your first payment or receipt entry."/>

      <RecordTransactionModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onTransactionRecorded={() => loadData()}/>
    </div>);
};
