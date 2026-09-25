import { storage } from '@/core/storage/storage';
import { countWorkingDays, getWorkingDates } from '@/modules/leave/utils/workingDays';
/**
 * Shared helper to check if a proposed date range conflicts with an existing leave request.
 */
export function checkDateConflict(existingRequests, employeeId, startDateStr, endDateStr, excludeRequestId) {
    const s = new Date(startDateStr);
    const e = new Date(endDateStr);
    return existingRequests.find((r) => {
        if (r.id === excludeRequestId)
            return false;
        if (r.employeeId !== employeeId)
            return false;
        if (r.status === 'Rejected' || r.status === 'Cancelled')
            return false;
        const rStart = new Date(r.startDate);
        const rEnd = new Date(r.endDate);
        return s <= rEnd && e >= rStart;
    }) || null;
}
/**
 * Sync attendance records when leave is approved or cancelled.
 */
function syncAttendanceForLeave(req, action) {
    try {
        const holidays = storage.getLeaveSettings()?.companyHolidays || [];
        const workingDates = getWorkingDates(req.startDate, req.endDate, holidays);
        const approvedDates = workingDates.slice(0, req.approvedDays || req.requestedDays || 1);
        const attendanceList = storage.getAttendance();
        if (action === 'apply') {
            approvedDates.forEach((dateStr) => {
                const existing = attendanceList.find((a) => a.employeeId === req.employeeId && a.date === dateStr);
                if (existing) {
                    existing.status = 'On Leave';
                    existing.checkIn = '-';
                    existing.checkOut = '-';
                    existing.workingHours = '-';
                    existing.lateBy = '-';
                    existing.overtime = '-';
                }
                else {
                    attendanceList.unshift({
                        id: `att-leave-${req.employeeId}-${dateStr}`,
                        employeeId: req.employeeId,
                        employeeName: req.employeeName,
                        department: req.department,
                        date: dateStr,
                        checkIn: '-',
                        checkOut: '-',
                        workingHours: '-',
                        lateBy: '-',
                        overtime: '-',
                        status: 'On Leave',
                        punchSource: 'Manual Correction',
                    });
                }
            });
        }
        else {
            // Revert leave records
            approvedDates.forEach((dateStr) => {
                const idx = attendanceList.findIndex((a) => a.employeeId === req.employeeId && a.date === dateStr && a.status === 'On Leave');
                if (idx !== -1) {
                    if (attendanceList[idx].id.startsWith('att-leave-')) {
                        attendanceList.splice(idx, 1);
                    }
                    else {
                        attendanceList[idx].status = 'Present';
                        attendanceList[idx].checkIn = '09:00 AM';
                        attendanceList[idx].checkOut = '06:00 PM';
                        attendanceList[idx].workingHours = '9h 00m';
                    }
                }
            });
        }
        storage.setAttendance([...attendanceList]);
    }
    catch (err) {
        console.error('Failed to sync attendance for leave:', err);
    }
}
/**
 * Dispatch an in-app notification for leave lifecycle events
 */
function dispatchLeaveNotification(title, message, targetRole = 'all', level = 'info') {
    try {
        const list = storage.getNotifications();
        list.unshift({
            id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            title,
            message,
            timestamp: 'Just now',
            type: 'Leave',
            priority: level === 'urgent' ? 'high' : level === 'warning' ? 'normal' : 'low',
            read: false,
            targetRole,
        });
        storage.setNotifications(list);
    }
    catch (err) {
        console.error('Failed to dispatch notification:', err);
    }
}
export const leaveService = {
    getBalances: async (employeeId) => {
        if (employeeId) {
            return new Promise((resolve) => setTimeout(() => resolve(storage.getBalancesForEmployee(employeeId)), 50));
        }
        const active = storage.getActiveUser();
        const targetEmpId = active?.employeeId || 'BGS-006';
        return new Promise((resolve) => setTimeout(() => resolve(storage.getBalancesForEmployee(targetEmpId, active?.name)), 50));
    },
    getAllBalances: async () => {
        return new Promise((resolve) => setTimeout(() => resolve(storage.getAllEmployeeBalances()), 50));
    },
    getRequests: async () => {
        return new Promise((resolve) => setTimeout(() => resolve(storage.getLeaveRequests()), 50));
    },
    applyLeave: async (data) => {
        // 1. Date chronology validation
        const start = new Date(data.startDate);
        const end = new Date(data.endDate);
        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            throw new Error('Invalid leave start or end date specified.');
        }
        if (end < start) {
            throw new Error('End date cannot be earlier than start date.');
        }
        // 2. Working days calculation (excluding weekends and public holidays)
        const holidays = storage.getLeaveSettings()?.companyHolidays || [];
        const calculatedDays = countWorkingDays(data.startDate, data.endDate, holidays);
        if (calculatedDays <= 0) {
            throw new Error('Selected date range contains 0 working days. Weekends and national holidays do not consume leave balance.');
        }
        // 3. Maximum single request limit (30 days unless Maternity/Paternity)
        if (data.leaveType !== 'Maternity / Paternity Leave' && calculatedDays > 30) {
            throw new Error('Single leave application cannot exceed 30 working days. Please submit in separate phases.');
        }
        // 4. Policy limits for specific leave types
        if (data.leaveType === 'Casual Leave (CL)' && calculatedDays > 3) {
            throw new Error('Casual Leave (CL) cannot exceed 3 consecutive working days per application as per BGSPL HR Policy. Please utilize Earned Leave (EL) for extended absences.');
        }
        // 5. Quota balance limit check (considering both used and pending commitments)
        const balances = storage.getBalancesForEmployee(data.employeeId, data.employeeName);
        const currentBalance = balances.find((b) => b.leaveType === data.leaveType);
        if (currentBalance) {
            const availableForNew = Math.max(0, currentBalance.totalAllocated - currentBalance.used - currentBalance.pending);
            if (calculatedDays > availableForNew) {
                throw new Error(`Insufficient leave quota: You have ${currentBalance.available} days remaining, with ${currentBalance.pending} days already pending approval (${availableForNew} days available to apply), but requested ${calculatedDays} day(s).`);
            }
        }
        // 6. Overlapping request check
        const existingRequests = storage.getLeaveRequests();
        const overlapping = checkDateConflict(existingRequests, data.employeeId, data.startDate, data.endDate);
        if (overlapping) {
            throw new Error(`Overlapping request: You already have a ${overlapping.status} leave application (${overlapping.leaveType}: ${overlapping.startDate} to ${overlapping.endDate}) covering this time period.`);
        }
        // 7. Reason & phone validation
        if (!data.reason || data.reason.trim().length < 10) {
            throw new Error('Please provide a substantive justification (minimum 10 characters).');
        }
        if (data.reason.trim().length > 500) {
            throw new Error('Reason cannot exceed 500 characters.');
        }
        if (!data.contactDuringLeave ||
            !/^(\+91[-\s]?)?[6-9]\d{9}$/.test(data.contactDuringLeave.trim())) {
            throw new Error('Please provide a valid 10-digit Indian emergency contact phone number.');
        }
        const newReq = {
            ...data,
            id: `lr-${Date.now()}`,
            appliedOn: new Date().toLocaleDateString('en-CA'),
            requestedDays: calculatedDays,
            approvedDays: 0,
            rejectedDays: 0,
            days: calculatedDays,
            status: 'Pending',
        };
        storage.setLeaveRequests([newReq, ...existingRequests]);
        // Refresh employee balance state
        storage.getBalancesForEmployee(data.employeeId, data.employeeName);
        // Notify HR
        dispatchLeaveNotification('New Leave Request Submitted', `${data.employeeName} submitted a new request for ${calculatedDays} working day(s) of ${data.leaveType}.`, 'hr', 'info');
        return new Promise((resolve) => setTimeout(() => resolve(newReq), 80));
    },
    reviewLeave: async (id, decision, approverName, approverComment, customApprovedDays) => {
        const list = storage.getLeaveRequests();
        const req = list.find((r) => r.id === id);
        if (!req)
            return false;
        let finalStatus = decision;
        let finalApprovedDays = 0;
        let finalRejectedDays = 0;
        const requested = Number(req.requestedDays || req.days) || 1;
        if (decision === 'Approved') {
            finalStatus = 'Approved';
            finalApprovedDays = requested;
            finalRejectedDays = 0;
        }
        else if (decision === 'Rejected') {
            finalStatus = 'Rejected';
            finalApprovedDays = 0;
            finalRejectedDays = requested;
        }
        else if (decision === 'Partially Approved') {
            const appr = Number(customApprovedDays);
            if (isNaN(appr) || appr <= 0) {
                finalStatus = 'Rejected';
                finalApprovedDays = 0;
                finalRejectedDays = requested;
            }
            else if (appr >= requested) {
                finalStatus = 'Approved';
                finalApprovedDays = requested;
                finalRejectedDays = 0;
            }
            else {
                finalStatus = 'Partially Approved';
                finalApprovedDays = appr;
                finalRejectedDays = requested - appr;
            }
        }
        req.status = finalStatus;
        req.requestedDays = requested;
        req.approvedDays = finalApprovedDays;
        req.rejectedDays = finalRejectedDays;
        req.days = requested; // Preserve original requested duration for backward compatibility
        req.approverName = approverName;
        req.approverComment = approverComment;
        req.reviewedAt = new Date().toISOString();
        storage.setLeaveRequests([...list]);
        // Recalculate balance for this employee
        storage.getBalancesForEmployee(req.employeeId, req.employeeName);
        // Sync Attendance
        if (finalStatus === 'Approved' || finalStatus === 'Partially Approved') {
            syncAttendanceForLeave(req, 'apply');
        }
        else {
            syncAttendanceForLeave(req, 'remove');
        }
        // Dispatch notification to employee
        const statusText = finalStatus === 'Partially Approved'
            ? `partially approved (${finalApprovedDays} of ${requested} days approved, ${finalRejectedDays} days rejected)`
            : finalStatus.toLowerCase();
        dispatchLeaveNotification(`Leave Request ${finalStatus}`, `Your request for ${req.leaveType} (${req.startDate} to ${req.endDate}) has been ${statusText} by ${approverName}.${approverComment ? ` Remark: "${approverComment}"` : ''}`, 'employee', finalStatus === 'Approved' ? 'success' : finalStatus === 'Partially Approved' ? 'warning' : 'urgent');
        return new Promise((resolve) => setTimeout(() => resolve(true), 80));
    },
    cancelLeave: async (id) => {
        const list = storage.getLeaveRequests();
        const req = list.find((r) => r.id === id);
        if (!req)
            return false;
        const prevStatus = req.status;
        req.status = 'Cancelled';
        storage.setLeaveRequests([...list]);
        // Recompute balance (approved days refund is automatically handled because used sums Approved/PartiallyApproved)
        storage.getBalancesForEmployee(req.employeeId, req.employeeName);
        // Revert attendance if it was previously approved
        if (prevStatus === 'Approved' || prevStatus === 'Partially Approved') {
            syncAttendanceForLeave(req, 'remove');
        }
        dispatchLeaveNotification('Leave Application Cancelled', `Leave request for ${req.leaveType} (${req.startDate} to ${req.endDate}) has been cancelled. Any deducted quota has been refunded.`, 'employee', 'info');
        return new Promise((resolve) => setTimeout(() => resolve(true), 80));
    },
    getLeaveTypes: async () => {
        return new Promise((resolve) => setTimeout(() => resolve(storage.getLeaveTypes()), 50));
    },
    createLeaveType: async (config) => {
        const list = storage.getLeaveTypes();
        const newType = {
            ...config,
            id: `lt-${Date.now()}`,
        };
        storage.setLeaveTypes([...list, newType]);
        return new Promise((resolve) => setTimeout(() => resolve(newType), 80));
    },
};
