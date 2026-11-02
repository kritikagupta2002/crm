import { Router } from 'express';
import { organizationController } from '../controllers/organizationController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();
router.get('/chart', authenticate, organizationController.getOrgChart);

export default router;
