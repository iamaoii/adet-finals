import nodemailer from 'nodemailer';
import dns from 'dns';
import https from 'https';

// Force Node.js to prefer IPv4 resolution to prevent ENETUNREACH errors on cloud hosts that lack IPv6 support
dns.setDefaultResultOrder('ipv4first');

/**
 * Sends an email using the HTTPS Resend API.
 * This completely bypasses blocked outbound SMTP ports on platforms like Render or Vercel.
 */
const sendResendEmail = async (toEmail, htmlContent) => {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return false;

  const sender = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
  const senderName = process.env.RESEND_FROM_NAME || 'InvoiceIQ Support';

  try {
    console.log(`📡 [Resend API] Attempting HTTPS email transmission to ${toEmail}...`);

    // Use built-in fetch if available (Node.js >= 18)
    if (typeof fetch === 'function') {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          from: `"${senderName}" <${sender}>`,
          to: toEmail,
          subject: 'Activate Your InvoiceIQ Account',
          html: htmlContent
        })
      });

      const data = await response.json();
      if (response.ok) {
        console.log(`✉️ [Resend API] Email sent successfully to ${toEmail}. ID: ${data.id}`);
        return true;
      } else {
        console.error(`❌ [Resend API ERROR]`, data);
        return false;
      }
    } else {
      // Fallback for older Node.js versions using the native 'https' module
      return new Promise((resolve) => {
        const reqData = JSON.stringify({
          from: `"${senderName}" <${sender}>`,
          to: toEmail,
          subject: 'Activate Your InvoiceIQ Account',
          html: htmlContent
        });

        const req = https.request({
          hostname: 'api.resend.com',
          port: 443,
          path: '/emails',
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': reqData.length,
            'Authorization': `Bearer ${apiKey}`
          }
        }, (res) => {
          let body = '';
          res.on('data', (chunk) => body += chunk);
          res.on('end', () => {
            if (res.statusCode >= 200 && res.statusCode < 300) {
              console.log(`✉️ [Resend API] Email sent successfully to ${toEmail}.`);
              resolve(true);
            } else {
              console.error(`❌ [Resend API ERROR] Status ${res.statusCode}:`, body);
              resolve(false);
            }
          });
        });

        req.on('error', (err) => {
          console.error(`❌ [Resend API Connection Error]:`, err.message);
          resolve(false);
        });

        req.write(reqData);
        req.end();
      });
    }
  } catch (error) {
    console.error(`❌ [Resend API ERROR] Failed to send email to ${toEmail}:`, error.message);
    return false;
  }
};

/**
 * Sends a premium styled HTML verification email to the user.
 * Supports Resend HTTPS API, standard SMTP, and prints to console as last resort.
 * Returns true if sent successfully via Resend or SMTP, false otherwise.
 */
export const sendVerificationEmail = async (toEmail, code) => {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.SMTP_PORT) || 587;
  const secure = process.env.SMTP_SECURE === 'true';
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  const hasCredentials = user && pass;

  const htmlContent = `
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
  `;

  // 1. Try Resend API if API Key is configured
  if (process.env.RESEND_API_KEY) {
    const sent = await sendResendEmail(toEmail, htmlContent);
    if (sent) return true;
  }

  // 2. Try Standard SMTP if host credentials are provided
  if (hasCredentials) {
    try {
      console.log(`📡 [SMTP] Attempting SMTP transmission to ${toEmail}...`);
      const transporter = nodemailer.createTransport({
        host,
        port,
        secure,
        auth: { user, pass },
        connectionTimeout: 5000, // 5 seconds connection timeout
        socketTimeout: 5000,     // 5 seconds socket inactivity timeout
        greetingTimeout: 5000,   // 5 seconds greeting timeout
        family: 4                // Force IPv4 ONLY
      });

      await transporter.sendMail({
        from: `"InvoiceIQ Support" <${user}>`,
        to: toEmail,
        subject: 'Activate Your InvoiceIQ Account',
        html: htmlContent,
      });

      console.log(`✉️ [SMTP] Verification email sent to ${toEmail} successfully.`);
      return true;
    } catch (error) {
      console.error(`❌ [SMTP ERROR] Failed to send email to ${toEmail}:`, error.message);
      // Fall through to show the fallbackCode on the front-end
    }
  }

  // 3. Fallback print for development/sandbox mode
  console.log('\n======================================================');
  console.log(`✉️  [MOCK EMAIL VERIFICATION FOR: ${toEmail}]`);
  console.log(`👉  YOUR TEMPORARY KEY IS: ${code}`);
  console.log('======================================================\n');
  return false;
};
