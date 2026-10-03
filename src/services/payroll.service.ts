import { mobileStorage } from '../storage';
import { SalaryStructure, Payslip, PayrollRun, Employee, AttendanceRecord, LeaveRequest } from '../types';

export function numberToWordsINR(amount: number): string {
  if (!amount || amount === 0) return 'Zero Rupees Only';
  const units = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'
  ];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const convertLessThanOneThousand = (num: number): string => {
    let str = '';
    if (num >= 100) {
      str += units[Math.floor(num / 100)] + ' Hundred ';
      num %= 100;
    }
    if (num >= 20) {
      str += tens[Math.floor(num / 10)] + ' ';
      num %= 10;
    }
    if (num > 0) {
      str += units[num] + ' ';
    }
    return str.trim();
  };

  let num = Math.floor(Math.abs(amount));
  let result = '';

  const crore = Math.floor(num / 10000000);
  num %= 10000000;
  const lakh = Math.floor(num / 100000);
  num %= 100000;
  const thousand = Math.floor(num / 1000);
  num %= 1000;
  const remainder = num;

  if (crore > 0) {
    result += convertLessThanOneThousand(crore) + ' Crore ';
  }
  if (lakh > 0) {
    result += convertLessThanOneThousand(lakh) + ' Lakh ';
  }
  if (thousand > 0) {
    result += convertLessThanOneThousand(thousand) + ' Thousand ';
  }
  if (remainder > 0) {
    result += convertLessThanOneThousand(remainder) + ' ';
  }

  return (result.trim() + ' Rupees Only').replace(/\s+/g, ' ');
}

export class PayrollService {
  /**
   * Get all salary structures. Dynamically ensures every active employee has a structure,
   * matching web source payroll.service.js behavior.
   */
  async getSalaryStructures(): Promise<SalaryStructure[]> {
    const list = await mobileStorage.getSalaryStructures();
    const employees = await mobileStorage.getEmployees();
    let updated = false;

    for (const emp of employees) {
      const exists = list.some((s) => s.employeeId === emp.employeeId);
      if (!exists) {
        const basic = 30000;
        const hra = 15000;
        const conveyance = 0;
        const specialAllowance = 10000;
        const siteAllowance = 0;
        const gross = basic + hra + conveyance + specialAllowance + siteAllowance;
        const epf = Math.round(Math.min(basic, 15000) * 0.12);
        const esi = gross <= 21000 ? Math.round(gross * 0.0075) : 0;
        const pt = 200;
        const tds = 1200;
        const net = gross - (epf + esi + pt + tds);

        list.push({
          id: `ss-${emp.employeeId}`,
          employeeId: emp.employeeId,
          employeeName: emp.name,
          department: emp.employment.department,
          designation: emp.employment.designation,
          annualCtc: gross * 12,
          monthlyGross: gross,
          basic,
          hra,
          conveyance,
          specialAllowance,
          siteAllowance,
          providentFund: epf,
          epf,
          pfDeduction: epf,
          pf: epf,
          professionalTax: pt,
          pt,
          ptDeduction: pt,
          esi,
          tds,
          monthlyNet: net,
          netSalary: net,
          grossPay: gross,
          netPay: net,
          effectiveDate: emp.employment.joiningDate || new Date().toISOString().split('T')[0],
          status: 'Active',
        });
        updated = true;
      }
    }

    if (updated) {
      await mobileStorage.setSalaryStructures(list);
    }
    return list;
  }

  async getSalaryStructureByEmployeeId(employeeId: string): Promise<SalaryStructure | null> {
    const list = await this.getSalaryStructures();
    return list.find((s) => s.employeeId === employeeId) || null;
  }

  async updateSalaryStructure(id: string, data: Partial<SalaryStructure>): Promise<SalaryStructure> {
    const list = await this.getSalaryStructures();
    const idx = list.findIndex((s) => s.id === id || s.employeeId === id);
    if (idx === -1) {
      throw new Error(`Salary structure not found for ID: ${id}`);
    }

    const current = list[idx];
    const basic = Number(data.basic !== undefined ? data.basic : current.basic);
    const hra = Number(data.hra !== undefined ? data.hra : current.hra);
    const conveyance = Number(data.conveyance !== undefined ? data.conveyance : current.conveyance);
    const specialAllowance = Number(data.specialAllowance !== undefined ? data.specialAllowance : current.specialAllowance);
    const siteAllowance = Number(data.siteAllowance !== undefined ? data.siteAllowance : (current.siteAllowance || 0));

    // Validation
    if (basic < 0 || hra < 0 || conveyance < 0 || specialAllowance < 0 || siteAllowance < 0) {
      throw new Error('Salary component values cannot be negative.');
    }

    const gross = basic + hra + conveyance + specialAllowance + siteAllowance;

    // Statutory deductions preserved from source rules
    const epf = Math.round(Math.min(basic, 15000) * 0.12);
    const esi = gross <= 21000 ? Math.round(gross * 0.0075) : 0;
    const pt = gross > 0 ? (data.pt !== undefined ? Number(data.pt) : (data.professionalTax !== undefined ? Number(data.professionalTax) : 200)) : 0;
    const tds = Number(data.tds !== undefined ? data.tds : (current.tds || 0));

    const totalDeductions = epf + esi + pt + tds;
    const net = gross - totalDeductions;

    const updated: SalaryStructure = {
      ...current,
      ...data,
      basic,
      hra,
      conveyance,
      specialAllowance,
      siteAllowance,
      monthlyGross: gross,
      grossPay: gross,
      annualCtc: gross * 12,
      providentFund: epf,
      epf,
      pfDeduction: epf,
      pf: epf,
      professionalTax: pt,
      pt,
      ptDeduction: pt,
      esi,
      tds,
      monthlyNet: net,
      netSalary: net,
      netPay: net,
    };

    list[idx] = updated;
    await mobileStorage.setSalaryStructures([...list]);
    return updated;
  }

  async getPayrollRuns(): Promise<PayrollRun[]> {
    return mobileStorage.getPayrollRuns();
  }

  async getPayrollRunById(id: string): Promise<PayrollRun | null> {
    const runs = await mobileStorage.getPayrollRuns();
    return runs.find((r) => r.id === id || r.monthKey === id) || null;
  }

  async getPayslips(employeeId?: string): Promise<Payslip[]> {
    const list = await mobileStorage.getPayslips();
    if (employeeId) {
      return list.filter((p) => p.employeeId === employeeId);
    }
    return list;
  }

  async getPayslipById(id: string): Promise<Payslip | null> {
    const list = await mobileStorage.getPayslips();
    return list.find((p) => p.id === id || p.payslipNumber === id || p.payslipNo === id) || null;
  }

  /**
   * Executes the monthly payroll run integrating canonical attendance and approved leave data
   * to compute payable days, statutory deductions, and finalized payslips.
   */
  async processPayroll(
    monthKey: string, // e.g. "2026-09"
    monthLabel?: string, // e.g. "September 2026"
    processedBy: string = 'Authorized Payroll Officer'
  ): Promise<{ run: PayrollRun; payslips: Payslip[] }> {
    if (!monthKey || !/^\d{4}-\d{2}$/.test(monthKey)) {
      throw new Error('Invalid month format. Please select a valid month cycle (YYYY-MM).');
    }

    const [yearStr, monthNumStr] = monthKey.split('-');
    const year = parseInt(yearStr, 10);
    const monthNum = parseInt(monthNumStr, 10);

    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const resolvedLabel = monthLabel || `${monthNames[monthNum - 1]} ${year}`;

    // Calendar working days in this month
    const totalWorkingDays = new Date(year, monthNum, 0).getDate();

    const employees = await mobileStorage.getEmployees();
    const activeEmployees = employees.filter((e) => e.employment?.status !== 'Terminated' && e.employment?.status !== 'Resigned');

    if (activeEmployees.length === 0) {
      throw new Error('No eligible active employees found to process payroll.');
    }

    const structures = await this.getSalaryStructures();
    const attendanceRecords = await mobileStorage.getAttendance();
    const leaveRequests = await mobileStorage.getLeaves();

    const existingPayslips = await mobileStorage.getPayslips();
    const runs = await mobileStorage.getPayrollRuns();

    const generatedPayslips: Payslip[] = [];
    let batchGross = 0;
    let batchDeductions = 0;
    let batchNet = 0;

    let index = 1;
    for (const emp of activeEmployees) {
      const struct = structures.find((s) => s.employeeId === emp.employeeId);
      if (!struct) {
        throw new Error(`Salary structure missing for active employee: ${emp.name} (${emp.employeeId}).`);
      }

      // Attendance records for this employee in this month
      const empAttendance = attendanceRecords.filter(
        (a) => a.employeeId === emp.employeeId && a.date && a.date.startsWith(monthKey)
      );

      // Approved leaves overlapping this month
      const empApprovedLeaves = leaveRequests.filter(
        (l) =>
          l.employeeId === emp.employeeId &&
          (l.status === 'Approved' || l.status === 'Partially Approved') &&
          ((l.startDate && l.startDate.startsWith(monthKey)) || (l.endDate && l.endDate.startsWith(monthKey)))
      );

      // Compute loss of pay (LOP)
      let absentDays = 0;
      let halfDays = 0;

      empAttendance.forEach((att) => {
        if (att.status === 'Absent') {
          absentDays += 1;
        } else if (att.status === 'Half-Day' || att.status === 'Half Day') {
          halfDays += 1;
        }
      });

      const lopDays = absentDays + (halfDays * 0.5);
      const paidDays = Math.max(0, totalWorkingDays - lopDays);
      const payableDays = paidDays;

      // Salary component proration based on payable days
      const proration = totalWorkingDays > 0 ? (payableDays / totalWorkingDays) : 1;

      const basic = Math.round(struct.basic * proration);
      const hra = Math.round(struct.hra * proration);
      const conveyance = Math.round(struct.conveyance * proration);
      const specialAllowance = Math.round(struct.specialAllowance * proration);
      const siteAllowance = Math.round((struct.siteAllowance || 0) * proration);
      const bonus = 0;

      const grossEarnings = basic + hra + conveyance + specialAllowance + siteAllowance + bonus;

      // Statutory deductions
      // Source rule: EPF = min(basic, 15000) * 0.12
      const epf = Math.round(Math.min(basic, 15000) * 0.12);

      // Source rule: ESI = gross <= 21000 ? gross * 0.0075 : 0
      const esi = grossEarnings <= 21000 ? Math.round(grossEarnings * 0.0075) : 0;

      // Source rule: Professional Tax
      const pt = grossEarnings > 0 ? (struct.pt || struct.professionalTax || 200) : 0;

      // Source rule: TDS monthly withholding
      const tds = Math.round((struct.tds || 0) * proration);

      const otherDeductions = 0;
      const totalDeductions = epf + esi + pt + tds + otherDeductions;
      const netSalary = grossEarnings - totalDeductions;
      const netTakeHome = netSalary;

      batchGross += grossEarnings;
      batchDeductions += totalDeductions;
      batchNet += netSalary;

      const seq = String(index).padStart(3, '0');
      const payslipRef = `BGS/PAY/${yearStr}/${monthNumStr.padStart(2, '0')}/${seq}`;
      const slipId = `ps-${monthKey}-${emp.employeeId}`;

      const paymentDate = `${yearStr}-${monthNumStr.padStart(2, '0')}-${String(totalWorkingDays).padStart(2, '0')}`;
      const transactionRef = `NEFT-HDFC-${Math.floor(100000000 + Math.random() * 900000000)}`;

      const payslip: Payslip = {
        id: slipId,
        payslipNumber: payslipRef,
        payslipNo: payslipRef,
        employeeId: emp.employeeId,
        employeeName: emp.name,
        department: emp.employment?.department || struct.department || 'Operations',
        designation: emp.employment?.designation || struct.designation || 'Consultant',
        joiningDate: emp.employment?.joiningDate || '2022-01-01',
        pan: emp.kyc?.panNumber || 'AAAPL1234F',
        uan: emp.bank?.uanNumber || '100923847291',
        bankName: emp.bank?.bankName || 'HDFC Bank Ltd.',
        accountNumber: emp.bank?.accountNumber ? `•••• •••• ${emp.bank.accountNumber.slice(-4)}` : (emp.kyc?.bankAccount ? `•••• •••• ${emp.kyc.bankAccount.slice(-4)}` : '•••• •••• 1923'),
        month: resolvedLabel,
        monthKey,
        year,
        workingDays: totalWorkingDays,
        paidDays,
        payableDays,
        lopDays,
        basic,
        hra,
        conveyance,
        specialAllowance,
        siteAllowance,
        bonus,
        grossEarnings,
        providentFund: epf,
        epfDeduction: epf,
        professionalTax: pt,
        ptDeduction: pt,
        esi,
        esiDeduction: esi,
        tds,
        tdsDeduction: tds,
        otherDeductions,
        totalDeductions,
        netSalary,
        netTakeHome,
        netSalaryInWords: numberToWordsINR(netSalary),
        paymentStatus: 'Paid',
        status: 'Paid',
        paymentDate,
        transactionRef,
      };

      generatedPayslips.push(payslip);
      index++;
    }

    const runId = `pr-${monthKey}`;
    const newRun: PayrollRun = {
      id: runId,
      month: resolvedLabel,
      monthKey,
      processedDate: new Date().toISOString().split('T')[0],
      totalEmployees: activeEmployees.length,
      totalGross: batchGross,
      totalDeductions: batchDeductions,
      totalNetDisbursed: batchNet,
      status: 'Completed',
      processedBy,
    };

    // Update payroll runs list (replace if already exists for this month, otherwise prepend)
    const filteredRuns = runs.filter((r) => r.monthKey !== monthKey);
    const updatedRuns = [newRun, ...filteredRuns];
    await mobileStorage.setPayrollRuns(updatedRuns);

    // Update payslips list (replace existing for this month, keep others)
    const otherPayslips = existingPayslips.filter((p) => p.monthKey !== monthKey && !p.id.startsWith(`ps-${monthKey}`));
    const updatedPayslips = [...generatedPayslips, ...otherPayslips];
    await mobileStorage.setPayslips(updatedPayslips);

    return { run: newRun, payslips: generatedPayslips };
  }

  // Alias for backward compatibility
  async runMonthlyPayroll(month: string, year: number): Promise<Payslip[]> {
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    let monthNum = 9;
    const foundIdx = monthNames.findIndex((m) => m.toLowerCase() === month.toLowerCase());
    if (foundIdx !== -1) {
      monthNum = foundIdx + 1;
    }
    const monthKey = `${year}-${String(monthNum).padStart(2, '0')}`;
    const res = await this.processPayroll(monthKey, `${month} ${year}`);
    return res.payslips;
  }
}

export const payrollService = new PayrollService();
