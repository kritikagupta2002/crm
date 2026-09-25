import { storage } from '@/core/storage/storage';
export const employeeService = {
    getAll: async () => {
        // Simulate brief network latency
        return new Promise(resolve => setTimeout(() => resolve(storage.getEmployees()), 100));
    },
    getById: async (id) => {
        const list = storage.getEmployees();
        return new Promise(resolve => setTimeout(() => resolve(list.find((e) => e.id === id || e.employeeId === id)), 80));
    },
    create: async (data) => {
        const list = storage.getEmployees();
        const newEmployee = {
            ...data,
            id: `emp-${Date.now()}`,
        };
        const updated = [newEmployee, ...list];
        storage.setEmployees(updated);
        // 1. Initialize personal leave balances for this employee
        storage.getBalancesForEmployee(newEmployee.employeeId, newEmployee.name);
        // 2. Initialize attendance slot for today
        try {
            const today = new Date().toLocaleDateString('en-CA');
            const attendanceList = storage.getAttendance();
            const exists = attendanceList.some((a) => a.employeeId === newEmployee.employeeId && a.date === today);
            if (!exists) {
                attendanceList.unshift({
                    id: `att-${Date.now()}`,
                    employeeId: newEmployee.employeeId,
                    employeeName: newEmployee.name,
                    department: newEmployee.employment.department,
                    date: today,
                    checkIn: '-',
                    checkOut: '-',
                    workingHours: '-',
                    lateBy: '-',
                    overtime: '-',
                    status: 'Present',
                    punchSource: 'Biometric - Jaipur HQ',
                });
                storage.setAttendance(attendanceList);
            }
        }
        catch (e) {
            console.error('Error initializing attendance for new employee:', e);
        }
        // 3. Initialize default salary structure based on onboarding salary
        try {
            const salaryList = storage.getSalaryStructures();
            const existingSal = salaryList.some((s) => s.employeeId === newEmployee.employeeId);
            if (!existingSal) {
                const baseMonthly = Number(newEmployee.baseSalary) || 55000;
                const annual = baseMonthly * 12;
                const basic = Math.round(baseMonthly * 0.5);
                const hra = Math.round(baseMonthly * 0.25);
                const special = Math.max(0, baseMonthly - basic - hra);
                const pf = Math.round(basic * 0.12);
                const pt = 200;
                const tds = baseMonthly >= 50000 ? 1200 : 0;
                const net = baseMonthly - pf - pt - tds;
                salaryList.unshift({
                    id: `ss-${Date.now()}`,
                    employeeId: newEmployee.employeeId,
                    employeeName: newEmployee.name,
                    department: newEmployee.employment.department,
                    designation: newEmployee.employment.designation,
                    annualCtc: annual,
                    monthlyGross: baseMonthly,
                    basic,
                    hra,
                    conveyance: 0,
                    specialAllowance: special,
                    siteAllowance: 0,
                    providentFund: pf,
                    professionalTax: pt,
                    esi: 0,
                    tds,
                    monthlyNet: net,
                    pf,
                    grossPay: baseMonthly,
                    netPay: net,
                    effectiveDate: newEmployee.employment.joiningDate || new Date().toLocaleDateString('en-CA'),
                    status: 'Active',
                });
                storage.setSalaryStructures(salaryList);
            }
        }
        catch (e) {
            console.error('Error initializing salary structure:', e);
        }
        // 4. Initialize onboarding identity & credential documents dossier
        try {
            const docList = storage.getEmployeeDocuments();
            const existingDocs = docList.some((d) => d.employeeId === newEmployee.employeeId);
            if (!existingDocs) {
                const today = new Date().toLocaleDateString('en-CA');
                docList.unshift({
                    id: `doc-aadhaar-${newEmployee.employeeId}`,
                    employeeId: newEmployee.employeeId,
                    employeeName: newEmployee.name,
                    department: newEmployee.employment.department,
                    documentType: 'Aadhaar Card',
                    fileName: `Aadhaar_${newEmployee.name.replace(/\s+/g, '_')}.pdf`,
                    fileSize: '1.2 MB',
                    uploadedOn: today,
                    status: 'Verified',
                }, {
                    id: `doc-pan-${newEmployee.employeeId}`,
                    employeeId: newEmployee.employeeId,
                    employeeName: newEmployee.name,
                    department: newEmployee.employment.department,
                    documentType: 'PAN Card',
                    fileName: `PAN_${newEmployee.name.replace(/\s+/g, '_')}.pdf`,
                    fileSize: '950 KB',
                    uploadedOn: today,
                    status: 'Verified',
                }, {
                    id: `doc-appt-${newEmployee.employeeId}`,
                    employeeId: newEmployee.employeeId,
                    employeeName: newEmployee.name,
                    department: newEmployee.employment.department,
                    documentType: 'Appointment Letter',
                    fileName: `BGSPL_Offer_Appointment_${newEmployee.name.replace(/\s+/g, '_')}.pdf`,
                    fileSize: '2.1 MB',
                    uploadedOn: today,
                    status: 'Verified',
                });
                storage.setEmployeeDocuments(docList);
            }
        }
        catch (e) {
            console.error('Error initializing documents dossier:', e);
        }
        return new Promise(resolve => setTimeout(() => resolve(newEmployee), 150));
    },
    update: async (id, data) => {
        const list = storage.getEmployees();
        const index = list.findIndex((e) => e.id === id || e.employeeId === id);
        if (index === -1)
            throw new Error('Employee not found');
        const updatedEmployee = { ...list[index], ...data };
        list[index] = updatedEmployee;
        storage.setEmployees([...list]);
        return new Promise(resolve => setTimeout(() => resolve(updatedEmployee), 120));
    },
    delete: async (id) => {
        const list = storage.getEmployees();
        const filtered = list.filter((e) => e.id !== id && e.employeeId !== id);
        storage.setEmployees(filtered);
        return new Promise(resolve => setTimeout(() => resolve(true), 100));
    }
};
