import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../services/db.js';
import { audit } from '../services/audit.js';
import { config } from '../config/config.js';
import {
  PERMISSIONS,
  PERMISSION_KEYS,
  ROLE_PRESETS,
  ROLES,
  PRIVILEGED_ROLES,
  effectivePermissions,
  normalizeRole,
} from '../config/permissions.js';
import { authenticate, requirePermission } from '../middleware/auth.js';
import { generateTempPassword } from '../controllers/employeeController.js';

/* Login accounts. Password hashes never leave the server. */
const view = (u) => ({
  id: u.id,
  name: u.name,
  email: u.email,
  role: normalizeRole(u.role),
  employeeId: u.employeeId,
  status: u.status || 'Active',
  permissions: effectivePermissions(u),
  customPermissions: Array.isArray(u.permissions),
  mustChangePassword: Boolean(u.mustChangePassword),
  lastLoginAt: u.lastLoginAt || null,
  passwordChangedAt: u.passwordChangedAt || null,
});

const isPrivileged = (role) => PRIVILEGED_ROLES.includes(normalizeRole(role));

const router = Router();
router.use(authenticate);

/* The permission catalogue and role presets, for the Roles & Permissions screen. */
router.get('/permissions', requirePermission('permissions.manage', 'accounts.manage'), (req, res) => {
  res.json({ success: true, data: { permissions: PERMISSIONS, roles: ROLES.map((name) => ({ name, ...ROLE_PRESETS[name] })) } });
});

router.get('/', requirePermission('accounts.manage', 'permissions.manage'), (req, res) => {
  res.json({ success: true, data: db.get('users').map(view).sort((a, b) => a.name.localeCompare(b.name)) });
});

function findAccount(req, res) {
  const account = db.get('users').find((u) => u.id === req.params.id);
  if (!account) {
    res.status(404).json({ success: false, error: 'Account not found.' });
    return null;
  }
  if (account.id === req.user.id) {
    res.status(400).json({ success: false, error: 'You cannot change your own account here.' });
    return null;
  }
  // Only the Developer and the Managing Director can act on each other's accounts.
  if (isPrivileged(account.role) && !isPrivileged(req.user.role)) {
    res.status(403).json({ success: false, error: 'You cannot change this account.' });
    return null;
  }
  return account;
}

/* Issues a one-time temporary password (shown once to the admin) and signs the person out everywhere. */
router.post('/:id/reset-password', requirePermission('accounts.manage'), async (req, res, next) => {
  try {
    const account = findAccount(req, res);
    if (!account) return;
    const temporaryPassword = generateTempPassword();
    db.update('users', account.id, {
      passwordHash: await bcrypt.hash(temporaryPassword, config.bcryptRounds),
      mustChangePassword: true,
      tokenVersion: (account.tokenVersion || 0) + 1,
    });
    audit(req, 'reset-password', 'users', account.id, `Password reset for ${account.name}`);
    res.json({ success: true, data: { email: account.email, temporaryPassword } });
  } catch (err) {
    next(err);
  }
});

router.put('/:id/status', requirePermission('accounts.manage'), (req, res) => {
  const account = findAccount(req, res);
  if (!account) return;
  const status = req.body?.status;
  if (!['Active', 'Disabled'].includes(status)) return res.status(400).json({ success: false, error: 'Choose Active or Disabled.' });
  const updated = db.update('users', account.id, { status, tokenVersion: (account.tokenVersion || 0) + 1 });
  audit(req, status === 'Active' ? 'enable' : 'disable', 'users', account.id, `${account.name} ${status === 'Active' ? 'enabled' : 'disabled'}`);
  res.json({ success: true, data: view(updated) });
});

/*
 * Sets an account's role and, optionally, a custom permission list. `permissions: null` returns the account to
 * its role's standard permissions. The person is signed out so the new access applies at once.
 */
router.put('/:id/access', requirePermission('permissions.manage'), (req, res) => {
  const account = findAccount(req, res);
  if (!account) return;
  const role = req.body?.role ?? normalizeRole(account.role);
  if (!ROLES.includes(role)) return res.status(400).json({ success: false, error: 'Choose a valid role.' });
  if (isPrivileged(role) && !isPrivileged(req.user.role)) return res.status(403).json({ success: false, error: 'This role cannot be granted from your account.' });

  let permissions = null;
  if (Array.isArray(req.body?.permissions)) {
    const invalid = req.body.permissions.filter((p) => !PERMISSION_KEYS.includes(p));
    if (invalid.length) return res.status(400).json({ success: false, error: `Unknown permission: ${invalid[0]}` });
    permissions = [...new Set(req.body.permissions)];
    const sameAsRole = permissions.length === ROLE_PRESETS[role].permissions.length && permissions.every((p) => ROLE_PRESETS[role].permissions.includes(p));
    if (sameAsRole) permissions = null;
  }

  const updated = db.update('users', account.id, { role, permissions, tokenVersion: (account.tokenVersion || 0) + 1 });
  const summary = permissions
    ? `${account.name}: role ${role} with custom access (${permissions.length} permissions)`
    : `${account.name}: role ${role} with standard access`;
  audit(req, 'change-access', 'users', account.id, summary);
  res.json({ success: true, data: view(updated) });
});

export default router;

export const auditRouter = Router();
auditRouter.get('/', authenticate, requirePermission('audit.view'), (req, res) => {
  const { entity, limit = 200 } = req.query;
  let list = db.get('audit_log');
  if (entity) list = list.filter((e) => e.entity === entity);
  res.json({ success: true, data: list.slice(0, Math.min(1000, Number(limit) || 200)) });
});
