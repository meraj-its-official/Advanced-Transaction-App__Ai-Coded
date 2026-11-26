import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

export interface OtpDeliveryResult {
  emailSent: boolean;
  smsSent: boolean;
  emailDetails?: string;
  smsDetails?: string;
}

@Injectable()
export class OtpDeliveryService {
  private readonly logger = new Logger(OtpDeliveryService.name);
  private transporter: nodemailer.Transporter | null = null;

  constructor(private readonly config: ConfigService) {
    this.initMailTransporter();
  }

  private initMailTransporter() {
    const gmailUser = this.config.get<string>('GMAIL_USER') || process.env.GMAIL_USER;
    const gmailPass = this.config.get<string>('GMAIL_APP_PASSWORD') || process.env.GMAIL_APP_PASSWORD;

    if (gmailUser && gmailPass) {
      this.transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: gmailUser,
          pass: gmailPass,
        },
      });
      this.logger.log(`Initialized Gmail SMTP transport for ${gmailUser}`);
      return;
    }

    const host = this.config.get<string>('SMTP_HOST') || process.env.SMTP_HOST;
    const port = Number(this.config.get<string>('SMTP_PORT') || process.env.SMTP_PORT || '587');
    const user = this.config.get<string>('SMTP_USER') || process.env.SMTP_USER;
    const pass = this.config.get<string>('SMTP_PASS') || process.env.SMTP_PASS;
    const secure = (this.config.get<string>('SMTP_SECURE') || process.env.SMTP_SECURE) === 'true' || port === 465;

    if (host && user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure,
        auth: { user, pass },
      });
      this.logger.log(`Initialized SMTP transport via ${host}:${port}`);
    } else {
      this.logger.warn('No live SMTP configuration detected in .env (GMAIL_USER/GMAIL_APP_PASSWORD or SMTP_HOST). Real email delivery is ready once configured.');
    }
  }

  /**
   * Send Password Reset OTP to Email and Mobile SMS simultaneously
   */
  async sendPasswordResetOtp(params: {
    name: string;
    email: string;
    phone?: string | null;
    otp: string;
  }): Promise<OtpDeliveryResult> {
    const { name, email, phone, otp } = params;

    const [emailRes, smsRes] = await Promise.allSettled([
      this.sendEmail(email, name, otp),
      phone ? this.sendSms(phone, otp) : Promise.resolve({ success: false, message: 'No phone number linked' }),
    ]);

    const emailSent = emailRes.status === 'fulfilled' && emailRes.value.success;
    const smsSent = smsRes.status === 'fulfilled' && smsRes.value.success;

    const emailDetails = emailRes.status === 'fulfilled' ? emailRes.value.message : (emailRes.reason?.message || 'Email delivery failed');
    const smsDetails = smsRes.status === 'fulfilled' ? smsRes.value.message : (smsRes.reason?.message || 'SMS delivery failed');

    return {
      emailSent,
      smsSent,
      emailDetails,
      smsDetails,
    };
  }

  /**
   * Send Email with HTML Template
   */
  async sendEmail(to: string, name: string, otp: string): Promise<{ success: boolean; message: string }> {
    const fromAddress = this.config.get<string>('SMTP_FROM') || process.env.SMTP_FROM || '"PayFlow Security" <no-reply@payflow.com>';

    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>PayFlow Password Reset Code</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0a0a0f; color: #f1f5f9; margin: 0; padding: 0; }
    .container { max-width: 540px; margin: 40px auto; background-color: #12121a; border: 1px solid #1e1e2e; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
    .header { background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding: 32px 24px; text-align: center; }
    .brand { font-size: 26px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px; margin: 0; }
    .brand span { color: #a5b4fc; }
    .content { padding: 32px 28px; }
    h2 { font-size: 20px; font-weight: 700; color: #ffffff; margin-top: 0; margin-bottom: 12px; }
    p { font-size: 14px; line-height: 1.6; color: #94a3b8; margin: 0 0 18px 0; }
    .otp-box { background: #1a1a28; border: 2px dashed #4f46e5; border-radius: 12px; padding: 20px; text-align: center; margin: 26px 0; }
    .otp-label { font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; color: #818cf8; font-weight: 600; margin-bottom: 6px; }
    .otp-code { font-family: 'Courier New', Courier, monospace; font-size: 34px; font-weight: 800; color: #38bdf8; letter-spacing: 8px; margin: 0; }
    .warning { background: rgba(239, 68, 68, 0.1); border-left: 4px solid #ef4444; padding: 12px 16px; border-radius: 6px; font-size: 12px; color: #fca5a5; margin-top: 24px; }
    .footer { padding: 20px 28px; background-color: #0d0d14; border-top: 1px solid #1e1e2e; text-align: center; font-size: 11px; color: #64748b; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 class="brand">Pay<span>Flow</span></h1>
      <p style="color: #e0e7ff; font-size: 13px; margin: 6px 0 0 0;">Secure Digital Wallet & Payments</p>
    </div>
    <div class="content">
      <h2>Password Reset Request</h2>
      <p>Hello <strong>${name}</strong>,</p>
      <p>We received a request to reset your password for your PayFlow digital wallet account. Use the 6-digit verification code below to authorize setting your new password:</p>
      
      <div class="otp-box">
        <div class="otp-label">Verification Code (Expires in 03 mins)</div>
        <div class="otp-code">${otp}</div>
      </div>

      <p>This verification code is strictly confidential. <strong>PayFlow representatives will never ask you for this code</strong>.</p>
      
      <div class="warning">
        <strong>Security Warning:</strong> If you did not initiate this password reset, please change your password immediately or contact our support team.
      </div>
    </div>
    <div class="footer">
      &copy; ${new Date().getFullYear()} PayFlow Technologies. All rights reserved.<br>
      This is an automated security notification.
    </div>
  </div>
</body>
</html>
    `;

    if (this.transporter) {
      try {
        const info = await this.transporter.sendMail({
          from: fromAddress,
          to,
          subject: `${otp} is your PayFlow password reset verification code`,
          text: `Your PayFlow password reset verification code is: ${otp}. It expires in 03 minutes. If you did not request this, please secure your account immediately.`,
          html: htmlContent,
        });
        this.logger.log(`Real email sent successfully to ${to} (MessageID: ${info.messageId})`);
        return { success: true, message: `Email delivered to ${to}` };
      } catch (err: any) {
        this.logger.error(`Failed to send real email to ${to}: ${err.message}`);
        return { success: false, message: `Email sending failed: ${err.message}` };
      }
    } else {
      this.logger.log(`[SIMULATED EMAIL DELIVERED] To: ${to} | Subject: Password Reset OTP | Code: ${otp}`);
      return { success: true, message: `Verification code sent to email (simulated in dev)` };
    }
  }

  /**
   * Send SMS via Twilio or Indian Fast2SMS gateway
   */
  async sendSms(phone: string, otp: string): Promise<{ success: boolean; message: string }> {
    let formattedPhone = phone.trim();
    if (!formattedPhone.startsWith('+')) {
      const cleanDigits = formattedPhone.replace(/\D/g, '');
      if (cleanDigits.length === 10) {
        formattedPhone = `+91${cleanDigits}`;
      } else {
        formattedPhone = `+${cleanDigits}`;
      }
    }

    const messageText = `PayFlow Security: Your password reset verification code is ${otp}. Valid for 03 minutes. Never share this OTP with anyone.`;

    // 1. Try Twilio if credentials configured
    const twilioSid = this.config.get<string>('TWILIO_ACCOUNT_SID') || process.env.TWILIO_ACCOUNT_SID;
    const twilioToken = this.config.get<string>('TWILIO_AUTH_TOKEN') || process.env.TWILIO_AUTH_TOKEN;
    const twilioFrom = this.config.get<string>('TWILIO_PHONE_NUMBER') || process.env.TWILIO_PHONE_NUMBER;

    if (twilioSid && twilioToken && twilioFrom) {
      try {
        const authHeader = 'Basic ' + Buffer.from(`${twilioSid}:${twilioToken}`).toString('base64');
        const bodyParams = new URLSearchParams({
          To: formattedPhone,
          From: twilioFrom,
          Body: messageText,
        });

        const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`, {
          method: 'POST',
          headers: {
            Authorization: authHeader,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: bodyParams.toString(),
        });

        if (res.ok) {
          const data = (await res.json()) as { sid?: string };
          this.logger.log(`Real SMS sent via Twilio to ${formattedPhone} (SID: ${data.sid})`);
          return { success: true, message: `SMS delivered to ${formattedPhone}` };
        } else {
          const errText = await res.text();
          this.logger.error(`Twilio SMS error (${res.status}): ${errText}`);
          return { success: false, message: `Twilio SMS failed (${res.status})` };
        }
      } catch (err: any) {
        this.logger.error(`Twilio request error: ${err.message}`);
        return { success: false, message: `Twilio network error: ${err.message}` };
      }
    }

    // 2. Try Fast2SMS (Indian SMS gateway)
    const fast2smsKey = this.config.get<string>('FAST2SMS_API_KEY') || process.env.FAST2SMS_API_KEY;
    if (fast2smsKey) {
      try {
        const rawDigits = formattedPhone.replace(/\D/g, '').slice(-10);
        const res = await fetch('https://www.fast2sms.com/dev/bulkV2', {
          method: 'POST',
          headers: {
            authorization: fast2smsKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            route: 'otp',
            variables_values: otp,
            numbers: rawDigits,
          }),
        });
        if (res.ok) {
          this.logger.log(`Real SMS sent via Fast2SMS to ${rawDigits}`);
          return { success: true, message: `SMS delivered via Fast2SMS to ${rawDigits}` };
        }
      } catch (err: any) {
        this.logger.error(`Fast2SMS error: ${err.message}`);
      }
    }

    // Fallback in local/dev mode: log to console with clear instruction
    this.logger.log(`[SIMULATED SMS DELIVERED] To: ${formattedPhone} | Code: ${otp} | Text: "${messageText}"`);
    return { success: true, message: `Verification code sent to mobile SMS (simulated in dev)` };
  }
}
