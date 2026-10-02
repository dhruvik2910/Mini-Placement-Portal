import {
  UserRole,
  StudentType,
  ProfileStatus,
  VerificationStatus,
  ApplicationStatus,
  DriveType,
  DriveStatus,
  NotificationChannel,
  NotificationDeliveryStatus,
} from './enums';

/**
 * Standard API Success Response Envelope
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data: T;
}

/**
 * Standard API Error Detail
 */
export interface ApiErrorDetail {
  field?: string;
  message: string;
}

/**
 * Standard API Error Response Envelope
 */
export interface ApiErrorResponse {
  success: false;
  statusCode: number;
  message: string;
  errors?: ApiErrorDetail[];
  timestamp: string;
}

/**
 * API Health Check Payload
 */
export interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  uptime: number;
  environment: string;
  database?: {
    connected: boolean;
    latencyMs?: number;
  };
}

/**
 * Subject-level breakdown for 10th grade marks
 */
export interface SubjectWiseMark {
  subject: string;
  marksObtained: number;
  maxMarks: number;
}

/**
 * Skills category breakdown
 */
export interface StudentSkills {
  technical: string[];
  soft: string[];
  languages: string[];
  tools: string[];
}

/**
 * User representation (without credentials)
 */
export interface UserDto {
  id: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Tenth Marks representation
 */
export interface TenthMarksDto {
  id: string;
  studentProfileId: string;
  board: string;
  schoolName: string;
  passingYear: number;
  marksObtained: number;
  totalMarks: number;
  percentage: number;
  subjectWiseMarks: SubjectWiseMark[];
  createdAt: string;
  updatedAt: string;
}

/**
 * 12th Details for Regular students
 */
export interface TwelfthDetailsDto {
  id: string;
  studentProfileId: string;
  board: string;
  schoolName: string;
  passingYear: number;
  stream: string;
  marksObtained: number;
  totalMarks: number;
  percentage: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Diploma details for D2D (Diploma to Degree) lateral entry students
 */
export interface D2DDetailsDto {
  id: string;
  studentProfileId: string;
  diplomaCollege: string;
  diplomaUniversity: string;
  diplomaBranch: string;
  passingYear: number;
  diplomaCgpa: number;
  diplomaPercentage?: number | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Student Profile representation
 */
export interface StudentProfileDto {
  id: string;
  userId: string;
  studentType: StudentType;
  enrollmentNumber: string;
  firstName: string;
  middleName?: string | null;
  lastName: string;
  department: string;
  batchYear: number;
  currentSemester: number;
  currentCgpa: number;
  activeBacklogs: number;
  totalBacklogs: number;
  phone?: string | null;
  dateOfBirth?: string | null;
  gender?: string | null;
  address?: string | null;
  skills?: StudentSkills | null;
  resumeUrl?: string | null;
  resumeName?: string | null;
  resumeUpdatedAt?: string | null;
  status: ProfileStatus;
  lockedAt?: string | null;
  verificationStatus: VerificationStatus;
  tenthMarks?: TenthMarksDto | null;
  twelfthDetails?: TwelfthDetailsDto | null;
  d2dDetails?: D2DDetailsDto | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Central TPO Officer Profile representation
 */
export interface TpoProfileDto {
  id: string;
  userId: string;
  fullName: string;
  designation: string;
  department?: string | null;
  phone?: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Company representation
 */
export interface CompanyDto {
  id: string;
  name: string;
  website?: string | null;
  industry?: string | null;
  description?: string | null;
  logoUrl?: string | null;
  contactPerson?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Eligibility criteria model embedded in recruitment drives
 */
export interface EligibilityCriteria {
  minCgpa: number;
  minTenthPercentage: number;
  minTwelfthOrDiplomaPercentage: number;
  maxActiveBacklogs: number;
  allowedStudentTypes: StudentType[];
  allowedDepartments: string[];
}

/**
 * Recruitment Drive representation
 */
export interface RecruitmentDriveDto {
  id: string;
  companyId: string;
  company?: CompanyDto;
  title: string;
  jobRole: string;
  driveType: DriveType;
  status: DriveStatus;
  packageLpa?: number | null;
  stipendMonthly?: number | null;
  location?: string | null;
  description?: string | null;
  deadline: string;
  driveDate?: string | null;
  requiredSkills: string[];
  eligibility: EligibilityCriteria;
  // Computed dynamically for authenticated student
  isEligible?: boolean;
  ineligibilityReasons?: string[];
  hasApplied?: boolean;
  applicationId?: string;
  isClosed?: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Placement Application representation
 */
export interface ApplicationDto {
  id: string;
  studentProfileId: string;
  recruitmentDriveId: string;
  status: ApplicationStatus;
  appliedAt: string;
  notes?: string | null;
  updatedAt: string;
  recruitmentDrive?: RecruitmentDriveDto;
  studentProfile?: StudentProfileDto;
}

/**
 * Audit/Verification record
 */
export interface VerificationDto {
  id: string;
  studentProfileId: string;
  verifiedByUserId: string;
  status: VerificationStatus;
  remarks?: string | null;
  verifiedAt: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Student notification / activity record
 */
export interface NotificationDto {
  id: string;
  studentProfileId: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

/**
 * Auth Login/Register Response
 */
export interface AuthResponse {
  token: string;
  user: UserDto & {
    studentProfile?: StudentProfileDto | null;
    tpoProfile?: TpoProfileDto | null;
  };
}

// ==============================================================================
// TPO Analytics & Dashboard Types
// ==============================================================================

export interface TpoActivityItem {
  id: string;
  type: string;
  title: string;
  description: string;
  timestamp: string;
}

export interface TpoDashboardStats {
  totalStudents: number;
  completeProfiles: number;
  incompleteProfiles: number;
  lockedProfiles: number;
  totalCompanies: number;
  activeDrives: number;
  totalApplications: number;
  shortlistedStudents: number;
  selectedStudents: number;
  applicationsByStatus: {
    applied: number;
    underReview: number;
    shortlisted: number;
    selected: number;
    rejected: number;
  };
  studentsByDepartment: Record<string, number>;
  studentsByType: {
    regular: number;
    d2d: number;
  };
  recentActivity: TpoActivityItem[];
}

export interface EligibilityPreviewStudent {
  student: StudentProfileDto;
  isEligible: boolean;
  reasons: string[];
}

export interface EligibilityPreviewResult {
  totalStudents: number;
  eligibleCount: number;
  ineligibleCount: number;
  eligibilityPercentage: number;
  students: EligibilityPreviewStudent[];
}

export interface TpoAnalyticsDto {
  totalStudents: number;
  placedStudents: number;
  placementRate: number;
  averagePackageLpa: number;
  highestPackageLpa: number;
  studentsByType: {
    regular: number;
    d2d: number;
  };
  cgpaDistribution: Array<{
    range: string;
    count: number;
  }>;
  backlogDistribution: Array<{
    range: string;
    count: number;
  }>;
  departmentStats: Array<{
    department: string;
    total: number;
    placed: number;
    placementRate: number;
    avgCgpa: number;
  }>;
  companyStats: Array<{
    companyName: string;
    drivesCount: number;
    applicationsCount: number;
    selectionsCount: number;
  }>;
  statusFunnel: {
    applied: number;
    shortlisted: number;
    selected: number;
    rejected: number;
  };
}

/**
 * Audit log entry for outbox notifications (Email / SMS / In-App)
 */
export interface NotificationDeliveryLogDto {
  id: string;
  studentProfileId?: string | null;
  recipientEmail?: string | null;
  recipientPhone?: string | null;
  channel: NotificationChannel;
  status: NotificationDeliveryStatus;
  template: string;
  subject: string;
  body: string;
  idempotencyKey?: string | null;
  error?: string | null;
  sentAt?: string | null;
  createdAt: string;
}

/**
 * Payload for dispatching instant interview alerts across WhatsApp, SMS, and Email
 */
export interface SendInterviewAlertDto {
  applicationIds: string[];
  roundName: string;
  scheduleTime: string;
  venue: string;
  channels: NotificationChannel[];
  customNote?: string;
}

/**
 * Result returned after dispatching instant interview alerts
 */
export interface SendInterviewAlertResultDto {
  success: boolean;
  dispatchedCount: number;
  channelsUsed: NotificationChannel[];
  timestamp: string;
  details?: Array<{
    applicationId: string;
    studentName: string;
    enrollmentNumber: string;
    channels: Array<{
      channel: NotificationChannel;
      success: boolean;
      messageId?: string;
      error?: string;
    }>;
  }>;
}



