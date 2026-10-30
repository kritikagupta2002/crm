import { db } from '../services/db.js';

export const settingsController = {
  getCompany: async (req, res, next) => {
    try {
      const settings = db.get('company_settings');
      res.json({ success: true, data: settings });
    } catch (err) {
      next(err);
    }
  },

  updateCompany: async (req, res, next) => {
    try {
      const updates = req.body;
      const current = db.get('company_settings');
      const updated = { ...current, ...updates, updatedAt: new Date().toISOString() };
      db.set('company_settings', updated);
      res.json({ success: true, data: updated });
    } catch (err) {
      next(err);
    }
  },

  getAttendance: async (req, res, next) => {
    try {
      const settings = db.get('attendance_settings');
      res.json({ success: true, data: settings });
    } catch (err) {
      next(err);
    }
  },

  updateAttendance: async (req, res, next) => {
    try {
      const updates = req.body;
      const current = db.get('attendance_settings');
      const updated = { ...current, ...updates, updatedAt: new Date().toISOString() };
      db.set('attendance_settings', updated);
      res.json({ success: true, data: updated });
    } catch (err) {
      next(err);
    }
  },

  getLeave: async (req, res, next) => {
    try {
      const settings = db.get('leave_settings');
      res.json({ success: true, data: settings });
    } catch (err) {
      next(err);
    }
  },

  updateLeave: async (req, res, next) => {
    try {
      const updates = req.body;
      const current = db.get('leave_settings');
      const updated = { ...current, ...updates, updatedAt: new Date().toISOString() };
      db.set('leave_settings', updated);
      res.json({ success: true, data: updated });
    } catch (err) {
      next(err);
    }
  },
};

