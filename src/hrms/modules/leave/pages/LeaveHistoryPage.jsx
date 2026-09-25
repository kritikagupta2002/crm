import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, RotateCcw, Filter } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { DataTable } from '@/components/common/DataTable';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Button } from '@/components/common/Button';
import { Select } from '@/components/common/Select';
import { useToast } from '@/contexts/ToastContext';
import { useAuth } from '@/contexts/AuthContext';
import { useRole } from '@/contexts/RoleContext';
import { leaveService } from '@/modules/leave/services/leave.service';
export const LeaveHistoryPage = () => {
    const navigate = useNavigate();
    const toast = useToast();
    const { user } = useAuth();
    const { currentRole } = useRole();
    const isEmployee = currentRole === 'employee' || user?.role === 'employee';
    const [requests, setRequests] = useState([]);
    const [activeTab, setActiveTab] = useState(isEmployee ? 'mine' : 'all');
    const [selectedStatus, setSelectedStatus] = useState('all');
    const [selectedType, setSelectedType] = useState('all');
    const empId = user?.employeeId;
    const loadData = async () => {
        const data = await leaveService.getRequests();
        setRequests(data);
    };
    useEffect(() => {
        loadData();
    }, []);
    const handleCancelRequest = async (r) => {
        try {
            await leaveService.cancelLeave(r.id);
            toast.success(`Leave request (${r.leaveType}: ${r.startDate} to ${r.endDate}) withdrawn successfully.`, 'Application Withdrawn');
            loadData();
        }
        catch {
            toast.error('Failed to withdraw leave request.', 'Error');
        }
    };
    const handleExportLeaveHistory = () => {
        try {
            if (displayedRequests.length === 0) {
                toast.warning('No leave records available to export.', 'Export Empty');
                return;
            }
            const headers = ['Applied Date', 'Applicant', 'Employee ID', 'Division', 'Category', 'Dates', 'Requested Days', 'Approved Days', 'Rejected Days', 'Status', 'Actioned By', 'Reason'].join(',');
            const rows = displayedRequests.map(r => [
                `"${r.appliedOn || ''}"`,
                `"${r.employeeName || ''}"`,
                `"${r.employeeId || ''}"`,
                `"${r.department || ''}"`,
                `"${r.leaveType || ''}"`,
                `"${r.startDate || ''} to ${r.endDate || ''}"`,
                Number(r.requestedDays || r.days) || 1,
                Number(r.approvedDays) || (r.status === 'Approved' ? (Number(r.requestedDays || r.days) || 1) : 0),
                Number(r.rejectedDays) || (r.status === 'Rejected' ? (Number(r.requestedDays || r.days) || 1) : 0),
                `"${r.status || ''}"`,
                `"${r.approverName || r.approvedBy || ''}"`,
                `"${(r.reason || '').replace(/"/g, '""')}"`
            ].join(','));
            const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
            const encodedUri = encodeURI(csvContent);
            const link = document.createElement('a');
            link.setAttribute('href', encodedUri);
            link.setAttribute('download', `BGSPL_${isEmployee ? 'My_Leave_History' : 'Company_Leave_Archive'}_${new Date().toLocaleDateString('en-CA')}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            toast.success(`Leave archive statement exported (${displayedRequests.length} records).`, 'Export Ready');
        } catch {
            toast.error('Failed to export leave archive.', 'Export Error');
        }
    };
    // Strictly enforce that employees can NEVER see other employees' requests
    const scopedRequests = useMemo(() => {
        if (isEmployee || activeTab === 'mine') {
            return requests.filter((r) => r.employeeId === empId);
        }
        return requests;
    }, [requests, isEmployee, activeTab, empId]);
    const displayedRequests = useMemo(() => {
        return scopedRequests.filter((r) => {
            if (selectedStatus !== 'all' && r.status !== selectedStatus)
                return false;
            if (selectedType !== 'all' && !r.leaveType.toLowerCase().includes(selectedType.toLowerCase()))
                return false;
            return true;
        });
    }, [scopedRequests, selectedStatus, selectedType]);
    // Employee-specific columns
    const employeeColumns = [
        {
            key: 'appliedOn',
            header: 'Applied Date',
            sortable: true,
            className: 'font-mono text-xs w-28 whitespace-nowrap tabular-nums text-slate-600 dark:text-slate-400',
        },
        {
            key: 'leaveType',
            header: 'Category',
            sortable: true,
            className: 'whitespace-nowrap',
        },
        {
            key: 'startDate',
            header: 'Dates & Days',
            className: 'whitespace-nowrap',
            render: (r) => {
                const reqDays = r.requestedDays || r.days || 1;
                return (<div className="text-xs whitespace-nowrap">
            <span className="font-mono text-slate-700 dark:text-slate-300 tabular-nums">
              {r.startDate} to {r.endDate}
            </span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-[10px]">
                Req: {reqDays}d
              </span>
              {r.status === 'Partially Approved' && (<span className="px-1.5 py-0.2 rounded bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 font-bold text-[10px]">
                  Appr: {r.approvedDays}d • Rej: {r.rejectedDays}d
                </span>)}
              {r.status === 'Approved' && (<span className="px-1.5 py-0.2 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold text-[10px]">
                  Appr: {r.approvedDays || reqDays}d
                </span>)}
            </div>
          </div>);
            },
        },
        {
            key: 'status',
            header: 'Status',
            sortable: true,
            className: 'whitespace-nowrap',
            render: (r) => <StatusBadge status={r.status} size="sm"/>,
        },
        {
            key: 'approverName',
            header: 'Actioned By',
            className: 'whitespace-nowrap',
            render: (r) => (<span className="text-xs text-slate-600 dark:text-slate-400 whitespace-nowrap">
          {r.approverName || 'Pending'}
        </span>),
        },
        {
            key: 'approverComment',
            header: 'Decision Remarks',
            className: 'max-w-xs truncate',
            render: (r) => (<span className="text-xs text-slate-500 dark:text-slate-400 italic truncate max-w-xs block" title={r.approverComment || '-'}>
          {r.approverComment || '-'}
        </span>),
        },
        {
            key: 'actions',
            header: 'Actions',
            className: 'text-right whitespace-nowrap',
            render: (r) => {
                const canCancel = r.status === 'Pending' || r.status === 'Approved' || r.status === 'Partially Approved';
                if (!canCancel)
                    return <span className="text-slate-400 text-xs">-</span>;
                return (<Button variant="ghost" size="sm" onClick={() => handleCancelRequest(r)} className="text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-semibold">
            Withdraw
          </Button>);
            },
        },
    ];
    // HR / Admin columns (includes Staff Member name and department)
    const hrColumns = [
        {
            key: 'appliedOn',
            header: 'Applied Date',
            sortable: true,
            className: 'font-mono text-xs w-28 whitespace-nowrap tabular-nums text-slate-600 dark:text-slate-400',
        },
        {
            key: 'employeeName',
            header: 'Staff Member',
            sortable: true,
            className: 'min-w-[180px] whitespace-nowrap',
            render: (r) => (<div>
          <span className="font-bold text-slate-900 dark:text-white text-xs">{r.employeeName}</span>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">{r.department}</p>
        </div>),
        },
        {
            key: 'leaveType',
            header: 'Category',
            sortable: true,
            className: 'whitespace-nowrap',
        },
        {
            key: 'startDate',
            header: 'Dates & Days',
            className: 'whitespace-nowrap',
            render: (r) => {
                const reqDays = r.requestedDays || r.days || 1;
                return (<div className="text-xs whitespace-nowrap">
            <span className="font-mono text-slate-700 dark:text-slate-300 tabular-nums">
              {r.startDate} to {r.endDate}
            </span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-[10px]">
                Req: {reqDays}d
              </span>
              {r.status === 'Partially Approved' && (<span className="px-1.5 py-0.2 rounded bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 font-bold text-[10px]">
                  Appr: {r.approvedDays}d • Rej: {r.rejectedDays}d
                </span>)}
              {r.status === 'Approved' && (<span className="px-1.5 py-0.2 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold text-[10px]">
                  Appr: {r.approvedDays || reqDays}d
                </span>)}
            </div>
          </div>);
            },
        },
        {
            key: 'status',
            header: 'Status',
            sortable: true,
            className: 'whitespace-nowrap',
            render: (r) => <StatusBadge status={r.status} size="sm"/>,
        },
        {
            key: 'approverName',
            header: 'Actioned By',
            className: 'whitespace-nowrap',
            render: (r) => (<span className="text-xs text-slate-600 dark:text-slate-400 whitespace-nowrap">{r.approverName || 'Pending'}</span>),
        },
        {
            key: 'actions',
            header: 'Actions',
            className: 'text-right whitespace-nowrap',
            render: (r) => {
                const canCancel = r.status === 'Pending' || r.status === 'Approved' || r.status === 'Partially Approved';
                if (!canCancel)
                    return <span className="text-slate-400 text-xs">-</span>;
                return (<Button variant="ghost" size="sm" onClick={() => handleCancelRequest(r)} className="text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-semibold">
            Withdraw
          </Button>);
            },
        },
    ];
    return (<div className="space-y-6">
      <PageHeader title={isEmployee ? 'My Leave History' : 'Leave Archive & History'} description={isEmployee
            ? 'Personal historical ledger of approved, partially approved, taken, pending, and cancelled leave requests.'
            : 'Historical company-wide archive of leave applications and supervisor review records across all staff.'} breadcrumbs={[
            { label: isEmployee ? 'My Portal' : 'Dashboard', path: '/hr' },
            { label: 'Leave', path: '/hr/leave' },
            { label: 'History' },
        ]} actions={<div className="flex items-center gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={() => navigate('/hr/leave')} leftIcon={<ArrowLeft className="w-4 h-4"/>}>
              Back
            </Button>
            {!isEmployee && (
              <Button variant="outline" size="sm" onClick={() => navigate('/hr/reports', { state: { tab: 'leave' } })} className="text-emerald-700 dark:text-emerald-300 border-emerald-300">
                Leave MIS Report
              </Button>
            )}
            <Button variant="primary" size="sm" onClick={handleExportLeaveHistory} leftIcon={<Download className="w-4 h-4"/>}>
              Export Archive (CSV)
            </Button>
          </div>}/>

      {/* Mode Filter Tab (HR / Admin Only) */}
      {!isEmployee && (<div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
          <button onClick={() => setActiveTab('all')} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${activeTab === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'}`}>
            All Personnel ({requests.length})
          </button>
          <button onClick={() => setActiveTab('mine')} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${activeTab === 'mine'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'}`}>
            My Own Submissions ({requests.filter((r) => r.employeeId === empId).length})
          </button>
        </div>)}

      {/* Filters Bar */}
      <div className="flex flex-wrap items-center gap-3 bg-white dark:bg-[#1A2430] p-3 rounded-xl border border-slate-200 dark:border-[#253344] shadow-xs">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 mr-1">
          <Filter className="w-3.5 h-3.5 text-blue-600"/>
          <span>Filters:</span>
        </div>

        <div className="w-full sm:w-48">
          <Select options={[
            { value: 'all', label: 'All Statuses' },
            { value: 'Pending', label: 'Pending' },
            { value: 'Approved', label: 'Approved' },
            { value: 'Partially Approved', label: 'Partially Approved' },
            { value: 'Rejected', label: 'Rejected' },
            { value: 'Cancelled', label: 'Cancelled / Withdrawn' },
        ]} value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)}/>
        </div>

        <div className="w-full sm:w-48">
          <Select options={[
            { value: 'all', label: 'All Categories' },
            { value: 'Casual', label: 'Casual Leave (CL)' },
            { value: 'Sick', label: 'Sick Leave (SL)' },
            { value: 'Earned', label: 'Earned Leave (EL)' },
            { value: 'Compensatory', label: 'Compensatory Off (CO)' },
            { value: 'Field', label: 'Field Duty Leave (FDL)' },
            { value: 'Maternity', label: 'Maternity Leave (ML)' },
        ]} value={selectedType} onChange={(e) => setSelectedType(e.target.value)}/>
        </div>

        {(selectedStatus !== 'all' || selectedType !== 'all') && (<Button variant="ghost" size="sm" onClick={() => {
                setSelectedStatus('all');
                setSelectedType('all');
            }} className="text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs flex items-center gap-1">
            <RotateCcw className="w-3.5 h-3.5"/>
            <span>Reset</span>
          </Button>)}

        <span className="text-xs text-slate-500 dark:text-slate-400 ml-auto hidden sm:inline">
          Showing <strong>{displayedRequests.length}</strong> records
        </span>
      </div>

      <DataTable compact={true} columns={isEmployee ? employeeColumns : hrColumns} data={displayedRequests} keyField="id" searchPlaceholder="Filter records..." searchFields={['employeeName', 'employeeId', 'leaveType', 'reason']}/>
    </div>);
};
