import { prisma } from '../../config/database';
import { AppError } from '../../common/errors/app-error';
import { drivesService } from '../drives/drives.service';
import {
  ApplicationStatus,
  DriveStatus,
  ApplicationDto,
} from '@placement/shared';

export class ApplicationsService {
  async applyToDrive(
    userId: string,
    recruitmentDriveId: string,
    notes?: string | null
  ): Promise<ApplicationDto> {
    const student = await prisma.studentProfile.findUnique({
      where: { userId },
      include: { tenthMarks: true, twelfthDetails: true, d2dDetails: true },
    });

    if (!student) {
      throw AppError.notFound('Student profile not found. Please complete registration.');
    }

    const drive = await prisma.recruitmentDrive.findUnique({
      where: { id: recruitmentDriveId },
      include: { company: true },
    });

    if (!drive) {
      throw AppError.notFound('Recruitment drive not found.');
    }

    if (drive.status !== DriveStatus.ACTIVE) {
      throw AppError.badRequest(`This drive is not open for applications (Current status: ${drive.status}).`);
    }

    if (new Date() > new Date(drive.deadline)) {
      throw AppError.badRequest('The application deadline for this drive has already passed.');
    }

    // Duplicate Check
    const existing = await prisma.application.findUnique({
      where: {
        studentProfileId_recruitmentDriveId: {
          studentProfileId: student.id,
          recruitmentDriveId: drive.id,
        },
      },
    });

    if (existing) {
      throw AppError.conflict('You have already submitted an application for this placement drive.');
    }

    // STRICT SERVER-SIDE ELIGIBILITY VALIDATION
    const evalResult = drivesService.evaluateEligibility(student, drive);
    if (!evalResult.isEligible) {
      throw AppError.forbidden(
        `Application rejected: You do not meet the drive eligibility criteria: ${evalResult.reasons.join('; ')}`
      );
    }

    // Create Application & Audit Notification
    const application = await prisma.$transaction(async (tx) => {
      const app = await tx.application.create({
        data: {
          studentProfileId: student.id,
          recruitmentDriveId: drive.id,
          status: ApplicationStatus.APPLIED,
          notes: notes || null,
        },
        include: {
          recruitmentDrive: {
            include: { company: true },
          },
          studentProfile: true,
        },
      });

      await tx.notification.create({
        data: {
          studentProfileId: student.id,
          title: 'Application Submitted Successfully',
          message: `Your application for ${drive.jobRole} at ${drive.company.name} has been received and is under review.`,
          type: 'APPLICATION',
        },
      });

      return app;
    });

    return this.mapToDto(application);
  }

  async getMyApplications(userId: string, status?: string): Promise<ApplicationDto[]> {
    const student = await prisma.studentProfile.findUnique({ where: { userId } });
    if (!student) throw AppError.notFound('Student profile not found');

    const whereClause: any = { studentProfileId: student.id };
    if (status && status !== 'ALL') {
      whereClause.status = status;
    }

    const applications = await prisma.application.findMany({
      where: whereClause,
      include: {
        recruitmentDrive: {
          include: { company: true },
        },
      },
      orderBy: { appliedAt: 'desc' },
    });

    return applications.map((app) => this.mapToDto(app));
  }

  async getApplicationById(userId: string, applicationId: string): Promise<ApplicationDto> {
    const student = await prisma.studentProfile.findUnique({ where: { userId } });
    if (!student) throw AppError.notFound('Student profile not found');

    const application = await prisma.application.findFirst({
      where: {
        id: applicationId,
        studentProfileId: student.id,
      },
      include: {
        recruitmentDrive: {
          include: { company: true },
        },
        studentProfile: {
          include: { tenthMarks: true, twelfthDetails: true, d2dDetails: true },
        },
      },
    });

    if (!application) {
      throw AppError.notFound('Application record not found');
    }

    return this.mapToDto(application);
  }

  private mapToDto(app: any): ApplicationDto {
    const d = app.recruitmentDrive;
    return {
      id: app.id,
      studentProfileId: app.studentProfileId,
      recruitmentDriveId: app.recruitmentDriveId,
      status: app.status,
      appliedAt: app.appliedAt.toISOString(),
      notes: app.notes,
      updatedAt: app.updatedAt.toISOString(),
      recruitmentDrive: d
        ? {
            id: d.id,
            companyId: d.companyId,
            company: d.company
              ? {
                  id: d.company.id,
                  name: d.company.name,
                  website: d.company.website,
                  industry: d.company.industry,
                  description: d.company.description,
                  logoUrl: d.company.logoUrl,
                  contactPerson: d.company.contactPerson,
                  contactEmail: d.company.contactEmail,
                  contactPhone: d.company.contactPhone,
                  createdAt: d.company.createdAt.toISOString(),
                  updatedAt: d.company.updatedAt.toISOString(),
                }
              : undefined,
            title: d.title,
            jobRole: d.jobRole,
            driveType: d.driveType,
            status: d.status,
            packageLpa: d.packageLpa ? Number(d.packageLpa) : null,
            stipendMonthly: d.stipendMonthly ? Number(d.stipendMonthly) : null,
            location: d.location,
            description: d.description,
            deadline: d.deadline.toISOString(),
            driveDate: d.driveDate?.toISOString() || null,
            requiredSkills: d.requiredSkills || [],
            eligibility: {
              minCgpa: Number(d.minCgpa),
              minTenthPercentage: Number(d.minTenthPercentage),
              minTwelfthOrDiplomaPercentage: Number(d.minTwelfthOrDiplomaPercentage),
              maxActiveBacklogs: d.maxActiveBacklogs,
              allowedStudentTypes: d.allowedStudentTypes,
              allowedDepartments: d.allowedDepartments,
            },
            createdAt: d.createdAt.toISOString(),
            updatedAt: d.updatedAt.toISOString(),
          }
        : undefined,
    };
  }
}

export const applicationsService = new ApplicationsService();
