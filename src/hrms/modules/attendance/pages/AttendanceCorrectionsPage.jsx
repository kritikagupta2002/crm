import React, { useState, useEffect, useMemo } from 'react';
import { Check, X, Plus, RotateCcw } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { DataTable } from '@/components/common/DataTable';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';
import { Input } from '@/components/common/Input';
import { Select } from '@/components/common/Select';
import { Textarea } from '@/components/common/Textarea';
import { DatePicker } from '@/components/common/DatePicker';
import { useAuth } from '@/contexts/AuthContext';
import { useRole } from '@/contexts/RoleContext';
import { useToast } from '@/contexts/ToastContext';
import { attendanceService } from '@/modules/attendance/services/attendance.service';
import { getEmployeeProjectById, STANDARD_PROJECTS } from '@/core/constants/projects';
import { storage } from '@/core/storage/storage';
import { todayIso } from '@/modules/attendance/utils/punch';
export const AttendanceCorrectionsPage = () => {
    const { user } = useAuth();
    const { currentRole } = useRole();
    const toast = useToast();
    const isEmp = currentRole === 'employee' || user?.role === 'employee';
    const empId = user?.employeeId ?? '';
    const [requests, setRequests] = useState([]);
    const [isApplyOpen, setIsApplyOpen] = useState(false);
    const [isReviewOpen, setIsReviewOpen] = useState(false);
    const [selectedReq, setSelectedReq] = useState(null);
    const [reviewAction, setReviewAction] = useState('Approved');
    const [reviewComment, setReviewComment] = useState('');
    // Filters
    const [selectedStatus, setSelectedStatus] = useState('all');
    const [selectedDept, setSelectedDept] = useState('all');
    const [selectedProject, setSelectedProject] = useState('all');
    // Form states
    const [date, setDate] = useState(todayIso);
    const [reqCheckIn, setReqCheckIn] = useState('');
    const [reqCheckOut, setReqCheckOut] = useState('');
    const [reason, setReason] = useState('');
    // What the register has for that day, shown next to the corrected times.
    const logged = useMemo(() => storage.getAttendance().find((a) => a.employeeId === empId && a.date === date), [empId, date, isApplyOpen]);
    const loadData = async () => {
        const data = await attendanceService.getCorrections();
        setRequests(data);
    };
    useEffect(() => {
        loadData();
    }, []);
    const filteredRequests = requests.filter((r) => {
        if (isEmp && r.employeeId !== empId)
            return false;
        if (selectedStatus !== 'all' && r.status !== selectedStatus)
            return false;
        if (!isEmp && selectedDept !== 'all' && r.department !== selectedDept)
            return false;
        if (!isEmp && selectedProject !== 'all' && getEmployeeProjectById(r.employeeId) !== selectedProject)
            return false;
        return true;
    });
    const handleApply = async () => {
        try {
            await attendanceService.submitCorrection({
                employeeId: empId,
                employeeName: user?.name ?? '',
                department: user?.department ?? '',
                date,
                requestedCheckIn: reqCheckIn.trim().toUpperCase(),
                requestedCheckOut: reqCheckOut.trim().toUpperCase(),
                reason,
            });
        }
        catch (err) {
            toast.error(err.message, 'Cannot submit');
            return;
        }
        toast.success('Correction request sent for approval.', 'Request Submitted');
        setIsApplyOpen(false);
        setReason('');
        setReqCheckIn('');
        setReqCheckOut('');
        loadData();
    };
    const handleOpenReview = (req, action) => {
        if (req.employeeId === empId) {
            toast.error('You cannot approve your own correction request.', 'Not allowed');
            return;
        }
        setSelectedReq(req);
        setReviewAction(action);
        setReviewComment('');
        setIsReviewOpen(true);
    };
    const handleConfirmReview = async () => {
        if (!selectedReq)
            return;
        try {
            await attendanceService.reviewCorrection(selectedReq.id, reviewAction, user?.name ?? '', reviewComment.trim(), empId);
        }
        catch (err) {
            toast.error(err.message, 'Cannot review');
            return;
        }
        toast.success(reviewAction === 'Approved' ? 'Correction approved and the attendance updated.' : 'Correction request rejected.', 'Review Submitted');
        setIsReviewOpen(false);
        loadData();
    };
    const columns = [
        {
            key: 'appliedDate',
            header: 'Applied On',
            sortable: true,
            className: 'font-mono text-xs whitespace-nowrap w-24 tabular-nums',
        },
        ...(!isEmp
            ? [
                {
                    key: 'employeeName',
                    header: 'Staff Member',
                    sortable: true,
                    className: 'min-w-[180px] whitespace-nowrap',
                    render: (r) => (<div>
                <span className="font-bold text-slate-900 dark:text-white text-xs">{r.employeeName}</span>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {r.employeeId} • {r.department}
                </p>
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
            ]
            : []),
        {
            key: 'date',
            header: 'Target Date',
            className: 'whitespace-nowrap tabular-nums text-xs font-semibold text-slate-800 dark:text-slate-200',
        },
        {
            key: 'currentCheckIn',
            header: 'Logged In / Out',
            className: 'whitespace-nowrap',
            render: (r) => (<span className="text-xs text-slate-500 dark:text-slate-400 tabular-nums whitespace-nowrap">
          {r.currentCheckIn} - {r.currentCheckOut}
        </span>),
        },
        {
            key: 'requestedCheckIn',
            header: 'Requested Punch',
            className: 'whitespace-nowrap',
            render: (r) => (<span className="text-xs font-bold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 border border-blue-200/80 dark:border-blue-800/60 px-2 py-0.5 rounded tabular-nums whitespace-nowrap">
          {r.requestedCheckIn} - {r.requestedCheckOut}
        </span>),
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
            key: 'actions',
            header: isEmp ? 'Sign-off' : 'Actions',
            className: 'text-right whitespace-nowrap',
            render: (r) => {
                if (isEmp || r.status !== 'Pending' || r.employeeId === empId) {
                    return (<span className="text-[11px] text-slate-400 dark:text-slate-400 italic whitespace-nowrap">
              {r.status === 'Pending' ? (r.employeeId === empId && !isEmp ? 'Your request: another reviewer approves' : 'Pending Approval') : (r.reviewedBy ? `By ${r.reviewedBy}` : 'Processed')}
            </span>);
                }
                return (<div className="flex items-center justify-end gap-1.5">
            <button onClick={() => handleOpenReview(r, 'Rejected')} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 dark:hover:text-rose-400 rounded-lg transition-colors" title="Reject">
              <X className="w-4 h-4"/>
            </button>
            <Button variant="primary" size="sm" onClick={() => handleOpenReview(r, 'Approved')} leftIcon={<Check className="w-3.5 h-3.5"/>}>
              Approve
            </Button>
          </div>);
            },
        },
    ];
    return (<div className="space-y-3">
      <PageHeader title={isEmp ? 'My Attendance Corrections' : 'Attendance Corrections'} description={isEmp
            ? 'Submit and track your biometric attendance regularization and punch adjustments.'
            : 'Regularize missed biometric punches, drone site survey extensions, and field network delays.'} breadcrumbs={[
            { label: 'Dashboard', path: '/hr' },
            { label: 'Attendance', path: '/hr/attendance' },
            { label: 'Corrections' },
        ]} actions={<Button variant="primary" size="sm" onClick={() => setIsApplyOpen(true)} leftIcon={<Plus className="w-4 h-4"/>}>
            Request Correction
          </Button>}/>

      {/* Executive Authority Banner */}
      <div className="p-3 bg-gradient-to-r from-amber-50 to-slate-50 dark:from-amber-950/40 dark:to-slate-900 border border-amber-200 dark:border-amber-800 rounded-xl flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-amber-600 animate-pulse" />
          <span className="text-slate-700 dark:text-slate-300">
            Designated Regularization Approver: <strong className="text-slate-900 dark:text-white">Dharmendra Goyal (Executive Director)</strong>
          </span>
        </div>
        <span className="text-slate-500 text-[11px] hidden sm:inline">
          Master Oversight: <strong>Dr. Amit Kumar Bansal (Managing Director)</strong>
        </span>
      </div>

      <DataTable compact={true} columns={columns} data={filteredRequests} keyField="id" searchPlaceholder={isEmp ? 'Search my correction requests...' : 'Search correction requests...'} searchFields={isEmp ? ['reason', 'date'] : ['employeeName', 'employeeId', 'reason']} filterComponent={<div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
            <div className="w-full xs:w-auto flex-1 xs:flex-initial min-w-[130px]">
              <Select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)} options={[
                { label: 'All Statuses', value: 'all' },
                { label: 'Pending', value: 'Pending' },
                { label: 'Approved', value: 'Approved' },
                { label: 'Rejected', value: 'Rejected' },
            ]}/>
            </div>
            {!isEmp && (<>
                <div className="w-full xs:w-auto flex-1 xs:flex-initial min-w-[150px]">
                  <Select value={selectedDept} onChange={(e) => setSelectedDept(e.target.value)} options={[
                    { label: 'All Departments', value: 'all' },
                    { label: 'Geology & Exploration', value: 'Geology & Mineral Exploration' },
                    { label: 'Mining & Planning', value: 'Mining & Mine Planning' },
                    { label: 'GIS & Remote Sensing', value: 'GIS, Remote Sensing & UAV' },
                    { label: 'Hydrogeology', value: 'Hydrogeology & Groundwater' },
                    { label: 'Finance & Economics', value: 'Finance & Mineral Economics' },
                    { label: 'HR & Admin', value: 'Human Resources & Admin' },
                ]}/>
                </div>
                <div className="w-full xs:w-auto flex-1 xs:flex-initial min-w-[170px]">
                  <Select value={selectedProject} onChange={(e) => setSelectedProject(e.target.value)} options={[
                    { label: 'All Projects / Sites', value: 'all' },
                    ...STANDARD_PROJECTS.map((p) => ({ label: p, value: p })),
                ]}/>
                </div>
              </>)}
            {(selectedStatus !== 'all' || (!isEmp && (selectedDept !== 'all' || selectedProject !== 'all'))) && (<Button variant="ghost" size="sm" onClick={() => {
                    setSelectedStatus('all');
                    setSelectedDept('all');
                    setSelectedProject('all');
                }} className="text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs shrink-0 font-semibold w-full xs:w-auto flex items-center justify-center gap-1">
                <RotateCcw className="w-3 h-3"/>
                <span>Reset</span>
              </Button>)}
          </div>}/>

      {/* Apply Modal */}
      <Modal isOpen={isApplyOpen} onClose={() => setIsApplyOpen(false)} title="Apply for Punch Correction" description="Submit biometric attendance regularization for managerial sign-off." footer={<>
            <Button variant="outline" size="sm" onClick={() => setIsApplyOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleApply}>
              Submit Regularization
            </Button>
          </>}>
        <div className="space-y-4">
          <DatePicker label="Date of Incident" isRequired value={date} max={todayIso()} onChange={(e) => setDate(e.target.value)}/>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Logged punch in" value={logged?.checkIn || '-'} readOnly disabled/>
            <Input label="Logged punch out" value={logged?.checkOut || '-'} readOnly disabled/>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Corrected Punch In" isRequired value={reqCheckIn} onChange={(e) => setReqCheckIn(e.target.value)} placeholder="09:15 AM"/>
            <Input label="Corrected Punch Out" isRequired value={reqCheckOut} onChange={(e) => setReqCheckOut(e.target.value)} placeholder="06:30 PM"/>
          </div>

          <Textarea label="Detailed Reason & Justification" isRequired value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Field drone GPS sync delay in Bhilwara block / Pit emergency shift extension" rows={3}/>
        </div>
      </Modal>

      {/* Review Modal */}
      <Modal isOpen={isReviewOpen} onClose={() => setIsReviewOpen(false)} title={`${reviewAction} Punch Correction`} description={`Sign off on correction request submitted by ${selectedReq?.employeeName}.`} footer={<>
            <Button variant="outline" size="sm" onClick={() => setIsReviewOpen(false)}>
              Cancel
            </Button>
            <Button variant={reviewAction === 'Approved' ? 'primary' : 'danger'} size="sm" onClick={handleConfirmReview}>
              Confirm {reviewAction}
            </Button>
          </>}>
        <div className="space-y-4">
          <div className="p-3 bg-slate-50 rounded-xl text-xs space-y-1 border border-slate-200">
            <p><strong>Employee:</strong> {selectedReq?.employeeName} ({selectedReq?.employeeId})</p>
            <p><strong>Date:</strong> {selectedReq?.date}</p>
            <p><strong>Correction:</strong> {selectedReq?.requestedCheckIn} to {selectedReq?.requestedCheckOut}</p>
            <p><strong>Reason:</strong> {selectedReq?.reason}</p>
          </div>

          <Textarea label="Reviewer Comments" value={reviewComment} onChange={(e) => setReviewComment(e.target.value)} rows={2}/>
        </div>
      </Modal>
    </div>);
};
