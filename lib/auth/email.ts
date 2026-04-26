import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = process.env.RESEND_FROM_EMAIL ?? "noreply@onepaywall.com"

export async function sendWelcomeEmail(to: string, name: string, publicationName: string) {
  const firstName = name.split(" ")[0]
  await resend.emails.send({
    from: FROM,
    to,
    subject: `You're in. Let's put ${publicationName} to work.`,
    html: `
      <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:520px;margin:0 auto;padding:40px 24px;color:#111">

        <div style="margin-bottom:32px">
          <span style="font-weight:700;font-size:15px;color:#111;letter-spacing:-0.01em">OnePaywall</span>
        </div>

        <h1 style="font-size:22px;font-weight:600;color:#111;margin:0 0 12px;line-height:1.3">
          Welcome, ${firstName}.
        </h1>

        <p style="font-size:14px;color:#444;line-height:1.7;margin:0 0 20px">
          <strong>${publicationName}</strong> is now on OnePaywall.
          Your 14-day trial is running — every day you're not gating is revenue you're leaving on the table.
        </p>

        <p style="font-size:14px;color:#444;line-height:1.7;margin:0 0 28px">
          Here's what to do first:
        </p>

        <table cellpadding="0" cellspacing="0" style="width:100%;margin-bottom:32px">
          ${[
            ["01", "Add your domain", "Connect the site you want to monetize."],
            ["02", "Install the snippet", "One script tag. Works with any CMS."],
            ["03", "Create your first gate", "Paywall, metered, or ad-gate — your call."],
          ].map(([n, title, desc]) => `
          <tr>
            <td style="padding:12px 0;border-top:1px solid #ebebeb;vertical-align:top;width:28px">
              <span style="font-size:11px;font-weight:600;color:#aaa">${n}</span>
            </td>
            <td style="padding:12px 0 12px 12px;border-top:1px solid #ebebeb">
              <div style="font-size:13px;font-weight:600;color:#111;margin-bottom:2px">${title}</div>
              <div style="font-size:12px;color:#888">${desc}</div>
            </td>
          </tr>`).join("")}
        </table>

        <a href="${process.env.NEXT_PUBLIC_APP_URL ?? "https://app.onepaywall.com"}/overview"
           style="display:inline-block;padding:10px 22px;background:#111;color:#fff;text-decoration:none;border-radius:6px;font-size:13px;font-weight:600;letter-spacing:-0.01em">
          Go to your dashboard →
        </a>

        <div style="margin-top:40px;padding-top:24px;border-top:1px solid #ebebeb">
          <p style="font-size:12px;color:#bbb;margin:0;line-height:1.6">
            You signed up with <span style="color:#888">${to}</span>.
            Questions? Reply to this email — we read everything.
          </p>
        </div>

      </div>
    `,
  })
}

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
