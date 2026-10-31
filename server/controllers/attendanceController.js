import { db } from '../services/db.js';
import { verifyGeofence, OFFICE_POLYGON, OFFICE_CENTROID } from '../services/geofence.js';

/* Today's date on the server's own clock (not UTC), so an early-morning punch lands on the right day. */
function localDate(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/* When the person's day starts and how many minutes of grace they get: their shift, else the attendance settings. */
function shiftStartFor(employeeId) {
  const assignment = db.get('shift_assignments').find((a) => a.employeeId === employeeId && a.status !== 'Inactive');
  const shift = assignment ? db.get('shifts').find((s) => s.id === assignment.shiftId) : null;
  const settings = db.get('attendance_settings') || {};
  const start = parseMinutes(shift?.startTime || settings.workStartTime || '09:30 AM');
  const grace = parseInt(shift?.gracePeriod ?? settings.gracePeriodMinutes ?? 15, 10) || 0;
  return { start, grace };
}

function lateText(mins) {
  if (mins >= 60) return `${Math.floor(mins / 60)}h ${mins % 60}m`;
  return `${mins} mins`;
}

function nowTime() {
  const d = new Date();
  let hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  return `${String(hours).padStart(2, '0')}:${minutes} ${ampm}`;
}

function parseMinutes(timeStr) {
  if (!timeStr || timeStr === '-') return null;
  const match = timeStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!match) return null;
  let h = parseInt(match[1], 10);
  const m = parseInt(match[2], 10);
  const ampm = match[3]?.toUpperCase();
  if (ampm === 'PM' && h < 12) h += 12;
  if (ampm === 'AM' && h === 12) h = 0;
  return h * 60 + m;
}

export const attendanceController = {
  getAll: async (req, res, next) => {
    try {
      const { date, employeeId, department, status, month } = req.query;
      let attendance = db.get('attendance');

      if (date) {
        attendance = attendance.filter((a) => a.date === date);
      }
      if (employeeId) {
        attendance = attendance.filter((a) => a.employeeId === employeeId);
      }
      if (department) {
        attendance = attendance.filter((a) => a.department === department);
      }
      if (status) {
        attendance = attendance.filter((a) => a.status === status);
      }
      if (month) {
        // month is YYYY-MM
        attendance = attendance.filter((a) => a.date?.startsWith(month));
      }

      res.json({
        success: true,
        count: attendance.length,
        data: attendance,
      });
    } catch (err) {
      next(err);
    }
  },

  getTodaySummary: async (req, res, next) => {
    try {
      const today = localDate();
      const employees = db.get('employees');
      const attendance = db.get('attendance');
      const leaves = db.get('leaves');

      const todayRecords = attendance.filter((a) => a.date === today);
      const approvedLeavesToday = leaves.filter(
        (l) => l.status === 'Approved' && l.startDate <= today && l.endDate >= today,
      );

      const presentCount = todayRecords.filter((r) => r.status === 'Present' || r.status === 'Late').length;
      const lateCount = todayRecords.filter((r) => r.status === 'Late').length;
      const onLeaveCount = approvedLeavesToday.length;
      const absentCount = Math.max(0, employees.length - presentCount - onLeaveCount);

      res.json({
        success: true,
        date: today,
        stats: {
          totalStaff: employees.length,
          present: presentCount,
          late: lateCount,
          onLeave: onLeaveCount,
          absent: absentCount,
        },
        records: todayRecords,
      });
    } catch (err) {
      next(err);
    }
  },

  recordPunch: async (req, res, next) => {
    try {
      const { employeeId, punchType, source = 'Web Portal', latitude, longitude, accuracy } = req.body;
      const clientIp = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || req.ip;

      if (!employeeId) {
        return res.status(400).json({ success: false, error: 'Employee ID is required.' });
      }

      // Geofence boundary verification with 15m buffer & office IP fallback
      // Executive directors and field personnel on official duty are not locked out
      const isExecutive = ['BGS/DIR-01', 'BGS/DIR-03', 'BGS/ADM-01'].includes(employeeId) ||
        source?.toLowerCase().includes('executive') ||
        source?.toLowerCase().includes('field') ||
        source?.toLowerCase().includes('duty') ||
        source?.toLowerCase().includes('regularization');

      const geo = verifyGeofence(latitude, longitude, accuracy, clientIp);
      if (!geo.isInside && !isExecutive) {
        const dist = Math.round(geo.distanceMeters || 0);
        return res.status(403).json({
          success: false,
          error: `Attendance locked: You are outside the office geofence (${dist}m away). Move inside the office boundary to punch.`,
          geofence: geo,
        });
      }

      const today = localDate();
      const attendanceList = db.get('attendance');
      const employees = db.get('employees');
      const employee = employees.find((e) => e.employeeId === employeeId);
      const time = nowTime();

      let record = attendanceList.find((a) => a.employeeId === employeeId && a.date === today);

      if (punchType === 'checkIn') {
        if (record && record.checkIn && record.checkIn !== '-') {
          return res.status(400).json({
            success: false,
            error: `You have already clocked in at ${record.checkIn}.`,
          });
        }

        // Late = after the shift start plus its grace; the late-by time counts from the shift start.
        const { start, grace } = shiftStartFor(employeeId);
        const lateMins = parseMinutes(time) - start;
        const isLate = lateMins > grace;
        const fresh = {
          id: record?.id || `att-p-${Date.now()}`,
          employeeId,
          employeeName: employee?.name || employeeId,
          department: employee?.employment?.department || 'Operations',
          date: today,
          checkIn: time,
          checkOut: '-',
          workingHours: 'Working...',
          lateBy: isLate ? lateText(lateMins) : '-',
          overtime: '-',
          status: isLate ? 'Late' : 'Present',
          punchSource: source,
        };

        if (record) {
          Object.assign(record, fresh);
          db.set('attendance', [...attendanceList]);
        } else {
          db.insert('attendance', fresh);
          record = fresh;
        }
      } else if (punchType === 'checkOut') {
        if (!record || !record.checkIn || record.checkIn === '-') {
          return res.status(400).json({ success: false, error: 'Please clock in first before clocking out.' });
        }
        if (record.checkOut && record.checkOut !== '-') {
          return res.status(400).json({
            success: false,
            error: `You have already clocked out at ${record.checkOut}.`,
          });
        }

        const inMins = parseMinutes(record.checkIn);
        const outMins = parseMinutes(time);
        const diffMins = Math.max(0, outMins - inMins);
        const diffHours = (diffMins / 60).toFixed(1);

        record.checkOut = time;
        record.workingHours = `${diffHours} hrs`;
        record.overtime = diffMins > 9 * 60 ? `${((diffMins - 9 * 60) / 60).toFixed(1)} hrs` : '-';
        db.set('attendance', [...attendanceList]);
      } else {
        return res.status(400).json({ success: false, error: 'Invalid punch type. Use checkIn or checkOut.' });
      }

      res.json({ success: true, data: record });
    } catch (err) {
      next(err);
    }
  },

  getMonthly: async (req, res, next) => {
    try {
      const { month = localDate().slice(0, 7), employeeId } = req.query;
      const attendance = db.get('attendance');
      const employees = db.get('employees');

      const monthRecords = attendance.filter((a) => a.date?.startsWith(month));
      let targetEmployees = employees;
      if (employeeId) {
        targetEmployees = employees.filter((e) => e.employeeId === employeeId);
      }

      const grid = targetEmployees.map((emp) => {
        const empRecs = monthRecords.filter((a) => a.employeeId === emp.employeeId);
        const presentCount = empRecs.filter((r) => r.status === 'Present').length;
        const lateCount = empRecs.filter((r) => r.status === 'Late').length;
        const leaveCount = empRecs.filter((r) => r.status === 'On Leave').length;
        const absentCount = empRecs.filter((r) => r.status === 'Absent').length;

        return {
          employee: {
            id: emp.id,
            employeeId: emp.employeeId,
            name: emp.name,
            department: emp.employment?.department,
            designation: emp.employment?.designation,
          },
          summary: {
            present: presentCount,
            late: lateCount,
            leave: leaveCount,
            absent: absentCount,
            totalLogged: empRecs.length,
          },
          records: empRecs,
        };
      });

      res.json({ success: true, month, data: grid });
    } catch (err) {
      next(err);
    }
  },

  // Attendance Corrections
  getCorrections: async (req, res, next) => {
    try {
      const { status, employeeId } = req.query;
      let corrections = db.get('corrections');

      if (status) {
        corrections = corrections.filter((c) => c.status === status);
      }
      if (employeeId) {
        corrections = corrections.filter((c) => c.employeeId === employeeId);
      }

      res.json({ success: true, count: corrections.length, data: corrections });
    } catch (err) {
      next(err);
    }
  },

  submitCorrection: async (req, res, next) => {
    try {
      const { employeeId, date, requestedCheckIn, requestedCheckOut, reason } = req.body;
      if (!employeeId || !date || !reason) {
        return res.status(400).json({ success: false, error: 'Employee ID, date, and reason are required.' });
      }

      const employees = db.get('employees');
      const emp = employees.find((e) => e.employeeId === employeeId);

      const correction = {
        id: `corr-${Date.now()}`,
        employeeId,
        employeeName: emp?.name || employeeId,
        department: emp?.employment?.department || 'General',
        date,
        originalCheckIn: req.body.originalCheckIn || '09:45 AM',
        originalCheckOut: req.body.originalCheckOut || '06:00 PM',
        requestedCheckIn: requestedCheckIn || '09:00 AM',
        requestedCheckOut: requestedCheckOut || '06:00 PM',
        reason,
        status: 'Pending',
        appliedAt: new Date().toISOString(),
      };

      db.insert('corrections', correction);
      res.status(201).json({ success: true, data: correction });
    } catch (err) {
      next(err);
    }
  },

  reviewCorrection: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { status, reviewerNote, reviewerName } = req.body;

      if (!['Approved', 'Rejected'].includes(status)) {
        return res.status(400).json({ success: false, error: 'Status must be Approved or Rejected.' });
      }

      const updated = db.update('corrections', id, {
        status,
        reviewerNote: reviewerNote || '',
        reviewerName: reviewerName || req.user?.name || 'HR Admin',
        reviewedAt: new Date().toISOString(),
      });

      if (!updated) {
        return res.status(404).json({ success: false, error: 'Correction request not found.' });
      }

      // If approved, update the actual attendance record
      if (status === 'Approved') {
        const attendanceList = db.get('attendance');
        const record = attendanceList.find(
          (a) => a.employeeId === updated.employeeId && a.date === updated.date,
        );
        if (record) {
          record.checkIn = updated.requestedCheckIn;
          record.checkOut = updated.requestedCheckOut;
          record.status = 'Present';
          record.lateBy = '-';
          db.set('attendance', [...attendanceList]);
        }
      }

      res.json({ success: true, data: updated });
    } catch (err) {
      next(err);
    }
  },

  getGeofenceConfig: async (req, res, next) => {
    try {
      res.json({
        success: true,
        data: {
          name: 'Bansal Geo Solutions HQ',
          polygon: OFFICE_POLYGON,
          centroid: OFFICE_CENTROID,
          rules: 'Attendance punch is enabled only within the designated 4-point polygon perimeter.',
        },
      });
    } catch (err) {
      next(err);
    }
  },

  verifyLocation: async (req, res, next) => {
    try {
      const { latitude, longitude } = req.body;
      const result = verifyGeofence(Number(latitude), Number(longitude));
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  },
};

