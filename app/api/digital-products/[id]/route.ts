import { NextRequest, NextResponse } from "next/server"
import { eq, and } from "drizzle-orm"
import { getSession } from "@/lib/auth/session"
import { updateDigitalProduct } from "@/lib/db/queries/digital-products"
import { db } from "@/lib/db/client"
import { publisherDigitalProducts } from "@/lib/db/schema"

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession()
  if (!session?.publisherId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  let body: { title?: string; description?: string | null; priceInPaise?: number; active?: boolean }
  try { body = await req.json() } catch { return NextResponse.json({ error: "bad json" }, { status: 400 }) }

  const product = await updateDigitalProduct(id, session.publisherId, body)
  if (!product) return NextResponse.json({ error: "not found" }, { status: 404 })

  return NextResponse.json({ product })
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession()
  if (!session?.publisherId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params

  await db
    .update(publisherDigitalProducts)
    .set({ active: false, updatedAt: new Date() })
    .where(and(
      eq(publisherDigitalProducts.id, id),
      eq(publisherDigitalProducts.publisherId, session.publisherId),
    ))

  return NextResponse.json({ ok: true })
}
