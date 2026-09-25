import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Download, BookOpen, CheckCircle2, AlertTriangle } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { DataTable } from '@/components/common/DataTable';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Button } from '@/components/common/Button';
import { NewAccountingEntryModal } from '@/modules/finance/components/NewAccountingEntryModal';
import { financeService } from '@/modules/finance/services/finance.service';
import { useToast } from '@/contexts/ToastContext';
export const AccountingEntriesPage = () => {
    const toast = useToast();
    const [entries, setEntries] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [typeFilter, setTypeFilter] = useState('all');
    const loadData = async () => {
        const data = await financeService.getAccountingEntries();
        setEntries(data);
    };
    useEffect(() => {
        loadData();
    }, []);
    const totalDebit = useMemo(() => entries.reduce((sum, e) => sum + e.debitAmount, 0), [entries]);
    const totalCredit = useMemo(() => entries.reduce((sum, e) => sum + e.creditAmount, 0), [entries]);
    const filteredEntries = useMemo(() => {
        if (typeFilter === 'all')
            return entries;
        return entries.filter((e) => e.entryType === typeFilter);
    }, [entries, typeFilter]);
    const handleExport = () => {
        const csvContent = 'data:text/csv;charset=utf-8,' +
            ['Entry Number,Date,Type,Reference,Debit Account,Debit Amount,Credit Account,Credit Amount,Status,Narration']
                .concat(entries.map((e) => `"${e.entryNumber}","${e.date}","${e.entryType}","${e.reference}","${e.debitAccount}",${e.debitAmount},"${e.creditAccount}",${e.creditAmount},"${e.status}","${e.narration}"`))
                .join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `Accounting_Journal_Entries_${new Date().toLocaleDateString('en-CA')}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success('Journal entries exported to CSV', 'Export Completed');
    };
    const columns = [
        {
            key: 'entryNumber',
            header: 'Entry Number',
            sortable: true,
            className: 'whitespace-nowrap w-36',
            render: (e) => (<span className="font-mono text-xs font-semibold text-teal-800 dark:text-teal-300">
          {e.entryNumber}
        </span>),
        },
        {
            key: 'date',
            header: 'Date',
            sortable: true,
            className: 'whitespace-nowrap w-28',
            render: (e) => (<span className="text-xs text-[var(--ink-2,#4a5b68)] dark:text-slate-300 font-medium">
          {e.date}
        </span>),
        },
        {
            key: 'entryType',
            header: 'Entry Type',
            sortable: true,
            className: 'whitespace-nowrap w-36',
            render: (e) => (<span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-[#253344] whitespace-nowrap inline-block">
          {e.entryType}
        </span>),
        },
        {
            key: 'reference',
            header: 'Reference',
            sortable: true,
            className: 'whitespace-nowrap w-36',
            render: (e) => (<span className="font-mono text-xs text-slate-600 dark:text-slate-400 whitespace-nowrap">
          {e.reference}
        </span>),
        },
        {
            key: 'debitAccount',
            header: 'Debit Account (Dr.)',
            className: 'min-w-[220px]',
            render: (e) => (<div>
          <p className="text-xs font-medium text-[var(--ink,#0f2a3d)] dark:text-slate-200 leading-snug">
            {e.debitAccount}
          </p>
          <p className="text-xs font-semibold text-teal-700 dark:text-teal-400 tabular-nums mt-0.5">
            ₹{e.debitAmount.toLocaleString('en-IN')}
          </p>
        </div>),
        },
        {
            key: 'creditAccount',
            header: 'Credit Account (Cr.)',
            className: 'min-w-[220px]',
            render: (e) => (<div>
          <p className="text-xs font-medium text-[var(--ink,#0f2a3d)] dark:text-slate-200 leading-snug">
            {e.creditAccount}
          </p>
          <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 tabular-nums mt-0.5">
            ₹{e.creditAmount.toLocaleString('en-IN')}
          </p>
        </div>),
        },
        {
            key: 'status',
            header: 'Status',
            sortable: true,
            className: 'whitespace-nowrap w-24 text-center',
            render: (e) => (<div className="flex justify-center">
          <StatusBadge status={e.status} size="sm"/>
        </div>),
        },
        {
            key: 'actions',
            header: 'Actions',
            className: 'whitespace-nowrap w-28 text-right',
            render: (e) => (<div className="flex justify-end">
          <Button variant="outline" size="sm" className="h-7 text-[11px] px-2.5 whitespace-nowrap" onClick={(eAction) => {
                    eAction.stopPropagation();
                    toast.info(`Journal Voucher ${e.entryNumber}: "${e.narration}"`, 'Voucher Narration');
                }}>
            View Voucher
          </Button>
        </div>),
        },
    ];
    return (<div className="space-y-6 font-inter">
      <PageHeader title="Accounting Entries" description="General ledger journal vouchers, double-entry audit trails, and balanced financial account postings." breadcrumbs={[
            { label: 'Dashboard', path: '/hr' },
            { label: 'Finance & Accounting', path: '/finance' },
            { label: 'Accounting Entries' },
        ]} actions={<div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" leftIcon={<Download className="w-4 h-4"/>} onClick={handleExport}>
              Export CSV
            </Button>
            <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4"/>} onClick={() => setIsModalOpen(true)}>
              New Accounting Entry
            </Button>
          </div>}/>

      {/* Audit Balance Header Card */}
      <div className="p-4 sm:p-5 rounded-2xl border border-[var(--line,#e1e8eb)] dark:border-[#1e2c37] bg-white dark:bg-[#142028] shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-teal-50 dark:bg-teal-950/50 text-teal-700 dark:text-teal-300 flex items-center justify-center shrink-0 border border-teal-200/60 dark:border-teal-800/50">
            <BookOpen className="w-5 h-5"/>
          </div>
          <div>
            <h3 className="font-bold text-sm sm:text-base text-[var(--ink,#0f2a3d)] dark:text-slate-100 font-fraunces">
              General Ledger Balance Verification
            </h3>
            <p className="text-xs text-[var(--ink-3,#7c8b96)] dark:text-slate-400 mt-0.5">
              All journal postings are balanced according to statutory Indian double-entry accounting standards.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 sm:gap-4 text-xs font-inter shrink-0 bg-slate-50 dark:bg-[#111821] px-4 py-2.5 rounded-xl border border-slate-200/70 dark:border-[#1e2c37]">
          <div>
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block">Total Debits</span>
            <div className="font-semibold text-sm text-[var(--ink,#0f2a3d)] dark:text-slate-100 tabular-nums">
              ₹{totalDebit.toLocaleString('en-IN')}
            </div>
          </div>

          <div className="h-7 w-px bg-slate-200 dark:bg-slate-700"/>

          <div>
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block">Total Credits</span>
            <div className="font-semibold text-sm text-[var(--ink,#0f2a3d)] dark:text-slate-100 tabular-nums">
              ₹{totalCredit.toLocaleString('en-IN')}
            </div>
          </div>

          <div className="h-7 w-px bg-slate-200 dark:bg-slate-700"/>

          <div className="flex items-center">
            {totalDebit === totalCredit ? (<span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 shadow-2xs">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400"/>
                Balanced
              </span>) : (<span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60 shadow-2xs">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400"/>
                Diff: ₹{Math.abs(totalDebit - totalCredit).toLocaleString('en-IN')}
              </span>)}
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 p-1 bg-white dark:bg-[#142028] rounded-xl border border-[var(--line,#e1e8eb)] dark:border-[#1e2c37] overflow-x-auto w-fit">
        {['all', 'Journal Voucher', 'Sales Journal', 'Purchase Journal', 'Bank Voucher'].map((tp) => (<button key={tp} onClick={() => setTypeFilter(tp)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${typeFilter === tp
                ? 'bg-[var(--teal-700,#1f6f78)] text-white shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}>
            {tp === 'all' ? 'All Types' : tp}
          </button>))}
      </div>

      {/* Data Table */}
      <DataTable columns={columns} data={filteredEntries} keyField="id" searchable searchPlaceholder="Search journal entries by voucher #, account, or reference..." searchFields={['entryNumber', 'reference', 'debitAccount', 'creditAccount', 'narration']} pageSize={10} emptyTitle="No accounting entries found" emptyDescription="Create a new journal voucher to record a ledger transaction."/>

      <NewAccountingEntryModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onEntryCreated={() => loadData()}/>
    </div>);
};
