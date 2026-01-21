const RESEND_API_KEY = process.env.RESEND_API_KEY
const FROM_EMAIL = process.env.FROM_EMAIL || "noreply@goalbett.com"
const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || "GoalBett"
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

async function sendEmailViaResend(to, subject, html, text) {
  if (!RESEND_API_KEY) {
    console.log("\n========================================")
    console.log("EMAIL SERVICE (DEV MODE - No Resend API Key)")
    console.log("========================================")
    console.log(`To: ${to}`)
    console.log(`Subject: ${subject}`)
    console.log(`Text: ${text}`)
    console.log("========================================\n")
    return { success: true, dev: true }
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [to],
        subject,
        html,
        text,
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      console.error("Resend API error:", data)
      return { success: false, error: data.message || "Failed to send email" }
    }

    return { success: true, messageId: data.id }
  } catch (error) {
    console.error("Email send error:", error)
    return { success: false, error: error.message }
  }
}

export async function sendPasswordResetOTP(email, otp, userName, role) {
  const roleDisplayName = {
    player: "Player",
    agent: "Agent",
    subagent: "Sub-Agent",
    tenant: "Tenant Admin",
    super_admin: "Super Admin",
    staff: "Staff",
  }[role] || "User"

  const subject = `${APP_NAME} - Password Reset Code: ${otp}`

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Password Reset</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #0a1a2f; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a1a2f; padding: 40px 20px;">
        <tr>
          <td align="center">
            <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 500px; background-color: #1a2f45; border-radius: 16px; overflow: hidden;">
              <tr>
                <td style="padding: 40px 30px; text-align: center; background: linear-gradient(135deg, #ffd700 0%, #f5c800 100%);">
                  <h1 style="margin: 0; color: #0a1a2f; font-size: 28px; font-weight: 700;">${APP_NAME}</h1>
                  <p style="margin: 8px 0 0 0; color: #0a1a2f; font-size: 14px; opacity: 0.8;">Password Reset Request</p>
                </td>
              </tr>
              <tr>
                <td style="padding: 40px 30px;">
                  <p style="margin: 0 0 20px 0; color: #ffffff; font-size: 16px;">Hi ${userName || "there"},</p>
                  <p style="margin: 0 0 30px 0; color: #94a3b8; font-size: 15px; line-height: 1.6;">
                    We received a request to reset your ${roleDisplayName} account password. Use the code below to complete the reset:
                  </p>
                  <div style="background-color: #0a1a2f; border-radius: 12px; padding: 25px; text-align: center; margin: 0 0 30px 0;">
                    <p style="margin: 0 0 10px 0; color: #94a3b8; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Your Verification Code</p>
                    <p style="margin: 0; color: #ffd700; font-size: 36px; font-weight: 700; letter-spacing: 8px; font-family: monospace;">${otp}</p>
                  </div>
                  <p style="margin: 0 0 20px 0; color: #94a3b8; font-size: 14px;">
                    This code expires in <strong style="color: #ffffff;">30 minutes</strong>.
                  </p>
                  <p style="margin: 0 0 30px 0; color: #94a3b8; font-size: 14px;">
                    If you didn't request this, please ignore this email or contact support if you have concerns.
                  </p>
                  <div style="border-top: 1px solid #2d4a6a; padding-top: 20px;">
                    <p style="margin: 0; color: #64748b; font-size: 12px; text-align: center;">
                      This is an automated message from ${APP_NAME}. Please do not reply.
                    </p>
                  </div>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `

  const text = `
${APP_NAME} - Password Reset

Hi ${userName || "there"},

We received a request to reset your ${roleDisplayName} account password.

Your verification code is: ${otp}

This code expires in 30 minutes.

If you didn't request this, please ignore this email.

- The ${APP_NAME} Team
  `

  return sendEmailViaResend(email, subject, html, text)
}

export async function sendPasswordResetLink(email, token, userName, role) {
  const resetLink = `${APP_URL}/auth/reset-password?token=${token}`

  const roleDisplayName = {
    player: "Player",
    agent: "Agent",
    subagent: "Sub-Agent",
    tenant: "Tenant Admin",
    super_admin: "Super Admin",
    staff: "Staff",
  }[role] || "User"

  const subject = `${APP_NAME} - Reset Your Password`

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; background-color: #0a1a2f; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a1a2f; padding: 40px 20px;">
        <tr>
          <td align="center">
            <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 500px; background-color: #1a2f45; border-radius: 16px; overflow: hidden;">
              <tr>
                <td style="padding: 40px 30px; text-align: center; background: linear-gradient(135deg, #ffd700 0%, #f5c800 100%);">
                  <h1 style="margin: 0; color: #0a1a2f; font-size: 28px; font-weight: 700;">${APP_NAME}</h1>
                </td>
              </tr>
              <tr>
                <td style="padding: 40px 30px;">
                  <p style="margin: 0 0 20px 0; color: #ffffff; font-size: 16px;">Hi ${userName || "there"},</p>
                  <p style="margin: 0 0 30px 0; color: #94a3b8; font-size: 15px; line-height: 1.6;">
                    Click the button below to reset your ${roleDisplayName} account password:
                  </p>
                  <div style="text-align: center; margin: 0 0 30px 0;">
                    <a href="${resetLink}" style="display: inline-block; background: linear-gradient(135deg, #ffd700 0%, #f5c800 100%); color: #0a1a2f; text-decoration: none; padding: 14px 40px; border-radius: 8px; font-weight: 600; font-size: 16px;">Reset Password</a>
                  </div>
                  <p style="margin: 0 0 20px 0; color: #94a3b8; font-size: 14px;">
                    This link expires in <strong style="color: #ffffff;">30 minutes</strong>.
                  </p>
                  <p style="margin: 0; color: #64748b; font-size: 12px; word-break: break-all;">
                    Or copy this link: ${resetLink}
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `

  const text = `
${APP_NAME} - Reset Your Password

Hi ${userName || "there"},

Click the link below to reset your ${roleDisplayName} account password:

${resetLink}

This link expires in 30 minutes.

- The ${APP_NAME} Team
  `

  return sendEmailViaResend(email, subject, html, text)
}

export async function sendPasswordChangedNotification(email, userName, role) {
  const subject = `${APP_NAME} - Password Changed Successfully`

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; background-color: #0a1a2f; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a1a2f; padding: 40px 20px;">
        <tr>
          <td align="center">
            <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 500px; background-color: #1a2f45; border-radius: 16px; overflow: hidden;">
              <tr>
                <td style="padding: 40px 30px; text-align: center; background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);">
                  <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">Password Changed</h1>
                </td>
              </tr>
              <tr>
                <td style="padding: 40px 30px;">
                  <p style="margin: 0 0 20px 0; color: #ffffff; font-size: 16px;">Hi ${userName || "there"},</p>
                  <p style="margin: 0 0 20px 0; color: #94a3b8; font-size: 15px; line-height: 1.6;">
                    Your password has been successfully changed. You can now log in with your new password.
                  </p>
                  <p style="margin: 0 0 20px 0; color: #f59e0b; font-size: 14px;">
                    If you didn't make this change, please contact support immediately.
                  </p>
                  <div style="text-align: center; margin-top: 30px;">
                    <a href="${APP_URL}/auth" style="display: inline-block; background: linear-gradient(135deg, #ffd700 0%, #f5c800 100%); color: #0a1a2f; text-decoration: none; padding: 14px 40px; border-radius: 8px; font-weight: 600; font-size: 16px;">Log In Now</a>
                  </div>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `

  const text = `
${APP_NAME} - Password Changed Successfully

Hi ${userName || "there"},

Your password has been successfully changed. You can now log in with your new password.

If you didn't make this change, please contact support immediately.

- The ${APP_NAME} Team
  `

  return sendEmailViaResend(email, subject, html, text)
}

export async function send2FASetupEmail(email, userName, qrCodeUrl, secret) {
  const subject = `${APP_NAME} - Two-Factor Authentication Setup`

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; background-color: #0a1a2f; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a1a2f; padding: 40px 20px;">
        <tr>
          <td align="center">
            <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 500px; background-color: #1a2f45; border-radius: 16px; overflow: hidden;">
              <tr>
                <td style="padding: 40px 30px; text-align: center; background: linear-gradient(135deg, #ffd700 0%, #f5c800 100%);">
                  <h1 style="margin: 0; color: #0a1a2f; font-size: 28px; font-weight: 700;">2FA Setup</h1>
                </td>
              </tr>
              <tr>
                <td style="padding: 40px 30px;">
                  <p style="margin: 0 0 20px 0; color: #ffffff; font-size: 16px;">Hi ${userName || "there"},</p>
                  <p style="margin: 0 0 20px 0; color: #94a3b8; font-size: 15px; line-height: 1.6;">
                    Two-Factor Authentication has been enabled for your account. If you lose access to your authenticator app, use this backup secret:
                  </p>
                  <div style="background-color: #0a1a2f; border-radius: 12px; padding: 20px; text-align: center; margin: 0 0 30px 0;">
                    <p style="margin: 0 0 8px 0; color: #94a3b8; font-size: 12px; text-transform: uppercase;">Backup Secret</p>
                    <p style="margin: 0; color: #ffd700; font-size: 16px; font-weight: 600; font-family: monospace; word-break: break-all;">${secret}</p>
                  </div>
                  <p style="margin: 0; color: #f59e0b; font-size: 13px;">
                    Keep this secret safe! Anyone with this code can access your account.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `

  const text = `
${APP_NAME} - Two-Factor Authentication Setup

Hi ${userName || "there"},

Two-Factor Authentication has been enabled for your account.

Your backup secret is: ${secret}

Keep this secret safe! Anyone with this code can access your account.

- The ${APP_NAME} Team
  `

  return sendEmailViaResend(email, subject, html, text)
}

export default {
  sendPasswordResetOTP,
  sendPasswordResetLink,
  sendPasswordChangedNotification,
  send2FASetupEmail,
}
