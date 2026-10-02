import { Request, Response, NextFunction } from 'express';
import { aiFitService } from './ai-fit.service';
import { AppError } from '../../common/errors/app-error';

export class AiController {
  async getDriveJobFit(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw AppError.unauthorized('Authentication required to calculate job fit score');
      }

      const driveId = req.params.driveId;
      if (!driveId) {
        throw AppError.badRequest('Placement drive ID is required');
      }

      const fitAnalysis = await aiFitService.analyzeJobFit(req.user.userId, driveId);

      res.status(200).json({
        success: true,
        message: 'AI Job Fit and resume analysis computed successfully',
        data: fitAnalysis,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const aiController = new AiController();
