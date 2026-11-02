import { Router } from 'express';
import { today } from '../services/dates.js';
import { db } from '../services/db.js';
import { audit } from '../services/audit.js';
import { workingDates, firstRecordedDay, holidaySet } from '../services/workCalendar.js';
import { ValidationError } from '../services/crud.js';
import { authenticate, requirePermission } from '../middleware/auth.js';
import { can } from '../config/permissions.js';

const requireHrAdmin = requirePermission('payroll.manage');
const isHrAdmin = (user) => can(user, 'payroll.manage');

/*
 * Payroll: salary structures (one per employee), monthly runs and payslips.
 * Pay = structure earnings pro-rated for loss-of-pay days (days marked Absent; approved leave is paid),
 * PF on earned basic at the payroll-settings rate, professional tax from settings, ESI and TDS from the structure.
 */
const EARNINGS = ['basic', 'hra', 'conveyance', 'specialAllowance', 'siteAllowance'];
const DEDUCTIONS = ['esi', 'tds'];
const pad = (n) => String(n).padStart(2, '0');
const localMonth = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
};
const monthLabel = (key) => new Date(`${key}-01T00:00:00`).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
const money = (v) => Math.max(0, Math.round(Number(v) || 0));
const isActive = (e) => !['Inactive', 'Terminated', 'Resigned', 'Relieved'].includes(e.employment?.status || e.status);

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

function emptyStructure(emp) {
  return {
    id: `ss-${emp.employeeId}`,
    employeeId: emp.employeeId,
    employeeName: emp.name,
    department: emp.employment?.department || '',
    designation: emp.employment?.designation || '',
    ...Object.fromEntries([...EARNINGS, ...DEDUCTIONS].map((k) => [k, 0])),
    annualCtc: 0,
    monthlyGross: 0,
    providentFund: 0,
    professionalTax: 0,
    monthlyNet: 0,
    effectiveDate: '',
    status: 'Not set',
  };
}

/* Every active employee has a row; ones HR has not filled in yet show as "Not set". */
function allStructures() {
  const saved = db.get('salary_structures');
  return db.get('employees').filter(isActive).map((emp) => {
    const s = saved.find((x) => x.employeeId === emp.employeeId);
    return s ? { ...s, employeeName: emp.name, department: emp.employment?.department || '', designation: emp.employment?.designation || '' } : emptyStructure(emp);
  });
}

/*
 * Loss-of-pay days in a month: working days (no weekly off, no holiday) on which the person neither attended nor
 * had approved leave, plus days HR marked Absent. Only days from the portal's first recorded attendance, from the
 * joining date, and up to yesterday count, so days before go-live or still to come are never deducted.
 */
export function lossOfPayDays(emp, monthKey) {
  const goLive = firstRecordedDay();
  if (!goLive) return 0;
  const [y, m] = monthKey.split('-').map(Number);
  const monthStart = `${monthKey}-01`;
  const monthEnd = `${monthKey}-${String(new Date(y, m, 0).getDate()).padStart(2, '0')}`;
  const yesterday = (() => { const d = new Date(); d.setDate(d.getDate() - 1); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; })();
  const from = [monthStart, goLive, emp.employment?.joiningDate || monthStart].sort().pop();
  const to = [monthEnd, yesterday].sort()[0];
  if (from > to) return 0;

  const records = new Map(db.get('attendance').filter((a) => a.employeeId === emp.employeeId).map((a) => [a.date, a]));
  const leaveDays = new Set(db.get('leaves')
    .filter((l) => l.employeeId === emp.employeeId && ['Approved', 'Partially Approved'].includes(l.status))
    .flatMap((l) => workingDates(emp.employeeId, l.startDate, l.endDate).slice(0, Number(l.approvedDays) || 0)));
  const holidays = holidaySet();
  return workingDates(emp.employeeId, from, to, holidays).filter((d) => {
    const rec = records.get(d);
    if (rec?.status === 'Absent') return true;
    if (rec && ['Present', 'Late', 'On Leave', 'Half Day'].includes(rec.status)) return false;
    return !leaveDays.has(d);
  }).length;
}

export function payFor(emp, struct, monthKey) {
  const settings = db.get('payroll_settings') || {};
  const [y, m] = monthKey.split('-').map(Number);
  const workingDays = new Date(y, m, 0).getDate();
  const lopDays = lossOfPayDays(emp, monthKey);
  const paidDays = Math.max(0, workingDays - lopDays);
  const ratio = paidDays / workingDays;
  const earned = Object.fromEntries(EARNINGS.map((k) => [k, Math.round(money(struct[k]) * ratio)]));
  const grossEarnings = EARNINGS.reduce((sum, k) => sum + earned[k], 0);
  const providentFund = Math.round((earned.basic * Number(settings.pfDeductionPercentage ?? 12)) / 100);
  const professionalTax = grossEarnings > 0 ? money(settings.professionalTaxMonthly ?? 200) : 0;
  // ESI: a fixed amount in the structure wins; otherwise the settings rate applies when gross is within the
  // ESIC wage ceiling (₹21,000 a month).
  const esiEligible = grossEarnings > 0 && grossEarnings <= 21000;
  const esi = money(struct.esi) > 0
    ? Math.round(money(struct.esi) * ratio)
    : esiEligible ? Math.round((grossEarnings * Number(settings.esiEmployeePercentage ?? 0.75)) / 100) : 0;
  const employerEsi = esiEligible ? Math.round((grossEarnings * Number(settings.esiEmployerPercentage ?? 3.25)) / 100) : 0;
  const tds = Math.round(money(struct.tds) * ratio);
  const totalDeductions = providentFund + professionalTax + esi + tds;
  return { workingDays, paidDays, lopDays, ...earned, bonus: 0, grossEarnings, providentFund, professionalTax, esi, employerEsi, tds, otherDeductions: 0, totalDeductions, netSalary: grossEarnings - totalDeductions };
}

function preview(monthKey) {
  const rows = [];
  const skipped = [];
  const employees = db.get('employees');
  for (const struct of allStructures()) {
    const emp = employees.find((e) => e.employeeId === struct.employeeId);
    if (struct.status !== 'Active' || !(struct.monthlyGross > 0)) {
      skipped.push({ employeeId: emp.employeeId, name: emp.name, reason: 'Salary structure not set' });
      continue;
    }
    rows.push({ emp, struct, pay: payFor(emp, struct, monthKey) });
  }
  const total = (k) => rows.reduce((sum, r) => sum + r.pay[k], 0);
  return { rows, skipped, totalGross: total('grossEarnings'), totalDeductions: total('totalDeductions'), totalNet: total('netSalary') };
}

const router = Router();
router.use(authenticate);

router.get('/structures', requirePermission('payroll.manage', 'payroll.view_own'), (req, res) => {
  const list = allStructures();
  res.json({ success: true, data: isHrAdmin(req.user) ? list : list.filter((s) => s.employeeId === req.user.employeeId) });
});

router.put('/structures/:employeeId', requireHrAdmin, (req, res, next) => {
  try {
    const emp = db.get('employees').find((e) => e.employeeId === req.params.employeeId);
    if (!emp) throw new ValidationError('Employee not found.');
    const body = req.body || {};
    const values = Object.fromEntries([...EARNINGS, ...DEDUCTIONS].map((k) => [k, money(body[k])]));
    const monthlyGross = EARNINGS.reduce((sum, k) => sum + values[k], 0);
    if (monthlyGross > 0 && values.basic <= 0) throw new ValidationError('Basic salary is required.');
    const settings = db.get('payroll_settings') || {};
    const providentFund = Math.round((values.basic * Number(settings.pfDeductionPercentage ?? 12)) / 100);
    const professionalTax = monthlyGross > 0 ? money(settings.professionalTaxMonthly ?? 200) : 0;
    const saved = db.get('salary_structures');
    const existing = saved.find((s) => s.employeeId === emp.employeeId);
    const record = {
      ...emptyStructure(emp),
      ...values,
      monthlyGross,
      annualCtc: money(body.annualCtc) || monthlyGross * 12,
      providentFund,
      professionalTax,
      monthlyNet: monthlyGross - providentFund - professionalTax - values.esi - values.tds,
      effectiveDate: body.effectiveDate || existing?.effectiveDate || today(),
      status: monthlyGross > 0 ? 'Active' : 'Not set',
      updatedAt: new Date().toISOString(),
      updatedBy: req.user.name,
    };
    db.set('salary_structures', existing ? saved.map((s) => (s.employeeId === emp.employeeId ? record : s)) : [record, ...saved]);
    audit(req, existing ? 'update' : 'create', 'salary_structures', emp.employeeId, `Salary structure for ${emp.name}: gross ₹${monthlyGross}/month`);
    res.json({ success: true, data: record });
  } catch (err) {
    next(err);
  }
});

router.get('/preview', requireHrAdmin, (req, res, next) => {
  try {
    const month = String(req.query.month || localMonth());
    if (!/^\d{4}-\d{2}$/.test(month)) throw new ValidationError('Choose a valid month.');
    const p = preview(month);
    res.json({
      success: true,
      data: {
        ...p,
        rows: p.rows.map(({ emp, struct, pay }) => ({
          emp: { employeeId: emp.employeeId, name: emp.name, employment: { department: emp.employment?.department, designation: emp.employment?.designation } },
          struct,
          pay,
        })),
      },
    });
  } catch (err) {
    next(err);
  }
});

router.get('/runs', requireHrAdmin, (req, res) => {
  res.json({ success: true, data: [...db.get('payroll_runs')].sort((a, b) => b.monthKey.localeCompare(a.monthKey)) });
});

router.post('/runs', requireHrAdmin, (req, res, next) => {
  try {
    const monthKey = String(req.body?.month || '');
    if (!/^\d{4}-\d{2}$/.test(monthKey)) throw new ValidationError('Choose the month to process.');
    if (monthKey > localMonth()) throw new ValidationError('A future month cannot be processed.');
    if (db.get('payroll_runs').some((r) => r.monthKey === monthKey)) throw new ValidationError(`Payroll for ${monthLabel(monthKey)} is already processed.`);
    const { rows, skipped, totalGross, totalDeductions, totalNet } = preview(monthKey);
    if (!rows.length) throw new ValidationError('No employee has a salary structure yet.');

    const month = monthLabel(monthKey);
    const [y, m] = monthKey.split('-');
    const payslips = rows.map(({ emp, pay }, i) => ({
      id: `ps-${monthKey}-${emp.employeeId.replace(/\W/g, '')}`,
      payslipNumber: `BGS/PAY/${y}/${m}/${pad3(i + 1)}`,
      employeeId: emp.employeeId,
      employeeName: emp.name,
      department: emp.employment?.department || '',
      designation: emp.employment?.designation || '',
      joiningDate: emp.employment?.joiningDate || '',
      pan: emp.bank?.panNumber || '',
      uan: emp.bank?.uanNumber || '',
      bankName: emp.bank?.bankName || '',
      accountNumber: emp.bank?.accountNumber ? `XXXX XXXX ${String(emp.bank.accountNumber).slice(-4)}` : '',
      month,
      monthKey,
      ...pay,
      netSalaryInWords: rupeesInWords(pay.netSalary),
      paymentStatus: 'Processing',
      paymentDate: '',
      transactionRef: '',
    }));
    db.set('payslips', [...payslips, ...db.get('payslips').filter((p) => p.monthKey !== monthKey)]);
    const run = {
      id: `pr-${monthKey}`,
      month,
      monthKey,
      processedDate: today(),
      totalEmployees: payslips.length,
      totalGross,
      totalDeductions,
      totalNetDisbursed: totalNet,
      status: 'Processing',
      processedBy: req.user.name,
      skipped,
    };
    db.insert('payroll_runs', run);
    audit(req, 'process', 'payroll_runs', run.id, `Payroll for ${month} processed: ${payslips.length} payslips, net ₹${totalNet}`);
    res.status(201).json({ success: true, data: run });
  } catch (err) {
    next(err);
  }
});

router.put('/runs/:monthKey/paid', requireHrAdmin, (req, res, next) => {
  try {
    const reference = String(req.body?.reference || '').trim();
    if (!reference) throw new ValidationError('Enter the bank transfer reference.');
    const run = db.get('payroll_runs').find((r) => r.monthKey === req.params.monthKey);
    if (!run) return res.status(404).json({ success: false, error: 'Payroll run not found.' });
    if (run.status !== 'Processing') throw new ValidationError('This run is already marked paid.');
    const paidDate = today();
    const updated = db.update('payroll_runs', run.id, { status: 'Completed', paidDate, transactionRef: reference, paidBy: req.user.name });
    db.set('payslips', db.get('payslips').map((p) => (p.monthKey === run.monthKey ? { ...p, paymentStatus: 'Paid', paymentDate: paidDate, transactionRef: reference } : p)));
    audit(req, 'pay', 'payroll_runs', run.id, `Payroll for ${run.month} marked paid (ref ${reference})`);
    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
});

router.get('/payslips', requirePermission('payroll.manage', 'payroll.view_own'), (req, res) => {
  const all = db.get('payslips');
  const data = isHrAdmin(req.user) ? all : all.filter((p) => p.employeeId === req.user.employeeId);
  res.json({ success: true, data: [...data].sort((a, b) => b.monthKey.localeCompare(a.monthKey)) });
});

function pad3(n) {
  return String(n).padStart(3, '0');
}

export default router;
