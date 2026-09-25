import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Play, CheckCircle2, ShieldCheck } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Select } from '@/components/common/Select';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { payrollService } from '@/modules/payroll/services/payroll.service';
import { storage } from '@/core/storage/storage';
export const PayrollProcessingPage = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const toast = useToast();
    const employees = storage.getEmployees();
    const [selectedMonth, setSelectedMonth] = useState('2026-09');
    const [selectedMonthLabel, setSelectedMonthLabel] = useState('September 2026');
    const [isProcessing, setIsProcessing] = useState(false);
    const [isComplete, setIsComplete] = useState(false);
    const handleMonthChange = (val) => {
        setSelectedMonth(val);
        const months = {
            '2026-09': 'September 2026',
            '2026-10': 'October 2026',
            '2026-08': 'August 2026',
        };
        setSelectedMonthLabel(months[val] || val);
    };
    const handleExecuteRun = async () => {
        setIsProcessing(true);
        try {
            await payrollService.processPayroll(selectedMonth, selectedMonthLabel, user?.name || 'Dr. Amit Kumar Bansal');
            setIsProcessing(false);
            setIsComplete(true);
            toast.success(`Payroll for ${selectedMonthLabel} processed successfully for ${employees.length} personnel.`, 'Disbursal Complete');
        }
        catch {
            setIsProcessing(false);
            toast.error('An error occurred during payroll batch processing.', 'Processing Error');
        }
    };
    return (<div className="space-y-6 pb-12">
      <PageHeader title="Process Payroll" description="Verify biometric attendance, loss of pay (LOP), field allowances, and execute monthly disbursals." breadcrumbs={[
            { label: 'Dashboard', path: '/hr' },
            { label: 'Payroll', path: '/hr/payroll' },
            { label: 'Process Payroll' },
        ]} actions={<Button variant="outline" size="sm" onClick={() => navigate('/hr/payroll')} leftIcon={<ArrowLeft className="w-4 h-4"/>}>
            Cancel
          </Button>}/>

      {isComplete ? (<Card className="p-8 text-center max-w-xl mx-auto space-y-4">
          <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-10 h-10"/>
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            {selectedMonthLabel} Payroll Finalized
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-md mx-auto">
            All salaries, statutory deductions, PF remittances, and payslips have been successfully generated and stored in the employee vault.
          </p>
          <div className="pt-4 flex items-center justify-center gap-3">
            <Button variant="outline" size="sm" onClick={() => setIsComplete(false)}>
              Process Another Month
            </Button>
            <Button variant="primary" size="sm" onClick={() => navigate('/hr/payroll/payslips')}>
              View Generated Payslips
            </Button>
          </div>
        </Card>) : (<div className="space-y-6">
          {/* Month Selector Bar */}
          <Card className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200 whitespace-nowrap">
                Select Disbursal Cycle:
              </span>
              <div className="w-full sm:w-64">
                <Select value={selectedMonth} onChange={(e) => handleMonthChange(e.target.value)} options={[
                { label: 'September 2026 (Current Cycle)', value: '2026-09' },
                { label: 'October 2026 (Upcoming)', value: '2026-10' },
                { label: 'August 2026 (Re-run)', value: '2026-08' },
            ]}/>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0"/>
              <span>Biometric Sync Complete • Tax Tables Verified</span>
            </div>
          </Card>

          {/* Preliminary Batch Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 bg-white dark:bg-[#1A2430] rounded-xl border border-slate-200 dark:border-[#253344] shadow-xs">
              <span className="text-xs text-slate-400 font-semibold uppercase">Personnel</span>
              <p className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">{employees.length} Staff</p>
            </div>
            <div className="p-4 bg-white dark:bg-[#1A2430] rounded-xl border border-slate-200 dark:border-[#253344] shadow-xs">
              <span className="text-xs text-slate-400 font-semibold uppercase">Total Gross</span>
              <p className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">₹12,25,000</p>
            </div>
            <div className="p-4 bg-white dark:bg-[#1A2430] rounded-xl border border-slate-200 dark:border-[#253344] shadow-xs">
              <span className="text-xs text-rose-500 dark:text-rose-400 font-semibold uppercase">Statutory Deductions</span>
              <p className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-0.5">-₹1,74,000</p>
            </div>
            <div className="p-4 bg-emerald-50/60 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-800/50 shadow-xs">
              <span className="text-xs text-emerald-700 dark:text-emerald-400 font-semibold uppercase">Net Disbursal</span>
              <p className="text-2xl font-extrabold text-emerald-800 dark:text-emerald-300 mt-0.5">₹10,51,000</p>
            </div>
          </div>

          {/* Verification Table */}
          <Card className="overflow-hidden">
            <div className="p-4 border-b border-slate-100 dark:border-[#253344] flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Employee Disbursal Roster</h3>
              <span className="text-xs text-slate-500">Working days: 30 | Standard hours: 8.5h/day</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[11px]">
                    <th className="py-2.5 px-3">Emp ID</th>
                    <th className="py-2.5 px-3">Name</th>
                    <th className="py-2.5 px-3">Department</th>
                    <th className="py-2.5 px-3">Present Days</th>
                    <th className="py-2.5 px-3">LOP Days</th>
                    <th className="py-2.5 px-3">Monthly Gross</th>
                    <th className="py-2.5 px-3">Deductions</th>
                    <th className="py-2.5 px-3">Net Disbursed</th>
                    <th className="py-2.5 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {employees.map((emp) => (<tr key={emp.id} className="hover:bg-slate-50">
                      <td className="py-3 px-3 font-mono font-bold text-blue-700">{emp.employeeId}</td>
                      <td className="py-3 px-3 font-bold text-slate-900">{emp.name}</td>
                      <td className="py-3 px-3 text-slate-600">{emp.employment.department}</td>
                      <td className="py-3 px-3 font-mono font-semibold text-slate-800">26 Days</td>
                      <td className="py-3 px-3 font-mono text-slate-500">0</td>
                      <td className="py-3 px-3 font-mono text-slate-800">₹1,50,000</td>
                      <td className="py-3 px-3 font-mono text-rose-600">₹21,400</td>
                      <td className="py-3 px-3 font-mono font-bold text-emerald-700">₹1,28,600</td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700">
                          Ready
                        </span>
                      </td>
                    </tr>))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Action Bar */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <Button variant="outline" onClick={() => navigate('/hr/payroll')}>
              Cancel
            </Button>
            <Button variant="primary" size="lg" onClick={handleExecuteRun} isLoading={isProcessing} leftIcon={<Play className="w-4 h-4"/>}>
              Execute {selectedMonthLabel} Payroll Disbursal
            </Button>
          </div>
        </div>)}
    </div>);
};
