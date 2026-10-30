import { Router } from 'express';
import { attendanceController } from '../controllers/attendanceController.js';
import { authenticate, requireHr } from '../middleware/auth.js';

const router = Router();

router.get('/', authenticate, attendanceController.getAll);
router.get('/today', authenticate, attendanceController.getTodaySummary);
router.get('/monthly', authenticate, attendanceController.getMonthly);
router.post('/punch', authenticate, attendanceController.recordPunch);

// Corrections
router.get('/corrections', authenticate, attendanceController.getCorrections);
router.post('/corrections', authenticate, attendanceController.submitCorrection);
router.put('/corrections/:id', authenticate, requireHr, attendanceController.reviewCorrection);

export default router;

