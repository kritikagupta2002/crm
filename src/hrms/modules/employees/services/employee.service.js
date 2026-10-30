import { storage } from '@/core/storage/storage';
import { api } from '@/core/api/apiClient';

export const employeeService = {
  getAll: async () => {
    try {
      const res = await api.get('/employees');
      if (res && res.success && Array.isArray(res.data)) {
        storage.setEmployees(res.data);
        return res.data;
      }
    } catch (e) {
      console.warn('[Employee Service] Remote API unavailable, serving from local cache:', e.message);
    }
    return storage.getEmployees();
  },

  getById: async (id) => {
    try {
      const res = await api.get(`/employees/${id}`);
      if (res && res.success && res.data) {
        return res.data;
      }
    } catch (e) {
      console.warn('[Employee Service] Remote employee fetch failed, searching local cache:', e.message);
    }
    const list = storage.getEmployees();
    return list.find((e) => e.id === id || e.employeeId === id) || null;
  },

  create: async (data) => {
    try {
      const res = await api.post('/employees', data);
      if (res && res.success && res.data) {
        const list = storage.getEmployees();
        storage.setEmployees([res.data, ...list]);
        return res.data;
      }
    } catch (e) {
      console.warn('[Employee Service] Remote creation failed, persisting locally:', e.message);
    }

    const list = storage.getEmployees();
    const newEmployee = {
      ...data,
      id: `emp-${Date.now()}`,
    };
    const updated = [newEmployee, ...list];
    storage.setEmployees(updated);
    storage.getBalancesForEmployee(newEmployee.employeeId, newEmployee.name);
    return newEmployee;
  },

  update: async (id, data) => {
    try {
      const res = await api.put(`/employees/${id}`, data);
      if (res && res.success && res.data) {
        const list = storage.getEmployees();
        const idx = list.findIndex((e) => e.id === id || e.employeeId === id);
        if (idx >= 0) list[idx] = res.data;
        storage.setEmployees([...list]);
        return res.data;
      }
    } catch (e) {
      console.warn('[Employee Service] Remote update failed, modifying local cache:', e.message);
    }

    const list = storage.getEmployees();
    const index = list.findIndex((e) => e.id === id || e.employeeId === id);
    if (index === -1) throw new Error('Employee not found');
    const updatedEmployee = { ...list[index], ...data };
    list[index] = updatedEmployee;
    storage.setEmployees([...list]);
    return updatedEmployee;
  },

  delete: async (id) => {
    try {
      await api.delete(`/employees/${id}`);
    } catch (e) {
      console.warn('[Employee Service] Remote delete failed, removing locally:', e.message);
    }
    const list = storage.getEmployees();
    const filtered = list.filter((e) => e.id !== id && e.employeeId !== id);
    storage.setEmployees(filtered);
    return true;
  },
};
