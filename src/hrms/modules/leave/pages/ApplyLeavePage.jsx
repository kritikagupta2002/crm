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
import { weeklyOffFor } from '@/modules/attendance/utils/weeklyOff';
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
    const empId = user?.employeeId ?? '';
    const empName = user?.name ?? '';
    const offDays = useMemo(() => weeklyOffFor(empId), [empId]);
    const companyHolidays = useMemo(() => {
        return storage.getLeaveSettings()?.companyHolidays || [];
    }, []);
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

    useEffect(() => {
        if (empId) {
            const emp = storage.getEmployees().find((e) => e.employeeId === empId);
            const phone = emp?.contact?.phone || emp?.emergency?.phone;
            if (phone) setValue('contactDuringLeave', phone);
        }
    }, [empId, setValue]);
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
        return countWorkingDays(watchedStartDate, watchedEndDate, companyHolidays, offDays);
    }, [watchedStartDate, watchedEndDate, companyHolidays, offDays]);
    // Get list of non-working days (weekends + holidays) in the selected range
    const skippedDates = useMemo(() => {
        if (!watchedStartDate || !watchedEndDate)
            return [];
        return getNonWorkingDates(watchedStartDate, watchedEndDate, companyHolidays, offDays);
    }, [watchedStartDate, watchedEndDate, companyHolidays, offDays]);
    // Projected remaining balance after this application (from unreserved quota)
    const projectedRemaining = useMemo(() => {
        if (calculatedDays <= 0)
            return availableToApply;
        return availableToApply - calculatedDays;
    }, [availableToApply, calculatedDays]);
    // Specific policy & limit validation rules
    const isInvertedDate = calculatedDays === -1;
    const isOverQuota = calculatedDays > 0 && calculatedDays > availableToApply;
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
                department: user?.department || '-',
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
        <Card className="p-6 sm:p-7 space-y-6 shadow-sm border-t-4 border-t-teal-600 dark:border-t-teal-500">
          {/* Employee Demographic Header Card */}
          <div className="flex flex-wrap items-center justify-between pb-5 border-b border-slate-100 dark:border-slate-800 gap-3">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 text-white flex items-center justify-center font-bold text-base shadow-sm">
                {empName ? empName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() : 'BGS'}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                    {empName}
                  </h3>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-teal-50 dark:bg-teal-950/50 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
                    {empId}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                  Department: <strong className="text-slate-700 dark:text-slate-300">{user?.department || 'Operations'}</strong>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shadow-2xs">
                Calendar Year: 2026
              </span>
            </div>
          </div>

          {/* 1. Leave Type Selector with Live Quota */}
          <div>
            <Select
              label="Leave Type Category"
              isRequired
              {...register('leaveType')}
              options={leaveTypeOptions}
              error={errors.leaveType?.message}
            />
          </div>

          {/* 2. Quota for the chosen leave type, as a plain figure strip */}
          <div className="quota-strip">
            <p className="quota-strip-title">{watchedLeaveType}</p>
            <dl>
              <div><dt>Annual quota</dt><dd>{activeBalance.totalAllocated}d</dd></div>
              <div><dt>Used</dt><dd>{activeBalance.used}d</dd></div>
              <div><dt>In review</dt><dd>{pendingDays}d</dd></div>
              <div><dt>Available to apply</dt><dd>{availableToApply}d</dd></div>
              <div className={isOverQuota ? 'is-urgent' : projectedRemaining < 2 ? 'is-attention' : 'is-after'}>
                <dt>{isOverQuota ? 'Short by' : 'Left after this leave'}</dt>
                <dd>{isOverQuota ? `${Math.abs(projectedRemaining)}d` : `${projectedRemaining}d`}</dd>
              </div>
            </dl>
          </div>

          {/* 3. Date Selection & Calculated Duration */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <DatePicker
              label="Start Date"
              isRequired
              value={watchedStartDate}
              {...register('startDate')}
              onChange={(e) => { const val = e?.target?.value ?? e; setValue('startDate', val, { shouldValidate: true }); }}
              error={errors.startDate?.message}
            />
            <DatePicker
              label="End Date"
              isRequired
              value={watchedEndDate}
              {...register('endDate')}
              onChange={(e) => { const val = e?.target?.value ?? e; setValue('endDate', val, { shouldValidate: true }); }}
              error={errors.endDate?.message}
            />
          </div>

          {/* 4. Calculated Duration Banner (Working Days) */}
          <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-3 transition-colors shadow-2xs ${isInvertedDate || calculatedDays === 0
            ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-300'
            : 'bg-gradient-to-r from-blue-50/90 to-teal-50/70 dark:from-blue-950/40 dark:to-teal-950/40 border-blue-200 dark:border-blue-800/60 text-slate-800 dark:text-slate-200'}`}>
            <div className="flex items-center gap-2.5">
              <Calendar className={`w-5 h-5 shrink-0 ${isInvertedDate || calculatedDays === 0
                ? 'text-rose-600 dark:text-rose-400'
                : 'text-teal-600 dark:text-teal-400'}`}/>
              <span className="font-semibold">
                {isInvertedDate
                  ? 'Error: End date cannot be prior to start date'
                  : calculatedDays === 0
                    ? 'Notice: Selected date range falls entirely on non-working days (weekends / holidays)'
                    : 'Total Working Days Calculation (excluding off-days & statutory holidays):'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {skippedDates.length > 0 && calculatedDays > 0 && (
                <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200 border border-amber-200 dark:border-amber-800">
                  {skippedDates.length} non-working day(s) excluded
                </span>
              )}
              <span className={`font-black text-sm px-3 py-1 rounded-lg ${isInvertedDate || calculatedDays === 0
                ? 'bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-200'
                : 'bg-white dark:bg-slate-900 text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-800 shadow-2xs'}`}>
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


          {/* Maximum Duration Warning */}

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

            <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
              <Button type="button" variant="outline" size="md" onClick={() => navigate('/hr/leave')}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="md"
                isLoading={isSubmitting}
                disabled={isBlockedByValidation}
                className="!bg-gradient-to-r !from-teal-600 !to-emerald-600 hover:!from-teal-700 hover:!to-emerald-700 !text-white font-bold shadow-md"
              >
                Submit Leave Application
              </Button>
            </div>
          </div>
        </Card>
      </form>
    </div>);
};
