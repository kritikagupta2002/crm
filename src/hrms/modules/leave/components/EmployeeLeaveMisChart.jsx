import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  Users,
  User,
  Calendar,
  CheckCircle2,
  Clock,
  CalendarDays,
  TrendingUp,
  Award,
  Layers,
  Search,
  ChevronDown,
  Scale,
} from 'lucide-react';
import { Card } from '@/components/common/Card';
import { StatCard } from '@/components/common/StatCard';
import { ChartCard } from '@/components/common/ChartCard';
import { useAuth } from '@/contexts/AuthContext';
import { useCrm } from '../../../../context/crm';
import { storage } from '@/core/storage/storage';

export const EmployeeLeaveMisChart = ({
  initialEmployeeId,
  onEmployeeChange,
  showSelector = true,
  allowAllOption = false,
}) => {
  const { user } = useAuth();
  const crmContext = useCrm();
  const crmRole = crmContext?.role || 'Super Admin';

  const [allEmployees] = useState(() => storage.getEmployees());
  const [searchTerm, setSearchTerm] = useState('');

  // Phase 1 RBAC Determination
  const isSuperOrDirector = ['Super Admin', 'Director', 'Finance Master'].includes(crmRole);
  const isManager = crmRole === 'Manager';
  const isEmployee = !isSuperOrDirector && !isManager;

  // Map employeeId -> Employee
  const empMap = useMemo(() => {
    const map = new Map();
    allEmployees.forEach((emp) => {
      map.set(emp.employeeId, emp);
    });
    return map;
  }, [allEmployees]);

  // Current logged in user's employee record
  const currentEmpRecord = useMemo(() => {
    if (user?.employeeId && empMap.has(user.employeeId)) {
      return empMap.get(user.employeeId);
    }
    const match = allEmployees.find(
      (e) =>
        (e.contact?.workEmail && user?.email && e.contact.workEmail.toLowerCase() === user.email.toLowerCase()) ||
        (e.name && user?.name && e.name.toLowerCase() === user.name.toLowerCase())
    );
    if (match) return match;
    return isSuperOrDirector ? allEmployees[0] : null;
  }, [allEmployees, empMap, user, isSuperOrDirector]);

  // Permitted employees list respecting Phase 1 permissions
  const permittedEmployees = useMemo(() => {
    if (isSuperOrDirector) {
      return allEmployees;
    }
    if (isManager && currentEmpRecord) {
      const subordinates = allEmployees.filter(
        (e) => e.employment?.managerId === currentEmpRecord.employeeId
      );
      return [currentEmpRecord, ...subordinates];
    }
    // Employee: own information only
    return currentEmpRecord ? [currentEmpRecord] : [];
  }, [isSuperOrDirector, isManager, currentEmpRecord, allEmployees]);

  // Selected Employee ID state
  const [selectedEmpId, setSelectedEmpId] = useState(() => {
    if (initialEmployeeId) return initialEmployeeId;
    if (isEmployee || isManager) {
      return currentEmpRecord?.employeeId || allEmployees[0]?.employeeId;
    }
    return allowAllOption ? 'all' : allEmployees[0]?.employeeId;
  });

  const handleSelectEmployee = (empId) => {
    setSelectedEmpId(empId);
    if (onEmployeeChange) {
      onEmployeeChange(empId);
    }
  };

  const selectedEmployee = useMemo(() => {
    if (selectedEmpId === 'all') return null;
    return empMap.get(selectedEmpId) || permittedEmployees[0] || allEmployees[0];
  }, [selectedEmpId, empMap, permittedEmployees, allEmployees]);

  // Calculate actual employee leave balances and requests directly from storage
  const employeeBalances = useMemo(() => {
    if (!selectedEmployee) return [];
    return storage.getBalancesForEmployee(selectedEmployee.employeeId, selectedEmployee.name);
  }, [selectedEmployee]);

  const employeeRequests = useMemo(() => {
    if (!selectedEmployee) return [];
    const allReqs = storage.getLeaveRequests();
    return allReqs.filter((r) => r.employeeId === selectedEmployee.employeeId);
  }, [selectedEmployee]);

  // Calculated metrics
  const metrics = useMemo(() => {
    if (!selectedEmployee) {
      return {
        totalQuota: 0,
        totalUtilized: 0,
        totalRemaining: 0,
        totalPending: 0,
        utilizationRate: '0%',
        approvedCount: 0,
        pendingCount: 0,
        rejectedCount: 0,
      };
    }

    const totalQuota = employeeBalances.reduce((sum, b) => sum + (Number(b.totalAllocated) || 0), 0);
    const totalUtilized = employeeBalances.reduce((sum, b) => sum + (Number(b.used) || 0), 0);
    const totalRemaining = employeeBalances.reduce((sum, b) => sum + (Number(b.available) || 0), 0);
    const totalPending = employeeBalances.reduce((sum, b) => sum + (Number(b.pending) || 0), 0);

    const utilizationRate =
      totalQuota > 0 ? `${Math.round((totalUtilized / totalQuota) * 100)}%` : '0%';

    const approvedCount = employeeRequests.filter(
      (r) => r.status === 'Approved' || r.status === 'Partially Approved'
    ).length;
    const pendingCount = employeeRequests.filter((r) => r.status === 'Pending').length;
    const rejectedCount = employeeRequests.filter((r) => r.status === 'Rejected').length;

    return {
      totalQuota,
      totalUtilized,
      totalRemaining,
      totalPending,
      utilizationRate,
      approvedCount,
      pendingCount,
      rejectedCount,
    };
  }, [selectedEmployee, employeeBalances, employeeRequests]);

  // Chart data: Quota vs Utilized vs Remaining for each leave category
  const chartData = useMemo(() => {
    if (!selectedEmployee) return [];
    return employeeBalances.map((b) => ({
      name: b.leaveType.split('(')[0].trim(),
      category: b.leaveType,
      Quota: b.totalAllocated,
      Utilized: b.used,
      Remaining: b.available,
      Pending: b.pending,
      fillColor: b.color || '#3B82F6',
    }));
  }, [selectedEmployee, employeeBalances]);

  // 1. Quota allocation by policy category (CL, SL, EL, CO, FDL)
  const categoryAllocationPieData = useMemo(() => {
    if (!selectedEmployee) return [];
    return employeeBalances
      .map((b) => ({
        name: b.leaveType.split('(')[0].trim(),
        value: Number(b.totalAllocated) || 0,
        used: b.used,
        available: b.available,
        color: b.color || '#3B82F6',
        pct: metrics.totalQuota > 0 ? Math.round(((Number(b.totalAllocated) || 0) / metrics.totalQuota) * 100) : 0,
      }))
      .filter((d) => d.value > 0);
  }, [selectedEmployee, employeeBalances, metrics.totalQuota]);

  // 2. Status distribution: Available Balance vs Utilized vs In Review
  const utilizationStatusPieData = useMemo(() => {
    if (!selectedEmployee) return [];
    const items = [
      {
        name: 'Available Balance',
        value: metrics.totalRemaining,
        color: '#10B981',
        pct: metrics.totalQuota > 0 ? Math.round((metrics.totalRemaining / metrics.totalQuota) * 100) : 100,
      },
    ];
    if (metrics.totalUtilized > 0) {
      items.push({
        name: 'Utilized Leaves',
        value: metrics.totalUtilized,
        color: '#3B82F6',
        pct: Math.round((metrics.totalUtilized / metrics.totalQuota) * 100),
      });
    }
    if (metrics.totalPending > 0) {
      items.push({
        name: 'In Review / Pending',
        value: metrics.totalPending,
        color: '#F59E0B',
        pct: Math.round((metrics.totalPending / metrics.totalQuota) * 100),
      });
    }
    return items.filter((d) => d.value > 0);
  }, [selectedEmployee, metrics]);

  return (
    <div className="space-y-4">
      {/* Top Filter and Employee Selector Strip */}
      {showSelector && (
        <div className="bg-white dark:bg-[#131E2B] border border-slate-200/90 dark:border-[#223347] rounded-2xl p-3.5 sm:p-4 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-400 flex items-center justify-center shrink-0">
              <User className="w-4.5 h-4.5" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                Employee Leave MIS & Quota Drilldown
              </h4>
              <p className="text-[10px] text-slate-400">
                {isEmployee
                  ? 'Viewing your private leave balance & utilization audit'
                  : isManager
                  ? 'Drilldown into your personal leaves or team members'
                  : 'Company-wide individual employee quota, utilization, and commitment ledger'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {/* Employee Selector Dropdown */}
            <div className="relative w-full sm:w-64">
              <select
                value={selectedEmpId}
                onChange={(e) => handleSelectEmployee(e.target.value)}
                disabled={isEmployee}
                className={`w-full appearance-none pl-3 pr-8 py-2 text-xs rounded-xl border font-bold ${
                  isEmployee
                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-300 dark:border-slate-700 cursor-not-allowed'
                    : 'bg-teal-50/60 dark:bg-[#0E1622] text-teal-900 dark:text-teal-200 border-teal-300 dark:border-teal-700 hover:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 cursor-pointer shadow-2xs'
                }`}
              >
                {allowAllOption && isSuperOrDirector && (
                  <option value="all">🏢 Company Overview (Department Summary)</option>
                )}
                {permittedEmployees.map((emp) => (
                  <option key={emp.employeeId} value={emp.employeeId}>
                    {emp.name} ({emp.employeeId}) — {emp.employment?.department?.split('&')[0]}
                  </option>
                ))}
              </select>
              {!isEmployee && (
                <ChevronDown className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2" />
              )}
            </div>
          </div>
        </div>
      )}

      {selectedEmployee ? (
        <div className="space-y-4">
          {/* Totals across all leave types, as the CRM's stat cards. */}
          <div className="stat-grid">
            <StatCard title="Allocated quota" value={metrics.totalQuota} icon={<Calendar />} tone="tone-info" caption="days a year" />
            <StatCard title="Utilized" value={metrics.totalUtilized} icon={<CheckCircle2 />} tone="tone-good" caption={`${metrics.utilizationRate} of the quota`} />
            <StatCard title="Remaining" value={metrics.totalRemaining} icon={<Award />} tone="tone-attention" caption="days available" />
            <StatCard title="In review" value={metrics.totalPending} icon={<Clock />} tone="tone-neutral" caption={`${metrics.pendingCount} pending ${metrics.pendingCount === 1 ? 'request' : 'requests'}`} />
          </div>

          {/* Main Visualizations Row: Bar Chart + Category Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Left 2 Cols: Grouped Bar Chart (Quota vs Utilized vs Remaining) */}
            <div className="lg:col-span-2">
              <ChartCard
                title={`${selectedEmployee.name} — Leave Quota & Utilization Share`}
                subtitle={[selectedEmployee.employment?.designation, selectedEmployee.employment?.department, selectedEmployee.employeeId].filter(Boolean).join(' · ')}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full min-h-[270px] items-center">
                  {/* Donut 1: Quota Entitlement by Category */}
                  <div className="flex flex-col items-center">
                    <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Policy Quota Entitlement
                    </span>
                    <div className="relative w-full h-[180px] flex items-center justify-center">
                      <ResponsiveContainer width="100%" height={180}>
                        <PieChart>
                          <Pie
                            data={categoryAllocationPieData}
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={75}
                            paddingAngle={3}
                            dataKey="value"
                          >
                            {categoryAllocationPieData.map((entry, idx) => (
                              <Cell key={`cat-cell-${idx}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip
                            formatter={(val, name, item) => [`${val} days (${item.payload.pct}%)`, name]}
                            contentStyle={{
                              backgroundColor: '#0F172A',
                              borderRadius: '8px',
                              border: 'none',
                              color: '#fff',
                              fontSize: '11px',
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-lg font-black text-slate-900 dark:text-white tabular-nums">
                          {metrics.totalQuota}d
                        </span>
                        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                          Total Quota
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-wrap justify-center gap-2 text-[10px] mt-1.5 max-w-[280px]">
                      {categoryAllocationPieData.map((d) => (
                        <span key={d.name} className="flex items-center gap-1 text-slate-600 dark:text-slate-300">
                          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: d.color }} />
                          {d.name}: <strong>{d.value}d</strong>
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Donut 2: Balance vs Utilization Ratio */}
                  <div className="flex flex-col items-center">
                    <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Balance vs Utilization Ratio
                    </span>
                    <div className="relative w-full h-[180px] flex items-center justify-center">
                      <ResponsiveContainer width="100%" height={180}>
                        <PieChart>
                          <Pie
                            data={utilizationStatusPieData}
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={75}
                            paddingAngle={3}
                            dataKey="value"
                          >
                            {utilizationStatusPieData.map((entry, idx) => (
                              <Cell key={`status-cell-${idx}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip
                            formatter={(val, name, item) => [`${val} days (${item.payload.pct}%)`, name]}
                            contentStyle={{
                              backgroundColor: '#0F172A',
                              borderRadius: '8px',
                              border: 'none',
                              color: '#fff',
                              fontSize: '11px',
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-lg font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
                          {metrics.totalRemaining}d
                        </span>
                        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                          Available
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-[11px] mt-1.5">
                      <span className="flex items-center gap-1 text-emerald-600 font-semibold">
                        <span className="w-2 h-2 rounded-full bg-[#10B981]" />
                        {metrics.totalRemaining}d Bal ({metrics.totalQuota > 0 ? Math.round((metrics.totalRemaining / metrics.totalQuota) * 100) : 100}%)
                      </span>
                      <span className="flex items-center gap-1 text-blue-600 font-semibold">
                        <span className="w-2 h-2 rounded-full bg-[#3B82F6]" />
                        {metrics.totalUtilized}d Used ({metrics.utilizationRate})
                      </span>
                    </div>
                  </div>
                </div>
              </ChartCard>
            </div>

            {/* Right Col: Category Quota Table */}
            <div>
              <Card className="h-full flex flex-col">
                <div className="card-header">
                  <span className="card-icon"><Scale size={18} /></span>
                  <h2>Quota ledger</h2>
                </div>
                <ul className="ledger-list">
                  {employeeBalances.map((b) => (
                    <li key={b.leaveType}>
                      <div className="min-w-0">
                        <span className="cell-strong">{b.leaveType.split('(')[0].trim()}</span>
                        <span className="cell-sub">{b.used} used of {b.totalAllocated} days</span>
                      </div>
                      <strong>{b.available}<small>left</small></strong>
                    </li>
                  ))}
                </ul>
              </Card>
            </div>
          </div>
        </div>
      ) : (
        <div className="py-12 text-center text-slate-400 text-xs">
          Please select an employee above to inspect their leave MIS chart.
        </div>
      )}
    </div>
  );
};
