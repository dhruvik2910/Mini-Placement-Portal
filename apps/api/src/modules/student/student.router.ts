import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { studentController } from './student.controller';
import { authenticate, requireRole } from '../../middleware/auth.middleware';
import { validateRequest } from '../../middleware/validate.middleware';
import { UserRole, UpdateProfileSchema } from '@placement/shared';

// Setup multer storage
const uploadDir = path.resolve(__dirname, '../../../uploads/resumes');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, unique);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'application/pdf' || file.originalname.endsWith('.pdf')) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are supported for resumes.'));
    }
  },
});

const router = Router();

// Protect all routes in this router for STUDENT role
router.use(authenticate, requireRole(UserRole.STUDENT));

// GET /api/v1/student/profile
router.get('/profile', (req, res, next) => studentController.getProfile(req, res, next));

// PUT /api/v1/student/profile
router.put('/profile', validateRequest(UpdateProfileSchema), (req, res, next) =>
  studentController.updateProfile(req, res, next)
);

// POST /api/v1/student/profile/lock
router.post('/profile/lock', (req, res, next) => studentController.lockProfile(req, res, next));

// POST /api/v1/student/resume
router.post('/resume', upload.single('resume'), (req, res, next) =>
  studentController.uploadResume(req, res, next)
);

// DELETE /api/v1/student/resume
router.delete('/resume', (req, res, next) => studentController.deleteResume(req, res, next));

// GET /api/v1/student/notifications
router.get('/notifications', (req, res, next) =>
  studentController.getNotifications(req, res, next)
);

// PATCH /api/v1/student/notifications/:id/read
router.patch('/notifications/:id/read', (req, res, next) =>
  studentController.markNotificationRead(req, res, next)
);

export const studentRouter = router;
