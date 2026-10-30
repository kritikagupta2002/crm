import { Router } from 'express';
import { employeeController } from '../controllers/employeeController.js';
import { authenticate, requireHr } from '../middleware/auth.js';

const router = Router();

// Employee CRUD
router.get('/', authenticate, employeeController.getAll);
router.get('/performance/records', authenticate, employeeController.getPerformanceRecords);
router.post('/performance/records', authenticate, requireHr, employeeController.createPerformanceRecord);
router.get('/exit/records', authenticate, employeeController.getExitRecords);
router.post('/exit/records', authenticate, requireHr, employeeController.createExitRecord);
router.put('/exit/records/:id', authenticate, requireHr, employeeController.updateExitRecord);

router.get('/:id', authenticate, employeeController.getById);
router.post('/', authenticate, requireHr, employeeController.create);
router.put('/:id', authenticate, requireHr, employeeController.update);
router.delete('/:id', authenticate, requireHr, employeeController.delete);

export default router;

