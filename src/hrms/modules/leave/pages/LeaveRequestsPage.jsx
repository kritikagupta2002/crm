import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, ArrowLeft, Filter, RotateCcw } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { DataTable } from '@/components/common/DataTable';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Button } from '@/components/common/Button';
import { Select } from '@/components/common/Select';
import { useAuth } from '@/contexts/AuthContext';
import { useRole } from '@/contexts/RoleContext';
import { useToast } from '@/contexts/ToastContext';
import { leaveService } from '@/modules/leave/services/leave.service';
import { getEmployeeProjectById, STANDARD_PROJECTS } from '@/core/constants/projects';
export const LeaveRequestsPage = () => {
    const navigate = useNavigate();
    const toast = useToast();
    const { user } = useAuth();
    const { currentRole } = useRole();
    const isEmployee = currentRole === 'employee' || user?.role === 'employee';
    const empId = user?.employeeId || 'BGS-006';
    const [requests, setRequests] = useState([]);
    const [selectedStatus, setSelectedStatus] = useState('all');
    const [selectedType, setSelectedType] = useState('all');
    const [selectedDept, setSelectedDept] = useState('all');
    const [selectedProject, setSelectedProject] = useState('all');
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
    // Strict employee data isolation: employee can ONLY see their own applications
    const scopedRequests = useMemo(() => {
        if (isEmployee) {
            return requests.filter((r) => r.employeeId === empId);
        }
        return requests;
    }, [requests, isEmployee, empId]);
    const filteredRequests = useMemo(() => {
        return scopedRequests.filter((r) => {
            if (selectedStatus !== 'all' && r.status !== selectedStatus)
                return false;
            if (selectedType !== 'all' && !r.leaveType.toLowerCase().includes(selectedType.toLowerCase()))
                return false;
            if (!isEmployee) {
                if (selectedDept !== 'all' && r.department !== selectedDept)
                    return false;
                if (selectedProject !== 'all' && getEmployeeProjectById(r.employeeId) !== selectedProject)
                    return false;
            }
            return true;
        });
    }, [scopedRequests, selectedStatus, selectedType, selectedDept, selectedProject, isEmployee]);
    // Employee-specific columns (clean, personal, with direct withdraw option)
    const employeeColumns = [
        {
            key: 'appliedOn',
            header: 'Applied Date',
            sortable: true,
            className: 'font-mono text-xs w-28 whitespace-nowrap tabular-nums text-slate-600 dark:text-slate-400',
        },
        {
            key: 'leaveType',
            header: 'Leave Category',
            sortable: true,
            className: 'whitespace-nowrap',
            render: (r) => (<span className="font-semibold text-slate-800 dark:text-slate-200 text-xs">{r.leaveType}</span>),
        },
        {
            key: 'startDate',
            header: 'Duration & Days',
            className: 'whitespace-nowrap',
            render: (r) => {
                const reqDays = r.requestedDays || r.days || 1;
                return (<div className="text-xs whitespace-nowrap">
            <div className="font-mono text-slate-700 dark:text-slate-300 tabular-nums">
              {r.startDate} to {r.endDate}
            </div>
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
            key: 'reason',
            header: 'Reason',
            className: 'max-w-xs truncate',
            render: (r) => (<p className="text-xs text-slate-600 dark:text-slate-300 truncate max-w-xs" title={r.reason}>{r.reason}</p>),
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
            header: 'Reviewer',
            className: 'whitespace-nowrap',
            render: (r) => (<span className="text-xs text-slate-600 dark:text-slate-400 whitespace-nowrap">
          {r.approverName || 'Pending Review'}
        </span>),
        },
        {
            key: 'approverComment',
            header: 'Reviewer Remarks',
            className: 'max-w-xs truncate',
            render: (r) => (<span className="text-xs text-slate-500 dark:text-slate-400 italic truncate max-w-xs block" title={r.approverComment || '-'}>
          {r.approverComment || '-'}
        </span>),
        },
        {
            key: 'actions',
            header: 'Action',
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
    // Admin / HR columns (company-wide view across all personnel and sites)
    const hrColumns = [
        {
            key: 'appliedOn',
            header: 'Applied Date',
            sortable: true,
            className: 'font-mono text-xs w-28 whitespace-nowrap tabular-nums text-slate-600 dark:text-slate-400',
        },
        {
            key: 'employeeName',
            header: 'Applicant',
            sortable: true,
            className: 'min-w-[180px] whitespace-nowrap',
            render: (r) => (<div>
          <span className="font-bold text-slate-900 dark:text-white text-xs">{r.employeeName}</span>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">{r.employeeId} • {r.department}</p>
        </div>),
        },
        {
            key: 'project',
            header: 'Project / Site',
            sortable: true,
            className: 'whitespace-nowrap',
            render: (r) => {
                const proj = getEmployeeProjectById(r.employeeId);
                return (<span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/60 whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-[#D5860B]"/>
            {proj}
          </span>);
            },
        },
        {
            key: 'leaveType',
            header: 'Leave Category',
            sortable: true,
            className: 'whitespace-nowrap',
            render: (r) => (<span className="font-semibold text-slate-800 dark:text-slate-200 text-xs">{r.leaveType}</span>),
        },
        {
            key: 'startDate',
            header: 'Duration & Days',
            className: 'whitespace-nowrap',
            render: (r) => {
                const reqDays = r.requestedDays || r.days || 1;
                return (<div className="text-xs whitespace-nowrap">
            <div className="font-mono text-slate-700 dark:text-slate-300 tabular-nums">
              {r.startDate} to {r.endDate}
            </div>
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
            key: 'reason',
            header: 'Reason',
            className: 'max-w-xs truncate',
            render: (r) => (<p className="text-xs text-slate-600 dark:text-slate-300 truncate max-w-xs" title={r.reason}>{r.reason}</p>),
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
            header: 'Reviewer',
            className: 'whitespace-nowrap',
            render: (r) => (<span className="text-xs text-slate-600 dark:text-slate-400 whitespace-nowrap">
          {r.approverName || 'Pending'}
        </span>),
        },
        {
            key: 'actions',
            header: 'Action',
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
      <PageHeader title={isEmployee ? 'My Leave Requests' : 'Leave Requests'} description={isEmployee
            ? 'Track real-time review status, approver remarks, and withdraw applications.'
            : 'Chronological log of leave applications submitted by personnel across all departments and sites.'} breadcrumbs={[
            { label: isEmployee ? 'My Portal' : 'Dashboard', path: '/hr' },
            { label: 'Leave', path: '/hr/leave' },
            { label: isEmployee ? 'My Requests' : 'Requests' },
        ]} actions={<div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate('/hr/leave')} leftIcon={<ArrowLeft className="w-4 h-4"/>}>
              Overview
            </Button>
            <Button variant="primary" size="sm" onClick={() => navigate('/hr/leave/apply')} leftIcon={<Plus className="w-4 h-4"/>}>
              Apply Leave
            </Button>
          </div>}/>

      {/* Filter Controls */}
      <div className="flex flex-wrap items-center gap-3 bg-white dark:bg-[#1A2430] p-4 rounded-xl border border-slate-200 dark:border-[#253344] shadow-xs">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 mr-1">
          <Filter className="w-4 h-4 text-blue-600"/>
          <span>Filters:</span>
        </div>

        {/* Status Filter */}
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

        {/* Leave Category Filter */}
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

        {/* Admin Only: Department & Project Filters */}
        {!isEmployee && (<>
            <div className="w-full sm:w-56">
              <Select options={[
                { value: 'all', label: 'All Departments' },
                { value: 'Geology & Mineral Exploration', label: 'Geology & Exploration' },
                { value: 'Mining & Mine Planning', label: 'Mining & Planning' },
                { value: 'GIS, Remote Sensing & UAV', label: 'GIS & Remote Sensing' },
                { value: 'Hydrogeology & Groundwater', label: 'Hydrogeology' },
                { value: 'Finance & Mineral Economics', label: 'Finance & Economics' },
                { value: 'Human Resources & Admin', label: 'HR & Admin' },
            ]} value={selectedDept} onChange={(e) => setSelectedDept(e.target.value)}/>
            </div>

            <div className="w-full sm:w-56">
              <Select options={[
                { value: 'all', label: 'All Projects / Sites' },
                ...STANDARD_PROJECTS.map((p) => ({ value: p, label: p })),
            ]} value={selectedProject} onChange={(e) => setSelectedProject(e.target.value)}/>
            </div>
          </>)}

        {(selectedStatus !== 'all' || selectedType !== 'all' || selectedDept !== 'all' || selectedProject !== 'all') && (<Button variant="ghost" size="sm" onClick={() => {
                setSelectedStatus('all');
                setSelectedType('all');
                setSelectedDept('all');
                setSelectedProject('all');
            }} className="text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs flex items-center gap-1">
            <RotateCcw className="w-3.5 h-3.5"/>
            <span>Reset</span>
          </Button>)}

        <span className="text-xs text-slate-500 dark:text-slate-400 ml-auto hidden md:inline">
          Showing <strong>{filteredRequests.length}</strong> of <strong>{scopedRequests.length}</strong> applications
        </span>
      </div>

      <DataTable compact={true} columns={isEmployee ? employeeColumns : hrColumns} data={filteredRequests} keyField="id" searchPlaceholder={isEmployee ? 'Search my requests...' : 'Search by staff name or ID...'} searchFields={['employeeName', 'employeeId', 'leaveType']}/>
    </div>);
};
