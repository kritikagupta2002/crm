import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BadgeIndianRupee, Users, CheckCircle2, Clock, ArrowRight, FileSpreadsheet, FileText, SlidersHorizontal, } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { Card } from '@/components/common/Card';
import { StatCard } from '@/components/common/StatCard';
import { Button } from '@/components/common/Button';
import { payrollService } from '@/modules/payroll/services/payroll.service';
import { storage } from '@/core/storage/storage';
export const PayrollDashboardPage = () => {
    const navigate = useNavigate();
    const [runs, setRuns] = useState([]);
    const [payslips, setPayslips] = useState([]);
    const [structures, setStructures] = useState([]);
    const [employees, setEmployees] = useState([]);
    useEffect(() => {
        const load = async () => {
            const r = await payrollService.getPayrollRuns();
            const p = await payrollService.getPayslips();
            const s = await payrollService.getSalaryStructures();
            const emps = storage.getEmployees();
            setRuns(r);
            setPayslips(p);
            setStructures(s);
            setEmployees(emps);
        };
        load();
    }, []);
    const totalGross = structures.reduce((sum, s) => sum + (Number(s.monthlyGross) || (s.basic + s.hra + s.specialAllowance) || 0), 0);
    const totalNet = structures.reduce((sum, s) => sum + (Number(s.monthlyNet) || Number(s.netPay) || Math.round(totalGross * 0.88)), 0);
    const totalDeductions = Math.max(0, totalGross - totalNet);
    const totalStaff = employees.length;
    return (<div className="space-y-3">
      <PageHeader title="Payroll & Compensation" description="Statutory payroll computation, TDS, PF remittances, and branded salary disbursals in INR (₹)." breadcrumbs={[
            { label: 'Dashboard', path: '/hr' },
            { label: 'Payroll' },
        ]} actions={<div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate('/hr/payroll/salary-structure')} leftIcon={<SlidersHorizontal className="w-4 h-4 text-slate-600"/>}>
              Salary Structures
            </Button>
            <Button variant="primary" size="sm" onClick={() => navigate('/hr/payroll/process')} leftIcon={<FileSpreadsheet className="w-4 h-4"/>}>
              Run Monthly Payroll
            </Button>
          </div>}/>

      {/* KPI Cards (INR) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
        <StatCard compact={true} title="Total Monthly Payroll" value={`₹${totalGross.toLocaleString('en-IN')}`} icon={<BadgeIndianRupee className="w-4 h-4"/>} iconBgColor="bg-blue-50 dark:bg-blue-950/50 text-blue-600 border border-blue-100 dark:border-blue-800/60" change="+4.2%" changeType="increase" caption="Gross compensation"/>
        <StatCard compact={true} title="Net Disbursed" value={`₹${totalNet.toLocaleString('en-IN')}`} icon={<CheckCircle2 className="w-4 h-4"/>} iconBgColor="bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 border border-emerald-100 dark:border-emerald-800/60" caption="August 2026 Disbursed"/>
        <StatCard compact={true} title="Total Statutory Deductions" value={`₹${totalDeductions.toLocaleString('en-IN')}`} icon={<Clock className="w-4 h-4"/>} iconBgColor="bg-purple-50 dark:bg-purple-950/50 text-purple-600 border border-purple-100 dark:border-purple-800/60" caption="PF, ESI, TDS & PT"/>
        <StatCard compact={true} title="Employees On Payroll" value={String(totalStaff)} icon={<Users className="w-4 h-4"/>} iconBgColor="bg-amber-50 dark:bg-amber-950/50 text-amber-600 border border-amber-100 dark:border-amber-800/60" caption="100% compliant"/>
      </div>

      {/* Action Shortcut Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        <button onClick={() => navigate('/hr/payroll/process')} className="p-3 sm:p-3.5 bg-white dark:bg-[#1A2430] rounded-xl border border-slate-200 dark:border-[#253344] hover:border-blue-500 dark:hover:border-blue-500/60 hover:shadow-2xs transition-all text-left group flex flex-col justify-between">
          <div>
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
              <FileSpreadsheet className="w-4 h-4"/>
            </div>
            <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">Process Monthly Payroll</h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Calculate attendance deductions, site allowances, and finalize disbursements.
            </p>
          </div>
          <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 mt-2.5 flex items-center gap-1">
            Open Wizard <ArrowRight className="w-3 h-3"/>
          </span>
        </button>

        <button onClick={() => navigate('/hr/payroll/salary-structure')} className="p-3 sm:p-3.5 bg-white dark:bg-[#1A2430] rounded-xl border border-slate-200 dark:border-[#253344] hover:border-blue-500 dark:hover:border-blue-500/60 hover:shadow-2xs transition-all text-left group flex flex-col justify-between">
          <div>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
              <SlidersHorizontal className="w-4 h-4"/>
            </div>
            <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">CTC & Salary Structures</h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Configure Basic (40%), HRA, Field Allowances, PF, ESI, and PT for roles.
            </p>
          </div>
          <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 mt-2.5 flex items-center gap-1">
            Manage Structures <ArrowRight className="w-3 h-3"/>
          </span>
        </button>

        <button onClick={() => navigate('/hr/payroll/payslips')} className="p-3 sm:p-3.5 bg-white dark:bg-[#1A2430] rounded-xl border border-slate-200 dark:border-[#253344] hover:border-blue-500 dark:hover:border-blue-500/60 hover:shadow-2xs transition-all text-left group flex flex-col justify-between">
          <div>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
              <FileText className="w-4 h-4"/>
            </div>
            <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">Employee Payslip Vault</h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Preview, download, and print official Bansal Geo payslips for staff.
            </p>
          </div>
          <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 mt-2.5 flex items-center gap-1">
            View Payslips <ArrowRight className="w-3 h-3"/>
          </span>
        </button>
      </div>

      {/* Recent Payroll Runs Table */}
      <Card className="p-3.5 sm:p-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800 mb-3">
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">Recent Payroll Batches</h3>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">Historical monthly execution logs</p>
          </div>
          <Button variant="outline" size="sm" className="h-6 text-xs px-2" onClick={() => navigate('/hr/payroll/history')}>
            Full History
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/80 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold uppercase text-[10px]">
                <th className="py-1.5 px-2.5">Payroll Month</th>
                <th className="py-1.5 px-2.5">Processed Date</th>
                <th className="py-1.5 px-2.5">Staff Processed</th>
                <th className="py-1.5 px-2.5">Total Gross</th>
                <th className="py-1.5 px-2.5">Total Deductions</th>
                <th className="py-1.5 px-2.5">Net Disbursed</th>
                <th className="py-1.5 px-2.5">Status</th>
                <th className="py-1.5 px-2.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70">
              {runs.map((run) => (<tr key={run.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="py-2 px-2.5 font-bold text-slate-900 dark:text-white">{run.month}</td>
                  <td className="py-2 px-2.5 font-mono text-slate-600 dark:text-slate-400">{run.processedDate}</td>
                  <td className="py-2 px-2.5 font-medium text-slate-800 dark:text-slate-200">{run.totalEmployees} Personnel</td>
                  <td className="py-2 px-2.5 font-bold text-slate-900 dark:text-white">₹{(run.totalGross).toLocaleString('en-IN')}</td>
                  <td className="py-2 px-2.5 font-semibold text-rose-600 dark:text-rose-400">₹{(run.totalDeductions).toLocaleString('en-IN')}</td>
                  <td className="py-2 px-2.5 font-bold text-emerald-700 dark:text-emerald-400">₹{(run.totalNetDisbursed).toLocaleString('en-IN')}</td>
                  <td className="py-2 px-2.5">
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60">
                      {run.status}
                    </span>
                  </td>
                  <td className="py-2 px-2.5 text-right">
                    <Button variant="outline" size="sm" className="h-6 text-[11px] px-2" onClick={() => navigate('/hr/payroll/payslips')}>
                      View Payslips
                    </Button>
                  </td>
                </tr>))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>);
};
