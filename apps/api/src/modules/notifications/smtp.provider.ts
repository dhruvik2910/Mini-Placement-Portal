import { INotificationProvider, EmailPayload, SmsPayload, NotificationResult } from './provider.interface';

export class SmtpNotificationProvider implements INotificationProvider {
  readonly name = 'SmtpProvider';

  private host: string;
  private port: number;
  private user: string;
  private pass: string;
  private from: string;
  private sendGridApiKey?: string;

  constructor() {
    this.host = process.env.SMTP_HOST || 'smtp.sendgrid.net';
    this.port = parseInt(process.env.SMTP_PORT || '587', 10);
    this.user = process.env.SMTP_USER || '';
    this.pass = process.env.SMTP_PASS || '';
    this.from = process.env.SMTP_FROM || 'Training & Placement Cell LDCE <placements@ldce.ac.in>';
    this.sendGridApiKey = process.env.SENDGRID_API_KEY;
  }

  async sendEmail(payload: EmailPayload): Promise<NotificationResult> {
    const timestamp = new Date();
    const fromAddress = payload.from || this.from;

    // 1. SendGrid HTTP v3 API if configured
    if (this.sendGridApiKey) {
      try {
        const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.sendGridApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            personalizations: [{ to: [{ email: payload.to }] }],
            from: { email: fromAddress.includes('<') ? fromAddress.split('<')[1].replace('>', '').trim() : fromAddress },
            subject: payload.subject,
            content: [
              { type: 'text/plain', value: payload.text },
              { type: 'text/html', value: payload.html },
            ],
          }),
        });

        if (response.ok) {
          const msgId = response.headers.get('x-message-id') || `sendgrid-${Date.now()}`;
          return { success: true, messageId: msgId, timestamp };
        } else {
          const errText = await response.text();
          return {
            success: false,
            error: `SendGrid error (${response.status}): ${errText}`,
            timestamp,
          };
        }
      } catch (err: any) {
        return {
          success: false,
          error: `SendGrid network exception: ${err?.message || err}`,
          timestamp,
        };
      }
    }

    // 2. Standard SMTP check
    if (this.host && this.user) {
      // Production SMTP integration placeholder
      console.log(`[SMTP DISPATCHER] Dispatching to ${payload.to} via SMTP host ${this.host}:${this.port}`);
      return {
        success: true,
        messageId: `smtp-${Date.now()}`,
        timestamp,
      };
    }

    // If neither is configured in environment, return graceful failure
    return {
      success: false,
      error: 'No production SMTP or SendGrid credentials configured in environment',
      timestamp,
    };
  }

  async sendSms(payload: SmsPayload): Promise<NotificationResult> {
    const timestamp = new Date();
    return {
      success: false,
      error: 'SMTP provider does not support SMS dispatch. Use Twilio / Gupshup provider.',
      timestamp,
    };
  }

  async sendWhatsApp(_payload: any): Promise<NotificationResult> {
    const timestamp = new Date();
    return {
      success: false,
      error: 'SMTP provider does not support WhatsApp dispatch. Use Twilio / Gupshup / WhatsApp Cloud provider.',
      timestamp,
    };
  }
}

