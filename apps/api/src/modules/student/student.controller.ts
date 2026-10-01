import { Request, Response, NextFunction } from 'express';
import { studentService } from './student.service';
import { AppError } from '../../common/errors/app-error';

export class StudentController {
  async getProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw AppError.unauthorized();
      const profile = await studentService.getProfile(req.user.userId);
      res.status(200).json({ success: true, data: profile });
    } catch (error) {
      next(error);
    }
  }

  async updateProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw AppError.unauthorized();
      const profile = await studentService.updateProfile(req.user.userId, req.body);
      res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        data: profile,
      });
    } catch (error) {
      next(error);
    }
  }

  async lockProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw AppError.unauthorized();
      const profile = await studentService.lockProfile(req.user.userId);
      res.status(200).json({
        success: true,
        message: 'Profile locked and submitted successfully for TPO verification',
        data: profile,
      });
    } catch (error) {
      next(error);
    }
  }

  async uploadResume(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw AppError.unauthorized();

      let resumeUrl = req.body.resumeUrl;
      let resumeName = req.body.resumeName || 'Resume.pdf';

      if (req.file) {
        resumeUrl = `/uploads/resumes/${req.file.filename}`;
        resumeName = req.file.originalname;
      }

      if (!resumeUrl) {
        throw AppError.badRequest('Resume file or URL is required');
      }

      const profile = await studentService.updateResume(req.user.userId, resumeUrl, resumeName);
      res.status(200).json({
        success: true,
        message: 'Resume uploaded successfully',
        data: profile,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteResume(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw AppError.unauthorized();
      const profile = await studentService.deleteResume(req.user.userId);
      res.status(200).json({
        success: true,
        message: 'Resume removed successfully',
        data: profile,
      });
    } catch (error) {
      next(error);
    }
  }

  async getNotifications(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw AppError.unauthorized();
      const notifications = await studentService.getNotifications(req.user.userId);
      res.status(200).json({ success: true, data: notifications });
    } catch (error) {
      next(error);
    }
  }

  async markNotificationRead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw AppError.unauthorized();
      await studentService.markNotificationRead(req.user.userId, req.params.id);
      res.status(200).json({ success: true, message: 'Notification marked as read' });
    } catch (error) {
      next(error);
    }
  }
}

export const studentController = new StudentController();
