import { db } from '../services/db.js';

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
      const { employeeId } = req.params;
      const allBalances = db.get('leave_balances');
      const requests = db.get('leaves');

      const empBalances = allBalances.filter((b) => b.employeeId === employeeId);
      const empRequests = requests.filter((r) => r.employeeId === employeeId);

      res.json({
        success: true,
        data: {
          employeeId,
          balances: empBalances.length ? empBalances : [
            { leaveType: 'Privilege Leave', allocated: 15, used: 2, pending: 0, available: 13 },
            { leaveType: 'Casual Leave', allocated: 12, used: 3, pending: 1, available: 8 },
            { leaveType: 'Sick Leave', allocated: 10, used: 1, pending: 0, available: 9 },
          ],
          recentRequests: empRequests.slice(0, 5),
        },
      });
    } catch (err) {
      next(err);
    }
  },

  getRequests: async (req, res, next) => {
    try {
      const { status, employeeId } = req.query;
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
      const { employeeId, leaveType, startDate, endDate, daysCount, requestedDays, days, reason, contactDuringLeave } = req.body;
      // The app sends the working days it counted (weekly offs and holidays left out).
      const workingDays = Number(requestedDays ?? days ?? daysCount) || 1;
      if (!employeeId || !leaveType || !startDate || !endDate || !reason) {
        return res.status(400).json({ success: false, error: 'All fields are required to apply for leave.' });
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
        reason,
        contactDuringLeave: contactDuringLeave || '',
        status: 'Pending',
        appliedOn: new Date().toISOString().slice(0, 10),
        appliedAt: new Date().toISOString(),
      };

      db.insert('leaves', newLeave);
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
      const requested = Number(current?.requestedDays ?? current?.daysCount) || 1;
      const approved = status === 'Rejected' ? 0 : status === 'Approved' ? requested : Math.min(requested, Number(approvedDays) || 0);

      const updated = db.update('leaves', id, {
        status,
        approvedDays: approved,
        rejectedDays: requested - approved,
        approverComment: approverComment || remarks || '',
        remarks: remarks || approverComment || '',
        approverName: req.user?.name || 'HR Admin',
        approvedAt: new Date().toISOString(),
      });

      if (!updated) {
        return res.status(404).json({ success: false, error: 'Leave request not found.' });
      }

      // If approved, mark attendance records for those dates as 'On Leave'
      if (status === 'Approved' || status === 'Partially Approved') {
        const attendanceList = db.get('attendance');
        const start = new Date(updated.startDate);
        const end = new Date(updated.endDate);

        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
          const dateStr = d.toISOString().slice(0, 10);
          const existing = attendanceList.find(
            (a) => a.employeeId === updated.employeeId && a.date === dateStr,
          );
          if (existing) {
            existing.status = 'On Leave';
            existing.checkIn = '-';
            existing.checkOut = '-';
            existing.workingHours = '-';
          } else {
            db.insert('attendance', {
              id: `att-lv-${Date.now()}-${dateStr}`,
              employeeId: updated.employeeId,
              employeeName: updated.employeeName,
              department: updated.department,
              date: dateStr,
              checkIn: '-',
              checkOut: '-',
              workingHours: '-',
              lateBy: '-',
              overtime: '-',
              status: 'On Leave',
              punchSource: 'System (Approved Leave)',
            });
          }
        }
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
      const hrRoles = ['Super Admin', 'Director', 'Managing Director', 'Admin', 'HR Manager', 'HR Executive', 'Management'];
      const normalize = (v) => String(v || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
      const isOwner = (req.user?.employeeId && normalize(req.user.employeeId) === normalize(item.employeeId)) || (req.user?.name && String(req.user.name).trim().toLowerCase() === String(item.employeeName).trim().toLowerCase()) || (!req.user?.employeeId && !item.employeeId);
      if (req.user?.employeeId && !isOwner && !hrRoles.includes(req.user.role)) {
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

      // If it was previously approved, remove 'On Leave' from attendance
      if (prevStatus === 'Approved' || prevStatus === 'Partially Approved') {
        const attendanceList = db.get('attendance');
        const start = new Date(item.startDate);
        const end = new Date(item.endDate);
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
          const dateStr = d.toISOString().slice(0, 10);
          const attIdx = attendanceList.findIndex(
            (a) => a.employeeId === item.employeeId && a.date === dateStr && a.status === 'On Leave'
          );
          if (attIdx !== -1) {
            attendanceList.splice(attIdx, 1);
          }
        }
        db.set('attendance', attendanceList);
      }

      res.json({ success: true, data: updated });
    } catch (err) {
      next(err);
    }
  },
};