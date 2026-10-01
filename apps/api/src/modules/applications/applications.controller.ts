import { Request, Response, NextFunction } from 'express';
import { applicationsService } from './applications.service';
import { AppError } from '../../common/errors/app-error';

export class ApplicationsController {
  async apply(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw AppError.unauthorized();
      const { recruitmentDriveId, notes } = req.body;
      const application = await applicationsService.applyToDrive(
        req.user.userId,
        recruitmentDriveId,
        notes
      );
      res.status(201).json({
        success: true,
        message: 'Application submitted successfully',
        data: application,
      });
    } catch (error) {
      next(error);
    }
  }

  async getMyApplications(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw AppError.unauthorized();
      const status = req.query.status as string | undefined;
      const applications = await applicationsService.getMyApplications(req.user.userId, status);
      res.status(200).json({ success: true, data: applications });
    } catch (error) {
      next(error);
    }
  }

  async getApplicationById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw AppError.unauthorized();
      const application = await applicationsService.getApplicationById(
        req.user.userId,
        req.params.id
      );
      res.status(200).json({ success: true, data: application });
    } catch (error) {
      next(error);
    }
  }
}

export const applicationsController = new ApplicationsController();
