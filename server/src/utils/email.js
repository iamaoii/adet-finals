import nodemailer from 'nodemailer';

/**
 * Sends a premium styled HTML verification email to the user.
 * Falls back to console output if SMTP environment variables are missing.
 */
export const sendVerificationEmail = async (toEmail, code) => {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.SMTP_PORT) || 587;
  const secure = process.env.SMTP_SECURE === 'true';
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  const hasCredentials = user && pass;

  const mailOptions = {
    from: `"InvoiceIQ Support" <${user || 'no-reply@invoiceiq.com'}>`,
    to: toEmail,
    subject: 'Activate Your InvoiceIQ Account',
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 540px; margin: 0 auto; padding: 32px; border: 1px solid #f1f5f9; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.02); background-color: #ffffff;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #0f172a; font-family: Georgia, serif; font-size: 28px; font-weight: 700; margin: 0; letter-spacing: -0.02em;">InvoiceIQ</h1>
          <p style="color: #64748b; font-size: 13px; font-weight: 500; margin: 4px 0 0 0; text-transform: uppercase; letter-spacing: 0.1em;">AI-Powered Finance</p>
        </div>
        
        <div style="border-top: 1px solid #f1f5f9; padding-top: 24px; margin-bottom: 24px;">
          <h2 style="color: #0f172a; font-size: 18px; font-weight: 600; margin-top: 0; margin-bottom: 12px;">Activate Your Account</h2>
          <p style="color: #475569; font-size: 14.5px; line-height: 1.6; margin: 0;">Thank you for registering with InvoiceIQ. To activate your account and access your dashboard, please enter the 6-digit temporary key below:</p>
        </div>

        <div style="background-color: #fafafa; border: 1px solid #f1f5f9; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px;">
          <span style="font-family: monospace; font-size: 36px; font-weight: 700; letter-spacing: 6px; color: #5B2E7F; display: inline-block; margin-left: 6px;">${code}</span>
        </div>

        <div style="color: #64748b; font-size: 13px; line-height: 1.5; border-top: 1px solid #f1f5f9; padding-top: 20px;">
          <p style="margin: 0 0 8px 0;">This code is temporary and will remain valid for the next 10 minutes.</p>
          <p style="margin: 0;">If you did not initiate this request, please ignore this email.</p>
        </div>

        <div style="text-align: center; margin-top: 32px; border-top: 1px solid #f1f5f9; padding-top: 20px;">
          <p style="font-size: 11px; color: #94a3b8; margin: 0;">InvoiceIQ — AI-Powered Invoice Processing & Analytics</p>
        </div>
      </div>
    `,
  };

  if (hasCredentials) {
    try {
      const transporter = nodemailer.createTransport({
        host,
        port,
        secure,
        auth: { user, pass },
      });
      await transporter.sendMail(mailOptions);
      console.log(`✉️ [SMTP] Verification email sent to ${toEmail} successfully.`);
    } catch (error) {
      console.error(`❌ [SMTP ERROR] Failed to send email to ${toEmail}:`, error.message);
    }
  } else {
    console.log('\n======================================================');
    console.log(`✉️  [MOCK EMAIL VERIFICATION FOR: ${toEmail}]`);
    console.log(`👉  YOUR TEMPORARY KEY IS: ${code}`);
    console.log('======================================================\n');
  }
};
