import { storage } from '@/core/storage/storage';
import { api } from '@/core/api/apiClient';
import { evaluateDay, nowClock, parseClock, todayIso } from '@/modules/attendance/utils/punch';
import { evaluateGeofence } from '@/modules/attendance/utils/geofence';

export const attendanceService = {
  /*
   * Fetch attendance records with automatic API syncing and local offline fallback
   */
  getAttendance: async (params = {}) => {
    try {
      const res = await api.get('/attendance', params);
      if (res && res.success && Array.isArray(res.data)) {
        storage.setAttendance(res.data);
        return res.data;
      }
    } catch (e) {
      console.warn('[Attendance Service] Remote API unavailable, serving from local cache:', e.message);
    }
    return storage.getAttendance();
  },

  /*
   * A punch from the web portal with Geofence verification and direct backend persistence.
   */
  recordPunch: async (employeeId, punchType, source = 'Office Geofenced GPS', coords = null) => {
    if (!employeeId) throw new Error('Your HR record is not set up, so attendance cannot be recorded.');

    // Strict Geofence verification with 15m buffer tolerance
    if (coords && typeof coords.latitude === 'number' && typeof coords.longitude === 'number') {
      const geo = evaluateGeofence(coords.latitude, coords.longitude, coords.accuracy);
      if (!geo.isInside) {
        const dist = Math.round(geo.distanceMeters || 0);
        throw new Error(`Attendance locked: You are outside the office geofence (${dist}m away). Move inside the office boundary to punch.`);
      }
    }

    // 1. Attempt Real Backend API Punch
    try {
      const res = await api.post('/attendance/punch', {
        employeeId,
        punchType,
        source,
        latitude: coords?.latitude,
        longitude: coords?.longitude,
        accuracy: coords?.accuracy,
      });

      if (res && res.success && res.data) {
        const list = storage.getAttendance();
        const idx = list.findIndex((a) => a.id === res.data.id || (a.employeeId === employeeId && a.date === res.data.date));
        if (idx >= 0) list[idx] = res.data;
        else list.unshift(res.data);
        storage.setAttendance([...list]);
        return res.data;
      }
    } catch (apiErr) {
      console.warn('[Attendance Service] Backend punch failed, falling back to local transaction:', apiErr.message);
      // Re-throw if error was a validation lock (e.g. outside geofence or already punched)
      if (apiErr.status === 403 || apiErr.status === 400) {
        throw apiErr;
      }
    }

    // 2. Offline Fallback Local Punch
    const list = storage.getAttendance();
    const today = todayIso();
    const settings = storage.getAttendanceSettings();
    const time = nowClock();
    let record = list.find((a) => a.employeeId === employeeId && a.date === today);
    if (record?.status === 'On Leave') throw new Error('You are on approved leave today.');

    if (punchType === 'checkIn') {
      if (record && record.checkIn && record.checkIn !== '-') throw new Error(`You already punched in at ${record.checkIn}.`);
      const emp = storage.getEmployees().find((e) => e.employeeId === employeeId);
      const day = evaluateDay(time, null, settings);
      const fresh = {
        id: `att-p-${Date.now()}`,
        employeeId,
        employeeName: emp?.name ?? employeeId,
        department: emp?.employment?.department ?? '',
        date: today,
        checkIn: time,
        checkOut: '-',
        workingHours: 'Working...',
        lateBy: day.lateBy,
        overtime: '-',
        status: day.status,
        punchSource: source,
      };
      if (record) Object.assign(record, fresh);
      else list.unshift((record = fresh));
    } else {
      if (!record || !record.checkIn || record.checkIn === '-') throw new Error('Punch in first.');
      if (record.checkOut && record.checkOut !== '-') throw new Error(`You already punched out at ${record.checkOut}.`);
      const day = evaluateDay(record.checkIn, time, settings);
      record.checkOut = time;
      record.workingHours = day.workingHours;
      record.overtime = day.overtime;
      record.punchSource = source;
    }
    storage.setAttendance([...list]);
    return { ...record };
  },

  getCorrections: async () => {
    try {
      const res = await api.get('/attendance/corrections');
      if (res && res.success && Array.isArray(res.data)) {
        storage.setCorrections(res.data);
        return res.data;
      }
    } catch (e) {
      console.warn('[Attendance Service] Remote corrections API unavailable, using local cache:', e.message);
    }
    return storage.getCorrections();
  },

  submitCorrection: async (req) => {
    if (!req.employeeId) throw new Error('Your HR record is not set up.');
    if (!req.date) throw new Error('Choose the date to correct.');
    if (req.date > todayIso()) throw new Error('A correction can only be asked for a past or today\'s date.');
    const inAt = parseClock(req.requestedCheckIn);
    const outAt = parseClock(req.requestedCheckOut);
    if (inAt === null || outAt === null) throw new Error('Enter the corrected times like 09:15 AM.');
    if (outAt <= inAt) throw new Error('Punch out must be after punch in.');
    if (!req.reason?.trim()) throw new Error('Give the reason for the correction.');

    try {
      const res = await api.post('/attendance/corrections', req);
      if (res && res.success && res.data) {
        const list = storage.getCorrections();
        storage.setCorrections([res.data, ...list]);
        return res.data;
      }
    } catch (e) {
      console.warn('[Attendance Service] Remote submission failed, saving locally:', e.message);
    }

    const list = storage.getCorrections();
    if (list.some((c) => c.employeeId === req.employeeId && c.date === req.date && c.status === 'Pending')) {
      throw new Error('A correction for this date is already waiting for approval.');
    }
    const record = storage.getAttendance().find((a) => a.employeeId === req.employeeId && a.date === req.date);
    const newReq = {
      ...req,
      reason: req.reason.trim(),
      currentCheckIn: record?.checkIn || '-',
      currentCheckOut: record?.checkOut || '-',
      id: `cor-${Date.now()}`,
      appliedDate: todayIso(),
      status: 'Pending',
    };
    storage.setCorrections([newReq, ...list]);
    return newReq;
  },

  reviewCorrection: async (id, status, reviewerName, comment, reviewerEmployeeId) => {
    try {
      const res = await api.put(`/attendance/corrections/${id}`, {
        status,
        reviewerName,
        comment,
        reviewerEmployeeId,
      });
      if (res && res.success) {
        // Refresh local cache
        attendanceService.getCorrections();
        attendanceService.getAttendance();
        return true;
      }
    } catch (e) {
      console.warn('[Attendance Service] Remote review failed, saving locally:', e.message);
    }

    const list = storage.getCorrections();
    const item = list.find((c) => c.id === id);
    if (!item) throw new Error('Correction request not found.');
    if (item.status !== 'Pending') throw new Error(`This request is already ${item.status.toLowerCase()}.`);
    if (reviewerEmployeeId && reviewerEmployeeId === item.employeeId) throw new Error('You cannot approve your own correction request.');
    item.status = status;
    item.reviewedBy = reviewerName;
    item.reviewComment = comment;
    item.reviewedAt = new Date().toISOString();
    storage.setCorrections([...list]);

    if (status === 'Approved') {
      const attendance = storage.getAttendance();
      const day = evaluateDay(item.requestedCheckIn, item.requestedCheckOut, storage.getAttendanceSettings());
      const fields = {
        checkIn: item.requestedCheckIn,
        checkOut: item.requestedCheckOut,
        workingHours: day.workingHours,
        lateBy: day.lateBy,
        overtime: day.overtime,
        status: day.status,
        punchSource: 'Correction approved',
      };
      const record = attendance.find((a) => a.employeeId === item.employeeId && a.date === item.date);
      if (record) Object.assign(record, fields);
      else {
        attendance.unshift({
          id: `att-c-${Date.now()}`,
          employeeId: item.employeeId,
          employeeName: item.employeeName,
          department: item.department,
          date: item.date,
          ...fields,
        });
      }
      storage.setAttendance([...attendance]);
    }
    return true;
  },
};
