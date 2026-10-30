import { Router } from 'express';
import authRoutes from './authRoutes.js';
import employeeRoutes from './employeeRoutes.js';
import attendanceRoutes from './attendanceRoutes.js';
import leaveRoutes from './leaveRoutes.js';
import shiftRoutes from './shiftRoutes.js';
import organizationRoutes from './organizationRoutes.js';
import notificationRoutes from './notificationRoutes.js';
import settingsRoutes from './settingsRoutes.js';
import documentRoutes from './documentRoutes.js';

const api = Router();

api.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'Bansal Geo HRMS & Attendance Backend API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

api.use('/auth', authRoutes);
api.use('/employees', employeeRoutes);
api.use('/attendance', attendanceRoutes);
api.use('/leaves', leaveRoutes);
api.use('/shifts', shiftRoutes);
api.use('/organization', organizationRoutes);
api.use('/notifications', notificationRoutes);
api.use('/settings', settingsRoutes);
api.use('/documents', documentRoutes);

export default api;

