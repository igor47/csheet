import { config } from "@src/config"
import { logger } from "@src/lib/logger"
import type { Transporter } from "nodemailer"
import nodemailer from "nodemailer"

let transporter: Transporter | null = null

/**
 * Get or create the nodemailer transporter
 */
export function getTransporter(): Transporter {
  if (!transporter) {
    // Use stream transport in test mode to avoid sending real emails
    if (config.isTest) {
      transporter = nodemailer.createTransport({
        streamTransport: true,
        newline: "unix",
        buffer: true,
      })
    } else {
      transporter = nodemailer.createTransport({
        host: config.smtpHost,
        port: config.smtpPort,
        secure: config.smtpPort === 465, // true for 465, false for other ports
        auth: {
          user: config.smtpUser,
          pass: config.smtpPassword,
        },
      })
    }
  }
  return transporter
}

export interface SendOtpEmailParams {
  to: string
  otpCode: string
  magicLink: string
}

/**
 * Send OTP email with both code and magic link
 */
export async function sendOtpEmail({ to, otpCode, magicLink }: SendOtpEmailParams): Promise<void> {
  const transport = getTransporter()

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Login Code</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .container {
      background: #f8f9fa;
      border-radius: 8px;
      padding: 40px;
      text-align: center;
    }
    .otp-code {
      font-size: 48px;
      font-weight: bold;
      letter-spacing: 8px;
      color: #0d6efd;
      background: white;
      padding: 20px;
      border-radius: 8px;
      margin: 30px 0;
      font-family: 'Courier New', monospace;
    }
    .button {
      display: inline-block;
      background: #0d6efd;
      color: white !important;
      text-decoration: none;
      padding: 14px 32px;
      border-radius: 6px;
      font-weight: 500;
      margin: 20px 0;
    }
    .divider {
      margin: 30px 0;
      border-top: 2px solid #dee2e6;
      position: relative;
    }
    .divider span {
      background: #f8f9fa;
      padding: 0 20px;
      position: relative;
      top: -14px;
      color: #6c757d;
      font-size: 14px;
    }
    .footer {
      margin-top: 40px;
      font-size: 14px;
      color: #6c757d;
      text-align: center;
    }
    .warning {
      background: #fff3cd;
      border-left: 4px solid #ffc107;
      padding: 12px;
      margin: 20px 0;
      text-align: left;
      border-radius: 4px;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Login to CSheet</h1>
    <p>You requested a login code. Use either of the methods below:</p>

    <h2>Method 1: Enter this code</h2>
    <div class="otp-code">${otpCode}</div>
    <p>Enter this code on the login page to access your account.</p>

    <div class="divider"><span>OR</span></div>

    <h2>Method 2: Click the button</h2>
    <a href="${magicLink}" class="button">Login to CSheet</a>
    <p style="font-size: 14px; color: #6c757d;">This button works only once and expires in ${config.otpExpiryMinutes} minutes.</p>

    <div class="warning">
      <strong>Security Notice:</strong> This code and link can only be used once and will expire in ${config.otpExpiryMinutes} minutes. If you didn't request this, please ignore this email.
    </div>
  </div>

  <div class="footer">
    <p>This is an automated message from CSheet. Please do not reply to this email.</p>
  </div>
</body>
</html>
  `

  const textContent = `
Login to CSheet

You requested a login code. Use either method below:

Method 1: Enter this code
${otpCode}

Enter this code on the login page to access your account.

------- OR -------

Method 2: Click this link
${magicLink}

This link works only once and expires in ${config.otpExpiryMinutes} minutes.

Security Notice: This code and link can only be used once and will expire in ${config.otpExpiryMinutes} minutes. If you didn't request this, please ignore this email.
  `

  try {
    await transport.sendMail({
      from: config.smtpFrom,
      to,
      subject: `Your CSheet Login Code: ${otpCode}`,
      text: textContent.trim(),
      html: htmlContent.trim(),
    })

    logger.info("OTP email sent", { to })
  } catch (error) {
    logger.error("Failed to send OTP email", error as Error, { to })
    throw new Error("Failed to send email")
  }
}
