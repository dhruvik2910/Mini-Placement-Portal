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
        studentProfile: {
          ...user.studentProfile,
          studentType: user.studentProfile.studentType as unknown as StudentType,
          status: user.studentProfile.status as unknown as ProfileStatus,
          verificationStatus: user.studentProfile.verificationStatus as unknown as VerificationStatus,
          currentCgpa: Number(user.studentProfile.currentCgpa),
          createdAt: user.studentProfile.createdAt.toISOString(),
          updatedAt: user.studentProfile.updatedAt.toISOString(),
          skills: (user.studentProfile.skills as any) || null,
        } as StudentProfileDto,
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

    let studentProfileDto: StudentProfileDto | undefined = undefined;
    if (user.studentProfile) {
      const sp = user.studentProfile;
      studentProfileDto = {
        ...sp,
        studentType: sp.studentType as unknown as StudentType,
        status: sp.status as unknown as ProfileStatus,
        verificationStatus: sp.verificationStatus as unknown as VerificationStatus,
        currentCgpa: Number(sp.currentCgpa),
        createdAt: sp.createdAt.toISOString(),
        updatedAt: sp.updatedAt.toISOString(),
        lockedAt: sp.lockedAt?.toISOString() || null,
        dateOfBirth: sp.dateOfBirth?.toISOString() || null,
        resumeUpdatedAt: sp.resumeUpdatedAt?.toISOString() || null,
        skills: (sp.skills as any) || null,
        tenthMarks: sp.tenthMarks
          ? {
              ...sp.tenthMarks,
              marksObtained: Number(sp.tenthMarks.marksObtained),
              totalMarks: Number(sp.tenthMarks.totalMarks),
              percentage: Number(sp.tenthMarks.percentage),
              subjectWiseMarks: (sp.tenthMarks.subjectWiseMarks as any) || [],
              createdAt: sp.tenthMarks.createdAt.toISOString(),
              updatedAt: sp.tenthMarks.updatedAt.toISOString(),
            }
          : null,
        twelfthDetails: sp.twelfthDetails
          ? {
              ...sp.twelfthDetails,
              marksObtained: Number(sp.twelfthDetails.marksObtained),
              totalMarks: Number(sp.twelfthDetails.totalMarks),
              percentage: Number(sp.twelfthDetails.percentage),
              createdAt: sp.twelfthDetails.createdAt.toISOString(),
              updatedAt: sp.twelfthDetails.updatedAt.toISOString(),
            }
          : null,
        d2dDetails: sp.d2dDetails
          ? {
              ...sp.d2dDetails,
              diplomaCgpa: Number(sp.d2dDetails.diplomaCgpa),
              diplomaPercentage: sp.d2dDetails.diplomaPercentage
                ? Number(sp.d2dDetails.diplomaPercentage)
                : null,
              createdAt: sp.d2dDetails.createdAt.toISOString(),
              updatedAt: sp.d2dDetails.updatedAt.toISOString(),
            }
          : null,
      };
    }

    return {
      token,
      user: {
        ...userDto,
        studentProfile: studentProfileDto,
        tpoProfile: user.tpoProfile
          ? {
              ...user.tpoProfile,
              createdAt: user.tpoProfile.createdAt.toISOString(),
              updatedAt: user.tpoProfile.updatedAt.toISOString(),
            }
          : null,
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

    let studentProfileDto: StudentProfileDto | undefined = undefined;
    if (user.studentProfile) {
      const sp = user.studentProfile;
      studentProfileDto = {
        ...sp,
        studentType: sp.studentType as unknown as StudentType,
        status: sp.status as unknown as ProfileStatus,
        verificationStatus: sp.verificationStatus as unknown as VerificationStatus,
        currentCgpa: Number(sp.currentCgpa),
        createdAt: sp.createdAt.toISOString(),
        updatedAt: sp.updatedAt.toISOString(),
        lockedAt: sp.lockedAt?.toISOString() || null,
        dateOfBirth: sp.dateOfBirth?.toISOString() || null,
        resumeUpdatedAt: sp.resumeUpdatedAt?.toISOString() || null,
        skills: (sp.skills as any) || null,
        tenthMarks: sp.tenthMarks
          ? {
              ...sp.tenthMarks,
              marksObtained: Number(sp.tenthMarks.marksObtained),
              totalMarks: Number(sp.tenthMarks.totalMarks),
              percentage: Number(sp.tenthMarks.percentage),
              subjectWiseMarks: (sp.tenthMarks.subjectWiseMarks as any) || [],
              createdAt: sp.tenthMarks.createdAt.toISOString(),
              updatedAt: sp.tenthMarks.updatedAt.toISOString(),
            }
          : null,
        twelfthDetails: sp.twelfthDetails
          ? {
              ...sp.twelfthDetails,
              marksObtained: Number(sp.twelfthDetails.marksObtained),
              totalMarks: Number(sp.twelfthDetails.totalMarks),
              percentage: Number(sp.twelfthDetails.percentage),
              createdAt: sp.twelfthDetails.createdAt.toISOString(),
              updatedAt: sp.twelfthDetails.updatedAt.toISOString(),
            }
          : null,
        d2dDetails: sp.d2dDetails
          ? {
              ...sp.d2dDetails,
              diplomaCgpa: Number(sp.d2dDetails.diplomaCgpa),
              diplomaPercentage: sp.d2dDetails.diplomaPercentage
                ? Number(sp.d2dDetails.diplomaPercentage)
                : null,
              createdAt: sp.d2dDetails.createdAt.toISOString(),
              updatedAt: sp.d2dDetails.updatedAt.toISOString(),
            }
          : null,
      };
    }

    return {
      id: user.id,
      email: user.email,
      role: user.role as unknown as UserRole,
      isActive: user.isActive,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
      studentProfile: studentProfileDto,
      tpoProfile: user.tpoProfile
        ? {
            ...user.tpoProfile,
            createdAt: user.tpoProfile.createdAt.toISOString(),
            updatedAt: user.tpoProfile.updatedAt.toISOString(),
          }
        : null,
    };
  }
}

export const authService = new AuthService();
