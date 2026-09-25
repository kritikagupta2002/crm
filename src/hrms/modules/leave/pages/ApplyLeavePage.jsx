import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { ArrowLeft, Calendar, AlertCircle, ShieldAlert, Info, Clock, UserCheck, } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Select } from '@/components/common/Select';
import { DatePicker } from '@/components/common/DatePicker';
import { Textarea } from '@/components/common/Textarea';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { leaveService, checkDateConflict } from '@/modules/leave/services/leave.service';
import { storage } from '@/core/storage/storage';
import { countWorkingDays, getNonWorkingDates } from '@/modules/leave/utils/workingDays';
const applyLeaveSchema = z
    .object({
    leaveType: z.enum([
        'Casual Leave (CL)',
        'Sick Leave (SL)',
        'Earned / Privilege Leave (EL)',
        'Compensatory Off (CO)',
        'Field Duty Leave (FDL)',
        'Maternity / Paternity Leave',
    ]),
    startDate: z.string().min(1, 'Start date is required'),
    endDate: z.string().min(1, 'End date is required'),
    reason: z
        .string()
        .min(10, 'Please provide a clear justification (minimum 10 characters required)')
        .max(500, 'Reason cannot exceed 500 characters'),
    contactDuringLeave: z
        .string()
        .min(10, 'Emergency phone number is required (10 digits)')
        .regex(/^(\+91[-\s]?)?[6-9]\d{9}$/, 'Please enter a valid 10-digit Indian mobile number'),
})
    .refine((data) => new Date(data.endDate) >= new Date(data.startDate), {
    message: 'End date cannot be earlier than start date',
    path: ['endDate'],
});
export const ApplyLeavePage = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const toast = useToast();
    const [balances, setBalances] = useState([]);
    const [existingRequests, setExistingRequests] = useState([]);
    const [isLoadingMeta, setIsLoadingMeta] = useState(true);
    const empId = user?.employeeId || 'BGS-006';
    const empName = user?.name || 'Rohan Deshmukh';
    const companyHolidays = useMemo(() => {
        return storage.getLeaveSettings()?.companyHolidays || [];
    }, []);
    // Load live balances and existing applications for validation and limit checks
    useEffect(() => {
        const fetchMetadata = async () => {
            try {
                setIsLoadingMeta(true);
                const [userBals, allReqs] = await Promise.all([
                    leaveService.getBalances(empId),
                    leaveService.getRequests(),
                ]);
                setBalances(userBals);
                setExistingRequests(allReqs.filter((r) => r.employeeId === empId));
            }
            catch (err) {
                console.error('Failed to load leave quotas', err);
            }
            finally {
                setIsLoadingMeta(false);
            }
        };
        fetchMetadata();
    }, [empId]);
    const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting }, } = useForm({
        resolver: zodResolver(applyLeaveSchema),
        defaultValues: {
            leaveType: 'Casual Leave (CL)',
            startDate: new Date().toLocaleDateString('en-CA'),
            endDate: new Date().toLocaleDateString('en-CA'),
            contactDuringLeave: user?.email ? '+91 98876 95208' : '',
            reason: '',
        },
        mode: 'onChange',
    });
    const watchedLeaveType = watch('leaveType');
    const watchedStartDate = watch('startDate');
    const watchedEndDate = watch('endDate');
    const watchedReason = watch('reason') || '';
    // Current balance for selected category
    const activeBalance = useMemo(() => {
        return balances.find((b) => b.leaveType === watchedLeaveType) || {
            leaveType: watchedLeaveType,
            totalAllocated: 12,
            used: 0,
            pending: 0,
            available: 12,
            color: '#3B82F6',
        };
    }, [balances, watchedLeaveType]);
    // Pending days for the selected leave category (committed by existing pending applications)
    const pendingDays = useMemo(() => {
        return existingRequests
            .filter((r) => r.status === 'Pending' && r.leaveType === watchedLeaveType)
            .reduce((sum, r) => sum + (Number(r.requestedDays || r.days) || 0), 0);
    }, [existingRequests, watchedLeaveType]);
    // Truly available quota that can be applied for right now
    const availableToApply = useMemo(() => {
        return Math.max(0, activeBalance.totalAllocated - activeBalance.used - pendingDays);
    }, [activeBalance.totalAllocated, activeBalance.used, pendingDays]);
    // Compute number of working days excluding Saturday, Sunday, and configured holidays
    const calculatedDays = useMemo(() => {
        if (!watchedStartDate || !watchedEndDate)
            return 0;
        return countWorkingDays(watchedStartDate, watchedEndDate, companyHolidays);
    }, [watchedStartDate, watchedEndDate, companyHolidays]);
    // Get list of non-working days (weekends + holidays) in the selected range
    const skippedDates = useMemo(() => {
        if (!watchedStartDate || !watchedEndDate)
            return [];
        return getNonWorkingDates(watchedStartDate, watchedEndDate, companyHolidays);
    }, [watchedStartDate, watchedEndDate, companyHolidays]);
    // Projected remaining balance after this application (from unreserved quota)
    const projectedRemaining = useMemo(() => {
        if (calculatedDays <= 0)
            return availableToApply;
        return availableToApply - calculatedDays;
    }, [availableToApply, calculatedDays]);
    // Specific policy & limit validation rules
    const isInvertedDate = calculatedDays === -1;
    const isOverQuota = calculatedDays > 0 && calculatedDays > availableToApply;
    const isClLimitExceeded = watchedLeaveType === 'Casual Leave (CL)' && calculatedDays > 3;
    const isMaxDurationExceeded = watchedLeaveType !== 'Maternity / Paternity Leave' && calculatedDays > 30;
    // Overlap verification with existing pending/approved requests
    const overlappingRequest = useMemo(() => {
        if (calculatedDays <= 0)
            return null;
        return checkDateConflict(existingRequests, empId, watchedStartDate, watchedEndDate);
    }, [watchedStartDate, watchedEndDate, calculatedDays, existingRequests, empId]);
    // 1-Click resolution: automatically adjusts dates to avoid overlapping with existing leave
    const handleAutoAdjustDates = () => {
        if (!overlappingRequest)
            return;
        const reqStart = new Date(overlappingRequest.startDate);
        const start = new Date(watchedStartDate);
        if (start < reqStart) {
            // User's start is before the conflicting leave: set end date to the day before
            const dayBefore = new Date(reqStart);
            dayBefore.setDate(dayBefore.getDate() - 1);
            const formatted = dayBefore.toLocaleDateString('en-CA');
            setValue('endDate', formatted, { shouldValidate: true });
            toast.info(`Adjusted End Date to ${formatted} to avoid overlap.`, 'Dates Updated');
        }
        else {
            // User's start overlaps inside: set start date to day after conflicting leave
            const reqEnd = new Date(overlappingRequest.endDate);
            const dayAfter = new Date(reqEnd);
            dayAfter.setDate(dayAfter.getDate() + 1);
            const formatted = dayAfter.toLocaleDateString('en-CA');
            setValue('startDate', formatted, { shouldValidate: true });
            toast.info(`Adjusted Start Date to ${formatted} to avoid overlap.`, 'Dates Updated');
        }
    };
    // 1-Click resolution: withdraws conflicting previous leave directly
    const handleWithdrawConflicting = async () => {
        if (!overlappingRequest)
            return;
        try {
            await leaveService.cancelLeave(overlappingRequest.id);
            toast.success(`Conflicting application (${overlappingRequest.leaveType}: ${overlappingRequest.startDate} to ${overlappingRequest.endDate}) has been withdrawn.`, 'Application Withdrawn');
            // Refresh metadata
            const [userBals, allReqs] = await Promise.all([
                leaveService.getBalances(empId),
                leaveService.getRequests(),
            ]);
            setBalances(userBals);
            setExistingRequests(allReqs.filter((r) => r.employeeId === empId));
        }
        catch (err) {
            toast.error('Failed to withdraw conflicting leave request.', 'Error');
        }
    };
    // Master blocking rule
    const isBlockedByValidation = isInvertedDate ||
        isOverQuota ||
        isClLimitExceeded ||
        isMaxDurationExceeded ||
        !!overlappingRequest ||
        calculatedDays <= 0;
    const onSubmit = async (data) => {
        if (isBlockedByValidation) {
            toast.error('Cannot submit leave request due to policy and quota limit violations.', 'Validation Error');
            return;
        }
        try {
            await leaveService.applyLeave({
                employeeId: empId,
                employeeName: empName,
                department: user?.department || 'Geology & Mineral Exploration',
                leaveType: data.leaveType,
                startDate: data.startDate,
                endDate: data.endDate,
                requestedDays: calculatedDays,
                approvedDays: 0,
                rejectedDays: 0,
                days: calculatedDays,
                reason: data.reason.trim(),
                contactDuringLeave: data.contactDuringLeave.trim(),
            });
            toast.success(`Your request for ${calculatedDays} working day(s) of ${data.leaveType} has been submitted for manager approval.`, 'Leave Application Submitted');
            navigate('/hr/leave/requests');
        }
        catch (err) {
            toast.error(err.message || 'Failed to submit application. Please check input parameters.', 'Error');
        }
    };
    // Options for all 6 leave types with real availability
    const leaveTypeOptions = [
        'Casual Leave (CL)',
        'Sick Leave (SL)',
        'Earned / Privilege Leave (EL)',
        'Compensatory Off (CO)',
        'Field Duty Leave (FDL)',
        'Maternity / Paternity Leave',
    ].map((lt) => {
        const b = balances.find((bal) => bal.leaveType === lt);
        const ltPending = existingRequests
            .filter((r) => r.status === 'Pending' && r.leaveType === lt)
            .reduce((sum, r) => sum + (Number(r.requestedDays || r.days) || 0), 0);
        const total = b ? b.totalAllocated : (lt.includes('Maternity') ? 180 : 12);
        const used = b ? b.used : 0;
        const avail = Math.max(0, total - used - ltPending);
        return {
            value: lt,
            label: `${lt} — (${avail} of ${total} days available to apply${ltPending > 0 ? `, ${ltPending}d pending` : ''})`,
        };
    });
    return (<div className="space-y-6 max-w-3xl mx-auto pb-12">
      <PageHeader title="Apply for Leave" description="Submit planned absence with real-time statutory quota validation, working-day calculation, and policy enforcement." breadcrumbs={[
            { label: 'Dashboard', path: '/hr' },
            { label: 'Leave', path: '/hr/leave' },
            { label: 'Apply' },
        ]} actions={<Button variant="outline" size="sm" onClick={() => navigate('/hr/leave')} leftIcon={<ArrowLeft className="w-4 h-4"/>}>
            Back to Leave Hub
          </Button>}/>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card className="p-5 sm:p-6 space-y-5">
          {/* Employee Demographic Header */}
          <div className="flex flex-wrap items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 gap-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                <UserCheck className="w-5 h-5"/>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white">
                  Applicant: {empName}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  ID: <span className="font-mono">{empId}</span> • {user?.department || 'Geology & Mineral Exploration'}
                </p>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              Leave Year: 2026
            </span>
          </div>

          {/* 1. Leave Type Selector with Live Quota */}
          <div>
            <Select label="Leave Type Category" isRequired {...register('leaveType')} options={leaveTypeOptions} error={errors.leaveType?.message}/>
          </div>

          {/* 2. Real-Time Quota Ledger Card */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#121A24] border border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200/60 dark:border-slate-800">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Quota Ledger for {watchedLeaveType}
              </span>
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                BGSPL HR Policy Standard
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 mt-3">
              <div className="p-2 rounded-lg bg-white dark:bg-[#16202C] border border-slate-200/80 dark:border-slate-800 text-center">
                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Annual Quota</span>
                <p className="text-sm font-extrabold text-slate-800 dark:text-slate-200 mt-0.5">
                  {activeBalance.totalAllocated}d
                </p>
              </div>
              <div className="p-2 rounded-lg bg-white dark:bg-[#16202C] border border-slate-200/80 dark:border-slate-800 text-center">
                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Approved Used</span>
                <p className="text-sm font-extrabold text-slate-500 dark:text-slate-400 mt-0.5">
                  {activeBalance.used}d
                </p>
              </div>
              <div className="p-2 rounded-lg bg-white dark:bg-[#16202C] border border-slate-200/80 dark:border-slate-800 text-center">
                <span className="text-[9px] text-amber-600 dark:text-amber-400 font-bold uppercase tracking-wider">Pending/Reserved</span>
                <p className="text-sm font-extrabold text-amber-600 dark:text-amber-400 mt-0.5">
                  {pendingDays}d
                </p>
              </div>
              <div className="p-2 rounded-lg bg-white dark:bg-[#16202C] border border-slate-200/80 dark:border-slate-800 text-center">
                <span className="text-[9px] text-blue-600 dark:text-blue-400 font-bold uppercase tracking-wider">Available to Apply</span>
                <p className="text-sm font-extrabold text-blue-600 dark:text-blue-400 mt-0.5">
                  {availableToApply}d
                </p>
              </div>
              <div className={`p-2 rounded-lg border text-center transition-colors ${isOverQuota
            ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300'
            : 'bg-white dark:bg-[#16202C] border-slate-200/80 dark:border-slate-800'}`}>
                <span className="text-[9px] font-bold uppercase tracking-wider block">
                  {isOverQuota ? 'Limit Deficit' : 'Post-Leave Bal'}
                </span>
                <p className={`text-sm font-extrabold mt-0.5 ${isOverQuota
            ? 'text-rose-600 dark:text-rose-400'
            : projectedRemaining < 2
                ? 'text-amber-600 dark:text-amber-400'
                : 'text-emerald-600 dark:text-emerald-400'}`}>
                  {isOverQuota ? `${projectedRemaining}d (Deficit)` : `${projectedRemaining}d`}
                </p>
              </div>
            </div>
          </div>

          {/* 3. Date Selection & Calculated Duration */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <DatePicker label="Start Date" isRequired {...register('startDate')} error={errors.startDate?.message}/>
            <DatePicker label="End Date" isRequired {...register('endDate')} error={errors.endDate?.message}/>
          </div>

          {/* 4. Calculated Duration Banner (Working Days) */}
          <div className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-2 transition-colors ${isInvertedDate || calculatedDays === 0
            ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-300'
            : 'bg-blue-50/70 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800/60'}`}>
            <div className="flex items-center gap-2">
              <Calendar className={`w-4 h-4 shrink-0 ${isInvertedDate || calculatedDays === 0
            ? 'text-rose-600 dark:text-rose-400'
            : 'text-blue-600 dark:text-blue-400'}`}/>
              <span className="font-medium">
                {isInvertedDate
            ? 'Error: End date cannot be prior to start date'
            : calculatedDays === 0
                ? 'Notice: Selected date range falls entirely on non-working days (weekends / holidays)'
                : 'Total Working Days (excluding weekends & holidays):'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {skippedDates.length > 0 && calculatedDays > 0 && (<span className="px-2 py-0.5 rounded text-[10px] font-medium bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-200">
                  {skippedDates.length} non-working day(s) excluded
                </span>)}
              <span className={`font-extrabold text-sm ${isInvertedDate || calculatedDays === 0
            ? 'text-rose-700 dark:text-rose-300'
            : 'text-blue-800 dark:text-blue-300'}`}>
                {isInvertedDate
            ? 'Invalid Range'
            : calculatedDays === 0
                ? '0 Working Days'
                : `${calculatedDays} ${calculatedDays === 1 ? 'Working Day' : 'Working Days'}`}
              </span>
            </div>
          </div>

          {/* ── 5. Specific Validation & Limit Warnings ──────────────────── */}
          {/* Over Quota Limit Alert */}
          {isOverQuota && (<div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800/60 text-xs text-rose-800 dark:text-rose-200 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5"/>
              <div>
                <strong className="font-bold">Quota Limit Exceeded:</strong> You have requested{' '}
                <strong>{calculatedDays} working days</strong> of {watchedLeaveType}, but only{' '}
                <strong>{availableToApply} unreserved days</strong> are available to apply right now
                ({activeBalance.available} balance remaining minus {pendingDays} pending approval).
              </div>
            </div>)}

          {/* Casual Leave 3-Day Limit Alert */}
          {isClLimitExceeded && (<div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800/60 text-xs text-amber-800 dark:text-amber-200 flex items-start gap-2.5">
              <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5"/>
              <div>
                <strong className="font-bold">Casual Leave Policy Limit (Max 3 Days):</strong> As
                per BGSPL Service Regulations, Casual Leave cannot exceed{' '}
                <strong>3 consecutive working days</strong> in a single request. For longer vacations,
                please select <strong>Earned / Privilege Leave (EL)</strong>.
              </div>
            </div>)}

          {/* Sick Leave > 2 Days Medical Proof Requirement */}
          {watchedLeaveType === 'Sick Leave (SL)' && calculatedDays > 2 && (<div className="p-3.5 rounded-xl bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800/60 text-xs text-blue-800 dark:text-blue-200 flex items-start gap-2.5">
              <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5"/>
              <div>
                <strong className="font-bold">Medical Certificate Advisory:</strong> For medical leave
                exceeding 2 continuous working days, a formal Registered Medical Practitioner (RMP) fitness
                certificate should be presented to HR Administration upon resumption of duty.
              </div>
            </div>)}

          {/* Maximum Duration Warning */}
          {isMaxDurationExceeded && (<div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800/60 text-xs text-rose-800 dark:text-rose-200 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5"/>
              <div>
                <strong className="font-bold">Maximum Duration Limit:</strong> A single continuous leave
                request cannot exceed 30 working days. Please break down extended field leaves into separate
                reviewable phases.
              </div>
            </div>)}

          {/* Overlapping Request Conflict Alert with 1-Click Resolution */}
          {overlappingRequest && (<div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 text-xs space-y-3">
              <div className="flex items-start gap-2.5 text-amber-900 dark:text-amber-100">
                <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5"/>
                <div>
                  <strong className="font-bold">Date Conflict / Overlapping Leave:</strong> You already
                  have an active <strong>{overlappingRequest.status}</strong> application for{' '}
                  <strong>{overlappingRequest.leaveType}</strong> from{' '}
                  <span className="font-mono font-bold">{overlappingRequest.startDate}</span> to{' '}
                  <span className="font-mono font-bold">{overlappingRequest.endDate}</span>.
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-amber-200/80 dark:border-amber-800/80">
                <Button type="button" variant="outline" size="sm" className="bg-white dark:bg-[#1A2430] text-xs h-7 text-amber-900 dark:text-amber-200 border-amber-300 hover:bg-amber-100" onClick={handleAutoAdjustDates}>
                  Adjust dates to avoid conflict
                </Button>
                <Button type="button" variant="ghost" size="sm" className="text-xs h-7 text-rose-600 hover:bg-rose-100 dark:hover:bg-rose-950/40" onClick={handleWithdrawConflicting}>
                  Withdraw conflicting application
                </Button>
              </div>
            </div>)}

          {/* 6. Reason for Leave */}
          <div>
            <Textarea label="Reason / Purpose of Absence" isRequired placeholder="State clear official or personal justification for leave application..." rows={3} {...register('reason')} error={errors.reason?.message}/>
            <div className="flex justify-between items-center text-[11px] text-slate-400 mt-1">
              <span>Substantive explanation required (min 10 chars)</span>
              <span className={watchedReason.length > 500 ? 'text-rose-500 font-bold' : ''}>
                {watchedReason.length} / 500 characters
              </span>
            </div>
          </div>

          {/* 7. Emergency Contact Details */}
          <div>
            <Input label="Emergency Contact Phone" isRequired placeholder="+91 98876 95208" {...register('contactDuringLeave')} error={errors.contactDuringLeave?.message} helperText="Reachability number for project coordination during absence (10-digit Indian mobile)"/>
          </div>

          {/* 8. Submission and Action Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-blue-500"/>
              <span>Normal turnaround: Approvals processed within 24 working hours</span>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <Button type="button" variant="outline" size="sm" onClick={() => navigate('/hr/leave')}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting} disabled={isBlockedByValidation}>
                Submit Leave Request
              </Button>
            </div>
          </div>
        </Card>
      </form>
    </div>);
};
