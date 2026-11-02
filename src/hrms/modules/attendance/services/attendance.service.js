import { storage } from '@/core/storage/storage';
import { api } from '@/core/api/apiClient';
import { parseClock, todayIso } from '@/modules/attendance/utils/punch';

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

  submitCorrection: async (req) => {
    if (!req.date) throw new Error('Choose the date to correct.');
    if (req.date > todayIso()) throw new Error('A correction can only be requested for today or a past date.');
    const inAt = parseClock(req.requestedCheckIn);
    const outAt = parseClock(req.requestedCheckOut);
    if (inAt === null || outAt === null) throw new Error('Enter the corrected times, for example 09:15 AM.');
    if (outAt <= inAt) throw new Error('Punch out must be after punch in.');
    if (!req.reason?.trim()) throw new Error('Give the reason for the correction.');

    const res = await api.post('/attendance/corrections', { ...req, reason: req.reason.trim() });
    storage.setCorrections([res.data, ...storage.getCorrections()]);
    return res.data;
  },

  reviewCorrection: async (id, status, _reviewerName, comment) => {
    await api.put(`/attendance/corrections/${encodeURIComponent(id)}`, { status, comment });
    await Promise.all([attendanceService.getCorrections(), attendanceService.getAttendance()]);
    return true;
  },
};
