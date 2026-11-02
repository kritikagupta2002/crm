import { db } from '../services/db.js';

export const organizationController = {
  getOrgChart: async (req, res, next) => {
    try {
      const employees = db.get('employees');
      // Build a tree structure of management
      const tree = employees.map((emp) => ({
        id: emp.id,
        employeeId: emp.employeeId,
        name: emp.name,
        designation: emp.employment?.designation,
        department: emp.employment?.department,
        managerName: emp.employment?.managerName,
        avatarUrl: emp.avatarUrl,
      }));

      res.json({ success: true, data: tree });
    } catch (err) {
      next(err);
    }
  },
};

