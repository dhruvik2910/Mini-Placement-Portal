import { prisma } from '../../config/database';
import { Prisma, RecruitmentDrive } from '@prisma/client';
import { AppError } from '../../common/errors/app-error';
import {
  DriveStatus,
  DriveType,
  StudentType,
  RecruitmentDriveDto,
} from '@placement/shared';

type StudentProfileWithAcademics = Prisma.StudentProfileGetPayload<{
  include: { tenthMarks: true; twelfthDetails: true; d2dDetails: true };
}>;

export class DrivesService {
  async getDrives(userId?: string, query?: { search?: string; status?: string; eligibility?: string }): Promise<RecruitmentDriveDto[]> {
    let studentProfile: StudentProfileWithAcademics | null = null;
    const appliedDriveIds = new Set<string>();

    if (userId) {
      studentProfile = await prisma.studentProfile.findUnique({
        where: { userId },
        include: { tenthMarks: true, twelfthDetails: true, d2dDetails: true },
      });

      if (studentProfile) {
        const apps = await prisma.application.findMany({
          where: { studentProfileId: studentProfile.id },
          select: { recruitmentDriveId: true, id: true },
        });
        apps.forEach((a) => appliedDriveIds.add(a.recruitmentDriveId));
      }
    }

    const whereClause: Prisma.RecruitmentDriveWhereInput = {};
    if (query?.status) {
      whereClause.status = query.status as unknown as Prisma.EnumDriveStatusFilter['equals'];
    }

    if (query?.search) {
      whereClause.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { jobRole: { contains: query.search, mode: 'insensitive' } },
        { company: { name: { contains: query.search, mode: 'insensitive' } } },
        { location: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const drives = await prisma.recruitmentDrive.findMany({
      where: whereClause,
      include: {
        company: true,
        applications: userId && studentProfile
          ? {
              where: { studentProfileId: studentProfile.id },
              select: { id: true, status: true },
            }
          : false,
      },
      orderBy: [{ status: 'asc' }, { deadline: 'asc' }],
    });

    const now = new Date();

    const dtos: RecruitmentDriveDto[] = drives.map((d) => {
      const hasApplied = appliedDriveIds.has(d.id);
      const userApp = 'applications' in d && Array.isArray((d as { applications?: unknown[] }).applications)
        ? (d as { applications: Array<{ id: string; status: string }> }).applications[0]
        : undefined;
      const isClosed = now > new Date(d.deadline) || d.status !== 'ACTIVE';

      let isEligible = true;
      let ineligibilityReasons: string[] = [];

      if (studentProfile) {
        const evalResult = this.evaluateEligibility(studentProfile, d);
        isEligible = evalResult.isEligible;
        ineligibilityReasons = evalResult.reasons;
      }

      return {
        id: d.id,
        companyId: d.companyId,
        company: {
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
        },
        title: d.title,
        jobRole: d.jobRole,
        driveType: d.driveType as unknown as DriveType,
        status: d.status as unknown as DriveStatus,
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
          allowedStudentTypes: d.allowedStudentTypes as unknown as StudentType[],
          allowedDepartments: d.allowedDepartments,
        },
        isEligible,
        ineligibilityReasons,
        hasApplied,
        applicationId: userApp?.id,
        isClosed,
        createdAt: d.createdAt.toISOString(),
        updatedAt: d.updatedAt.toISOString(),
      };
    });

    if (query?.eligibility === 'eligible' && studentProfile) {
      return dtos.filter((d) => d.isEligible && !d.hasApplied && !d.isClosed);
    }

    return dtos;
  }

  async getDriveById(driveId: string, userId?: string): Promise<RecruitmentDriveDto> {
    const drive = await prisma.recruitmentDrive.findUnique({
      where: { id: driveId },
      include: { company: true },
    });

    if (!drive) {
      throw AppError.notFound('Placement drive not found');
    }

    let isEligible = true;
    let ineligibilityReasons: string[] = [];
    let hasApplied = false;
    let applicationId: string | undefined = undefined;

    if (userId) {
      const studentProfile = await prisma.studentProfile.findUnique({
        where: { userId },
        include: { tenthMarks: true, twelfthDetails: true, d2dDetails: true },
      });

      if (studentProfile) {
        const evalResult = this.evaluateEligibility(studentProfile, drive);
        isEligible = evalResult.isEligible;
        ineligibilityReasons = evalResult.reasons;

        const application = await prisma.application.findUnique({
          where: {
            studentProfileId_recruitmentDriveId: {
              studentProfileId: studentProfile.id,
              recruitmentDriveId: drive.id,
            },
          },
        });
        if (application) {
          hasApplied = true;
          applicationId = application.id;
        }
      }
    }

    const now = new Date();
    const isClosed = now > new Date(drive.deadline) || drive.status !== 'ACTIVE';

    return {
      id: drive.id,
      companyId: drive.companyId,
      company: {
        id: drive.company.id,
        name: drive.company.name,
        website: drive.company.website,
        industry: drive.company.industry,
        description: drive.company.description,
        logoUrl: drive.company.logoUrl,
        contactPerson: drive.company.contactPerson,
        contactEmail: drive.company.contactEmail,
        contactPhone: drive.company.contactPhone,
        createdAt: drive.company.createdAt.toISOString(),
        updatedAt: drive.company.updatedAt.toISOString(),
      },
      title: drive.title,
      jobRole: drive.jobRole,
      driveType: drive.driveType as unknown as DriveType,
      status: drive.status as unknown as DriveStatus,
      packageLpa: drive.packageLpa ? Number(drive.packageLpa) : null,
      stipendMonthly: drive.stipendMonthly ? Number(drive.stipendMonthly) : null,
      location: drive.location,
      description: drive.description,
      deadline: drive.deadline.toISOString(),
      driveDate: drive.driveDate?.toISOString() || null,
      requiredSkills: drive.requiredSkills || [],
      eligibility: {
        minCgpa: Number(drive.minCgpa),
        minTenthPercentage: Number(drive.minTenthPercentage),
        minTwelfthOrDiplomaPercentage: Number(drive.minTwelfthOrDiplomaPercentage),
        maxActiveBacklogs: drive.maxActiveBacklogs,
        allowedStudentTypes: drive.allowedStudentTypes as unknown as StudentType[],
        allowedDepartments: drive.allowedDepartments,
      },
      isEligible,
      ineligibilityReasons,
      hasApplied,
      applicationId,
      isClosed,
      createdAt: drive.createdAt.toISOString(),
      updatedAt: drive.updatedAt.toISOString(),
    };
  }

  evaluateEligibility(
    studentProfile: StudentProfileWithAcademics,
    drive: RecruitmentDrive
  ): { isEligible: boolean; reasons: string[] } {
    const reasons: string[] = [];

    // Profile check
    if (!studentProfile.tenthMarks) {
      reasons.push('Incomplete profile: 10th standard marks must be provided');
    }

    if (studentProfile.studentType === 'REGULAR' && !studentProfile.twelfthDetails) {
      reasons.push('Incomplete profile: 12th standard details must be provided');
    }

    if (studentProfile.studentType === 'D2D' && !studentProfile.d2dDetails) {
      reasons.push('Incomplete profile: Diploma details must be provided');
    }

    // Student Type check
    if (drive.allowedStudentTypes && drive.allowedStudentTypes.length > 0) {
      if (!drive.allowedStudentTypes.includes(studentProfile.studentType)) {
        reasons.push(`Student type mismatch: Drive is restricted to ${drive.allowedStudentTypes.join(', ')} students`);
      }
    }

    // Department check
    if (drive.allowedDepartments && drive.allowedDepartments.length > 0) {
      if (!drive.allowedDepartments.includes(studentProfile.department)) {
        reasons.push(`Department mismatch: Open only to [${drive.allowedDepartments.join(', ')}]`);
      }
    }

    // CGPA check
    const minCgpa = Number(drive.minCgpa);
    const currentCgpa = Number(studentProfile.currentCgpa);
    if (minCgpa > 0 && currentCgpa < minCgpa) {
      reasons.push(`CGPA requirement: Minimum ${minCgpa.toFixed(2)} required (Your CGPA: ${currentCgpa.toFixed(2)})`);
    }

    // Active Backlogs check
    if (studentProfile.activeBacklogs > drive.maxActiveBacklogs) {
      reasons.push(`Backlog cutoff: Maximum allowed is ${drive.maxActiveBacklogs} (You have ${studentProfile.activeBacklogs})`);
    }

    // 10th Percentage check
    const minTenth = Number(drive.minTenthPercentage);
    if (minTenth > 0 && studentProfile.tenthMarks) {
      const tenthPct = Number(studentProfile.tenthMarks.percentage);
      if (tenthPct < minTenth) {
        reasons.push(`10th marks requirement: Minimum ${minTenth}% required (Your score: ${tenthPct.toFixed(1)}%)`);
      }
    }

    // 12th / Diploma Percentage check
    const minHigherSec = Number(drive.minTwelfthOrDiplomaPercentage);
    if (minHigherSec > 0) {
      if (studentProfile.studentType === 'REGULAR' && studentProfile.twelfthDetails) {
        const twelfthPct = Number(studentProfile.twelfthDetails.percentage);
        if (twelfthPct < minHigherSec) {
          reasons.push(`12th marks requirement: Minimum ${minHigherSec}% required (Your score: ${twelfthPct.toFixed(1)}%)`);
        }
      } else if (studentProfile.studentType === 'D2D' && studentProfile.d2dDetails) {
        const dipPct = studentProfile.d2dDetails.diplomaPercentage
          ? Number(studentProfile.d2dDetails.diplomaPercentage)
          : Number(studentProfile.d2dDetails.diplomaCgpa) * 9.5;
        if (dipPct < minHigherSec) {
          reasons.push(`Diploma marks requirement: Minimum ${minHigherSec}% required (Your score: ${dipPct.toFixed(1)}%)`);
        }
      }
    }

    return {
      isEligible: reasons.length === 0,
      reasons,
    };
  }
}

export const drivesService = new DrivesService();
