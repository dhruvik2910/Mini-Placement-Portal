import { Router } from 'express';
import { healthController } from './health.controller';

const router = Router();

// GET /api/v1/health
router.get('/', (req, res, next) => healthController.checkHealth(req, res, next));

export const healthRouter = router;
