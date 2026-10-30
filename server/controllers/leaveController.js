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
      const { employeeId, leaveType, startDate, endDate, daysCount, reason } = req.body;
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
        daysCount: Number(daysCount) || 1,
        reason,
        status: 'Pending',
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
      const { status, remarks } = req.body;

      if (!['Approved', 'Rejected'].includes(status)) {
        return res.status(400).json({ success: false, error: 'Status must be Approved or Rejected.' });
      }

      const updated = db.update('leaves', id, {
        status,
        remarks: remarks || '',
        approverName: req.user?.name || 'HR Admin',
        approvedAt: new Date().toISOString(),
      });

      if (!updated) {
        return res.status(404).json({ success: false, error: 'Leave request not found.' });
      }

      // If approved, mark attendance records for those dates as 'On Leave'
      if (status === 'Approved') {
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
};

