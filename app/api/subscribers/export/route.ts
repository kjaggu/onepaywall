import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth/session"
import { listSubscribersCrm } from "@/lib/db/queries/reader-subscriptions"

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session?.publisherId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const source = req.nextUrl.searchParams.get("source") ?? undefined

  const subscribers = await listSubscribersCrm(session.publisherId, { source, limit: 10000 })

  const header = "id,email,source,notes,active,created_at\n"
  const rows = subscribers.map(s => [
    s.id,
    `"${s.email.replace(/"/g, '""')}"`,
    s.source,
    s.notes ? `"${s.notes.replace(/"/g, '""')}"` : "",
    s.active ? "true" : "false",
    s.createdAt.toISOString(),
  ].join(",")).join("\n")

  const csv = header + rows

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="subscribers-${source ?? "all"}.csv"`,
    },
  })
}
