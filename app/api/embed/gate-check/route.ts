import { NextRequest, NextResponse } from "next/server"
import { eq, and, isNull } from "drizzle-orm"
import { db } from "@/lib/db/client"
import { domains } from "@/lib/db/schema"
import { resolveReader } from "@/lib/embed/readerToken"
import { evaluateGate } from "@/lib/gates/evaluate"
import { resolveUnlockPrice } from "@/lib/payments/resolveUnlockPrice"
import { isPublisherActive } from "@/lib/db/queries/billing"
import { markEmbedVerified } from "@/lib/db/queries/domains"
import { readerHasActiveBrandSubscription } from "@/lib/db/queries/reader-subscriptions"
import { getEnabledSyncedIntervals, getPublisherReaderPlan } from "@/lib/db/queries/publisher-plans"
import { getOrCreatePgConfig } from "@/lib/db/queries/pg-configs"

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const siteKey = searchParams.get("siteKey")
  const clientId = searchParams.get("clientId")
  const pageUrl = searchParams.get("url") ?? ""
  const deviceType = searchParams.get("device") ?? undefined
  const publishedAtParam = searchParams.get("publishedAt")
  const publishedAt = publishedAtParam ? new Date(publishedAtParam) : undefined
  const preview = searchParams.get("preview") === "1"

  if (!siteKey || !clientId) {
    return NextResponse.json({ error: "siteKey and clientId are required" }, { status: 400 })
  }

  // Look up domain by site key — no embedEnabled filter so we can auto-verify on first hit
  const [domain] = await db
    .select()
    .from(domains)
    .where(and(eq(domains.siteKey, siteKey), eq(domains.status, "active"), isNull(domains.deletedAt)))
    .limit(1)

  if (!domain) {
    // Return pass-through — don't reveal whether domain exists
    return NextResponse.json({ gate: null }, {
      headers: { "Cache-Control": "private, no-cache" },
    })
  }

  // Fire-and-forget: auto-verify embed on first hit
  if (!domain.embedEnabled) {
    markEmbedVerified(siteKey).catch(() => {})
  }

  const ua = req.headers.get("user-agent") ?? ""

  // Parallelize billing check and reader resolution — both only need domain info
  const [billingActive, reader] = await Promise.all([
    isPublisherActive(domain.publisherId),
    resolveReader(clientId, ua, domain.id),
  ])

  if (!billingActive) {
    return NextResponse.json({ gate: null }, {
      headers: { "Cache-Control": "private, no-cache" },
    })
  }

  // Check domain-level whitelist — whitelisted paths are never gated
  const whitelisted = (domain.whitelistedPaths ?? []) as string[]
  if (whitelisted.length > 0) {
    try {
      const pagePath = new URL(pageUrl).pathname
      if (whitelisted.some(p => p === pagePath)) {
        return NextResponse.json({ gate: null }, { headers: { "Cache-Control": "private, no-cache" } })
      }
    } catch {
      // pageUrl malformed — proceed normally
    }
  }

  // Parallelize subscription check and gate evaluation — both need readerId
  const [hasActiveSub, result] = await Promise.all([
    preview ? Promise.resolve(false) : readerHasActiveBrandSubscription(domain.brandId ?? domain.publisherId, reader.readerId),
    evaluateGate({
      domainId: domain.id,
      readerId: reader.readerId,
      visitCount: reader.visitCount,
      pageUrl,
      deviceType,
      publishedAt: publishedAt && !isNaN(publishedAt.getTime()) ? publishedAt : undefined,
      preview,
    }),
  ])

  if (hasActiveSub) {
    return NextResponse.json(
      { token: reader.token, gate: null, isSubscriber: true },
      { headers: { "Cache-Control": "private, no-cache" } },
    )
  }

  // Resolve unlock prices server-side so the embed always shows what we'll actually charge.
  // Pricing precedence is publisher_content_prices > publisher default > step config (see resolveUnlockPrice).
  if (result.gate) {
    const hasSubscriptionStep = result.gate.steps.some(step => step.stepType === "subscription_cta")

    const subscriptionIntervals = hasSubscriptionStep
      ? await Promise.all([
          getPublisherReaderPlan(domain.brandId ?? domain.publisherId),
          getOrCreatePgConfig(domain.brandId ?? domain.publisherId, domain.publisherId),
        ]).then(([plan, pgConfig]) => getEnabledSyncedIntervals(plan, pgConfig.mode as "platform" | "own"))
      : []

    for (const step of result.gate.steps) {
      if (step.stepType === "subscription_cta") {
        step.config = {
          ...step.config,
          intervals: subscriptionIntervals.map(i => ({
            interval: i.interval,
            price: i.price,
            currency: i.currency,
          })),
        }
      }
      if (step.stepType !== "one_time_unlock") continue
      const stepCfg = step.config as { priceInPaise?: number }
      const resolved = await resolveUnlockPrice({
        publisherId: domain.publisherId,
        pageUrl,
        stepConfigPriceInPaise: stepCfg.priceInPaise ?? null,
      })
      if (resolved) step.config = { ...stepCfg, priceInPaise: resolved.amountInPaise }
    }
  }

  return NextResponse.json(
    { token: reader.token, ...result, isSubscriber: false },
    { headers: { "Cache-Control": "private, no-cache" } },
  )
}
