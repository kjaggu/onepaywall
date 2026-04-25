import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = process.env.RESEND_FROM_EMAIL ?? "noreply@onepaywall.com"

export async function sendPasswordResetEmail(to: string, resetUrl: string) {
  await resend.emails.send({
    from: FROM,
    to,
    subject: "Reset your OnePaywall password",
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px">
        <div style="margin-bottom:28px">
          <span style="font-weight:700;font-size:15px;color:#111">OnePaywall</span>
        </div>
        <h1 style="font-size:20px;font-weight:600;color:#111;margin-bottom:8px">Reset your password</h1>
        <p style="font-size:14px;color:#555;line-height:1.6;margin-bottom:28px">
          We received a request to reset the password for your account.
          Click the button below — this link expires in 1 hour.
        </p>
        <a href="${resetUrl}"
           style="display:inline-block;padding:10px 22px;background:#111;color:#fff;text-decoration:none;border-radius:6px;font-size:13px;font-weight:600">
          Reset password
        </a>
        <p style="font-size:12px;color:#aaa;margin-top:28px">
          If you didn't request this, you can safely ignore this email.
        </p>
      </div>
    `,
  })
}
