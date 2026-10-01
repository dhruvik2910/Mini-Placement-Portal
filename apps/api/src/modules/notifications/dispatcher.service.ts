import { prisma } from '../../config/database';
import {
  NotificationChannel,
  NotificationDeliveryStatus,
  VerificationStatus,
  ApplicationStatus,
} from '@placement/shared';
import { INotificationProvider } from './provider.interface';
import { mockNotificationProvider } from './mock.provider';
import { SmtpNotificationProvider } from './smtp.provider';
import {
  getProfileVerifiedEmail,
  getProfileRejectedEmail,
  getApplicantShortlistedEmail,
  getApplicantSelectedEmail,
  getApplicantRejectedEmail,
} from './templates';

export interface DispatchOptions {
  studentProfileId?: string;
  recipientEmail: string;
  recipientPhone?: string | null;
  template: string;
  subject: string;
  bodyText: string;
  bodyHtml: string;
  idempotencyKey?: string;
  channel?: NotificationChannel;
  inAppNotification?: {
    title: string;
    message: string;
    type?: string;
  };
}

export class NotificationDispatcherService {
  private provider: INotificationProvider;

  constructor() {
    // Select provider based on configuration
    const isMock =
      process.env.NODE_ENV === 'test' ||
      process.env.NOTIFICATION_PROVIDER === 'mock' ||
      (!process.env.SMTP_HOST && !process.env.SENDGRID_API_KEY);

    this.provider = isMock ? mockNotificationProvider : new SmtpNotificationProvider();
    console.log(`[NOTIFICATION DISPATCHER] Initialized with provider: ${this.provider.name}`);
  }

  /**
   * Get active provider (useful for test assertions or switching)
   */
  getProvider(): INotificationProvider {
    return this.provider;
  }

  setProvider(provider: INotificationProvider): void {
    this.provider = provider;
  }

  /**
   * Centralized dispatch with idempotency protection and delivery logging
   */
  async dispatch(options: DispatchOptions): Promise<{
    delivered: boolean;
    channel: NotificationChannel;
    status: NotificationDeliveryStatus;
    idempotencyHit?: boolean;
    error?: string;
  }> {
    const channel = options.channel || NotificationChannel.EMAIL;

    // 1. Idempotency Check (Duplicate Protection)
    if (options.idempotencyKey) {
      const existing = await prisma.notificationDeliveryLog.findUnique({
        where: { idempotencyKey: options.idempotencyKey },
      });

      if (existing && existing.status === NotificationDeliveryStatus.SENT) {
        console.log(
          `[NOTIFICATION DISPATCHER] 🛡️ Idempotency hit: skipping duplicate dispatch for key "${options.idempotencyKey}"`
        );
        return {
          delivered: true,
          channel: existing.channel as NotificationChannel,
          status: existing.status as NotificationDeliveryStatus,
          idempotencyHit: true,
        };
      }
    }

    // 2. Dispatch via active provider
    let isSuccess = false;
    let providerError: string | undefined;

    try {
      if (channel === NotificationChannel.EMAIL) {
        const result = await this.provider.sendEmail({
          to: options.recipientEmail,
          subject: options.subject,
          text: options.bodyText,
          html: options.bodyHtml,
        });
        isSuccess = result.success;
        providerError = result.error;
      } else if (channel === NotificationChannel.SMS && options.recipientPhone) {
        const result = await this.provider.sendSms({
          to: options.recipientPhone,
          message: options.bodyText,
        });
        isSuccess = result.success;
        providerError = result.error;
      }
    } catch (err: any) {
      isSuccess = false;
      providerError = err?.message || 'Unexpected provider network exception';
      console.error(`[NOTIFICATION DISPATCHER] Provider dispatch error:`, err);
    }

    const deliveryStatus = isSuccess
      ? NotificationDeliveryStatus.SENT
      : NotificationDeliveryStatus.FAILED;

    // Sanitize non-ASCII characters for DB collation safety
    const cleanSubject = options.subject.replace(/[^\x00-\x7F]/g, '');
    const cleanBody = options.bodyText.replace(/[^\x00-\x7F]/g, '');

    // 3. Record in Delivery Log (Audit Trail)
    try {
      if (options.idempotencyKey) {
        await prisma.notificationDeliveryLog.upsert({
          where: { idempotencyKey: options.idempotencyKey },
          create: {
            studentProfileId: options.studentProfileId || null,
            recipientEmail: options.recipientEmail,
            recipientPhone: options.recipientPhone || null,
            channel,
            status: deliveryStatus,
            template: options.template,
            subject: cleanSubject,
            body: cleanBody,
            idempotencyKey: options.idempotencyKey,
            error: providerError || null,
            sentAt: isSuccess ? new Date() : null,
          },
          update: {
            status: deliveryStatus,
            error: providerError || null,
            sentAt: isSuccess ? new Date() : null,
          },
        });
      } else {
        await prisma.notificationDeliveryLog.create({
          data: {
            studentProfileId: options.studentProfileId || null,
            recipientEmail: options.recipientEmail,
            recipientPhone: options.recipientPhone || null,
            channel,
            status: deliveryStatus,
            template: options.template,
            subject: cleanSubject,
            body: cleanBody,
            error: providerError || null,
            sentAt: isSuccess ? new Date() : null,
          },
        });
      }
    } catch (dbErr) {
      console.error(`[NOTIFICATION DISPATCHER] Failed to record delivery log:`, dbErr);
    }

    // 4. In-App Notification (Dual-channel)
    if (options.inAppNotification && options.studentProfileId) {
      try {
        await prisma.notification.create({
          data: {
            studentProfileId: options.studentProfileId,
            title: options.inAppNotification.title,
            message: options.inAppNotification.message,
            type: options.inAppNotification.type || 'INFO',
          },
        });
      } catch (inAppErr) {
        console.error(`[NOTIFICATION DISPATCHER] Failed to emit in-app notification:`, inAppErr);
      }
    }

    return {
      delivered: isSuccess,
      channel,
      status: deliveryStatus,
      error: providerError,
    };
  }

  /**
   * High-Level Trigger: Student Profile Verification Status Change
   */
  async dispatchProfileVerification(
    studentProfileId: string,
    status: VerificationStatus,
    remarks?: string | null
  ): Promise<void> {
    try {
      const profile = await prisma.studentProfile.findUnique({
        where: { id: studentProfileId },
        include: { user: true },
      });

      if (!profile || !profile.user) return;

      const email = profile.user.email;
      const phone = profile.phone;
      const hourKey = new Date().toISOString().slice(0, 13);
      const idempotencyKey = `verify-profile-${studentProfileId}-${status}-${hourKey}`;

      if (status === VerificationStatus.VERIFIED) {
        const { subject, text, html } = getProfileVerifiedEmail({
          firstName: profile.firstName,
          enrollmentNumber: profile.enrollmentNumber,
          department: profile.department,
        });

        await this.dispatch({
          studentProfileId,
          recipientEmail: email,
          recipientPhone: phone,
          template: 'PROFILE_VERIFIED',
          subject,
          bodyText: text,
          bodyHtml: html,
          idempotencyKey,
        });
      } else if (status === VerificationStatus.REJECTED) {
        const { subject, text, html } = getProfileRejectedEmail({
          firstName: profile.firstName,
          enrollmentNumber: profile.enrollmentNumber,
          remarks: remarks || undefined,
        });

        await this.dispatch({
          studentProfileId,
          recipientEmail: email,
          recipientPhone: phone,
          template: 'PROFILE_REJECTED',
          subject,
          bodyText: text,
          bodyHtml: html,
          idempotencyKey,
        });
      }
    } catch (err) {
      console.error(`[NOTIFICATION DISPATCHER] Profile verification dispatch failed:`, err);
    }
  }

  /**
   * High-Level Trigger: Single Application Status Transition
   */
  async dispatchApplicationStatus(
    applicationId: string,
    newStatus: ApplicationStatus,
    notes?: string | null
  ): Promise<void> {
    try {
      console.log(`[DISPATCHER] dispatchApplicationStatus called for ${applicationId}, newStatus: ${newStatus}`);
      const application = await prisma.application.findUnique({
        where: { id: applicationId },
        include: {
          studentProfile: { include: { user: true } },
          recruitmentDrive: { include: { company: true } },
        },
      });

      if (!application) {
        console.warn(`[DISPATCHER] Application ${applicationId} not found`);
        return;
      }

      if (!application.studentProfile || !application.studentProfile.user) {
        console.warn(`[DISPATCHER] StudentProfile or User missing for app ${applicationId}`);
        return;
      }

      console.log(`[DISPATCHER] Found app for ${application.studentProfile.user.email}, proceeding with status ${newStatus}`);

      const profile = application.studentProfile;
      const drive = application.recruitmentDrive;
      const company = drive.company;
      const email = profile.user.email;
      const phone = profile.phone;
      const idempotencyKey = `app-status-${applicationId}-${newStatus}`;

      if (newStatus === ApplicationStatus.SHORTLISTED) {
        const { subject, text, html } = getApplicantShortlistedEmail({
          firstName: profile.firstName,
          enrollmentNumber: profile.enrollmentNumber,
          companyName: company.name,
          jobRole: drive.jobRole,
          packageLpa: drive.packageLpa ? Number(drive.packageLpa) : null,
        });

        await this.dispatch({
          studentProfileId: profile.id,
          recipientEmail: email,
          recipientPhone: phone,
          template: 'APPLICANT_SHORTLISTED',
          subject,
          bodyText: text,
          bodyHtml: html,
          idempotencyKey,
        });
      } else if (newStatus === ApplicationStatus.SELECTED) {
        const { subject, text, html } = getApplicantSelectedEmail({
          firstName: profile.firstName,
          enrollmentNumber: profile.enrollmentNumber,
          companyName: company.name,
          jobRole: drive.jobRole,
          packageLpa: drive.packageLpa ? Number(drive.packageLpa) : null,
        });

        await this.dispatch({
          studentProfileId: profile.id,
          recipientEmail: email,
          recipientPhone: phone,
          template: 'APPLICANT_SELECTED',
          subject,
          bodyText: text,
          bodyHtml: html,
          idempotencyKey,
        });
      } else if (newStatus === ApplicationStatus.REJECTED) {
        const { subject, text, html } = getApplicantRejectedEmail({
          firstName: profile.firstName,
          enrollmentNumber: profile.enrollmentNumber,
          companyName: company.name,
          jobRole: drive.jobRole,
        });

        await this.dispatch({
          studentProfileId: profile.id,
          recipientEmail: email,
          recipientPhone: phone,
          template: 'APPLICANT_REJECTED',
          subject,
          bodyText: text,
          bodyHtml: html,
          idempotencyKey,
        });
      }
    } catch (err) {
      console.error(`[NOTIFICATION DISPATCHER] Application status dispatch failed:`, err);
    }
  }

  /**
   * High-Level Trigger: Bulk Application Status Updates
   */
  async dispatchBulkApplicationStatus(
    applicationIds: string[],
    newStatus: ApplicationStatus,
    notes?: string | null
  ): Promise<void> {
    for (const appId of applicationIds) {
      await this.dispatchApplicationStatus(appId, newStatus, notes);
    }
  }

  /**
   * Query Delivery Logs for TPO Audit & Reporting
   */
  async getDeliveryLogs(filter?: {
    template?: string;
    status?: NotificationDeliveryStatus;
    recipientEmail?: string;
    limit?: number;
    offset?: number;
  }) {
    const where: any = {};
    if (filter?.template) where.template = filter.template;
    if (filter?.status) where.status = filter.status;
    if (filter?.recipientEmail) {
      where.recipientEmail = { contains: filter.recipientEmail, mode: 'insensitive' };
    }

    const limit = filter?.limit || 50;
    const offset = filter?.offset || 0;

    const [logs, total] = await Promise.all([
      prisma.notificationDeliveryLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.notificationDeliveryLog.count({ where }),
    ]);

    return { logs, total, limit, offset };
  }
}

export const notificationDispatcher = new NotificationDispatcherService();
