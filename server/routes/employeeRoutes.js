import { Router } from 'express';
import { employeeController } from '../controllers/employeeController.js';
import { authenticate, requirePermission } from '../middleware/auth.js';

const router = Router();

// Employee CRUD
router.get('/', authenticate, employeeController.getAll);

router.get('/:id', authenticate, employeeController.getById);
router.post('/', authenticate, requirePermission('employees.manage'), employeeController.create);
router.put('/:id', authenticate, employeeController.update);
router.delete('/:id', authenticate, requirePermission('employees.manage'), employeeController.delete);

export default router;

