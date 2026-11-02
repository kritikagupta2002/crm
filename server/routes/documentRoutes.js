import { Router } from 'express';
import { documentController } from '../controllers/documentController.js';
import { authenticate, requirePermission } from '../middleware/auth.js';

const router = Router();

// Get documents (filtered by employeeId, status, department)
router.get('/', authenticate, documentController.getAll);

// Employee uploads personal document
router.post('/', authenticate, requirePermission('profile.edit_own', 'documents.verify'), documentController.upload);

// Manager / Admin / Director reviews document (Verify or Reject with reason)
router.put('/:id/review', authenticate, requirePermission('documents.verify'), documentController.review);

// Employee re-uploads a rejected document
router.put('/:id/reupload', authenticate, requirePermission('profile.edit_own'), documentController.reupload);

export default router;

