export interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  text: string;
  from?: string;
}

export interface SmsPayload {
  to: string;
  message: string;
}

export interface NotificationResult {
  success: boolean;
  messageId?: string;
  error?: string;
  timestamp: Date;
}

export interface INotificationProvider {
  readonly name: string;
  sendEmail(payload: EmailPayload): Promise<NotificationResult>;
  sendSms(payload: SmsPayload): Promise<NotificationResult>;
}
