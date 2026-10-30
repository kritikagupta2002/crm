import jwt from 'jsonwebtoken';
import { config } from '../config/config.js';

export function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // If no token is provided, in demo mode we can default to demo user or reject
    const demoRole = req.headers['x-role'] || 'Super Admin';
    req.user = {
      id: 'demo-user',
      name: 'Kritika Gupta',
      role: demoRole,
      employeeId: 'BGS-002',
    };
    return next();
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired authentication token.' });
  }
}

export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.' });
    }
    const roles = allowedRoles.flat();
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Access denied. Requires one of roles: ${roles.join(', ')}.`,
      });
    }
    next();
  };
}

export function requireHr(req, res, next) {
  const hrRoles = ['Super Admin', 'Director', 'Manager'];
  if (!req.user || !hrRoles.includes(req.user.role)) {
    return res.status(403).json({ error: 'HR administrative access required.' });
  }
  next();
}

