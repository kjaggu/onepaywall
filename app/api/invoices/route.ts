import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth/session"
import { listInvoices, getOrCreateInvoiceForTransaction } from "@/lib/db/queries/invoices"

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorised" }, { status: 401 })

  const invoices = await listInvoices(session.publisherId)
  return NextResponse.json({ invoices })
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorised" }, { status: 401 })

  const body = await req.json().catch(() => null)
  const transactionId = body?.transactionId
  if (!transactionId) return NextResponse.json({ error: "transactionId required" }, { status: 400 })

  try {
    const invoice = await getOrCreateInvoiceForTransaction(session.publisherId, transactionId)
    return NextResponse.json({ invoice })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to create invoice"
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
