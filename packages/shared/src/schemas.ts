import { z } from 'zod';
import {
  UserRole,
  StudentType,
  ProfileStatus,
  VerificationStatus,
  ApplicationStatus,
  DriveType,
  DriveStatus,
  NotificationChannel,
  NotificationGatewayProvider,
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

export const TenthMarksSchema = z.object({
  board: z.string().min(2, 'Board name is required').trim(),
  schoolName: z.string().min(2, 'School name is required').trim(),
  passingYear: z.number().int().min(2000).max(2035),
  marksObtained: z.number().min(0),
  totalMarks: z.number().positive(),
  percentage: z.number().min(0).max(100).optional(),
  subjectWiseMarks: z.array(SubjectWiseMarkSchema).default([]),
});

export const TwelfthMarksSchema = z.object({
  board: z.string().min(2, 'Board name is required').trim(),
  schoolName: z.string().min(2, 'School/Junior College name is required').trim(),
  stream: z.string().min(2, 'Stream is required (e.g. Science, General)').trim(),
  passingYear: z.number().int().min(2000).max(2035),
  marksObtained: z.number().min(0),
  totalMarks: z.number().positive(),
  percentage: z.number().min(0).max(100).optional(),
  subjectWiseMarks: z.array(SubjectWiseMarkSchema).default([]),
});

export const DiplomaSemesterSchema = z.object({
  semester: z.number().int().min(1).max(8),
  spi: z.number().min(0).max(10),
  cpi: z.number().min(0).max(10),
  activeBacklogs: z.number().int().min(0).default(0),
  clearedBacklogs: z.number().int().min(0).default(0),
});

export const DiplomaMarksSchema = z.object({
  diplomaCollege: z.string().min(2, 'Diploma college name is required').trim(),
  diplomaUniversity: z.string().min(2, 'University/Board name is required (e.g. GTU, TEB)').trim(),
  diplomaBranch: z.string().min(2, 'Diploma branch name is required').trim(),
  passingYear: z.number().int().min(2000).max(2035),
  diplomaCgpa: z.number().min(0).max(10),
  diplomaPercentage: z.number().min(0).max(100).optional().nullable(),
  semesterBreakdown: z.array(DiplomaSemesterSchema).default([]),
});

export const DegreeSemesterSchema = z.object({
  semester: z.number().int().min(1).max(8),
  spi: z.number().min(0).max(10),
  cpi: z.number().min(0).max(10),
  activeBacklogs: z.number().int().min(0).default(0),
  clearedBacklogs: z.number().int().min(0).default(0),
});

export const DegreeSemesterBreakdownSchema = z.object({
  semesters: z.array(DegreeSemesterSchema).min(1, 'Provide at least one semester entry'),
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
  firstName: z.string().min(2, 'First name is required').trim(),
  middleName: z.string().trim().optional().nullable(),
  lastName: z.string().min(2, 'Last name is required').trim(),
  enrollmentNumber: z.string().min(6, 'Valid GTU enrollment number is required').trim().toUpperCase(),
  department: z.string().min(2, 'Department is required').trim(),
  studentType: StudentTypeSchema,
  phone: z.string().trim().optional().default('9876543210'),
  currentSemester: z.number().int().min(1).max(8).optional().default(7),
  batchYear: z.number().int().min(2020).max(2035).default(2025),
});

export const LoginSchema = z.object({
  email: z.string().email('Invalid email address').trim().toLowerCase(),
  password: z.string().min(1, 'Password is required'),
});

// Student Profile Edit Schemas
export const StudentProfileUpdateSchema = z.object({
  firstName: z.string().optional(),
  middleName: z.string().optional().nullable(),
  lastName: z.string().optional(),
  phone: z.string().min(10, 'Valid 10-digit phone number is required').trim().optional().nullable(),
  dateOfBirth: z.string().optional().nullable(),
  address: z.string().trim().optional().nullable(),
  gender: z.string().optional().nullable(),
  department: z.string().optional(),
  currentSemester: z.number().int().min(1).max(8).optional(),
  batchYear: z.number().int().min(2020).max(2035).optional(),
  currentCgpa: z.number().min(0).max(10).optional().nullable(),
  activeBacklogs: z.number().int().min(0).default(0),
  totalBacklogs: z.number().int().min(0).default(0),
  totalBacklogsHistory: z.number().int().min(0).default(0),
  skills: StudentSkillsSchema.optional().nullable(),
  linkedinUrl: z.string().url('Invalid LinkedIn URL').optional().nullable().or(z.literal('')),
  githubUrl: z.string().url('Invalid GitHub URL').optional().nullable().or(z.literal('')),
  tenthMarks: TenthMarksSchema,
  twelfthDetails: TwelfthMarksSchema.optional().nullable(),
  d2dDetails: DiplomaMarksSchema.optional().nullable(),
});

export const UpdateProfileSchema = StudentProfileUpdateSchema;

export const ApplyDriveSchema = z.object({
  recruitmentDriveId: z.string().uuid('Invalid recruitment drive ID'),
});

// Company Schemas
export const CompanyCreateSchema = z.object({
  name: z.string().min(2, 'Company name is required').trim(),
  website: z.string().url('Invalid website URL').trim().optional().nullable().or(z.literal('')),
  industry: z.string().min(2, 'Industry type is required').trim(),
  description: z.string().trim().optional().nullable(),
  logoUrl: z.string().url('Invalid logo URL').trim().optional().nullable().or(z.literal('')),
  contactPerson: z.string().trim().optional().nullable(),
  contactEmail: z.string().email('Invalid contact email').trim().optional().nullable().or(z.literal('')),
  contactPhone: z.string().trim().optional().nullable(),
});

export const CompanyUpdateSchema = CompanyCreateSchema.partial();

// Drive Schemas
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

// Notification Gateway Schemas
export const NotificationChannelSchema = z.nativeEnum(NotificationChannel);
export const NotificationGatewayProviderSchema = z.nativeEnum(NotificationGatewayProvider);

export const SendInterviewAlertSchema = z.object({
  applicationIds: z.array(z.string().uuid('Invalid application ID')).min(1, 'Select at least one applicant'),
  roundName: z.string().min(2, 'Round name is required').trim(),
  scheduleTime: z.string().min(2, 'Interview date & time is required').trim(),
  venue: z.string().min(2, 'Venue is required').trim(),
  channels: z.array(NotificationChannelSchema).min(1, 'Select at least one delivery channel'),
  customNote: z.string().max(500).optional().nullable(),
});

export const TestGatewaySchema = z.object({
  channel: NotificationChannelSchema,
  recipient: z.string().min(3, 'Recipient phone or email is required').trim(),
  message: z.string().optional(),
});
