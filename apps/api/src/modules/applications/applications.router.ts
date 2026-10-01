import { Router } from 'express';
import { applicationsController } from './applications.controller';
import { authenticate, requireRole } from '../../middleware/auth.middleware';
import { validateRequest } from '../../middleware/validate.middleware';
import { UserRole, ApplyDriveSchema } from '@placement/shared';

const router = Router();

// Protect all application routes for STUDENT
router.use(authenticate, requireRole(UserRole.STUDENT));

// POST /api/v1/applications (Apply to a drive)
router.post('/', validateRequest(ApplyDriveSchema), (req, res, next) =>
  applicationsController.apply(req, res, next)
);

// GET /api/v1/applications (List student's applications)
router.get('/', (req, res, next) => applicationsController.getMyApplications(req, res, next));

// GET /api/v1/applications/:id (Application detail)
router.get('/:id', (req, res, next) =>
  applicationsController.getApplicationById(req, res, next)
);

export const applicationsRouter = router;
