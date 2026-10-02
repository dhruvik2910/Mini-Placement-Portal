import { WhatsAppPayload, NotificationResult } from './provider.interface';
import { mockNotificationProvider } from './mock.provider';

export class WhatsAppNotificationProvider {
  readonly name: string;
  private mode: 'meta' | 'twilio' | 'mock';

  private metaToken?: string;
  private metaPhoneId?: string;

  private twilioSid?: string;
  private twilioToken?: string;
  private twilioFrom?: string;

  constructor() {
    this.metaToken = process.env.META_WHATSAPP_TOKEN;
    this.metaPhoneId = process.env.META_PHONE_NUMBER_ID;

    this.twilioSid = process.env.TWILIO_ACCOUNT_SID;
    this.twilioToken = process.env.TWILIO_AUTH_TOKEN;
    this.twilioFrom = process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+14155238886';

    if (this.metaToken && this.metaPhoneId) {
      this.mode = 'meta';
      this.name = 'MetaWhatsAppCloudGateway';
    } else if (this.twilioSid && this.twilioToken) {
      this.mode = 'twilio';
      this.name = 'TwilioWhatsAppGateway';
    } else {
      this.mode = 'mock';
      this.name = 'MockWhatsAppGateway';
    }

    console.log(`[WHATSAPP PROVIDER] Initialized in mode: ${this.mode} (${this.name})`);
  }

  async sendWhatsApp(payload: WhatsAppPayload): Promise<NotificationResult> {
    const timestamp = new Date();

    // In mock mode or tests, delegate to the centralized mock provider
    if (this.mode === 'mock' || process.env.NODE_ENV === 'test') {
      return mockNotificationProvider.sendWhatsApp(payload);
    }

    // 1. Meta WhatsApp Cloud API (Official Graph API)
    if (this.mode === 'meta' && this.metaToken && this.metaPhoneId) {
      try {
        const cleanPhone = payload.to.replace(/\D/g, '');
        const formattedPhone = cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`;

        const url = `https://graph.facebook.com/v19.0/${this.metaPhoneId}/messages`;
        const res = await fetch(url, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.metaToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: formattedPhone,
            type: 'text',
            text: {
              preview_url: true,
              body: payload.message,
            },
          }),
        });

        const data = (await res.json().catch(() => ({}))) as {
          error?: { message?: string };
          messages?: Array<{ id?: string }>;
        };
        if (!res.ok) {
          throw new Error(data?.error?.message || `Meta API Error (${res.status})`);
        }

        const messageId = data?.messages?.[0]?.id || `meta-${Date.now()}`;
        console.log(`[WHATSAPP CLOUD API] 💬 Message sent to ${formattedPhone} [ID: ${messageId}]`);

        return {
          success: true,
          messageId,
          timestamp,
          provider: this.name,
        };
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : 'Meta WhatsApp API error';
        console.error(`[WHATSAPP CLOUD API] ❌ Error sending to ${payload.to}:`, errorMsg);
        return {
          success: false,
          error: errorMsg,
          timestamp,
          provider: this.name,
        };
      }
    }

    // 2. Twilio WhatsApp API
    if (this.mode === 'twilio' && this.twilioSid && this.twilioToken) {
      try {
        const cleanPhone = payload.to.replace(/\D/g, '');
        const toWhatsApp = `whatsapp:+${cleanPhone.startsWith('91') ? cleanPhone : '91' + cleanPhone}`;

        const url = `https://api.twilio.com/2010-04-01/Accounts/${this.twilioSid}/Messages.json`;
        const auth = Buffer.from(`${this.twilioSid}:${this.twilioToken}`).toString('base64');

        const params = new URLSearchParams();
        params.append('From', this.twilioFrom!);
        params.append('To', toWhatsApp);
        params.append('Body', payload.message);

        const res = await fetch(url, {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: params.toString(),
        });

        const data = (await res.json().catch(() => ({}))) as { message?: string; sid?: string };
        if (!res.ok) {
          throw new Error(data?.message || `Twilio Error (${res.status})`);
        }

        const messageId = data?.sid || `twilio-${Date.now()}`;
        console.log(`[TWILIO WHATSAPP] 💬 Message sent to ${toWhatsApp} [ID: ${messageId}]`);

        return {
          success: true,
          messageId,
          timestamp,
          provider: this.name,
        };
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : 'Twilio WhatsApp error';
        console.error(`[TWILIO WHATSAPP] ❌ Error sending to ${payload.to}:`, errorMsg);
        return {
          success: false,
          error: errorMsg,
          timestamp,
          provider: this.name,
        };
      }
    }

    return mockNotificationProvider.sendWhatsApp(payload);
  }
}

export const whatsAppNotificationProvider = new WhatsAppNotificationProvider();
