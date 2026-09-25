import { Avatar } from '@/components/common/Avatar';
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Users, Search, Eye, ShieldCheck, } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Select } from '@/components/common/Select';
import { Input } from '@/components/common/Input';
import { StatusBadge } from '@/components/common/StatusBadge';
import { useAuth } from '@/contexts/AuthContext';
import { useRole } from '@/contexts/RoleContext';
import { storage } from '@/core/storage/storage';
import { leaveService } from '@/modules/leave/services/leave.service';
export const LeaveBalancePage = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { currentRole } = useRole();
    const isEmployee = currentRole === 'employee' || user?.role === 'employee';
    const loggedInEmpId = user?.employeeId || 'BGS-006';
    const [employees, setEmployees] = useState([]);
    const [selectedEmpId, setSelectedEmpId] = useState(isEmployee ? loggedInEmpId : 'all');
    const [balances, setBalances] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [myRequests, setMyRequests] = useState([]);
    // Load employees & personal requests on mount
    useEffect(() => {
        const emps = storage.getEmployees();
        setEmployees(emps);
        const loadRequests = async () => {
            const all = await leaveService.getRequests();
            setMyRequests(all.filter((r) => r.employeeId === (isEmployee ? loggedInEmpId : selectedEmpId)));
        };
        loadRequests();
    }, [loggedInEmpId, isEmployee, selectedEmpId]);
    // Load balances based on role and selected employee
    useEffect(() => {
        const loadBalances = async () => {
            if (isEmployee) {
                const data = await leaveService.getBalances(loggedInEmpId);
                setBalances(data);
            }
            else if (selectedEmpId !== 'all') {
                const data = await leaveService.getBalances(selectedEmpId);
                setBalances(data);
            }
            else {
                const data = await leaveService.getBalances();
                setBalances(data);
            }
        };
        loadBalances();
    }, [isEmployee, selectedEmpId, loggedInEmpId]);
    // Master Ledger Data: ONLY calculated and accessed for Admin / HR
    const masterLedger = useMemo(() => {
        if (isEmployee)
            return [];
        return employees.map((emp) => {
            const empBalances = storage.getBalancesForEmployee(emp.employeeId, emp.name);
            const cl = empBalances.find((b) => b.leaveType.includes('Casual')) || { available: 12, totalAllocated: 12, used: 0, pending: 0 };
            const sl = empBalances.find((b) => b.leaveType.includes('Sick')) || { available: 10, totalAllocated: 10, used: 0, pending: 0 };
            const el = empBalances.find((b) => b.leaveType.includes('Earned')) || { available: 18, totalAllocated: 18, used: 0, pending: 0 };
            const co = empBalances.find((b) => b.leaveType.includes('Compensatory')) || { available: 8, totalAllocated: 8, used: 0, pending: 0 };
            const fdl = empBalances.find((b) => b.leaveType.includes('Field')) || { available: 15, totalAllocated: 15, used: 0, pending: 0 };
            const ml = empBalances.find((b) => b.leaveType.includes('Maternity')) || { available: 180, totalAllocated: 180, used: 0, pending: 0 };
            const totalAvailable = empBalances.reduce((sum, b) => sum + (b.available || 0), 0);
            const totalUsed = empBalances.reduce((sum, b) => sum + (b.used || 0), 0);
            const totalPending = empBalances.reduce((sum, b) => sum + (b.pending || 0), 0);
            return {
                employee: emp,
                balances: empBalances,
                cl,
                sl,
                el,
                co,
                fdl,
                ml,
                totalAvailable,
                totalUsed,
                totalPending,
            };
        });
    }, [isEmployee, employees, balances]);
    const filteredLedger = useMemo(() => {
        if (isEmployee || !searchQuery.trim())
            return masterLedger;
        const q = searchQuery.toLowerCase();
        return masterLedger.filter((item) => item.employee.name.toLowerCase().includes(q) ||
            item.employee.employeeId.toLowerCase().includes(q) ||
            item.employee.employment?.department?.toLowerCase().includes(q));
    }, [isEmployee, masterLedger, searchQuery]);
    const selectedEmployeeObj = useMemo(() => {
        if (isEmployee) {
            return employees.find((e) => e.employeeId === loggedInEmpId) || {
                employeeId: loggedInEmpId,
                name: user?.name || 'Rohan Deshmukh',
                employment: {
                    department: user?.department || 'Geology & Mineral Exploration',
                    designation: user?.designation || 'Senior Exploration Geologist',
                },
            };
        }
        return employees.find((e) => e.employeeId === selectedEmpId);
    }, [isEmployee, employees, selectedEmpId, loggedInEmpId, user]);
    // Aggregate totals for the personal overview
    const totalAllocatedDays = useMemo(() => balances.reduce((sum, b) => sum + (b.totalAllocated || 0), 0), [balances]);
    const totalAvailableDays = useMemo(() => balances.reduce((sum, b) => sum + (b.available || 0), 0), [balances]);
    const totalUtilizedDays = useMemo(() => balances.reduce((sum, b) => sum + (b.used || 0), 0), [balances]);
    const totalPendingDays = useMemo(() => balances.reduce((sum, b) => sum + (b.pending || 0), 0), [balances]);
    return (<div className="space-y-6 pb-12">
      <PageHeader title={isEmployee ? 'My Leave Balances & Entitlements' : 'Leave Balances & Quota Ledger'} description={isEmployee
            ? 'Personal annual leave quotas, utilized days, reserved commitments, and real-time available balances.'
            : 'Employee-specific annual entitlements, utilized quotas, unreserved balances, and centralized governance.'} breadcrumbs={[
            { label: isEmployee ? 'My Portal' : 'HRMS', path: '/hr' },
            { label: 'Leave', path: '/hr/leave' },
            { label: isEmployee ? 'My Balances' : 'Leave Balances' },
        ]} actions={<div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate('/hr/leave')} leftIcon={<ArrowLeft className="w-4 h-4"/>}>
              {isEmployee ? 'Leave Overview' : 'Leave Dashboard'}
            </Button>
            <Button variant="primary" size="sm" onClick={() => navigate('/hr/leave/apply')} leftIcon={<Plus className="w-4 h-4"/>}>
              Apply Leave
            </Button>
          </div>}/>

      {/* ── EMPLOYEE SELF-SERVICE PERSONAL PROFILE BANNER ── */}
      {isEmployee && (<Card className="p-4 sm:p-5 bg-gradient-to-r from-blue-900/90 via-slate-800 to-slate-900 text-white border-0 shadow-sm">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="relative shrink-0">
                <Avatar name={user?.name || ''} size="lg"/>
                <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 ring-2 ring-blue-900" title="Active ESS"/>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                    {user?.name || 'Rohan Deshmukh'}
                  </h2>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/30 text-blue-200 border border-blue-400/30 font-mono">
                    {loggedInEmpId}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                    Active ESS
                  </span>
                </div>
                <p className="text-xs text-blue-100/90 mt-0.5">
                  {user?.designation || 'Senior Exploration Geologist'} • {user?.department || 'Geology & Mineral Exploration'}
                </p>
                <p className="text-[11px] text-blue-200/70 font-mono mt-0.5">
                  Entitlement Policy: BGSPL Standard Corporate Quota (FY 2026-27)
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 w-full md:w-auto pt-3 md:pt-0 border-t md:border-t-0 border-blue-700/50 flex-wrap">
              <div className="px-3 py-1.5 rounded-lg bg-slate-950/60 border border-slate-700/50 text-center min-w-[75px]">
                <span className="text-[9px] text-slate-300 font-semibold block uppercase">Total Quota</span>
                <span className="text-base font-black text-white">{totalAllocatedDays}d</span>
              </div>
              <div className="px-3 py-1.5 rounded-lg bg-emerald-950/60 border border-emerald-700/50 text-center min-w-[75px]">
                <span className="text-[9px] text-emerald-200 font-semibold block uppercase">Available</span>
                <span className="text-base font-black text-emerald-300">{totalAvailableDays}d</span>
              </div>
              <div className="px-3 py-1.5 rounded-lg bg-amber-950/60 border border-amber-700/50 text-center min-w-[75px]">
                <span className="text-[9px] text-amber-200 font-semibold block uppercase">Utilized</span>
                <span className="text-base font-black text-amber-300">{totalUtilizedDays}d</span>
              </div>
              <div className="px-3 py-1.5 rounded-lg bg-blue-950/60 border border-blue-700/50 text-center min-w-[75px]">
                <span className="text-[9px] text-blue-200 font-semibold block uppercase">Pending</span>
                <span className="text-base font-black text-blue-300">{totalPendingDays}d</span>
              </div>
            </div>
          </div>
        </Card>)}

      {/* ── ADMIN ONLY: EMPLOYEE SELECTOR & FILTER BAR ── */}
      {!isEmployee && (<Card className="p-4 shadow-2xs">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 w-full md:w-auto">
              <Users className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0"/>
              <div className="w-full sm:w-64">
                <Select value={selectedEmpId} onChange={(e) => setSelectedEmpId(e.target.value)} options={[
                { value: 'all', label: 'All Personnel (Company Master Ledger)' },
                ...employees.map((emp) => ({
                    value: emp.employeeId,
                    label: `${emp.name} (${emp.employeeId})`,
                })),
            ]}/>
              </div>
            </div>

            {selectedEmpId === 'all' && (<div className="w-full md:w-72">
                <Input placeholder="Search by name, ID, or division..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} leftIcon={<Search className="w-4 h-4 text-slate-400"/>}/>
              </div>)}
          </div>
        </Card>)}

      {/* ── INDIVIDUAL QUOTA TILES (FOR SELECTED EMPLOYEE OR CURRENT USER) ── */}
      {selectedEmpId !== 'all' || isEmployee ? (<div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {balances.map((b) => {
                const usedPct = b.totalAllocated > 0 ? Math.round((b.used / b.totalAllocated) * 100) : 0;
                const pendingDaysCount = b.pending || 0;
                const availableToApply = Math.max(0, b.available - pendingDaysCount);
                return (<Card key={b.leaveType} className="p-4 flex flex-col justify-between hover:shadow-xs transition-shadow">
                  <div>
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-bold text-slate-900 dark:text-white text-xs">{b.leaveType}</h4>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                          Statutory entitlement FY 2026-27
                        </p>
                      </div>
                      <span className="w-3 h-3 rounded-full shrink-0 mt-0.5" style={{ backgroundColor: b.color }}/>
                    </div>

                    <div className="flex items-baseline gap-2 mt-3">
                      <span className="text-2xl font-black text-slate-900 dark:text-white tabular-nums tracking-tight">
                        {b.available}
                      </span>
                      <span className="text-xs text-slate-400 font-semibold">/ {b.totalAllocated} days available</span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full mt-3 overflow-hidden flex">
                      <div className="h-full rounded-full transition-all duration-300" style={{ width: `${Math.min(100, usedPct)}%`, backgroundColor: b.color }} title={`Utilized: ${b.used} days`}/>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mt-2">
                      <span>Utilized: <strong className="text-slate-700 dark:text-slate-300">{b.used}d</strong> ({usedPct}%)</span>
                      {pendingDaysCount > 0 && (<span className="text-amber-600 dark:text-amber-400 font-medium">
                          Pending: <strong>{pendingDaysCount}d</strong>
                        </span>)}
                    </div>
                  </div>

                  <div className="pt-2.5 mt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Available to Apply:</span>
                    <span className="font-extrabold text-blue-600 dark:text-blue-400">
                      {availableToApply} days
                    </span>
                  </div>
                </Card>);
            })}
          </div>

          {/* Utilization Ledger for Selected Employee */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card className="p-4 sm:p-5">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-3">
                  <div>
                    <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                      Leave Utilization History — {selectedEmployeeObj?.name}
                    </h3>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">
                      Record of leave submissions, approved durations, and decision outcomes
                    </p>
                  </div>
                  <Button variant="outline" size="sm" className="h-7 text-xs px-2" onClick={() => navigate('/hr/leave/requests')}>
                    View All
                  </Button>
                </div>

                {myRequests.length === 0 ? (<div className="py-8 text-center text-slate-400 text-xs">
                    No leave requests found for this employee.
                  </div>) : (<div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                          <th className="py-2 px-3">Leave Category</th>
                          <th className="py-2 px-3">Date Span</th>
                          <th className="py-2 px-3 text-center">Days</th>
                          <th className="py-2 px-3">Status</th>
                          <th className="py-2 px-3">Reviewer</th>
                          <th className="py-2 px-3 text-right">Applied On</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {myRequests.map((r) => {
                    const reqDays = r.requestedDays || r.days || 1;
                    return (<tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                              <td className="py-2.5 px-3 font-semibold text-slate-800 dark:text-slate-200">
                                {r.leaveType}
                              </td>
                              <td className="py-2.5 px-3 font-mono text-slate-600 dark:text-slate-400 whitespace-nowrap">
                                {r.startDate} to {r.endDate}
                              </td>
                              <td className="py-2.5 px-3 text-center">
                                <div className="inline-flex flex-col items-center">
                                  <span className="px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 font-bold text-slate-700 dark:text-slate-300 text-[10px]">
                                    {reqDays}d req
                                  </span>
                                  {r.status === 'Partially Approved' && (<span className="text-[9px] text-amber-600 dark:text-amber-400 font-semibold mt-0.5">
                                      ({r.approvedDays}d appr)
                                    </span>)}
                                </div>
                              </td>
                              <td className="py-2.5 px-3">
                                <StatusBadge status={r.status} size="sm"/>
                              </td>
                              <td className="py-2.5 px-3 text-slate-500 dark:text-slate-400">
                                {r.approverName || 'Pending'}
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono text-slate-400">
                                {r.appliedOn}
                              </td>
                            </tr>);
                })}
                      </tbody>
                    </table>
                  </div>)}
              </Card>
            </div>

            {/* Policy & Entitlement Rules Summary */}
            <div className="space-y-4">
              <Card className="p-4 sm:p-5 shadow-2xs space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                  <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400"/>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    BGSPL Leave Regulations
                  </h4>
                </div>

                <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
                  <div className="p-2.5 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-800/40">
                    <p className="font-bold text-blue-900 dark:text-blue-300 text-[11px]">Casual Leave (CL)</p>
                    <p className="text-[11px] text-blue-800 dark:text-blue-300/80 mt-0.5">
                      Max 3 consecutive working days per request. For extended absence, apply for Earned Leave.
                    </p>
                  </div>

                  <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-800/40">
                    <p className="font-bold text-amber-900 dark:text-amber-300 text-[11px]">Earned Leave (EL)</p>
                    <p className="text-[11px] text-amber-800 dark:text-amber-300/80 mt-0.5">
                      Advance notice recommended. Carry forward up to 30 days per annual policy.
                    </p>
                  </div>

                  <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/40">
                    <p className="font-bold text-emerald-900 dark:text-emerald-300 text-[11px]">Sick Leave (SL)</p>
                    <p className="text-[11px] text-emerald-800 dark:text-emerald-300/80 mt-0.5">
                      Medical proof advisory for absences exceeding 2 consecutive working days.
                    </p>
                  </div>

                  <div className="p-2.5 rounded-lg bg-purple-50 dark:bg-purple-950/30 border border-purple-200/60 dark:border-purple-800/40">
                    <p className="font-bold text-purple-900 dark:text-purple-300 text-[11px]">Compensatory Off (CO)</p>
                    <p className="text-[11px] text-purple-800 dark:text-purple-300/80 mt-0.5">
                      Accrued by working weekend shifts, site emergencies or government holidays.
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                  <Button variant="primary" size="sm" className="w-full text-xs" onClick={() => navigate('/hr/leave/apply')} leftIcon={<Plus className="w-3.5 h-3.5"/>}>
                    Submit New Leave Request
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        </div>) : (
        /* ── ADMIN ONLY: MASTER LEAVE LEDGER TABLE ACROSS ALL STAFF ── */
        <Card className="p-5 shadow-2xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                All Employees Leave Ledger ({filteredLedger.length})
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Centralized statutory quotas and utilization ledger across Bansal Geo Solutions Pvt. Ltd.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-2.5 px-3">Emp ID</th>
                  <th className="py-2.5 px-3">Employee Name</th>
                  <th className="py-2.5 px-3">Department</th>
                  <th className="py-2.5 px-3 text-center">Casual (CL)</th>
                  <th className="py-2.5 px-3 text-center">Sick (SL)</th>
                  <th className="py-2.5 px-3 text-center">Earned (EL)</th>
                  <th className="py-2.5 px-3 text-center">Comp Off (CO)</th>
                  <th className="py-2.5 px-3 text-center">Field Duty</th>
                  <th className="py-2.5 px-3 text-center">Total Balance</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredLedger.map((row) => (<tr key={row.employee.employeeId} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-2.5 px-3 font-mono font-bold text-blue-600 dark:text-blue-400">
                      {row.employee.employeeId}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="font-semibold text-slate-900 dark:text-white block">
                        {row.employee.name}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {row.employee.employment?.designation}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300">
                      {row.employee.employment?.department}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="font-bold text-slate-800 dark:text-slate-200">{row.cl.available}</span>
                      <span className="text-[10px] text-slate-400"> / {row.cl.totalAllocated}</span>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="font-bold text-slate-800 dark:text-slate-200">{row.sl.available}</span>
                      <span className="text-[10px] text-slate-400"> / {row.sl.totalAllocated}</span>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="font-bold text-slate-800 dark:text-slate-200">{row.el.available}</span>
                      <span className="text-[10px] text-slate-400"> / {row.el.totalAllocated}</span>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="font-bold text-slate-800 dark:text-slate-200">{row.co.available}</span>
                      <span className="text-[10px] text-slate-400"> / {row.co.totalAllocated}</span>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="font-bold text-slate-800 dark:text-slate-200">{row.fdl.available}</span>
                      <span className="text-[10px] text-slate-400"> / {row.fdl.totalAllocated}</span>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="px-2 py-0.5 rounded-full font-bold text-xs bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400">
                        {row.totalAvailable} Days
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <Button variant="ghost" size="sm" onClick={() => setSelectedEmpId(row.employee.employeeId)} className="text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 text-xs">
                        <Eye className="w-3.5 h-3.5 mr-1"/>
                        Select
                      </Button>
                    </td>
                  </tr>))}
              </tbody>
            </table>
          </div>
        </Card>)}
    </div>);
};
