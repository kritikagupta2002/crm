import { storage } from '@/core/storage/storage';
export const payrollService = {
    getSalaryStructures: async () => {
        const list = storage.getSalaryStructures();
        const employees = storage.getEmployees();
        let updated = false;
        for (const emp of employees) {
            const exists = list.some((s) => s.employeeId === emp.employeeId);
            if (!exists) {
                list.push({
                    id: `ss-${emp.employeeId}`,
                    employeeId: emp.employeeId,
                    employeeName: emp.name,
                    department: emp.employment.department,
                    designation: emp.employment.designation,
                    annualCtc: 660000,
                    monthlyGross: 55000,
                    basic: 30000,
                    hra: 15000,
                    conveyance: 0,
                    specialAllowance: 10000,
                    siteAllowance: 0,
                    providentFund: 3600,
                    professionalTax: 200,
                    esi: 0,
                    tds: 1200,
                    monthlyNet: 50000,
                    pf: 3600,
                    grossPay: 55000,
                    netPay: 50000,
                    effectiveDate: emp.employment.joiningDate || new Date().toLocaleDateString('en-CA'),
                    status: 'Active',
                });
                updated = true;
            }
        }
        if (updated) {
            storage.setSalaryStructures(list);
        }
        return new Promise(resolve => setTimeout(() => resolve(list), 80));
    },
    updateSalaryStructure: async (id, data) => {
        const list = storage.getSalaryStructures();
        const idx = list.findIndex((s) => s.id === id || s.employeeId === id);
        if (idx === -1)
            throw new Error('Structure not found');
        list[idx] = { ...list[idx], ...data };
        storage.setSalaryStructures([...list]);
        return new Promise(resolve => setTimeout(() => resolve(list[idx]), 100));
    },
    getPayslips: async () => {
        return new Promise(resolve => setTimeout(() => resolve(storage.getPayslips()), 80));
    },
    getPayslipById: async (id) => {
        const list = storage.getPayslips();
        return new Promise(resolve => setTimeout(() => resolve(list.find((p) => p.id === id || p.payslipNumber === id)), 80));
    },
    getPayrollRuns: async () => {
        return new Promise(resolve => setTimeout(() => resolve(storage.getPayrollRuns()), 80));
    },
    processPayroll: async (monthKey, monthLabel, processedBy) => {
        const runs = storage.getPayrollRuns();
        const count = storage.getEmployees().length;
        const newRun = {
            id: `pr-${monthKey}`,
            month: monthLabel,
            monthKey,
            processedDate: new Date().toLocaleDateString('en-CA'),
            totalEmployees: count,
            totalGross: count * 65000,
            totalDeductions: count * 7500,
            totalNetDisbursed: count * 57500,
            status: 'Completed',
            processedBy,
        };
        storage.setPayrollRuns([newRun, ...runs.filter((r) => r.monthKey !== monthKey)]);
        return new Promise(resolve => setTimeout(() => resolve(newRun), 300));
    }
};
