import { storage, LEAVE_COLORS } from '@/core/storage/storage';
import { api } from '@/core/api/apiClient';
import { countWorkingDays } from '@/modules/leave/utils/workingDays';
import { weeklyOffFor } from '@/modules/attendance/utils/weeklyOff';
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
/*
 * Requests saved by the server before it stored the working days carry only daysCount (sometimes a wrong 1).
 * Their working days are counted again from the dates, the person's weekly off and the holidays.
 */
function normalizeLeave(r) {
    if (r.requestedDays)
        return r;
    const holidays = storage.getLeaveSettings()?.companyHolidays || [];
    const counted = countWorkingDays(r.startDate, r.endDate, holidays, weeklyOffFor(r.employeeId));
    const requested = counted > 0 ? counted : Number(r.daysCount) || 1;
    const approved = r.approvedDays ?? (r.status === 'Approved' ? requested : 0);
    return {
        ...r,
        requestedDays: requested,
        days: requested,
        approvedDays: approved,
        rejectedDays: r.rejectedDays ?? (r.status === 'Rejected' ? requested : 0),
        appliedOn: r.appliedOn || (r.appliedAt || '').slice(0, 10),
        approverComment: r.approverComment ?? r.remarks,
    };
}

const refreshRequests = async () => {
    const res = await api.get('/leaves/requests');
    const list = (Array.isArray(res?.data) ? res.data : []).map(normalizeLeave);
    storage.setLeaveRequests(list);
    return list;
};

/*
 * Leave requests, reviews and cancellations are saved by the API, which also updates the attendance register
 * and notifies the people involved. Checks done here (working days, quota, overlap) give instant feedback; the
 * server repeats the ones that matter.
 */
export const leaveService = {
    getBalances: async (employeeId) => {
        const target = employeeId || storage.getActiveUser()?.employeeId;
        if (!target)
            return [];
        const res = await api.get(`/leaves/balances/${encodeURIComponent(target)}`);
        return (res?.data?.balances || []).map((b) => ({
            ...b,
            totalAllocated: b.allocated,
            color: LEAVE_COLORS[b.code] || '#475569',
        }));
    },
    /* { employeeId: balances[] } for everyone the caller may see, computed by the API. */
    getAllBalances: async () => {
        const res = await api.get('/leaves/balances');
        const out = {};
        for (const row of Array.isArray(res?.data) ? res.data : []) {
            out[row.employeeId] = (row.balances || []).map((b) => ({ ...b, totalAllocated: b.allocated, color: LEAVE_COLORS[b.code] || '#475569' }));
        }
        return out;
    },
    getRequests: refreshRequests,
    applyLeave: async (data) => {
        const start = new Date(data.startDate);
        const end = new Date(data.endDate);
        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            throw new Error('Choose valid start and end dates.');
        }
        if (end < start) {
            throw new Error('The end date cannot be before the start date.');
        }
        const holidays = storage.getLeaveSettings()?.companyHolidays || [];
        const calculatedDays = countWorkingDays(data.startDate, data.endDate, holidays, weeklyOffFor(data.employeeId));
        if (calculatedDays <= 0) {
            throw new Error('The selected dates contain no working days. Weekly offs and holidays do not use leave.');
        }
        const balances = await leaveService.getBalances(data.employeeId);
        const currentBalance = balances.find((b) => b.leaveType === data.leaveType);
        const canApply = currentBalance ? (currentBalance.availableToApply ?? currentBalance.available) : 0;
        if (currentBalance && calculatedDays > canApply) {
            throw new Error(`Not enough ${data.leaveType} balance: ${canApply} day(s) available, ${calculatedDays} requested.`);
        }
        const overlapping = checkDateConflict(storage.getLeaveRequests(), data.employeeId, data.startDate, data.endDate);
        if (overlapping) {
            throw new Error(`You already have a ${overlapping.status.toLowerCase()} leave from ${overlapping.startDate} to ${overlapping.endDate}.`);
        }
        if (!data.reason || data.reason.trim().length < 10) {
            throw new Error('Please describe the reason in at least 10 characters.');
        }
        if (data.reason.trim().length > 500) {
            throw new Error('The reason cannot exceed 500 characters.');
        }
        if (!data.contactDuringLeave || !/^(\+91[-\s]?)?[6-9]\d{9}$/.test(data.contactDuringLeave.trim())) {
            throw new Error('Enter a valid 10-digit mobile number to reach you during leave.');
        }
        const res = await api.post('/leaves/requests', {
            employeeId: data.employeeId,
            leaveType: data.leaveType,
            startDate: data.startDate,
            endDate: data.endDate,
            requestedDays: calculatedDays,
            reason: data.reason.trim(),
            contactDuringLeave: data.contactDuringLeave.trim(),
            halfDay: data.halfDay,
        });
        await refreshRequests().catch(() => null);
        return normalizeLeave(res.data);
    },
    reviewLeave: async (id, decision, _approverName, approverComment, customApprovedDays) => {
        await api.put(`/leaves/requests/${encodeURIComponent(id)}/status`, {
            status: decision,
            approverComment,
            approvedDays: customApprovedDays,
        });
        await refreshRequests().catch(() => null);
        return true;
    },
    cancelLeave: async (id) => {
        await api.put(`/leaves/requests/${encodeURIComponent(id)}/cancel`);
        await refreshRequests().catch(() => null);
        return true;
    },
    getLeaveTypes: async () => {
        const res = await api.get('/leaves/types');
        const list = Array.isArray(res?.data) ? res.data : storage.getLeaveTypes();
        storage.setLeaveTypes(list);
        return list;
    },
    createLeaveType: async (config) => {
        const res = await api.post('/leaves/types', config);
        await leaveService.getLeaveTypes().catch(() => null);
        return res.data;
    },
};
