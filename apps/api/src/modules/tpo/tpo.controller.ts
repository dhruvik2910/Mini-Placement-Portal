import { Request, Response, NextFunction } from 'express';
import { tpoService } from './tpo.service';
import { notificationDispatcher } from '../notifications/dispatcher.service';
import { ApiResponse } from '@placement/shared';

export class TpoController {
  async getDashboard(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const stats = await tpoService.getDashboardStats();
      const response: ApiResponse<typeof stats> = {
        success: true,
        message: 'TPO Dashboard metrics loaded',
        data: stats,
      };
      res.json(response);
    } catch (err) {
      next(err);
    }
  }

  async getStudents(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const students = await tpoService.getStudents({
        search: req.query.search as string,
        department: req.query.department as string,
        studentType: req.query.studentType as string,
        status: req.query.status as string,
        verificationStatus: req.query.verificationStatus as string,
        backlogStatus: req.query.backlogStatus as string,
        batchYear: req.query.batchYear ? Number(req.query.batchYear) : undefined,
        currentSemester: req.query.currentSemester ? Number(req.query.currentSemester) : undefined,
        minCgpa: req.query.minCgpa ? Number(req.query.minCgpa) : undefined,
      });
      const response: ApiResponse<typeof students> = {
        success: true,
        message: 'Student directory retrieved',
        data: students,
      };
      res.json(response);
    } catch (err) {
      next(err);
    }
  }

  async getStudentById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const student = await tpoService.getStudentById(req.params.id);
      const response: ApiResponse<typeof student> = {
        success: true,
        message: 'Student dossier retrieved',
        data: student,
      };
      res.json(response);
    } catch (err) {
      next(err);
    }
  }

  async verifyStudent(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { status, remarks } = req.body;
      const updated = await tpoService.verifyStudentProfile(
        req.params.id,
        req.user!.userId,
        status,
        remarks
      );
      const response: ApiResponse<typeof updated> = {
        success: true,
        message: 'Student verification status updated',
        data: updated,
      };
      res.json(response);
    } catch (err) {
      next(err);
    }
  }

  async getCompanies(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companies = await tpoService.getCompanies(req.query.search as string);
      const response: ApiResponse<typeof companies> = {
        success: true,
        message: 'Recruiting companies retrieved',
        data: companies,
      };
      res.json(response);
    } catch (err) {
      next(err);
    }
  }

  async getCompanyById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const company = await tpoService.getCompanyById(req.params.id);
      const response: ApiResponse<typeof company> = {
        success: true,
        message: 'Company profile retrieved',
        data: company,
      };
      res.json(response);
    } catch (err) {
      next(err);
    }
  }

  async createCompany(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const company = await tpoService.createCompany(req.body);
      const response: ApiResponse<typeof company> = {
        success: true,
        message: 'Company partner successfully created',
        data: company,
      };
      res.status(201).json(response);
    } catch (err) {
      next(err);
    }
  }

  async updateCompany(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const updated = await tpoService.updateCompany(req.params.id, req.body);
      const response: ApiResponse<typeof updated> = {
        success: true,
        message: 'Company information updated',
        data: updated,
      };
      res.json(response);
    } catch (err) {
      next(err);
    }
  }

  async getDrives(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const drives = await tpoService.getDrives({
        status: req.query.status as string,
        companyId: req.query.companyId as string,
        search: req.query.search as string,
      });
      const response: ApiResponse<typeof drives> = {
        success: true,
        message: 'Placement drives retrieved',
        data: drives,
      };
      res.json(response);
    } catch (err) {
      next(err);
    }
  }

  async getDriveById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const drive = await tpoService.getDriveById(req.params.id);
      const response: ApiResponse<typeof drive> = {
        success: true,
        message: 'Placement drive details retrieved',
        data: drive,
      };
      res.json(response);
    } catch (err) {
      next(err);
    }
  }

  async createDrive(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const drive = await tpoService.createDrive(req.body);
      const response: ApiResponse<typeof drive> = {
        success: true,
        message: 'Recruitment drive created successfully',
        data: drive,
      };
      res.status(201).json(response);
    } catch (err) {
      next(err);
    }
  }

  async updateDrive(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const updated = await tpoService.updateDrive(req.params.id, req.body);
      const response: ApiResponse<typeof updated> = {
        success: true,
        message: 'Recruitment drive updated',
        data: updated,
      };
      res.json(response);
    } catch (err) {
      next(err);
    }
  }

  async updateDriveStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const updated = await tpoService.updateDriveStatus(req.params.id, req.body.status);
      const response: ApiResponse<typeof updated> = {
        success: true,
        message: `Drive status changed to ${req.body.status}`,
        data: updated,
      };
      res.json(response);
    } catch (err) {
      next(err);
    }
  }

  async getEligibilityPreview(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      let criteria = req.body;
      if (req.params.id) {
        const drive = await tpoService.getDriveById(req.params.id);
        criteria = drive;
      }
      const preview = await tpoService.getEligibilityPreview(criteria);
      const response: ApiResponse<typeof preview> = {
        success: true,
        message: 'Eligibility preview computed',
        data: preview,
      };
      res.json(response);
    } catch (err) {
      next(err);
    }
  }

  async getDriveApplicants(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const applicants = await tpoService.getDriveApplicants(req.params.id, {
        status: req.query.status as string,
        search: req.query.search as string,
      });
      const response: ApiResponse<typeof applicants> = {
        success: true,
        message: 'Drive applicants list retrieved',
        data: applicants,
      };
      res.json(response);
    } catch (err) {
      next(err);
    }
  }

  async updateApplicationStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { status, notes } = req.body;
      const updated = await tpoService.updateApplicationStatus(req.params.id, status, notes);
      const response: ApiResponse<typeof updated> = {
        success: true,
        message: `Application status transitioned to ${status}`,
        data: updated,
      };
      res.json(response);
    } catch (err) {
      next(err);
    }
  }

  async bulkUpdateApplications(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { applicationIds, status, notes } = req.body;
      const result = await tpoService.bulkUpdateApplicationStatus(applicationIds, status, notes);
      const response: ApiResponse<typeof result> = {
        success: true,
        message: `Updated status for ${result.updatedCount} applications`,
        data: result,
      };
      res.json(response);
    } catch (err) {
      next(err);
    }
  }

  async getAllApplications(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const applications = await tpoService.getAllApplications({
        search: req.query.search as string,
        status: req.query.status as string,
      });
      const response: ApiResponse<typeof applications> = {
        success: true,
        message: 'All applications retrieved',
        data: applications,
      };
      res.json(response);
    } catch (err) {
      next(err);
    }
  }

  async getNotifications(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const notifications = await tpoService.getTpoNotifications();
      const response: ApiResponse<typeof notifications> = {
        success: true,
        message: 'TPO notifications feed retrieved',
        data: notifications,
      };
      res.json(response);
    } catch (err) {
      next(err);
    }
  }

  async getDeliveryLogs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { template, status, recipientEmail, limit, offset } = req.query;
      const result = await notificationDispatcher.getDeliveryLogs({
        template: template as string,
        status: status as any,
        recipientEmail: recipientEmail as string,
        limit: limit ? parseInt(limit as string, 10) : undefined,
        offset: offset ? parseInt(offset as string, 10) : undefined,
      });
      const response: ApiResponse<typeof result> = {
        success: true,
        message: 'Notification delivery logs retrieved',
        data: result,
      };
      res.json(response);
    } catch (err) {
      next(err);
    }
  }

  async sendInterviewAlert(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await tpoService.sendInterviewAlert(req.body);
      const response: ApiResponse<typeof result> = {
        success: true,
        message: `Instant alerts dispatched to ${result.dispatchedCount} student(s)`,
        data: result,
      };
      res.status(200).json(response);
    } catch (err) {
      next(err);
    }
  }

  async getAnalytics(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const analytics = await tpoService.getAnalytics();
      const response: ApiResponse<typeof analytics> = {
        success: true,
        message: 'Placement analytics retrieved',
        data: analytics,
      };
      res.json(response);
    } catch (err) {
      next(err);
    }
  }

  async exportStudentsCsv(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { filename, csv } = await tpoService.exportStudentsCsv({
        search: req.query.search as string,
        department: req.query.department as string,
        studentType: req.query.studentType as string,
        status: req.query.status as string,
        verificationStatus: req.query.verificationStatus as string,
        backlogStatus: req.query.backlogStatus as string,
        batchYear: req.query.batchYear ? Number(req.query.batchYear) : undefined,
        currentSemester: req.query.currentSemester ? Number(req.query.currentSemester) : undefined,
        minCgpa: req.query.minCgpa ? Number(req.query.minCgpa) : undefined,
      });

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.status(200).send(csv);
    } catch (err) {
      next(err);
    }
  }

  async exportApplicationsCsv(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { filename, csv } = await tpoService.exportApplicationsCsv({
        driveId: req.query.driveId as string,
        status: req.query.status as string,
        search: req.query.search as string,
        department: req.query.department as string,
        batchYear: req.query.batchYear ? Number(req.query.batchYear) : undefined,
      });

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.status(200).send(csv);
    } catch (err) {
      next(err);
    }
  }
}

export const tpoController = new TpoController();
