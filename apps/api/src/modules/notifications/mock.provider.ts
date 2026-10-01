import { INotificationProvider, EmailPayload, SmsPayload, NotificationResult } from './provider.interface';

export interface RecordedEmail extends EmailPayload {
  id: string;
  timestamp: Date;
}

export interface RecordedSms extends SmsPayload {
  id: string;
  timestamp: Date;
}

export class MockNotificationProvider implements INotificationProvider {
  readonly name = 'MockProvider';

  private sentEmails: RecordedEmail[] = [];
  private sentSms: RecordedSms[] = [];
  private failNextEmail = false;
  private failNextSms = false;

  async sendEmail(payload: EmailPayload): Promise<NotificationResult> {
    const timestamp = new Date();
    const id = `mock-email-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    if (this.failNextEmail) {
      this.failNextEmail = false;
      console.warn(`[MOCK EMAIL DISPATCHER] Simulated failure for: ${payload.to}`);
      return {
        success: false,
        error: 'Simulated mock SMTP gateway error (503 Service Unavailable)',
        timestamp,
      };
    }

    const recorded: RecordedEmail = {
      ...payload,
      id,
      timestamp,
    };
    this.sentEmails.push(recorded);

    console.log(
      `[MOCK EMAIL DISPATCHER] ✉️ Sent email to "${payload.to}" | Subject: "${payload.subject}" [ID: ${id}]`
    );

    return {
      success: true,
      messageId: id,
      timestamp,
    };
  }

  async sendSms(payload: SmsPayload): Promise<NotificationResult> {
    const timestamp = new Date();
    const id = `mock-sms-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    if (this.failNextSms) {
      this.failNextSms = false;
      console.warn(`[MOCK SMS DISPATCHER] Simulated failure for: ${payload.to}`);
      return {
        success: false,
        error: 'Simulated mock SMS gateway error',
        timestamp,
      };
    }

    const recorded: RecordedSms = {
      ...payload,
      id,
      timestamp,
    };
    this.sentSms.push(recorded);

    console.log(
      `[MOCK SMS DISPATCHER] 📱 Sent SMS to "${payload.to}" | Message: "${payload.message}" [ID: ${id}]`
    );

    return {
      success: true,
      messageId: id,
      timestamp,
    };
  }

  // Inspection helpers for automated test assertions
  getSentEmails(): RecordedEmail[] {
    return [...this.sentEmails];
  }

  getSentSms(): RecordedSms[] {
    return [...this.sentSms];
  }

  getLastEmail(): RecordedEmail | undefined {
    return this.sentEmails[this.sentEmails.length - 1];
  }

  getLastSms(): RecordedSms | undefined {
    return this.sentSms[this.sentSms.length - 1];
  }

  getEmailsForRecipient(to: string): RecordedEmail[] {
    return this.sentEmails.filter((e) => e.to.toLowerCase() === to.toLowerCase());
  }

  clear(): void {
    this.sentEmails = [];
    this.sentSms = [];
    this.failNextEmail = false;
    this.failNextSms = false;
  }

  simulateFailureNextEmail(): void {
    this.failNextEmail = true;
  }

  simulateFailureNextSms(): void {
    this.failNextSms = true;
  }
}

export const mockNotificationProvider = new MockNotificationProvider();
