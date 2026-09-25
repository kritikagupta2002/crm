import React, { useState } from 'react';
import { Download, Printer, } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Select } from '@/components/common/Select';
import { Input } from '@/components/common/Input';
import { useToast } from '@/contexts/ToastContext';
const REPORT_CATALOG = [
    // 1. Invoices & Payments
    {
        id: 'rep-ar-aging',
        category: 'Invoices & Payments',
        title: 'Accounts Receivable (AR) Aging Summary',
        description: 'Outstanding client balances broken down into 0-30, 31-60, 61-90, and 90+ days intervals.',
        format: 'Excel',
    },
    {
        id: 'rep-sales-register',
        category: 'Invoices & Payments',
        title: 'Sales & Invoicing Register',
        description: 'Complete itemized log of all client invoices, tax components, and collection records.',
        format: 'PDF',
    },
    {
        id: 'rep-ap-disbursement',
        category: 'Invoices & Payments',
        title: 'Vendor Payables & Disbursement History',
        description: 'Summary of contractor settlements, rig leases, and assay lab payments.',
        format: 'Excel',
    },
    // 2. Accounting Records
    {
        id: 'rep-trial-balance',
        category: 'Accounting Records',
        title: 'Trial Balance Register',
        description: 'Summary of all ledger balances ensuring debit equals credit prior to balance sheet consolidation.',
        format: 'PDF',
    },
    {
        id: 'rep-general-ledger',
        category: 'Accounting Records',
        title: 'General Ledger Audit Trail',
        description: 'Comprehensive chronological journal entries, voucher audit histories, and account classifications.',
        format: 'Excel',
    },
    {
        id: 'rep-bank-reconciliation',
        category: 'Accounting Records',
        title: 'Bank Book & Cash Reconciliation',
        description: 'Comparison of corporate bank statement lines against internal transaction vouchers.',
        format: 'PDF',
    },
    // 3. TDS / GST Reports
    {
        id: 'rep-tds-26q',
        category: 'TDS / GST Reports',
        title: 'Form 26Q TDS Quarterly Annexure',
        description: 'Quarterly statement of tax deducted under sections 194C, 194J, and 194I ready for TIN-FC submission.',
        format: 'PDF',
    },
    {
        id: 'rep-gstr-1',
        category: 'TDS / GST Reports',
        title: 'GSTR-1 Outward Supplies Summary Sheet',
        description: 'B2B invoice level taxable values, CGST, SGST, IGST totals formatted for GST portal upload.',
        format: 'Excel',
    },
    {
        id: 'rep-itc-reconcile',
        category: 'TDS / GST Reports',
        title: 'GSTR-2B vs Vendor Bills (ITC Matching)',
        description: 'Automated matching of eligible Input Tax Credit against uploaded supplier invoices.',
        format: 'Excel',
    },
    // 4. Financial Reports & Costing
    {
        id: 'rep-pnl',
        category: 'Financial Reports',
        title: 'Profit & Loss Statement (P&L)',
        description: 'Revenues from exploration contracts, drilling costs, operating overheads, and net EBITDA margin.',
        format: 'PDF',
    },
    {
        id: 'rep-project-cost',
        category: 'Financial Reports',
        title: 'Exploration Project Cost & Variance Report',
        description: 'Budget vs actual expenditures for Bhilwara Zinc, Khetri Copper, and other project blocks.',
        format: 'Excel',
    },
    {
        id: 'rep-balance-sheet',
        category: 'Financial Reports',
        title: 'Consolidated Balance Sheet',
        description: 'Capital structure, fixed geological surveying assets, current receivables, and bank reserves.',
        format: 'PDF',
    },
];
export const FinancialReportsPage = () => {
    const toast = useToast();
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [selectedReportId, setSelectedReportId] = useState('rep-pnl');
    const [startDate, setStartDate] = useState('2026-04-01');
    const [endDate, setEndDate] = useState('2026-09-30');
    const [exportFormat, setExportFormat] = useState('PDF');
    const [generatedPreview, setGeneratedPreview] = useState(true);
    const filteredReports = selectedCategory === 'All'
        ? REPORT_CATALOG
        : REPORT_CATALOG.filter((r) => r.category === selectedCategory);
    const activeReport = REPORT_CATALOG.find((r) => r.id === selectedReportId) || REPORT_CATALOG[0];
    const handleGenerate = () => {
        setGeneratedPreview(true);
        toast.success(`Generated ${activeReport.title} for ${startDate} to ${endDate}`, 'Report Compiled');
    };
    const handleDownload = () => {
        toast.success(`Exporting ${activeReport.title} in ${exportFormat} format...`, 'File Downloading');
    };
    return (<div className="space-y-6 font-inter">
      <PageHeader title="Financial Reports" description="Generate, audit, and export consolidated financial statements, statutory tax schedules, and project cost analyses." breadcrumbs={[
            { label: 'Dashboard', path: '/hr' },
            { label: 'Finance & Accounting', path: '/finance' },
            { label: 'Financial Reports' },
        ]}/>

      {/* Filter & Generation Bar */}
      <Card className="p-4 sm:p-5 border border-[var(--line,#e1e8eb)] dark:border-[#1e2c37]">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 flex-1">
            <Select label="Report Category" value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} options={[
            { value: 'All', label: 'All Output Categories' },
            { value: 'Invoices & Payments', label: '1. Invoices & Payments' },
            { value: 'Accounting Records', label: '2. Accounting Records' },
            { value: 'TDS / GST Reports', label: '3. TDS / GST Reports' },
            { value: 'Financial Reports', label: '4. Financial Statements' },
        ]}/>
            <Input label="Period From" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}/>
            <Input label="Period To" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}/>
            <Select label="Export Format" value={exportFormat} onChange={(e) => setExportFormat(e.target.value)} options={[
            { value: 'PDF', label: 'Adobe PDF Document (.pdf)' },
            { value: 'Excel', label: 'Microsoft Excel (.xlsx)' },
            { value: 'CSV', label: 'Comma-Separated Values (.csv)' },
        ]}/>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button variant="primary" size="md" onClick={handleGenerate}>
              Generate Report
            </Button>
            <Button variant="secondary" size="md" leftIcon={<Download className="w-4 h-4"/>} onClick={handleDownload}>
              Export
            </Button>
          </div>
        </div>
      </Card>

      {/* Catalog & Preview Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Report Selection Catalog */}
        <div className="lg:col-span-5 space-y-3">
          <h3 className="text-sm font-bold text-[var(--ink,#0f2a3d)] dark:text-slate-100 font-fraunces">
            Available Reports in Output Framework
          </h3>
          <div className="space-y-2 max-h-[640px] overflow-y-auto pr-1">
            {filteredReports.map((rep) => {
            const isSelected = rep.id === selectedReportId;
            return (<div key={rep.id} onClick={() => setSelectedReportId(rep.id)} className={`p-3.5 rounded-xl border transition-all cursor-pointer ${isSelected
                    ? 'bg-teal-50/80 dark:bg-teal-950/40 border-teal-600 dark:border-teal-500 shadow-2xs'
                    : 'bg-white dark:bg-[#142028] border-[var(--line,#e1e8eb)] dark:border-[#1e2c37] hover:border-slate-300 dark:hover:border-slate-600'}`}>
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[10px] font-bold font-mono tracking-wider uppercase text-teal-800 dark:text-teal-300">
                      {rep.category}
                    </span>
                    <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      {rep.format}
                    </span>
                  </div>
                  <h4 className="text-xs sm:text-sm font-bold text-[var(--ink,#0f2a3d)] dark:text-slate-100 mt-1">
                    {rep.title}
                  </h4>
                  <p className="text-[11.5px] text-[var(--ink-3,#7c8b96)] dark:text-slate-400 mt-1 line-clamp-2">
                    {rep.description}
                  </p>
                </div>);
        })}
          </div>
        </div>

        {/* Right Column: Dynamic Report Preview Pane */}
        <div className="lg:col-span-7">
          <Card className="p-5 border border-[var(--line,#e1e8eb)] dark:border-[#1e2c37] space-y-4">
            <div className="flex items-center justify-between border-b pb-3 border-[var(--line,#e1e8eb)] dark:border-[#1e2c37]">
              <div>
                <span className="text-[10px] font-mono font-bold tracking-wider text-teal-700 dark:text-teal-400 uppercase">
                  {activeReport.category}
                </span>
                <h3 className="text-base font-bold text-[var(--ink,#0f2a3d)] dark:text-slate-100 font-fraunces">
                  {activeReport.title}
                </h3>
                <p className="text-xs text-[var(--ink-3,#7c8b96)] dark:text-slate-400">
                  Fiscal Reporting Window: {startDate} to {endDate}
                </p>
              </div>
              <Button variant="outline" size="sm" leftIcon={<Printer className="w-3.5 h-3.5"/>} onClick={() => toast.success('Sent to corporate printer.', 'Print Triggered')}>
                Print
              </Button>
            </div>

            {/* Simulated Live Financial Statement Preview */}
            <div className="space-y-4 text-xs font-inter">
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#111821] border border-slate-200/80 dark:border-[#253344] space-y-2">
                <div className="flex justify-between font-semibold text-slate-700 dark:text-slate-200">
                  <span>Gross Exploration & Drilling Revenue</span>
                  <span className="font-mono text-teal-800 dark:text-teal-300">₹48,35,640</span>
                </div>
                <div className="flex justify-between text-slate-500 dark:text-slate-400 pl-3">
                  <span>- Direct Core Drilling Rig Operations</span>
                  <span className="font-mono">₹14,50,000</span>
                </div>
                <div className="flex justify-between text-slate-500 dark:text-slate-400 pl-3">
                  <span>- Geochemical Assay & Petrology Testing</span>
                  <span className="font-mono">₹6,80,000</span>
                </div>
                <div className="flex justify-between text-slate-500 dark:text-slate-400 pl-3">
                  <span>- Field Logistics, Fuel & 4x4 Fleet Mobilization</span>
                  <span className="font-mono">₹4,25,000</span>
                </div>
                <div className="flex justify-between font-bold text-slate-800 dark:text-slate-100 border-t pt-1 border-slate-200 dark:border-[#253344]">
                  <span>Gross Operating Margin (Contribution)</span>
                  <span className="font-mono text-emerald-700 dark:text-emerald-400">₹22,80,640 (47.1%)</span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#111821] border border-slate-200/80 dark:border-[#253344] space-y-2">
                <div className="flex justify-between font-semibold text-slate-700 dark:text-slate-200">
                  <span>Operating Overheads & Administration</span>
                  <span className="font-mono">₹8,45,000</span>
                </div>
                <div className="flex justify-between text-slate-500 dark:text-slate-400 pl-3">
                  <span>- Personnel & Senior Geologist Salaried Costs</span>
                  <span className="font-mono">₹5,20,000</span>
                </div>
                <div className="flex justify-between text-slate-500 dark:text-slate-400 pl-3">
                  <span>- DGPS & Total Station Equipment Depreciation</span>
                  <span className="font-mono">₹1,85,000</span>
                </div>
                <div className="flex justify-between text-slate-500 dark:text-slate-400 pl-3">
                  <span>- Jaipur Corporate HQ Facilities & Software</span>
                  <span className="font-mono">₹1,40,000</span>
                </div>
                <div className="flex justify-between font-bold text-sm text-[var(--ink,#0f2a3d)] dark:text-slate-100 border-t pt-1 border-slate-200 dark:border-[#253344]">
                  <span>Net Operating EBITDA</span>
                  <span className="font-mono text-teal-800 dark:text-teal-200">₹14,35,640 (29.6%)</span>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-teal-50/60 dark:bg-teal-950/30 border border-teal-200/60 dark:border-teal-800/40 text-[11.5px] text-teal-900 dark:text-teal-200 flex items-center justify-between">
                <span>Statutory Auditor Sign-off: Verified against GST portal filings & bank records.</span>
                <span className="font-mono font-semibold">Audit Status: PASS</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>);
};
