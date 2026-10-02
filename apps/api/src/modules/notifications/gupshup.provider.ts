import {
  INotificationProvider,
  EmailPayload,
  SmsPayload,
  WhatsAppPayload,
  NotificationResult,
} from './provider.interface';
import { formatPhoneNumberE164 } from './twilio.provider';

export class GupshupNotificationProvider implements INotificationProvider {
  readonly name = 'GupshupProvider';

  private apiKey: string;
  private appName: string;
  private sourcePhone: string;

  constructor(options?: { apiKey?: string; appName?: string; sourcePhone?: string }) {
    this.apiKey = options?.apiKey || process.env.GUPSHUP_API_KEY || '';
    this.appName = options?.appName || process.env.GUPSHUP_APP_NAME || '';
    this.sourcePhone = options?.sourcePhone || process.env.GUPSHUP_SOURCE_PHONE || '917834811114';
  }

  isConfigured(): boolean {
    return Boolean(this.apiKey && this.appName);
  }

  async sendEmail(_payload: EmailPayload): Promise<NotificationResult> {
    return {
      success: false,
      error: 'Gupshup provider is an SMS & WhatsApp gateway only.',
      timestamp: new Date(),
    };
  }

  async sendSms(payload: SmsPayload): Promise<NotificationResult> {
    const timestamp = new Date();
    if (!this.isConfigured()) {
      return {
        success: false,
        error: 'Gupshup provider not configured (GUPSHUP_API_KEY or GUPSHUP_APP_NAME missing).',
        timestamp,
      };
    }

    const formattedTo = formatPhoneNumberE164(payload.to).replace('+', '');

    try {
      // Gupshup Enterprise SMS REST API endpoint
      const url = `https://enterprise.smsgupshup.com/GatewayAuth?method=sendMessage&send_to=${encodeURIComponent(
        formattedTo
      )}&msg=${encodeURIComponent(payload.message)}&userid=${encodeURIComponent(
        this.appName
      )}&password=${encodeURIComponent(this.apiKey)}&v=1.1&msg_type=TEXT&auth_scheme=PLAIN`;

      const res = await fetch(url, { method: 'GET' });
      const text = await res.text();

      if (!res.ok || text.toLowerCase().includes('error')) {
        console.error(`[GUPSHUP SMS] ❌ Failed to dispatch SMS to ${formattedTo}:`, text);
        return {
          success: false,
          error: `Gupshup SMS error: ${text}`,
          timestamp,
        };
      }

      console.log(`[GUPSHUP SMS] 📱 SMS dispatched to ${formattedTo} | Response: ${text}`);
      return {
        success: true,
        messageId: `gupshup-${Date.now()}`,
        timestamp,
      };
    } catch (err: any) {
      console.error(`[GUPSHUP SMS] ❌ Network error:`, err);
      return {
        success: false,
        error: err?.message || 'Gupshup SMS connection error',
        timestamp,
      };
    }
  }

  async sendWhatsApp(payload: WhatsAppPayload): Promise<NotificationResult> {
    const timestamp = new Date();
    if (!this.isConfigured()) {
      return {
        success: false,
        error: 'Gupshup provider not configured (GUPSHUP_API_KEY or GUPSHUP_APP_NAME missing).',
        timestamp,
      };
    }

    const formattedTo = formatPhoneNumberE164(payload.to).replace('+', '');
    const source = this.sourcePhone.replace('+', '');

    try {
      const url = 'https://api.gupshup.io/wa/api/v1/msg';
      const bodyParams = new URLSearchParams();
      bodyParams.append('channel', 'whatsapp');
      bodyParams.append('source', source);
      bodyParams.append('destination', formattedTo);
      bodyParams.append('src.name', this.appName);
      bodyParams.append('message', JSON.stringify({ type: 'text', text: payload.message }));

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          apikey: this.apiKey,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: bodyParams.toString(),
      });

      const data: any = await res.json();

      if (!res.ok || data.status === 'error') {
        const errorMsg = data?.message || data?.reason || `Gupshup WhatsApp HTTP ${res.status}`;
        console.error(`[GUPSHUP WHATSAPP] ❌ Failed to dispatch WhatsApp to ${formattedTo}:`, errorMsg);
        return {
          success: false,
          error: errorMsg,
          timestamp,
        };
      }

      console.log(`[GUPSHUP WHATSAPP] 💬 WhatsApp message dispatched to ${formattedTo} [ID: ${data.messageId || data.id}]`);
      return {
        success: true,
        messageId: data.messageId || data.id || `gupshup-wa-${Date.now()}`,
        timestamp,
      };
    } catch (err: any) {
      console.error(`[GUPSHUP WHATSAPP] ❌ Network error:`, err);
      return {
        success: false,
        error: err?.message || 'Gupshup WhatsApp connection error',
        timestamp,
      };
    }
  }
}
