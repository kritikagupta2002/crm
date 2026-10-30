import React, { useState, useEffect } from 'react';
import { downloadCsv } from '../../../../shared/utils/exportCsv';
import { Modal } from '@/components/common/Modal';
import { Input } from '@/components/common/Input';
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
    const [paying, setPaying] = useState(null);
    const [reference, setReference] = useState('');
    const load = async () => setRuns(await payrollService.getPayrollRuns());
    useEffect(() => {
        load();
    }, []);
    const confirmPaid = async () => {
        try {
            await payrollService.markRunPaid(paying.monthKey, reference);
            toast.success(`${paying.month} salaries marked paid.`, 'Payment Recorded');
            setPaying(null);
            setReference('');
            load();
        }
        catch (err) {
            toast.error(err.message, 'Not saved');
        }
    };
    const exportRuns = () => downloadCsv('Payroll_Runs.csv', [
        { label: 'Month', value: (r) => r.month },
        { label: 'Processed on', value: (r) => r.processedDate },
        { label: 'Employees', value: (r) => r.totalEmployees },
        { label: 'Gross (Rs)', value: (r) => r.totalGross },
        { label: 'Deductions (Rs)', value: (r) => r.totalDeductions },
        { label: 'Net (Rs)', value: (r) => r.totalNetDisbursed },
        { label: 'Processed by', value: (r) => r.processedBy },
        { label: 'Status', value: (r) => r.status },
        { label: 'Paid on', value: (r) => r.paidDate || '' },
        { label: 'Bank reference', value: (r) => r.transactionRef || '' },
    ], runs);
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
        {
            key: 'actions',
            header: '',
            className: 'text-right whitespace-nowrap',
            render: (r) => (r.status === 'Processing'
                ? <Button variant="primary" size="sm" onClick={() => setPaying(r)}>Mark paid</Button>
                : <span className="text-[11px] text-slate-400">{r.transactionRef ? `Ref ${r.transactionRef}` : ''}</span>),
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
            <Button variant="primary" size="sm" onClick={exportRuns} disabled={!runs.length} leftIcon={<Download className="w-4 h-4"/>}>
              Export CSV
            </Button>
          </div>}/>

      <DataTable columns={columns} data={runs} keyField="id" searchPlaceholder="Search history..." searchFields={['month', 'processedBy']}/>

      <Modal isOpen={!!paying} onClose={() => setPaying(null)} title={`Mark ${paying?.month ?? ''} salaries paid`} description="Enter the bank reference of the salary transfer." footer={<>
            <Button variant="outline" size="sm" onClick={() => setPaying(null)}>Cancel</Button>
            <Button variant="primary" size="sm" onClick={confirmPaid}>Mark paid</Button>
          </>}>
        <Input label="Bank transfer reference" isRequired value={reference} onChange={(e) => setReference(e.target.value)} placeholder="e.g. NEFT / UTR number"/>
      </Modal>
    </div>);
};
