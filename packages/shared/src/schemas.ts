import { z } from 'zod';
import {
  UserRole,
  StudentType,
  ProfileStatus,
  VerificationStatus,
  ApplicationStatus,
  DriveType,
  DriveStatus,
} from './enums';

export const UserRoleSchema = z.nativeEnum(UserRole);
export const StudentTypeSchema = z.nativeEnum(StudentType);
export const ProfileStatusSchema = z.nativeEnum(ProfileStatus);
export const VerificationStatusSchema = z.nativeEnum(VerificationStatus);
export const ApplicationStatusSchema = z.nativeEnum(ApplicationStatus);
export const DriveTypeSchema = z.nativeEnum(DriveType);
export const DriveStatusSchema = z.nativeEnum(DriveStatus);

export const SubjectWiseMarkSchema = z.object({
  subject: z.string().min(1, 'Subject name is required').trim(),
  marksObtained: z.number().min(0, 'Marks cannot be negative'),
  maxMarks: z.number().positive('Max marks must be greater than 0'),
});

export const StudentSkillsSchema = z.object({
  technical: z.array(z.string()).default([]),
  soft: z.array(z.string()).default([]),
  languages: z.array(z.string()).default([]),
  tools: z.array(z.string()).default([]),
});

export const HealthCheckResponseSchema = z.object({
  status: z.enum(['healthy', 'degraded', 'unhealthy']),
  timestamp: z.string(),
  version: z.string(),
  uptime: z.number(),
  environment: z.string(),
  database: z
    .object({
      connected: z.boolean(),
      latencyMs: z.number().optional(),
    })
    .optional(),
});

// Authentication Schemas
export const StudentRegisterSchema = z.object({
  email: z.string().email('Invalid email address').trim().toLowerCase(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  enrollmentNumber: z.string().min(3, 'Enrollment number is required').trim().toUpperCase(),
  firstName: z.string().min(1, 'First name is required').trim(),
  middleName: z.string().trim().optional(),
  lastName: z.string().min(1, 'Last name is required').trim(),
  department: z.string().min(1, 'Department is required').trim(),
  batchYear: z.coerce.number().int().min(2020).max(2035),
  studentType: StudentTypeSchema.default(StudentType.REGULAR),
});

export const LoginSchema = z.object({
  email: z.string().email('Invalid email address').trim().toLowerCase(),
  password: z.string().min(1, 'Password is required'),
});

// Profile Update Schema
export const UpdateProfileSchema = z.object({
  // Personal Info
  firstName: z.string().min(1, 'First name is required').trim(),
  middleName: z.string().trim().optional().nullable(),
  lastName: z.string().min(1, 'Last name is required').trim(),
  phone: z.string().trim().optional().nullable(),
  dateOfBirth: z.string().optional().nullable(),
  gender: z.string().trim().optional().nullable(),
  address: z.string().trim().optional().nullable(),
  department: z.string().min(1, 'Department is required').trim(),
  batchYear: z.coerce.number().int().min(2020).max(2035),
  currentSemester: z.coerce.number().int().min(1).max(8).default(7),
  currentCgpa: z.coerce.number().min(0).max(10),
  activeBacklogs: z.coerce.number().int().min(0).default(0),
  totalBacklogs: z.coerce.number().int().min(0).default(0),

  // 10th Standard Marks
  tenthMarks: z.object({
    board: z.string().min(1, '10th Board is required').trim(),
    schoolName: z.string().min(1, '10th School is required').trim(),
    passingYear: z.coerce.number().int().min(2010).max(2030),
    marksObtained: z.coerce.number().min(0),
    totalMarks: z.coerce.number().positive(),
    percentage: z.coerce.number().min(0).max(100),
    subjectWiseMarks: z.array(SubjectWiseMarkSchema).default([]),
  }),

  // Regular Student: 12th Details
  twelfthDetails: z
    .object({
      board: z.string().min(1, '12th Board is required').trim(),
      schoolName: z.string().min(1, '12th School is required').trim(),
      passingYear: z.coerce.number().int().min(2010).max(2030),
      stream: z.string().min(1, 'Stream is required').trim(),
      marksObtained: z.coerce.number().min(0),
      totalMarks: z.coerce.number().positive(),
      percentage: z.coerce.number().min(0).max(100),
    })
    .optional()
    .nullable(),

  // D2D Student: Diploma Details
  d2dDetails: z
    .object({
      diplomaCollege: z.string().min(1, 'Diploma college is required').trim(),
      diplomaUniversity: z.string().min(1, 'Diploma university is required').trim(),
      diplomaBranch: z.string().min(1, 'Diploma branch is required').trim(),
      passingYear: z.coerce.number().int().min(2010).max(2030),
      diplomaCgpa: z.coerce.number().min(0).max(10),
      diplomaPercentage: z.coerce.number().min(0).max(100).optional().nullable(),
    })
    .optional()
    .nullable(),

  // Skills
  skills: StudentSkillsSchema.optional().nullable(),
});

// Application Creation Schema
export const ApplyDriveSchema = z.object({
  recruitmentDriveId: z.string().uuid('Invalid recruitment drive ID'),
  notes: z.string().max(500).optional().nullable(),
});

// ==============================================================================
// TPO Management Schemas
// ==============================================================================

// Company Schemas
export const CompanyCreateSchema = z.object({
  name: z.string().min(2, 'Company name is required').trim(),
  website: z.string().trim().optional().nullable(),
  industry: z.string().trim().optional().nullable(),
  description: z.string().trim().optional().nullable(),
  logoUrl: z.string().trim().optional().nullable(),
  contactPerson: z.string().trim().optional().nullable(),
  contactEmail: z.string().email('Invalid email').trim().optional().nullable().or(z.literal('')),
  contactPhone: z.string().trim().optional().nullable(),
});

export const CompanyUpdateSchema = CompanyCreateSchema.partial();

// Recruitment Drive Schemas
export const DriveCreateSchema = z.object({
  companyId: z.string().uuid('Invalid company ID'),
  title: z.string().min(2, 'Title is required').trim(),
  jobRole: z.string().min(2, 'Job role is required').trim(),
  driveType: DriveTypeSchema.default(DriveType.FULL_TIME),
  status: DriveStatusSchema.default(DriveStatus.ACTIVE),
  packageLpa: z.coerce.number().min(0).optional().nullable(),
  stipendMonthly: z.coerce.number().min(0).optional().nullable(),
  location: z.string().trim().optional().nullable(),
  description: z.string().trim().optional().nullable(),
  deadline: z.string().min(1, 'Application deadline is required'),
  driveDate: z.string().optional().nullable(),
  requiredSkills: z.array(z.string()).default([]),
  minCgpa: z.coerce.number().min(0).max(10).default(0),
  minTenthPercentage: z.coerce.number().min(0).max(100).default(0),
  minTwelfthOrDiplomaPercentage: z.coerce.number().min(0).max(100).default(0),
  maxActiveBacklogs: z.coerce.number().int().min(0).default(0),
  allowedStudentTypes: z.array(StudentTypeSchema).min(1, 'Select at least one student track'),
  allowedDepartments: z.array(z.string()).min(1, 'Select at least one department'),
});

export const DriveUpdateSchema = DriveCreateSchema.partial();

// Application Status Update Schemas
export const UpdateApplicationStatusSchema = z.object({
  status: ApplicationStatusSchema,
  notes: z.string().max(500).optional().nullable(),
});

export const BulkUpdateApplicationsSchema = z.object({
  applicationIds: z.array(z.string().uuid('Invalid application ID')).min(1, 'Provide at least one application ID'),
  status: ApplicationStatusSchema,
  notes: z.string().max(500).optional().nullable(),
});

// Profile Verification Schema
export const VerifyStudentProfileSchema = z.object({
  status: VerificationStatusSchema,
  remarks: z.string().max(500).optional().nullable(),
});

