import { storage } from '@/core/storage/storage';
import { api } from '@/core/api/apiClient';
import { parseClock, todayIso } from '@/modules/attendance/utils/punch';
import { settingsService } from '@/modules/settings/services/settings.service';

/*
 * Attendance lives on the server. The browser keeps the last list it received only so pages render instantly;
 * every punch, correction and review is sent to the API and fails visibly if the API rejects it.
 */
export const attendanceService = {
  getAttendance: async (params = {}) => {
    const res = await api.get('/attendance', params);
    const list = Array.isArray(res?.data) ? res.data : [];
    if (!Object.keys(params).length) storage.setAttendance(list);
    return list;
  },

  /* Cached copy from the last successful load, for first paint before the request returns. */
  getCachedAttendance: () => storage.getAttendance(),

  recordPunch: async (employeeId, punchType, source = 'Web Portal', coords = null) => {
    const res = await api.post('/attendance/punch', {
      employeeId,
      punchType,
      source,
      latitude: coords?.latitude,
      longitude: coords?.longitude,
      accuracy: coords?.accuracy,
    });
    const record = res.data;
    const list = storage.getAttendance().filter((a) => !(a.employeeId === record.employeeId && a.date === record.date));
    storage.setAttendance([record, ...list]);
    return record;
  },

  getCorrections: async () => {
    const res = await api.get('/attendance/corrections');
    const list = Array.isArray(res?.data) ? res.data : [];
    storage.setCorrections(list);
    return list;
  },

  /*
   * Regularization: req.type is 'Missed Punch Out', 'Missed Punch In', 'Both Punches Missed' or 'Time Correction'.
   * Only the times that type needs are sent; the server keeps the logged ones and checks everything again.
   */
  submitCorrection: async (req) => {
    if (!req.date) throw new Error('Choose the date to regularize.');
    if (req.date > todayIso()) throw new Error('Attendance can only be regularized for today or a past date.');
    const inAt = req.requestedCheckIn ? parseClock(req.requestedCheckIn) : null;
    const outAt = req.requestedCheckOut ? parseClock(req.requestedCheckOut) : null;
    if ((req.requestedCheckIn && inAt === null) || (req.requestedCheckOut && outAt === null)) throw new Error('Enter the times, for example 09:15 AM.');
    if (req.type === 'Missed Punch Out' && outAt === null) throw new Error('Enter the time you left.');
    if (req.type === 'Missed Punch In' && inAt === null) throw new Error('Enter the time you arrived.');
    if (req.type === 'Both Punches Missed' && (inAt === null || outAt === null)) throw new Error('Enter both the arrival and leaving times.');
    if (inAt !== null && outAt !== null && outAt <= inAt) throw new Error('Punch out must be after punch in.');
    if (!req.reason?.trim() || req.reason.trim().length < 5) throw new Error('Give the reason for the regularization.');

    const res = await api.post('/attendance/corrections', { ...req, reason: req.reason.trim() });
    storage.setCorrections([res.data, ...storage.getCorrections()]);
    return res.data;
  },

  /* Past days where the person punched in but never punched out (and nothing is pending for that day). */
  missedPunchOuts: (attendance, corrections, employeeId) => {
    const today = todayIso();
    const pending = new Set(corrections.filter((c) => c.employeeId === employeeId && c.status === 'Pending').map((c) => c.date));
    const has = (t) => Boolean(t) && t !== '-' && parseClock(t) !== null;
    return attendance
      .filter((a) => a.employeeId === employeeId && a.date < today && has(a.checkIn) && !has(a.checkOut) && !pending.has(a.date))
      .sort((a, b) => b.date.localeCompare(a.date));
  },

  /* Mark a day as 'Holiday' or 'Half Day' (HR / Admin), or clear it. The leave settings cache is refreshed so
     leave and working-day counts use it straight away. */
  markDay: async (date, kind, name) => {
    await api.put(`/attendance/calendar/${date}`, { kind, name });
    await settingsService.getLeaveSettings().catch(() => null);
  },
  clearDay: async (date) => {
    await api.delete(`/attendance/calendar/${date}`);
    await settingsService.getLeaveSettings().catch(() => null);
  },

  reviewCorrection: async (id, status, _reviewerName, comment) => {
    await api.put(`/attendance/corrections/${encodeURIComponent(id)}`, { status, comment });
    await Promise.all([attendanceService.getCorrections(), attendanceService.getAttendance()]);
    return true;
  },
};
