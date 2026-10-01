import { Request, Response, NextFunction } from 'express';
import { drivesService } from './drives.service';

export class DrivesController {
  async getDrives(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.userId;
      const search = req.query.search as string | undefined;
      const status = req.query.status as string | undefined;
      const eligibility = req.query.eligibility as string | undefined;

      const drives = await drivesService.getDrives(userId, { search, status, eligibility });
      res.status(200).json({ success: true, data: drives });
    } catch (error) {
      next(error);
    }
  }

  async getDriveById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.userId;
      const drive = await drivesService.getDriveById(req.params.id, userId);
      res.status(200).json({ success: true, data: drive });
    } catch (error) {
      next(error);
    }
  }
}

export const drivesController = new DrivesController();
