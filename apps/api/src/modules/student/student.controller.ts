import { Request, Response, NextFunction } from 'express';
import { studentService } from './student.service';
import { AppError } from '../../common/errors/app-error';
import { UserRole } from '@placement/shared';

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

      let profile;
      if (req.file) {
        profile = await studentService.updateResume(req.user.userId, {
          fileBuffer: req.file.buffer,
          fileName: req.file.originalname,
        });
      } else if (req.body.resumeUrl) {
        profile = await studentService.updateResume(req.user.userId, {
          directUrl: req.body.resumeUrl,
          directName: req.body.resumeName,
        });
      } else {
        throw AppError.badRequest('Resume PDF file is required');
      }

      res.status(200).json({
        success: true,
        message: 'Resume uploaded successfully',
        data: profile,
      });
    } catch (error) {
      next(error);
    }
  }

  async viewOwnResume(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw AppError.unauthorized();
      const streamResult = await studentService.getResumeStream(req.user.userId, true);

      res.setHeader('Content-Type', streamResult.contentType);
      res.setHeader(
        'Content-Disposition',
        `inline; filename="${encodeURIComponent(streamResult.filename)}"`
      );
      streamResult.stream.pipe(res);
    } catch (error) {
      next(error);
    }
  }

  async viewStudentResume(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw AppError.unauthorized();
      const { id } = req.params;

      // Access Control: TPO can view any student, Student can only view their own
      if (req.user.role === UserRole.STUDENT) {
        const studentProfile = await studentService.getProfileById(id);
        if (studentProfile.userId !== req.user.userId) {
          throw AppError.forbidden('You are not authorized to view this resume');
        }
      } else if (req.user.role !== UserRole.TPO) {
        throw AppError.forbidden('Access denied');
      }

      const streamResult = await studentService.getResumeStream(id, false);

      res.setHeader('Content-Type', streamResult.contentType);
      res.setHeader(
        'Content-Disposition',
        `inline; filename="${encodeURIComponent(streamResult.filename)}"`
      );
      streamResult.stream.pipe(res);
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
