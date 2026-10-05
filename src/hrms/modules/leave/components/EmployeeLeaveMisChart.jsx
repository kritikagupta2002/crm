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
  ShieldCheck,
  Search,
  ChevronDown,
} from 'lucide-react';
import { Card } from '@/components/common/Card';
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
    if (isManager) return allEmployees.find((e) => e.employeeId === 'BGS-003') || allEmployees[0];
    if (isEmployee) return allEmployees.find((e) => e.employeeId === 'BGS-006') || allEmployees[0];
    return allEmployees[0];
  }, [allEmployees, empMap, user, isManager, isEmployee]);

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

  // Pie chart data for utilized leaves breakdown
  const pieData = useMemo(() => {
    if (!selectedEmployee) return [];
    const usedItems = employeeBalances
      .filter((b) => b.used > 0)
      .map((b) => ({
        name: b.leaveType.split('(')[0].trim(),
        value: b.used,
        color: b.color || '#3B82F6',
      }));

    if (usedItems.length === 0) {
      return [{ name: 'Full Balance Intact', value: metrics.totalQuota || 1, color: '#10B981' }];
    }
    return usedItems;
  }, [selectedEmployee, employeeBalances, metrics.totalQuota]);

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
          {/* Employee Profile Header & Executive Stat Chips */}
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {/* Card 1: Annual Quota */}
            <div className="bg-white dark:bg-[#131E2B] border border-slate-200/80 dark:border-[#223347] rounded-2xl p-3.5 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-slate-400 font-mono">
                  Allocated Quota
                </span>
                <Calendar className="w-4 h-4 text-blue-500" />
              </div>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className="text-2xl font-black text-slate-900 dark:text-white tabular-nums tracking-tight">
                  {metrics.totalQuota}
                </span>
                <span className="text-xs text-slate-400">days/yr</span>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 truncate">
                {selectedEmployee.name}
              </p>
            </div>

            {/* Card 2: Utilized Days */}
            <div className="bg-white dark:bg-[#131E2B] border border-slate-200/80 dark:border-[#223347] rounded-2xl p-3.5 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-slate-400 font-mono">
                  Utilized
                </span>
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 tabular-nums tracking-tight">
                  {metrics.totalUtilized}
                </span>
                <span className="text-xs font-semibold text-slate-400">days</span>
              </div>
              <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1">
                {metrics.utilizationRate} quota consumed
              </p>
            </div>

            {/* Card 3: Remaining Balance */}
            <div className="bg-white dark:bg-[#131E2B] border border-slate-200/80 dark:border-[#223347] rounded-2xl p-3.5 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-slate-400 font-mono">
                  Remaining
                </span>
                <Award className="w-4 h-4 text-amber-500" />
              </div>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className="text-2xl font-black text-amber-600 dark:text-amber-400 tabular-nums tracking-tight">
                  {metrics.totalRemaining}
                </span>
                <span className="text-xs font-semibold text-slate-400">days available</span>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                Usable through FY26
              </p>
            </div>

            {/* Card 4: Under Approval / Pending */}
            <div className="bg-white dark:bg-[#131E2B] border border-slate-200/80 dark:border-[#223347] rounded-2xl p-3.5 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-slate-400 font-mono">
                  In Review
                </span>
                <Clock className="w-4 h-4 text-purple-500" />
              </div>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className="text-2xl font-black text-purple-600 dark:text-purple-400 tabular-nums tracking-tight">
                  {metrics.totalPending}
                </span>
                <span className="text-xs font-semibold text-slate-400">days committed</span>
              </div>
              <p className="text-[10px] text-purple-600 dark:text-purple-400 mt-1">
                {metrics.pendingCount} pending requests
              </p>
            </div>

            {/* Card 5: Role & Department */}
            <div className="bg-white dark:bg-[#131E2B] border border-slate-200/80 dark:border-[#223347] rounded-2xl p-3.5 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-slate-400 font-mono">
                  Staff Role
                </span>
                <ShieldCheck className="w-4 h-4 text-teal-600" />
              </div>
              <div className="mt-1">
                <h5 className="text-xs font-extrabold text-slate-900 dark:text-white truncate">
                  {selectedEmployee.employment?.designation}
                </h5>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                  {selectedEmployee.employment?.department}
                </p>
              </div>
              <p className="text-[10px] text-teal-700 dark:text-teal-400 font-mono font-bold mt-1">
                {selectedEmployee.employeeId}
              </p>
            </div>
          </div>

          {/* Main Visualizations Row: Bar Chart + Category Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Left 2 Cols: Grouped Bar Chart (Quota vs Utilized vs Remaining) */}
            <div className="lg:col-span-2">
              <ChartCard
                title={`${selectedEmployee.name} — Leave Quota vs Utilization`}
                subtitle="Allocated annual quota vs days consumed vs balance available by leave policy category"
                action={
                  <div className="flex items-center gap-3 text-xs font-medium text-slate-600 dark:text-slate-300">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-xs bg-[#3B82F6]" />
                      <span>Quota</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-xs bg-[#10B981]" />
                      <span>Utilized</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-xs bg-[#F59E0B]" />
                      <span>Remaining</span>
                    </div>
                  </div>
                }
              >
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} barGap={6}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                    <XAxis
                      dataKey="name"
                      stroke="#94A3B8"
                      tick={{ fontSize: 10, fill: '#64748B' }}
                      tickLine={false}
                      axisLine={{ stroke: '#E2E8F0' }}
                    />
                    <YAxis
                      stroke="#94A3B8"
                      tick={{ fontSize: 10, fill: '#64748B' }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-slate-900 text-white p-2.5 rounded-xl shadow-xl text-xs space-y-1">
                              <p className="font-bold border-b border-slate-700 pb-1 text-slate-200">
                                {data.category}
                              </p>
                              <p className="text-blue-300">
                                Quota: <strong>{data.Quota} days</strong>
                              </p>
                              <p className="text-emerald-300">
                                Utilized: <strong>{data.Utilized} days</strong>
                              </p>
                              <p className="text-amber-300">
                                Remaining: <strong>{data.Remaining} days</strong>
                              </p>
                              {data.Pending > 0 && (
                                <p className="text-purple-300">
                                  Pending approval: <strong>{data.Pending} days</strong>
                                </p>
                              )}
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="Quota" fill="#3B82F6" radius={[3, 3, 0, 0]} barSize={14} />
                    <Bar dataKey="Utilized" fill="#10B981" radius={[3, 3, 0, 0]} barSize={14} />
                    <Bar dataKey="Remaining" fill="#F59E0B" radius={[3, 3, 0, 0]} barSize={14} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>

            {/* Right Col: Category Quota Table */}
            <div>
              <Card className="p-4 h-full flex flex-col justify-between">
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white mb-1">
                    Quota Ledger Breakdown
                  </h4>
                  <p className="text-[10px] text-slate-400 mb-3">
                    Individual entitlement vs approved consumption
                  </p>

                  <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {employeeBalances.map((b) => (
                      <div key={b.leaveType} className="py-2 flex items-center justify-between text-xs">
                        <div className="min-w-0 pr-2">
                          <span className="font-bold text-slate-800 dark:text-slate-200 block truncate">
                            {b.leaveType.split('(')[0]}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {b.used} used of {b.totalAllocated}d
                          </span>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="font-extrabold text-amber-600 dark:text-amber-400 tabular-nums">
                            {b.available}
                          </span>
                          <span className="text-[10px] text-slate-400 block">left</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
                  <span>Total Available Balance:</span>
                  <span className="font-black text-slate-900 dark:text-white text-sm tabular-nums">
                    {metrics.totalRemaining} Days
                  </span>
                </div>
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
