import { Router } from 'express';
import { today } from '../services/dates.js';
import { db } from '../services/db.js';
import { collectionRouter, required, unique, ValidationError, TIME, DATE } from '../services/crud.js';
import { can, canAny } from '../config/permissions.js';
import { authenticate, requirePermission } from '../middleware/auth.js';
import { audit } from '../services/audit.js';

const employeeOf = (employeeId) => db.get('employees').find((e) => e.employeeId === employeeId);

/* Fills the employee's name, department and designation from the master so they always match. */
function withEmployee(record) {
  const emp = employeeOf(record.employeeId);
  if (!emp) throw new ValidationError('Choose a valid employee.');
  return {
    ...record,
    employeeName: emp.name,
    department: emp.employment?.department || '',
    designation: emp.employment?.designation || '',
  };
}

export const departmentsRouter = collectionRouter({
  collection: 'departments',
  label: 'Department',
  idPrefix: 'dept',
  writePermission: 'organization.manage',
  sort: (a, b) => a.name.localeCompare(b.name),
  validate: (r) => {
    required(r, { name: 'Department name' });
    unique('departments', r, 'name', 'department');
    if (r.headEmployeeId) {
      const head = employeeOf(r.headEmployeeId);
      if (!head) throw new ValidationError('The department head must be a current employee.');
      r.headName = head.name;
    }
    return { status: 'Active', ...r };
  },
});

export const designationsRouter = collectionRouter({
  collection: 'designations',
  label: 'Designation',
  idPrefix: 'desig',
  writePermission: 'organization.manage',
  sort: (a, b) => a.title.localeCompare(b.title),
  validate: (r) => {
    required(r, { title: 'Designation title' });
    unique('designations', r, 'title', 'designation');
    return { status: 'Active', ...r };
  },
});

export const shiftsRouter = collectionRouter({
  collection: 'shifts',
  label: 'Shift',
  idPrefix: 'sh',
  writePermission: 'shifts.manage',
  validate: (r, { existing }) => {
    required(r, { name: 'Shift name', startTime: 'Start time', endTime: 'End time' });
    if (!TIME.test(r.startTime) || !TIME.test(r.endTime)) throw new ValidationError('Use times like 09:30 AM.');
    unique('shifts', r, 'name', 'shift');
    return { status: 'Active', ...r, assignedEmployeesCount: existing?.assignedEmployeesCount ?? 0 };
  },
});

export const leaveTypesRouter = collectionRouter({
  collection: 'leave_types',
  label: 'Leave type',
  idPrefix: 'lt',
  writePermission: 'organization.manage',
  validate: (r) => {
    required(r, { name: 'Leave type name', code: 'Code' });
    unique('leave_types', r, 'name', 'leave type');
    unique('leave_types', r, 'code', 'leave type');
    const quota = Number(r.annualQuota);
    if (!Number.isFinite(quota) || quota < 0 || quota > 365) throw new ValidationError('Annual quota must be between 0 and 365 days.');
    const accrual = Number(r.monthlyAccrual ?? 0);
    if (!Number.isFinite(accrual) || accrual < 0 || accrual > 31) throw new ValidationError('Monthly credit must be between 0 and 31 days.');
    return { ...r, code: String(r.code).toUpperCase(), annualQuota: quota, monthlyAccrual: accrual };
  },
});

const RATINGS = ['Outstanding', 'Exceeds Expectations', 'Meets Expectations', 'Needs Improvement', 'Unsatisfactory'];

export const performanceRouter = collectionRouter({
  collection: 'performance_records',
  label: 'Appraisal',
  idPrefix: 'appr',
  writePermission: 'performance.manage',
  scope: (r, req) => can(req.user, 'performance.manage') || r.employeeId === req.user.employeeId,
  sort: (a, b) => String(b.reviewDate).localeCompare(String(a.reviewDate)),
  validate: (r, { req }) => {
    required(r, { employeeId: 'Employee', reviewCycle: 'Review cycle' });
    if (r.employeeId === req.user.employeeId) throw new ValidationError('You cannot appraise yourself.');
    const score = Number(r.overallScore);
    if (!Number.isFinite(score) || score < 1 || score > 5) throw new ValidationError('Overall score must be between 1 and 5.');
    if (r.rating && !RATINGS.includes(r.rating)) throw new ValidationError('Choose a valid rating.');
    const reviewer = employeeOf(req.user.employeeId);
    return withEmployee({
      ...r,
      overallScore: Math.round(score * 10) / 10,
      goalsAchievementPercent: Math.round((score / 5) * 100),
      reviewerName: r.reviewerName || req.user.name,
      reviewerDesignation: r.reviewerDesignation || reviewer?.employment?.designation || req.user.role,
      reviewDate: r.reviewDate || today(),
      status: r.status || 'Submitted',
    });
  },
});

/* One shift assignment per employee; assigning again replaces it. */
export const shiftAssignmentsRouter = Router();
shiftAssignmentsRouter.get('/', authenticate, (req, res) => {
  const all = db.get('shift_assignments');
  const data = canAny(req.user, 'shifts.manage', 'attendance.view_all') ? all : all.filter((a) => a.employeeId === req.user.employeeId);
  res.json({ success: true, count: data.length, data });
});
shiftAssignmentsRouter.post('/', authenticate, requirePermission('shifts.manage'), (req, res, next) => {
  try {
    const { employeeId, shiftId, weeklyOff, effectiveFrom } = req.body || {};
    const shift = db.get('shifts').find((s) => s.id === shiftId);
    if (!shift) throw new ValidationError('Choose a valid shift.');
    if (effectiveFrom && !DATE.test(effectiveFrom)) throw new ValidationError('Choose a valid effective date.');
    const base = withEmployee({ employeeId });
    const list = db.get('shift_assignments');
    const existing = list.find((a) => a.employeeId === employeeId);
    const record = {
      id: existing?.id || `sa-${Date.now()}`,
      ...base,
      shiftId: shift.id,
      shiftName: shift.name,
      weeklyOff: weeklyOff || shift.weeklyOff || 'Sunday',
      effectiveFrom: effectiveFrom || today(),
      status: 'Active',
      assignedBy: req.user.name,
      updatedAt: new Date().toISOString(),
    };
    db.set('shift_assignments', existing ? list.map((a) => (a.id === existing.id ? record : a)) : [record, ...list]);
    recountShifts();
    audit(req, existing ? 'update' : 'create', 'shift_assignments', record.id, `${record.employeeName} assigned to ${shift.name}`);
    res.json({ success: true, data: record });
  } catch (err) {
    next(err);
  }
});

/* Keeps each shift's head count equal to its active assignments. */
export function recountShifts() {
  const assignments = db.get('shift_assignments').filter((a) => a.status !== 'Inactive');
  const shifts = db.get('shifts');
  const next = shifts.map((s) => ({ ...s, assignedEmployeesCount: assignments.filter((a) => a.shiftId === s.id).length }));
  if (JSON.stringify(next) !== JSON.stringify(shifts)) db.set('shifts', next);
}

/* Company-wide settings documents. Everyone may read them (shift times, leave rules); HR administrators change them. */
const SETTINGS = { company: 'company_settings', attendance: 'attendance_settings', leave: 'leave_settings', payroll: 'payroll_settings' };
export const settingsRouter = Router();
settingsRouter.get('/:key', authenticate, (req, res) => {
  const collection = SETTINGS[req.params.key];
  if (!collection) return res.status(404).json({ success: false, error: 'Unknown settings.' });
  if (req.params.key === 'payroll' && !canAny(req.user, 'payroll.manage', 'settings.manage')) return res.status(403).json({ success: false, error: 'You do not have permission to view this.' });
  res.json({ success: true, data: db.get(collection) || {} });
});
settingsRouter.put('/:key', authenticate, (req, res, next) => {
  try {
    const collection = SETTINGS[req.params.key];
    if (!collection) return res.status(404).json({ success: false, error: 'Unknown settings.' });
    if (!can(req.user, 'settings.manage')) return res.status(403).json({ success: false, error: 'You do not have permission to perform this action.' });
    const { updatedAt: _a, updatedBy: _b, ...changes } = req.body || {};
    const updated = { ...(db.get(collection) || {}), ...changes, updatedAt: new Date().toISOString(), updatedBy: req.user.name };
    db.set(collection, updated);
    audit(req, 'update', collection, req.params.key, `${req.params.key} settings updated`);
    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
});
