import { storage } from '@/core/storage/storage';
import { api } from '@/core/api/apiClient';

const list = async (path, cache) => {
    const res = await api.get(path);
    const data = Array.isArray(res?.data) ? res.data : [];
    cache(data);
    return data;
};
const id = (v) => encodeURIComponent(v);

/* Departments and designations are maintained on the server by HR administrators. */
export const organizationService = {
    getDepartments: () => list('/organization/departments', storage.setDepartments),
    createDepartment: async (dept) => (await api.post('/organization/departments', dept)).data,
    updateDepartment: async (deptId, data) => (await api.put(`/organization/departments/${id(deptId)}`, data)).data,
    deleteDepartment: async (deptId) => api.delete(`/organization/departments/${id(deptId)}`),
    getDesignations: () => list('/organization/designations', storage.setDesignations),
    createDesignation: async (desig) => (await api.post('/organization/designations', desig)).data,
    updateDesignation: async (desigId, data) => (await api.put(`/organization/designations/${id(desigId)}`, data)).data,
    deleteDesignation: async (desigId) => {
        await api.delete(`/organization/designations/${id(desigId)}`);
        return true;
    },
};
