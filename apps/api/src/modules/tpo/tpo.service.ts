import { prisma } from '../../config/database';
import { AppError } from '../../common/errors/app-error';
import { drivesService } from '../drives/drives.service';
import { generateCsv } from '../../common/utils/csv';
import { notificationDispatcher } from '../notifications/dispatcher.service';
import {
  StudentType,
  ProfileStatus,
  VerificationStatus,
  ApplicationStatus,
  DriveType,
  DriveStatus,
  StudentProfileDto,
  RecruitmentDriveDto,
  CompanyDto,
  ApplicationDto,
  TpoDashboardStats,
  TpoAnalyticsDto,
  EligibilityPreviewResult,
  TpoActivityItem,
  NotificationChannel,
  SendInterviewAlertDto,
  SendInterviewAlertResultDto,
} from '@placement/shared';

export class TpoService {
  /**
   * 1. TPO Dashboard Statistics
   */
  async getDashboardStats(): Promise<TpoDashboardStats> {
    const [
      totalStudents,
      lockedProfiles,
      totalCompanies,
      activeDrives,
      totalApplications,
      shortlistedCount,
      selectedCount,
      allProfiles,
      applicationsByStatusGroup,
      recentApplications,
      recentDrives,
      recentCompanies,
    ] = await Promise.all([
      prisma.studentProfile.count(),
      prisma.studentProfile.count({ where: { status: 'LOCKED' } }),
      prisma.company.count(),
      prisma.recruitmentDrive.count({ where: { status: 'ACTIVE' } }),
      prisma.application.count(),
      prisma.application.count({ where: { status: 'SHORTLISTED' } }),
      prisma.application.count({ where: { status: 'SELECTED' } }),
      prisma.studentProfile.findMany({
        select: {
          id: true,
          department: true,
          studentType: true,
          status: true,
          tenthMarks: { select: { id: true } },
          twelfthDetails: { select: { id: true } },
          d2dDetails: { select: { id: true } },
          resumeUrl: true,
        },
      }),
      prisma.application.groupBy({
        by: ['status'],
        _count: { status: true },
      }),
      prisma.application.findMany({
        take: 8,
        orderBy: { appliedAt: 'desc' },
        include: {
          studentProfile: { select: { firstName: true, lastName: true, enrollmentNumber: true } },
          recruitmentDrive: { select: { jobRole: true, company: { select: { name: true } } } },
        },
      }),
      prisma.recruitmentDrive.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { company: { select: { name: true } } },
      }),
      prisma.company.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: { id: true, name: true, createdAt: true },
      }),
    ]);

    // Calculate complete vs incomplete profiles
    let completeProfiles = 0;
    const studentsByDepartment: Record<string, number> = {};
    let regularCount = 0;
    let d2dCount = 0;

    for (const p of allProfiles) {
      // Department count
      studentsByDepartment[p.department] = (studentsByDepartment[p.department] || 0) + 1;
      if (p.studentType === 'REGULAR') regularCount++;
      else d2dCount++;

      // Completion check
      const hasTenth = !!p.tenthMarks;
      const hasSecondary = p.studentType === 'REGULAR' ? !!p.twelfthDetails : !!p.d2dDetails;
      if (p.status === 'LOCKED' || (hasTenth && hasSecondary)) {
        completeProfiles++;
      }
    }

    const incompleteProfiles = totalStudents - completeProfiles;

    // Map application counts by status
    const statusCounts: Record<string, number> = {};
    for (const group of applicationsByStatusGroup) {
      statusCounts[group.status] = group._count.status;
    }

    // Synthesize real chronological activity feed
    const activities: TpoActivityItem[] = [];

    for (const app of recentApplications) {
      activities.push({
        id: `app-${app.id}`,
        type: 'APPLICATION',
        title: 'New Student Application',
        description: `${app.studentProfile.firstName} ${app.studentProfile.lastName} (${app.studentProfile.enrollmentNumber}) applied for ${app.recruitmentDrive.jobRole} at ${app.recruitmentDrive.company.name}`,
        timestamp: app.appliedAt.toISOString(),
      });
    }

    for (const drive of recentDrives) {
      activities.push({
        id: `drive-${drive.id}`,
        type: 'DRIVE',
        title: 'Drive Posted',
        description: `Campus drive for "${drive.jobRole}" announced with ${drive.company.name}`,
        timestamp: drive.createdAt.toISOString(),
      });
    }

    for (const comp of recentCompanies) {
      activities.push({
        id: `company-${comp.id}`,
        type: 'COMPANY',
        title: 'Company Partner Added',
        description: `${comp.name} was registered into the institutional recruitment network`,
        timestamp: comp.createdAt.toISOString(),
      });
    }

    activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return {
      totalStudents,
      completeProfiles,
      incompleteProfiles,
      lockedProfiles,
      totalCompanies,
      activeDrives,
      totalApplications,
      shortlistedStudents: shortlistedCount,
      selectedStudents: selectedCount,
      applicationsByStatus: {
        applied: statusCounts['APPLIED'] || 0,
        underReview: statusCounts['UNDER_REVIEW'] || 0,
        shortlisted: statusCounts['SHORTLISTED'] || 0,
        selected: statusCounts['SELECTED'] || 0,
        rejected: statusCounts['REJECTED'] || 0,
      },
      studentsByDepartment,
      studentsByType: {
        regular: regularCount,
        d2d: d2dCount,
      },
      recentActivity: activities.slice(0, 10),
    };
  }

  /**
   * 2. Student Directory with Filters
   */
  async getStudents(filters: {
    search?: string;
    department?: string;
    studentType?: string;
    status?: string;
    verificationStatus?: string;
    backlogStatus?: string;
    batchYear?: number;
    currentSemester?: number;
    minCgpa?: number;
  }): Promise<Array<StudentProfileDto & { applicationsCount: number }>> {
    const where: any = {};

    if (filters.search) {
      const q = filters.search.trim();
      where.OR = [
        { firstName: { contains: q, mode: 'insensitive' } },
        { lastName: { contains: q, mode: 'insensitive' } },
        { enrollmentNumber: { contains: q, mode: 'insensitive' } },
        { user: { email: { contains: q, mode: 'insensitive' } } },
      ];
    }

    if (filters.department && filters.department !== 'ALL') {
      where.department = filters.department;
    }

    if (filters.studentType && filters.studentType !== 'ALL') {
      where.studentType = filters.studentType as StudentType;
    }

    if (filters.status && filters.status !== 'ALL') {
      where.status = filters.status as ProfileStatus;
    }

    if (filters.verificationStatus && filters.verificationStatus !== 'ALL') {
      where.verificationStatus = filters.verificationStatus as VerificationStatus;
    }

    if (filters.backlogStatus === 'ZERO_BACKLOGS') {
      where.activeBacklogs = 0;
    } else if (filters.backlogStatus === 'HAS_BACKLOGS') {
      where.activeBacklogs = { gt: 0 };
    }

    if (filters.batchYear) {
      where.batchYear = filters.batchYear;
    }

    if (filters.currentSemester) {
      where.currentSemester = filters.currentSemester;
    }

    if (filters.minCgpa !== undefined && !isNaN(filters.minCgpa)) {
      where.currentCgpa = { gte: filters.minCgpa };
    }

    const students = await prisma.studentProfile.findMany({
      where,
      include: {
        user: { select: { email: true, isActive: true } },
        tenthMarks: true,
        twelfthDetails: true,
        d2dDetails: true,
        _count: { select: { applications: true } },
      },
      orderBy: { enrollmentNumber: 'asc' },
    });

    return students.map((s) => ({
      ...this.mapStudentToDto(s),
      applicationsCount: s._count.applications,
    }));
  }

  /**
   * 3. Complete Student Detail Dossier
   */
  async getStudentById(id: string): Promise<
    StudentProfileDto & {
      user: { email: string; isActive: boolean };
      applications: ApplicationDto[];
      verifications: Array<{
        id: string;
        status: VerificationStatus;
        remarks: string | null;
        verifiedAt: string;
        verifiedBy: string;
      }>;
    }
  > {
    const student = await prisma.studentProfile.findUnique({
      where: { id },
      include: {
        user: { select: { email: true, isActive: true } },
        tenthMarks: true,
        twelfthDetails: true,
        d2dDetails: true,
        applications: {
          include: {
            recruitmentDrive: { include: { company: true } },
          },
          orderBy: { appliedAt: 'desc' },
        },
        verifications: {
          include: {
            verifiedByUser: {
              include: { tpoProfile: { select: { fullName: true } } },
            },
          },
          orderBy: { verifiedAt: 'desc' },
        },
      },
    });

    if (!student) {
      throw AppError.notFound('Student profile not found');
    }

    return {
      ...this.mapStudentToDto(student),
      user: student.user,
      applications: student.applications.map((app) => this.mapApplicationToDto(app)),
      verifications: student.verifications.map((v) => ({
        id: v.id,
        status: v.status as VerificationStatus,
        remarks: v.remarks,
        verifiedAt: v.verifiedAt.toISOString(),
        verifiedBy: v.verifiedByUser.tpoProfile?.fullName || v.verifiedByUser.email,
      })),
    };
  }

  /**
   * 4. Verify / Approve / Reject Student Profile
   */
  async verifyStudentProfile(
    studentProfileId: string,
    verifiedByUserId: string,
    status: VerificationStatus,
    remarks?: string | null
  ): Promise<StudentProfileDto> {
    const student = await prisma.studentProfile.findUnique({
      where: { id: studentProfileId },
      include: { user: true },
    });

    if (!student) {
      throw AppError.notFound('Student profile record not found');
    }

    const updated = await prisma.$transaction(async (tx) => {
      const sp = await tx.studentProfile.update({
        where: { id: studentProfileId },
        data: { verificationStatus: status },
        include: { tenthMarks: true, twelfthDetails: true, d2dDetails: true },
      });

      await tx.verification.create({
        data: {
          studentProfileId,
          verifiedByUserId,
          status,
          remarks: remarks || null,
        },
      });

      // Emit student notification
      const isApproved = status === VerificationStatus.VERIFIED;
      await tx.notification.create({
        data: {
          studentProfileId,
          title: isApproved ? 'Academic Profile Verified' : 'Compliance Correction Requested',
          message:
            remarks ||
            (isApproved
              ? 'Your academic credentials have been verified and approved by the Central Placement Office.'
              : 'Your profile has received feedback from the TPO. Please review any missing details.'),
          type: isApproved ? 'VERIFIED' : 'WARNING',
        },
      });

      return sp;
    });

    // Trigger institutional email dispatch (retry-safe, non-blocking)
    try {
      await notificationDispatcher.dispatchProfileVerification(studentProfileId, status, remarks);
    } catch (err) {
      console.error('[TPO SERVICE] Failed to dispatch profile verification email:', err);
    }

    return this.mapStudentToDto(updated);
  }

  /**
   * 5. Company Management
   */
  async getCompanies(search?: string): Promise<Array<CompanyDto & { drivesCount: number; activeDrivesCount: number }>> {
    const where: any = {};
    if (search) {
      const q = search.trim();
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { industry: { contains: q, mode: 'insensitive' } },
        { contactPerson: { contains: q, mode: 'insensitive' } },
      ];
    }

    const companies = await prisma.company.findMany({
      where,
      include: {
        recruitmentDrives: { select: { id: true, status: true } },
      },
      orderBy: { name: 'asc' },
    });

    return companies.map((c) => ({
      id: c.id,
      name: c.name,
      website: c.website,
      industry: c.industry,
      description: c.description,
      logoUrl: c.logoUrl,
      contactPerson: c.contactPerson,
      contactEmail: c.contactEmail,
      contactPhone: c.contactPhone,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
      drivesCount: c.recruitmentDrives.length,
      activeDrivesCount: c.recruitmentDrives.filter((d) => d.status === 'ACTIVE').length,
    }));
  }

  async getCompanyById(id: string): Promise<CompanyDto & { recruitmentDrives: RecruitmentDriveDto[] }> {
    const company = await prisma.company.findUnique({
      where: { id },
      include: {
        recruitmentDrives: {
          orderBy: { createdAt: 'desc' },
          include: { _count: { select: { applications: true } } },
        },
      },
    });

    if (!company) {
      throw AppError.notFound('Company not found');
    }

    return {
      id: company.id,
      name: company.name,
      website: company.website,
      industry: company.industry,
      description: company.description,
      logoUrl: company.logoUrl,
      contactPerson: company.contactPerson,
      contactEmail: company.contactEmail,
      contactPhone: company.contactPhone,
      createdAt: company.createdAt.toISOString(),
      updatedAt: company.updatedAt.toISOString(),
      recruitmentDrives: company.recruitmentDrives.map((d) => ({
        ...this.mapDriveToDto(d, company),
        applicantCount: (d as any)._count?.applications || 0,
      })),
    };
  }

  async createCompany(data: {
    name: string;
    website?: string | null;
    industry?: string | null;
    description?: string | null;
    logoUrl?: string | null;
    contactPerson?: string | null;
    contactEmail?: string | null;
    contactPhone?: string | null;
  }): Promise<CompanyDto> {
    const existing = await prisma.company.findUnique({
      where: { name: data.name },
    });
    if (existing) {
      throw AppError.conflict(`A company named "${data.name}" is already registered`);
    }

    const company = await prisma.company.create({
      data: {
        name: data.name,
        website: data.website || null,
        industry: data.industry || null,
        description: data.description || null,
        logoUrl: data.logoUrl || null,
        contactPerson: data.contactPerson || null,
        contactEmail: data.contactEmail || null,
        contactPhone: data.contactPhone || null,
      },
    });

    return this.mapCompanyToDto(company);
  }

  async updateCompany(
    id: string,
    data: Partial<{
      name: string;
      website?: string | null;
      industry?: string | null;
      description?: string | null;
      logoUrl?: string | null;
      contactPerson?: string | null;
      contactEmail?: string | null;
      contactPhone?: string | null;
    }>
  ): Promise<CompanyDto> {
    const existing = await prisma.company.findUnique({ where: { id } });
    if (!existing) {
      throw AppError.notFound('Company not found');
    }

    if (data.name && data.name !== existing.name) {
      const nameConflict = await prisma.company.findUnique({ where: { name: data.name } });
      if (nameConflict) {
        throw AppError.conflict(`A company named "${data.name}" already exists`);
      }
    }

    const updated = await prisma.company.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });

    return this.mapCompanyToDto(updated);
  }

  /**
   * 6. Recruitment Drives Management
   */
  async getDrives(filters?: { status?: string; companyId?: string; search?: string }): Promise<
    Array<RecruitmentDriveDto & { applicantCount: number }>
  > {
    const where: any = {};
    if (filters?.status && filters.status !== 'ALL') {
      where.status = filters.status;
    }
    if (filters?.companyId) {
      where.companyId = filters.companyId;
    }
    if (filters?.search) {
      const q = filters.search.trim();
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { jobRole: { contains: q, mode: 'insensitive' } },
        { company: { name: { contains: q, mode: 'insensitive' } } },
      ];
    }

    const drives = await prisma.recruitmentDrive.findMany({
      where,
      include: {
        company: true,
        _count: { select: { applications: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return drives.map((d) => ({
      ...this.mapDriveToDto(d, d.company),
      applicantCount: d._count.applications,
    }));
  }

  async getDriveById(id: string): Promise<RecruitmentDriveDto & { applicantCount: number }> {
    const drive = await prisma.recruitmentDrive.findUnique({
      where: { id },
      include: {
        company: true,
        _count: { select: { applications: true } },
      },
    });

    if (!drive) {
      throw AppError.notFound('Placement drive not found');
    }

    return {
      ...this.mapDriveToDto(drive, drive.company),
      applicantCount: drive._count.applications,
    };
  }

  async createDrive(data: any): Promise<RecruitmentDriveDto> {
    const company = await prisma.company.findUnique({ where: { id: data.companyId } });
    if (!company) {
      throw AppError.notFound('Target recruiting company not found');
    }

    const drive = await prisma.recruitmentDrive.create({
      data: {
        companyId: data.companyId,
        title: data.title,
        jobRole: data.jobRole,
        driveType: data.driveType || DriveType.FULL_TIME,
        status: data.status || DriveStatus.ACTIVE,
        packageLpa: data.packageLpa !== undefined && data.packageLpa !== null ? Number(data.packageLpa) : null,
        stipendMonthly: data.stipendMonthly !== undefined && data.stipendMonthly !== null ? Number(data.stipendMonthly) : null,
        location: data.location || null,
        description: data.description || null,
        deadline: new Date(data.deadline),
        driveDate: data.driveDate ? new Date(data.driveDate) : null,
        requiredSkills: data.requiredSkills || [],
        minCgpa: Number(data.minCgpa || 0),
        minTenthPercentage: Number(data.minTenthPercentage || 0),
        minTwelfthOrDiplomaPercentage: Number(data.minTwelfthOrDiplomaPercentage || 0),
        maxActiveBacklogs: Number(data.maxActiveBacklogs || 0),
        allowedStudentTypes: data.allowedStudentTypes || [StudentType.REGULAR, StudentType.D2D],
        allowedDepartments: data.allowedDepartments || [],
      },
      include: { company: true },
    });

    return this.mapDriveToDto(drive, company);
  }

  async updateDrive(id: string, data: any): Promise<RecruitmentDriveDto> {
    const existing = await prisma.recruitmentDrive.findUnique({ where: { id } });
    if (!existing) {
      throw AppError.notFound('Recruitment drive not found');
    }

    const updatePayload: any = {};
    if (data.companyId) updatePayload.companyId = data.companyId;
    if (data.title) updatePayload.title = data.title;
    if (data.jobRole) updatePayload.jobRole = data.jobRole;
    if (data.driveType) updatePayload.driveType = data.driveType;
    if (data.status) updatePayload.status = data.status;
    if (data.packageLpa !== undefined) updatePayload.packageLpa = data.packageLpa !== null ? Number(data.packageLpa) : null;
    if (data.stipendMonthly !== undefined) updatePayload.stipendMonthly = data.stipendMonthly !== null ? Number(data.stipendMonthly) : null;
    if (data.location !== undefined) updatePayload.location = data.location;
    if (data.description !== undefined) updatePayload.description = data.description;
    if (data.deadline) updatePayload.deadline = new Date(data.deadline);
    if (data.driveDate !== undefined) updatePayload.driveDate = data.driveDate ? new Date(data.driveDate) : null;
    if (data.requiredSkills) updatePayload.requiredSkills = data.requiredSkills;
    if (data.minCgpa !== undefined) updatePayload.minCgpa = Number(data.minCgpa);
    if (data.minTenthPercentage !== undefined) updatePayload.minTenthPercentage = Number(data.minTenthPercentage);
    if (data.minTwelfthOrDiplomaPercentage !== undefined) updatePayload.minTwelfthOrDiplomaPercentage = Number(data.minTwelfthOrDiplomaPercentage);
    if (data.maxActiveBacklogs !== undefined) updatePayload.maxActiveBacklogs = Number(data.maxActiveBacklogs);
    if (data.allowedStudentTypes) updatePayload.allowedStudentTypes = data.allowedStudentTypes;
    if (data.allowedDepartments) updatePayload.allowedDepartments = data.allowedDepartments;

    const updated = await prisma.recruitmentDrive.update({
      where: { id },
      data: updatePayload,
      include: { company: true },
    });

    return this.mapDriveToDto(updated, updated.company);
  }

  async updateDriveStatus(id: string, status: DriveStatus): Promise<RecruitmentDriveDto> {
    const drive = await prisma.recruitmentDrive.findUnique({ where: { id }, include: { company: true } });
    if (!drive) {
      throw AppError.notFound('Placement drive not found');
    }

    const updated = await prisma.recruitmentDrive.update({
      where: { id },
      data: { status },
      include: { company: true },
    });

    return this.mapDriveToDto(updated, updated.company);
  }

  /**
   * 7. Real-Time Eligibility Preview (Reusing drivesService.evaluateEligibility)
   */
  async getEligibilityPreview(criteria: any): Promise<EligibilityPreviewResult> {
    const students = await prisma.studentProfile.findMany({
      include: {
        tenthMarks: true,
        twelfthDetails: true,
        d2dDetails: true,
        user: { select: { email: true } },
      },
      orderBy: { enrollmentNumber: 'asc' },
    });

    const evaluatedStudents = students.map((student) => {
      // REUSE SAME BACKEND ELIGIBILITY ENGINE AS STUDENT SIDE
      const evalResult = drivesService.evaluateEligibility(student, criteria);
      return {
        student: this.mapStudentToDto(student),
        isEligible: evalResult.isEligible,
        reasons: evalResult.reasons,
      };
    });

    const eligibleCount = evaluatedStudents.filter((s) => s.isEligible).length;
    const totalStudents = evaluatedStudents.length;
    const ineligibleCount = totalStudents - eligibleCount;
    const eligibilityPercentage = totalStudents > 0 ? Number(((eligibleCount / totalStudents) * 100).toFixed(1)) : 0;

    return {
      totalStudents,
      eligibleCount,
      ineligibleCount,
      eligibilityPercentage,
      students: evaluatedStudents,
    };
  }

  /**
   * 8. Drive Applicant Management
   */
  async getDriveApplicants(
    driveId: string,
    filters?: { status?: string; search?: string }
  ): Promise<ApplicationDto[]> {
    const drive = await prisma.recruitmentDrive.findUnique({
      where: { id: driveId },
      include: { company: true },
    });
    if (!drive) {
      throw AppError.notFound('Placement drive not found');
    }

    const where: any = { recruitmentDriveId: driveId };
    if (filters?.status && filters.status !== 'ALL') {
      where.status = filters.status;
    }

    if (filters?.search) {
      const q = filters.search.trim();
      where.studentProfile = {
        OR: [
          { firstName: { contains: q, mode: 'insensitive' } },
          { lastName: { contains: q, mode: 'insensitive' } },
          { enrollmentNumber: { contains: q, mode: 'insensitive' } },
        ],
      };
    }

    const applications = await prisma.application.findMany({
      where,
      include: {
        studentProfile: {
          include: {
            user: { select: { email: true } },
            tenthMarks: true,
            twelfthDetails: true,
            d2dDetails: true,
          },
        },
        recruitmentDrive: { include: { company: true } },
      },
      orderBy: { appliedAt: 'asc' },
    });

    return applications.map((app) => this.mapApplicationToDto(app));
  }

  /**
   * 9. Application Status Transition Management
   */
  async updateApplicationStatus(
    applicationId: string,
    newStatus: ApplicationStatus,
    notes?: string | null
  ): Promise<ApplicationDto> {
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        studentProfile: true,
        recruitmentDrive: { include: { company: true } },
      },
    });

    if (!application) {
      throw AppError.notFound('Application record not found');
    }

    const currentStatus = application.status;

    // Enforce business state transitions
    if (currentStatus === ApplicationStatus.SELECTED && newStatus === ApplicationStatus.APPLIED) {
      throw AppError.badRequest('Cannot revert a SELECTED candidate back to APPLIED');
    }

    const updated = await prisma.$transaction(async (tx) => {
      const app = await tx.application.update({
        where: { id: applicationId },
        data: {
          status: newStatus,
          notes: notes !== undefined ? notes : application.notes,
          updatedAt: new Date(),
        },
        include: {
          studentProfile: {
            include: { tenthMarks: true, twelfthDetails: true, d2dDetails: true },
          },
          recruitmentDrive: { include: { company: true } },
        },
      });

      // Notification messages based on status
      let title = 'Application Status Updated';
      let message = `Your application for ${app.recruitmentDrive.jobRole} at ${app.recruitmentDrive.company.name} has been updated to ${newStatus}.`;
      let type = 'INFO';

      if (newStatus === ApplicationStatus.SHORTLISTED) {
        title = 'Congratulations! You are Shortlisted';
        message = `You have been shortlisted by ${app.recruitmentDrive.company.name} for the ${app.recruitmentDrive.jobRole} drive. Prepare for the next evaluation round.`;
        type = 'SUCCESS';
      } else if (newStatus === ApplicationStatus.SELECTED) {
        title = 'Offer Extended: You are Selected!';
        message = `Congratulations! You have been selected for the position of ${app.recruitmentDrive.jobRole} at ${app.recruitmentDrive.company.name}.`;
        type = 'OFFER';
      } else if (newStatus === ApplicationStatus.REJECTED) {
        title = 'Application Status Update';
        message = `Thank you for participating. Your candidature for ${app.recruitmentDrive.jobRole} at ${app.recruitmentDrive.company.name} was not selected in this cycle.`;
        type = 'WARNING';
      }

      await tx.notification.create({
        data: {
          studentProfileId: app.studentProfileId,
          title,
          message,
          type,
        },
      });

      return app;
    });

    // Trigger institutional email dispatch (retry-safe, non-blocking)
    try {
      await notificationDispatcher.dispatchApplicationStatus(applicationId, newStatus, notes);
    } catch (err) {
      console.error('[TPO SERVICE] Failed to dispatch application status email:', err);
    }

    return this.mapApplicationToDto(updated);
  }

  /**
   * 10. Bulk Applicant Status Updates
   */
  async bulkUpdateApplicationStatus(
    applicationIds: string[],
    newStatus: ApplicationStatus,
    notes?: string | null
  ): Promise<{ updatedCount: number }> {
    if (!applicationIds || applicationIds.length === 0) {
      throw AppError.badRequest('At least one application ID must be provided');
    }

    const applications = await prisma.application.findMany({
      where: { id: { in: applicationIds } },
      include: {
        recruitmentDrive: { include: { company: true } },
      },
    });

    if (applications.length === 0) {
      throw AppError.notFound('No matching applications found');
    }

    await prisma.$transaction(async (tx) => {
      await tx.application.updateMany({
        where: { id: { in: applicationIds } },
        data: {
          status: newStatus,
          notes: notes || undefined,
          updatedAt: new Date(),
        },
      });

      // Emit notifications for all applicants
      for (const app of applications) {
        let title = 'Application Status Updated';
        let message = `Your application for ${app.recruitmentDrive.jobRole} at ${app.recruitmentDrive.company.name} has been updated to ${newStatus}.`;
        let type = 'INFO';

        if (newStatus === ApplicationStatus.SHORTLISTED) {
          title = 'Shortlisted by Recruiter';
          message = `You have been shortlisted for ${app.recruitmentDrive.jobRole} at ${app.recruitmentDrive.company.name}.`;
          type = 'SUCCESS';
        } else if (newStatus === ApplicationStatus.SELECTED) {
          title = 'Offer Extended!';
          message = `Congratulations! You have been selected for ${app.recruitmentDrive.jobRole} at ${app.recruitmentDrive.company.name}.`;
          type = 'OFFER';
        } else if (newStatus === ApplicationStatus.REJECTED) {
          title = 'Application Update';
          message = `Your application for ${app.recruitmentDrive.jobRole} at ${app.recruitmentDrive.company.name} was not selected.`;
          type = 'WARNING';
        }

        await tx.notification.create({
          data: {
            studentProfileId: app.studentProfileId,
            title,
            message,
            type,
          },
        });
      }
    });

    // Trigger institutional email dispatch (retry-safe, non-blocking)
    try {
      await notificationDispatcher.dispatchBulkApplicationStatus(applicationIds, newStatus, notes);
    } catch (err) {
      console.error('[TPO SERVICE] Failed to dispatch bulk application status emails:', err);
    }

    return { updatedCount: applications.length };
  }

  /**
   * 11. Placement Analytics
   */
  async getAnalytics(): Promise<TpoAnalyticsDto> {
    const [totalStudents, allStudents, applications, drives, departmentsGroup] = await Promise.all([
      prisma.studentProfile.count(),
      prisma.studentProfile.findMany({
        select: {
          studentType: true,
          currentCgpa: true,
          activeBacklogs: true,
        },
      }),
      prisma.application.findMany({
        include: {
          studentProfile: { select: { department: true, currentCgpa: true } },
          recruitmentDrive: { select: { company: { select: { name: true } }, packageLpa: true } },
        },
      }),
      prisma.recruitmentDrive.findMany({
        include: {
          company: { select: { name: true } },
          applications: { select: { status: true } },
        },
      }),
      prisma.studentProfile.groupBy({
        by: ['department'],
        _count: { department: true },
        _avg: { currentCgpa: true },
      }),
    ]);

    // Regular vs D2D
    let regularCount = 0;
    let d2dCount = 0;
    const cgpaBins = {
      '9.0 - 10.0': 0,
      '8.0 - 8.99': 0,
      '7.0 - 7.99': 0,
      '6.0 - 6.99': 0,
      '< 6.0': 0,
    };
    const backlogBins = {
      'Zero Backlogs (Clear)': 0,
      '1 - 2 Backlogs': 0,
      '3+ Backlogs': 0,
    };

    for (const s of allStudents) {
      if (s.studentType === 'REGULAR') regularCount++;
      else d2dCount++;

      const cgpa = Number(s.currentCgpa);
      if (cgpa >= 9.0) cgpaBins['9.0 - 10.0']++;
      else if (cgpa >= 8.0) cgpaBins['8.0 - 8.99']++;
      else if (cgpa >= 7.0) cgpaBins['7.0 - 7.99']++;
      else if (cgpa >= 6.0) cgpaBins['6.0 - 6.99']++;
      else cgpaBins['< 6.0']++;

      if (s.activeBacklogs === 0) backlogBins['Zero Backlogs (Clear)']++;
      else if (s.activeBacklogs <= 2) backlogBins['1 - 2 Backlogs']++;
      else backlogBins['3+ Backlogs']++;
    }

    const cgpaDistribution = Object.entries(cgpaBins).map(([range, count]) => ({ range, count }));
    const backlogDistribution = Object.entries(backlogBins).map(([range, count]) => ({ range, count }));

    // Calculate selections and placement rate
    const selectedApplications = applications.filter((a) => a.status === 'SELECTED');
    const placedStudentIds = new Set(selectedApplications.map((a) => a.studentProfileId));
    const placedStudents = placedStudentIds.size;
    const placementRate = totalStudents > 0 ? Number(((placedStudents / totalStudents) * 100).toFixed(1)) : 0;

    // Packages calculation
    const packages = selectedApplications
      .map((a) => (a.recruitmentDrive.packageLpa ? Number(a.recruitmentDrive.packageLpa) : null))
      .filter((pkg): pkg is number => pkg !== null);

    const highestPackageLpa = packages.length > 0 ? Math.max(...packages) : 0;
    const averagePackageLpa =
      packages.length > 0 ? Number((packages.reduce((sum, p) => sum + p, 0) / packages.length).toFixed(2)) : 0;

    // Department Stats
    const departmentStats = departmentsGroup.map((d) => {
      const deptTotal = d._count.department;
      const deptSelectedApps = selectedApplications.filter((a) => a.studentProfile.department === d.department);
      const deptPlacedCount = new Set(deptSelectedApps.map((a) => a.studentProfileId)).size;
      const deptRate = deptTotal > 0 ? Number(((deptPlacedCount / deptTotal) * 100).toFixed(1)) : 0;

      return {
        department: d.department,
        total: deptTotal,
        placed: deptPlacedCount,
        placementRate: deptRate,
        avgCgpa: d._avg.currentCgpa ? Number(Number(d._avg.currentCgpa).toFixed(2)) : 0,
      };
    });

    // Company Stats
    const companyMap: Record<string, { drivesCount: number; applicationsCount: number; selectionsCount: number }> = {};
    for (const d of drives) {
      const compName = d.company.name;
      if (!companyMap[compName]) {
        companyMap[compName] = { drivesCount: 0, applicationsCount: 0, selectionsCount: 0 };
      }
      companyMap[compName].drivesCount++;
      companyMap[compName].applicationsCount += d.applications.length;
      companyMap[compName].selectionsCount += d.applications.filter((a) => a.status === 'SELECTED').length;
    }

    const companyStats = Object.entries(companyMap).map(([companyName, stats]) => ({
      companyName,
      drivesCount: stats.drivesCount,
      applicationsCount: stats.applicationsCount,
      selectionsCount: stats.selectionsCount,
    }));

    // Status Funnel
    const statusFunnel = {
      applied: applications.filter((a) => a.status === 'APPLIED').length,
      shortlisted: applications.filter((a) => a.status === 'SHORTLISTED').length,
      selected: selectedApplications.length,
      rejected: applications.filter((a) => a.status === 'REJECTED').length,
    };

    return {
      totalStudents,
      placedStudents,
      placementRate,
      averagePackageLpa,
      highestPackageLpa,
      studentsByType: {
        regular: regularCount,
        d2d: d2dCount,
      },
      cgpaDistribution,
      backlogDistribution,
      departmentStats,
      companyStats,
      statusFunnel,
    };
  }

  // ==============================================================================
  // Helper Mappers
  // ==============================================================================

  private mapStudentToDto(s: any): StudentProfileDto {
    return {
      id: s.id,
      userId: s.userId,
      studentType: s.studentType as unknown as StudentType,
      enrollmentNumber: s.enrollmentNumber,
      firstName: s.firstName,
      middleName: s.middleName,
      lastName: s.lastName,
      department: s.department,
      batchYear: s.batchYear,
      currentSemester: s.currentSemester,
      currentCgpa: Number(s.currentCgpa),
      activeBacklogs: s.activeBacklogs,
      totalBacklogs: s.totalBacklogs,
      phone: s.phone,
      dateOfBirth: s.dateOfBirth?.toISOString() || null,
      gender: s.gender,
      address: s.address,
      skills: (s.skills as any) || null,
      resumeUrl: s.resumeUrl,
      resumeName: s.resumeName,
      resumeUpdatedAt: s.resumeUpdatedAt?.toISOString() || null,
      status: s.status as unknown as ProfileStatus,
      lockedAt: s.lockedAt?.toISOString() || null,
      verificationStatus: s.verificationStatus as unknown as VerificationStatus,
      tenthMarks: s.tenthMarks
        ? {
            ...s.tenthMarks,
            marksObtained: Number(s.tenthMarks.marksObtained),
            totalMarks: Number(s.tenthMarks.totalMarks),
            percentage: Number(s.tenthMarks.percentage),
            subjectWiseMarks: (s.tenthMarks.subjectWiseMarks as any) || [],
            createdAt: s.tenthMarks.createdAt.toISOString(),
            updatedAt: s.tenthMarks.updatedAt.toISOString(),
          }
        : null,
      twelfthDetails: s.twelfthDetails
        ? {
            ...s.twelfthDetails,
            marksObtained: Number(s.twelfthDetails.marksObtained),
            totalMarks: Number(s.twelfthDetails.totalMarks),
            percentage: Number(s.twelfthDetails.percentage),
            createdAt: s.twelfthDetails.createdAt.toISOString(),
            updatedAt: s.twelfthDetails.updatedAt.toISOString(),
          }
        : null,
      d2dDetails: s.d2dDetails
        ? {
            ...s.d2dDetails,
            diplomaCgpa: Number(s.d2dDetails.diplomaCgpa),
            diplomaPercentage: s.d2dDetails.diplomaPercentage ? Number(s.d2dDetails.diplomaPercentage) : null,
            createdAt: s.d2dDetails.createdAt.toISOString(),
            updatedAt: s.d2dDetails.updatedAt.toISOString(),
          }
        : null,
      createdAt: s.createdAt.toISOString(),
      updatedAt: s.updatedAt.toISOString(),
    };
  }

  private mapDriveToDto(d: any, company?: any): RecruitmentDriveDto {
    return {
      id: d.id,
      companyId: d.companyId,
      company: company
        ? {
            id: company.id,
            name: company.name,
            website: company.website,
            industry: company.industry,
            description: company.description,
            logoUrl: company.logoUrl,
            contactPerson: company.contactPerson,
            contactEmail: company.contactEmail,
            contactPhone: company.contactPhone,
            createdAt: company.createdAt.toISOString(),
            updatedAt: company.updatedAt.toISOString(),
          }
        : undefined,
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
      createdAt: d.createdAt.toISOString(),
      updatedAt: d.updatedAt.toISOString(),
    };
  }

  async getAllApplications(filters: { search?: string; status?: string }): Promise<ApplicationDto[]> {
    const where: any = {};
    if (filters.status && filters.status !== 'ALL') {
      where.status = filters.status;
    }
    if (filters.search) {
      const q = filters.search.trim();
      where.OR = [
        { studentProfile: { firstName: { contains: q, mode: 'insensitive' } } },
        { studentProfile: { lastName: { contains: q, mode: 'insensitive' } } },
        { studentProfile: { enrollmentNumber: { contains: q, mode: 'insensitive' } } },
        { recruitmentDrive: { title: { contains: q, mode: 'insensitive' } } },
        { recruitmentDrive: { jobRole: { contains: q, mode: 'insensitive' } } },
        { recruitmentDrive: { company: { name: { contains: q, mode: 'insensitive' } } } },
      ];
    }
    const apps = await prisma.application.findMany({
      where,
      orderBy: { appliedAt: 'desc' },
      include: {
        studentProfile: true,
        recruitmentDrive: { include: { company: true } },
      },
    });
    return apps.map((a) => this.mapApplicationToDto(a));
  }

  /**
   * Export Student Cohort Directory to standard CSV
   */
  async exportStudentsCsv(filters: {
    search?: string;
    department?: string;
    studentType?: string;
    status?: string;
    verificationStatus?: string;
    backlogStatus?: string;
    batchYear?: number;
    currentSemester?: number;
    minCgpa?: number;
  }): Promise<{ filename: string; csv: string }> {
    const where: any = {};

    if (filters.search) {
      const q = filters.search.trim();
      where.OR = [
        { firstName: { contains: q, mode: 'insensitive' } },
        { lastName: { contains: q, mode: 'insensitive' } },
        { enrollmentNumber: { contains: q, mode: 'insensitive' } },
        { user: { email: { contains: q, mode: 'insensitive' } } },
      ];
    }

    if (filters.department && filters.department !== 'ALL') {
      where.department = filters.department;
    }

    if (filters.studentType && filters.studentType !== 'ALL') {
      where.studentType = filters.studentType as StudentType;
    }

    if (filters.status && filters.status !== 'ALL') {
      where.status = filters.status as ProfileStatus;
    }

    if (filters.verificationStatus && filters.verificationStatus !== 'ALL') {
      where.verificationStatus = filters.verificationStatus as VerificationStatus;
    }

    if (filters.backlogStatus === 'ZERO_BACKLOGS') {
      where.activeBacklogs = 0;
    } else if (filters.backlogStatus === 'HAS_BACKLOGS') {
      where.activeBacklogs = { gt: 0 };
    }

    if (filters.batchYear) {
      where.batchYear = filters.batchYear;
    }

    if (filters.currentSemester) {
      where.currentSemester = filters.currentSemester;
    }

    if (filters.minCgpa !== undefined && !isNaN(filters.minCgpa)) {
      where.currentCgpa = { gte: filters.minCgpa };
    }

    const students = await prisma.studentProfile.findMany({
      where,
      include: {
        user: { select: { email: true, isActive: true } },
        tenthMarks: true,
        twelfthDetails: true,
        d2dDetails: true,
        _count: { select: { applications: true } },
      },
      orderBy: { enrollmentNumber: 'asc' },
    });

    const headers = [
      'GTU Enrollment Number',
      'Full Name',
      'First Name',
      'Middle Name',
      'Last Name',
      'LDCE Department',
      'Student Track',
      'Batch Year',
      'Current Semester',
      'Verified CGPA',
      'Active Backlogs',
      'Total Backlogs',
      'Profile Status',
      'TPO Verification',
      'Institutional Email',
      'Mobile Phone',
      'Gender',
      '10th Board',
      '10th School',
      '10th Percentage',
      '12th/Diploma Stream/Branch',
      '12th/Diploma Institution',
      '12th/Diploma Percentage/CGPA',
      'Technical Skills',
      'Total Applications',
    ];

    const rows = students.map((s) => {
      const secondaryBoard = s.studentType === 'REGULAR'
        ? s.twelfthDetails?.board || ''
        : s.d2dDetails?.diplomaUniversity || '';
      const secondarySchool = s.studentType === 'REGULAR'
        ? s.twelfthDetails?.schoolName || ''
        : s.d2dDetails?.diplomaCollege || '';
      const secondaryScore = s.studentType === 'REGULAR'
        ? s.twelfthDetails?.percentage ? `${s.twelfthDetails.percentage}%` : ''
        : s.d2dDetails?.diplomaCgpa ? `${s.d2dDetails.diplomaCgpa} CGPA` : '';

      const skillsStr = s.skills && typeof s.skills === 'object'
        ? (Array.isArray((s.skills as any).technical) ? (s.skills as any).technical.join(', ') : '')
        : '';

      const fullName = [s.firstName, s.middleName, s.lastName].filter(Boolean).join(' ');

      return [
        s.enrollmentNumber,
        fullName,
        s.firstName,
        s.middleName || '',
        s.lastName,
        s.department,
        s.studentType === 'D2D' ? 'Lateral D2D' : 'Regular 4-Year',
        s.batchYear,
        s.currentSemester,
        s.currentCgpa ? Number(s.currentCgpa).toFixed(2) : '0.00',
        s.activeBacklogs,
        s.totalBacklogs,
        s.status,
        s.verificationStatus,
        s.user?.email || '',
        s.phone || '',
        s.gender || '',
        s.tenthMarks?.board || '',
        s.tenthMarks?.schoolName || '',
        s.tenthMarks?.percentage ? `${s.tenthMarks.percentage}%` : '',
        secondaryBoard,
        secondarySchool,
        secondaryScore,
        skillsStr,
        s._count.applications,
      ];
    });

    const timestamp = new Date().toISOString().slice(0, 10);
    const filename = `ldce-students-cohort-${timestamp}.csv`;
    const csv = generateCsv(headers, rows);

    return { filename, csv };
  }

  /**
   * Export Candidate Applications Pipeline to standard CSV
   */
  async exportApplicationsCsv(filters: {
    driveId?: string;
    status?: string;
    search?: string;
    department?: string;
    batchYear?: number;
  }): Promise<{ filename: string; csv: string }> {
    const where: any = {};

    if (filters.driveId && filters.driveId !== 'ALL') {
      where.recruitmentDriveId = filters.driveId;
    }

    if (filters.status && filters.status !== 'ALL') {
      where.status = filters.status;
    }

    if (filters.department && filters.department !== 'ALL') {
      where.studentProfile = { ...where.studentProfile, department: filters.department };
    }

    if (filters.batchYear) {
      where.studentProfile = { ...where.studentProfile, batchYear: filters.batchYear };
    }

    if (filters.search) {
      const q = filters.search.trim();
      where.OR = [
        { studentProfile: { firstName: { contains: q, mode: 'insensitive' } } },
        { studentProfile: { lastName: { contains: q, mode: 'insensitive' } } },
        { studentProfile: { enrollmentNumber: { contains: q, mode: 'insensitive' } } },
        { recruitmentDrive: { title: { contains: q, mode: 'insensitive' } } },
        { recruitmentDrive: { jobRole: { contains: q, mode: 'insensitive' } } },
        { recruitmentDrive: { company: { name: { contains: q, mode: 'insensitive' } } } },
      ];
    }

    const applications = await prisma.application.findMany({
      where,
      orderBy: { appliedAt: 'desc' },
      include: {
        studentProfile: {
          include: {
            user: { select: { email: true } },
          },
        },
        recruitmentDrive: {
          include: { company: true },
        },
      },
    });

    const headers = [
      'Application ID',
      'Applied Date',
      'GTU Enrollment Number',
      'Student Name',
      'LDCE Department',
      'Student Track',
      'Batch Year',
      'Verified CGPA',
      'Active Backlogs',
      'Student Email',
      'Student Phone',
      'Recruiting Partner',
      'Job Role',
      'Drive Type',
      'CTC / Package (LPA)',
      'Monthly Stipend',
      'Location',
      'Application Status',
      'Officer Notes / Remarks',
      'Last Updated',
    ];

    const rows = applications.map((app) => {
      const s = app.studentProfile;
      const d = app.recruitmentDrive;
      const studentName = s ? [s.firstName, s.middleName, s.lastName].filter(Boolean).join(' ') : 'Unknown';

      return [
        app.id,
        app.appliedAt.toISOString().slice(0, 10),
        s?.enrollmentNumber || '',
        studentName,
        s?.department || '',
        s?.studentType === 'D2D' ? 'Lateral D2D' : 'Regular 4-Year',
        s?.batchYear || '',
        s?.currentCgpa ? Number(s.currentCgpa).toFixed(2) : '0.00',
        s?.activeBacklogs ?? '',
        s?.user?.email || '',
        s?.phone || '',
        d?.company?.name || '',
        d?.jobRole || '',
        d?.driveType?.replace(/_/g, ' ') || '',
        d?.packageLpa ? `${d.packageLpa} LPA` : '',
        d?.stipendMonthly ? `${d.stipendMonthly}/mo` : '',
        d?.location || 'Multiple Locations',
        app.status,
        app.notes || '',
        app.updatedAt.toISOString().slice(0, 10),
      ];
    });

    const timestamp = new Date().toISOString().slice(0, 10);
    const filename = filters.driveId && filters.driveId !== 'ALL'
      ? `ldce-drive-applicants-${timestamp}.csv`
      : `ldce-applications-pipeline-${timestamp}.csv`;
    const csv = generateCsv(headers, rows);

    return { filename, csv };
  }

  async getTpoNotifications(): Promise<TpoActivityItem[]> {
    const stats = await this.getDashboardStats();
    return stats.recentActivity;
  }

  /**
   * Dispatch Instant Interview Alerts to selected candidate applications
   */
  async sendInterviewAlert(dto: SendInterviewAlertDto): Promise<SendInterviewAlertResultDto> {
    const applications = await prisma.application.findMany({
      where: { id: { in: dto.applicationIds } },
      include: {
        studentProfile: { include: { user: true } },
        recruitmentDrive: { include: { company: true } },
      },
    });

    const portalUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    let dispatchedCount = 0;
    const channelsUsed = Array.from(new Set(dto.channels));
    const details: NonNullable<SendInterviewAlertResultDto['details']> = [];

    for (const app of applications) {
      if (!app.studentProfile || !app.studentProfile.user) continue;

      const profile = app.studentProfile;
      const email = profile.user.email;
      const phone = profile.phone;
      const drive = app.recruitmentDrive;
      const company = drive.company;
      const studentName = `${profile.firstName} ${profile.lastName}`.trim();

      const studentChannelResults: Array<{
        channel: NotificationChannel;
        success: boolean;
        messageId?: string;
        error?: string;
      }> = [];

      // 1. Instant WhatsApp Alert
      if (channelsUsed.includes(NotificationChannel.WHATSAPP) && phone) {
        const waMessage =
          `⚡ *[LDCE Placements] Urgent Interview Alert!*\n\n` +
          `Hello *${profile.firstName}* (Roll: ${profile.enrollmentNumber}),\n\n` +
          `You are scheduled for the campus recruitment process:\n\n` +
          `🏢 *Company:* ${company.name}\n` +
          `💼 *Role:* ${drive.jobRole}\n` +
          `🎯 *Round:* ${dto.roundName}\n` +
          `⏰ *Time:* ${dto.scheduleTime}\n` +
          `📍 *Venue:* ${dto.venue}\n` +
          (dto.customNote ? `\n📝 *Notes:* ${dto.customNote}\n` : '') +
          `\nPlease report in formal attire with your ID and printed copies of your resume.\n\n` +
          `🔗 *View Details:* ${portalUrl}/applications\n\n` +
          `_Training & Placement Cell, L.D. College of Engineering (GTU Code: 028)_`;

        const waRes = await notificationDispatcher.dispatch({
          studentProfileId: profile.id,
          recipientEmail: email,
          recipientPhone: phone,
          channel: NotificationChannel.WHATSAPP,
          template: 'INTERVIEW_ALERT',
          subject: `[LDCE Placements] Interview Alert: ${company.name} — ${dto.roundName}`,
          bodyText: waMessage,
          bodyHtml: '',
          idempotencyKey: `wa-alert-${app.id}-${dto.roundName.replace(/\s+/g, '')}-${Date.now()}`,
        });

        studentChannelResults.push({
          channel: NotificationChannel.WHATSAPP,
          success: waRes.delivered,
          error: waRes.error,
        });
      }

      // 2. SMS Alert
      if (channelsUsed.includes(NotificationChannel.SMS) && phone) {
        const smsMessage =
          `LDCE Placements: ${profile.firstName}, your interview for ${company.name} (${dto.roundName}) is at ${dto.scheduleTime} in ${dto.venue}. Check portal for details.`;

        const smsRes = await notificationDispatcher.dispatch({
          studentProfileId: profile.id,
          recipientEmail: email,
          recipientPhone: phone,
          channel: NotificationChannel.SMS,
          template: 'INTERVIEW_ALERT',
          subject: `[LDCE Placements] SMS Alert: ${company.name}`,
          bodyText: smsMessage,
          bodyHtml: '',
          idempotencyKey: `sms-alert-${app.id}-${dto.roundName.replace(/\s+/g, '')}-${Date.now()}`,
        });

        studentChannelResults.push({
          channel: NotificationChannel.SMS,
          success: smsRes.delivered,
          error: smsRes.error,
        });
      }

      // 3. Email Alert + In-App Notification
      if (channelsUsed.includes(NotificationChannel.EMAIL)) {
        const emailSubject = `[LDCE Placements] Interview Schedule: ${company.name} — ${dto.roundName}`;
        const emailText =
          `Dear ${profile.firstName} (Roll: ${profile.enrollmentNumber}),\n\n` +
          `You have been scheduled for the campus placement interview with ${company.name}.\n\n` +
          `Round: ${dto.roundName}\nTime: ${dto.scheduleTime}\nVenue: ${dto.venue}\n` +
          (dto.customNote ? `Notes: ${dto.customNote}\n\n` : '\n') +
          `Please arrive 15 minutes before your scheduled time in formal attire.\n\n` +
          `Training & Placement Cell, L.D. College of Engineering, Ahmedabad`;

        const emailHtml =
          `<p>Dear <strong>${profile.firstName}</strong> (Roll: ${profile.enrollmentNumber}),</p>` +
          `<p>You have been scheduled for the campus placement interview with <strong>${company.name}</strong>.</p>` +
          `<div style="background: #f2f4fc; padding: 16px; border-left: 4px solid #13357b; margin: 16px 0;">` +
          `<p><strong>Company:</strong> ${company.name}</p>` +
          `<p><strong>Role:</strong> ${drive.jobRole}</p>` +
          `<p><strong>Round:</strong> ${dto.roundName}</p>` +
          `<p><strong>Time:</strong> ${dto.scheduleTime}</p>` +
          `<p><strong>Venue:</strong> ${dto.venue}</p>` +
          (dto.customNote ? `<p><strong>Instructions:</strong> ${dto.customNote}</p>` : '') +
          `</div>` +
          `<p>Training & Placement Cell, L.D. College of Engineering (GTU Code: 028)</p>`;

        const emailRes = await notificationDispatcher.dispatch({
          studentProfileId: profile.id,
          recipientEmail: email,
          recipientPhone: phone,
          channel: NotificationChannel.EMAIL,
          template: 'INTERVIEW_ALERT',
          subject: emailSubject,
          bodyText: emailText,
          bodyHtml: emailHtml,
          idempotencyKey: `email-alert-${app.id}-${dto.roundName.replace(/\s+/g, '')}-${Date.now()}`,
          inAppNotification: {
            title: `Interview Alert: ${company.name} (${dto.roundName})`,
            message: `Scheduled for ${dto.scheduleTime} at ${dto.venue}.`,
            type: 'INTERVIEW',
          },
        });

        studentChannelResults.push({
          channel: NotificationChannel.EMAIL,
          success: emailRes.delivered,
          error: emailRes.error,
        });
      }

      dispatchedCount++;
      details.push({
        applicationId: app.id,
        studentName,
        enrollmentNumber: profile.enrollmentNumber,
        channels: studentChannelResults,
      });
    }

    return {
      success: true,
      dispatchedCount,
      channelsUsed,
      timestamp: new Date().toISOString(),
      details,
    };
  }

  private mapCompanyToDto(c: any): CompanyDto {
    return {
      id: c.id,
      name: c.name,
      website: c.website,
      industry: c.industry,
      description: c.description,
      logoUrl: c.logoUrl,
      contactPerson: c.contactPerson,
      contactEmail: c.contactEmail,
      contactPhone: c.contactPhone,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
    };
  }

  private mapApplicationToDto(app: any): ApplicationDto {
    return {
      id: app.id,
      studentProfileId: app.studentProfileId,
      recruitmentDriveId: app.recruitmentDriveId,
      status: app.status as unknown as ApplicationStatus,
      appliedAt: app.appliedAt.toISOString(),
      notes: app.notes,
      updatedAt: app.updatedAt.toISOString(),
      recruitmentDrive: app.recruitmentDrive
        ? this.mapDriveToDto(app.recruitmentDrive, app.recruitmentDrive.company)
        : undefined,
      studentProfile: app.studentProfile ? this.mapStudentToDto(app.studentProfile) : undefined,
    };
  }
}

export const tpoService = new TpoService();
