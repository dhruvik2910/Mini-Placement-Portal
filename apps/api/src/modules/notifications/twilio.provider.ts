import {
  INotificationProvider,
  EmailPayload,
  SmsPayload,
  WhatsAppPayload,
  NotificationResult,
} from './provider.interface';

/**
 * Standardize phone number to international E.164 format.
 * Defaults to India (+91) for standard 10-digit Indian numbers.
 */
export function formatPhoneNumberE164(phone: string, defaultCountryCode = '+91'): string {
  const cleaned = phone.replace(/[^0-9+]/g, '');
  if (cleaned.startsWith('+')) {
    return cleaned;
  }
  if (cleaned.length === 10) {
    return `${defaultCountryCode}${cleaned}`;
  }
  if (cleaned.length === 12 && cleaned.startsWith('91')) {
    return `+${cleaned}`;
  }
  return `+${cleaned}`;
}

export class TwilioNotificationProvider implements INotificationProvider {
  readonly name = 'TwilioProvider';

  private accountSid: string;
  private authToken: string;
  private smsFromNumber: string;
  private whatsAppFromNumber: string;

  constructor(options?: {
    accountSid?: string;
    authToken?: string;
    smsFromNumber?: string;
    whatsAppFromNumber?: string;
  }) {
    this.accountSid = options?.accountSid || process.env.TWILIO_ACCOUNT_SID || '';
    this.authToken = options?.authToken || process.env.TWILIO_AUTH_TOKEN || '';
    this.smsFromNumber =
      options?.smsFromNumber || process.env.TWILIO_PHONE_NUMBER || process.env.TWILIO_SMS_FROM || '';
    this.whatsAppFromNumber =
      options?.whatsAppFromNumber ||
      process.env.TWILIO_WHATSAPP_NUMBER ||
      process.env.TWILIO_WHATSAPP_FROM ||
      '+14155238886'; // Twilio default sandbox number
  }

  isConfigured(): boolean {
    return Boolean(this.accountSid && this.authToken);
  }

  async sendEmail(_payload: EmailPayload): Promise<NotificationResult> {
    return {
      success: false,
      error: 'Twilio provider does not handle direct email dispatch (use SendGrid/SMTP for email).',
      timestamp: new Date(),
    };
  }

  async sendSms(payload: SmsPayload): Promise<NotificationResult> {
    const timestamp = new Date();
    if (!this.isConfigured()) {
      return {
        success: false,
        error: 'Twilio provider not configured (TWILIO_ACCOUNT_SID or TWILIO_AUTH_TOKEN missing).',
        timestamp,
      };
    }

    const formattedTo = formatPhoneNumberE164(payload.to);
    const from = this.smsFromNumber;

    if (!from) {
      return {
        success: false,
        error: 'TWILIO_PHONE_NUMBER is not configured for SMS dispatch.',
        timestamp,
      };
    }

    try {
      const url = `https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}/Messages.json`;
      const params = new URLSearchParams();
      params.append('To', formattedTo);
      params.append('From', from);
      params.append('Body', payload.message);

      const authHeader = `Basic ${Buffer.from(`${this.accountSid}:${this.authToken}`).toString('base64')}`;

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: authHeader,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      });

      const data = (await res.json()) as { sid?: string; message?: string };

      if (!res.ok) {
        const errorMsg = data?.message || `Twilio SMS request failed with status ${res.status}`;
        console.error(`[TWILIO SMS] ❌ Error dispatching SMS to ${formattedTo}:`, errorMsg);
        return {
          success: false,
          error: errorMsg,
          timestamp,
        };
      }

      console.log(`[TWILIO SMS] 📱 SMS dispatched to ${formattedTo} [Twilio SID: ${data.sid}]`);
      return {
        success: true,
        messageId: data.sid,
        timestamp,
      };
    } catch (err: unknown) {
      console.error(`[TWILIO SMS] ❌ Network exception:`, err);
      const errorMsg = err instanceof Error ? err.message : 'Twilio network request error';
      return {
        success: false,
        error: errorMsg,
        timestamp,
      };
    }
  }

  async sendWhatsApp(payload: WhatsAppPayload): Promise<NotificationResult> {
    const timestamp = new Date();
    if (!this.isConfigured()) {
      return {
        success: false,
        error: 'Twilio provider not configured (TWILIO_ACCOUNT_SID or TWILIO_AUTH_TOKEN missing).',
        timestamp,
      };
    }

    const formattedTo = formatPhoneNumberE164(payload.to);
    const fromWhatsApp = this.whatsAppFromNumber.startsWith('whatsapp:')
      ? this.whatsAppFromNumber
      : `whatsapp:${this.whatsAppFromNumber}`;
    const toWhatsApp = `whatsapp:${formattedTo}`;

    try {
      const url = `https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}/Messages.json`;
      const params = new URLSearchParams();
      params.append('To', toWhatsApp);
      params.append('From', fromWhatsApp);
      params.append('Body', payload.message);

      const authHeader = `Basic ${Buffer.from(`${this.accountSid}:${this.authToken}`).toString('base64')}`;

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: authHeader,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      });

      const data = (await res.json()) as { sid?: string; message?: string };

      if (!res.ok) {
        const errorMsg = data?.message || `Twilio WhatsApp request failed with status ${res.status}`;
        console.error(`[TWILIO WHATSAPP] ❌ Error dispatching WhatsApp to ${toWhatsApp}:`, errorMsg);
        return {
          success: false,
          error: errorMsg,
          timestamp,
        };
      }

      console.log(`[TWILIO WHATSAPP] 💬 WhatsApp message dispatched to ${toWhatsApp} [Twilio SID: ${data.sid}]`);
      return {
        success: true,
        messageId: data.sid,
        timestamp,
      };
    } catch (err: unknown) {
      console.error(`[TWILIO WHATSAPP] ❌ Network exception:`, err);
      const errorMsg = err instanceof Error ? err.message : 'Twilio WhatsApp network request error';
      return {
        success: false,
        error: errorMsg,
        timestamp,
      };
    }
  }
}
