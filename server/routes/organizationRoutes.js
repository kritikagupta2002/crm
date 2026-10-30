import { Router } from 'express';
import { organizationController } from '../controllers/organizationController.js';
import { authenticate, requireHr } from '../middleware/auth.js';

const router = Router();

router.get('/departments', authenticate, organizationController.getDepartments);
router.post('/departments', authenticate, requireHr, organizationController.createDepartment);
router.get('/designations', authenticate, organizationController.getDesignations);
router.post('/designations', authenticate, requireHr, organizationController.createDesignation);
router.get('/chart', authenticate, organizationController.getOrgChart);

export default router;
