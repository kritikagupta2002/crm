import { Router } from 'express';
import { attendanceController } from '../controllers/attendanceController.js';
import { authenticate, requirePermission } from '../middleware/auth.js';

const router = Router();

router.get('/', authenticate, attendanceController.getAll);
router.get('/today', authenticate, attendanceController.getTodaySummary);
router.get('/monthly', authenticate, attendanceController.getMonthly);
router.get('/geofence', authenticate, attendanceController.getGeofenceConfig);
router.post('/geofence/verify', authenticate, attendanceController.verifyLocation);
router.post('/punch', authenticate, attendanceController.recordPunch);

// Holidays and half days marked by HR / Admin
router.get('/calendar', authenticate, attendanceController.getCalendar);
router.put('/calendar/:date', authenticate, requirePermission('settings.manage'), attendanceController.markCalendarDay);
router.delete('/calendar/:date', authenticate, requirePermission('settings.manage'), attendanceController.clearCalendarDay);

// Corrections
router.get('/corrections', authenticate, attendanceController.getCorrections);
router.post('/corrections', authenticate, attendanceController.submitCorrection);
router.put('/corrections/:id', authenticate, requirePermission('attendance.manage'), attendanceController.reviewCorrection);

export default router;

