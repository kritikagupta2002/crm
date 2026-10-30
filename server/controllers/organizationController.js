import { db } from '../services/db.js';

export const organizationController = {
  getDepartments: async (req, res, next) => {
    try {
      const departments = db.get('departments');
      res.json({ success: true, count: departments.length, data: departments });
    } catch (err) {
      next(err);
    }
  },

  createDepartment: async (req, res, next) => {
    try {
      const { name, headName, description } = req.body;
      if (!name) {
        return res.status(400).json({ success: false, error: 'Department name is required.' });
      }

      const newDept = {
        id: `dept-${Date.now()}`,
        name,
        headName: headName || '',
        description: description || '',
        createdAt: new Date().toISOString(),
      };

      db.insert('departments', newDept);
      res.status(201).json({ success: true, data: newDept });
    } catch (err) {
      next(err);
    }
  },

  getDesignations: async (req, res, next) => {
    try {
      const designations = db.get('designations');
      res.json({ success: true, count: designations.length, data: designations });
    } catch (err) {
      next(err);
    }
  },

  createDesignation: async (req, res, next) => {
    try {
      const { title, department, level } = req.body;
      if (!title) {
        return res.status(400).json({ success: false, error: 'Designation title is required.' });
      }

      const newDesig = {
        id: `desig-${Date.now()}`,
        title,
        department: department || 'General',
        level: level || 'Mid-Level',
        createdAt: new Date().toISOString(),
      };

      db.insert('designations', newDesig);
      res.status(201).json({ success: true, data: newDesig });
    } catch (err) {
      next(err);
    }
  },

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

