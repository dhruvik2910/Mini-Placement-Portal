
import {
  INotificationProvider,
  EmailPayload,
  SmsPayload,
  WhatsAppPayload,
  NotificationResult,
} from './provider.interface';

export interface RecordedEmail extends EmailPayload {
  id: string;
  timestamp: Date;
}

export interface RecordedSms extends SmsPayload {
  id: string;
  timestamp: Date;
}

export interface RecordedWhatsApp extends WhatsAppPayload {
  id: string;
  timestamp: Date;
}

export class MockNotificationProvider implements INotificationProvider {
  readonly name = 'MockNotificationGateway';

  private sentEmails: RecordedEmail[] = [];
  private sentSms: RecordedSms[] = [];
  private sentWhatsApp: RecordedWhatsApp[] = [];
  private failNextEmail = false;
  private failNextSms = false;
  private failNextWhatsApp = false;

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
        provider: this.name,
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
      provider: this.name,
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
        provider: this.name,
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
      provider: this.name,
    };
  }

  async sendWhatsApp(payload: WhatsAppPayload): Promise<NotificationResult> {
    const timestamp = new Date();
    const id = `mock-wa-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    if (this.failNextWhatsApp) {
      this.failNextWhatsApp = false;
      console.warn(`[MOCK WHATSAPP DISPATCHER] Simulated failure for: ${payload.to}`);
      return {
        success: false,
        error: 'Simulated mock WhatsApp Cloud API gateway error',
        timestamp,
        provider: this.name,
      };
    }

    const recorded: RecordedWhatsApp = {
      ...payload,
      id,
      timestamp,
    };
    this.sentWhatsApp.push(recorded);

    console.log(
      `[MOCK WHATSAPP DISPATCHER] 💬 Sent WhatsApp Alert to "${payload.to}" | Message: "${payload.message}" [ID: ${id}]`
    );

    return {
      success: true,
      messageId: id,
      timestamp,
      provider: this.name,
    };
  }

  // Inspection helpers for automated test assertions
  getSentEmails(): RecordedEmail[] {
    return [...this.sentEmails];
  }

  getSentSms(): RecordedSms[] {
    return [...this.sentSms];
  }

  getSentWhatsApp(): RecordedWhatsApp[] {
    return [...this.sentWhatsApp];
  }

  getLastEmail(): RecordedEmail | undefined {
    return this.sentEmails[this.sentEmails.length - 1];
  }

  getLastSms(): RecordedSms | undefined {
    return this.sentSms[this.sentSms.length - 1];
  }

  getLastWhatsApp(): RecordedWhatsApp | undefined {
    return this.sentWhatsApp[this.sentWhatsApp.length - 1];
  }

  getEmailsForRecipient(to: string): RecordedEmail[] {
    return this.sentEmails.filter((e) => e.to.toLowerCase() === to.toLowerCase());
  }

  clear(): void {
    this.sentEmails = [];
    this.sentSms = [];
    this.sentWhatsApp = [];
    this.failNextEmail = false;
    this.failNextSms = false;
    this.failNextWhatsApp = false;
  }

  simulateFailureNextEmail(): void {
    this.failNextEmail = true;
  }

  simulateFailureNextSms(): void {
    this.failNextSms = true;
  }

  simulateFailureNextWhatsApp(): void {
    this.failNextWhatsApp = true;
  }
}

export const mockNotificationProvider = new MockNotificationProvider();

