import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BadgeIndianRupee,
  Users,
  CheckCircle2,
  Clock,
  ArrowRight,
  FileSpreadsheet,
  FileText,
  SlidersHorizontal,
} from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
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
      setRuns(r || []);
      setPayslips(p || []);
      setStructures(s || []);
      setEmployees(emps || []);
    };
    load();
  }, []);

  const activeStructures = structures.filter(
    (s) => s.status !== 'Not set' && Number(s.monthlyGross) > 0
  );
  const totalGross = activeStructures.reduce(
    (sum, s) => sum + Number(s.monthlyGross),
    0
  );
  const totalNet = activeStructures.reduce(
    (sum, s) => sum + (Number(s.monthlyNet) || Number(s.netPay) || 0),
    0
  );
  const totalDeductions = Math.max(0, totalGross - totalNet);
  const totalStaff = employees.length;
  const latestRun = [...runs].sort((a, b) =>
    String(b.monthKey).localeCompare(String(a.monthKey))
  )[0];

  return (
    <div className="space-y-4">
      {/* CRM Page Header with Contour Lines */}
      <PageHeader
        title="Payroll & Compensation"
        description="Statutory payroll computation, TDS, PF remittances, and branded salary disbursals in INR (₹)."
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/hr/payroll/salary-structure')}
              leftIcon={<SlidersHorizontal className="w-4 h-4 text-slate-600" />}
            >
              Salary Structures
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate('/hr/payroll/process')}
              leftIcon={<FileSpreadsheet className="w-4 h-4" />}
            >
              Run Monthly Payroll
            </Button>
          </div>
        }
      />

      {/* CRM Stat Cards Strip */}
      <section className="stat-grid">
        <div className="card stat-card tone-info">
          <div className="stat-top">
            <span className="stat-icon">
              <BadgeIndianRupee size={20} />
            </span>
            <h3>Total Monthly Payroll</h3>
          </div>
          <strong className="stat-value">₹{totalGross.toLocaleString('en-IN')}</strong>
          <div className="stat-meta">
            <span className="muted">Gross, from salary structures</span>
          </div>
        </div>

        <div className="card stat-card tone-good">
          <div className="stat-top">
            <span className="stat-icon">
              <CheckCircle2 size={20} />
            </span>
            <h3>Net Pay Disbursed</h3>
          </div>
          <strong className="stat-value">
            {latestRun
              ? `₹${latestRun.totalNetDisbursed.toLocaleString('en-IN')}`
              : '—'}
          </strong>
          <div className="stat-meta">
            <span className="muted">
              {latestRun
                ? `${latestRun.month} · ${latestRun.status}`
                : 'No cycle executed yet'}
            </span>
          </div>
        </div>

        <div className="card stat-card tone-urgent">
          <div className="stat-top">
            <span className="stat-icon">
              <Clock size={20} />
            </span>
            <h3>Statutory Deductions</h3>
          </div>
          <strong className="stat-value">₹{totalDeductions.toLocaleString('en-IN')}</strong>
          <div className="stat-meta">
            <span className="muted">PF, ESI, TDS & PT</span>
          </div>
        </div>

        <div className="card stat-card tone-info">
          <div className="stat-top">
            <span className="stat-icon">
              <Users size={20} />
            </span>
            <h3>Staff on Payroll</h3>
          </div>
          <strong className="stat-value">{totalStaff}</strong>
          <div className="stat-meta">
            <span className="muted">
              {activeStructures.length} with configured structure
            </span>
          </div>
        </div>
      </section>

      {/* Action Shortcut Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <button
          onClick={() => navigate('/hr/payroll/process')}
          className="p-4 bg-white rounded-xl border border-slate-200 hover:border-teal-500 hover:shadow-xs transition-all text-left group flex flex-col justify-between"
        >
          <div>
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-ink">
              Process Monthly Payroll
            </h3>
            <p className="text-xs text-ink-3 mt-0.5">
              Calculate attendance deductions, site allowances, and finalize disbursements.
            </p>
          </div>
          <span className="text-xs font-semibold text-teal-700 mt-3 flex items-center gap-1">
            Open Wizard <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </button>

        <button
          onClick={() => navigate('/hr/payroll/salary-structure')}
          className="p-4 bg-white rounded-xl border border-slate-200 hover:border-teal-500 hover:shadow-xs transition-all text-left group flex flex-col justify-between"
        >
          <div>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
              <SlidersHorizontal className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-ink">
              CTC & Salary Structures
            </h3>
            <p className="text-xs text-ink-3 mt-0.5">
              Configure Basic (40%), HRA, Field Allowances, PF, ESI, and PT for roles.
            </p>
          </div>
          <span className="text-xs font-semibold text-indigo-700 mt-3 flex items-center gap-1">
            Manage Structures <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </button>

        <button
          onClick={() => navigate('/hr/payroll/payslips')}
          className="p-4 bg-white rounded-xl border border-slate-200 hover:border-teal-500 hover:shadow-xs transition-all text-left group flex flex-col justify-between"
        >
          <div>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
              <FileText className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-ink">
              Employee Payslip Vault
            </h3>
            <p className="text-xs text-ink-3 mt-0.5">
              Preview, download, and print official Bansal Geo payslips for staff.
            </p>
          </div>
          <span className="text-xs font-semibold text-emerald-700 mt-3 flex items-center gap-1">
            View Payslips <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </button>
      </div>

      {/* Recent Payroll Runs Table inside Single Unified CRM Card */}
      <div className="card">
        <div className="leads-toolbar flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-ink">
              Recent Payroll Batches
            </h3>
            <p className="text-xs text-ink-3">
              Historical monthly execution and disbursal logs
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/hr/payroll/history')}
          >
            Full History
          </Button>
        </div>

        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Payroll Month</th>
                <th>Processed Date</th>
                <th>Staff Processed</th>
                <th>Total Gross</th>
                <th>Total Deductions</th>
                <th>Net Disbursed</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {runs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-6 text-ink-3 text-xs">
                    No payroll cycles run yet. Click "Run Monthly Payroll" to start.
                  </td>
                </tr>
              ) : (
                runs.map((run) => (
                  <tr key={run.id}>
                    <td className="font-bold text-ink">{run.month}</td>
                    <td className="font-mono text-ink-2 tabular-nums">
                      {run.processedDate}
                    </td>
                    <td className="font-medium text-ink">
                      {run.totalEmployees} Personnel
                    </td>
                    <td className="font-bold text-ink tabular-nums">
                      ₹{run.totalGross?.toLocaleString('en-IN')}
                    </td>
                    <td className="font-semibold text-rose-600 tabular-nums">
                      ₹{run.totalDeductions?.toLocaleString('en-IN')}
                    </td>
                    <td className="font-bold text-emerald-700 tabular-nums">
                      ₹{run.totalNetDisbursed?.toLocaleString('en-IN')}
                    </td>
                    <td>
                      <span className="pill status-pill tone-good">
                        {run.status}
                      </span>
                    </td>
                    <td className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs h-7 px-2"
                        onClick={() => navigate('/hr/payroll/payslips')}
                      >
                        View Payslips
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
