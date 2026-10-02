import { Router } from 'express';
import { drivesController } from './drives.controller';
import { authenticate, optionalAuthenticate } from '../../middleware/auth.middleware';
import { aiController } from '../ai/ai.controller';

const router = Router();

// GET /api/v1/drives (optional authenticate to calculate personalized eligibility)
router.get('/', optionalAuthenticate, (req, res, next) =>
  drivesController.getDrives(req, res, next)
);

// GET /api/v1/drives/:driveId/ai-fit (Student AI resume and JD compatibility analyzer)
router.get('/:driveId/ai-fit', authenticate, (req, res, next) =>
  aiController.getDriveJobFit(req, res, next)
);

// GET /api/v1/drives/:id
router.get('/:id', optionalAuthenticate, (req, res, next) =>
  drivesController.getDriveById(req, res, next)
);

export const drivesRouter = router;
