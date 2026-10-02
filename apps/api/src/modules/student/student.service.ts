import { prisma } from '../../config/database';
import { AppError } from '../../common/errors/app-error';
import {
  ProfileStatus,
  StudentType,
  VerificationStatus,
  StudentProfileDto,
  NotificationDto,
} from '@placement/shared';
import { z } from 'zod';
import { UpdateProfileSchema } from '@placement/shared';

export class StudentService {
  async getProfile(userId: string): Promise<StudentProfileDto> {
    const profile = await prisma.studentProfile.findUnique({
      where: { userId },
      include: {
        tenthMarks: true,
        twelfthDetails: true,
        d2dDetails: true,
      },
    });

    if (!profile) {
      throw AppError.notFound('Student profile not found');
    }

    return this.mapToDto(profile);
  }

  async updateProfile(
    userId: string,
    dto: z.infer<typeof UpdateProfileSchema>
  ): Promise<StudentProfileDto> {
    const current = await prisma.studentProfile.findUnique({
      where: { userId },
      include: { tenthMarks: true, twelfthDetails: true, d2dDetails: true },
    });

    if (!current) {
      throw AppError.notFound('Student profile not found');
    }

    // SERVER-SIDE PROFILE LOCKING ENFORCEMENT
    if (current.status === 'LOCKED') {
      throw AppError.forbidden(
        'Your profile is LOCKED and cannot be edited. Please contact the Central TPO to request any corrections.'
      );
    }

    const calculatedTenthPercentage = Number(
      ((dto.tenthMarks.marksObtained / dto.tenthMarks.totalMarks) * 100).toFixed(2)
    );

    const updated = await prisma.$transaction(async (tx) => {
      // 1. Update basic profile info
      await tx.studentProfile.update({
        where: { id: current.id },
        data: {
          firstName: dto.firstName,
          middleName: dto.middleName || null,
          lastName: dto.lastName,
          phone: dto.phone || null,
          dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : null,
          gender: dto.gender || null,
          address: dto.address || null,
          department: dto.department,
          batchYear: dto.batchYear,
          currentSemester: dto.currentSemester,
          currentCgpa: dto.currentCgpa ?? undefined,
          activeBacklogs: dto.activeBacklogs,
          totalBacklogs: dto.totalBacklogs,
          skills: dto.skills ? (dto.skills as any) : undefined,
        },
      });

      // 2. Upsert 10th Marks
      await tx.tenthMarks.upsert({
        where: { studentProfileId: current.id },
        create: {
          studentProfileId: current.id,
          board: dto.tenthMarks.board,
          schoolName: dto.tenthMarks.schoolName,
          passingYear: dto.tenthMarks.passingYear,
          marksObtained: dto.tenthMarks.marksObtained,
          totalMarks: dto.tenthMarks.totalMarks,
          percentage: calculatedTenthPercentage,
          subjectWiseMarks: dto.tenthMarks.subjectWiseMarks as any,
        },
        update: {
          board: dto.tenthMarks.board,
          schoolName: dto.tenthMarks.schoolName,
          passingYear: dto.tenthMarks.passingYear,
          marksObtained: dto.tenthMarks.marksObtained,
          totalMarks: dto.tenthMarks.totalMarks,
          percentage: calculatedTenthPercentage,
          subjectWiseMarks: dto.tenthMarks.subjectWiseMarks as any,
        },
      });

      // 3. Upsert 12th details if REGULAR student
      if (current.studentType === 'REGULAR' && dto.twelfthDetails) {
        const twelfthPct = Number(
          ((dto.twelfthDetails.marksObtained / dto.twelfthDetails.totalMarks) * 100).toFixed(2)
        );

        await tx.twelfthDetails.upsert({
          where: { studentProfileId: current.id },
          create: {
            studentProfileId: current.id,
            board: dto.twelfthDetails.board,
            schoolName: dto.twelfthDetails.schoolName,
            passingYear: dto.twelfthDetails.passingYear,
            stream: dto.twelfthDetails.stream,
            marksObtained: dto.twelfthDetails.marksObtained,
            totalMarks: dto.twelfthDetails.totalMarks,
            percentage: twelfthPct,
          },
          update: {
            board: dto.twelfthDetails.board,
            schoolName: dto.twelfthDetails.schoolName,
            passingYear: dto.twelfthDetails.passingYear,
            stream: dto.twelfthDetails.stream,
            marksObtained: dto.twelfthDetails.marksObtained,
            totalMarks: dto.twelfthDetails.totalMarks,
            percentage: twelfthPct,
          },
        });
      }

      // 4. Upsert Diploma details if D2D student
      if (current.studentType === 'D2D' && dto.d2dDetails) {
        await tx.d2DDetails.upsert({
          where: { studentProfileId: current.id },
          create: {
            studentProfileId: current.id,
            diplomaCollege: dto.d2dDetails.diplomaCollege,
            diplomaUniversity: dto.d2dDetails.diplomaUniversity,
            diplomaBranch: dto.d2dDetails.diplomaBranch,
            passingYear: dto.d2dDetails.passingYear,
            diplomaCgpa: dto.d2dDetails.diplomaCgpa,
            diplomaPercentage: dto.d2dDetails.diplomaPercentage || null,
          },
          update: {
            diplomaCollege: dto.d2dDetails.diplomaCollege,
            diplomaUniversity: dto.d2dDetails.diplomaUniversity,
            diplomaBranch: dto.d2dDetails.diplomaBranch,
            passingYear: dto.d2dDetails.passingYear,
            diplomaCgpa: dto.d2dDetails.diplomaCgpa,
            diplomaPercentage: dto.d2dDetails.diplomaPercentage || null,
          },
        });
      }

      return tx.studentProfile.findUnique({
        where: { id: current.id },
        include: { tenthMarks: true, twelfthDetails: true, d2dDetails: true },
      });
    });

    if (!updated) {
      throw AppError.internal('Failed to update student profile');
    }

    return this.mapToDto(updated);
  }

  async lockProfile(userId: string): Promise<StudentProfileDto> {
    const profile = await prisma.studentProfile.findUnique({
      where: { userId },
      include: { tenthMarks: true, twelfthDetails: true, d2dDetails: true },
    });

    if (!profile) {
      throw AppError.notFound('Student profile not found');
    }

    if (profile.status === 'LOCKED') {
      return this.mapToDto(profile);
    }

    // Validation: Require 10th and 12th/Diploma before locking
    if (!profile.tenthMarks) {
      throw AppError.badRequest('Cannot lock profile: 10th standard marks must be submitted first.');
    }

    if (profile.studentType === 'REGULAR' && !profile.twelfthDetails) {
      throw AppError.badRequest('Cannot lock profile: 12th standard details must be submitted for regular students.');
    }

    if (profile.studentType === 'D2D' && !profile.d2dDetails) {
      throw AppError.badRequest('Cannot lock profile: Diploma details must be submitted for D2D students.');
    }

    if (Number(profile.currentCgpa) <= 0) {
      throw AppError.badRequest('Cannot lock profile: Valid Current CGPA must be provided.');
    }

    const updated = await prisma.$transaction(async (tx) => {
      const locked = await tx.studentProfile.update({
        where: { id: profile.id },
        data: {
          status: 'LOCKED',
          lockedAt: new Date(),
        },
        include: { tenthMarks: true, twelfthDetails: true, d2dDetails: true },
      });

      await tx.notification.create({
        data: {
          studentProfileId: profile.id,
          title: 'Profile Submitted & Locked',
          message: 'Your academic profile has been locked for TPO verification. You are now eligible to apply to recruitment drives matching your criteria.',
          type: 'COMPLIANCE',
        },
      });

      return locked;
    });

    return this.mapToDto(updated);
  }

  async updateResume(
    userId: string,
    resumeUrl: string,
    resumeName: string
  ): Promise<StudentProfileDto> {
    const profile = await prisma.studentProfile.findUnique({ where: { userId } });
    if (!profile) throw AppError.notFound('Profile not found');

    const updated = await prisma.studentProfile.update({
      where: { id: profile.id },
      data: {
        resumeUrl,
        resumeName,
        resumeUpdatedAt: new Date(),
      },
      include: { tenthMarks: true, twelfthDetails: true, d2dDetails: true },
    });

    return this.mapToDto(updated);
  }

  async deleteResume(userId: string): Promise<StudentProfileDto> {
    const profile = await prisma.studentProfile.findUnique({ where: { userId } });
    if (!profile) throw AppError.notFound('Profile not found');

    const updated = await prisma.studentProfile.update({
      where: { id: profile.id },
      data: {
        resumeUrl: null,
        resumeName: null,
        resumeUpdatedAt: null,
      },
      include: { tenthMarks: true, twelfthDetails: true, d2dDetails: true },
    });

    return this.mapToDto(updated);
  }

  async getNotifications(userId: string): Promise<NotificationDto[]> {
    const profile = await prisma.studentProfile.findUnique({ where: { userId } });
    if (!profile) throw AppError.notFound('Profile not found');

    const notifications = await prisma.notification.findMany({
      where: { studentProfileId: profile.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return notifications.map((n) => ({
      id: n.id,
      studentProfileId: n.studentProfileId,
      title: n.title,
      message: n.message,
      type: n.type,
      isRead: n.isRead,
      createdAt: n.createdAt.toISOString(),
    }));
  }

  async markNotificationRead(userId: string, notificationId: string): Promise<void> {
    const profile = await prisma.studentProfile.findUnique({ where: { userId } });
    if (!profile) throw AppError.notFound('Profile not found');

    await prisma.notification.updateMany({
      where: { id: notificationId, studentProfileId: profile.id },
      data: { isRead: true },
    });
  }

  private mapToDto(profile: any): StudentProfileDto {
    return {
      ...profile,
      studentType: profile.studentType as unknown as StudentType,
      status: profile.status as unknown as ProfileStatus,
      verificationStatus: profile.verificationStatus as unknown as VerificationStatus,
      currentCgpa: Number(profile.currentCgpa),
      createdAt: profile.createdAt.toISOString(),
      updatedAt: profile.updatedAt.toISOString(),
      lockedAt: profile.lockedAt?.toISOString() || null,
      dateOfBirth: profile.dateOfBirth?.toISOString() || null,
      resumeUpdatedAt: profile.resumeUpdatedAt?.toISOString() || null,
      skills: (profile.skills as any) || null,
      tenthMarks: profile.tenthMarks
        ? {
            ...profile.tenthMarks,
            marksObtained: Number(profile.tenthMarks.marksObtained),
            totalMarks: Number(profile.tenthMarks.totalMarks),
            percentage: Number(profile.tenthMarks.percentage),
            subjectWiseMarks: (profile.tenthMarks.subjectWiseMarks as any) || [],
            createdAt: profile.tenthMarks.createdAt.toISOString(),
            updatedAt: profile.tenthMarks.updatedAt.toISOString(),
          }
        : null,
      twelfthDetails: profile.twelfthDetails
        ? {
            ...profile.twelfthDetails,
            marksObtained: Number(profile.twelfthDetails.marksObtained),
            totalMarks: Number(profile.twelfthDetails.totalMarks),
            percentage: Number(profile.twelfthDetails.percentage),
            createdAt: profile.twelfthDetails.createdAt.toISOString(),
            updatedAt: profile.twelfthDetails.updatedAt.toISOString(),
          }
        : null,
      d2dDetails: profile.d2dDetails
        ? {
            ...profile.d2dDetails,
            diplomaCgpa: Number(profile.d2dDetails.diplomaCgpa),
            diplomaPercentage: profile.d2dDetails.diplomaPercentage
              ? Number(profile.d2dDetails.diplomaPercentage)
              : null,
            createdAt: profile.d2dDetails.createdAt.toISOString(),
            updatedAt: profile.d2dDetails.updatedAt.toISOString(),
          }
        : null,
    };
  }
}

export const studentService = new StudentService();
