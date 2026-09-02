import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;
  private fromEmail: string;

  constructor(private readonly configService: ConfigService) {
    const host = this.configService.get<string>('SMTP_HOST') || 'localhost';
    const port = Number(this.configService.get<string>('SMTP_PORT')) || 1025;
    const user = this.configService.get<string>('SMTP_USER');
    const pass = this.configService.get<string>('SMTP_PASS');
    this.fromEmail = this.configService.get<string>('SMTP_FROM') || 'noreply@rits-workbench.local';

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: user && pass ? { user, pass } : undefined,
    });
  }

  async sendEmail(to: string, subject: string, htmlContent: string) {
    try {
      const info = await this.transporter.sendMail({
        from: `RITS Test Workbench <${this.fromEmail}>`,
        to,
        subject,
        html: htmlContent,
      });
      this.logger.log(`Email odoslaný na ${to}: ID ${info.messageId}`);
      return true;
    } catch (error) {
      this.logger.error(`Chyba pri odosielaní emailu na ${to}:`, error.message);
      return false;
    }
  }

  async sendStepAssignedNotification(toEmail: string, userName: string, testCaseTitle: string, stepAction: string, actionUrl: string) {
    const html = `
      <div style="font-family: Arial, sans-serif; background-color: #f9fafb; padding: 24px;">
        <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; border: 1px solid #e5e7eb; padding: 24px;">
          <h2 style="color: #111827; margin-top: 0;">Čaká na teba nový testovací krok</h2>
          <p style="color: #4b5563;">Ahoj <strong>${userName}</strong>,</p>
          <p style="color: #4b5563;">V systéme RITS Workbench ti bol pridelený nasledujúci krok v teste <strong>${testCaseTitle}</strong>:</p>
          <div style="background-color: #f3f4f6; border-left: 4px solid #3b82f6; padding: 12px 16px; margin: 16px 0;">
            <p style="margin: 0; color: #1f2937; font-weight: 500;">${stepAction}</p>
          </div>
          <a href="${actionUrl}" style="display: inline-block; background-color: #2563eb; color: #ffffff; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 12px;">Otvoriť Testovací Krok</a>
        </div>
      </div>
    `;
    return this.sendEmail(toEmail, `[RITS Test] Bol ti pridelený testovací krok: ${testCaseTitle}`, html);
  }
}
