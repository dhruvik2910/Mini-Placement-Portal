import { Router } from 'express';
import { healthRouter } from '../modules/health/health.router';
import { authRouter } from '../modules/auth/auth.router';
import { studentRouter } from '../modules/student/student.router';
import { drivesRouter } from '../modules/drives/drives.router';
import { applicationsRouter } from '../modules/applications/applications.router';
import { tpoRouter } from '../modules/tpo/tpo.router';

const router = Router();

// Health check module
router.use('/health', healthRouter);

// Authentication module
router.use('/auth', authRouter);

// Student profile and dossier module
router.use('/student', studentRouter);

// Recruitment drives module
router.use('/drives', drivesRouter);

// Student placement applications module
router.use('/applications', applicationsRouter);

// Central TPO placement officer module
router.use('/tpo', tpoRouter);

export const v1Router = router;

