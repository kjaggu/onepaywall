import { Resend } from "resend"
import { decrypt } from "@/lib/payments/encrypt"

export type SendEmailOptions = {
  to: string
  subject: string
  html: string
  text?: string
  fromName: string
  fromEmail: string
  replyTo?: string
}

export async function sendEmail(opts: SendEmailOptions, encryptedApiKey: string): Promise<void> {
  const apiKey = decrypt(encryptedApiKey)
  const resend = new Resend(apiKey)
  const { error } = await resend.emails.send({
    from: `${opts.fromName} <${opts.fromEmail}>`,
    to: opts.to,
    subject: opts.subject,
    html: opts.html,
    text: opts.text,
    replyTo: opts.replyTo,
  })
  if (error) throw new Error(`Resend error: ${error.message}`)
}
