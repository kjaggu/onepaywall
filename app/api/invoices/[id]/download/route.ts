import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth/session"
import { getInvoice } from "@/lib/db/queries/invoices"
import { renderInvoiceHtml } from "@/lib/invoices/format"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorised" }, { status: 401 })

  const { id } = await params
  const invoice = await getInvoice(id, session.publisherId)
  if (!invoice) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const html = renderInvoiceHtml(invoice)

  return new NextResponse(html, {
    headers: {
      "Content-Type":        "text/html; charset=utf-8",
      "Content-Disposition": `inline; filename="${invoice.invoiceRef}.html"`,
    },
  })
}
