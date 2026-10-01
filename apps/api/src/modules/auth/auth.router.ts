import { Router } from 'express';
import { authController } from './auth.controller';
import { validateRequest } from '../../middleware/validate.middleware';
import { authenticate } from '../../middleware/auth.middleware';
import { StudentRegisterSchema, LoginSchema } from '@placement/shared';

const router = Router();

// POST /api/v1/auth/register
router.post('/register', validateRequest(StudentRegisterSchema), (req, res, next) =>
  authController.register(req, res, next)
);

// POST /api/v1/auth/login
router.post('/login', validateRequest(LoginSchema), (req, res, next) =>
  authController.login(req, res, next)
);

// GET /api/v1/auth/me
router.get('/me', authenticate, (req, res, next) => authController.me(req, res, next));

export const authRouter = router;
