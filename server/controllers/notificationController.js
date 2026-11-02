import { db } from '../services/db.js';
import { canAny } from '../config/permissions.js';

const visibleTo = (n, user) => {
  if (n.targetEmployeeId) return n.targetEmployeeId === user.employeeId;
  if (!n.targetRole || n.targetRole === 'all') return true;
  if (n.targetRole === 'hr') return canAny(user, 'leave.approve', 'attendance.manage', 'documents.verify');
  return n.targetRole === user.role;
};
const notMine = (res) => res.status(404).json({ success: false, error: 'Notification not found.' });

export const notificationController = {
  getAll: async (req, res, next) => {
    try {
      const user = req.user;
      const notifications = db.get('notifications');

      const filtered = notifications.filter((n) => visibleTo(n, user));

      res.json({ success: true, count: filtered.length, data: filtered });
    } catch (err) {
      next(err);
    }
  },

  markRead: async (req, res, next) => {
    try {
      const { id } = req.params;
      const item = db.findById('notifications', id);
      if (!item || !visibleTo(item, req.user)) return notMine(res);
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
        if (visibleTo(n, user)) {
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
      const item = db.findById('notifications', id);
      if (!item || !visibleTo(item, req.user)) return notMine(res);
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

