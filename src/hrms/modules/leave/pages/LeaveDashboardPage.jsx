import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarPlus, CalendarDays, Clock, Layers, History, FileCheck2, ArrowRight, Scale } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { Card } from '@/components/common/Card';
import { StatCard } from '@/components/common/StatCard';
import { Button } from '@/components/common/Button';
import { StatusBadge } from '@/components/common/StatusBadge';
import { useAuth } from '@/contexts/AuthContext';
import { useRole } from '@/contexts/RoleContext';
import { leaveService } from '@/modules/leave/services/leave.service';
import { formatNearDate } from '@shared/utils/date';
import { EmployeeLeaveMisChart } from '../components/EmployeeLeaveMisChart';

/* One tone per leave type, in the order the balances come: casual, sick, earned, comp-off. */
const BALANCE_TONES = ['tone-info', 'tone-good', 'tone-attention', 'tone-neutral'];

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
        ]} actions={isEmp ? (<>
            <Button variant="secondary" onClick={() => navigate('/hr/leave/history')} leftIcon={<History size={16}/>}>History</Button>
            <Button variant="secondary" onClick={() => navigate('/hr/leave/balance')} leftIcon={<Scale size={16}/>}>My Quotas</Button>
            <Button variant="secondary" onClick={() => navigate('/hr/leave/requests')} leftIcon={<Clock size={16}/>}>My Requests</Button>
            <Button onClick={() => navigate('/hr/leave/apply')} leftIcon={<CalendarPlus size={16}/>}>Apply Leave</Button>
          </>) : (<>
            <Button variant="secondary" onClick={() => navigate('/hr/leave/balance')} leftIcon={<Scale size={16}/>}>Quota Ledger</Button>
            <Button variant="secondary" onClick={() => navigate('/hr/leave/types')} leftIcon={<Layers size={16}/>}>Leave Policies</Button>
            <Button variant="secondary" onClick={() => navigate('/hr/leave/history')} leftIcon={<History size={16}/>}>Leave History & Log</Button>
            <Button onClick={() => navigate('/hr/leave/approvals')} leftIcon={<FileCheck2 size={16}/>}>Approvals ({pendingRequests.length})</Button>
          </>)}/>

      {/* Leave balances, as the CRM's stat cards; a card opens the quota ledger. */}
      <div className="stat-grid">
        {balances.slice(0, 4).map((b, i) => (<StatCard key={b.leaveType} title={b.leaveType.split('(')[0].trim()} value={b.available} icon={<CalendarDays />} tone={BALANCE_TONES[i]} caption={`of ${b.totalAllocated} days · ${b.used} used`} onClick={() => navigate('/hr/leave/balance')}/>))}
      </div>

      {/* Employee-Specific Leave MIS Analysis & Chart */}
      <EmployeeLeaveMisChart showSelector={!isEmp} />

      {/* Recent Applications & Approvals */}
      <Card>
        <div className="card-header">
          <span className="card-icon"><FileCheck2 size={18}/></span>
          <h2>{isEmp ? 'My recent applications' : 'Recent leave applications'}</h2>
          <div className="card-actions">
            <button type="button" className="link-button" onClick={() => navigate('/hr/leave/requests')}>
              View all <ArrowRight size={14}/>
            </button>
          </div>
        </div>

        {requests.length === 0 ? (<p className="muted px-5 pb-5 text-sm">No leave applications yet.</p>) : (<ul className="ledger-list">
            {requests.slice(0, 4).map((req) => (<li key={req.id}>
                <div className="min-w-0">
                  <span className="cell-strong">
                    {!isEmp && `${req.employeeName} · `}{req.leaveType}
                  </span>
                  <span className="cell-sub">
                    {req.startDate === req.endDate ? formatNearDate(req.startDate) : `${formatNearDate(req.startDate)} – ${formatNearDate(req.endDate)}`} · {req.days} {Number(req.days) === 1 ? 'day' : 'days'}
                    {req.approverName ? ` · reviewed by ${req.approverName}` : ''}
                  </span>
                </div>
                <StatusBadge status={req.status} size="sm"/>
              </li>))}
          </ul>)}
      </Card>
    </div>);
};
