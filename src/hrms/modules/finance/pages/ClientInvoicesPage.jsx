import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Download, Eye } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { DataTable } from '@/components/common/DataTable';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';
import { CreateInvoiceModal } from '@/modules/finance/components/CreateInvoiceModal';
import { financeService } from '@/modules/finance/services/finance.service';
import { useToast } from '@/contexts/ToastContext';
export const ClientInvoicesPage = () => {
    const toast = useToast();
    const [invoices, setInvoices] = useState([]);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [statusFilter, setStatusFilter] = useState('all');
    const [selectedInvoiceForPreview, setSelectedInvoiceForPreview] = useState(null);
    const loadData = async () => {
        const data = await financeService.getInvoices();
        setInvoices(data);
    };
    useEffect(() => {
        loadData();
    }, []);
    const handleExport = () => {
        const csvContent = 'data:text/csv;charset=utf-8,' +
            ['Invoice Number,Client,Invoice Date,Due Date,PreTax Amount,Tax,Total Amount,Status']
                .concat(invoices.map((i) => `"${i.invoiceNumber}","${i.clientName}","${i.invoiceDate}","${i.dueDate}",${i.preTaxAmount},${i.taxAmount},${i.totalAmount},"${i.status}"`))
                .join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `Client_Invoices_${new Date().toLocaleDateString('en-CA')}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success('Invoices exported to CSV', 'Export Completed');
    };
    const filteredInvoices = useMemo(() => {
        if (statusFilter === 'all')
            return invoices;
        return invoices.filter((i) => i.status.toLowerCase() === statusFilter.toLowerCase());
    }, [invoices, statusFilter]);
    const columns = [
        {
            key: 'invoiceNumber',
            header: 'Invoice #',
            sortable: true,
            className: 'whitespace-nowrap w-32',
            render: (inv) => (<div className="font-mono text-xs font-semibold text-teal-800 dark:text-teal-300">
          {inv.invoiceNumber}
        </div>),
        },
        {
            key: 'clientName',
            header: 'Client',
            sortable: true,
            className: 'min-w-[180px]',
            render: (inv) => (<div>
          <p className="font-semibold text-xs text-[var(--ink,#0f2a3d)] dark:text-slate-200 leading-snug">
            {inv.clientName}
          </p>
          {inv.clientGstin && (<p className="text-[10px] text-[var(--ink-3,#7c8b96)] dark:text-slate-400 font-mono">
              GSTIN: {inv.clientGstin}
            </p>)}
        </div>),
        },
        {
            key: 'invoiceDate',
            header: 'Invoice Date',
            sortable: true,
            className: 'whitespace-nowrap w-28',
            render: (inv) => (<span className="text-xs text-[var(--ink-2,#4a5b68)] dark:text-slate-300 font-medium">
          {inv.invoiceDate}
        </span>),
        },
        {
            key: 'dueDate',
            header: 'Due Date',
            sortable: true,
            className: 'whitespace-nowrap w-28',
            render: (inv) => (<span className="text-xs text-[var(--ink-2,#4a5b68)] dark:text-slate-300 font-medium">
          {inv.dueDate}
        </span>),
        },
        {
            key: 'preTaxAmount',
            header: 'Amount (₹)',
            sortable: true,
            className: 'whitespace-nowrap w-28',
            render: (inv) => (<span className="text-xs font-medium text-[var(--ink-2,#4a5b68)] dark:text-slate-300 tabular-nums">
          ₹{inv.preTaxAmount.toLocaleString('en-IN')}
        </span>),
        },
        {
            key: 'taxAmount',
            header: 'Tax (GST)',
            sortable: true,
            className: 'whitespace-nowrap w-28',
            render: (inv) => (<span className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
          ₹{inv.taxAmount.toLocaleString('en-IN')} ({inv.taxRate}%)
        </span>),
        },
        {
            key: 'totalAmount',
            header: 'Total',
            sortable: true,
            className: 'whitespace-nowrap w-28',
            render: (inv) => (<span className="text-xs font-bold text-[var(--ink,#0f2a3d)] dark:text-slate-100 tabular-nums">
          ₹{inv.totalAmount.toLocaleString('en-IN')}
        </span>),
        },
        {
            key: 'status',
            header: 'Status',
            sortable: true,
            className: 'whitespace-nowrap w-24 text-center',
            render: (inv) => (<div className="flex justify-center">
          <StatusBadge status={inv.status} size="sm"/>
        </div>),
        },
        {
            key: 'actions',
            header: 'Actions',
            className: 'whitespace-nowrap w-28 text-right',
            render: (inv) => (<div className="flex items-center justify-end gap-1.5">
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={(e) => {
                    e.stopPropagation();
                    setSelectedInvoiceForPreview(inv);
                }} title="View Invoice Preview">
            <Eye className="w-3.5 h-3.5"/>
          </Button>
          {inv.status !== 'Paid' && (<Button variant="outline" size="sm" className="h-7 text-[11px] px-2.5 whitespace-nowrap" onClick={async (e) => {
                        e.stopPropagation();
                        await financeService.updateInvoiceStatus(inv.id, 'Paid');
                        toast.success(`Invoice ${inv.invoiceNumber} marked as Paid.`, 'Status Updated');
                        loadData();
                    }}>
              Mark Paid
            </Button>)}
        </div>),
        },
    ];
    return (<div className="space-y-6 font-inter">
      <PageHeader title="Client Invoice Generation" description="Issue, dispatch, and manage GST-compliant exploration and geological service invoices." breadcrumbs={[
            { label: 'Dashboard', path: '/hr' },
            { label: 'Finance & Accounting', path: '/finance' },
            { label: 'Client Invoices' },
        ]} actions={<div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" leftIcon={<Download className="w-4 h-4"/>} onClick={handleExport}>
              Export CSV
            </Button>
            <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4"/>} onClick={() => setIsCreateOpen(true)}>
              Create Invoice
            </Button>
          </div>}/>

      {/* Filter Component */}
      <div className="flex items-center gap-2 p-1 bg-white dark:bg-[#142028] rounded-xl border border-[var(--line,#e1e8eb)] dark:border-[#1e2c37] overflow-x-auto w-fit">
        {['all', 'Paid', 'Pending', 'Partially Paid', 'Overdue', 'Draft'].map((st) => (<button key={st} onClick={() => setStatusFilter(st)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${statusFilter.toLowerCase() === st.toLowerCase()
                ? 'bg-[var(--teal-700,#1f6f78)] text-white shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}>
            {st === 'all' ? 'All Invoices' : st}
          </button>))}
      </div>

      {/* Data Table */}
      <DataTable columns={columns} data={filteredInvoices} keyField="id" searchable searchPlaceholder="Search invoices by number, client, or date..." searchFields={['invoiceNumber', 'clientName', 'status']} pageSize={10} emptyTitle="No invoices found" emptyDescription="Get started by creating your first client invoice."/>

      {/* Create Modal */}
      <CreateInvoiceModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} onInvoiceCreated={() => loadData()}/>

      {/* Invoice Document Preview Modal */}
      {selectedInvoiceForPreview && (<Modal isOpen={!!selectedInvoiceForPreview} onClose={() => setSelectedInvoiceForPreview(null)} title={`Invoice Preview - ${selectedInvoiceForPreview.invoiceNumber}`} description="Official GST Tax Invoice Preview Document" maxWidth="2xl" footer={<div className="flex items-center justify-between w-full">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                Status: {selectedInvoiceForPreview.status}
              </span>
              <Button variant="primary" size="sm" onClick={() => {
                    toast.success('Invoice document sent to printer.', 'Print Dispatch');
                    setSelectedInvoiceForPreview(null);
                }}>
                Print / Download PDF
              </Button>
            </div>}>
          <div className="space-y-4 text-xs font-inter p-3 border border-slate-200 dark:border-[#253344] rounded-xl bg-white dark:bg-[#161F2E]">
            {/* Header info */}
            <div className="flex justify-between border-b pb-3 border-slate-200 dark:border-[#253344]">
              <div>
                <h3 className="font-bold text-sm text-[var(--ink,#0f2a3d)] dark:text-slate-100 font-fraunces">
                  BANSAL GEO SERVICES PVT LTD
                </h3>
                <p className="text-[11px] text-slate-500">Corporate HQ: C-Scheme, Jaipur, Rajasthan</p>
                <p className="text-[11px] text-slate-500 font-mono">GSTIN: 08AABCB1182K1ZM</p>
              </div>
              <div className="text-right">
                <span className="font-mono font-bold text-teal-800 dark:text-teal-300 text-sm">
                  {selectedInvoiceForPreview.invoiceNumber}
                </span>
                <p className="text-slate-500">Date: {selectedInvoiceForPreview.invoiceDate}</p>
                <p className="text-slate-500">Due: {selectedInvoiceForPreview.dueDate}</p>
              </div>
            </div>

            {/* Bill To */}
            <div>
              <p className="font-bold text-[11px] uppercase tracking-wider text-slate-400 font-mono">Billed To:</p>
              <p className="font-semibold text-sm text-[var(--ink,#0f2a3d)] dark:text-slate-100">
                {selectedInvoiceForPreview.clientName}
              </p>
              {selectedInvoiceForPreview.clientGstin && (<p className="font-mono text-slate-500">GSTIN: {selectedInvoiceForPreview.clientGstin}</p>)}
              {selectedInvoiceForPreview.billingAddress && (<p className="text-slate-500">{selectedInvoiceForPreview.billingAddress}</p>)}
            </div>

            {/* Items Table */}
            <div className="border rounded-lg overflow-hidden border-slate-200 dark:border-[#253344]">
              <table className="w-full text-left">
                <thead className="bg-slate-50 dark:bg-[#111821] text-[11px] font-semibold text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-[#253344]">
                  <tr>
                    <th className="p-2">Description</th>
                    <th className="p-2 text-right">Qty</th>
                    <th className="p-2 text-right">Rate</th>
                    <th className="p-2 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-[#253344]">
                  {selectedInvoiceForPreview.items.map((it, idx) => (<tr key={idx}>
                      <td className="p-2 text-slate-800 dark:text-slate-200">{it.description}</td>
                      <td className="p-2 text-right font-mono">{it.quantity}</td>
                      <td className="p-2 text-right font-mono">₹{it.unitRate.toLocaleString('en-IN')}</td>
                      <td className="p-2 text-right font-mono font-semibold">₹{it.amount.toLocaleString('en-IN')}</td>
                    </tr>))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="flex justify-end pt-2">
              <div className="w-64 space-y-1 text-right">
                <div className="flex justify-between text-slate-500">
                  <span>Subtotal:</span>
                  <span className="font-mono">₹{selectedInvoiceForPreview.preTaxAmount.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>GST ({selectedInvoiceForPreview.taxRate}%):</span>
                  <span className="font-mono">₹{selectedInvoiceForPreview.taxAmount.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between font-bold text-sm text-teal-800 dark:text-teal-200 border-t pt-1 border-slate-200 dark:border-[#253344]">
                  <span>Total Due:</span>
                  <span className="font-mono">₹{selectedInvoiceForPreview.totalAmount.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>
          </div>
        </Modal>)}
    </div>);
};
