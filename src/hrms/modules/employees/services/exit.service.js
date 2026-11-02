import { api } from '@/core/api/apiClient';

/*
 * Separation workflow on the server: clearances by department, then a full & final settlement calculated from
 * the salary structure, leave balance and service length. Settling relieves the employee and disables their login.
 */
export const exitService = {
    getExits: async () => (await api.get('/exits')).data,
    getExitByEmployee: async (employeeId) => (await exitService.getExits()).find((x) => x.employeeId === employeeId) || null,
    initiateExit: async ({ employeeId, exitType, reason, resignationDate, requestedLWD, noticePeriodDays }) =>
        (await api.post('/exits', { employeeId, exitType, reason, resignationDate, requestedLWD, noticePeriodDays })).data,
    updateClearance: async (exitId, department, status, notes) =>
        (await api.put(`/exits/${encodeURIComponent(exitId)}/clearance`, { department, status, notes })).data,
    finalizeFnF: async (exitId) => (await api.put(`/exits/${encodeURIComponent(exitId)}/settle`)).data,
    revokeExit: async (exitId) => (await api.put(`/exits/${encodeURIComponent(exitId)}/revoke`)).data,
};
