import React, { useState, useEffect, useMemo } from 'react';
import { Percent, Shield, Download, CheckCircle2, AlertCircle, FileSpreadsheet } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { StatCard } from '@/components/common/StatCard';
import { DataTable } from '@/components/common/DataTable';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Button } from '@/components/common/Button';
import { financeService } from '@/modules/finance/services/finance.service';
import { useToast } from '@/contexts/ToastContext';
export const TdsTaxPage = () => {
    const toast = useToast();
    const [taxRecords, setTaxRecords] = useState([]);
    const [quarterFilter, setQuarterFilter] = useState('all');
    const loadData = async () => {
        const data = await financeService.getTaxRecords();
        setTaxRecords(data);
    };
    useEffect(() => {
        loadData();
    }, []);
    const totalTdsDeducted = useMemo(() => taxRecords.reduce((sum, r) => sum + r.tdsAmount, 0), [taxRecords]);
    const totalDeposited = useMemo(() => taxRecords
        .filter((r) => r.status === 'Deposited')
        .reduce((sum, r) => sum + r.tdsAmount, 0), [taxRecords]);
    const pendingDeposit = useMemo(() => taxRecords
        .filter((r) => r.status === 'Pending Deposit')
        .reduce((sum, r) => sum + r.tdsAmount, 0), [taxRecords]);
    const filteredRecords = useMemo(() => {
        if (quarterFilter === 'all')
            return taxRecords;
        return taxRecords.filter((r) => r.quarter === quarterFilter);
    }, [taxRecords, quarterFilter]);
    const handleExport = () => {
        const csvContent = 'data:text/csv;charset=utf-8,' +
            ['Challan #,Section,Deductee Name,PAN,Gross Amount,TDS Rate,TDS Amount,Quarter,FY,Status']
                .concat(taxRecords.map((r) => `"${r.challanNumber}","${r.section}","${r.deducteeName}","${r.panNumber}",${r.grossAmount},${r.tdsRate},${r.tdsAmount},"${r.quarter}","${r.financialYear}","${r.status}"`))
                .join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `TDS_Tax_Register_${new Date().toLocaleDateString('en-CA')}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success('TDS register exported to CSV', 'Export Completed');
    };
    const columns = [
        {
            key: 'challanNumber',
            header: 'Challan / Entry #',
            sortable: true,
            className: 'whitespace-nowrap w-36',
            render: (r) => (<span className="font-mono text-xs font-semibold text-teal-800 dark:text-teal-300">
          {r.challanNumber}
        </span>),
        },
        {
            key: 'section',
            header: 'TDS Section',
            sortable: true,
            className: 'whitespace-nowrap w-28',
            render: (r) => (<span className="font-mono font-bold text-xs px-2.5 py-0.5 rounded-md bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300 border border-purple-200/60 dark:border-purple-800/40 whitespace-nowrap inline-block">
          Sec {r.section}
        </span>),
        },
        {
            key: 'deducteeName',
            header: 'Deductee Party',
            sortable: true,
            className: 'min-w-[200px]',
            render: (r) => (<div>
          <p className="font-semibold text-xs text-[var(--ink,#0f2a3d)] dark:text-slate-200 leading-snug">
            {r.deducteeName}
          </p>
          <p className="text-[10px] text-[var(--ink-3,#7c8b96)] dark:text-slate-400 font-mono mt-0.5">
            PAN: {r.panNumber}
          </p>
        </div>),
        },
        {
            key: 'grossAmount',
            header: 'Gross (₹)',
            sortable: true,
            className: 'whitespace-nowrap w-28',
            render: (r) => (<span className="text-xs font-medium text-[var(--ink-2,#4a5b68)] dark:text-slate-300 tabular-nums">
          ₹{r.grossAmount.toLocaleString('en-IN')}
        </span>),
        },
        {
            key: 'tdsRate',
            header: 'Rate (%)',
            sortable: true,
            className: 'whitespace-nowrap w-20 text-center',
            render: (r) => (<span className="text-xs text-slate-600 dark:text-slate-400 tabular-nums">
          {r.tdsRate.toFixed(1)}%
        </span>),
        },
        {
            key: 'tdsAmount',
            header: 'TDS Withheld',
            sortable: true,
            className: 'whitespace-nowrap w-28',
            render: (r) => (<span className="text-xs font-bold text-teal-800 dark:text-teal-300 tabular-nums">
          ₹{r.tdsAmount.toLocaleString('en-IN')}
        </span>),
        },
        {
            key: 'quarter',
            header: 'Period',
            sortable: true,
            className: 'whitespace-nowrap w-32',
            render: (r) => (<span className="text-xs text-[var(--ink-3,#7c8b96)] dark:text-slate-400 whitespace-nowrap font-medium">
          {r.quarter} (FY {r.financialYear})
        </span>),
        },
        {
            key: 'status',
            header: 'Deposit Status',
            sortable: true,
            className: 'whitespace-nowrap w-28 text-center',
            render: (r) => (<div className="flex justify-center">
          <StatusBadge status={r.status} size="sm"/>
        </div>),
        },
        {
            key: 'actions',
            header: 'Actions',
            className: 'whitespace-nowrap w-36 text-right',
            render: (r) => (<div className="flex items-center justify-end gap-1.5">
          {r.status === 'Pending Deposit' ? (<Button variant="primary" size="sm" className="h-7 text-[11px] px-2.5 whitespace-nowrap" onClick={async (e) => {
                        e.stopPropagation();
                        await financeService.updateTaxStatus(r.id, 'Deposited');
                        toast.success(`Challan deposit recorded for ${r.challanNumber}`, 'Challan Deposited');
                        loadData();
                    }}>
              Deposit Challan
            </Button>) : (<Button variant="outline" size="sm" className="h-7 text-[11px] px-2.5 whitespace-nowrap" onClick={(e) => {
                        e.stopPropagation();
                        toast.info(`Form 16A TDS Certificate generated for ${r.deducteeName}`, 'Certificate Ready');
                    }}>
              Form 16A
            </Button>)}
        </div>),
        },
    ];
    return (<div className="space-y-6 font-inter">
      <PageHeader title="TDS & Tax Management" description="Monitor Tax Deducted at Source (Sections 194C, 194J, 194I, 192), statutory challan deposits, and Form 26Q compliance." breadcrumbs={[
            { label: 'Dashboard', path: '/hr' },
            { label: 'Finance & Accounting', path: '/finance' },
            { label: 'TDS & Tax' },
        ]} actions={<div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" leftIcon={<Download className="w-4 h-4"/>} onClick={handleExport}>
              Export TDS Register
            </Button>
            <Button variant="primary" size="sm" leftIcon={<FileSpreadsheet className="w-4 h-4"/>} onClick={() => toast.success('Form 26Q Quarterly Schedule generated for Q2 FY 2026-27.', 'Return Prepared')}>
              Generate Form 26Q
            </Button>
          </div>}/>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard title="Total TDS Withheld" value={`₹${(totalTdsDeducted / 1000).toFixed(1)}k`} caption="Gross tax deducted at source" icon={<Percent className="w-5 h-5 text-purple-700 dark:text-purple-300"/>} iconBgColor="bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300"/>

        <StatCard title="TDS Deposited" value={`₹${(totalDeposited / 1000).toFixed(1)}k`} caption="Deposited with IT department" change="Deposited" changeType="increase" icon={<CheckCircle2 className="w-5 h-5 text-emerald-700 dark:text-emerald-300"/>} iconBgColor="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300"/>

        <StatCard title="Tax Payable (Pending Deposit)" value={`₹${(pendingDeposit / 1000).toFixed(1)}k`} caption="Due by 7th of next month" change={pendingDeposit > 0 ? 'Action Needed' : 'All Clear'} changeType={pendingDeposit > 0 ? 'decrease' : 'increase'} icon={<AlertCircle className="w-5 h-5 text-amber-700 dark:text-amber-300"/>} iconBgColor="bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300"/>

        <StatCard title="Tax Records" value={taxRecords.length} caption="Active challan schedules" icon={<Shield className="w-5 h-5 text-blue-700 dark:text-blue-300"/>} iconBgColor="bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300"/>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 p-1 bg-white dark:bg-[#142028] rounded-xl border border-[var(--line,#e1e8eb)] dark:border-[#1e2c37] overflow-x-auto w-fit">
        {['all', 'Q1', 'Q2', 'Q3', 'Q4'].map((q) => (<button key={q} onClick={() => setQuarterFilter(q)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${quarterFilter === q
                ? 'bg-[var(--teal-700,#1f6f78)] text-white shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}>
            {q === 'all' ? 'All Quarters' : `${q} (FY 2026-27)`}
          </button>))}
      </div>

      {/* Data Table */}
      <DataTable columns={columns} data={filteredRecords} keyField="id" searchable searchPlaceholder="Search TDS records by challan #, deductee, PAN, or section..." searchFields={['challanNumber', 'deducteeName', 'panNumber', 'section']} pageSize={10} emptyTitle="No TDS records found" emptyDescription="Tax records will appear here as deductions are booked against vendor payments."/>
    </div>);
};
