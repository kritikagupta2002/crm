import { storage } from '@/core/storage/storage';
import { api } from '@/core/api/apiClient';
import { setPublicHolidays } from '@/modules/leave/utils/workingDays';

/*
 * Company-wide settings live on the server. The latest copy is also cached because working-day and late-mark
 * calculations read it synchronously.
 */
const CACHE = {
    company: storage.setCompanySettings,
    attendance: storage.setAttendanceSettings,
    leave: storage.setLeaveSettings,
    payroll: storage.setPayrollSettings,
};
const load = async (key) => {
    const res = await api.get(`/settings/${key}`);
    CACHE[key](res.data);
    if (key === 'leave') setPublicHolidays(res.data?.publicHolidays);
    return res.data;
};
const save = async (key, value) => {
    const res = await api.put(`/settings/${key}`, value);
    CACHE[key](res.data);
    return res.data;
};

export const settingsService = {
    getCompanySettings: () => load('company'),
    updateCompanySettings: (val) => save('company', val),
    getAttendanceSettings: () => load('attendance'),
    updateAttendanceSettings: (val) => save('attendance', val),
    getLeaveSettings: () => load('leave'),
    updateLeaveSettings: (val) => save('leave', val),
    getPayrollSettings: () => load('payroll'),
    updatePayrollSettings: (val) => save('payroll', val),
};
