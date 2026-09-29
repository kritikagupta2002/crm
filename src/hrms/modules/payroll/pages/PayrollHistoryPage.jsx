import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Download } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { DataTable } from '@/components/common/DataTable';
import { Button } from '@/components/common/Button';
import { StatusBadge } from '@/components/common/StatusBadge';
import { useToast } from '@/contexts/ToastContext';
import { payrollService } from '@/modules/payroll/services/payroll.service';
export const PayrollHistoryPage = () => {
    const navigate = useNavigate();
    const toast = useToast();
    const [runs, setRuns] = useState([]);
    useEffect(() => {
        const load = async () => {
            const data = await payrollService.getPayrollRuns();
            setRuns(data);
        };
        load();
    }, []);

    const handleExportLedger = () => {
        if (!runs.length) {
            toast.info('No payroll run records available to export.', 'Export Notice');
            return;
        }
        const headers = ['Run ID,Payroll Month,Total Employees,Gross Payroll (INR),Net Disbursed (INR),Deductions (INR),Processed Date,Authorized By,Status'];
        const rows = runs.map((r) => 
            `"${r.id}","${r.month}",${r.totalEmployees},${r.totalGross},${r.totalNet},${r.totalDeductions},"${r.processedDate}","${r.processedBy}","${r.status}"`
        );
        const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.href = encodedUri;
        link.download = `Payroll_Run_History_Ledger_${new Date().toLocaleDateString('en-CA')}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success('Payroll history audit ledger exported to CSV.', 'Export Complete');
    };
    const columns = [
        {
            key: 'month',
            header: 'Disbursal Month',
            sortable: true,
            className: 'font-bold text-slate-900 dark:text-white whitespace-nowrap',
        },
        {
            key: 'processedDate',
            header: 'Execution Date',
            sortable: true,
            className: 'font-mono text-xs text-slate-600 dark:text-slate-400 whitespace-nowrap tabular-nums',
        },
        {
            key: 'totalEmployees',
            header: 'Headcount',
            className: 'whitespace-nowrap',
            render: (r) => <span className="font-semibold text-slate-800 dark:text-slate-200 text-xs whitespace-nowrap">{r.totalEmployees} Staff</span>,
        },
        {
            key: 'totalGross',
            header: 'Total Gross (₹)',
            className: 'whitespace-nowrap',
            render: (r) => (<span className="text-xs font-semibold text-slate-800 dark:text-slate-200 tabular-nums whitespace-nowrap">
          ₹{r.totalGross.toLocaleString('en-IN')}
        </span>),
        },
        {
            key: 'totalDeductions',
            header: 'Deductions (₹)',
            className: 'whitespace-nowrap',
            render: (r) => (<span className="text-xs font-semibold text-rose-600 dark:text-rose-400 tabular-nums whitespace-nowrap">
          -₹{r.totalDeductions.toLocaleString('en-IN')}
        </span>),
        },
        {
            key: 'totalNetDisbursed',
            header: 'Net Disbursed (₹)',
            sortable: true,
            className: 'whitespace-nowrap',
            render: (r) => (<span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded tabular-nums whitespace-nowrap">
          ₹{r.totalNetDisbursed.toLocaleString('en-IN')}
        </span>),
        },
        {
            key: 'processedBy',
            header: 'Authorized By',
            className: 'whitespace-nowrap',
            render: (r) => <span className="text-slate-600 dark:text-slate-400 text-xs whitespace-nowrap">{r.processedBy}</span>,
        },
        {
            key: 'status',
            header: 'Status',
            sortable: true,
            className: 'whitespace-nowrap',
            render: (r) => <StatusBadge status={r.status} size="sm"/>,
        },
    ];
    return (<div className="space-y-6">
      <PageHeader title="Payroll Run History" description="Historical archive of all monthly compensation runs, bank batches, and tax filings." breadcrumbs={[
            { label: 'Dashboard', path: '/hr' },
            { label: 'Payroll', path: '/hr/payroll' },
            { label: 'History' },
        ]} actions={<div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate('/hr/payroll')} leftIcon={<ArrowLeft className="w-4 h-4"/>}>
              Payroll Overview
            </Button>
            <Button variant="primary" size="sm" onClick={handleExportLedger} leftIcon={<Download className="w-4 h-4"/>}>
              Export FY Ledger
            </Button>
          </div>}/>

      <DataTable columns={columns} data={runs} keyField="id" searchPlaceholder="Search history..." searchFields={['month', 'processedBy']}/>
    </div>);
};
