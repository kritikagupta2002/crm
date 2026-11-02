import { api } from '@/core/api/apiClient';

const pad = (n) => String(n).padStart(2, '0');

export const monthLabelOf = (monthKey) => new Date(`${monthKey}-01T00:00:00`).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
export const currentMonthKey = () => {
    const d = new Date();
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
};

let structuresCache = [];

/*
 * Payroll is calculated and stored by the server (salary structures, runs, payslips). Employees receive only
 * their own structure and payslips.
 */
export const payrollService = {
    getSalaryStructures: async () => {
        const res = await api.get('/payroll/structures');
        structuresCache = res.data;
        return res.data;
    },
    /* Accepts the structure's id or the employee ID. */
    updateSalaryStructure: async (id, data) => {
        const struct = structuresCache.find((s) => s.id === id || s.employeeId === id);
        const employeeId = struct?.employeeId || id;
        const res = await api.put(`/payroll/structures/${encodeURIComponent(employeeId)}`, data);
        return res.data;
    },
    getPayslips: async () => (await api.get('/payroll/payslips')).data,
    getPayslipById: async (id) => (await payrollService.getPayslips()).find((p) => p.id === id || p.payslipNumber === id),
    getPayrollRuns: async () => (await api.get('/payroll/runs')).data,
    previewPayroll: async (monthKey) => (await api.get('/payroll/preview', { month: monthKey })).data,
    processPayroll: async (monthKey) => (await api.post('/payroll/runs', { month: monthKey })).data,
    markRunPaid: async (monthKey, reference) => (await api.put(`/payroll/runs/${encodeURIComponent(monthKey)}/paid`, { reference })).data,
};
