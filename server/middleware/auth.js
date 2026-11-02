import jwt from 'jsonwebtoken';
import { config } from '../config/config.js';
import { effectivePermissions, normalizeRole, canAny } from '../config/permissions.js';
import { db } from '../services/db.js';

/*
 * Every API route except sign-in requires a valid token. The account is re-read on each request so a disabled
 * login, a role or permission change, or a password change takes effect immediately.
 */
export function authenticate(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ success: false, error: 'Please sign in to continue.' });

  let decoded;
  try {
    decoded = jwt.verify(token, config.jwtSecret);
  } catch {
    return res.status(401).json({ success: false, error: 'Your session has expired. Please sign in again.' });
  }

  const account = db.findOne('users', (u) => u.id === decoded.sub);
  if (!account || account.status === 'Disabled' || (account.tokenVersion || 0) !== (decoded.ver || 0)) {
    return res.status(401).json({ success: false, error: 'Your session is no longer valid. Please sign in again.' });
  }

  req.user = {
    id: account.id,
    name: account.name,
    email: account.email,
    role: normalizeRole(account.role),
    employeeId: account.employeeId || null,
    permissions: effectivePermissions(account),
  };
  next();
}

/* Allows the request when the user has at least one of the given permissions. */
export function requirePermission(...permissions) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ success: false, error: 'Please sign in to continue.' });
    if (!canAny(req.user, permissions)) {
      return res.status(403).json({ success: false, error: 'You do not have permission to perform this action.' });
    }
    next();
  };
}
