import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth/session"
import { listTransactions, getRevenueSummary } from "@/lib/db/queries/transactions"

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session?.publisherId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = req.nextUrl
  const type     = searchParams.get("type") as "subscription" | "one_time_unlock" | null
  const status   = searchParams.get("status") as "pending" | "completed" | "refunded" | "failed" | null
  const domainId = searchParams.get("domainId") ?? undefined
  const from     = searchParams.get("from") ? new Date(searchParams.get("from")!) : undefined
  const to       = searchParams.get("to") ? new Date(searchParams.get("to")!) : undefined

  const [transactions, summary] = await Promise.all([
    listTransactions(session.publisherId, { type: type ?? undefined, status: status ?? undefined, domainId, from, to }),
    getRevenueSummary(session.publisherId),
  ])

  return NextResponse.json({ transactions, summary })
}
