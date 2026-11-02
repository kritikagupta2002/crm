import { storage } from '@/core/storage/storage';
import { api } from '@/core/api/apiClient';

const path = (id) => `/employees/${encodeURIComponent(id)}`;

/* The employee master lives on the server; the browser copy is a read cache for instant rendering. */
export const employeeService = {
  getAll: async () => {
    const res = await api.get('/employees');
    const list = Array.isArray(res?.data) ? res.data : [];
    storage.setEmployees(list);
    return list;
  },

  getById: async (id) => {
    const res = await api.get(path(id));
    return res?.data ?? null;
  },

  /*
   * Creates the employee and their portal login. The result carries `account` (email, role and the one-time
   * temporary password) so HR can hand the credentials over; it is never written to browser storage.
   */
  create: async (data) => {
    const res = await api.post('/employees', data);
    storage.setEmployees([res.data, ...storage.getEmployees()]);
    return { ...res.data, account: res.account };
  },

  update: async (id, data) => {
    const res = await api.put(path(id), data);
    const list = storage.getEmployees();
    const idx = list.findIndex((e) => e.id === res.data.id || e.employeeId === res.data.employeeId);
    if (idx >= 0) list[idx] = res.data;
    storage.setEmployees([...list]);
    return res.data;
  },

  /* Deactivates the employee and disables their login; their history is kept. */
  delete: async (id) => {
    await api.delete(path(id));
    await employeeService.getAll().catch(() => null);
    return true;
  },
};
