import { db } from "@/lib/db/client"
import { emailEvents } from "@/lib/db/schema"

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? ""

function trackingToken(parts: Record<string, string>): string {
  return Buffer.from(JSON.stringify(parts)).toString("base64url")
}

export function parseTrackingToken(token: string): Record<string, string> | null {
  try {
    return JSON.parse(Buffer.from(token, "base64url").toString("utf8"))
  } catch {
    return null
  }
}

export type TrackingContext = {
  campaignId?: string
  automationRunId?: string
  subscriberId: string
}

export function injectTracking(html: string, ctx: TrackingContext): string {
  const pixelToken = trackingToken({ ...ctx, type: "open" })
  const pixelUrl = `${BASE_URL}/api/email/track/open/${pixelToken}`

  // Wrap all href links with click-tracking redirect
  const tracked = html.replace(
    /href="(https?:\/\/[^"]+)"/gi,
    (_, url) => {
      const clickToken = trackingToken({ ...ctx, type: "click", url })
      return `href="${BASE_URL}/api/email/track/click/${clickToken}"`
    },
  )

  // Append 1×1 tracking pixel before closing </body>
  const pixel = `<img src="${pixelUrl}" width="1" height="1" style="display:none" alt="" />`
  return tracked.includes("</body>")
    ? tracked.replace("</body>", `${pixel}</body>`)
    : tracked + pixel
}

export async function recordEmailEvent(
  eventType: string,
  ctx: TrackingContext,
  metadata: Record<string, string> = {},
): Promise<void> {
  await db.insert(emailEvents).values({
    campaignId:      ctx.campaignId,
    automationRunId: ctx.automationRunId,
    subscriberId:    ctx.subscriberId,
    eventType,
    metadata,
    occurredAt:      new Date(),
  })
}
