/**
 * User roles within the Placement Portal
 */
export enum UserRole {
  STUDENT = 'STUDENT',
  TPO = 'TPO',
}

/**
 * Type of student admission / academic path
 */
export enum StudentType {
  REGULAR = 'REGULAR',
  D2D = 'D2D', // Diploma to Degree (lateral entry)
}

/**
 * Lifecycle status of a student profile
 * Once LOCKED, server-side business rules prevent student edits.
 */
export enum ProfileStatus {
  DRAFT = 'DRAFT',
  LOCKED = 'LOCKED',
}

/**
 * Verification state awarded by Central TPO
 */
export enum VerificationStatus {
  PENDING = 'PENDING',
  VERIFIED = 'VERIFIED',
  REJECTED = 'REJECTED',
}

/**
 * Status of an application submitted to a recruitment drive
 */
export enum ApplicationStatus {
  APPLIED = 'APPLIED',
  UNDER_REVIEW = 'UNDER_REVIEW',
  SHORTLISTED = 'SHORTLISTED',
  REJECTED = 'REJECTED',
  SELECTED = 'SELECTED',
}

/**
 * Recruitment drive nature
 */
export enum DriveType {
  FULL_TIME = 'FULL_TIME',
  INTERNSHIP = 'INTERNSHIP',
  INTERN_PLUS_FTE = 'INTERN_PLUS_FTE',
}

/**
 * Drive operational status
 */
export enum DriveStatus {
  UPCOMING = 'UPCOMING',
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

/**
 * Communication delivery channels
 */
export enum NotificationChannel {
  IN_APP = 'IN_APP',
  EMAIL = 'EMAIL',
  SMS = 'SMS',
  WHATSAPP = 'WHATSAPP',
}

/**
 * External notification delivery status
 */
export enum NotificationDeliveryStatus {
  PENDING = 'PENDING',
  SENT = 'SENT',
  FAILED = 'FAILED',
}

