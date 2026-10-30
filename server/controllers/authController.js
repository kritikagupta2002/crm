import jwt from 'jsonwebtoken';
import { db } from '../services/db.js';
import { config } from '../config/config.js';

export const authController = {
  login: async (req, res, next) => {
    try {
      const { email, role, member, password } = req.body;
      const users = db.get('users');
      const employees = db.get('employees');

      const selectedRole = role || 'Super Admin';
      let matchedUser = users.find((u) => u.email === email || u.role === selectedRole);

      // If logging in as an employee, resolve the member name
      const userName = selectedRole === 'Employee' && member ? member : (matchedUser?.name || 'Staff Member');
      const employee = employees.find((e) => e.name === userName || e.contact?.workEmail === email);

      const userPayload = {
        id: matchedUser?.id || `usr-${Date.now()}`,
        name: userName,
        email: email || employee?.contact?.workEmail || 'user@bansalgeo.com',
        role: selectedRole,
        employeeId: employee?.employeeId || null,
        department: employee?.employment?.department || 'General',
        designation: employee?.employment?.designation || selectedRole,
      };

      const token = jwt.sign(userPayload, config.jwtSecret, { expiresIn: config.jwtExpiresIn });

      res.json({
        success: true,
        token,
        user: userPayload,
      });
    } catch (err) {
      next(err);
    }
  },

  getMe: async (req, res, next) => {
    try {
      const user = req.user;
      const employees = db.get('employees');
      const employee = employees.find((e) => e.employeeId === user.employeeId || e.name === user.name);

      res.json({
        success: true,
        user: {
          ...user,
          employeeDetails: employee || null,
        },
      });
    } catch (err) {
      next(err);
    }
  },

  logout: async (req, res) => {
    res.json({ success: true, message: 'Signed out successfully.' });
  },
};

