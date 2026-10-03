import { mobileStorage } from '../storage';
import { LeaveRequest, LeaveBalance, AttendanceRecord, AppNotification } from '../types';
import { LEAVE_POLICIES, LEAVE_TYPE_CONFIGS } from '../constants';
import { countWorkingDays, getWorkingDates } from '../utils/workingDays';

/**
 * Shared helper to check if a proposed date range conflicts with an existing leave request.
 */
export function checkDateConflict(
  existingRequests: LeaveRequest[],
  employeeId: string,
  startDateStr: string,
  endDateStr: string,
  excludeRequestId?: string
): LeaveRequest | null {
  const s = new Date(startDateStr);
  const e = new Date(endDateStr);
  return (
    existingRequests.find((r) => {
      if (r.id === excludeRequestId) return false;
      if (r.employeeId !== employeeId) return false;
      if (r.status === 'Rejected' || r.status === 'Cancelled') return false;
      const rStart = new Date(r.startDate);
      const rEnd = new Date(r.endDate);
      return s <= rEnd && e >= rStart;
    }) || null
  );
}

export interface ApplyLeaveInput {
  employeeId: string;
  employeeName: string;
  department?: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  reason: string;
  contactDuringLeave?: string;
}

export class LeaveService {
  /**
   * Calculate working days excluding Saturdays, Sundays, and 2026 National Holidays
   */
  calculateWorkingDays(startDate: string, endDate: string): number {
    return countWorkingDays(startDate, endDate);
  }

  /**
   * Dynamically compute quota ledger for an employee based on initial allocations and real requests
   */
  async getBalances(employeeId: string, employeeName?: string): Promise<LeaveBalance[]> {
    const requests = await mobileStorage.getLeaves();
    const quotas = LEAVE_TYPE_CONFIGS;

    const empRequests = requests.filter((r) => r.employeeId === employeeId);
    const balances: LeaveBalance[] = quotas.map((q) => {
      // Approved used days: from Approved or Partially Approved requests
      const used = empRequests
        .filter(
          (r) =>
            (r.status === 'Approved' || r.status === 'Partially Approved') &&
            (r.leaveType === q.leaveType || r.leaveType.startsWith(q.code))
        )
        .reduce((sum, r) => sum + (Number(r.approvedDays ?? r.days) || 0), 0);

      // Pending committed days: from Pending requests
      const pending = empRequests
        .filter(
          (r) =>
            r.status === 'Pending' &&
            (r.leaveType === q.leaveType || r.leaveType.startsWith(q.code))
        )
        .reduce((sum, r) => sum + (Number(r.requestedDays ?? r.days) || 0), 0);

      const available = Math.max(0, q.totalAllocated - used);

      return {
        id: `bal-${employeeId}-${q.code}`,
        employeeId,
        employeeName: employeeName || '',
        leaveType: q.leaveType,
        totalAllocated: q.totalAllocated,
        allocated: q.allocated,
        used,
        pending,
        available,
        color: q.color,
      };
    });

    const allBalances = await mobileStorage.getLeaveBalances();
    allBalances[employeeId] = balances;
    await mobileStorage.setLeaveBalances(allBalances);
    return balances;
  }

  /**
   * Retrieve all employee balances across the organization
   */
  async getAllBalances(): Promise<Record<string, LeaveBalance[]>> {
    const employees = await mobileStorage.getEmployees();
    const result: Record<string, LeaveBalance[]> = {};
    for (const emp of employees) {
      result[emp.employeeId] = await this.getBalances(emp.employeeId, emp.name);
    }
    return result;
  }

  /**
   * Retrieve all leave applications, optionally filtered for a single employee
   */
  async getAllRequests(employeeId?: string): Promise<LeaveRequest[]> {
    const leaves = await mobileStorage.getLeaves();
    if (employeeId) {
      return leaves.filter((l) => l.employeeId === employeeId);
    }
    return leaves;
  }

  /**
   * Submit a new leave application with complete business policy and quota validation
   */
  async applyLeave(data: ApplyLeaveInput): Promise<LeaveRequest> {
    const { employeeId, employeeName, department, leaveType, startDate, endDate, reason, contactDuringLeave } = data;

    // 1. Date chronology validation
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new Error('Invalid leave start or end date specified.');
    }
    if (end < start) {
      throw new Error('End date cannot be earlier than start date.');
    }

    // 2. Working days calculation (excluding weekends and public holidays)
    const calculatedDays = countWorkingDays(startDate, endDate);
    if (calculatedDays <= 0) {
      throw new Error('Selected date range contains 0 working days. Weekends and national holidays do not consume leave balance.');
    }

    // 3. Maximum single request limit (30 days unless Maternity / Paternity)
    if (!leaveType.includes('Maternity') && calculatedDays > 30) {
      throw new Error('Single leave application cannot exceed 30 working days. Please submit in separate phases.');
    }

    // 4. Policy limits for Casual Leave (CL <= 3 consecutive working days)
    if (
      (leaveType.includes('Casual') || leaveType === 'CL') &&
      calculatedDays > LEAVE_POLICIES.maxConsecutiveCasualLeave
    ) {
      throw new Error(
        `Casual Leave (CL) cannot exceed ${LEAVE_POLICIES.maxConsecutiveCasualLeave} consecutive working days per application as per BGSPL HR Policy. Please utilize Earned Leave (EL) for extended absences.`
      );
    }

    // 5. Quota balance limit check (considering both used and pending commitments)
    const balances = await this.getBalances(employeeId, employeeName);
    const currentBalance = balances.find(
      (b) => b.leaveType === leaveType || leaveType.startsWith(b.leaveType.split('(')[0].trim())
    );
    if (currentBalance) {
      const availableForNew = Math.max(0, currentBalance.totalAllocated - currentBalance.used - currentBalance.pending);
      if (calculatedDays > availableForNew) {
        throw new Error(
          `Insufficient leave quota: You have ${currentBalance.available} days remaining, with ${currentBalance.pending} days already pending approval (${availableForNew} days available to apply), but requested ${calculatedDays} day(s).`
        );
      }
    }

    // 6. Overlapping request check
    const existingRequests = await mobileStorage.getLeaves();
    const overlapping = checkDateConflict(existingRequests, employeeId, startDate, endDate);
    if (overlapping) {
      throw new Error(
        `Overlapping request: You already have a ${overlapping.status} leave application (${overlapping.leaveType}: ${overlapping.startDate} to ${overlapping.endDate}) covering this time period.`
      );
    }

    // 7. Reason & phone validation
    if (!reason || reason.trim().length < 10) {
      throw new Error('Please provide a substantive justification (minimum 10 characters).');
    }
    if (reason.trim().length > 500) {
      throw new Error('Reason cannot exceed 500 characters.');
    }
    if (
      contactDuringLeave &&
      !/^(\+91[-\s]?)?[6-9]\d{9}$/.test(contactDuringLeave.trim())
    ) {
      throw new Error('Please provide a valid 10-digit Indian emergency contact phone number.');
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const newReq: LeaveRequest = {
      id: `lr-${Date.now()}`,
      employeeId,
      employeeName,
      department: department || 'Geology & Mineral Exploration',
      leaveType,
      startDate,
      endDate,
      requestedDays: calculatedDays,
      approvedDays: 0,
      rejectedDays: 0,
      days: calculatedDays,
      reason: reason.trim(),
      contactDuringLeave: contactDuringLeave ? contactDuringLeave.trim() : undefined,
      status: 'Pending',
      appliedAt: todayStr,
      appliedOn: todayStr,
    };

    existingRequests.unshift(newReq);
    await mobileStorage.setLeaves(existingRequests);

    // Refresh employee balance state
    await this.getBalances(employeeId, employeeName);

    // Notify HR
    await this.dispatchNotification(
      'New Leave Request Submitted',
      `${employeeName} submitted a new request for ${calculatedDays} working day(s) of ${leaveType}.`,
      'info'
    );

    return newReq;
  }

  /**
   * Adjudicate a leave request: Full Approval, Partial Approval, or Rejection
   */
  async reviewLeave(
    id: string,
    decision: 'Approved' | 'Partially Approved' | 'Rejected',
    approverName: string,
    approverComment: string,
    customApprovedDays?: number,
    approverEmployeeId?: string
  ): Promise<boolean> {
    const list = await mobileStorage.getLeaves();
    const req = list.find((r) => r.id === id);
    if (!req) throw new Error('Leave request not found.');

    // 4-Eyes Principle self-review guard
    if (approverEmployeeId && approverEmployeeId === req.employeeId) {
      throw new Error('4-Eyes Principle Violation: You cannot adjudicate your own leave application.');
    }

    // Rejection rule: Mandatory rejection reason
    if (decision === 'Rejected' && (!approverComment || !approverComment.trim())) {
      throw new Error('A formal rejection reason is mandatory when declining an employee leave request.');
    }

    const requested = Number(req.requestedDays || req.days) || 1;
    let finalStatus: 'Approved' | 'Partially Approved' | 'Rejected' = decision;
    let finalApprovedDays = 0;
    let finalRejectedDays = 0;

    if (decision === 'Approved') {
      finalStatus = 'Approved';
      finalApprovedDays = requested;
      finalRejectedDays = 0;
    } else if (decision === 'Rejected') {
      finalStatus = 'Rejected';
      finalApprovedDays = 0;
      finalRejectedDays = requested;
    } else if (decision === 'Partially Approved') {
      const appr = Number(customApprovedDays);
      if (isNaN(appr) || appr <= 0) {
        finalStatus = 'Rejected';
        finalApprovedDays = 0;
        finalRejectedDays = requested;
      } else if (appr >= requested) {
        finalStatus = 'Approved';
        finalApprovedDays = requested;
        finalRejectedDays = 0;
      } else {
        finalStatus = 'Partially Approved';
        finalApprovedDays = appr;
        finalRejectedDays = requested - appr;
      }
    }

    req.status = finalStatus;
    req.requestedDays = requested;
    req.approvedDays = finalApprovedDays;
    req.rejectedDays = finalRejectedDays;
    req.days = requested;
    req.approverName = approverName;
    req.approverComment = approverComment.trim();
    req.rejectionReason = finalStatus === 'Rejected' ? approverComment.trim() : undefined;
    req.reviewedAt = new Date().toISOString();

    await mobileStorage.setLeaves(list);

    // Recalculate balance for this employee
    await this.getBalances(req.employeeId, req.employeeName);

    // Sync Attendance records
    if (finalStatus === 'Approved' || finalStatus === 'Partially Approved') {
      await this.syncAttendanceForLeave(req, 'apply');
    } else {
      await this.syncAttendanceForLeave(req, 'remove');
    }

    // Notification to employee
    const statusMsg =
      finalStatus === 'Partially Approved'
        ? `partially approved (${finalApprovedDays} of ${requested} days approved, ${finalRejectedDays} days rejected)`
        : finalStatus.toLowerCase();

    await this.dispatchNotification(
      `Leave Request ${finalStatus}`,
      `Your request for ${req.leaveType} (${req.startDate} to ${req.endDate}) has been ${statusMsg} by ${approverName}.${approverComment ? ` Remark: "${approverComment}"` : ''}`,
      finalStatus === 'Approved' ? 'success' : finalStatus === 'Partially Approved' ? 'warning' : 'danger'
    );

    return true;
  }

  /**
   * Cancel or withdraw a pending/approved leave application
   */
  async cancelLeave(id: string): Promise<boolean> {
    const list = await mobileStorage.getLeaves();
    const req = list.find((r) => r.id === id);
    if (!req) return false;

    const prevStatus = req.status;
    req.status = 'Cancelled';
    await mobileStorage.setLeaves(list);

    // Recompute balance (approved days refund is automatically handled because used sums Approved/PartiallyApproved)
    await this.getBalances(req.employeeId, req.employeeName);

    // Revert attendance if it was previously approved
    if (prevStatus === 'Approved' || prevStatus === 'Partially Approved') {
      await this.syncAttendanceForLeave(req, 'remove');
    }

    await this.dispatchNotification(
      'Leave Application Cancelled',
      `Leave request for ${req.leaveType} (${req.startDate} to ${req.endDate}) has been cancelled. Any deducted quota has been refunded.`,
      'info'
    );

    return true;
  }

  /**
   * Synchronize attendance records when leave is approved, rejected, or cancelled
   */
  async syncAttendanceForLeave(req: LeaveRequest, action: 'apply' | 'remove'): Promise<void> {
    try {
      const workingDates = getWorkingDates(req.startDate, req.endDate);
      const daysCount = req.approvedDays ?? req.requestedDays ?? req.days ?? 1;
      const approvedDates = workingDates.slice(0, Math.max(1, daysCount));
      const attendanceList = await mobileStorage.getAttendance();

      if (action === 'apply') {
        approvedDates.forEach((dateStr) => {
          const existing = attendanceList.find(
            (a) => a.employeeId === req.employeeId && a.date === dateStr
          );
          if (existing) {
            existing.status = 'On-Leave';
            existing.punchIn = '-';
            existing.punchOut = '-';
            existing.checkIn = '-';
            existing.checkOut = '-';
            existing.workingHours = '-';
            existing.durationHours = 0;
            existing.lateBy = '-';
            existing.overtime = '-';
            existing.punchSource = 'Approved Leave';
            existing.workLocation = 'Approved Leave';
          } else {
            attendanceList.unshift({
              id: `att-leave-${req.employeeId}-${dateStr}`,
              employeeId: req.employeeId,
              employeeName: req.employeeName,
              department: req.department || 'Geology & Mineral Exploration',
              date: dateStr,
              punchIn: '-',
              punchOut: '-',
              checkIn: '-',
              checkOut: '-',
              durationHours: 0,
              workingHours: '-',
              lateBy: '-',
              overtime: '-',
              status: 'On-Leave',
              punchSource: 'Approved Leave',
              workLocation: 'Approved Leave',
            });
          }
        });
      } else {
        // Revert leave records
        approvedDates.forEach((dateStr) => {
          const idx = attendanceList.findIndex(
            (a) =>
              a.employeeId === req.employeeId &&
              a.date === dateStr &&
              (a.status === 'On-Leave' || a.status === 'On Leave')
          );
          if (idx !== -1) {
            if (attendanceList[idx].id.startsWith('att-leave-')) {
              attendanceList.splice(idx, 1);
            } else {
              attendanceList[idx].status = 'Present';
              attendanceList[idx].punchIn = '09:00 AM';
              attendanceList[idx].punchOut = '06:00 PM';
              attendanceList[idx].checkIn = '09:00 AM';
              attendanceList[idx].checkOut = '06:00 PM';
              attendanceList[idx].workingHours = '9h 00m';
              attendanceList[idx].durationHours = 9;
              attendanceList[idx].punchSource = 'System Reset';
            }
          }
        });
      }
      await mobileStorage.setAttendance(attendanceList);
    } catch (err) {
      console.error('Failed to sync attendance for leave:', err);
    }
  }

  /**
   * Helper to dispatch system notifications
   */
  private async dispatchNotification(
    title: string,
    message: string,
    type: 'success' | 'warning' | 'info' | 'danger'
  ): Promise<void> {
    try {
      const list = await mobileStorage.getNotifications();
      const newNotif: AppNotification = {
        id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        title,
        message,
        type,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        read: false,
      };
      list.unshift(newNotif);
      await mobileStorage.setNotifications(list);
    } catch (e) {
      console.error('Failed to dispatch leave notification:', e);
    }
  }

  // Backward compatibility alias for approveLeave
  async approveLeave(id: string, approverName: string = 'Authorized Approver', comment: string = 'Approved'): Promise<void> {
    await this.reviewLeave(id, 'Approved', approverName, comment);
  }

  // Backward compatibility alias for rejectLeave
  async rejectLeave(id: string, rejectionReason: string, approverName: string = 'Authorized Approver'): Promise<void> {
    await this.reviewLeave(id, 'Rejected', approverName, rejectionReason);
  }
}

export const leaveService = new LeaveService();
