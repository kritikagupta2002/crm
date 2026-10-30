import { Router } from 'express';
import { notificationController } from '../controllers/notificationController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.get('/', authenticate, notificationController.getAll);
router.put('/:id/read', authenticate, notificationController.markRead);
router.put('/read-all', authenticate, notificationController.markAllRead);
router.delete('/:id', authenticate, notificationController.delete);

export default router;

