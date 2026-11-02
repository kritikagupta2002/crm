import { api } from '@/core/api/apiClient';

/* Login account administration (HR administrators). */
export const accountService = {
    list: async () => (await api.get('/users')).data,
    resetPassword: async (id) => (await api.post(`/users/${encodeURIComponent(id)}/reset-password`)).data,
    catalog: async () => (await api.get('/users/permissions')).data,
    setAccess: async (id, role, permissions) => (await api.put(`/users/${encodeURIComponent(id)}/access`, { role, permissions })).data,
    setStatus: async (id, status) => (await api.put(`/users/${encodeURIComponent(id)}/status`, { status })).data,
    auditLog: async (params) => (await api.get('/audit', params)).data,
};
