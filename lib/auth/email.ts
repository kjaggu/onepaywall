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

export async function sendReaderSubscriptionConfirmation(input: {
  to: string
  publisherName: string
  interval: string
  amountPaise: number
  currency: string
  razorpayPaymentId: string
  currentPeriodEnd: Date | null
}) {
  const { to, publisherName, interval, amountPaise, currency, razorpayPaymentId, currentPeriodEnd } = input
  const amount = (amountPaise / 100).toLocaleString("en-IN", { style: "currency", currency: currency || "INR", maximumFractionDigits: 0 })
  const intervalLabel = interval === "monthly" ? "Monthly" : interval === "quarterly" ? "Quarterly" : "Annual"
  const renewalLabel = currentPeriodEnd
    ? currentPeriodEnd.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })
    : null

  await resend.emails.send({
    from: FROM,
    to,
    subject: `Your ${publisherName} subscription is confirmed`,
    html: `
      <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:520px;margin:0 auto;padding:40px 24px;color:#111">

        <div style="margin-bottom:28px">
          <span style="font-weight:700;font-size:16px;color:#111">${publisherName}</span>
        </div>

        <h1 style="font-size:22px;font-weight:600;color:#111;margin:0 0 8px;line-height:1.3">
          Subscription confirmed
        </h1>
        <p style="font-size:14px;color:#555;line-height:1.6;margin:0 0 32px">
          Thank you for subscribing to <strong>${publisherName}</strong>. You now have full access.
        </p>

        <table cellpadding="0" cellspacing="0" style="width:100%;border:1px solid #e8e8e8;border-radius:8px;overflow:hidden;margin-bottom:32px">
          <tr style="background:#f9f9f9">
            <td colspan="2" style="padding:12px 16px;font-size:11px;font-weight:600;color:#888;text-transform:uppercase;letter-spacing:.06em">
              Receipt
            </td>
          </tr>
          <tr>
            <td style="padding:12px 16px;font-size:13px;color:#555;border-top:1px solid #e8e8e8">Plan</td>
            <td style="padding:12px 16px;font-size:13px;color:#111;font-weight:600;text-align:right;border-top:1px solid #e8e8e8">${intervalLabel} membership</td>
          </tr>
          <tr>
            <td style="padding:12px 16px;font-size:13px;color:#555;border-top:1px solid #e8e8e8">Amount paid</td>
            <td style="padding:12px 16px;font-size:13px;color:#111;font-weight:600;text-align:right;border-top:1px solid #e8e8e8">${amount}</td>
          </tr>
          ${renewalLabel ? `
          <tr>
            <td style="padding:12px 16px;font-size:13px;color:#555;border-top:1px solid #e8e8e8">Next renewal</td>
            <td style="padding:12px 16px;font-size:13px;color:#111;font-weight:600;text-align:right;border-top:1px solid #e8e8e8">${renewalLabel}</td>
          </tr>` : ""}
          <tr>
            <td style="padding:12px 16px;font-size:13px;color:#555;border-top:1px solid #e8e8e8">Payment ID</td>
            <td style="padding:12px 16px;font-size:12px;color:#888;font-family:monospace;text-align:right;border-top:1px solid #e8e8e8">${razorpayPaymentId}</td>
          </tr>
        </table>

        <p style="font-size:13px;color:#555;line-height:1.6;margin:0 0 28px">
          To read on a different device, use the <strong>Already subscribed?</strong> option
          on any gated article and enter this email address.
        </p>

        <div style="margin-top:40px;padding-top:24px;border-top:1px solid #ebebeb">
          <p style="font-size:11px;color:#bbb;margin:0;line-height:1.6">
            Powered by <a href="https://www.onepaywall.com" style="color:#bbb">OnePaywall</a> ·
            Sent to ${to}
          </p>
        </div>

      </div>
    `,
  })
}

export async function sendReaderPaymentReceived(input: {
  to: string
  publisherName: string
  interval: string
  amountPaise: number
  currency: string
  razorpayPaymentId: string
  nextRenewal: Date | null
}) {
  const { to, publisherName, interval, amountPaise, currency, razorpayPaymentId, nextRenewal } = input
  const amount = (amountPaise / 100).toLocaleString("en-IN", { style: "currency", currency: currency || "INR", maximumFractionDigits: 0 })
  const intervalLabel = interval === "monthly" ? "Monthly" : interval === "quarterly" ? "Quarterly" : "Annual"
  const nextLabel = nextRenewal
    ? nextRenewal.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })
    : null

  await resend.emails.send({
    from: FROM,
    to,
    subject: `Payment received — ${publisherName}`,
    html: `
      <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:520px;margin:0 auto;padding:40px 24px;color:#111">
        <div style="margin-bottom:28px">
          <span style="font-weight:700;font-size:16px;color:#111">${publisherName}</span>
        </div>
        <h1 style="font-size:22px;font-weight:600;color:#111;margin:0 0 8px;line-height:1.3">Payment received</h1>
        <p style="font-size:14px;color:#555;line-height:1.6;margin:0 0 32px">
          Your <strong>${publisherName}</strong> membership has been renewed. You continue to have full access.
        </p>
        <table cellpadding="0" cellspacing="0" style="width:100%;border:1px solid #e8e8e8;border-radius:8px;overflow:hidden;margin-bottom:32px">
          <tr style="background:#f9f9f9">
            <td colspan="2" style="padding:12px 16px;font-size:11px;font-weight:600;color:#888;text-transform:uppercase;letter-spacing:.06em">Receipt</td>
          </tr>
          <tr>
            <td style="padding:12px 16px;font-size:13px;color:#555;border-top:1px solid #e8e8e8">Plan</td>
            <td style="padding:12px 16px;font-size:13px;color:#111;font-weight:600;text-align:right;border-top:1px solid #e8e8e8">${intervalLabel} membership</td>
          </tr>
          <tr>
            <td style="padding:12px 16px;font-size:13px;color:#555;border-top:1px solid #e8e8e8">Amount charged</td>
            <td style="padding:12px 16px;font-size:13px;color:#111;font-weight:600;text-align:right;border-top:1px solid #e8e8e8">${amount}</td>
          </tr>
          ${nextLabel ? `
          <tr>
            <td style="padding:12px 16px;font-size:13px;color:#555;border-top:1px solid #e8e8e8">Next renewal</td>
            <td style="padding:12px 16px;font-size:13px;color:#111;font-weight:600;text-align:right;border-top:1px solid #e8e8e8">${nextLabel}</td>
          </tr>` : ""}
          <tr>
            <td style="padding:12px 16px;font-size:13px;color:#555;border-top:1px solid #e8e8e8">Payment ID</td>
            <td style="padding:12px 16px;font-size:12px;color:#888;font-family:monospace;text-align:right;border-top:1px solid #e8e8e8">${razorpayPaymentId}</td>
          </tr>
        </table>
        <div style="margin-top:40px;padding-top:24px;border-top:1px solid #ebebeb">
          <p style="font-size:11px;color:#bbb;margin:0;line-height:1.6">
            Powered by <a href="https://www.onepaywall.com" style="color:#bbb">OnePaywall</a> · Sent to ${to}
          </p>
        </div>
      </div>
    `,
  })
}

export async function sendReaderPaymentFailed(input: {
  to: string
  publisherName: string
  interval: string
  amountPaise: number
  currency: string
  reason: string
}) {
  const { to, publisherName, interval, amountPaise, currency, reason } = input
  const amount = (amountPaise / 100).toLocaleString("en-IN", { style: "currency", currency: currency || "INR", maximumFractionDigits: 0 })
  const intervalLabel = interval === "monthly" ? "Monthly" : interval === "quarterly" ? "Quarterly" : "Annual"

  await resend.emails.send({
    from: FROM,
    to,
    subject: `Action required — payment failed for ${publisherName}`,
    html: `
      <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:520px;margin:0 auto;padding:40px 24px;color:#111">
        <div style="margin-bottom:28px">
          <span style="font-weight:700;font-size:16px;color:#111">${publisherName}</span>
        </div>
        <h1 style="font-size:22px;font-weight:600;color:#111;margin:0 0 8px;line-height:1.3">Payment failed</h1>
        <p style="font-size:14px;color:#555;line-height:1.6;margin:0 0 24px">
          We weren't able to charge your payment method for your <strong>${publisherName}</strong>
          ${intervalLabel.toLowerCase()} membership. Razorpay will automatically retry — please ensure
          your payment method has sufficient funds.
        </p>
        <table cellpadding="0" cellspacing="0" style="width:100%;border:1px solid #fcd4d4;border-radius:8px;overflow:hidden;margin-bottom:32px;background:#fff8f8">
          <tr>
            <td style="padding:12px 16px;font-size:13px;color:#555">Amount</td>
            <td style="padding:12px 16px;font-size:13px;color:#111;font-weight:600;text-align:right">${amount}</td>
          </tr>
          <tr>
            <td style="padding:12px 16px;font-size:13px;color:#555;border-top:1px solid #fcd4d4">Reason</td>
            <td style="padding:12px 16px;font-size:13px;color:#c0392b;text-align:right;border-top:1px solid #fcd4d4">${reason}</td>
          </tr>
        </table>
        <p style="font-size:13px;color:#555;line-height:1.6;margin:0 0 28px">
          If the issue persists, your subscription will be paused and you will lose access to ${publisherName}.
        </p>
        <div style="margin-top:40px;padding-top:24px;border-top:1px solid #ebebeb">
          <p style="font-size:11px;color:#bbb;margin:0;line-height:1.6">
            Powered by <a href="https://www.onepaywall.com" style="color:#bbb">OnePaywall</a> · Sent to ${to}
          </p>
        </div>
      </div>
    `,
  })
}

export async function sendReaderSubscriptionHalted(input: {
  to: string
  publisherName: string
  interval: string
}) {
  const { to, publisherName, interval } = input
  const intervalLabel = interval === "monthly" ? "Monthly" : interval === "quarterly" ? "Quarterly" : "Annual"

  await resend.emails.send({
    from: FROM,
    to,
    subject: `Your ${publisherName} subscription has been paused`,
    html: `
      <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:520px;margin:0 auto;padding:40px 24px;color:#111">
        <div style="margin-bottom:28px">
          <span style="font-weight:700;font-size:16px;color:#111">${publisherName}</span>
        </div>
        <h1 style="font-size:22px;font-weight:600;color:#111;margin:0 0 8px;line-height:1.3">Subscription paused</h1>
        <p style="font-size:14px;color:#555;line-height:1.6;margin:0 0 24px">
          Your <strong>${publisherName}</strong> ${intervalLabel.toLowerCase()} membership has been paused
          after multiple failed payment attempts. You no longer have access to premium content.
        </p>
        <p style="font-size:14px;color:#555;line-height:1.6;margin:0 0 28px">
          To restore your access, please update your payment method with your bank or UPI app
          and re-subscribe from any gated article on ${publisherName}.
        </p>
        <div style="margin-top:40px;padding-top:24px;border-top:1px solid #ebebeb">
          <p style="font-size:11px;color:#bbb;margin:0;line-height:1.6">
            Powered by <a href="https://www.onepaywall.com" style="color:#bbb">OnePaywall</a> · Sent to ${to}
          </p>
        </div>
      </div>
    `,
  })
}

export async function sendReaderSubscriptionCancelled(input: {
  to: string
  publisherName: string
  interval: string
  currentPeriodEnd: Date | null
}) {
  const { to, publisherName, interval, currentPeriodEnd } = input
  const intervalLabel = interval === "monthly" ? "Monthly" : interval === "quarterly" ? "Quarterly" : "Annual"
  const accessUntil = currentPeriodEnd
    ? currentPeriodEnd.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })
    : null

  await resend.emails.send({
    from: FROM,
    to,
    subject: `Your ${publisherName} subscription has been cancelled`,
    html: `
      <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:520px;margin:0 auto;padding:40px 24px;color:#111">
        <div style="margin-bottom:28px">
          <span style="font-weight:700;font-size:16px;color:#111">${publisherName}</span>
        </div>
        <h1 style="font-size:22px;font-weight:600;color:#111;margin:0 0 8px;line-height:1.3">Subscription cancelled</h1>
        <p style="font-size:14px;color:#555;line-height:1.6;margin:0 0 24px">
          Your <strong>${publisherName}</strong> ${intervalLabel.toLowerCase()} membership has been cancelled.
          ${accessUntil ? `You will continue to have access until <strong>${accessUntil}</strong>.` : ""}
        </p>
        <p style="font-size:14px;color:#555;line-height:1.6;margin:0 0 28px">
          You can re-subscribe at any time from any gated article on ${publisherName}.
        </p>
        <div style="margin-top:40px;padding-top:24px;border-top:1px solid #ebebeb">
          <p style="font-size:11px;color:#bbb;margin:0;line-height:1.6">
            Powered by <a href="https://www.onepaywall.com" style="color:#bbb">OnePaywall</a> · Sent to ${to}
          </p>
        </div>
      </div>
    `,
  })
}

export async function sendReaderSubscriptionMagicLink(to: string, publicationName: string, restoreUrl: string) {
  await resend.emails.send({
    from: FROM,
    to,
    subject: `Restore your ${publicationName} membership`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px">
        <div style="margin-bottom:28px">
          <span style="font-weight:700;font-size:15px;color:#111">OnePaywall</span>
        </div>
        <h1 style="font-size:20px;font-weight:600;color:#111;margin-bottom:8px">Restore your membership</h1>
        <p style="font-size:14px;color:#555;line-height:1.6;margin-bottom:28px">
          Click below to restore your active <strong>${publicationName}</strong> membership on this browser.
          This link expires in 30 minutes.
        </p>
        <a href="${restoreUrl}"
           style="display:inline-block;padding:10px 22px;background:#111;color:#fff;text-decoration:none;border-radius:6px;font-size:13px;font-weight:600">
          Restore access
        </a>
        <p style="font-size:12px;color:#aaa;margin-top:28px">
          If you didn't request this, you can safely ignore this email.
        </p>
      </div>
    `,
  })
}
