import React, { useState, useEffect, useMemo } from 'react';
import { Check, X, Plus, RotateCcw, AlertTriangle, LogOut, LogIn } from 'lucide-react';
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
import { getEmployeeProjectById, STANDARD_PROJECTS, departmentOptions } from '@/core/constants/projects';
import { storage } from '@/core/storage/storage';
import { todayIso, parseClock, clockOf } from '@/modules/attendance/utils/punch';

const TYPES = [
    { value: 'Missed Punch Out', label: 'Forgot to punch out', hint: 'You punched in but not out. Enter the time you left.' },
    { value: 'Missed Punch In', label: 'Forgot to punch in', hint: 'You came on time but did not punch in (or punched in later). Enter the time you arrived.' },
    { value: 'Both Punches Missed', label: 'Forgot both punches', hint: 'Nothing was logged that day. Enter the arrival and leaving times.' },
    { value: 'Time Correction', label: 'Wrong time logged', hint: 'Both punches exist but a time is wrong. Enter the correct times.' },
];
const hasTime = (t) => Boolean(t) && t !== '-' && parseClock(t) !== null;
/* "09:30 AM" ↔ "09:30" for <input type="time">. */
const toInput = (t) => {
    const m = parseClock(t);
    return m === null ? '' : `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
};
const fromInput = (v) => {
    if (!v) return '';
    const [h, m] = v.split(':').map(Number);
    return clockOf(h * 60 + m);
};
/* The type that fits what the register has for the day. */
const suggestType = (rec) => (!rec || (!hasTime(rec.checkIn) && !hasTime(rec.checkOut)) ? 'Both Punches Missed' : hasTime(rec.checkIn) && !hasTime(rec.checkOut) ? 'Missed Punch Out' : 'Time Correction');
export const AttendanceCorrectionsPage = () => {
    const { user } = useAuth();
    const { currentRole } = useRole();
    const toast = useToast();
    const isEmp = currentRole === 'employee' || user?.role === 'employee';
    const empId = user?.employeeId ?? '';
    const [requests, setRequests] = useState([]);
    const [tableLoading, setTableLoading] = useState(true);
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
    const [type, setType] = useState('Missed Punch Out');
    const [reqCheckIn, setReqCheckIn] = useState('');
    const [reqCheckOut, setReqCheckOut] = useState('');
    const [reason, setReason] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [reviewing, setReviewing] = useState(false);
    const [attendance, setAttendance] = useState(() => storage.getAttendance());
    // What the register has for that day, shown next to the regularized times.
    const logged = useMemo(() => attendance.find((a) => a.employeeId === empId && a.date === date), [attendance, empId, date]);
    const missed = useMemo(() => attendanceService.missedPunchOuts(attendance, requests, empId), [attendance, requests, empId]);
    const loadData = async () => {
        const data = await attendanceService.getCorrections().finally(() => setTableLoading(false));
        setRequests(data);
    };
    useEffect(() => {
        loadData();
        attendanceService.getAttendance().then(setAttendance).catch(() => null);
    }, []);
    const typeInfo = TYPES.find((t) => t.value === type) || TYPES[0];
    const needIn = type !== 'Missed Punch Out';
    const needOut = type !== 'Missed Punch In' || (!hasTime(logged?.checkOut) && date !== todayIso());
    const openApply = (forDate = todayIso(), forType) => {
        const rec = attendance.find((a) => a.employeeId === empId && a.date === forDate);
        setDate(forDate);
        setType(forType || suggestType(rec));
        setReqCheckIn(toInput(rec?.checkIn));
        setReqCheckOut(toInput(rec?.checkOut));
        setReason('');
        setIsApplyOpen(true);
    };
    const changeDate = (value) => {
        const rec = attendance.find((a) => a.employeeId === empId && a.date === value);
        setDate(value);
        setType(suggestType(rec));
        setReqCheckIn(toInput(rec?.checkIn));
        setReqCheckOut(toInput(rec?.checkOut));
    };
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
        setSubmitting(true);
        try {
            await attendanceService.submitCorrection({
                employeeId: empId,
                date,
                type,
                requestedCheckIn: needIn ? fromInput(reqCheckIn) : '',
                requestedCheckOut: needOut ? fromInput(reqCheckOut) : '',
                reason,
            });
        }
        catch (err) {
            toast.error(err.message, 'Cannot submit');
            return;
        }
        finally {
            setSubmitting(false);
        }
        toast.success('Regularization request sent for approval.', 'Request Submitted');
        setIsApplyOpen(false);
        setReason('');
        loadData();
    };
    const handleOpenReview = (req, action) => {
        if (req.employeeId === empId) {
            toast.error('You cannot approve your own regularization request.', 'Not allowed');
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
        setReviewing(true);
        try {
            await attendanceService.reviewCorrection(selectedReq.id, reviewAction, user?.name ?? '', reviewComment.trim(), empId);
            attendanceService.getAttendance().then(setAttendance).catch(() => null);
        }
        catch (err) {
            toast.error(err.message, 'Cannot review');
            return;
        }
        finally {
            setReviewing(false);
        }
        toast.success(reviewAction === 'Approved' ? 'Regularization approved and the attendance updated.' : 'Regularization request rejected.', 'Review Submitted');
        setIsReviewOpen(false);
        loadData();
    };
    const columns = [
        {
            key: 'appliedAt',
            header: 'Applied On',
            sortable: true,
            className: 'font-mono text-xs whitespace-nowrap w-24 tabular-nums',
            render: (r) => (r.appliedDate || String(r.appliedAt || '').slice(0, 10) || '-'),
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
            key: 'type',
            header: 'Type',
            className: 'whitespace-nowrap',
            render: (r) => (<span className="text-xs font-semibold text-slate-700 dark:text-slate-200">{TYPES.find((t) => t.value === r.type)?.label || 'Time correction'}</span>),
        },
        {
            key: 'originalCheckIn',
            header: 'Logged In / Out',
            className: 'whitespace-nowrap',
            render: (r) => (<span className="text-xs text-slate-500 dark:text-slate-400 tabular-nums whitespace-nowrap">
          {r.originalCheckIn ?? r.currentCheckIn ?? '-'} - {r.originalCheckOut ?? r.currentCheckOut ?? '-'}
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
      <PageHeader title={isEmp ? 'My Attendance Regularization' : 'Attendance Regularization'} description={isEmp
            ? 'Forgot to punch out, or came on time but forgot to punch in? Request a regularization here.'
            : 'Review missed punch-in / punch-out requests. Approved times update the attendance register.'} breadcrumbs={[
            { label: 'Dashboard', path: '/hr' },
            { label: 'Attendance', path: '/hr/attendance' },
            { label: 'Regularization' },
        ]} actions={<div className="flex items-center gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={() => openApply(todayIso(), 'Missed Punch In')} leftIcon={<LogIn className="w-4 h-4"/>}>
              Forgot Punch In
            </Button>
            <Button variant="outline" size="sm" onClick={() => openApply(missed[0]?.date || todayIso(), 'Missed Punch Out')} leftIcon={<LogOut className="w-4 h-4"/>}>
              Forgot Punch Out
            </Button>
            <Button variant="primary" size="sm" onClick={() => openApply()} leftIcon={<Plus className="w-4 h-4"/>}>
              Request Regularization
            </Button>
          </div>}/>

      {missed.length > 0 && (<div className="p-3 rounded-xl border border-amber-300 bg-amber-50 dark:bg-amber-950/40 dark:border-amber-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-start gap-2 text-amber-900 dark:text-amber-200">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5"/>
            <span>
              <strong>Punch out missing on {missed.length} day{missed.length > 1 ? 's' : ''}:</strong>{' '}
              {missed.slice(0, 4).map((m) => `${m.date} (in ${m.checkIn})`).join(', ')}{missed.length > 4 ? '…' : ''}. These days count as incomplete until regularized.
            </span>
          </div>
          <div className="flex gap-2 flex-wrap">
            {missed.slice(0, 3).map((m) => (<Button key={m.date} variant="outline" size="sm" onClick={() => openApply(m.date, 'Missed Punch Out')}>
                Regularize {m.date.slice(5)}
              </Button>))}
          </div>
        </div>)}

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

      <DataTable loading={tableLoading} compact={true} columns={columns} data={filteredRequests} keyField="id" searchPlaceholder={isEmp ? 'Search my regularization requests...' : 'Search regularization requests...'} searchFields={isEmp ? ['reason', 'date'] : ['employeeName', 'employeeId', 'reason']} filterComponent={<div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
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
                  <Select value={selectedDept} onChange={(e) => setSelectedDept(e.target.value)} options={[{ value: 'all', label: 'All Departments' }, ...departmentOptions()]}/>
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
      <Modal isOpen={isApplyOpen} onClose={() => setIsApplyOpen(false)} title="Request Attendance Regularization" description="Your manager approves it; the attendance register is then updated." footer={<>
            <Button variant="outline" size="sm" onClick={() => setIsApplyOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleApply} isLoading={submitting}>
              Submit Regularization
            </Button>
          </>}>
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <DatePicker label="Date" isRequired value={date} max={todayIso()} onChange={(e) => changeDate(e.target.value)}/>
            <Select label="What happened?" isRequired value={type} onChange={(e) => setType(e.target.value)} options={TYPES.map((t) => ({ value: t.value, label: t.label }))}/>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 -mt-2">{typeInfo.hint}</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Logged punch in" value={logged?.checkIn || '-'} readOnly disabled/>
            <Input label="Logged punch out" value={logged?.checkOut || '-'} readOnly disabled/>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {needIn ? (<Input label={type === 'Missed Punch In' ? 'Actual arrival time' : 'Correct punch in'} type="time" isRequired value={reqCheckIn} onChange={(e) => setReqCheckIn(e.target.value)}/>) : (<Input label="Punch in (kept as logged)" value={logged?.checkIn || '-'} readOnly disabled/>)}
            {needOut ? (<Input label={type === 'Missed Punch Out' ? 'Actual leaving time' : 'Correct punch out'} type="time" isRequired value={reqCheckOut} onChange={(e) => setReqCheckOut(e.target.value)}/>) : (<Input label="Punch out" value={hasTime(logged?.checkOut) ? `${logged.checkOut} (kept as logged)` : 'Punch out as usual today'} readOnly disabled/>)}
          </div>

          <Textarea label="Reason" isRequired value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Forgot to punch out after the site meeting; left at 6:30 PM" rows={3}/>
        </div>
      </Modal>

      {/* Review Modal */}
      <Modal isOpen={isReviewOpen} onClose={() => setIsReviewOpen(false)} title={`${reviewAction === 'Approved' ? 'Approve' : 'Reject'} Regularization`} description={`Regularization requested by ${selectedReq?.employeeName}.`} footer={<>
            <Button variant="outline" size="sm" onClick={() => setIsReviewOpen(false)}>
              Cancel
            </Button>
            <Button variant={reviewAction === 'Approved' ? 'primary' : 'danger'} size="sm" onClick={handleConfirmReview} isLoading={reviewing}>
              Confirm {reviewAction}
            </Button>
          </>}>
        <div className="space-y-4">
          <div className="p-3 bg-slate-50 rounded-xl text-xs space-y-1 border border-slate-200">
            <p><strong>Employee:</strong> {selectedReq?.employeeName} ({selectedReq?.employeeId})</p>
            <p><strong>Date:</strong> {selectedReq?.date}</p>
            <p><strong>Type:</strong> {TYPES.find((t) => t.value === selectedReq?.type)?.label || 'Time correction'}</p>
            <p><strong>Logged:</strong> {selectedReq?.originalCheckIn ?? '-'} to {selectedReq?.originalCheckOut ?? '-'}</p>
            <p><strong>Regularize to:</strong> {selectedReq?.requestedCheckIn} to {selectedReq?.requestedCheckOut}</p>
            <p><strong>Reason:</strong> {selectedReq?.reason}</p>
          </div>

          <Textarea label="Reviewer Comments" value={reviewComment} onChange={(e) => setReviewComment(e.target.value)} rows={2}/>
        </div>
      </Modal>
    </div>);
};
