import { Router } from 'express';
import authRoutes from './authRoutes.js';
import employeeRoutes from './employeeRoutes.js';
import attendanceRoutes from './attendanceRoutes.js';
import leaveRoutes from './leaveRoutes.js';
import organizationRoutes from './organizationRoutes.js';
import notificationRoutes from './notificationRoutes.js';
import documentRoutes from './documentRoutes.js';
import payrollRoutes from './payrollRoutes.js';
import exitRoutes from './exitRoutes.js';
import userRoutes, { auditRouter } from './userRoutes.js';
import {
  departmentsRouter,
  designationsRouter,
  shiftsRouter,
  shiftAssignmentsRouter,
  leaveTypesRouter,
  performanceRouter,
  settingsRouter,
} from './masterDataRoutes.js';

const api = Router();

api.get('/health', (req, res) => res.json({ status: 'healthy', timestamp: new Date().toISOString() }));

api.use('/auth', authRoutes);
api.use('/users', userRoutes);
api.use('/audit', auditRouter);

// More specific paths are mounted before their parents so "/:id" routes never swallow them.
api.use('/employees/performance', performanceRouter);
api.use('/employees', employeeRoutes);
api.use('/attendance', attendanceRoutes);
api.use('/leaves/types', leaveTypesRouter);
api.use('/leaves', leaveRoutes);
api.use('/shifts/assignments', shiftAssignmentsRouter);
api.use('/shifts', shiftsRouter);
api.use('/organization/departments', departmentsRouter);
api.use('/organization/designations', designationsRouter);
api.use('/organization', organizationRoutes);
api.use('/settings', settingsRouter);
api.use('/payroll', payrollRoutes);
api.use('/exits', exitRoutes);
api.use('/notifications', notificationRoutes);
api.use('/documents', documentRoutes);

export default api;
