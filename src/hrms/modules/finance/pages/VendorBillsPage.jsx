import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Download } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { DataTable } from '@/components/common/DataTable';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Button } from '@/components/common/Button';
import { AddVendorBillModal } from '@/modules/finance/components/AddVendorBillModal';
import { financeService } from '@/modules/finance/services/finance.service';
import { useToast } from '@/contexts/ToastContext';
export const VendorBillsPage = () => {
    const toast = useToast();
    const [bills, setBills] = useState([]);
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [statusFilter, setStatusFilter] = useState('all');
    const loadData = async () => {
        const data = await financeService.getVendorBills();
        setBills(data);
    };
    useEffect(() => {
        loadData();
    }, []);
    const handleExport = () => {
        const csvContent = 'data:text/csv;charset=utf-8,' +
            ['Bill Number,Vendor,Category,Bill Date,Due Date,Base Amount,Tax,Total,Status']
                .concat(bills.map((b) => `"${b.billNumber}","${b.vendorName}","${b.category}","${b.billDate}","${b.dueDate}",${b.baseAmount},${b.taxAmount},${b.totalAmount},"${b.status}"`))
                .join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `Vendor_Bills_${new Date().toLocaleDateString('en-CA')}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success('Vendor bills exported to CSV', 'Export Completed');
    };
    const filteredBills = useMemo(() => {
        if (statusFilter === 'all')
            return bills;
        return bills.filter((b) => b.status.toLowerCase() === statusFilter.toLowerCase());
    }, [bills, statusFilter]);
    const columns = [
        {
            key: 'billNumber',
            header: 'Bill Number',
            sortable: true,
            className: 'whitespace-nowrap w-32',
            render: (b) => (<span className="font-mono text-xs font-semibold text-amber-800 dark:text-amber-300">
          {b.billNumber}
        </span>),
        },
        {
            key: 'vendorName',
            header: 'Vendor',
            sortable: true,
            className: 'min-w-[180px]',
            render: (b) => (<div>
          <p className="font-semibold text-xs text-[var(--ink,#0f2a3d)] dark:text-slate-200 leading-snug">
            {b.vendorName}
          </p>
          <p className="text-[10.5px] text-[var(--ink-3,#7c8b96)] dark:text-slate-400">
            {b.category}
          </p>
        </div>),
        },
        {
            key: 'billDate',
            header: 'Bill Date',
            sortable: true,
            className: 'whitespace-nowrap w-28',
            render: (b) => (<span className="text-xs text-[var(--ink-2,#4a5b68)] dark:text-slate-300 font-medium">
          {b.billDate}
        </span>),
        },
        {
            key: 'dueDate',
            header: 'Due Date',
            sortable: true,
            className: 'whitespace-nowrap w-28',
            render: (b) => (<span className="text-xs text-[var(--ink-2,#4a5b68)] dark:text-slate-300 font-medium">
          {b.dueDate}
        </span>),
        },
        {
            key: 'baseAmount',
            header: 'Amount (₹)',
            sortable: true,
            className: 'whitespace-nowrap w-28',
            render: (b) => (<span className="text-xs font-medium text-[var(--ink-2,#4a5b68)] dark:text-slate-300 tabular-nums">
          ₹{b.baseAmount.toLocaleString('en-IN')}
        </span>),
        },
        {
            key: 'taxAmount',
            header: 'Tax',
            sortable: true,
            className: 'whitespace-nowrap w-28',
            render: (b) => (<span className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
          ₹{b.taxAmount.toLocaleString('en-IN')} ({b.taxRate}%)
        </span>),
        },
        {
            key: 'totalAmount',
            header: 'Total',
            sortable: true,
            className: 'whitespace-nowrap w-28',
            render: (b) => (<span className="text-xs font-bold text-[var(--ink,#0f2a3d)] dark:text-slate-100 tabular-nums">
          ₹{b.totalAmount.toLocaleString('en-IN')}
        </span>),
        },
        {
            key: 'status',
            header: 'Status',
            sortable: true,
            className: 'whitespace-nowrap w-28 text-center',
            render: (b) => (<div className="flex justify-center">
          <StatusBadge status={b.status} size="sm"/>
        </div>),
        },
        {
            key: 'actions',
            header: 'Actions',
            className: 'whitespace-nowrap w-28 text-right',
            render: (b) => (<div className="flex items-center justify-end gap-1.5">
          {b.status === 'Pending Approval' && (<Button variant="outline" size="sm" className="h-7 text-[11px] px-2.5 whitespace-nowrap text-emerald-700 border-emerald-300 hover:bg-emerald-50" onClick={async (e) => {
                        e.stopPropagation();
                        await financeService.updateVendorBillStatus(b.id, 'Approved');
                        toast.success(`Bill ${b.billNumber} approved for payment.`, 'Bill Approved');
                        loadData();
                    }}>
              Approve
            </Button>)}
          {b.status === 'Approved' && (<Button variant="primary" size="sm" className="h-7 text-[11px] px-2.5 whitespace-nowrap" onClick={async (e) => {
                        e.stopPropagation();
                        await financeService.updateVendorBillStatus(b.id, 'Paid');
                        toast.success(`Bill ${b.billNumber} marked as Paid.`, 'Disbursement Recorded');
                        loadData();
                    }}>
              Pay Now
            </Button>)}
        </div>),
        },
    ];
    return (<div className="space-y-6 font-inter">
      <PageHeader title="Vendor Bills" description="Record, approve, and track payables to geological equipment suppliers, assay laboratories, and core drilling contractors." breadcrumbs={[
            { label: 'Dashboard', path: '/hr' },
            { label: 'Finance & Accounting', path: '/finance' },
            { label: 'Vendor Bills' },
        ]} actions={<div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" leftIcon={<Download className="w-4 h-4"/>} onClick={handleExport}>
              Export CSV
            </Button>
            <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4"/>} onClick={() => setIsAddOpen(true)}>
              Add Vendor Bill
            </Button>
          </div>}/>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 p-1 bg-white dark:bg-[#142028] rounded-xl border border-[var(--line,#e1e8eb)] dark:border-[#1e2c37] overflow-x-auto w-fit">
        {['all', 'Approved', 'Pending Approval', 'Paid', 'Overdue'].map((st) => (<button key={st} onClick={() => setStatusFilter(st)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${statusFilter.toLowerCase() === st.toLowerCase()
                ? 'bg-[var(--teal-700,#1f6f78)] text-white shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}>
            {st === 'all' ? 'All Bills' : st}
          </button>))}
      </div>

      {/* Main Table */}
      <DataTable columns={columns} data={filteredBills} keyField="id" searchable searchPlaceholder="Search vendor bills by number, contractor name, or category..." searchFields={['billNumber', 'vendorName', 'category', 'status']} pageSize={10} emptyTitle="No vendor bills found" emptyDescription="Record a new vendor bill to begin tracking accounts payable."/>

      <AddVendorBillModal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} onBillAdded={() => loadData()}/>
    </div>);
};
