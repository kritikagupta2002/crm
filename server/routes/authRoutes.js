import { Router } from 'express';
import { authController } from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.post('/login', authController.login);
router.get('/me', authenticate, authController.getMe);
router.post('/logout', authController.logout);

export default router;
