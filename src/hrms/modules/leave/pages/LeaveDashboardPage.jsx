import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarPlus, Clock, Layers, History, FileCheck2, ArrowRight, Scale, BarChart3 } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { StatusBadge } from '@/components/common/StatusBadge';
import { useAuth } from '@/contexts/AuthContext';
import { useRole } from '@/contexts/RoleContext';
import { leaveService } from '@/modules/leave/services/leave.service';

export const LeaveDashboardPage = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { currentRole } = useRole();
    const [balances, setBalances] = useState([]);
    const [requests, setRequests] = useState([]);
    const isEmp = currentRole === 'employee' || user?.role === 'employee';
    const empId = user?.employeeId;

    useEffect(() => {
        const load = async () => {
            if (isEmp && !empId) {
                setBalances([]);
                setRequests([]);
                return;
            }
            const b = await leaveService.getBalances(isEmp ? empId : undefined);
            const r = await leaveService.getRequests();
            setBalances(b || []);
            if (isEmp) {
                setRequests((r || []).filter((req) => req.employeeId === empId));
            }
            else {
                setRequests(r || []);
            }
        };
        load();
    }, [isEmp, empId]);

    const pendingRequests = requests.filter((r) => r.status === 'Pending');

    return (<div className="space-y-3">
      <PageHeader title={isEmp ? 'My Leaves & Applications' : 'Leave Management'} description={isEmp
            ? 'Personal leave balances, application submissions, and supervisor approval status.'
            : 'Company-wide leave balances, application tracking, supervisory sign-offs, and MIS analytics.'} breadcrumbs={[
            { label: isEmp ? 'My Portal' : 'Dashboard', path: '/hr' },
            { label: 'Leave Management' },
        ]} actions={<div className="flex items-center gap-2">
            {!isEmp && (<>
                <Button variant="outline" size="sm" onClick={() => navigate('/hr/reports', { state: { tab: 'leave' } })} leftIcon={<BarChart3 className="w-4 h-4 text-emerald-600"/>}>
                  Leave MIS Report
                </Button>
                <Button variant="outline" size="sm" onClick={() => navigate('/hr/leave/approvals')} leftIcon={<FileCheck2 className="w-4 h-4 text-blue-600"/>}>
                  Approvals ({pendingRequests.length})
                </Button>
              </>)}
            <Button variant="primary" size="sm" onClick={() => navigate('/hr/leave/apply')} leftIcon={<CalendarPlus className="w-4 h-4"/>}>
              Apply Leave
            </Button>
          </div>}/>

      {/* Leave Balances Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
        {balances.slice(0, 4).map((b) => (<Card key={b.leaveType} className="p-3 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate max-w-[170px]">
                  {b.leaveType.split('(')[0]}
                </span>
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: b.color }}/>
              </div>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-extrabold text-slate-900 dark:text-white tabular-nums tracking-tight">{b.available}</span>
                <span className="text-xs font-semibold text-slate-400">/ {b.totalAllocated} days</span>
              </div>
            </div>

            <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>{b.used} days utilized</span>
              <button onClick={() => navigate('/hr/leave/balance')} className="text-blue-600 dark:text-blue-400 font-semibold hover:underline">
                {isEmp ? 'My Quotas' : 'View Ledger'}
              </button>
            </div>
          </Card>))}
      </div>

      {/* Quick Access Tiles - Role-Adaptive */}
      <div className={`grid grid-cols-2 ${isEmp ? 'sm:grid-cols-4' : 'sm:grid-cols-3 lg:grid-cols-5'} gap-2.5`}>
        <button onClick={() => navigate('/hr/leave/apply')} className="p-2.5 sm:p-3 bg-white dark:bg-[#1A2430] rounded-xl border border-slate-200 dark:border-[#253344] hover:border-blue-400 dark:hover:border-blue-500/60 hover:shadow-2xs transition-all text-left group">
          <CalendarPlus className="w-4 h-4 text-blue-600 dark:text-blue-400 mb-1 group-hover:scale-110 transition-transform"/>
          <p className="text-xs font-bold text-slate-900 dark:text-white">Apply Leave</p>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Submit new request</p>
        </button>

        <button onClick={() => navigate('/hr/leave/requests')} className="p-2.5 sm:p-3 bg-white dark:bg-[#1A2430] rounded-xl border border-slate-200 dark:border-[#253344] hover:border-blue-400 dark:hover:border-blue-500/60 hover:shadow-2xs transition-all text-left group">
          <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400 mb-1 group-hover:scale-110 transition-transform"/>
          <p className="text-xs font-bold text-slate-900 dark:text-white">{isEmp ? 'My Requests' : 'Leave Requests'}</p>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">{isEmp ? 'Track status & feedback' : 'All applications'}</p>
        </button>

        {isEmp ? (<button onClick={() => navigate('/hr/leave/balance')} className="p-2.5 sm:p-3 bg-white dark:bg-[#1A2430] rounded-xl border border-slate-200 dark:border-[#253344] hover:border-blue-400 dark:hover:border-blue-500/60 hover:shadow-2xs transition-all text-left group">
            <Scale className="w-4 h-4 text-teal-600 dark:text-teal-400 mb-1 group-hover:scale-110 transition-transform"/>
            <p className="text-xs font-bold text-slate-900 dark:text-white">My Balances</p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Personal quota ledger</p>
          </button>) : (<button onClick={() => navigate('/hr/leave/history')} className="p-2.5 sm:p-3 bg-white dark:bg-[#1A2430] rounded-xl border border-slate-200 dark:border-[#253344] hover:border-blue-400 dark:hover:border-blue-500/60 hover:shadow-2xs transition-all text-left group">
            <History className="w-4 h-4 text-purple-600 dark:text-purple-400 mb-1 group-hover:scale-110 transition-transform"/>
            <p className="text-xs font-bold text-slate-900 dark:text-white">Leave History</p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Annual archive ledger</p>
          </button>)}

        {isEmp ? (<button onClick={() => navigate('/hr/leave/history')} className="p-2.5 sm:p-3 bg-white dark:bg-[#1A2430] rounded-xl border border-slate-200 dark:border-[#253344] hover:border-blue-400 dark:hover:border-blue-500/60 hover:shadow-2xs transition-all text-left group">
            <History className="w-4 h-4 text-purple-600 dark:text-purple-400 mb-1 group-hover:scale-110 transition-transform"/>
            <p className="text-xs font-bold text-slate-900 dark:text-white">History & Archive</p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Past leaves & records</p>
          </button>) : (<button onClick={() => navigate('/hr/leave/types')} className="p-2.5 sm:p-3 bg-white dark:bg-[#1A2430] rounded-xl border border-slate-200 dark:border-[#253344] hover:border-blue-400 dark:hover:border-blue-500/60 hover:shadow-2xs transition-all text-left group">
            <Layers className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mb-1 group-hover:scale-110 transition-transform"/>
            <p className="text-xs font-bold text-slate-900 dark:text-white">Leave Policies</p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Quotas & encashment</p>
          </button>)}

        {!isEmp && (<button onClick={() => navigate('/hr/reports', { state: { tab: 'leave' } })} className="p-2.5 sm:p-3 bg-white dark:bg-[#1A2430] rounded-xl border border-slate-200 dark:border-[#253344] hover:border-emerald-400 dark:hover:border-emerald-500/60 hover:shadow-2xs transition-all text-left group">
            <BarChart3 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mb-1 group-hover:scale-110 transition-transform"/>
            <p className="text-xs font-bold text-slate-900 dark:text-white">Leave MIS & Audit</p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Utilization & analytics</p>
          </button>)}
      </div>

      {/* Recent Applications & Approvals */}
      <Card className="p-3.5 sm:p-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-[#253344] mb-3">
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
              {isEmp ? 'My Recent Applications' : 'Recent Leave Applications'}
            </h3>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">
              {isEmp ? 'Status and feedback on your submitted applications' : 'Live feed across all departments'}
            </p>
          </div>
          <Button variant="outline" size="sm" className="h-6 text-xs px-2" onClick={() => navigate('/hr/leave/requests')} rightIcon={<ArrowRight className="w-3 h-3"/>}>
            {isEmp ? 'View All My Requests' : 'All Requests'}
          </Button>
        </div>

        {requests.length === 0 ? (<div className="py-6 text-center text-slate-400 text-xs">
            No recent leave applications found.
          </div>) : (<div className="divide-y divide-slate-100 dark:divide-slate-800/80">
            {requests.slice(0, 4).map((req) => (<div key={req.id} className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    {!isEmp && (<>
                        <span className="text-xs font-bold text-slate-900 dark:text-white">{req.employeeName}</span>
                        <span className="text-xs text-slate-500 dark:text-slate-400">({req.department})</span>
                      </>)}
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      {req.leaveType}
                    </span>
                    <StatusBadge status={req.status} size="sm"/>
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-300 mt-0.5">
                    <strong>Duration:</strong> {req.startDate} to {req.endDate} ({req.days} days)
                  </p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 italic mt-0.5">"{req.reason}"</p>
                </div>

                <div className="text-left sm:text-right text-xs text-slate-400 shrink-0">
                  <span className="text-[10px]">Applied {req.appliedOn}</span>
                  {req.approverName && (<p className="text-[10px] text-slate-600 dark:text-slate-400 font-medium mt-0.5">
                      Reviewed by {req.approverName}
                    </p>)}
                </div>
              </div>))}
          </div>)}
      </Card>
    </div>);
};
