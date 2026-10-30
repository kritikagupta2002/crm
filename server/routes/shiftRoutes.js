import { Router } from 'express';
import { shiftController } from '../controllers/shiftController.js';
import { authenticate, requireHr } from '../middleware/auth.js';

const router = Router();

router.get('/', authenticate, shiftController.getAll);
router.post('/', authenticate, requireHr, shiftController.create);
router.get('/assignments', authenticate, shiftController.getAssignments);
router.post('/assignments', authenticate, requireHr, shiftController.assign);

export default router;

