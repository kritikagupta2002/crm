import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FileCheck2, BookMarked, FileSpreadsheet, TrendingUp, ArrowUpRight, Sparkles, } from 'lucide-react';
import { Card } from '@/components/common/Card';
const OUTPUT_ITEMS = [
    {
        id: 'out-1',
        title: 'Invoices & Payments',
        category: 'Billing & Cash Flow Output',
        description: 'Client tax invoices, receipts ledger, vendor payables audit trail, and real-time bank transaction reconciliations.',
        keyDeliverables: [
            'GST Tax Invoices & Credit Notes',
            'Bank & Cash Receipt Vouchers',
            'Aging Receivables Ledger',
            'Disbursement Audit History',
        ],
        primaryPath: '/finance/invoices',
        secondaryPath: '/finance/payments-receipts',
        secondaryLabel: 'Cash Ledger',
        icon: <FileCheck2 className="w-5 h-5 text-teal-700 dark:text-teal-400"/>,
        accentBg: 'bg-teal-50 dark:bg-teal-950/50 border-teal-200 dark:border-teal-800/60',
    },
    {
        id: 'out-2',
        title: 'Accounting Records',
        category: 'General Ledger Books',
        description: 'Double-entry journal vouchers, chart of accounts debit/credit balancing, trial balance snapshot, and audit history.',
        keyDeliverables: [
            'General Journal Vouchers (JV)',
            'Sales & Purchase Books',
            'Trial Balance Register',
            'Account Reconciliation Notes',
        ],
        primaryPath: '/finance/accounting-entries',
        secondaryPath: '/finance/reports',
        secondaryLabel: 'Trial Balance',
        icon: <BookMarked className="w-5 h-5 text-indigo-700 dark:text-indigo-400"/>,
        accentBg: 'bg-indigo-50 dark:bg-indigo-950/50 border-indigo-200 dark:border-indigo-800/60',
    },
    {
        id: 'out-3',
        title: 'TDS / GST Reports',
        category: 'Statutory Compliance Filings',
        description: 'Direct & indirect tax statements, Form 26Q TDS quarterly schedules, GSTR-1 outward sheets, and GSTR-3B monthly computation.',
        keyDeliverables: [
            'Form 16A & TDS 26Q Summary',
            'GSTR-1 Outward JSON/CSV Sheet',
            'GSTR-3B Tax Liability Statement',
            'Input Tax Credit (ITC) Register',
        ],
        primaryPath: '/finance/tax',
        secondaryPath: '/finance/gst',
        secondaryLabel: 'GST Cockpit',
        icon: <FileSpreadsheet className="w-5 h-5 text-purple-700 dark:text-purple-400"/>,
        accentBg: 'bg-purple-50 dark:bg-purple-950/50 border-purple-200 dark:border-purple-800/60',
    },
    {
        id: 'out-4',
        title: 'Financial Reports',
        category: 'Executive MIS Statements',
        description: 'Exploration project cost center profitability, annual budget variance sheets, balance sheets, and profit & loss analysis.',
        keyDeliverables: [
            'Profit & Loss Statement (P&L)',
            'Exploration Cost Variance Sheet',
            'Corporate Balance Sheet',
            'Cash Flow Position Forecast',
        ],
        primaryPath: '/finance/reports',
        secondaryPath: '/finance/budget',
        secondaryLabel: 'Cost Tracking',
        icon: <TrendingUp className="w-5 h-5 text-amber-700 dark:text-amber-400"/>,
        accentBg: 'bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-800/60',
    },
];
export const FinanceOutputSection = () => {
    const navigate = useNavigate();
    return (<div className="space-y-4 pt-2">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[var(--line,#e1e8eb)] dark:border-[#1e2c37] pb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold font-mono tracking-wider bg-teal-100 text-teal-800 dark:bg-teal-900/60 dark:text-teal-200">
              WORKFLOW DELIVERABLES
            </span>
            <h2 className="text-base sm:text-lg font-bold text-[var(--ink,#0f2a3d)] dark:text-[#f0f4f7] font-fraunces">
              Financial Outputs & Record Packages
            </h2>
          </div>
          <p className="text-xs text-[var(--ink-3,#7c8b96)] dark:text-slate-400 font-inter mt-0.5">
            Key output modules produced from the end-to-end accounting pipeline as defined in the system workflow.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-teal-700 dark:text-teal-400">
          <Sparkles className="w-4 h-4"/>
          <span>Automated Audit Ready</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {OUTPUT_ITEMS.map((item) => (<Card key={item.id} hoverable onClick={() => navigate(item.primaryPath)} className="p-4 sm:p-5 flex flex-col justify-between border border-[var(--line,#e1e8eb)] dark:border-[#1e2c37] group cursor-pointer transition-all hover:shadow-md hover:border-teal-500/60">
            <div>
              {/* Header */}
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${item.accentBg} shrink-0`}>
                  {item.icon}
                </div>
                <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-teal-700 dark:group-hover:text-teal-300 transition-colors"/>
              </div>

              <span className="text-[10.5px] font-bold uppercase tracking-wider text-[var(--ink-3,#7c8b96)] dark:text-slate-400 font-mono">
                {item.category}
              </span>
              <h3 className="text-sm sm:text-base font-bold text-[var(--ink,#0f2a3d)] dark:text-slate-100 font-inter group-hover:text-teal-700 dark:group-hover:text-teal-300 transition-colors mt-0.5">
                {item.title}
              </h3>
              <p className="text-xs text-[var(--ink-3,#7c8b96)] dark:text-slate-400 font-inter mt-1.5 leading-relaxed">
                {item.description}
              </p>

              {/* Bulleted Key Deliverables */}
              <div className="mt-3.5 pt-3 border-t border-[var(--line,#e1e8eb)]/80 dark:border-[#1e2c37]">
                <p className="text-[11px] font-semibold text-[var(--ink-2,#4a5b68)] dark:text-slate-300 mb-1.5 font-inter">
                  Included Outputs:
                </p>
                <ul className="space-y-1">
                  {item.keyDeliverables.map((d, i) => (<li key={i} className="text-[11px] text-[var(--ink-3,#7c8b96)] dark:text-slate-400 font-inter flex items-center gap-1.5 truncate">
                      <span className="w-1.5 h-1.5 rounded-full bg-teal-600 shrink-0"/>
                      <span className="truncate">{d}</span>
                    </li>))}
                </ul>
              </div>
            </div>

            {/* Action Bar */}
            <div className="mt-4 pt-3 border-t border-[var(--line,#e1e8eb)]/80 dark:border-[#1e2c37] flex items-center justify-between text-xs font-inter">
              <span className="font-semibold text-teal-700 dark:text-teal-400 group-hover:underline">
                View Records
              </span>
              {item.secondaryPath && item.secondaryLabel && (<button type="button" onClick={(e) => {
                    e.stopPropagation();
                    navigate(item.secondaryPath);
                }} className="text-[11px] text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 underline font-medium">
                  {item.secondaryLabel}
                </button>)}
            </div>
          </Card>))}
      </div>
    </div>);
};
