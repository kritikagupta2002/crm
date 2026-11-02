import { audit } from '../services/audit.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { db } from '../services/db.js';
import { config } from '../config/config.js';
import { effectivePermissions, normalizeRole } from '../config/permissions.js';

const INVALID = 'Incorrect email or password.';
// Compared against when the e-mail is unknown, so a wrong e-mail and a wrong password take the same time.
const DUMMY_HASH = bcrypt.hashSync('timing-equaliser-not-a-password', 10);

export const PASSWORD_RULES = 'Use at least 10 characters, including a letter and a number.';
export const isStrongPassword = (pw) => typeof pw === 'string' && pw.length >= 10 && /[A-Za-z]/.test(pw) && /\d/.test(pw);

function signToken(account) {
  return jwt.sign({ sub: account.id, role: account.role, ver: account.tokenVersion || 0 }, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  });
}

/* The profile the portal needs about the signed-in person: their account plus their employee record's basics. */
export function profileOf(account) {
  const employee = account.employeeId ? db.findOne('employees', (e) => e.employeeId === account.employeeId) : null;
  return {
    id: account.id,
    name: account.name,
    email: account.email,
    role: normalizeRole(account.role),
    permissions: effectivePermissions(account),
    employeeId: account.employeeId || null,
    mustChangePassword: Boolean(account.mustChangePassword),
    title: employee?.employment?.designation || account.role,
    department: employee?.employment?.department || '',
    phone: employee?.contact?.phone || '',
    avatarUrl: employee?.avatarUrl || '',
  };
}

export const authController = {
  login: async (req, res, next) => {
    try {
      const email = String(req.body?.email || '').trim().toLowerCase();
      const password = String(req.body?.password || '');
      if (!email || !password) {
        return res.status(400).json({ success: false, error: 'Enter your email and password.' });
      }

      const account = db.findOne('users', (u) => u.email === email);
      const matches = await bcrypt.compare(password, account?.passwordHash || DUMMY_HASH);
      if (!account || !account.passwordHash || !matches) {
        return res.status(401).json({ success: false, error: INVALID });
      }
      if (account.status === 'Disabled') {
        return res.status(403).json({ success: false, error: 'This account has been disabled. Please contact HR.' });
      }

      const updated = db.update('users', account.id, { lastLoginAt: new Date().toISOString() });
      res.json({ success: true, token: signToken(updated), user: profileOf(updated) });
    } catch (err) {
      next(err);
    }
  },

  me: async (req, res, next) => {
    try {
      const account = db.findOne('users', (u) => u.id === req.user.id);
      res.json({ success: true, user: profileOf(account) });
    } catch (err) {
      next(err);
    }
  },

  changePassword: async (req, res, next) => {
    try {
      const { currentPassword, newPassword } = req.body || {};
      const account = db.findOne('users', (u) => u.id === req.user.id);
      if (!(await bcrypt.compare(String(currentPassword || ''), account.passwordHash || DUMMY_HASH))) {
        return res.status(400).json({ success: false, error: 'Your current password is incorrect.' });
      }
      if (!isStrongPassword(newPassword)) {
        return res.status(400).json({ success: false, error: PASSWORD_RULES });
      }
      if (newPassword === currentPassword) {
        return res.status(400).json({ success: false, error: 'Choose a password different from the current one.' });
      }

      // Bumping the token version signs out every other session; this one gets a fresh token.
      const updated = db.update('users', account.id, {
        passwordHash: await bcrypt.hash(newPassword, config.bcryptRounds),
        mustChangePassword: false,
        passwordChangedAt: new Date().toISOString(),
        tokenVersion: (account.tokenVersion || 0) + 1,
      });
      audit(req, 'change-password', 'users', account.id, 'Password changed');
      res.json({ success: true, token: signToken(updated), user: profileOf(updated) });
    } catch (err) {
      next(err);
    }
  },

  /* Signs the person out everywhere by invalidating all of their existing tokens. */
  logout: async (req, res, next) => {
    try {
      const account = db.findOne('users', (u) => u.id === req.user.id);
      db.update('users', account.id, { tokenVersion: (account.tokenVersion || 0) + 1 });
      res.json({ success: true });
    } catch (err) {
      next(err);
    }
  },
};
