import { INITIAL_SALARY_STRUCTURES } from '../../../data/payroll/payroll.js';
import { storage } from '@/core/storage/storage';

const later = (value, ms = 80) => new Promise((resolve) => setTimeout(() => resolve(value), ms));
const pad = (n) => String(n).padStart(2, '0');
const EARNINGS = ['basic', 'hra', 'conveyance', 'specialAllowance', 'siteAllowance'];

export const monthLabelOf = (monthKey) => new Date(`${monthKey}-01T00:00:00`).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
export const currentMonthKey = () => {
    const d = new Date();
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
};

/* Rupees in words, Indian grouping: 250400 → "Two Lakh Fifty Thousand Four Hundred Rupees Only". */
export function rupeesInWords(amount) {
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    const two = (n) => (n < 20 ? ones[n] : `${tens[Math.floor(n / 10)]}${n % 10 ? ` ${ones[n % 10]}` : ''}`);
    const three = (n) => [n >= 100 ? `${ones[Math.floor(n / 100)]} Hundred` : '', two(n % 100)].filter(Boolean).join(' ');
    let n = Math.round(Number(amount) || 0);
    if (n === 0) return 'Zero Rupees Only';
    const parts = [];
    const crore = Math.floor(n / 10000000); n %= 10000000;
    const lakh = Math.floor(n / 100000); n %= 100000;
    const thousand = Math.floor(n / 1000); n %= 1000;
    if (crore) parts.push(`${three(crore)} Crore`);
    if (lakh) parts.push(`${two(lakh)} Lakh`);
    if (thousand) parts.push(`${two(thousand)} Thousand`);
    if (n) parts.push(three(n));
    return `${parts.join(' ')} Rupees Only`;
}

const isSet = (s) => s && s.status !== 'Not set' && Number(s.monthlyGross) > 0;

/*
 * One person's pay for a month: earnings cut for loss-of-pay days (days marked Absent in the register;
 * approved leave is paid), PF on the basic at the payroll-settings rate, PT from the settings, and the
 * ESI and TDS set in the salary structure.
 */
function payFor(emp, struct, monthKey, attendance, settings) {
    const [y, m] = monthKey.split('-').map(Number);
    const workingDays = new Date(y, m, 0).getDate();
    const lopDays = attendance.filter((a) => a.employeeId === emp.employeeId && a.date.startsWith(monthKey) && a.status === 'Absent').length;
    const paidDays = Math.max(0, workingDays - lopDays);
    const ratio = paidDays / workingDays;
    const earned = Object.fromEntries(EARNINGS.map((k) => [k, Math.round((Number(struct[k]) || 0) * ratio)]));
    const grossEarnings = EARNINGS.reduce((sum, k) => sum + earned[k], 0);
    const providentFund = Math.round((earned.basic * Number(settings.pfDeductionPercentage ?? 12)) / 100);
    const professionalTax = grossEarnings > 0 ? Number(settings.professionalTaxMonthly ?? struct.professionalTax ?? 0) : 0;
    const esi = Math.round((Number(struct.esi) || 0) * ratio);
    const tds = Math.round((Number(struct.tds) || 0) * ratio);
    const totalDeductions = providentFund + professionalTax + esi + tds;
    const netSalary = grossEarnings - totalDeductions;
    return { workingDays, paidDays, lopDays, ...earned, bonus: 0, grossEarnings, providentFund, professionalTax, esi, tds, otherDeductions: 0, totalDeductions, netSalary };
}

export const payrollService = {
    /* Everyone on the rolls has a structure row; one HR has not filled in yet shows as "Not set". */
    getSalaryStructures: async () => {
        const list = storage.getSalaryStructures();
        const employees = storage.getEmployees();
        let updated = false;
        for (const emp of employees) {
            const existing = list.find((s) => s.employeeId === emp.employeeId);
            const seed = INITIAL_SALARY_STRUCTURES.find((s) => s.employeeId === emp.employeeId);
            if (!existing) {
                if (seed) {
                    list.push({ ...seed });
                } else {
                    list.push({
                        id: `ss-${emp.employeeId}`,
                        employeeId: emp.employeeId,
                        employeeName: emp.name,
                        department: emp.employment?.department ?? '',
                        designation: emp.employment?.designation ?? '',
                        annualCtc: 0,
                        monthlyGross: 0,
                        basic: 0,
                        hra: 0,
                        conveyance: 0,
                        specialAllowance: 0,
                        siteAllowance: 0,
                        providentFund: 0,
                        professionalTax: 0,
                        esi: 0,
                        tds: 0,
                        monthlyNet: 0,
                        effectiveDate: '',
                        status: 'Not set',
                    });
                }
                updated = true;
            } else if ((existing.status === 'Not set' || !existing.monthlyGross) && seed) {
                Object.assign(existing, { ...seed });
                updated = true;
            }
        }
        if (updated) storage.setSalaryStructures(list);
        return later(list);
    },

    updateSalaryStructure: async (id, data) => {
        const list = storage.getSalaryStructures();
        const idx = list.findIndex((s) => s.id === id || s.employeeId === id);
        if (idx === -1) throw new Error('Salary structure not found.');
        const next = { ...list[idx], ...data };
        next.status = Number(next.monthlyGross) > 0 ? 'Active' : 'Not set';
        if (next.status === 'Active' && !next.effectiveDate) next.effectiveDate = new Date().toLocaleDateString('en-CA');
        list[idx] = next;
        storage.setSalaryStructures([...list]);
        return later(next, 100);
    },

    getPayslips: async () => later(storage.getPayslips()),

    getPayslipById: async (id) => later(storage.getPayslips().find((p) => p.id === id || p.payslipNumber === id)),

    getPayrollRuns: async () => later(storage.getPayrollRuns()),

    /* What a run for the month would pay, before it is processed: one row per active employee. */
    previewPayroll: async (monthKey) => {
        await payrollService.getSalaryStructures();
        const structures = storage.getSalaryStructures();
        const attendance = storage.getAttendance();
        const settings = storage.getPayrollSettings();
        const rows = [];
        const skipped = [];
        storage.getEmployees()
            .filter((e) => !['Terminated', 'Resigned', 'Inactive'].includes(e.employment?.status))
            .forEach((emp) => {
                const struct = structures.find((s) => s.employeeId === emp.employeeId);
                if (!isSet(struct)) {
                    skipped.push({ employeeId: emp.employeeId, name: emp.name, reason: 'Salary structure not set' });
                    return;
                }
                rows.push({ emp, struct, pay: payFor(emp, struct, monthKey, attendance, settings) });
            });
        const total = (k) => rows.reduce((sum, r) => sum + r.pay[k], 0);
        return later({ rows, skipped, totalGross: total('grossEarnings'), totalDeductions: total('totalDeductions'), totalNet: total('netSalary') });
    },

    /* Processes the month: a payslip for each employee with a salary structure, and the run's totals from them. */
    processPayroll: async (monthKey, processedBy) => {
        if (!/^\d{4}-\d{2}$/.test(monthKey)) throw new Error('Choose the month to process.');
        if (monthKey > currentMonthKey()) throw new Error('A future month cannot be processed.');
        const runs = storage.getPayrollRuns();
        if (runs.some((r) => r.monthKey === monthKey)) throw new Error(`Payroll for ${monthLabelOf(monthKey)} is already processed.`);
        const { rows, skipped, totalGross, totalDeductions, totalNet } = await payrollService.previewPayroll(monthKey);
        if (!rows.length) throw new Error('No employee has a salary structure yet.');
        const month = monthLabelOf(monthKey);
        const [y, m] = monthKey.split('-');
        const payslips = rows.map(({ emp, pay }, i) => ({
            id: `ps-${monthKey}-${pad(i + 1)}${emp.employeeId}`,
            payslipNumber: `BGS/PAY/${y}/${m}/${String(i + 1).padStart(3, '0')}`,
            employeeId: emp.employeeId,
            employeeName: emp.name,
            department: emp.employment?.department ?? '',
            designation: emp.employment?.designation ?? '',
            joiningDate: emp.employment?.joiningDate ?? '',
            pan: emp.bank?.panNumber ?? '',
            uan: emp.bank?.uanNumber ?? '',
            bankName: emp.bank?.bankName ?? '',
            accountNumber: emp.bank?.accountNumber ? `•••• •••• ${emp.bank.accountNumber.slice(-4)}` : '',
            month,
            monthKey,
            ...pay,
            netSalaryInWords: rupeesInWords(pay.netSalary),
            paymentStatus: 'Processing',
            paymentDate: '',
            transactionRef: '',
        }));
        storage.setPayslips([...payslips, ...storage.getPayslips().filter((p) => p.monthKey !== monthKey)]);
        const newRun = {
            id: `pr-${monthKey}`,
            month,
            monthKey,
            processedDate: new Date().toLocaleDateString('en-CA'),
            totalEmployees: payslips.length,
            totalGross,
            totalDeductions,
            totalNetDisbursed: totalNet,
            status: 'Processing',
            processedBy,
            skipped,
        };
        storage.setPayrollRuns([newRun, ...runs]);
        return later(newRun, 300);
    },

    /* The bank transfer is done: the run and its payslips are marked paid with the bank reference. */
    markRunPaid: async (monthKey, reference) => {
        if (!reference?.trim()) throw new Error('Enter the bank transfer reference.');
        const runs = storage.getPayrollRuns();
        const run = runs.find((r) => r.monthKey === monthKey);
        if (!run) throw new Error('Payroll run not found.');
        if (run.status !== 'Processing') throw new Error('This run is already paid.');
        const paidOn = new Date().toLocaleDateString('en-CA');
        run.status = 'Completed';
        run.paidDate = paidOn;
        run.transactionRef = reference.trim();
        storage.setPayrollRuns([...runs]);
        storage.setPayslips(storage.getPayslips().map((p) => (p.monthKey === monthKey ? { ...p, paymentStatus: 'Paid', paymentDate: paidOn, transactionRef: reference.trim() } : p)));
        return later(run, 100);
    },
};
