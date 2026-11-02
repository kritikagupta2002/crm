import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { authController } from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// Ten failed sign-ins per address and e-mail in 15 minutes, then a cool-down. Successful sign-ins don't count.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  skipSuccessfulRequests: true,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  keyGenerator: (req) => `${req.ip}|${String(req.body?.email || '').toLowerCase()}`,
  message: { success: false, error: 'Too many sign-in attempts. Please wait 15 minutes and try again.' },
});

router.post('/login', loginLimiter, authController.login);
router.get('/me', authenticate, authController.me);
router.post('/change-password', authenticate, loginLimiter, authController.changePassword);
router.post('/logout', authenticate, authController.logout);

export default router;
