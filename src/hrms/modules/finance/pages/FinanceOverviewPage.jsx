import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Clock, Receipt, ArrowLeftRight, ShieldCheck, PieChart, Plus, } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { StatCard } from '@/components/common/StatCard';
import { Button } from '@/components/common/Button';
import { FinanceWorkflow } from '@/modules/finance/components/FinanceWorkflow';
import { FinanceOutputSection } from '@/modules/finance/components/FinanceOutputSection';
import { CreateInvoiceModal } from '@/modules/finance/components/CreateInvoiceModal';
import { RecordTransactionModal } from '@/modules/finance/components/RecordTransactionModal';
import { financeService } from '@/modules/finance/services/finance.service';
export const FinanceOverviewPage = () => {
    const navigate = useNavigate();
    const [metrics, setMetrics] = useState({
        totalInvoicesAmount: 4835640,
        totalInvoicesCount: 5,
        outstandingReceivables: 2567440,
        overdueReceivablesCount: 2,
        vendorBillsAmount: 2192800,
        vendorBillsCount: 5,
        totalPayments: 1301400,
        totalReceipts: 1951400,
        netCashFlow: 650000,
        netGstPayable: 278640,
        tdsPayable: 32000,
        totalBudget: 23200000,
        totalBudgetSpent: 18235000,
        budgetUtilizationPercent: 79,
    });
    const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
    const [isTxnModalOpen, setIsTxnModalOpen] = useState(false);
    const loadData = async () => {
        const data = await financeService.getOverviewMetrics();
        setMetrics(data);
    };
    useEffect(() => {
        loadData();
    }, []);
    return (<div className="space-y-6">
      <PageHeader title="Finance & Accounting" description="Manage invoices, receivables, vendor bills, payments, accounting, tax and financial reports." breadcrumbs={[
            { label: 'Dashboard', path: '/hr' },
            { label: 'Finance & Accounting' },
        ]} actions={<div className="flex items-center gap-2">
            <Button variant="outline" size="sm" leftIcon={<ArrowLeftRight className="w-4 h-4"/>} onClick={() => setIsTxnModalOpen(true)}>
              Record Payment / Receipt
            </Button>
            <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4"/>} onClick={() => setIsInvoiceModalOpen(true)}>
              Create Invoice
            </Button>
          </div>}/>

      {/* 6 High-Impact Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
        <StatCard title="Total Invoices" value={`₹${(metrics.totalInvoicesAmount / 100000).toFixed(1)}L`} caption={`${metrics.totalInvoicesCount} invoices issued`} change="+12.4%" changeType="increase" icon={<FileText className="w-5 h-5 text-teal-700 dark:text-teal-300"/>} iconBgColor="bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300" onClick={() => navigate('/finance/invoices')}/>

        <StatCard title="Outstanding Receivables" value={`₹${(metrics.outstandingReceivables / 100000).toFixed(1)}L`} caption={`${metrics.overdueReceivablesCount} overdue payments`} change="Urgent Inflow" changeType="decrease" icon={<Clock className="w-5 h-5 text-emerald-700 dark:text-emerald-300"/>} iconBgColor="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300" onClick={() => navigate('/finance/receivables')}/>

        <StatCard title="Vendor Bills (AP)" value={`₹${(metrics.vendorBillsAmount / 100000).toFixed(1)}L`} caption={`${metrics.vendorBillsCount} contractor bills`} change="Payables" changeType="neutral" icon={<Receipt className="w-5 h-5 text-amber-700 dark:text-amber-300"/>} iconBgColor="bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300" onClick={() => navigate('/finance/vendor-bills')}/>

        <StatCard title="Net Cash Position" value={`+₹${(metrics.netCashFlow / 100000).toFixed(1)}L`} caption={`₹${(metrics.totalReceipts / 100000).toFixed(1)}L in / ₹${(metrics.totalPayments / 100000).toFixed(1)}L out`} change="Surplus" changeType="increase" icon={<ArrowLeftRight className="w-5 h-5 text-blue-700 dark:text-blue-300"/>} iconBgColor="bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300" onClick={() => navigate('/finance/payments-receipts')}/>

        <StatCard title="Tax & GST Summary" value={`₹${((metrics.netGstPayable + metrics.tdsPayable) / 100000).toFixed(1)}L`} caption={`TDS: ₹${(metrics.tdsPayable / 1000).toFixed(0)}k | Net GST: ₹${(metrics.netGstPayable / 100000).toFixed(1)}L`} change="Compliant" changeType="increase" icon={<ShieldCheck className="w-5 h-5 text-purple-700 dark:text-purple-300"/>} iconBgColor="bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300" onClick={() => navigate('/finance/gst')}/>

        <StatCard title="Budget Utilization" value={`${metrics.budgetUtilizationPercent}%`} caption={`₹${(metrics.totalBudgetSpent / 10000000).toFixed(2)}Cr of ₹${(metrics.totalBudget / 10000000).toFixed(2)}Cr`} change="On Track" changeType="increase" icon={<PieChart className="w-5 h-5 text-rose-700 dark:text-rose-300"/>} iconBgColor="bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300" onClick={() => navigate('/finance/budget')}/>
      </div>

      {/* Visual Workflow Section (The 9 Stages from Reference) */}
      <FinanceWorkflow />

      {/* Output Section (The 4 Deliverables from Reference) */}
      <FinanceOutputSection />

      {/* Quick Action Modals */}
      <CreateInvoiceModal isOpen={isInvoiceModalOpen} onClose={() => setIsInvoiceModalOpen(false)} onInvoiceCreated={() => loadData()}/>

      <RecordTransactionModal isOpen={isTxnModalOpen} onClose={() => setIsTxnModalOpen(false)} onTransactionRecorded={() => loadData()}/>
    </div>);
};
