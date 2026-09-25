import React, { useState, useEffect, useMemo } from 'react';
import { PieChart, Plus, Download, ArrowRight, CheckCircle2, AlertTriangle, AlertCircle } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { StatCard } from '@/components/common/StatCard';
import { DataTable } from '@/components/common/DataTable';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { AddBudgetModal } from '@/modules/finance/components/AddBudgetModal';
import { financeService } from '@/modules/finance/services/finance.service';
import { useToast } from '@/contexts/ToastContext';
export const BudgetCostPage = () => {
    const toast = useToast();
    const [budgets, setBudgets] = useState([]);
    const [isAddOpen, setIsAddOpen] = useState(false);
    const loadData = async () => {
        const data = await financeService.getBudgets();
        setBudgets(data);
    };
    useEffect(() => {
        loadData();
    }, []);
    const totalAllocated = useMemo(() => budgets.reduce((sum, b) => sum + b.allocatedAmount, 0), [budgets]);
    const totalSpent = useMemo(() => budgets.reduce((sum, b) => sum + b.actualSpend, 0), [budgets]);
    const totalRemaining = totalAllocated - totalSpent;
    const varianceNet = totalRemaining;
    const utilizationRatio = totalAllocated > 0 ? Math.round((totalSpent / totalAllocated) * 100) : 0;
    const handleExport = () => {
        const csvContent = 'data:text/csv;charset=utf-8,' +
            ['Cost Center / Project,Category,Allocated,Actual Spend,Remaining,Utilization %,Status']
                .concat(budgets.map((b) => `"${b.costCenter}","${b.category}",${b.allocatedAmount},${b.actualSpend},${b.variance},${Math.round((b.actualSpend / b.allocatedAmount) * 100)}%,"${b.status}"`))
                .join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `Budget_Cost_Tracking_${new Date().toLocaleDateString('en-CA')}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success('Budget records exported to CSV', 'Export Completed');
    };
    const columns = [
        {
            key: 'costCenter',
            header: 'Project / Cost Center',
            sortable: true,
            render: (b) => (<div>
          <p className="font-semibold text-xs text-[var(--ink,#0f2a3d)] dark:text-slate-200">
            {b.costCenter}
          </p>
          <p className="text-[10.5px] text-[var(--ink-3,#7c8b96)] dark:text-slate-400">
            {b.category} • {b.projectPeriod}
          </p>
        </div>),
        },
        {
            key: 'allocatedAmount',
            header: 'Allocated Budget',
            sortable: true,
            render: (b) => (<span className="font-mono text-xs font-semibold text-[var(--ink,#0f2a3d)] dark:text-slate-200">
          ₹{b.allocatedAmount.toLocaleString('en-IN')}
        </span>),
        },
        {
            key: 'actualSpend',
            header: 'Actual Spend',
            sortable: true,
            render: (b) => (<span className="font-mono text-xs text-[var(--ink-2,#4a5b68)] dark:text-slate-300">
          ₹{b.actualSpend.toLocaleString('en-IN')}
        </span>),
        },
        {
            key: 'utilization',
            header: 'Utilization (%)',
            render: (b) => {
                const pct = Math.round((b.actualSpend / b.allocatedAmount) * 100);
                return (<div className="w-28 space-y-1">
            <div className="flex justify-between text-[10.5px] font-mono">
              <span className="font-semibold">{pct}%</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
              <div className={`h-full rounded-full ${pct > 100
                        ? 'bg-rose-500'
                        : pct >= 85
                            ? 'bg-amber-500'
                            : 'bg-emerald-500'}`} style={{ width: `${Math.min(100, pct)}%` }}/>
            </div>
          </div>);
            },
        },
        {
            key: 'variance',
            header: 'Remaining / Variance',
            sortable: true,
            render: (b) => (<span className={`font-mono text-xs font-bold ${b.variance >= 0
                    ? 'text-emerald-700 dark:text-emerald-300'
                    : 'text-rose-700 dark:text-rose-300'}`}>
          {b.variance >= 0 ? '+' : ''}₹{b.variance.toLocaleString('en-IN')}
        </span>),
        },
        {
            key: 'status',
            header: 'Status',
            sortable: true,
            render: (b) => <StatusBadge status={b.status} size="sm"/>,
        },
    ];
    return (<div className="space-y-6 font-inter">
      <PageHeader title="Budget & Cost Tracking" description="Monitor capital expenditure, field exploration operational budgets, actual cost absorption, and budget variances." breadcrumbs={[
            { label: 'Dashboard', path: '/hr' },
            { label: 'Finance & Accounting', path: '/finance' },
            { label: 'Budget & Cost Tracking' },
        ]} actions={<div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" leftIcon={<Download className="w-4 h-4"/>} onClick={handleExport}>
              Export CSV
            </Button>
            <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4"/>} onClick={() => setIsAddOpen(true)}>
              Add Budget Allocation
            </Button>
          </div>}/>

      {/* 5 Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
        <StatCard title="Total Budget" value={`₹${(totalAllocated / 100000).toFixed(1)}L`} caption="Approved fiscal budget" icon={<PieChart className="w-5 h-5 text-teal-700 dark:text-teal-300"/>} iconBgColor="bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300"/>

        <StatCard title="Allocated Amount" value={`₹${(totalAllocated / 100000).toFixed(1)}L`} caption="Committed to projects" change="100% Assigned" changeType="increase" icon={<CheckCircle2 className="w-5 h-5 text-blue-700 dark:text-blue-300"/>} iconBgColor="bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300"/>

        <StatCard title="Actual Spent" value={`₹${(totalSpent / 100000).toFixed(1)}L`} caption={`${utilizationRatio}% utilized`} change="Cost Absorbed" changeType="neutral" icon={<AlertCircle className="w-5 h-5 text-amber-700 dark:text-amber-300"/>} iconBgColor="bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300"/>

        <StatCard title="Remaining Balance" value={`₹${(totalRemaining / 100000).toFixed(1)}L`} caption="Available headroom" change="Available" changeType="increase" icon={<CheckCircle2 className="w-5 h-5 text-emerald-700 dark:text-emerald-300"/>} iconBgColor="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300"/>

        <StatCard title="Net Variance" value={`${totalRemaining >= 0 ? '+' : '-'}${Math.abs(100 - utilizationRatio)}%`} caption={totalRemaining >= 0 ? 'Under fiscal budget' : 'Overrun warning'} change={totalRemaining >= 0 ? 'Favorable' : 'Overrun'} changeType={totalRemaining >= 0 ? 'increase' : 'decrease'} icon={<AlertTriangle className="w-5 h-5 text-purple-700 dark:text-purple-300"/>} iconBgColor="bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300"/>
      </div>

      {/* Visual Pipeline Banner Communicating: Budget -> Allocation -> Cost / Expense -> Actual Spend -> Variance */}
      <Card className="p-4 sm:p-5 border border-[var(--line,#e1e8eb)] dark:border-[#1e2c37] overflow-hidden">
        <div className="mb-3">
          <span className="text-[10px] font-bold font-mono tracking-wider uppercase text-teal-700 dark:text-teal-400">
            FINANCIAL FLOW CONTINUUM
          </span>
          <h3 className="text-sm sm:text-base font-bold text-[var(--ink,#0f2a3d)] dark:text-slate-100 font-fraunces">
            Budget Lifecycle & Variance Flow
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 sm:gap-3 items-center">
          {/* Stage 1: Budget */}
          <div className="p-3 rounded-xl bg-teal-50/70 dark:bg-teal-950/40 border border-teal-200/80 dark:border-teal-800/50 text-center">
            <span className="text-[10px] font-bold uppercase text-teal-800 dark:text-teal-300 font-mono">Stage 1</span>
            <h4 className="text-xs font-bold text-teal-950 dark:text-teal-100 mt-0.5">Budget</h4>
            <p className="text-[11px] text-teal-800/80 dark:text-teal-300/80 font-mono mt-1">₹{(totalAllocated / 100000).toFixed(1)}L</p>
          </div>

          {/* Arrow */}
          <div className="hidden sm:flex justify-center text-slate-300 dark:text-slate-600">
            <ArrowRight className="w-5 h-5"/>
          </div>

          {/* Stage 2: Allocation */}
          <div className="p-3 rounded-xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-800/50 text-center">
            <span className="text-[10px] font-bold uppercase text-blue-800 dark:text-blue-300 font-mono">Stage 2</span>
            <h4 className="text-xs font-bold text-blue-950 dark:text-blue-100 mt-0.5">Allocation</h4>
            <p className="text-[11px] text-blue-800/80 dark:text-blue-300/80 font-mono mt-1">{budgets.length} Cost Centers</p>
          </div>

          {/* Arrow */}
          <div className="hidden sm:flex justify-center text-slate-300 dark:text-slate-600">
            <ArrowRight className="w-5 h-5"/>
          </div>

          {/* Stage 3: Actual Spend & Variance */}
          <div className="p-3 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/50 text-center">
            <span className="text-[10px] font-bold uppercase text-emerald-800 dark:text-emerald-300 font-mono">Stage 3 & 4</span>
            <h4 className="text-xs font-bold text-emerald-950 dark:text-emerald-100 mt-0.5">Actual Spend & Variance</h4>
            <p className="text-[11px] text-emerald-800/80 dark:text-emerald-300/80 font-mono mt-1">+₹{(totalRemaining / 100000).toFixed(1)}L Surplus</p>
          </div>
        </div>
      </Card>

      {/* Main Budget Data Table */}
      <DataTable columns={columns} data={budgets} keyField="id" searchable searchPlaceholder="Search budgets by project name or category..." searchFields={['costCenter', 'category', 'status']} pageSize={10} emptyTitle="No budget allocations found" emptyDescription="Add your first exploration project budget allocation."/>

      <AddBudgetModal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} onBudgetAdded={() => loadData()}/>
    </div>);
};
