import { Router } from 'express';
import { aiController } from './ai.controller';
import { authenticate } from '../../middleware/auth.middleware';

const router = Router();

// GET /api/v1/ai/drives/:driveId/fit
router.get('/drives/:driveId/fit', authenticate, (req, res, next) =>
  aiController.getDriveJobFit(req, res, next)
);

export const aiRouter = router;
