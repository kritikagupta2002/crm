import { db } from '../services/db.js';

export const employeeController = {
  getAll: async (req, res, next) => {
    try {
      const { search, department, status, role } = req.query;
      let employees = db.get('employees');

      if (department) {
        employees = employees.filter((e) => e.employment?.department === department);
      }
      if (status) {
        employees = employees.filter((e) => e.employment?.status === status);
      }
      if (role) {
        employees = employees.filter((e) => e.role === role);
      }
      if (search) {
        const q = search.toLowerCase();
        employees = employees.filter(
          (e) =>
            e.name?.toLowerCase().includes(q) ||
            e.employeeId?.toLowerCase().includes(q) ||
            e.contact?.workEmail?.toLowerCase().includes(q) ||
            e.employment?.designation?.toLowerCase().includes(q),
        );
      }

      res.json({
        success: true,
        count: employees.length,
        data: employees,
      });
    } catch (err) {
      next(err);
    }
  },

  getById: async (req, res, next) => {
    try {
      const { id } = req.params;
      const employee = db.findById('employees', id);
      if (!employee) {
        return res.status(404).json({ success: false, error: 'Employee not found.' });
      }
      res.json({ success: true, data: employee });
    } catch (err) {
      next(err);
    }
  },

  create: async (req, res, next) => {
    try {
      const data = req.body;
      const employees = db.get('employees');

      // Auto-generate employeeId if not given
      let nextId = data.employeeId;
      if (!nextId) {
        const count = employees.length + 1;
        nextId = `BGS-${String(count).padStart(3, '0')}`;
      }

      const newEmployee = {
        id: `emp-${Date.now()}`,
        employeeId: nextId,
        name: data.name || `${data.personal?.firstName || ''} ${data.personal?.lastName || ''}`.trim(),
        avatarUrl: data.avatarUrl || '',
        role: data.role || 'employee',
        personal: {
          firstName: data.personal?.firstName || '',
          lastName: data.personal?.lastName || '',
          dob: data.personal?.dob || '',
          gender: data.personal?.gender || '',
          bloodGroup: data.personal?.bloodGroup || '',
          maritalStatus: data.personal?.maritalStatus || '',
          nationality: data.personal?.nationality || 'Indian',
          ...(data.personal || {}),
        },
        contact: {
          workEmail: data.contact?.workEmail || '',
          personalEmail: data.contact?.personalEmail || '',
          phone: data.contact?.phone || '',
          currentAddress: data.contact?.currentAddress || '',
          permanentAddress: data.contact?.permanentAddress || '',
          city: data.contact?.city || 'Jaipur',
          state: data.contact?.state || 'Rajasthan',
          pincode: data.contact?.pincode || '',
          ...(data.contact || {}),
        },
        employment: {
          employeeId: nextId,
          department: data.employment?.department || 'General',
          designation: data.employment?.designation || 'Staff',
          joiningDate: data.employment?.joiningDate || new Date().toISOString().slice(0, 10),
          employmentType: data.employment?.employmentType || 'Full-Time',
          managerName: data.employment?.managerName || 'Operations Manager',
          workLocation: data.employment?.workLocation || 'Jaipur Corporate HQ',
          status: 'Active',
          project: data.employment?.project || 'Operations',
          ...(data.employment || {}),
        },
        emergency: data.emergency || {},
        bank: data.bank || {},
        documents: data.documents || [],
        createdAt: new Date().toISOString(),
      };

      db.insert('employees', newEmployee);

      // Create attendance entry for today
      const today = new Date().toISOString().slice(0, 10);
      const attendance = db.get('attendance');
      const alreadyMarked = attendance.some((a) => a.employeeId === nextId && a.date === today);
      if (!alreadyMarked) {
        db.insert('attendance', {
          id: `att-${Date.now()}`,
          employeeId: nextId,
          employeeName: newEmployee.name,
          department: newEmployee.employment.department,
          date: today,
          checkIn: '09:00 AM',
          checkOut: '-',
          workingHours: 'Working...',
          lateBy: '-',
          overtime: '-',
          status: 'Present',
          punchSource: 'Web Portal',
        });
      }

      res.status(201).json({ success: true, data: newEmployee });
    } catch (err) {
      next(err);
    }
  },

  update: async (req, res, next) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const updated = db.update('employees', id, updates);
      if (!updated) {
        return res.status(404).json({ success: false, error: 'Employee not found.' });
      }
      res.json({ success: true, data: updated });
    } catch (err) {
      next(err);
    }
  },

  delete: async (req, res, next) => {
    try {
      const { id } = req.params;
      const removed = db.remove('employees', id);
      if (!removed) {
        return res.status(404).json({ success: false, error: 'Employee not found.' });
      }
      res.json({ success: true, message: 'Employee removed successfully.' });
    } catch (err) {
      next(err);
    }
  },

  // Performance Records
  getPerformanceRecords: async (req, res, next) => {
    try {
      const records = db.get('performance_records');
      res.json({ success: true, data: records });
    } catch (err) {
      next(err);
    }
  },

  createPerformanceRecord: async (req, res, next) => {
    try {
      const data = req.body;
      const record = {
        id: `perf-${Date.now()}`,
        ...data,
        createdAt: new Date().toISOString(),
      };
      db.insert('performance_records', record);
      res.status(201).json({ success: true, data: record });
    } catch (err) {
      next(err);
    }
  },

  // Exit Records
  getExitRecords: async (req, res, next) => {
    try {
      const records = db.get('exit_records');
      res.json({ success: true, data: records });
    } catch (err) {
      next(err);
    }
  },

  createExitRecord: async (req, res, next) => {
    try {
      const data = req.body;
      const record = {
        id: `exit-${Date.now()}`,
        status: 'In Progress',
        exitInterviewStatus: 'Scheduled',
        clearance: { admin: 'Pending', it: 'Pending', accounts: 'Pending', hr: 'Pending' },
        fnfStatus: 'Pending',
        ...data,
        createdAt: new Date().toISOString(),
      };
      db.insert('exit_records', record);
      res.status(201).json({ success: true, data: record });
    } catch (err) {
      next(err);
    }
  },

  updateExitRecord: async (req, res, next) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const updated = db.update('exit_records', id, updates);
      if (!updated) {
        return res.status(404).json({ success: false, error: 'Exit record not found.' });
      }
      res.json({ success: true, data: updated });
    } catch (err) {
      next(err);
    }
  },
};
