import { Request, Response, NextFunction } from 'express';
import { healthService } from './health.service';

export class HealthController {
  async checkHealth(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const healthData = await healthService.getHealthStatus();
      res.status(200).json({
        success: true,
        data: healthData,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const healthController = new HealthController();
