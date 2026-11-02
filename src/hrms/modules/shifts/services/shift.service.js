import { storage } from '@/core/storage/storage';
import { api } from '@/core/api/apiClient';

/* Shifts and assignments are stored on the server; the cache feeds late-mark and weekly-off calculations. */
export const shiftService = {
    getShifts: async () => {
        const res = await api.get('/shifts');
        storage.setShifts(res.data);
        return res.data;
    },
    createShift: async (data) => (await api.post('/shifts', data)).data,
    updateShift: async (id, data) => (await api.put(`/shifts/${encodeURIComponent(id)}`, data)).data,
    deleteShift: async (id) => api.delete(`/shifts/${encodeURIComponent(id)}`),
    getAssignments: async () => {
        const res = await api.get('/shifts/assignments');
        storage.setShiftAssignments(res.data);
        return res.data;
    },
    assignShift: async ({ employeeId, shiftId, weeklyOff, effectiveFrom }) => {
        const res = await api.post('/shifts/assignments', { employeeId, shiftId, weeklyOff, effectiveFrom });
        await shiftService.getAssignments().catch(() => null);
        return res.data;
    },
};
