/* eslint-disable import/no-anonymous-default-export */
import nodemailer from 'nodemailer';
import { App } from './database';

export interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
  from: string;
  to: string;
}

class EmailService {
  private transporter: nodemailer.Transporter;
  private config: EmailConfig;

  constructor() {
    this.config = {
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || '',
      },                                
      from: process.env.EMAIL_FROM || process.env.SMTP_USER || '',
      to: process.env.EMAIL_TO || '',
    };

    this.transporter = nodemailer.createTransport({
      host: this.config.host,
      port: this.config.port,
      secure: this.config.secure,
      auth: this.config.auth,
    });
  }

  async sendDownNotification(app: App, errorMessage: string): Promise<boolean> {
    try {
      const mailOptions = {
        from: this.config.from,
        to: this.config.to,
        subject: `🚨 App Down Alert: ${app.name}`,
        html: this.generateDownEmailHTML(app, errorMessage),
        text: this.generateDownEmailText(app, errorMessage),
      };

      await this.transporter.sendMail(mailOptions);
      console.log(`Down notification sent for ${app.name} (${app.url})`);
      return true;
    } catch (error) {
      console.error('Failed to send email notification:', error);
      return false;
    }
  }

  async sendUpNotification(app: App): Promise<boolean> {
    try {
      const mailOptions = {
        from: this.config.from,
        to: this.config.to,
        subject: `✅ App Back Online: ${app.name}`,
        html: this.generateUpEmailHTML(app),
        text: this.generateUpEmailText(app),
      };

      await this.transporter.sendMail(mailOptions);
      console.log(`Up notification sent for ${app.name} (${app.url})`);
      return true;
    } catch (error) {
      console.error('Failed to send email notification:', error);
      return false;
    }
  }

  private generateDownEmailHTML(app: App, errorMessage: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #dc2626; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px; }
          .alert { background: #fef2f2; border: 1px solid #fecaca; padding: 15px; border-radius: 6px; margin: 15px 0; }
          .details { background: white; padding: 15px; border-radius: 6px; margin: 15px 0; }
          .status { color: #dc2626; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🚨 App Down Alert</h1>
          </div>
          <div class="content">
            <p>The following application is currently <span class="status">DOWN</span>:</p>
            
            <div class="details">
              <h3>${app.name}</h3>
              <p><strong>URL:</strong> <a href="${app.url}">${app.url}</a></p>
              <p><strong>Last Check:</strong> ${new Date().toLocaleString()}</p>
            </div>
            
            <div class="alert">
              <h4>Error Details:</h4>
              <p>${errorMessage}</p>
            </div>
            
            <p>Please investigate the issue as soon as possible.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private generateDownEmailText(app: App, errorMessage: string): string {
    return `
🚨 APP DOWN ALERT

The following application is currently DOWN:

Name: ${app.name}
URL: ${app.url}
Last Check: ${new Date().toLocaleString()}

Error Details:
${errorMessage}

Please investigate the issue as soon as possible.
    `;
  }

  private generateUpEmailHTML(app: App): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #059669; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px; }
          .details { background: white; padding: 15px; border-radius: 6px; margin: 15px 0; }
          .status { color: #059669; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ App Back Online</h1>
          </div>
          <div class="content">
            <p>The following application is now <span class="status">BACK ONLINE</span>:</p>
            
            <div class="details">
              <h3>${app.name}</h3>
              <p><strong>URL:</strong> <a href="${app.url}">${app.url}</a></p>
              <p><strong>Recovery Time:</strong> ${new Date().toLocaleString()}</p>
            </div>
            
            <p>The application has recovered and is responding normally.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private generateUpEmailText(app: App): string {
    return `
✅ APP BACK ONLINE

The following application is now BACK ONLINE:

Name: ${app.name}
URL: ${app.url}
Recovery Time: ${new Date().toLocaleString()}

The application has recovered and is responding normally.
    `;
  }

  async verifyConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      return true;
    } catch (error) {
      console.error('Email service connection failed:', error);
      return false;
    }
  }
}

export default new EmailService(); 