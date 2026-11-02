import { Router } from 'express';
import { leaveController } from '../controllers/leaveController.js';
import { authenticate, requirePermission } from '../middleware/auth.js';

const router = Router();

router.get('/balances/:employeeId', authenticate, leaveController.getBalances);
router.get('/requests', authenticate, leaveController.getRequests);
router.post('/requests', authenticate, requirePermission('leave.apply', 'leave.approve'), leaveController.apply);
router.put('/requests/:id/cancel', authenticate, leaveController.cancel);
router.delete('/requests/:id', authenticate, leaveController.cancel);
router.put('/requests/:id/status', authenticate, requirePermission('leave.approve'), leaveController.review);

export default router;

