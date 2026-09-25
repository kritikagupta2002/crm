import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, X, ArrowLeft, Filter, RotateCcw, AlertCircle, Edit3 } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { DataTable } from '@/components/common/DataTable';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Button } from '@/components/common/Button';
import { Select } from '@/components/common/Select';
import { Input } from '@/components/common/Input';
import { Modal } from '@/components/common/Modal';
import { Textarea } from '@/components/common/Textarea';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { leaveService } from '@/modules/leave/services/leave.service';
import { storage } from '@/core/storage/storage';
import { getEmployeeProjectById, STANDARD_PROJECTS } from '@/core/constants/projects';
export const LeaveApprovalsPage = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const toast = useToast();
    const [requests, setRequests] = useState([]);
    const [selectedStatus, setSelectedStatus] = useState('Pending');
    const [selectedType, setSelectedType] = useState('all');
    const [selectedDept, setSelectedDept] = useState('all');
    const [selectedProject, setSelectedProject] = useState('all');
    // Review modal state
    const [selectedReq, setSelectedReq] = useState(null);
    const [reviewMode, setReviewMode] = useState('Full');
    const [approvedDaysInput, setApprovedDaysInput] = useState(1);
    const [comment, setComment] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const loadData = async () => {
        const data = await leaveService.getRequests();
        setRequests(data);
    };
    useEffect(() => {
        loadData();
    }, []);
    const filteredRequests = requests.filter((r) => {
        if (selectedStatus !== 'all' && r.status !== selectedStatus)
            return false;
        if (selectedType !== 'all' && !r.leaveType.toLowerCase().includes(selectedType.toLowerCase()))
            return false;
        if (selectedDept !== 'all' && r.department !== selectedDept)
            return false;
        if (selectedProject !== 'all' && getEmployeeProjectById(r.employeeId) !== selectedProject)
            return false;
        return true;
    });
    const handleOpenReview = (req, initialMode) => {
        setSelectedReq(req);
        const reqDays = Number(req.requestedDays || req.days) || 1;
        setReviewMode(initialMode);
        setApprovedDaysInput(initialMode === 'Partial' ? Math.max(1, Math.floor(reqDays / 2)) : reqDays);
        setComment(initialMode === 'Full'
            ? 'Approved in full. Project coverage confirmed.'
            : initialMode === 'Partial'
                ? 'Partially approved due to project sprint commitments.'
                : 'Declined due to critical site campaign schedule.');
        setIsModalOpen(true);
    };
    const handleConfirmReview = async () => {
        if (!selectedReq)
            return;
        const requested = Number(selectedReq.requestedDays || selectedReq.days) || 1;
        let decision = 'Approved';
        let daysToApprove = requested;
        if (reviewMode === 'Full') {
            decision = 'Approved';
            daysToApprove = requested;
        }
        else if (reviewMode === 'Reject') {
            decision = 'Rejected';
            daysToApprove = 0;
        }
        else if (reviewMode === 'Partial') {
            const parsedDays = Number(approvedDaysInput);
            if (isNaN(parsedDays) || parsedDays <= 0) {
                decision = 'Rejected';
                daysToApprove = 0;
            }
            else if (parsedDays >= requested) {
                decision = 'Approved';
                daysToApprove = requested;
            }
            else {
                decision = 'Partially Approved';
                daysToApprove = parsedDays;
            }
        }
        await leaveService.reviewLeave(selectedReq.id, decision, user?.name || 'Dr. Amit Kumar Bansal', comment, daysToApprove);
        const statusMessage = decision === 'Partially Approved'
            ? `partially approved (${daysToApprove} of ${requested} days approved, ${requested - daysToApprove} days rejected)`
            : decision.toLowerCase();
        toast.success(`Leave request for ${selectedReq.employeeName} has been ${statusMessage}.`, `Review Decision Confirmed`);
        setIsModalOpen(false);
        loadData();
    };
    const columns = [
        {
            key: 'appliedOn',
            header: 'Applied Date',
            sortable: true,
            className: 'font-mono text-xs whitespace-nowrap w-28 tabular-nums',
        },
        {
            key: 'employeeName',
            header: 'Applicant',
            sortable: true,
            className: 'min-w-[180px] whitespace-nowrap',
            render: (r) => (<div>
          <span className="font-bold text-slate-900 dark:text-white text-xs">{r.employeeName}</span>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">{r.employeeId} • {r.department}</p>
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
            header: 'Leave Type',
            sortable: true,
            className: 'whitespace-nowrap',
            render: (r) => <span className="font-semibold text-slate-800 dark:text-slate-200 text-xs">{r.leaveType}</span>,
        },
        {
            key: 'startDate',
            header: 'Duration & Days',
            className: 'whitespace-nowrap',
            render: (r) => {
                const reqDays = r.requestedDays || r.days || 1;
                return (<div className="text-xs">
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
            header: 'Applicant Reason',
            className: 'max-w-xs truncate',
            render: (r) => (<p className="text-xs text-slate-600 dark:text-slate-300 truncate max-w-xs" title={r.reason}>
          {r.reason}
        </p>),
        },
        {
            key: 'status',
            header: 'Status',
            sortable: true,
            className: 'whitespace-nowrap',
            render: (r) => <StatusBadge status={r.status} size="sm"/>,
        },
        {
            key: 'actions',
            header: 'Actions',
            className: 'text-right whitespace-nowrap',
            render: (r) => {
                if (r.status !== 'Pending') {
                    return (<div className="text-[11px] text-slate-400 dark:text-slate-400 italic whitespace-nowrap text-right">
              <span>{r.approverName ? `By ${r.approverName}` : 'Processed'}</span>
              {r.reviewedAt && (<span className="block text-[10px] text-slate-400">
                  {new Date(r.reviewedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                </span>)}
            </div>);
                }
                return (<div className="flex items-center justify-end gap-1.5">
            <button onClick={() => handleOpenReview(r, 'Reject')} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 dark:hover:text-rose-400 rounded-lg transition-colors" title="Reject Application">
              <X className="w-4 h-4"/>
            </button>
            <Button variant="outline" size="sm" className="text-xs h-7 px-2 border-amber-300 text-amber-700 hover:bg-amber-50" onClick={() => handleOpenReview(r, 'Partial')} leftIcon={<Edit3 className="w-3 h-3"/>}>
              Partial
            </Button>
            <Button variant="primary" size="sm" className="text-xs h-7 px-2.5" onClick={() => handleOpenReview(r, 'Full')} leftIcon={<Check className="w-3.5 h-3.5"/>}>
              Approve
            </Button>
          </div>);
            },
        },
    ];
    return (<div className="space-y-3">
      <PageHeader title="Leave Approvals & Adjudication" description="Review, full-approve, partial-approve, or reject pending vacation and leave requests." breadcrumbs={[
            { label: 'Dashboard', path: '/hr' },
            { label: 'Leave', path: '/hr/leave' },
            { label: 'Approvals' },
        ]} actions={<Button variant="outline" size="sm" onClick={() => navigate('/hr/leave')} leftIcon={<ArrowLeft className="w-4 h-4"/>}>
            Leave Dashboard
          </Button>}/>

      {/* Filter Controls */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 bg-white dark:bg-[#1A2430] p-2.5 sm:p-3 rounded-xl border border-slate-200 dark:border-[#253344] shadow-xs">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 mr-1">
          <Filter className="w-3.5 h-3.5 text-blue-600"/>
          <span>Filters:</span>
        </div>

        {/* Status Filter */}
        <div className="w-full xs:w-auto flex-1 xs:flex-initial min-w-[140px]">
          <Select options={[
            { value: 'all', label: 'All Statuses' },
            { value: 'Pending', label: 'Pending Queue' },
            { value: 'Approved', label: 'Approved' },
            { value: 'Partially Approved', label: 'Partially Approved' },
            { value: 'Rejected', label: 'Rejected' },
            { value: 'Cancelled', label: 'Cancelled / Withdrawn' },
        ]} value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)}/>
        </div>

        {/* Leave Type Filter */}
        <div className="w-full xs:w-auto flex-1 xs:flex-initial min-w-[140px]">
          <Select options={[
            { value: 'all', label: 'All Leave Types' },
            { value: 'Casual', label: 'Casual Leave (CL)' },
            { value: 'Sick', label: 'Sick Leave (SL)' },
            { value: 'Earned', label: 'Earned Leave (EL)' },
            { value: 'Compensatory', label: 'Compensatory Off (CO)' },
            { value: 'Field', label: 'Field Duty Leave (FDL)' },
            { value: 'Maternity', label: 'Maternity Leave (ML)' },
        ]} value={selectedType} onChange={(e) => setSelectedType(e.target.value)}/>
        </div>

        {/* Department Filter */}
        <div className="w-full xs:w-auto flex-1 xs:flex-initial min-w-[140px]">
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

        {/* Project Filter */}
        <div className="w-full xs:w-auto flex-1 xs:flex-initial min-w-[170px]">
          <Select options={[
            { value: 'all', label: 'All Projects / Sites' },
            ...STANDARD_PROJECTS.map((p) => ({ value: p, label: p })),
        ]} value={selectedProject} onChange={(e) => setSelectedProject(e.target.value)}/>
        </div>

        {(selectedStatus !== 'Pending' || selectedType !== 'all' || selectedDept !== 'all' || selectedProject !== 'all') && (<Button variant="ghost" size="sm" onClick={() => {
                setSelectedStatus('Pending');
                setSelectedType('all');
                setSelectedDept('all');
                setSelectedProject('all');
            }} className="text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs flex items-center justify-center gap-1 w-full xs:w-auto">
            <RotateCcw className="w-3 h-3"/>
            <span>Reset</span>
          </Button>)}

        <span className="text-xs text-slate-500 dark:text-slate-400 ml-auto hidden md:inline">
          Showing <strong>{filteredRequests.length}</strong> of <strong>{requests.length}</strong> requests
        </span>
      </div>

      <DataTable compact={true} columns={columns} data={filteredRequests} keyField="id" searchPlaceholder="Search applicants..." searchFields={['employeeName', 'employeeId', 'leaveType']}/>

      {/* Review & Adjudication Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Adjudicate Leave Request" description={`Make approval, partial approval, or rejection decision for ${selectedReq?.employeeName}.`} footer={<>
            <Button variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant={reviewMode === 'Reject' ? 'danger' : 'primary'} size="sm" onClick={handleConfirmReview}>
              {reviewMode === 'Full'
                ? 'Confirm Full Approval'
                : reviewMode === 'Partial'
                    ? `Confirm Partial (${approvedDaysInput}d approved)`
                    : 'Confirm Rejection'}
            </Button>
          </>}>
        <div className="space-y-4">
          {/* Request Overview Banner */}
          <div className="p-3 bg-slate-50 dark:bg-[#121A24] rounded-xl text-xs space-y-1.5 border border-slate-200 dark:border-slate-800">
            <p><strong>Employee:</strong> {selectedReq?.employeeName} ({selectedReq?.employeeId})</p>
            <p><strong>Department:</strong> {selectedReq?.department}</p>
            <p><strong>Leave Type:</strong> {selectedReq?.leaveType}</p>
            <p>
              <strong>Requested Period:</strong> {selectedReq?.startDate} to {selectedReq?.endDate} (
              <strong>{selectedReq?.requestedDays || selectedReq?.days} working days</strong>)
            </p>
            <p><strong>Applicant Reason:</strong> "{selectedReq?.reason}"</p>
          </div>

          {/* Decision Selector Tabs */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Decision Action
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button type="button" onClick={() => {
            setReviewMode('Full');
            setApprovedDaysInput(selectedReq?.requestedDays || selectedReq?.days || 1);
        }} className={`py-2 px-3 rounded-lg text-xs font-bold border text-center transition-all ${reviewMode === 'Full'
            ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-700 dark:text-emerald-300 ring-2 ring-emerald-500/20'
            : 'bg-white dark:bg-[#16202C] border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50'}`}>
                Full Approval ({selectedReq?.requestedDays || selectedReq?.days}d)
              </button>

              <button type="button" onClick={() => {
            setReviewMode('Partial');
            const reqDays = selectedReq?.requestedDays || selectedReq?.days || 1;
            setApprovedDaysInput(Math.max(1, Math.floor(reqDays / 2)));
        }} className={`py-2 px-3 rounded-lg text-xs font-bold border text-center transition-all ${reviewMode === 'Partial'
            ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-500 text-amber-700 dark:text-amber-300 ring-2 ring-amber-500/20'
            : 'bg-white dark:bg-[#16202C] border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50'}`}>
                Partial Approval
              </button>

              <button type="button" onClick={() => {
            setReviewMode('Reject');
            setApprovedDaysInput(0);
        }} className={`py-2 px-3 rounded-lg text-xs font-bold border text-center transition-all ${reviewMode === 'Reject'
            ? 'bg-rose-50 dark:bg-rose-950/60 border-rose-500 text-rose-700 dark:text-rose-300 ring-2 ring-rose-500/20'
            : 'bg-white dark:bg-[#16202C] border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50'}`}>
                Full Rejection (0d)
              </button>
            </div>
          </div>

          {/* Partial Approval Days Selector */}
          {reviewMode === 'Partial' && selectedReq && (<div className="p-3.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-amber-900 dark:text-amber-200">
                  Approved Days to Grant:
                </label>
                <span className="text-xs font-extrabold text-amber-800 dark:text-amber-300">
                  {approvedDaysInput} of {selectedReq.requestedDays || selectedReq.days} days
                </span>
              </div>

              <div className="flex items-center gap-3">
                <input type="range" min={1} max={Math.max(1, (selectedReq.requestedDays || selectedReq.days || 2) - 1)} value={approvedDaysInput} onChange={(e) => setApprovedDaysInput(Number(e.target.value))} className="flex-1 accent-amber-600 cursor-pointer"/>
                <Input type="number" min={1} max={Math.max(1, (selectedReq.requestedDays || selectedReq.days || 2) - 1)} value={approvedDaysInput} onChange={(e) => setApprovedDaysInput(Number(e.target.value))} className="w-20 text-center font-bold"/>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center text-[11px] pt-1">
                <div className="p-1.5 rounded bg-white dark:bg-[#16202C] border border-amber-200 dark:border-amber-800">
                  <span className="text-slate-400 block font-medium">Requested</span>
                  <strong className="text-slate-800 dark:text-slate-200">{selectedReq.requestedDays || selectedReq.days}d</strong>
                </div>
                <div className="p-1.5 rounded bg-white dark:bg-[#16202C] border border-amber-200 dark:border-amber-800">
                  <span className="text-emerald-600 block font-medium">Approved</span>
                  <strong className="text-emerald-700 dark:text-emerald-400">{approvedDaysInput}d</strong>
                </div>
                <div className="p-1.5 rounded bg-white dark:bg-[#16202C] border border-amber-200 dark:border-amber-800">
                  <span className="text-rose-600 block font-medium">Rejected</span>
                  <strong className="text-rose-700 dark:text-rose-400">
                    {(selectedReq.requestedDays || selectedReq.days || 1) - approvedDaysInput}d
                  </strong>
                </div>
              </div>
            </div>)}

          {/* Quota & Balance Impact Calculation */}
          {selectedReq && (() => {
            const empBals = storage.getBalancesForEmployee(selectedReq.employeeId, selectedReq.employeeName);
            const currentBal = empBals.find((b) => b.leaveType === selectedReq.leaveType);
            const available = currentBal ? currentBal.available : 0;
            const requested = Number(selectedReq.requestedDays || selectedReq.days) || 1;
            const deductionDays = reviewMode === 'Full' ? requested : reviewMode === 'Partial' ? approvedDaysInput : 0;
            const projectedAfter = available - deductionDays;
            const isDeficit = projectedAfter < 0;
            return (<div className="p-3 rounded-xl bg-white dark:bg-[#16202C] border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 dark:text-slate-400">Current Available Quota:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{available} days remaining</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 dark:text-slate-400">Days to be Deducted:</span>
                  <span className="font-bold text-blue-600 dark:text-blue-400">{deductionDays} days</span>
                </div>
                <div className="flex justify-between items-center pt-1 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500 dark:text-slate-400">Projected Balance After Review:</span>
                  <span className={`font-extrabold ${isDeficit ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                    {projectedAfter} days {isDeficit ? '(Quota Deficit)' : ''}
                  </span>
                </div>
                {isDeficit && (<div className="p-2 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-[11px] text-rose-700 dark:text-rose-300 flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-600"/>
                    <span>Policy Alert: Approved days exceed remaining quota by {Math.abs(projectedAfter)} day(s).</span>
                  </div>)}
              </div>);
        })()}

          {/* Approver Remarks */}
          <Textarea label="Approver Remarks / Instructions" value={comment} onChange={(e) => setComment(e.target.value)} rows={2}/>
        </div>
      </Modal>
    </div>);
};
