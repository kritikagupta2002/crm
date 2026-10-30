import { db } from '../services/db.js';

export const shiftController = {
  getAll: async (req, res, next) => {
    try {
      const shifts = db.get('shifts');
      res.json({ success: true, count: shifts.length, data: shifts });
    } catch (err) {
      next(err);
    }
  },

  create: async (req, res, next) => {
    try {
      const { name, startTime, endTime, gracePeriodMinutes = 15, halfDayThresholdHours = 4.5 } = req.body;
      if (!name || !startTime || !endTime) {
        return res.status(400).json({ success: false, error: 'Shift name, start time, and end time are required.' });
      }

      const newShift = {
        id: `shift-${Date.now()}`,
        name,
        startTime,
        endTime,
        gracePeriodMinutes: Number(gracePeriodMinutes),
        halfDayThresholdHours: Number(halfDayThresholdHours),
        createdAt: new Date().toISOString(),
      };

      db.insert('shifts', newShift);
      res.status(201).json({ success: true, data: newShift });
    } catch (err) {
      next(err);
    }
  },

  getAssignments: async (req, res, next) => {
    try {
      const assignments = db.get('shift_assignments');
      res.json({ success: true, count: assignments.length, data: assignments });
    } catch (err) {
      next(err);
    }
  },

  assign: async (req, res, next) => {
    try {
      const { employeeId, shiftId, weeklyOff = 'Sunday' } = req.body;
      if (!employeeId || !shiftId) {
        return res.status(400).json({ success: false, error: 'Employee ID and Shift ID are required.' });
      }

      const assignments = db.get('shift_assignments');
      const shifts = db.get('shifts');
      const employees = db.get('employees');

      const emp = employees.find((e) => e.employeeId === employeeId);
      const shift = shifts.find((s) => s.id === shiftId || s.name === shiftId);

      let record = assignments.find((a) => a.employeeId === employeeId);
      if (record) {
        record.shiftId = shift?.id || shiftId;
        record.shiftName = shift?.name || 'General Shift';
        record.weeklyOff = weeklyOff;
        record.updatedAt = new Date().toISOString();
        db.set('shift_assignments', [...assignments]);
      } else {
        record = {
          id: `sa-${Date.now()}`,
          employeeId,
          employeeName: emp?.name || employeeId,
          shiftId: shift?.id || shiftId,
          shiftName: shift?.name || 'General Shift',
          weeklyOff,
          assignedAt: new Date().toISOString(),
        };
        db.insert('shift_assignments', record);
      }

      res.json({ success: true, data: record });
    } catch (err) {
      next(err);
    }
  },
};
