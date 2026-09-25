import React, { useState, useEffect, useMemo } from 'react';
import { ShieldCheck, FileSpreadsheet, Download, CheckCircle2, Clock } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { StatCard } from '@/components/common/StatCard';
import { DataTable } from '@/components/common/DataTable';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { financeService } from '@/modules/finance/services/finance.service';
import { useToast } from '@/contexts/ToastContext';
export const GstCompliancePage = () => {
    const toast = useToast();
    const [gstReturns, setGstReturns] = useState([]);
    const [gstTransactions, setGstTransactions] = useState([]);
    const [activeTab, setActiveTab] = useState('returns');
    const loadData = async () => {
        const [returnsData, txnsData] = await Promise.all([
            financeService.getGstReturns(),
            financeService.getGstTransactions(),
        ]);
        setGstReturns(returnsData);
        setGstTransactions(txnsData);
    };
    useEffect(() => {
        loadData();
    }, []);
    const outputGst = useMemo(() => gstTransactions
        .filter((g) => g.supplyType.includes('Outward'))
        .reduce((sum, g) => sum + g.totalGst, 0), [gstTransactions]);
    const inputGst = useMemo(() => gstTransactions
        .filter((g) => g.supplyType.includes('Inward'))
        .reduce((sum, g) => sum + g.totalGst, 0), [gstTransactions]);
    const netGstLiability = Math.max(0, outputGst - inputGst);
    const handleExport = () => {
        const csvContent = 'data:text/csv;charset=utf-8,' +
            ['Document #,Party,GSTIN,Supply Type,Date,Taxable Value,CGST,SGST,IGST,Total GST,ITC Eligibility']
                .concat(gstTransactions.map((g) => `"${g.docNumber}","${g.counterPartyName}","${g.counterPartyGstin}","${g.supplyType}","${g.invoiceDate}",${g.taxableValue},${g.cgst},${g.sgst},${g.igst},${g.totalGst},"${g.itcEligibility}"`))
                .join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `GST_Taxable_Register_${new Date().toLocaleDateString('en-CA')}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success('GST records exported to CSV', 'Export Completed');
    };
    const columns = [
        {
            key: 'docNumber',
            header: 'Doc #',
            sortable: true,
            className: 'whitespace-nowrap w-32',
            render: (g) => (<span className="font-mono text-xs font-semibold text-teal-800 dark:text-teal-300">
          {g.docNumber}
        </span>),
        },
        {
            key: 'counterPartyName',
            header: 'Counterparty',
            sortable: true,
            className: 'min-w-[180px]',
            render: (g) => (<div>
          <p className="font-semibold text-xs text-[var(--ink,#0f2a3d)] dark:text-slate-200 leading-snug">
            {g.counterPartyName}
          </p>
          <p className="font-mono text-[10px] text-[var(--ink-3,#7c8b96)] dark:text-slate-400 mt-0.5">
            GSTIN: {g.counterPartyGstin}
          </p>
        </div>),
        },
        {
            key: 'supplyType',
            header: 'Supply Nature',
            sortable: true,
            className: 'whitespace-nowrap w-32',
            render: (g) => (<span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold whitespace-nowrap inline-block ${g.supplyType.includes('Outward')
                    ? 'bg-teal-50 text-teal-800 dark:bg-teal-950/40 dark:text-teal-300 border border-teal-200 dark:border-teal-800/50'
                    : 'bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800/50'}`}>
          {g.supplyType}
        </span>),
        },
        {
            key: 'taxableValue',
            header: 'Taxable Value',
            sortable: true,
            className: 'whitespace-nowrap w-28',
            render: (g) => (<span className="text-xs font-medium text-[var(--ink-2,#4a5b68)] dark:text-slate-300 tabular-nums">
          ₹{g.taxableValue.toLocaleString('en-IN')}
        </span>),
        },
        {
            key: 'cgst',
            header: 'CGST',
            className: 'whitespace-nowrap w-24 text-right',
            render: (g) => (<span className="text-xs text-slate-500 tabular-nums">
          {g.cgst > 0 ? `₹${g.cgst.toLocaleString('en-IN')}` : '-'}
        </span>),
        },
        {
            key: 'sgst',
            header: 'SGST',
            className: 'whitespace-nowrap w-24 text-right',
            render: (g) => (<span className="text-xs text-slate-500 tabular-nums">
          {g.sgst > 0 ? `₹${g.sgst.toLocaleString('en-IN')}` : '-'}
        </span>),
        },
        {
            key: 'igst',
            header: 'IGST',
            className: 'whitespace-nowrap w-24 text-right',
            render: (g) => (<span className="text-xs text-slate-500 tabular-nums">
          {g.igst > 0 ? `₹${g.igst.toLocaleString('en-IN')}` : '-'}
        </span>),
        },
        {
            key: 'totalGst',
            header: 'Total Tax',
            sortable: true,
            className: 'whitespace-nowrap w-28 text-right',
            render: (g) => (<span className="text-xs font-bold text-[var(--ink,#0f2a3d)] dark:text-slate-100 tabular-nums">
          ₹{g.totalGst.toLocaleString('en-IN')}
        </span>),
        },
        {
            key: 'itcEligibility',
            header: 'ITC Status',
            className: 'whitespace-nowrap w-24 text-center',
            render: (g) => (<span className={`text-[11px] font-semibold whitespace-nowrap ${g.itcEligibility === 'Eligible'
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-slate-400'}`}>
          {g.itcEligibility}
        </span>),
        },
    ];
    return (<div className="space-y-6 font-inter">
      <PageHeader title="GST Compliance" description="Unified GST compliance cockpit for GSTR-1 outward supplies, GSTR-3B monthly liability summary, and Input Tax Credit (ITC) reconciliation." breadcrumbs={[
            { label: 'Dashboard', path: '/hr' },
            { label: 'Finance & Accounting', path: '/finance' },
            { label: 'GST Compliance' },
        ]} actions={<div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" leftIcon={<Download className="w-4 h-4"/>} onClick={handleExport}>
              Export Register
            </Button>
            <Button variant="primary" size="sm" leftIcon={<FileSpreadsheet className="w-4 h-4"/>} onClick={() => toast.success('GSTR-1 JSON export payload prepared for GST Portal upload.', 'GSTR-1 Payload Ready')}>
              Download GSTR-1 JSON
            </Button>
          </div>}/>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard title="Net GST Payable" value={`₹${(netGstLiability / 100000).toFixed(1)}L`} caption="Output GST minus Input Credit" change="Net Liability" changeType="neutral" icon={<ShieldCheck className="w-5 h-5 text-sky-700 dark:text-sky-300"/>} iconBgColor="bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300"/>

        <StatCard title="GST Collected (Output)" value={`₹${(outputGst / 100000).toFixed(1)}L`} caption="Tax collected from client invoices" change="Sales Tax" changeType="increase" icon={<CheckCircle2 className="w-5 h-5 text-emerald-700 dark:text-emerald-300"/>} iconBgColor="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300"/>

        <StatCard title="GST Paid (Input ITC)" value={`₹${(inputGst / 100000).toFixed(1)}L`} caption="Input tax credit on contractor bills" change="ITC Claimable" changeType="increase" icon={<Clock className="w-5 h-5 text-amber-700 dark:text-amber-300"/>} iconBgColor="bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300"/>

        <StatCard title="Taxable Transactions" value={gstTransactions.length} caption="Active B2B supplies logged" icon={<FileSpreadsheet className="w-5 h-5 text-purple-700 dark:text-purple-300"/>} iconBgColor="bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300"/>
      </div>

      {/* Return Filing Calendar / Tracker */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-[var(--ink,#0f2a3d)] dark:text-slate-100 font-fraunces">
          Statutory Return Filing Schedule & Status
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {gstReturns.map((ret, idx) => (<Card key={idx} className="p-3.5 border border-[var(--line,#e1e8eb)] dark:border-[#1e2c37] flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-1 mb-1.5">
                  <span className="font-mono font-bold text-xs px-2 py-0.5 rounded-md bg-sky-50 text-sky-800 dark:bg-sky-950/40 dark:text-sky-300 border border-sky-200 dark:border-sky-800/40">
                    {ret.returnType}
                  </span>
                  <StatusBadge status={ret.status} size="sm"/>
                </div>
                <p className="font-bold text-xs text-[var(--ink,#0f2a3d)] dark:text-slate-200 mt-2">
                  {ret.period}
                </p>
                <p className="text-[11px] text-[var(--ink-3,#7c8b96)] dark:text-slate-400 mt-0.5">
                  Due: {ret.dueDate}
                </p>
                {ret.arnNumber && (<p className="font-mono text-[10px] text-emerald-700 dark:text-emerald-400 mt-1 truncate">
                    ARN: {ret.arnNumber}
                  </p>)}
              </div>
              <div className="mt-3 pt-2 border-t border-[var(--line,#e1e8eb)] dark:border-[#1e2c37] text-right">
                <button type="button" onClick={() => toast.info(`Viewing filing acknowledgement for ${ret.returnType} (${ret.period})`, 'GST Acknowledgement')} className="text-[11px] text-teal-700 dark:text-teal-400 font-semibold hover:underline">
                  View Details →
                </button>
              </div>
            </Card>))}
        </div>
      </div>

      {/* Taxable Transactions Table */}
      <div className="space-y-3 pt-2">
        <h3 className="text-sm font-bold text-[var(--ink,#0f2a3d)] dark:text-slate-100 font-fraunces">
          Taxable Supply Register & ITC Audit Ledger
        </h3>
        <DataTable columns={columns} data={gstTransactions} keyField="id" searchable searchPlaceholder="Search GST transactions by document, party, or GSTIN..." searchFields={['docNumber', 'counterPartyName', 'counterPartyGstin', 'supplyType']} pageSize={10}/>
      </div>
    </div>);
};
