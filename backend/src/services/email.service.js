import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

let cachedTransporter = null;
let isEthereal = false;

async function createTransporter() {
  if (cachedTransporter) return cachedTransporter;

  // 1. Check if custom SMTP or Gmail credentials are provided
  if (env.SMTP_USER && env.SMTP_PASS) {
    const isGmail = env.SMTP_USER.includes('@gmail.com');
    const port = parseInt(env.SMTP_PORT, 10) || 587;
    const secure = env.SMTP_SECURE === 'true' || port === 465;

    const transportConfig = isGmail
      ? {
          service: 'gmail',
          auth: {
            user: env.SMTP_USER,
            pass: env.SMTP_PASS,
          },
        }
      : env.SMTP_HOST
      ? {
          host: env.SMTP_HOST,
          port,
          secure,
          auth: {
            user: env.SMTP_USER,
            pass: env.SMTP_PASS,
          },
        }
      : {
          service: 'gmail',
          auth: {
            user: env.SMTP_USER,
            pass: env.SMTP_PASS,
          },
        };

    cachedTransporter = nodemailer.createTransport(transportConfig);
    isEthereal = false;
    console.log(`📧 Configured real SMTP email transporter for ${env.SMTP_USER}`);
    return cachedTransporter;
  }

  // 2. Development fallback: Generate Ethereal Test Account
  try {
    const testAccount = await nodemailer.createTestAccount();
    cachedTransporter = nodemailer.createTransport({
      host: testAccount.smtp.host,
      port: testAccount.smtp.port,
      secure: testAccount.smtp.secure,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    isEthereal = true;
    console.log('🧪 Using Ethereal Email test service for local development (no real SMTP configured).');
    return cachedTransporter;
  } catch (err) {
    console.warn('⚠️ Could not create Ethereal test account:', err.message);
    // Dummy transporter that logs
    return {
      sendMail: async (mailOptions) => {
        console.log('📬 [FALLBACK EMAIL LOG]:', mailOptions);
        return { messageId: 'dummy-id' };
      },
    };
  }
}

export class EmailService {
  /**
   * Send a beautifully styled OTP verification email
   */
  static async sendOtpEmail({ to, otp }) {
    const transporter = await createTransporter();

    const fromAddress = env.EMAIL_FROM || '"Educarrus Foundation" <admin@educarrus.org>';

    const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Verify Your Email - Educarrus</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          background-color: #F1F5F9;
          margin: 0;
          padding: 0;
          -webkit-font-smoothing: antialiased;
        }
        .container {
          max-width: 560px;
          margin: 30px auto;
          background: #FFFFFF;
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.08);
          border: 1px solid #E2E8F0;
        }
        .header {
          background: linear-gradient(135deg, #0F172A 0%, #1E293B 100%);
          padding: 36px 30px;
          text-align: center;
        }
        .logo-badge {
          display: inline-block;
          background: rgba(245, 158, 11, 0.15);
          border: 1px solid rgba(245, 158, 11, 0.4);
          color: #F59E0B;
          font-weight: 800;
          font-size: 13px;
          padding: 6px 16px;
          border-radius: 9999px;
          letter-spacing: 1px;
          text-transform: uppercase;
          margin-bottom: 12px;
        }
        .header h1 {
          color: #FFFFFF;
          font-size: 24px;
          margin: 0 0 6px 0;
          font-weight: 800;
          letter-spacing: -0.5px;
        }
        .header p {
          color: #94A3B8;
          font-size: 14px;
          margin: 0;
        }
        .content {
          padding: 36px 32px;
          text-align: center;
        }
        .greeting {
          font-size: 16px;
          color: #334155;
          margin-bottom: 20px;
          line-height: 1.6;
        }
        .otp-box {
          background: linear-gradient(180deg, #F8FAFC 0%, #F1F5F9 100%);
          border: 2px dashed #F59E0B;
          border-radius: 16px;
          padding: 24px;
          margin: 28px 0;
          text-align: center;
        }
        .otp-label {
          font-size: 11px;
          font-weight: 700;
          color: #64748B;
          text-transform: uppercase;
          letter-spacing: 1.5px;
          margin-bottom: 8px;
        }
        .otp-code {
          font-family: 'Courier New', Courier, monospace;
          font-size: 38px;
          font-weight: 900;
          letter-spacing: 10px;
          color: #0F172A;
          margin: 0;
          padding-left: 10px;
        }
        .expiry-note {
          font-size: 13px;
          color: #EF4444;
          font-weight: 600;
          margin-top: 10px;
        }
        .instructions {
          font-size: 14px;
          color: #64748B;
          line-height: 1.6;
          margin-bottom: 24px;
        }
        .security-banner {
          background: #FFFBEB;
          border-left: 4px solid #F59E0B;
          padding: 12px 16px;
          border-radius: 8px;
          text-align: left;
          font-size: 12px;
          color: #92400E;
          margin-top: 20px;
          line-height: 1.5;
        }
        .footer {
          background-color: #F8FAFC;
          padding: 24px 30px;
          border-top: 1px solid #E2E8F0;
          text-align: center;
        }
        .footer p {
          color: #94A3B8;
          font-size: 12px;
          margin: 4px 0;
          line-height: 1.5;
        }
        .footer-brand {
          font-weight: 700;
          color: #475569;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <!-- Header -->
        <div class="header">
          <div class="logo-badge">🎓 Educarrus Security</div>
          <h1>Verify Your Email Address</h1>
          <p>Complete your registration to join Educarrus</p>
        </div>

        <!-- Content -->
        <div class="content">
          <p class="greeting">
            Hello, welcome to <strong>Educarrus</strong>. Please use the verification code below to verify your email address and continue creating your account.
          </p>

          <!-- OTP Box -->
          <div class="otp-box">
            <div class="otp-label">Your One-Time Password (OTP)</div>
            <div class="otp-code">${otp}</div>
            <div class="expiry-note">⏱️ Expires in 10 minutes</div>
          </div>

          <p class="instructions">
            Enter this code on the registration page to verify that this email belongs to you.
          </p>

          <div class="security-banner">
            🔒 <strong>Security Warning:</strong> Never share this code with anyone. Educarrus team members will never ask for your verification code.
          </div>
        </div>

        <!-- Footer -->
        <div class="footer">
          <p class="footer-brand">Educarrus Education & Scholarship Foundation</p>
          <p>Direct, transparent crowdfunding for India’s student future.</p>
          <p>&copy; ${new Date().getFullYear()} Educarrus. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
    `;

    const mailOptions = {
      from: fromAddress,
      to,
      subject: `${otp} is your Educarrus Email Verification Code`,
      text: `Your Educarrus verification code is: ${otp}. It expires in 10 minutes. Please do not share this code with anyone.`,
      html: htmlContent,
      dsn: {
        id: `otp-${Date.now()}`,
        return: 'headers',
        notify: ['never'],
        recipient: to,
      },
    };

    let info;
    try {
      info = await transporter.sendMail(mailOptions);
    } catch (sendErr) {
      console.warn('⚠️ SMTP send error, reconnecting transporter and retrying...', sendErr.message);
      cachedTransporter = null;
      const freshTransporter = await createTransporter();
      info = await freshTransporter.sendMail(mailOptions);
    }

    let previewUrl = null;
    if (isEthereal && nodemailer.getTestMessageUrl) {
      previewUrl = nodemailer.getTestMessageUrl(info);
    }

    console.log(`\n======================================================`);
    console.log(`📨 [EDUCARRUS OTP EMAIL DISPATCHED]`);
    console.log(`Recipient   : ${to}`);
    console.log(`OTP Code    : ${otp}`);
    if (previewUrl) {
      console.log(`Preview URL : ${previewUrl}`);
    }
    console.log(`======================================================\n`);

    return {
      success: true,
      messageId: info.messageId,
      previewUrl,
    };
  }

  /**
   * Send a branded Password Reset email with secure reset link
   */
  static async sendPasswordResetEmail({ to, fullName, resetUrl }) {
    const transporter = await createTransporter();
    const fromAddress = env.EMAIL_FROM || '"Educarrus Foundation" <admin@educarrus.org>';

    const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Reset Your Password - Educarrus</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          background-color: #F1F5F9;
          margin: 0;
          padding: 0;
          -webkit-font-smoothing: antialiased;
        }
        .container {
          max-width: 560px;
          margin: 30px auto;
          background: #FFFFFF;
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.08);
          border: 1px solid #E2E8F0;
        }
        .header {
          background: linear-gradient(135deg, #0F172A 0%, #1E293B 100%);
          padding: 36px 30px;
          text-align: center;
        }
        .logo-badge {
          display: inline-block;
          background: rgba(245, 158, 11, 0.15);
          border: 1px solid rgba(245, 158, 11, 0.4);
          color: #F59E0B;
          font-weight: 800;
          font-size: 13px;
          padding: 6px 16px;
          border-radius: 9999px;
          letter-spacing: 1px;
          text-transform: uppercase;
          margin-bottom: 12px;
        }
        .header h1 {
          color: #FFFFFF;
          font-size: 24px;
          margin: 0 0 6px 0;
          font-weight: 800;
          letter-spacing: -0.5px;
        }
        .header p {
          color: #94A3B8;
          font-size: 14px;
          margin: 0;
        }
        .content {
          padding: 36px 32px;
          text-align: center;
        }
        .greeting {
          font-size: 16px;
          color: #334155;
          margin-bottom: 14px;
          font-weight: 600;
        }
        .desc {
          font-size: 14px;
          line-height: 1.6;
          color: #64748B;
          margin-bottom: 28px;
        }
        .button-wrapper {
          margin: 30px 0;
        }
        .btn {
          display: inline-block;
          background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%);
          color: #0F172A !important;
          text-decoration: none;
          font-weight: 800;
          font-size: 15px;
          padding: 14px 36px;
          border-radius: 12px;
          box-shadow: 0 4px 14px 0 rgba(245, 158, 11, 0.39);
        }
        .expiry-note {
          display: inline-block;
          background: #FEF3C7;
          color: #92400E;
          font-size: 12px;
          font-weight: 600;
          padding: 6px 14px;
          border-radius: 8px;
          margin-bottom: 24px;
        }
        .fallback-box {
          background: #F8FAFC;
          border: 1px solid #E2E8F0;
          border-radius: 10px;
          padding: 14px;
          font-size: 12px;
          color: #64748B;
          text-align: left;
          word-break: break-all;
          margin-top: 20px;
        }
        .fallback-box a {
          color: #D97706;
          text-decoration: underline;
        }
        .security-banner {
          background: #F8FAFC;
          border-top: 1px solid #E2E8F0;
          padding: 16px 24px;
          font-size: 12px;
          color: #64748B;
          text-align: center;
        }
        .footer {
          background: #0F172A;
          color: #64748B;
          font-size: 11px;
          padding: 24px;
          text-align: center;
        }
        .footer-brand {
          color: #E2E8F0;
          font-weight: 700;
          margin-bottom: 4px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <!-- Header -->
        <div class="header">
          <div class="logo-badge">Educarrus Security</div>
          <h1>Password Reset Request</h1>
          <p>Direct, transparent crowdfunding for India’s student future</p>
        </div>

        <!-- Body -->
        <div class="content">
          <p class="greeting">Hello ${fullName || 'User'},</p>
          <p class="desc">
            We received a request to reset the password for your Educarrus account.<br>
            Click the button below to securely choose your new password.
          </p>

          <div class="button-wrapper">
            <a href="${resetUrl}" target="_blank" class="btn">Reset My Password &rarr;</a>
          </div>

          <div class="expiry-note">
            ⏳ This link is secure and valid for <strong>30 minutes</strong>.
          </div>

          <div class="fallback-box">
            <p style="margin: 0 0 6px 0; font-weight: 600;">Button not working? Copy and paste this URL into your browser:</p>
            <a href="${resetUrl}">${resetUrl}</a>
          </div>
        </div>

        <!-- Security Warning -->
        <div class="security-banner">
          🔒 <strong>Security Warning:</strong> If you did not request this password reset, please ignore this email. Your account remains completely secure.
        </div>

        <!-- Footer -->
        <div class="footer">
          <p class="footer-brand">Educarrus Education & Scholarship Foundation</p>
          <p>Direct, transparent crowdfunding for India’s student future.</p>
          <p>&copy; ${new Date().getFullYear()} Educarrus. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
    `;

    const mailOptions = {
      from: fromAddress,
      to,
      subject: `Reset Your Educarrus Password`,
      text: `Hello ${fullName || 'User'},\n\nWe received a request to reset your password. Use the following link to choose a new password:\n\n${resetUrl}\n\nThis link expires in 30 minutes. If you did not request this, please ignore this email.`,
      html: htmlContent,
      dsn: {
        id: `pwd-reset-${Date.now()}`,
        return: 'headers',
        notify: ['never'],
        recipient: to,
      },
    };

    let info;
    try {
      info = await transporter.sendMail(mailOptions);
    } catch (sendErr) {
      console.warn('⚠️ SMTP send error, reconnecting transporter and retrying...', sendErr.message);
      cachedTransporter = null;
      const freshTransporter = await createTransporter();
      info = await freshTransporter.sendMail(mailOptions);
    }

    let previewUrl = null;
    if (isEthereal && nodemailer.getTestMessageUrl) {
      previewUrl = nodemailer.getTestMessageUrl(info);
    }

    console.log(`\n======================================================`);
    console.log(`📨 [EDUCARRUS PASSWORD RESET EMAIL DISPATCHED]`);
    console.log(`Recipient   : ${to}`);
    console.log(`Reset URL   : ${resetUrl}`);
    if (previewUrl) {
      console.log(`Preview URL : ${previewUrl}`);
    }
    console.log(`======================================================\n`);

    return {
      success: true,
      messageId: info.messageId,
      previewUrl,
    };
  }

  /**
   * Send an official Broadcast Announcement email to a user
   */
  static async sendBroadcastEmail({ to, fullName, title, message, link }) {
    const transporter = await createTransporter();
    const fromAddress = env.EMAIL_FROM || '"Educarrus Foundation" <admin@educarrus.org>';
    const actionUrl = link || `${env.CLIENT_URL || 'http://localhost:3000'}/userdashboard?tab=dashboard`;

    const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title} - Educarrus Broadcast</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          background-color: #F8FAFC;
          margin: 0;
          padding: 0;
        }
        .container {
          max-width: 580px;
          margin: 30px auto;
          background: #FFFFFF;
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.08);
          border: 1px solid #E2E8F0;
        }
        .header {
          background: linear-gradient(135deg, #0A192F 0%, #0F2942 100%);
          padding: 32px 28px;
          text-align: center;
        }
        .badge {
          display: inline-block;
          background: rgba(245, 158, 11, 0.15);
          border: 1px solid rgba(245, 158, 11, 0.4);
          color: #F59E0B;
          font-weight: 800;
          font-size: 11px;
          padding: 5px 14px;
          border-radius: 9999px;
          letter-spacing: 1px;
          text-transform: uppercase;
          margin-bottom: 10px;
        }
        .header h1 {
          color: #FFFFFF;
          font-size: 22px;
          margin: 0;
          font-weight: 800;
        }
        .content {
          padding: 32px 28px;
        }
        .greeting {
          font-size: 15px;
          color: #1E293B;
          margin-bottom: 16px;
          font-weight: 600;
        }
        .notification-card {
          background: #FFFBEB;
          border-left: 4px solid #F59E0B;
          border-radius: 12px;
          padding: 20px;
          margin: 20px 0;
        }
        .notification-title {
          font-size: 16px;
          font-weight: 800;
          color: #92400E;
          margin: 0 0 8px 0;
        }
        .notification-message {
          font-size: 14px;
          line-height: 1.6;
          color: #451A03;
          margin: 0;
          white-space: pre-wrap;
        }
        .btn-wrapper {
          text-align: center;
          margin: 28px 0 10px 0;
        }
        .btn {
          display: inline-block;
          background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%);
          color: #0F172A !important;
          text-decoration: none;
          font-weight: 800;
          font-size: 14px;
          padding: 12px 32px;
          border-radius: 10px;
        }
        .footer {
          background: #0F172A;
          color: #94A3B8;
          font-size: 11px;
          padding: 20px;
          text-align: center;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="badge">📢 Platform Announcement</div>
          <h1>Educarrus Broadcast Alert</h1>
        </div>
        <div class="content">
          <p class="greeting">Hello ${fullName || 'Scholar'},</p>
          <div class="notification-card">
            <h2 class="notification-title">${title}</h2>
            <p class="notification-message">${message}</p>
          </div>
          <div class="btn-wrapper">
            <a href="${actionUrl}" target="_blank" class="btn">View on Dashboard &rarr;</a>
          </div>
        </div>
        <div class="footer">
          <p style="margin: 0; color: #E2E8F0; font-weight: 700;">Educarrus Foundation</p>
          <p style="margin: 4px 0 0 0;">Direct, transparent crowdfunding and admission guidance.</p>
        </div>
      </div>
    </body>
    </html>
    `;

    const mailOptions = {
      from: fromAddress,
      to,
      subject: `[Announcement] ${title}`,
      text: `Hello ${fullName || 'Scholar'},\n\nAnnouncement: ${title}\n\n${message}\n\nView on your dashboard: ${actionUrl}\n\n- Educarrus Team`,
      html: htmlContent,
      dsn: {
        id: `broadcast-${Date.now()}`,
        return: 'headers',
        notify: ['never'],
        recipient: to,
      },
    };

    try {
      const info = await transporter.sendMail(mailOptions);
      console.log(`📨 [BROADCAST EMAIL SENT] to ${to}`);
      return { success: true, messageId: info.messageId };
    } catch (sendErr) {
      console.warn(`⚠️ Error sending broadcast email to ${to}:`, sendErr.message);
      return { success: false, error: sendErr.message };
    }
  }
}
