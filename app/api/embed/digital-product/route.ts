import { NextRequest, NextResponse } from "next/server"
import { eq } from "drizzle-orm"
import { db } from "@/lib/db/client"
import { domains, gateSteps } from "@/lib/db/schema"
import { getReaderByToken } from "@/lib/embed/readerToken"
import { createPendingReaderTransaction } from "@/lib/db/queries/transactions"
import { createDownloadOrder } from "@/lib/digital-products/createDownloadOrder"
import { recordDownloadUnlock } from "@/lib/digital-products/recordDownloadUnlock"

// POST /api/embed/digital-product?action=create — create Razorpay order for a digital product
// POST /api/embed/digital-product?action=verify — verify payment, write unlock, return signed download URL
export async function POST(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const action = searchParams.get("action") ?? "create"

  if (action === "create") return handleCreate(req)
  if (action === "verify") return handleVerify(req)
  return NextResponse.json({ error: "unknown action" }, { status: 400 })
}

async function handleCreate(req: NextRequest) {
  let body: { token?: string; gateId?: string; stepId?: string; email?: string }
  try { body = await req.json() } catch { return NextResponse.json({ error: "bad json" }, { status: 400 }) }

  const { token, gateId, stepId, email } = body
  if (!token || !gateId || !stepId) {
    return NextResponse.json({ error: "missing fields" }, { status: 400 })
  }

  const reader = await getReaderByToken(token)
  if (!reader) return NextResponse.json({ error: "invalid token" }, { status: 401 })

  const [domainRow] = await db
    .select({ publisherId: domains.publisherId })
    .from(domains)
    .where(eq(domains.id, reader.domainId))
    .limit(1)
  if (!domainRow) return NextResponse.json({ error: "domain not found" }, { status: 404 })

  const [step] = await db
    .select({ config: gateSteps.config })
    .from(gateSteps)
    .where(eq(gateSteps.id, stepId))
    .limit(1)
  if (!step) return NextResponse.json({ error: "step not found" }, { status: 404 })

  const stepCfg = step.config as { productId?: string }
  if (!stepCfg.productId) return NextResponse.json({ error: "no product configured" }, { status: 400 })

  try {
    const order = await createDownloadOrder({
      publisherId: domainRow.publisherId,
      productId: stepCfg.productId,
      gateId,
      readerToken: token,
      stepId,
    })

    await createPendingReaderTransaction({
      publisherId: domainRow.publisherId,
      domainId: reader.domainId,
      readerId: reader.readerId,
      type: "one_time_unlock",
      amount: order.amount,
      currency: "INR",
      razorpayOrderId: order.orderId,
      readerEmail: email ?? null,
      metadata: { gateId, stepId, productId: stepCfg.productId, type: "digital_product" },
    })

    return NextResponse.json(order)
  } catch (e) {
    const msg = e instanceof Error ? e.message : ""
    if (msg === "product_not_found") {
      return NextResponse.json({ error: "product not found" }, { status: 404 })
    }
    console.error("Digital product order creation failed:", e)
    return NextResponse.json({ error: "payment provider error" }, { status: 502 })
  }
}

async function handleVerify(req: NextRequest) {
  let body: {
    token?: string
    gateId?: string
    stepId?: string
    orderId?: string
    paymentId?: string
    signature?: string
    email?: string
  }
  try { body = await req.json() } catch { return NextResponse.json({ error: "bad json" }, { status: 400 }) }

  const { token, gateId, stepId, orderId, paymentId, signature, email } = body
  if (!token || !gateId || !stepId || !orderId || !paymentId || !signature) {
    return NextResponse.json({ error: "missing fields" }, { status: 400 })
  }

  const reader = await getReaderByToken(token)
  if (!reader) return NextResponse.json({ error: "invalid token" }, { status: 401 })

  const [domainRow] = await db
    .select({ publisherId: domains.publisherId })
    .from(domains)
    .where(eq(domains.id, reader.domainId))
    .limit(1)
  if (!domainRow) return NextResponse.json({ error: "domain not found" }, { status: 404 })

  const [step] = await db
    .select({ config: gateSteps.config })
    .from(gateSteps)
    .where(eq(gateSteps.id, stepId))
    .limit(1)
  if (!step) return NextResponse.json({ error: "step not found" }, { status: 404 })

  const stepCfg = step.config as { productId?: string }
  if (!stepCfg.productId) return NextResponse.json({ error: "no product configured" }, { status: 400 })

  const result = await recordDownloadUnlock({
    publisherId: domainRow.publisherId,
    domainId:    reader.domainId,
    readerId:    reader.readerId,
    gateId,
    productId:   stepCfg.productId,
    orderId,
    paymentId,
    signature,
    readerEmail: email ?? null,
  })

  if (!result.ok) {
    const status = result.error === "invalid_signature" ? 400 : 502
    return NextResponse.json({ error: result.error }, { status })
  }

  return NextResponse.json({ downloadUrl: result.downloadUrl })
}
