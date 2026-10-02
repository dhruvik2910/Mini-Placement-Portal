import bcryptjs from 'bcryptjs';
import { prisma } from '../../config/database';
import { AppError } from '../../common/errors/app-error';
import { signJwtToken } from '../../common/utils/jwt';
import {
  UserRole,
  ProfileStatus,
  VerificationStatus,
  StudentType,
  AuthResponse,
  UserDto,
  StudentProfileDto,
  TpoProfileDto,
} from '@placement/shared';
import { z } from 'zod';
import { StudentRegisterSchema, LoginSchema } from '@placement/shared';

export class AuthService {
  async registerStudent(dto: z.infer<typeof StudentRegisterSchema>): Promise<AuthResponse> {
    const existingEmail = await prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existingEmail) {
      throw AppError.conflict('An account with this email address already exists');
    }

    const existingEnrollment = await prisma.studentProfile.findUnique({
      where: { enrollmentNumber: dto.enrollmentNumber },
    });
    if (existingEnrollment) {
      throw AppError.conflict('A student profile with this enrollment number already exists');
    }

    const passwordHash = await bcryptjs.hash(dto.password, 10);

    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email: dto.email,
          passwordHash,
          role: 'STUDENT',
        },
      });

      const newProfile = await tx.studentProfile.create({
        data: {
          userId: newUser.id,
          studentType: dto.studentType as any,
          enrollmentNumber: dto.enrollmentNumber,
          firstName: dto.firstName,
          middleName: dto.middleName || null,
          lastName: dto.lastName,
          department: dto.department,
          batchYear: dto.batchYear,
          currentSemester: 7,
          currentCgpa: 0.0,
          activeBacklogs: 0,
          totalBacklogs: 0,
          status: 'DRAFT',
          verificationStatus: 'PENDING',
        },
      });

      // Create a welcome notification
      await tx.notification.create({
        data: {
          studentProfileId: newProfile.id,
          title: 'Welcome to LDCE Placement Portal',
          message: 'Your LDCE student placement profile has been registered. Please complete your academic profile to unlock eligible campus recruitment drives.',
          type: 'SYSTEM',
        },
      });

      return {
        ...newUser,
        studentProfile: newProfile,
      };
    });

    const token = signJwtToken({
      userId: user.id,
      email: user.email,
      role: UserRole.STUDENT,
      studentProfileId: user.studentProfile.id,
    });

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role as unknown as UserRole,
        isActive: user.isActive,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
        studentProfile: this.mapStudentProfileToDto(user.studentProfile),
      },
    };
  }

  async login(dto: z.infer<typeof LoginSchema>): Promise<AuthResponse> {
    const user = await prisma.user.findUnique({
      where: { email: dto.email },
      include: {
        studentProfile: {
          include: {
            tenthMarks: true,
            twelfthDetails: true,
            d2dDetails: true,
          },
        },
        tpoProfile: true,
      },
    });

    if (!user) {
      throw AppError.unauthorized('Invalid email or password');
    }

    if (!user.isActive) {
      throw AppError.forbidden('Your account has been deactivated. Please contact Central TPO.');
    }

    const isMatch = await bcryptjs.compare(dto.password, user.passwordHash);
    if (!isMatch) {
      throw AppError.unauthorized('Invalid email or password');
    }

    const token = signJwtToken({
      userId: user.id,
      email: user.email,
      role: user.role as unknown as UserRole,
      studentProfileId: user.studentProfile?.id,
    });

    const userDto: UserDto = {
      id: user.id,
      email: user.email,
      role: user.role as unknown as UserRole,
      isActive: user.isActive,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };

    return {
      token,
      user: {
        ...userDto,
        studentProfile: user.studentProfile ? this.mapStudentProfileToDto(user.studentProfile) : undefined,
        tpoProfile: this.mapTpoProfileToDto(user.tpoProfile),
      },
    };
  }

  async getCurrentUser(userId: string): Promise<AuthResponse['user']> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        studentProfile: {
          include: {
            tenthMarks: true,
            twelfthDetails: true,
            d2dDetails: true,
          },
        },
        tpoProfile: true,
      },
    });

    if (!user) {
      throw AppError.notFound('User not found');
    }

    return {
      id: user.id,
      email: user.email,
      role: user.role as unknown as UserRole,
      isActive: user.isActive,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
      studentProfile: user.studentProfile ? this.mapStudentProfileToDto(user.studentProfile) : undefined,
      tpoProfile: this.mapTpoProfileToDto(user.tpoProfile),
    };
  }

  private mapStudentProfileToDto(sp: any): StudentProfileDto {
    return {
      id: sp.id,
      userId: sp.userId,
      studentType: sp.studentType as unknown as StudentType,
      enrollmentNumber: sp.enrollmentNumber,
      firstName: sp.firstName,
      middleName: sp.middleName ?? null,
      lastName: sp.lastName,
      department: sp.department,
      batchYear: sp.batchYear,
      currentSemester: sp.currentSemester,
      currentCgpa: Number(sp.currentCgpa),
      activeBacklogs: sp.activeBacklogs,
      totalBacklogs: sp.totalBacklogs,
      phone: sp.phone ?? null,
      dateOfBirth: sp.dateOfBirth ? (sp.dateOfBirth instanceof Date ? sp.dateOfBirth.toISOString() : new Date(sp.dateOfBirth).toISOString()) : null,
      gender: sp.gender ?? null,
      address: sp.address ?? null,
      skills: (sp.skills as any) || null,
      resumeUrl: sp.resumeUrl ?? null,
      resumeName: sp.resumeName ?? null,
      resumeUpdatedAt: sp.resumeUpdatedAt ? (sp.resumeUpdatedAt instanceof Date ? sp.resumeUpdatedAt.toISOString() : new Date(sp.resumeUpdatedAt).toISOString()) : null,
      status: sp.status as unknown as ProfileStatus,
      lockedAt: sp.lockedAt ? (sp.lockedAt instanceof Date ? sp.lockedAt.toISOString() : new Date(sp.lockedAt).toISOString()) : null,
      verificationStatus: sp.verificationStatus as unknown as VerificationStatus,
      tenthMarks: sp.tenthMarks
        ? {
            id: sp.tenthMarks.id,
            studentProfileId: sp.tenthMarks.studentProfileId,
            board: sp.tenthMarks.board,
            schoolName: sp.tenthMarks.schoolName,
            passingYear: sp.tenthMarks.passingYear,
            marksObtained: Number(sp.tenthMarks.marksObtained),
            totalMarks: Number(sp.tenthMarks.totalMarks),
            percentage: Number(sp.tenthMarks.percentage),
            subjectWiseMarks: (sp.tenthMarks.subjectWiseMarks as any) || [],
            createdAt: sp.tenthMarks.createdAt instanceof Date ? sp.tenthMarks.createdAt.toISOString() : new Date(sp.tenthMarks.createdAt).toISOString(),
            updatedAt: sp.tenthMarks.updatedAt instanceof Date ? sp.tenthMarks.updatedAt.toISOString() : new Date(sp.tenthMarks.updatedAt).toISOString(),
          }
        : null,
      twelfthDetails: sp.twelfthDetails
        ? {
            id: sp.twelfthDetails.id,
            studentProfileId: sp.twelfthDetails.studentProfileId,
            board: sp.twelfthDetails.board,
            schoolName: sp.twelfthDetails.schoolName,
            passingYear: sp.twelfthDetails.passingYear,
            stream: sp.twelfthDetails.stream,
            marksObtained: Number(sp.twelfthDetails.marksObtained),
            totalMarks: Number(sp.twelfthDetails.totalMarks),
            percentage: Number(sp.twelfthDetails.percentage),
            createdAt: sp.twelfthDetails.createdAt instanceof Date ? sp.twelfthDetails.createdAt.toISOString() : new Date(sp.twelfthDetails.createdAt).toISOString(),
            updatedAt: sp.twelfthDetails.updatedAt instanceof Date ? sp.twelfthDetails.updatedAt.toISOString() : new Date(sp.twelfthDetails.updatedAt).toISOString(),
          }
        : null,
      d2dDetails: sp.d2dDetails
        ? {
            id: sp.d2dDetails.id,
            studentProfileId: sp.d2dDetails.studentProfileId,
            diplomaCollege: sp.d2dDetails.diplomaCollege,
            diplomaUniversity: sp.d2dDetails.diplomaUniversity,
            diplomaBranch: sp.d2dDetails.diplomaBranch,
            passingYear: sp.d2dDetails.passingYear,
            diplomaCgpa: Number(sp.d2dDetails.diplomaCgpa),
            diplomaPercentage: sp.d2dDetails.diplomaPercentage ? Number(sp.d2dDetails.diplomaPercentage) : null,
            createdAt: sp.d2dDetails.createdAt instanceof Date ? sp.d2dDetails.createdAt.toISOString() : new Date(sp.d2dDetails.createdAt).toISOString(),
            updatedAt: sp.d2dDetails.updatedAt instanceof Date ? sp.d2dDetails.updatedAt.toISOString() : new Date(sp.d2dDetails.updatedAt).toISOString(),
          }
        : null,
      createdAt: sp.createdAt instanceof Date ? sp.createdAt.toISOString() : new Date(sp.createdAt).toISOString(),
      updatedAt: sp.updatedAt instanceof Date ? sp.updatedAt.toISOString() : new Date(sp.updatedAt).toISOString(),
    };
  }

  private mapTpoProfileToDto(tp: any): TpoProfileDto | null {
    if (!tp) return null;
    return {
      id: tp.id,
      userId: tp.userId,
      fullName: tp.fullName,
      designation: tp.designation,
      department: tp.department ?? null,
      phone: tp.phone ?? null,
      createdAt: tp.createdAt instanceof Date ? tp.createdAt.toISOString() : new Date(tp.createdAt).toISOString(),
      updatedAt: tp.updatedAt instanceof Date ? tp.updatedAt.toISOString() : new Date(tp.updatedAt).toISOString(),
    };
  }
}

export const authService = new AuthService();
