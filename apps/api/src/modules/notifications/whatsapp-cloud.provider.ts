import {
  INotificationProvider,
  EmailPayload,
  SmsPayload,
  WhatsAppPayload,
  NotificationResult,
} from './provider.interface';
import { formatPhoneNumberE164 } from './twilio.provider';

export class WhatsAppCloudNotificationProvider implements INotificationProvider {
  readonly name = 'WhatsAppCloudProvider';

  private apiToken: string;
  private phoneNumberId: string;
  private apiVersion: string;

  constructor(options?: { apiToken?: string; phoneNumberId?: string; apiVersion?: string }) {
    this.apiToken = options?.apiToken || process.env.WHATSAPP_CLOUD_API_TOKEN || process.env.WHATSAPP_API_TOKEN || '';
    this.phoneNumberId =
      options?.phoneNumberId ||
      process.env.WHATSAPP_CLOUD_PHONE_NUMBER_ID ||
      process.env.WHATSAPP_PHONE_NUMBER_ID ||
      '';
    this.apiVersion = options?.apiVersion || 'v19.0';
  }

  isConfigured(): boolean {
    return Boolean(this.apiToken && this.phoneNumberId);
  }

  async sendEmail(_payload: EmailPayload): Promise<NotificationResult> {
    return {
      success: false,
      error: 'WhatsApp Cloud API only handles WhatsApp messaging.',
      timestamp: new Date(),
    };
  }

  async sendSms(_payload: SmsPayload): Promise<NotificationResult> {
    return {
      success: false,
      error: 'WhatsApp Cloud API does not support regular SMS messaging.',
      timestamp: new Date(),
    };
  }

  async sendWhatsApp(payload: WhatsAppPayload): Promise<NotificationResult> {
    const timestamp = new Date();
    if (!this.isConfigured()) {
      return {
        success: false,
        error: 'WhatsApp Cloud API not configured (WHATSAPP_CLOUD_API_TOKEN or WHATSAPP_CLOUD_PHONE_NUMBER_ID missing).',
        timestamp,
      };
    }

    const formattedTo = formatPhoneNumberE164(payload.to).replace('+', '');

    try {
      const url = `https://graph.facebook.com/${this.apiVersion}/${this.phoneNumberId}/messages`;

      const requestBody = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: formattedTo,
        type: 'text',
        text: {
          preview_url: false,
          body: payload.message,
        },
      };

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const data = (await res.json()) as { error?: { message?: string }; messages?: Array<{ id?: string }> };

      if (!res.ok || data.error) {
        const errorMsg = data?.error?.message || `WhatsApp Cloud API HTTP ${res.status}`;
        console.error(`[WHATSAPP CLOUD API] ❌ Error dispatching to ${formattedTo}:`, errorMsg);
        return {
          success: false,
          error: errorMsg,
          timestamp,
        };
      }

      const messageId = data.messages?.[0]?.id || `wamid-${Date.now()}`;
      console.log(`[WHATSAPP CLOUD API] 💬 WhatsApp sent to ${formattedTo} [WAMID: ${messageId}]`);

      return {
        success: true,
        messageId,
        timestamp,
      };
    } catch (err: unknown) {
      console.error(`[WHATSAPP CLOUD API] ❌ Network error:`, err);
      const errorMsg = err instanceof Error ? err.message : 'WhatsApp Cloud API network exception';
      return {
        success: false,
        error: errorMsg,
        timestamp,
      };
    }
  }
}
