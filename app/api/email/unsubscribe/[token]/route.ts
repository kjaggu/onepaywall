import { NextRequest, NextResponse } from "next/server"
import { handleUnsubscribe } from "@/lib/email/unsubscribe"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params
  const result = await handleUnsubscribe(token)

  const html = result.ok
    ? page(
        "You've been unsubscribed",
        `You have been removed from ${result.publisherName}'s mailing list. You will no longer receive emails from them.`,
      )
    : result.reason === "already_unsubscribed"
      ? page("Already unsubscribed", "You have already been removed from this mailing list.")
      : page("Link not found", "This unsubscribe link is invalid or has expired.")

  return new NextResponse(html, {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  })
}

function page(title: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
           display: flex; align-items: center; justify-content: center;
           min-height: 100vh; margin: 0; background: #fafafa; color: #111; }
    .card { max-width: 400px; padding: 40px; background: #fff;
            border: 1px solid #ebebeb; border-radius: 8px; text-align: center; }
    h1 { font-size: 18px; font-weight: 600; margin: 0 0 12px; }
    p  { font-size: 14px; color: #666; margin: 0; line-height: 1.6; }
  </style>
</head>
<body>
  <div class="card">
    <h1>${title}</h1>
    <p>${body}</p>
  </div>
</body>
</html>`
}
