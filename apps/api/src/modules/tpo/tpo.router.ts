import { Router } from 'express';
import { tpoController } from './tpo.controller';
import { authenticate, requireRole } from '../../middleware/auth.middleware';
import { validateRequest } from '../../middleware/validate.middleware';
import { UserRole } from '@placement/shared';
import {
  CompanyCreateSchema,
  CompanyUpdateSchema,
  DriveCreateSchema,
  DriveUpdateSchema,
  VerifyStudentProfileSchema,
  UpdateApplicationStatusSchema,
  BulkUpdateApplicationsSchema,
} from '@placement/shared';

const router = Router();

// ENFORCE STRICT TPO ROLE-BASED ACCESS CONTROL (RBAC) ON ALL ROUTES
router.use(authenticate);
router.use(requireRole(UserRole.TPO));

// Dashboard, Analytics & Notifications
router.get('/dashboard', (req, res, next) => tpoController.getDashboard(req, res, next));
router.get('/analytics', (req, res, next) => tpoController.getAnalytics(req, res, next));
router.get('/notifications', (req, res, next) => tpoController.getNotifications(req, res, next));
router.get('/notifications/delivery-logs', (req, res, next) => tpoController.getDeliveryLogs(req, res, next));
router.post('/notifications/interview-alert', (req, res, next) => tpoController.sendInterviewAlert(req, res, next));
router.get('/applications', (req, res, next) => tpoController.getAllApplications(req, res, next));
router.get('/applications/export-csv', (req, res, next) => tpoController.exportApplicationsCsv(req, res, next));
router.get('/applications/export/csv', (req, res, next) => tpoController.exportApplicationsCsv(req, res, next));

// Student Directory & Dossier
router.get('/students', (req, res, next) => tpoController.getStudents(req, res, next));
router.get('/students/export-csv', (req, res, next) => tpoController.exportStudentsCsv(req, res, next));
router.get('/students/export/csv', (req, res, next) => tpoController.exportStudentsCsv(req, res, next));
router.get('/students/:id', (req, res, next) => tpoController.getStudentById(req, res, next));
router.post(
  '/students/:id/verify',
  validateRequest(VerifyStudentProfileSchema),
  (req, res, next) => tpoController.verifyStudent(req, res, next)
);

// Company Management
router.get('/companies', (req, res, next) => tpoController.getCompanies(req, res, next));
router.get('/companies/:id', (req, res, next) => tpoController.getCompanyById(req, res, next));
router.post(
  '/companies',
  validateRequest(CompanyCreateSchema),
  (req, res, next) => tpoController.createCompany(req, res, next)
);
router.put(
  '/companies/:id',
  validateRequest(CompanyUpdateSchema),
  (req, res, next) => tpoController.updateCompany(req, res, next)
);

// Recruitment Drive Management
router.get('/drives', (req, res, next) => tpoController.getDrives(req, res, next));
router.get('/drives/:id', (req, res, next) => tpoController.getDriveById(req, res, next));
router.post(
  '/drives',
  validateRequest(DriveCreateSchema),
  (req, res, next) => tpoController.createDrive(req, res, next)
);
router.put(
  '/drives/:id',
  validateRequest(DriveUpdateSchema),
  (req, res, next) => tpoController.updateDrive(req, res, next)
);
router.patch('/drives/:id/status', (req, res, next) =>
  tpoController.updateDriveStatus(req, res, next)
);

// Eligibility Preview
router.post('/drives/eligibility-preview', (req, res, next) =>
  tpoController.getEligibilityPreview(req, res, next)
);
router.get('/drives/:id/eligibility-preview', (req, res, next) =>
  tpoController.getEligibilityPreview(req, res, next)
);

// Applicant Management
router.get('/drives/:id/applicants', (req, res, next) =>
  tpoController.getDriveApplicants(req, res, next)
);
router.patch(
  '/applications/:id/status',
  validateRequest(UpdateApplicationStatusSchema),
  (req, res, next) => tpoController.updateApplicationStatus(req, res, next)
);
router.post(
  '/applications/bulk-status',
  validateRequest(BulkUpdateApplicationsSchema),
  (req, res, next) => tpoController.bulkUpdateApplications(req, res, next)
);

export const tpoRouter = router;
