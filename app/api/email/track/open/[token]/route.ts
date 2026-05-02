import { NextRequest, NextResponse } from "next/server"
import { parseTrackingToken, recordEmailEvent } from "@/lib/email/tracking"

const PIXEL = Buffer.from(
  "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
  "base64",
)

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params
  const ctx = parseTrackingToken(token)

  if (ctx?.subscriberId) {
    void recordEmailEvent("opened", {
      subscriberId:    ctx.subscriberId,
      campaignId:      ctx.campaignId,
      automationRunId: ctx.automationRunId,
    }).catch(() => {})
  }

  return new NextResponse(PIXEL, {
    status: 200,
    headers: {
      "Content-Type":  "image/gif",
      "Cache-Control": "no-store, no-cache, must-revalidate",
    },
  })
}
