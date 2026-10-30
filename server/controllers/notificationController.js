import { db } from '../services/db.js';

export const notificationController = {
  getAll: async (req, res, next) => {
    try {
      const user = req.user;
      const notifications = db.get('notifications');

      const filtered = notifications.filter((n) => {
        if (n.targetEmployeeId && n.targetEmployeeId === user.employeeId) return true;
        if (!n.targetRole || n.targetRole === 'all') return true;
        return n.targetRole === user.role;
      });

      res.json({ success: true, count: filtered.length, data: filtered });
    } catch (err) {
      next(err);
    }
  },

  markRead: async (req, res, next) => {
    try {
      const { id } = req.params;
      const updated = db.update('notifications', id, { read: true });
      if (!updated) {
        return res.status(404).json({ success: false, error: 'Notification not found.' });
      }
      res.json({ success: true, data: updated });
    } catch (err) {
      next(err);
    }
  },

  markAllRead: async (req, res, next) => {
    try {
      const user = req.user;
      const notifications = db.get('notifications');
      const updated = notifications.map((n) => {
        if (!n.targetRole || n.targetRole === 'all' || n.targetRole === user.role || n.targetEmployeeId === user.employeeId) {
          return { ...n, read: true };
        }
        return n;
      });
      db.set('notifications', updated);
      res.json({ success: true, message: 'All notifications marked as read.' });
    } catch (err) {
      next(err);
    }
  },

  delete: async (req, res, next) => {
    try {
      const { id } = req.params;
      const removed = db.remove('notifications', id);
      if (!removed) {
        return res.status(404).json({ success: false, error: 'Notification not found.' });
      }
      res.json({ success: true, message: 'Notification removed.' });
    } catch (err) {
      next(err);
    }
  },
};

