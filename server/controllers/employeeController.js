import { audit } from '../services/audit.js';
import { today } from '../services/dates.js';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { db } from '../services/db.js';
import { config } from '../config/config.js';
import { ROLES, PRIVILEGED_ROLES, can } from '../config/permissions.js';

/* What colleagues may see about each other (team directory, org chart). Personal, bank and emergency details stay private. */
function publicView(e) {
  return {
    id: e.id,
    employeeId: e.employeeId,
    name: e.name,
    avatarUrl: e.avatarUrl || '',
    role: e.role,
    contact: { workEmail: e.contact?.workEmail || '', phone: e.contact?.phone || '' },
    employment: {
      employeeId: e.employeeId,
      department: e.employment?.department || '',
      designation: e.employment?.designation || '',
      managerId: e.employment?.managerId || '',
      managerName: e.employment?.managerName || '',
      workLocation: e.employment?.workLocation || '',
      joiningDate: e.employment?.joiningDate || '',
      status: e.employment?.status || 'Active',
    },
  };
}

const viewFor = (req, e) => (can(req.user, 'employees.view_all') || e.employeeId === req.user.employeeId ? e : publicView(e));

/* Who may appear in a list: everyone with directory or full access, otherwise only the person themselves. */
const listable = (req, e) => can(req.user, 'employees.view_all') || can(req.user, 'directory.view') || e.employeeId === req.user.employeeId;

/* Sections an employee may edit on their own record; employment details, role and status are HR's. */
const SELF_EDITABLE = ['personal', 'contact', 'emergency', 'bank', 'avatarUrl', 'profileCompleted', 'education', 'experience'];

/* A readable one-time password: 12 characters, letters and digits, no look-alikes (0/O, 1/l/I). */
export function generateTempPassword() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  let out = '';
  while (!/\d/.test(out) || !/[A-Za-z]/.test(out)) {
    out = Array.from(crypto.randomBytes(12), (b) => alphabet[b % alphabet.length]).join('');
  }
  return out;
}

function nextEmployeeId(employees) {
  const max = employees
    .map((e) => /^BGS\/(\d+)$/.exec(e.employeeId || ''))
    .filter(Boolean)
    .reduce((m, match) => Math.max(m, parseInt(match[1], 10)), 0);
  return `BGS/${String(max + 1).padStart(2, '0')}`;
}

export const employeeController = {
  getAll: async (req, res, next) => {
    try {
      const { search, department, status, role } = req.query;
      let employees = db.get('employees').filter((e) => listable(req, e));

      if (department) {
        employees = employees.filter((e) => e.employment?.department === department);
      }
      if (status) {
        employees = employees.filter((e) => e.employment?.status === status);
      }
      if (role) {
        employees = employees.filter((e) => e.role === role);
      }
      if (search) {
        const q = search.toLowerCase();
        employees = employees.filter(
          (e) =>
            e.name?.toLowerCase().includes(q) ||
            e.employeeId?.toLowerCase().includes(q) ||
            e.contact?.workEmail?.toLowerCase().includes(q) ||
            e.employment?.designation?.toLowerCase().includes(q),
        );
      }

      res.json({ success: true, count: employees.length, data: employees.map((e) => viewFor(req, e)) });
    } catch (err) {
      next(err);
    }
  },

  getById: async (req, res, next) => {
    try {
      const { id } = req.params;
      const employee = db.findById('employees', id);
      if (!employee || !listable(req, employee)) {
        return res.status(404).json({ success: false, error: 'Employee not found.' });
      }
      res.json({ success: true, data: viewFor(req, employee) });
    } catch (err) {
      next(err);
    }
  },

  create: async (req, res, next) => {
    try {
      const data = req.body || {};
      const employees = db.get('employees');
      const workEmail = String(data.contact?.workEmail || '').trim().toLowerCase();
      const name = String(data.name || `${data.personal?.firstName || ''} ${data.personal?.lastName || ''}`).trim();
      const role = ROLES.includes(data.accountRole) ? data.accountRole : 'Employee';

      if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(workEmail)) {
        return res.status(400).json({ success: false, error: 'Name and a valid work email are required.' });
      }
      if (db.findOne('users', (u) => u.email === workEmail) || employees.some((e) => String(e.contact?.workEmail || '').toLowerCase() === workEmail)) {
        return res.status(409).json({ success: false, error: 'An employee with this work email already exists.' });
      }
      if (role !== 'Employee' && !can(req.user, 'permissions.manage')) {
        return res.status(403).json({ success: false, error: 'Only the Managing Director can grant management roles.' });
      }
      if (PRIVILEGED_ROLES.includes(role) && !PRIVILEGED_ROLES.includes(req.user.role)) {
        return res.status(403).json({ success: false, error: 'This role cannot be granted from here.' });
      }
      const nextId = data.employeeId && !employees.some((e) => e.employeeId === data.employeeId) ? String(data.employeeId).trim() : nextEmployeeId(employees);

      const newEmployee = {
        id: `emp-${Date.now()}`,
        employeeId: nextId,
        name,
        avatarUrl: data.avatarUrl || '',
        role: data.role || 'employee',
        personal: {
          firstName: data.personal?.firstName || '',
          lastName: data.personal?.lastName || '',
          dob: data.personal?.dob || '',
          gender: data.personal?.gender || '',
          bloodGroup: data.personal?.bloodGroup || '',
          maritalStatus: data.personal?.maritalStatus || '',
          nationality: data.personal?.nationality || 'Indian',
          ...(data.personal || {}),
        },
        contact: {
          personalEmail: data.contact?.personalEmail || '',
          phone: data.contact?.phone || '',
          currentAddress: data.contact?.currentAddress || '',
          permanentAddress: data.contact?.permanentAddress || '',
          city: data.contact?.city || 'Jaipur',
          state: data.contact?.state || 'Rajasthan',
          pincode: data.contact?.pincode || '',
          ...(data.contact || {}),
          workEmail,
        },
        employment: {
          department: data.employment?.department || 'General',
          designation: data.employment?.designation || 'Staff',
          joiningDate: data.employment?.joiningDate || today(),
          employmentType: data.employment?.employmentType || 'Full-Time',
          managerName: data.employment?.managerName || '',
          workLocation: data.employment?.workLocation || 'Jaipur Corporate HQ',
          project: data.employment?.project || '',
          ...(data.employment || {}),
          employeeId: nextId,
          status: 'Active',
        },
        emergency: data.emergency || {},
        bank: data.bank || {},
        documents: data.documents || [],
        createdAt: new Date().toISOString(),
      };

      delete newEmployee.accountRole;
      db.insert('employees', newEmployee);

      // Every new employee gets a portal login. The temporary password is shown to HR once and must be changed
      // at first sign-in; only its hash is stored.
      const temporaryPassword = generateTempPassword();
      db.insert('users', {
        id: `usr-${crypto.randomUUID()}`,
        name,
        email: workEmail,
        role,
        employeeId: nextId,
        passwordHash: await bcrypt.hash(temporaryPassword, config.bcryptRounds),
        status: 'Active',
        tokenVersion: 0,
        mustChangePassword: true,
      });

      audit(req, 'create', 'employees', nextId, `Employee ${name} onboarded with ${role} login`);
      res.status(201).json({ success: true, data: newEmployee, account: { email: workEmail, role, temporaryPassword } });
    } catch (err) {
      next(err);
    }
  },

  update: async (req, res, next) => {
    try {
      const { id } = req.params;
      const existing = db.findById('employees', id);
      if (!existing) return res.status(404).json({ success: false, error: 'Employee not found.' });

      const body = req.body || {};
      let updates;
      if (can(req.user, 'employees.manage')) {
        const { id: _id, employeeId: _eid, ...rest } = body;
        updates = rest;
      } else {
        if (existing.employeeId !== req.user.employeeId || !can(req.user, 'profile.edit_own')) {
          return res.status(403).json({ success: false, error: 'You can only update your own profile.' });
        }
        updates = Object.fromEntries(Object.entries(body).filter(([key]) => SELF_EDITABLE.includes(key)));
        if (updates.contact) updates.contact = { ...existing.contact, ...updates.contact, workEmail: existing.contact?.workEmail };
      }
      const updated = db.update('employees', existing.id, updates);

      audit(req, 'update', 'employees', existing.employeeId, `Employee record of ${existing.name} updated`);

      // Keep the login account's name in step with the employee record.
      const account = db.findOne('users', (u) => u.employeeId === existing.employeeId);
      if (account && updated.name && updated.name !== account.name) db.update('users', account.id, { name: updated.name });

      res.json({ success: true, data: updated });
    } catch (err) {
      next(err);
    }
  },

  delete: async (req, res, next) => {
    try {
      // Employees are deactivated, not erased: their attendance, leave and payroll history must stay intact.
      const existing = db.findById('employees', req.params.id);
      if (!existing) return res.status(404).json({ success: false, error: 'Employee not found.' });
      if (existing.employeeId === req.user.employeeId) {
        return res.status(400).json({ success: false, error: 'You cannot deactivate your own account.' });
      }
      db.update('employees', existing.id, { status: 'Inactive', employment: { ...existing.employment, status: 'Inactive' } });
      const account = db.findOne('users', (u) => u.employeeId === existing.employeeId);
      if (account) db.update('users', account.id, { status: 'Disabled', tokenVersion: (account.tokenVersion || 0) + 1 });
      audit(req, 'deactivate', 'employees', existing.employeeId, `${existing.name} deactivated`);
      res.json({ success: true, message: 'Employee deactivated and their login disabled.' });
    } catch (err) {
      next(err);
    }
  },
};
