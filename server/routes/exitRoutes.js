import { Router } from 'express';
import { today } from '../services/dates.js';
import { db } from '../services/db.js';
import { audit } from '../services/audit.js';
import { ValidationError, DATE } from '../services/crud.js';
import { authenticate, requirePermission } from '../middleware/auth.js';
import { can } from '../config/permissions.js';

const requireHr = requirePermission('exits.manage');
const requireHrAdmin = requirePermission('exits.manage');

/*
 * Separation workflow: initiate -> department clearances -> full & final settlement -> relieved.
 * The settlement is computed here from the salary structure, leave balance and service length:
 *   - salary for the days worked in the final month (gross / days in month x day of LWD)
 *   - leave encashment for unused encashable leave (basic / 26 per day)
 *   - gratuity after 5 years of service (15/26 x basic x completed years; 6+ months rounds up)
 *   - notice shortfall recovered at the daily gross rate
 */
const CLEARANCE_DEPARTMENTS = ['Reporting Manager', 'IT & Field Equipment', 'Accounts & Finance', 'HR & Administration'];
const DAY = 24 * 60 * 60 * 1000;
const daysBetween = (a, b) => Math.round((new Date(b) - new Date(a)) / DAY);

function settlementFor(emp, resignationDate, lwd, noticePeriodDays) {
  const struct = db.get('salary_structures').find((s) => s.employeeId === emp.employeeId && s.status === 'Active');
  if (!struct) {
    return { calculated: false, note: 'Salary structure not set; settlement cannot be calculated.', grossPayable: 0, totalDeductions: 0, netPayable: 0, paymentStatus: 'Pending' };
  }
  const end = new Date(`${lwd}T00:00:00`);
  const daysInMonth = new Date(end.getFullYear(), end.getMonth() + 1, 0).getDate();
  const dailyGross = struct.monthlyGross / daysInMonth;
  const payableDaysSalary = Math.round(dailyGross * end.getDate());

  const year = lwd.slice(0, 4);
  const encashableTypes = db.get('leave_types').filter((t) => t.encashable);
  const unusedLeave = encashableTypes.reduce((sum, type) => {
    const used = db.get('leaves')
      .filter((l) => l.employeeId === emp.employeeId && l.leaveType === type.name && String(l.startDate).startsWith(year) && ['Approved', 'Partially Approved'].includes(l.status))
      .reduce((s, l) => s + (Number(l.approvedDays) || 0), 0);
    return sum + Math.max(0, (Number(type.annualQuota) || 0) - used);
  }, 0);
  const leaveEncashmentAmount = Math.round((struct.basic / 26) * unusedLeave);

  const joining = emp.employment?.joiningDate;
  const serviceDays = joining ? Math.max(0, daysBetween(joining, lwd)) : 0;
  const serviceYears = serviceDays / 365.25;
  const completedYears = Math.floor(serviceYears) + (serviceYears % 1 >= 0.5 ? 1 : 0);
  const gratuityAmount = serviceYears >= 5 ? Math.round((15 / 26) * struct.basic * completedYears) : 0;

  const servedDays = Math.max(0, daysBetween(resignationDate, lwd));
  const shortfallDays = Math.max(0, noticePeriodDays - servedDays);
  const noticeShortfallDeduction = Math.round(dailyGross * shortfallDays);

  const grossPayable = payableDaysSalary + leaveEncashmentAmount + gratuityAmount;
  const totalDeductions = noticeShortfallDeduction;
  return {
    calculated: true,
    payableDays: end.getDate(),
    payableDaysSalary,
    unusedLeaveDays: unusedLeave,
    leaveEncashmentAmount,
    serviceYears: Math.round(serviceYears * 10) / 10,
    gratuityAmount,
    annualBonusAmount: 0,
    grossPayable,
    noticeShortfallDays: shortfallDays,
    noticeShortfallDeduction,
    unsettledAdvanceDeduction: 0,
    taxTdsDeduction: 0,
    totalDeductions,
    netPayable: grossPayable - totalDeductions,
    paymentStatus: 'Pending',
  };
}

const router = Router();
router.use(authenticate);

router.get('/', (req, res) => {
  const all = db.get('exit_records');
  const data = can(req.user, 'exits.manage') ? all : all.filter((x) => x.employeeId === req.user.employeeId);
  res.json({ success: true, data: [...data].sort((a, b) => String(b.resignationDate).localeCompare(String(a.resignationDate))) });
});

router.post('/', requireHrAdmin, (req, res, next) => {
  try {
    const { employeeId, exitType = 'Resignation', reason, resignationDate, requestedLWD } = req.body || {};
    const noticePeriodDays = Math.max(0, parseInt(req.body?.noticePeriodDays ?? 30, 10) || 0);
    const emp = db.get('employees').find((e) => e.employeeId === employeeId);
    if (!emp) throw new ValidationError('Choose a valid employee.');
    if (employeeId === req.user.employeeId) throw new ValidationError('You cannot initiate your own exit.');
    if (!String(reason || '').trim()) throw new ValidationError('Enter the reason for exit.');
    const start = resignationDate || today();
    if (!DATE.test(start) || !DATE.test(String(requestedLWD || ''))) throw new ValidationError('Choose valid resignation and last working dates.');
    if (requestedLWD < start) throw new ValidationError('The last working day cannot be before the resignation date.');
    if (db.get('exit_records').some((x) => x.employeeId === employeeId && !['Settled & Relieved', 'Revoked'].includes(x.status))) {
      throw new ValidationError('This employee already has an exit in progress.');
    }
    const record = {
      id: `exit-${Date.now()}`,
      employeeId,
      employeeName: emp.name,
      department: emp.employment?.department || '',
      designation: emp.employment?.designation || '',
      avatar: emp.avatarUrl || '',
      exitType,
      reason: String(reason).trim().slice(0, 1000),
      resignationDate: start,
      requestedLWD,
      approvedLWD: requestedLWD,
      noticePeriodDays,
      noticeServedDays: Math.min(noticePeriodDays, Math.max(0, daysBetween(start, requestedLWD))),
      status: 'In Clearance',
      exitInterviewDone: false,
      clearances: CLEARANCE_DEPARTMENTS.map((department, i) => ({ id: `c${i + 1}`, department, status: 'Pending', reviewerName: '', clearanceDate: '', checklistNotes: '' })),
      fnf: settlementFor(emp, start, requestedLWD, noticePeriodDays),
      initiatedBy: req.user.name,
      createdAt: new Date().toISOString(),
    };
    db.insert('exit_records', record);
    audit(req, 'create', 'exit_records', record.id, `Exit initiated for ${emp.name} (LWD ${requestedLWD})`);
    res.status(201).json({ success: true, data: record });
  } catch (err) {
    next(err);
  }
});

router.put('/:id/clearance', requireHr, (req, res, next) => {
  try {
    const { department, status, notes } = req.body || {};
    if (!['Approved', 'Pending', 'Rejected'].includes(status)) throw new ValidationError('Choose a valid clearance status.');
    const exit = db.get('exit_records').find((x) => x.id === req.params.id);
    if (!exit) return res.status(404).json({ success: false, error: 'Exit record not found.' });
    if (['Settled & Relieved', 'Revoked'].includes(exit.status)) throw new ValidationError('This exit is already closed.');
    if (!exit.clearances.some((c) => c.department === department)) throw new ValidationError('Unknown clearance department.');
    const clearances = exit.clearances.map((c) => (c.department === department
      ? { ...c, status, checklistNotes: String(notes || '').slice(0, 500), reviewerName: req.user.name, clearanceDate: today() }
      : c));
    const allApproved = clearances.every((c) => c.status === 'Approved');
    const updated = db.update('exit_records', exit.id, { clearances, status: allApproved ? 'FnF Pending' : 'In Clearance' });
    audit(req, 'update', 'exit_records', exit.id, `${department} clearance ${status.toLowerCase()} for ${exit.employeeName}`);
    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
});

/* Pays the settlement, relieves the employee and disables their login. */
router.put('/:id/settle', requireHrAdmin, (req, res, next) => {
  try {
    const exit = db.get('exit_records').find((x) => x.id === req.params.id);
    if (!exit) return res.status(404).json({ success: false, error: 'Exit record not found.' });
    if (exit.status !== 'FnF Pending') throw new ValidationError('All clearances must be approved before settlement.');
    const settledOn = today();
    const updated = db.update('exit_records', exit.id, {
      status: 'Settled & Relieved',
      fnf: { ...exit.fnf, paymentStatus: 'Processed', settledOn, settledBy: req.user.name },
      relievedOn: settledOn,
    });
    const emp = db.get('employees').find((e) => e.employeeId === exit.employeeId);
    if (emp) db.update('employees', emp.id, { status: 'Relieved', employment: { ...emp.employment, status: 'Relieved', relievingDate: exit.approvedLWD } });
    const account = db.get('users').find((u) => u.employeeId === exit.employeeId);
    if (account) db.update('users', account.id, { status: 'Disabled', tokenVersion: (account.tokenVersion || 0) + 1 });
    audit(req, 'settle', 'exit_records', exit.id, `${exit.employeeName} relieved; settlement ₹${exit.fnf?.netPayable || 0}`);
    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
});

router.put('/:id/revoke', requireHrAdmin, (req, res, next) => {
  try {
    const exit = db.get('exit_records').find((x) => x.id === req.params.id);
    if (!exit) return res.status(404).json({ success: false, error: 'Exit record not found.' });
    if (exit.status === 'Settled & Relieved') throw new ValidationError('A settled exit cannot be revoked.');
    const updated = db.update('exit_records', exit.id, { status: 'Revoked', revokedBy: req.user.name, revokedOn: today() });
    audit(req, 'revoke', 'exit_records', exit.id, `Exit revoked for ${exit.employeeName}`);
    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
});

export default router;
