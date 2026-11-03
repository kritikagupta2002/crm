import { audit } from '../services/audit.js';
import { db } from '../services/db.js';
import { verifyGeofence, OFFICE_POLYGON, OFFICE_CENTROID } from '../services/geofence.js';
import { can, scopedEmployeeId } from '../config/permissions.js';
import { calendarDays, halfDaySet } from '../services/workCalendar.js';

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

const normTime = (t) => {
  const m = String(t || '').trim().toUpperCase().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/);
  return m ? `${m[1].padStart(2, '0')}:${m[2]} ${m[3]}` : '';
};
const hasTime = (t) => Boolean(t) && t !== '-' && parseMinutes(t) !== null;

/*
 * Regularization types:
 *   Missed Punch Out  – punched in, forgot to punch out: only the out time is supplied, the logged in time stays.
 *   Missed Punch In   – came on time but forgot to punch in (or punched in late once remembered): the in time is
 *                       corrected; a logged out time stays. Today it may be the in time alone (punch out as usual).
 *   Both Punches Missed – nothing was logged: both times are supplied.
 *   Time Correction   – both punches exist but a time is wrong.
 */
export const REGULARIZATION_TYPES = ['Missed Punch Out', 'Missed Punch In', 'Both Punches Missed', 'Time Correction'];
const REGULARIZATION_WINDOW_DAYS = 30;

/* Sets the in/out times on a register row and works out hours, late mark, overtime and half day from the shift. */
function applyPunchTimes(record, checkIn, checkOut) {
  const rules = db.get('attendance_settings') || {};
  const { start, grace } = shiftStartFor(record.employeeId);
  record.checkIn = checkIn || '-';
  record.checkOut = checkOut || '-';
  const inMins = parseMinutes(record.checkIn);
  const outMins = parseMinutes(record.checkOut);
  const lateMins = inMins !== null && start !== null ? inMins - start : 0;
  const isLate = lateMins > grace;
  record.lateBy = isLate ? lateText(lateMins) : '-';
  record.status = isLate ? 'Late' : 'Present';
  if (inMins !== null && outMins !== null) {
    const diffMins = Math.max(0, outMins - inMins);
    const fullDayMins = (Number(rules.fullDayMinimumHours) || 8) * 60;
    record.workingHours = `${(diffMins / 60).toFixed(1)} hrs`;
    record.overtime = diffMins > fullDayMins ? `${((diffMins - fullDayMins) / 60).toFixed(1)} hrs` : '-';
    if (!halfDaySet().has(record.date) && diffMins < (Number(rules.halfDayThresholdHours) || 4.5) * 60) record.status = 'Half Day';
  } else {
    record.workingHours = inMins !== null ? 'Working...' : '-';
    record.overtime = '-';
  }
  return record;
}

export const attendanceController = {
  getAll: async (req, res, next) => {
    try {
      const { date, department, status, month } = req.query;
      const employeeId = scopedEmployeeId(req, req.query.employeeId, 'attendance.view_all');
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
        records: can(req.user, 'attendance.view_all') ? todayRecords : todayRecords.filter((r) => r.employeeId === req.user.employeeId),
      });
    } catch (err) {
      next(err);
    }
  },

  recordPunch: async (req, res, next) => {
    try {
      const { punchType, source = 'Web Portal', latitude, longitude, accuracy } = req.body;
      // People always punch for themselves; HR may punch on someone's behalf.
      const employeeId = scopedEmployeeId(req, req.body.employeeId, 'attendance.manage') || req.user.employeeId;
      if (employeeId === req.user.employeeId && !can(req.user, 'attendance.mark')) {
        return res.status(403).json({ success: false, error: 'You do not have permission to mark attendance.' });
      }
      const clientIp = req.ip;

      if (!employeeId) {
        return res.status(400).json({ success: false, error: 'Your account is not linked to an employee record.' });
      }

      // Everyone punches from inside the office boundary (or the office network). Attendance for someone who was
      // elsewhere is recorded by HR through a correction, which keeps an approval trail.
      const num = (v) => (v === null || v === undefined || v === '' || !Number.isFinite(Number(v)) ? undefined : Number(v));
      const geo = verifyGeofence(num(latitude), num(longitude), num(accuracy) ?? null, clientIp);
      if (geo.isLowAccuracy && geo.verifiedBy !== 'Office Network / IP Whitelist') {
        return res.status(403).json({ success: false, error: `Your GPS signal is too weak (±${geo.accuracy} m). Move near a window or step outside briefly, then try again.`, geofence: geo });
      }
      if (!geo.isInside) {
        const d = geo.distanceMeters;
        const where = d == null ? 'Your location could not be read' : `You are ${d >= 1000 ? `${(d / 1000).toFixed(1)} km` : `${Math.round(d)} m`} from the office`;
        return res.status(403).json({
          success: false,
          error: `${where}. Attendance can be punched only inside the office.`,
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
          punchSource: String(source).slice(0, 120),
          latitude: Number.isFinite(Number(latitude)) ? Number(latitude) : null,
          longitude: Number.isFinite(Number(longitude)) ? Number(longitude) : null,
          accuracy: Number.isFinite(Number(accuracy)) ? Number(accuracy) : null,
          inGeofence: Boolean(geo.isInside),
          verifiedBy: geo.verifiedBy,
          punchedBy: req.user.employeeId === employeeId ? undefined : req.user.name,
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
        record.checkOutInGeofence = Boolean(geo.isInside);
        record.workingHours = `${diffHours} hrs`;
        const rules = db.get('attendance_settings') || {};
        const fullDayMins = (Number(rules.fullDayMinimumHours) || 8) * 60;
        record.overtime = diffMins > fullDayMins ? `${((diffMins - fullDayMins) / 60).toFixed(1)} hrs` : '-';
        // Less than the half-day threshold counts as a half day (the late mark, if any, is kept in lateBy).
        // On a day marked as a company half day a short day is expected, so it is not marked as a half day.
        if (!halfDaySet().has(today) && diffMins < (Number(rules.halfDayThresholdHours) || 4.5) * 60) record.status = 'Half Day';
        if (halfDaySet().has(today)) record.companyHalfDay = true;
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
      const { month = localDate().slice(0, 7) } = req.query;
      const employeeId = scopedEmployeeId(req, req.query.employeeId, 'attendance.view_all');
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
      const { status } = req.query;
      const employeeId = scopedEmployeeId(req, req.query.employeeId, 'attendance.view_all');
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
      const { date, reason } = req.body;
      const employeeId = scopedEmployeeId(req, req.body.employeeId, 'attendance.manage') || req.user.employeeId;
      const today = localDate();
      if (!employeeId || !/^\d{4}-\d{2}-\d{2}$/.test(String(date || '')) || !String(reason || '').trim()) {
        return res.status(400).json({ success: false, error: 'Date and reason are required.' });
      }
      if (date > today) return res.status(400).json({ success: false, error: 'Attendance can only be regularized for today or a past date.' });
      const oldest = new Date();
      oldest.setDate(oldest.getDate() - REGULARIZATION_WINDOW_DAYS);
      if (date < localDate(oldest)) {
        return res.status(400).json({ success: false, error: `Regularization is allowed for the last ${REGULARIZATION_WINDOW_DAYS} days only. Contact HR for older dates.` });
      }

      const existing = db.get('attendance').find((a) => a.employeeId === employeeId && a.date === date);
      const loggedIn = hasTime(existing?.checkIn) ? existing.checkIn : '';
      const loggedOut = hasTime(existing?.checkOut) ? existing.checkOut : '';
      // Without an explicit type, work it out from what was logged and what is asked for.
      let type = REGULARIZATION_TYPES.includes(req.body.type) ? req.body.type : '';
      const askIn = normTime(req.body.requestedCheckIn);
      const askOut = normTime(req.body.requestedCheckOut);
      if ((req.body.requestedCheckIn && !askIn) || (req.body.requestedCheckOut && !askOut)) {
        return res.status(400).json({ success: false, error: 'Enter times like 09:30 AM.' });
      }
      if (!type) type = !loggedIn && !loggedOut ? 'Both Punches Missed' : loggedIn && !loggedOut && !askIn ? 'Missed Punch Out' : askIn && !askOut ? 'Missed Punch In' : 'Time Correction';

      let checkIn = askIn || loggedIn;
      let checkOut = askOut || loggedOut;
      if (type === 'Missed Punch Out') {
        if (!loggedIn) return res.status(400).json({ success: false, error: 'No punch in is logged for this day. Choose "Both punches missed" instead.' });
        if (loggedOut) return res.status(400).json({ success: false, error: `Punch out is already logged at ${loggedOut}. Choose "Time correction" to change it.` });
        if (!askOut) return res.status(400).json({ success: false, error: 'Enter the time you left.' });
        checkIn = loggedIn;
        if (date === today && (parseMinutes(askOut) > parseMinutes(nowTime()))) {
          return res.status(400).json({ success: false, error: 'The punch out time cannot be later than now.' });
        }
      } else if (type === 'Missed Punch In') {
        if (!askIn) return res.status(400).json({ success: false, error: 'Enter the time you arrived.' });
        // Past days need an out time too unless one is logged; today the person can still punch out normally.
        if (!checkOut && date !== today) return res.status(400).json({ success: false, error: 'Enter the time you left as well, since no punch out is logged for that day.' });
      } else if (type === 'Both Punches Missed') {
        if (!askIn || !askOut) return res.status(400).json({ success: false, error: 'Enter both the arrival and leaving times.' });
      } else if (!askIn && !askOut) {
        return res.status(400).json({ success: false, error: 'Enter the corrected punch in or punch out time.' });
      }
      if (hasTime(checkIn) && hasTime(checkOut) && parseMinutes(checkOut) <= parseMinutes(checkIn)) {
        return res.status(400).json({ success: false, error: 'Punch out must be after punch in.' });
      }
      const duplicate = db.get('corrections').find((c) => c.employeeId === employeeId && c.date === date && c.status === 'Pending');
      if (duplicate) return res.status(409).json({ success: false, error: 'A regularization request for this day is already waiting for approval.' });

      const emp = db.get('employees').find((e) => e.employeeId === employeeId);
      const correction = {
        id: `corr-${Date.now()}`,
        employeeId,
        employeeName: emp?.name || employeeId,
        department: emp?.employment?.department || 'General',
        date,
        type,
        originalCheckIn: existing?.checkIn || '-',
        originalCheckOut: existing?.checkOut || '-',
        requestedCheckIn: checkIn || '-',
        requestedCheckOut: checkOut || '-',
        reason: String(reason).trim().slice(0, 1000),
        status: 'Pending',
        appliedAt: new Date().toISOString(),
        appliedDate: today,
      };

      db.insert('corrections', correction);
      db.insert('notifications', {
        id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        type: 'Attendance',
        read: false,
        createdAt: new Date().toISOString(),
        title: 'Attendance regularization request',
        message: `${correction.employeeName} asked to regularize ${date} (${type}): ${correction.requestedCheckIn} – ${correction.requestedCheckOut}.`,
        targetRole: 'hr',
        priority: 'normal',
      });
      res.status(201).json({ success: true, data: correction });
    } catch (err) {
      next(err);
    }
  },

  reviewCorrection: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const reviewerNote = req.body.reviewerNote ?? req.body.comment;

      if (!['Approved', 'Rejected'].includes(status)) {
        return res.status(400).json({ success: false, error: 'Status must be Approved or Rejected.' });
      }
      const request = db.findById('corrections', id);
      if (!request) return res.status(404).json({ success: false, error: 'Correction request not found.' });
      if (request.status !== 'Pending') {
        return res.status(409).json({ success: false, error: `This request was already ${request.status.toLowerCase()}.` });
      }
      if (request.employeeId === req.user.employeeId && req.user.role !== 'Managing Director') {
        return res.status(403).json({ success: false, error: 'You cannot review your own correction request.' });
      }

      const updated = db.update('corrections', id, {
        status,
        reviewComment: String(reviewerNote || '').slice(0, 1000),
        reviewedBy: req.user.name,
        reviewedAt: new Date().toISOString(),
      });

      if (!updated) {
        return res.status(404).json({ success: false, error: 'Correction request not found.' });
      }

      audit(req, 'review', 'corrections', updated.id, `Correction for ${updated.employeeName} on ${updated.date} ${status.toLowerCase()}`);

      // Approved: the register row gets the regularized times, with hours, late mark and overtime worked out again.
      if (status === 'Approved') {
        const attendanceList = db.get('attendance');
        const inTime = hasTime(updated.requestedCheckIn) ? updated.requestedCheckIn : '';
        const outTime = hasTime(updated.requestedCheckOut) ? updated.requestedCheckOut : '';
        const record = attendanceList.find((a) => a.employeeId === updated.employeeId && a.date === updated.date);
        if (record) {
          applyPunchTimes(record, inTime, outTime);
          record.regularized = true;
          record.regularizationType = updated.type || 'Time Correction';
          record.regularizationId = updated.id;
          delete record.leaveId;
          db.set('attendance', [...attendanceList]);
        } else {
          const emp = db.get('employees').find((e) => e.employeeId === updated.employeeId);
          db.insert('attendance', applyPunchTimes({
            id: `att-r-${Date.now()}`,
            employeeId: updated.employeeId,
            employeeName: emp?.name || updated.employeeName,
            department: emp?.employment?.department || updated.department,
            date: updated.date,
            punchSource: 'Regularized (approved request)',
            regularized: true,
            regularizationType: updated.type || 'Time Correction',
            regularizationId: updated.id,
          }, inTime, outTime));
        }
      }
      db.insert('notifications', {
        id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        type: 'Attendance',
        read: false,
        createdAt: new Date().toISOString(),
        title: `Regularization ${status.toLowerCase()}`,
        message: `Your regularization for ${updated.date} was ${status.toLowerCase()} by ${req.user.name}.${updated.reviewComment ? ` Note: ${updated.reviewComment}` : ''}`,
        targetEmployeeId: updated.employeeId,
        priority: status === 'Rejected' ? 'high' : 'normal',
      });

      res.json({ success: true, data: updated });
    } catch (err) {
      next(err);
    }
  },

  /* Days HR / Admin marked as a holiday or half day (everyone may read them). */
  getCalendar: async (req, res, next) => {
    try {
      const { month } = req.query;
      const days = calendarDays().filter((d) => !month || d.date.startsWith(month)).sort((a, b) => a.date.localeCompare(b.date));
      res.json({ success: true, data: days });
    } catch (err) {
      next(err);
    }
  },

  /* Mark a day: { kind: 'Holiday' | 'Half Day', name }. Saved in Leave settings so leave and payroll use it too. */
  markCalendarDay: async (req, res, next) => {
    try {
      const { date } = req.params;
      const kind = req.body?.kind;
      const name = String(req.body?.name || '').trim().slice(0, 80);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return res.status(400).json({ success: false, error: 'Choose a valid date.' });
      if (!['Holiday', 'Half Day'].includes(kind)) return res.status(400).json({ success: false, error: 'Mark the day as a Holiday or a Half Day.' });
      const settings = db.get('leave_settings') || {};
      const others = (settings.companyHolidays || []).filter((h) => (typeof h === 'string' ? h : h?.date) !== date);
      const entry = { date, kind, name: name || kind, markedBy: req.user.name, markedAt: new Date().toISOString() };
      db.set('leave_settings', { ...settings, companyHolidays: [...others, entry].sort((a, b) => String(a.date ?? a).localeCompare(String(b.date ?? b))) });
      audit(req, 'update', 'calendar', date, `${date} marked as ${kind}${name ? ` (${name})` : ''}`);
      db.insert('notifications', {
        id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        type: 'Attendance',
        read: false,
        createdAt: new Date().toISOString(),
        title: kind === 'Holiday' ? 'Holiday declared' : 'Half day declared',
        message: `${date} is a ${kind.toLowerCase()}${name && name !== kind ? `: ${name}` : ''}.`,
        targetRole: 'all',
        priority: 'normal',
      });
      res.json({ success: true, data: entry });
    } catch (err) {
      next(err);
    }
  },

  /* Turn a marked day back into a normal working day. */
  clearCalendarDay: async (req, res, next) => {
    try {
      const { date } = req.params;
      const settings = db.get('leave_settings') || {};
      const list = settings.companyHolidays || [];
      const next = list.filter((h) => (typeof h === 'string' ? h : h?.date) !== date);
      if (next.length === list.length) return res.status(404).json({ success: false, error: 'This day is not marked.' });
      db.set('leave_settings', { ...settings, companyHolidays: next });
      audit(req, 'update', 'calendar', date, `${date} is a working day again`);
      res.json({ success: true, data: { date } });
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

