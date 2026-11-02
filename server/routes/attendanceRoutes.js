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

// Corrections
router.get('/corrections', authenticate, attendanceController.getCorrections);
router.post('/corrections', authenticate, attendanceController.submitCorrection);
router.put('/corrections/:id', authenticate, requirePermission('attendance.manage'), attendanceController.reviewCorrection);

export default router;

