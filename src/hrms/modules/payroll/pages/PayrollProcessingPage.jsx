import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Play, CheckCircle2, AlertTriangle } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Select } from '@/components/common/Select';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { payrollService, monthLabelOf, currentMonthKey } from '@/modules/payroll/services/payroll.service';

const inr = (n) => `₹${Math.round(n).toLocaleString('en-IN')}`;

/* This month and the two before it; a month already run is marked so. */
const monthOptions = (runs) => {
    const [y, m] = currentMonthKey().split('-').map(Number);
    return [0, 1, 2].map((back) => {
        const d = new Date(y, m - 1 - back, 1);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const done = runs.some((r) => r.monthKey === key);
        return { value: key, label: `${monthLabelOf(key)}${done ? ' (processed)' : back === 0 ? ' (current)' : ''}` };
    });
};

export const PayrollProcessingPage = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const toast = useToast();
    const [runs, setRuns] = useState([]);
    const [selectedMonth, setSelectedMonth] = useState(currentMonthKey);
    const [preview, setPreview] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [completed, setCompleted] = useState(null);

    useEffect(() => {
        payrollService.getPayrollRuns().then(setRuns);
    }, [completed]);
    useEffect(() => {
        let live = true;
        payrollService.previewPayroll(selectedMonth).then((p) => live && setPreview(p));
        return () => {
            live = false;
        };
    }, [selectedMonth, completed]);

    const options = useMemo(() => monthOptions(runs), [runs]);
    const alreadyRun = runs.some((r) => r.monthKey === selectedMonth);
    const label = monthLabelOf(selectedMonth);

    const handleExecuteRun = async () => {
        setIsProcessing(true);
        try {
            const run = await payrollService.processPayroll(selectedMonth, user?.name ?? '');
            setCompleted(run);
            toast.success(`Payslips for ${run.totalEmployees} employees are ready for ${run.month}.`, 'Payroll Processed');
        }
        catch (err) {
            toast.error(err.message, 'Payroll not processed');
        }
        finally {
            setIsProcessing(false);
        }
    };

    return (<div className="space-y-6 pb-12">
      <PageHeader title="Process Payroll" description="Salaries for the month from each salary structure, with loss of pay for days marked absent." breadcrumbs={[
            { label: 'Dashboard', path: '/hr' },
            { label: 'Payroll', path: '/hr/payroll' },
            { label: 'Process Payroll' },
        ]} actions={<Button variant="outline" size="sm" onClick={() => navigate('/hr/payroll')} leftIcon={<ArrowLeft className="w-4 h-4"/>}>
            Back
          </Button>}/>

      {completed ? (<Card className="p-8 text-center max-w-xl mx-auto space-y-4">
          <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-10 h-10"/>
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">{completed.month} payroll processed</h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-md mx-auto">
            {completed.totalEmployees} payslips, net {inr(completed.totalNetDisbursed)}. Mark the run paid in Payroll History once the bank transfer is done.
            {completed.skipped?.length ? ` ${completed.skipped.length} employee${completed.skipped.length === 1 ? ' was' : 's were'} left out because the salary structure is not set.` : ''}
          </p>
          <div className="pt-4 flex items-center justify-center gap-3 flex-wrap">
            <Button variant="outline" size="sm" onClick={() => setCompleted(null)}>
              Process Another Month
            </Button>
            <Button variant="primary" size="sm" onClick={() => navigate('/hr/payroll/payslips')}>
              View Payslips
            </Button>
          </div>
        </Card>) : (<div className="space-y-6">
          <Card className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200 whitespace-nowrap">Month:</span>
              <div className="w-full sm:w-64">
                <Select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} options={options}/>
              </div>
            </div>
            {alreadyRun && (<span className="text-xs font-semibold text-amber-700 dark:text-amber-300">{label} is already processed. See Payroll History.</span>)}
          </Card>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
                { title: 'Employees', value: preview ? `${preview.rows.length}` : '-', tone: '' },
                { title: 'Total Gross', value: preview ? inr(preview.totalGross) : '-', tone: '' },
                { title: 'Deductions', value: preview ? `-${inr(preview.totalDeductions)}` : '-', tone: 'rose' },
                { title: 'Net Pay', value: preview ? inr(preview.totalNet) : '-', tone: 'emerald' },
            ].map((c) => (<div key={c.title} className={`p-4 rounded-xl border shadow-xs ${c.tone === 'emerald' ? 'bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/50' : 'bg-white dark:bg-[#1A2430] border-slate-200 dark:border-[#253344]'}`}>
                <span className={`text-xs font-semibold uppercase ${c.tone === 'rose' ? 'text-rose-500 dark:text-rose-400' : c.tone === 'emerald' ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-400'}`}>{c.title}</span>
                <p className={`text-xl sm:text-2xl font-bold mt-0.5 tabular-nums ${c.tone === 'rose' ? 'text-rose-600 dark:text-rose-400' : c.tone === 'emerald' ? 'text-emerald-800 dark:text-emerald-300' : 'text-slate-900 dark:text-white'}`}>{c.value}</p>
              </div>))}
          </div>

          {preview?.skipped.length > 0 && (<div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-xs text-amber-800 dark:text-amber-200 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5"/>
              <div>
                <strong>Not in this run ({preview.skipped.length}):</strong> {preview.skipped.map((s) => s.name).join(', ')}. Their salary structure is not set; add it in Salary Structures to include them.
              </div>
            </div>)}

          <Card className="overflow-hidden">
            <div className="p-4 border-b border-slate-100 dark:border-[#253344] flex items-center justify-between gap-3 flex-wrap">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Pay for {label}</h3>
              <span className="text-xs text-slate-500">Loss of pay = days marked Absent; approved leave is paid</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-[#121A24] border-b border-slate-200 dark:border-[#253344] text-slate-600 dark:text-slate-300 font-semibold uppercase text-[11px]">
                    <th className="py-2.5 px-3">Emp ID</th>
                    <th className="py-2.5 px-3">Name</th>
                    <th className="py-2.5 px-3">Department</th>
                    <th className="py-2.5 px-3">Paid Days</th>
                    <th className="py-2.5 px-3">LOP Days</th>
                    <th className="py-2.5 px-3">Gross</th>
                    <th className="py-2.5 px-3">Deductions</th>
                    <th className="py-2.5 px-3">Net Pay</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-[#253344]">
                  {(preview?.rows ?? []).map(({ emp, pay }) => (<tr key={emp.employeeId} className="hover:bg-slate-50 dark:hover:bg-[#121A24]">
                      <td className="py-3 px-3 font-mono font-bold text-blue-700 dark:text-blue-300 whitespace-nowrap">{emp.employeeId}</td>
                      <td className="py-3 px-3 font-bold text-slate-900 dark:text-slate-100 whitespace-nowrap">{emp.name}</td>
                      <td className="py-3 px-3 text-slate-600 dark:text-slate-400">{emp.employment?.department}</td>
                      <td className="py-3 px-3 font-mono tabular-nums text-slate-800 dark:text-slate-200">{pay.paidDays} / {pay.workingDays}</td>
                      <td className={`py-3 px-3 font-mono tabular-nums ${pay.lopDays ? 'text-rose-600 dark:text-rose-400 font-bold' : 'text-slate-500'}`}>{pay.lopDays}</td>
                      <td className="py-3 px-3 font-mono tabular-nums text-slate-800 dark:text-slate-200 whitespace-nowrap">{inr(pay.grossEarnings)}</td>
                      <td className="py-3 px-3 font-mono tabular-nums text-rose-600 dark:text-rose-400 whitespace-nowrap">{inr(pay.totalDeductions)}</td>
                      <td className="py-3 px-3 font-mono tabular-nums font-bold text-emerald-700 dark:text-emerald-300 whitespace-nowrap">{inr(pay.netSalary)}</td>
                    </tr>))}
                  {preview && !preview.rows.length && (<tr><td colSpan={8} className="py-6 px-3 text-center text-slate-500">No employee has a salary structure yet.</td></tr>)}
                </tbody>
              </table>
            </div>
          </Card>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-[#253344] flex-wrap">
            <Button variant="outline" onClick={() => navigate('/hr/payroll')}>
              Cancel
            </Button>
            <Button variant="primary" size="lg" onClick={handleExecuteRun} isLoading={isProcessing} disabled={alreadyRun || !preview?.rows.length} leftIcon={<Play className="w-4 h-4"/>}>
              Process {label} Payroll
            </Button>
          </div>
        </div>)}
    </div>);
};
