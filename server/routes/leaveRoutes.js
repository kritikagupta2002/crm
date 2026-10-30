import { Router } from 'express';
import { leaveController } from '../controllers/leaveController.js';
import { authenticate, requireHr } from '../middleware/auth.js';

const router = Router();

router.get('/types', authenticate, leaveController.getTypes);
router.get('/balances/:employeeId', authenticate, leaveController.getBalances);
router.get('/requests', authenticate, leaveController.getRequests);
router.post('/requests', authenticate, leaveController.apply);
router.put('/requests/:id/status', authenticate, requireHr, leaveController.review);

export default router;
