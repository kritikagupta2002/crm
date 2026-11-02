import { api } from '@/core/api/apiClient';

/* Appraisals are stored on the server; employees receive only their own. */
export const performanceService = {
    getAppraisals: async () => (await api.get('/employees/performance')).data,
    getAppraisalsByEmployee: async (employeeId) => (await performanceService.getAppraisals()).filter((a) => a.employeeId === employeeId),
    createAppraisal: async (appraisal) => (await api.post('/employees/performance', appraisal)).data,
    updateAppraisal: async (id, data) => (await api.put(`/employees/performance/${encodeURIComponent(id)}`, data)).data,
};
