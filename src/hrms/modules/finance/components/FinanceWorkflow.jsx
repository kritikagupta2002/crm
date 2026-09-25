import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Clock, Receipt, ArrowLeftRight, BookOpen, Percent, ShieldCheck, BarChart3, PieChart, ArrowRight, } from 'lucide-react';
import { Card } from '@/components/common/Card';
const WORKFLOW_STEPS = [
    {
        step: 1,
        title: 'Client Invoice Generation',
        subtitle: 'Generate GST compliant invoices & billing items',
        badge: 'Billing & Sales',
        badgeTone: 'bg-teal-50 text-teal-800 dark:bg-teal-950/50 dark:text-teal-300 border-teal-200 dark:border-teal-800/60',
        path: '/finance/invoices',
        icon: <FileText className="w-4 h-4 text-teal-700 dark:text-teal-400"/>,
    },
    {
        step: 2,
        title: 'Receivables Management',
        subtitle: 'Aging tracking, outstanding collections & reminders',
        badge: 'Inflow Control',
        badgeTone: 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60',
        path: '/finance/receivables',
        icon: <Clock className="w-4 h-4 text-emerald-600 dark:text-emerald-400"/>,
    },
    {
        step: 3,
        title: 'Vendor Bills',
        subtitle: 'Drilling contractors, assays & equipment invoices',
        badge: 'Payables & AP',
        badgeTone: 'bg-amber-50 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 border-amber-200 dark:border-amber-800/60',
        path: '/finance/vendor-bills',
        icon: <Receipt className="w-4 h-4 text-amber-600 dark:text-amber-400"/>,
    },
    {
        step: 4,
        title: 'Payments & Receipts',
        subtitle: 'Unified bank disbursements & inbound receipts ledger',
        badge: 'Cash Ledger',
        badgeTone: 'bg-blue-50 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300 border-blue-200 dark:border-blue-800/60',
        path: '/finance/payments-receipts',
        icon: <ArrowLeftRight className="w-4 h-4 text-blue-600 dark:text-blue-400"/>,
    },
    {
        step: 5,
        title: 'Accounting Entries',
        subtitle: 'Double-entry general journal vouchers & book audit',
        badge: 'General Ledger',
        badgeTone: 'bg-indigo-50 text-indigo-800 dark:bg-indigo-950/50 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800/60',
        path: '/finance/accounting-entries',
        icon: <BookOpen className="w-4 h-4 text-indigo-600 dark:text-indigo-400"/>,
    },
    {
        step: 6,
        title: 'TDS & Tax Management',
        subtitle: 'Withholding tax (194C, 194J, 194I) & challan deposits',
        badge: 'Direct Tax',
        badgeTone: 'bg-purple-50 text-purple-800 dark:bg-purple-950/50 dark:text-purple-300 border-purple-200 dark:border-purple-800/60',
        path: '/finance/tax',
        icon: <Percent className="w-4 h-4 text-purple-600 dark:text-purple-400"/>,
    },
    {
        step: 7,
        title: 'GST Compliance',
        subtitle: 'GSTR-1, GSTR-3B monthly filing & input tax credit (ITC)',
        badge: 'Indirect Tax',
        badgeTone: 'bg-teal-50 text-teal-800 dark:bg-teal-950/50 dark:text-teal-300 border-teal-200 dark:border-teal-800/60',
        path: '/finance/gst',
        icon: <ShieldCheck className="w-4 h-4 text-teal-600 dark:text-teal-400"/>,
    },
    {
        step: 8,
        title: 'Financial Reports',
        subtitle: 'P&L statements, trial balance & management MIS',
        badge: 'Reporting',
        badgeTone: 'bg-violet-50 text-violet-800 dark:bg-violet-950/50 dark:text-violet-300 border-violet-200 dark:border-violet-800/60',
        path: '/finance/reports',
        icon: <BarChart3 className="w-4 h-4 text-violet-600 dark:text-violet-400"/>,
    },
    {
        step: 9,
        title: 'Budget & Cost Tracking',
        subtitle: 'Exploration CAPEX, department OPEX & variance analysis',
        badge: 'Cost Control',
        badgeTone: 'bg-rose-50 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300 border-rose-200 dark:border-rose-800/60',
        path: '/finance/budget',
        icon: <PieChart className="w-4 h-4 text-rose-600 dark:text-rose-400"/>,
    },
];
export const FinanceWorkflow = () => {
    const navigate = useNavigate();
    return (<div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base sm:text-lg font-semibold text-[var(--ink,#0f2a3d)] dark:text-[#f0f4f7] font-fraunces">
            End-to-End Finance Workflow Pipeline
          </h2>
          <p className="text-xs text-[var(--ink-3,#7c8b96)] dark:text-slate-400 font-inter mt-0.5">
            Follow sequential stages from invoice billing to statutory compliance and budget tracking. Click any stage to navigate.
          </p>
        </div>
      </div>

      {/* Responsive Workflow Grid / Stepper */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {WORKFLOW_STEPS.map((stage, idx) => (<Card key={stage.step} hoverable onClick={() => navigate(stage.path)} className="p-4 flex flex-col justify-between border border-[var(--line,#e1e8eb)] dark:border-[#1e2c37] transition-all hover:shadow-md hover:border-teal-500/50 group cursor-pointer relative overflow-hidden">
            {/* Top Bar: Step Number + Tag */}
            <div className="flex items-center justify-between gap-2 mb-2.5">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 text-[11px] font-bold text-[var(--ink,#0f2a3d)] dark:text-slate-200 flex items-center justify-center font-mono group-hover:bg-teal-700 group-hover:text-white transition-colors">
                  {stage.step}
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${stage.badgeTone}`}>
                  {stage.badge}
                </span>
              </div>
              <div className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-[#111821] flex items-center justify-center border border-slate-200/60 dark:border-[#253344] group-hover:scale-110 transition-transform">
                {stage.icon}
              </div>
            </div>

            {/* Title & Description */}
            <div className="flex-1">
              <h3 className="text-xs sm:text-sm font-bold text-[var(--ink,#0f2a3d)] dark:text-slate-100 group-hover:text-teal-700 dark:group-hover:text-teal-300 transition-colors font-inter flex items-center gap-1.5">
                {stage.title}
              </h3>
              <p className="text-[11.5px] text-[var(--ink-3,#7c8b96)] dark:text-slate-400 font-inter mt-1 line-clamp-2 leading-relaxed">
                {stage.subtitle}
              </p>
            </div>

            {/* Footer / Direction indicator */}
            <div className="mt-3 pt-2.5 border-t border-[var(--line,#e1e8eb)]/80 dark:border-[#1e2c37] flex items-center justify-between text-xs text-[var(--ink-3,#7c8b96)] dark:text-slate-400 group-hover:text-teal-700 dark:group-hover:text-teal-300 font-inter">
              <span className="text-[11px] font-medium">Open Stage Module</span>
              <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform"/>
            </div>
          </Card>))}
      </div>
    </div>);
};
