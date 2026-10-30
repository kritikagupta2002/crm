import { Router } from 'express';
import { settingsController } from '../controllers/settingsController.js';
import { authenticate, requireHr } from '../middleware/auth.js';

const router = Router();

router.get('/company', authenticate, settingsController.getCompany);
router.put('/company', authenticate, requireHr, settingsController.updateCompany);

router.get('/attendance', authenticate, settingsController.getAttendance);
router.put('/attendance', authenticate, requireHr, settingsController.updateAttendance);

router.get('/leave', authenticate, settingsController.getLeave);
router.put('/leave', authenticate, requireHr, settingsController.updateLeave);

export default router;

