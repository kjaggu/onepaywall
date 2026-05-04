export function appendUnsubscribeFooter(html: string, unsubscribeToken: string): string {
  const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? ""
  if (html.includes("/api/email/unsubscribe/")) return html
  return html.replace(
    "</body>",
    `<p style="font-size:11px;color:#999;margin-top:32px">
      <a href="${BASE_URL}/api/email/unsubscribe/${unsubscribeToken}">Unsubscribe</a>
    </p></body>`,
  )
}
