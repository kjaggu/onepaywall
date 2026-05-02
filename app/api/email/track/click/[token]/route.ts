import { NextRequest, NextResponse } from "next/server"
import { parseTrackingToken, recordEmailEvent } from "@/lib/email/tracking"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params
  const ctx = parseTrackingToken(token)

  const destination = ctx?.url
  if (!destination || !ctx?.subscriberId) {
    return new NextResponse("Invalid link", { status: 400 })
  }

  void recordEmailEvent(
    "clicked",
    {
      subscriberId:    ctx.subscriberId,
      campaignId:      ctx.campaignId,
      automationRunId: ctx.automationRunId,
    },
    { url: destination },
  ).catch(() => {})

  return NextResponse.redirect(destination, { status: 302 })
}
