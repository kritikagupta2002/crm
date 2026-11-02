import { audit } from '../services/audit.js';
import { today } from '../services/dates.js';
import { db } from '../services/db.js';
import { workingDates } from '../services/workCalendar.js';
import { can, scopedEmployeeId } from '../config/permissions.js';

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const ACTIVE = ['Pending', 'Approved', 'Partially Approved'];

/* Annual quota for a leave type: Leave settings override the leave type's own quota for the standard types. */
const SETTING_FOR_CODE = { CL: 'annualCasualLeave', SL: 'annualSickLeave', EL: 'annualEarnedLeave', CO: 'annualCompOffLeave', FDL: 'annualFieldDutyLeave' };
function quotaFor(type) {
  const settings = db.get('leave_settings') || {};
  const fromSettings = Number(settings[SETTING_FOR_CODE[type.code]]);
  return Number.isFinite(fromSettings) && settings[SETTING_FOR_CODE[type.code]] !== undefined ? fromSettings : Number(type.annualQuota) || 0;
}

function notify(fields) {
  db.insert('notifications', {
    id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    type: 'Leave',
    read: false,
    createdAt: new Date().toISOString(),
    ...fields,
  });
}

export const leaveController = {
  getTypes: async (req, res, next) => {
    try {
      const types = db.get('leave_types');
      res.json({ success: true, data: types });
    } catch (err) {
      next(err);
    }
  },

  getBalances: async (req, res, next) => {
    try {
      const employeeId = scopedEmployeeId(req, req.params.employeeId, 'leave.view_all');
      const year = String(new Date().getFullYear());
      const empRequests = db.get('leaves').filter((r) => r.employeeId === employeeId);
      const thisYear = empRequests.filter((r) => String(r.startDate).startsWith(year));

      // Balances are computed from each leave type's annual quota and this year's requests, never stored guesses.
      const balances = db.get('leave_types').map((type) => {
        const ofType = thisYear.filter((r) => r.leaveType === type.name);
        const used = ofType.filter((r) => r.status === 'Approved' || r.status === 'Partially Approved')
          .reduce((sum, r) => sum + (Number(r.approvedDays) || 0), 0);
        const pending = ofType.filter((r) => r.status === 'Pending').reduce((sum, r) => sum + (Number(r.requestedDays) || 0), 0);
        const allocated = quotaFor(type);
        return { leaveType: type.name, code: type.code, allocated, used, pending, available: Math.max(0, allocated - used - pending) };
      });

      res.json({ success: true, data: { employeeId, balances, recentRequests: empRequests.slice(0, 5) } });
    } catch (err) {
      next(err);
    }
  },

  getRequests: async (req, res, next) => {
    try {
      const { status } = req.query;
      const employeeId = scopedEmployeeId(req, req.query.employeeId, 'leave.view_all');
      let requests = db.get('leaves');

      if (status) {
        requests = requests.filter((r) => r.status === status);
      }
      if (employeeId) {
        requests = requests.filter((r) => r.employeeId === employeeId);
      }

      res.json({ success: true, count: requests.length, data: requests });
    } catch (err) {
      next(err);
    }
  },

  apply: async (req, res, next) => {
    try {
      const { leaveType, startDate, endDate, daysCount, requestedDays, days, reason, contactDuringLeave } = req.body;
      const employeeId = scopedEmployeeId(req, req.body.employeeId, 'leave.approve') || req.user.employeeId;
      void requestedDays; void days; void daysCount;
      if (!employeeId || !leaveType || !DATE.test(String(startDate)) || !DATE.test(String(endDate)) || !String(reason || '').trim()) {
        return res.status(400).json({ success: false, error: 'Leave type, dates and reason are required.' });
      }
      if (endDate < startDate) {
        return res.status(400).json({ success: false, error: 'The end date cannot be before the start date.' });
      }
      if (!db.get('leave_types').some((t) => t.name === leaveType)) {
        return res.status(400).json({ success: false, error: 'Unknown leave type.' });
      }
      // Working days are counted here, not taken from the request: weekly offs and holidays never use leave.
      const workingDays = workingDates(employeeId, startDate, endDate).length;
      if (workingDays === 0) {
        return res.status(400).json({ success: false, error: 'The selected dates contain no working days.' });
      }
      const overlap = db.get('leaves').find((l) => l.employeeId === employeeId && ACTIVE.includes(l.status) && l.startDate <= endDate && l.endDate >= startDate);
      if (overlap) {
        return res.status(409).json({ success: false, error: `You already have a ${overlap.status.toLowerCase()} leave from ${overlap.startDate} to ${overlap.endDate}.` });
      }

      const employees = db.get('employees');
      const emp = employees.find((e) => e.employeeId === employeeId);

      const newLeave = {
        id: `leave-${Date.now()}`,
        employeeId,
        employeeName: emp?.name || employeeId,
        department: emp?.employment?.department || 'General',
        leaveType,
        startDate,
        endDate,
        daysCount: workingDays,
        requestedDays: workingDays,
        days: workingDays,
        approvedDays: 0,
        rejectedDays: 0,
        reason: String(reason).trim().slice(0, 1000),
        contactDuringLeave: String(contactDuringLeave || '').slice(0, 200),
        status: 'Pending',
        appliedOn: today(),
        appliedAt: new Date().toISOString(),
      };

      db.insert('leaves', newLeave);
      notify({
        title: 'New leave request',
        message: `${newLeave.employeeName} requested ${workingDays} day(s) of ${leaveType} (${startDate} to ${endDate}).`,
        targetRole: 'hr',
        priority: 'normal',
      });
      res.status(201).json({ success: true, data: newLeave });
    } catch (err) {
      next(err);
    }
  },

  review: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { status, remarks, approverComment, approvedDays } = req.body;

      if (!['Approved', 'Partially Approved', 'Rejected'].includes(status)) {
        return res.status(400).json({ success: false, error: 'Status must be Approved, Partially Approved or Rejected.' });
      }
      const current = db.get('leaves').find((r) => r.id === id);
      if (!current) return res.status(404).json({ success: false, error: 'Leave request not found.' });
      if (current.status !== 'Pending') {
        return res.status(409).json({ success: false, error: `This request was already ${String(current.status).toLowerCase()}.` });
      }
      if (current.employeeId === req.user.employeeId && req.user.role !== 'Managing Director') {
        return res.status(403).json({ success: false, error: 'You cannot approve your own leave request.' });
      }
      const requested = Number(current?.requestedDays ?? current?.daysCount) || 1;
      const approved = status === 'Rejected' ? 0 : status === 'Approved' ? requested : Math.min(requested, Number(approvedDays) || 0);

      const updated = db.update('leaves', id, {
        status,
        approvedDays: approved,
        rejectedDays: requested - approved,
        approverComment: approverComment || remarks || '',
        remarks: remarks || approverComment || '',
        approverName: req.user.name,
        approvedAt: new Date().toISOString(),
      });

      if (!updated) {
        return res.status(404).json({ success: false, error: 'Leave request not found.' });
      }

      audit(req, 'review', 'leaves', updated.id, `${updated.employeeName}'s ${updated.leaveType} ${status.toLowerCase()}`);
      notify({
        title: `Leave ${status.toLowerCase()}`,
        message: `Your ${updated.leaveType} request (${updated.startDate} to ${updated.endDate}) was ${status.toLowerCase()} by ${req.user.name}.${updated.approverComment ? ` Note: ${updated.approverComment}` : ''}`,
        targetEmployeeId: updated.employeeId,
        priority: status === 'Rejected' ? 'high' : 'normal',
      });

      // Approved days go into the attendance register: only working days (weekly offs and holidays are skipped),
      // and only as many as were approved. A day with a real punch is left as it is.
      if (status === 'Approved' || status === 'Partially Approved') {
        const days = workingDates(updated.employeeId, updated.startDate, updated.endDate).slice(0, approved);
        const list = db.get('attendance');
        const punched = new Set(list.filter((a) => a.employeeId === updated.employeeId && a.checkIn && a.checkIn !== '-').map((a) => a.date));
        const keep = list.filter((a) => !(a.employeeId === updated.employeeId && days.includes(a.date) && !punched.has(a.date)));
        const leaveRows = days.filter((d) => !punched.has(d)).map((d) => ({
          id: `att-lv-${updated.id}-${d}`,
          employeeId: updated.employeeId,
          employeeName: updated.employeeName,
          department: updated.department,
          date: d,
          checkIn: '-',
          checkOut: '-',
          workingHours: '-',
          lateBy: '-',
          overtime: '-',
          status: 'On Leave',
          punchSource: 'Approved leave',
          leaveId: updated.id,
        }));
        db.set('attendance', [...leaveRows, ...keep]);
      }

      res.json({ success: true, data: updated });
    } catch (err) {
      next(err);
    }
  },
  cancel: async (req, res, next) => {
    try {
      const { id } = req.params;
      const requests = db.get('leaves');
      const item = requests.find((r) => r.id === id);
      if (!item) {
        return res.status(404).json({ success: false, error: 'Leave request not found.' });
      }

      // Only the person who applied (or the HR team) withdraws a request, and only while it is pending or approved.
      if (item.employeeId !== req.user.employeeId && !can(req.user, 'leave.approve')) {
        return res.status(403).json({ success: false, error: 'You can only withdraw your own leave request.' });
      }
      if (!['Pending', 'Approved', 'Partially Approved'].includes(item.status)) {
        return res.status(400).json({ success: false, error: `This request is already ${String(item.status).toLowerCase()}.` });
      }
      const prevStatus = item.status;
      const updated = db.update('leaves', id, {
        status: 'Cancelled',
        cancelledAt: new Date().toISOString(),
      });

      // A cancelled approval takes its leave days back out of the register.
      if (prevStatus === 'Approved' || prevStatus === 'Partially Approved') {
        db.set('attendance', db.get('attendance').filter((a) => !(a.leaveId === item.id || (a.employeeId === item.employeeId && a.status === 'On Leave' && !a.checkIn?.match(/\d/) && a.date >= item.startDate && a.date <= item.endDate && !a.leaveId))));
      }

      res.json({ success: true, data: updated });
    } catch (err) {
      next(err);
    }
  },
};