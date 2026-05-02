import { NextRequest, NextResponse } from "next/server"
import { eq, and, isNull } from "drizzle-orm"
import { db } from "@/lib/db/client"
import { domains } from "@/lib/db/schema"
import { resolveReader } from "@/lib/embed/readerToken"
import { evaluateGate } from "@/lib/gates/evaluate"
import { resolveUnlockPrice } from "@/lib/payments/resolveUnlockPrice"
import { isPublisherActive } from "@/lib/db/queries/billing"
import { markEmbedVerified } from "@/lib/db/queries/domains"
import { getReaderActiveSubscriptionInfo } from "@/lib/db/queries/reader-subscriptions"
import { getEnabledSyncedIntervals, getPublisherReaderPlan } from "@/lib/db/queries/publisher-plans"
import { getOrCreatePgConfig } from "@/lib/db/queries/pg-configs"
import { getReaderProfile } from "@/lib/db/queries/reader-intelligence"
import { listActiveAdUnits } from "@/lib/db/queries/ads"
import { selectAdUnit } from "@/lib/ads/rotate"
import type { AdUnitCandidate } from "@/lib/ads/rotate"
import { getDecryptedCredentialsById } from "@/lib/db/queries/ad-networks"
import { resolveAdsenseConfig } from "@/lib/ads/networks/adsense"
import { makeCache } from "@/lib/cache"

// ─── Module-level caches ──────────────────────────────────────────────────────
// These persist across requests on warm Vercel instances. Cold starts begin
// empty and fill on the first request — no correctness impact, only latency.

const TTL = {
  DOMAIN:  5 * 60 * 1000,  // domain config changes only on publisher edits
  BILLING: 5 * 60 * 1000,  // billing status changes only on payment events
  PLAN:    5 * 60 * 1000,  // reader plan changes only on publisher pricing edits
  PG:      5 * 60 * 1000,  // PG config changes only on publisher settings edits
  PRICES:  5 * 60 * 1000,  // content prices change only on publisher edits
  ADS:     5 * 60 * 1000,  // ad unit list changes only on publisher ad edits
}

type DomainRow = typeof domains.$inferSelect

const domainCache   = makeCache<string, DomainRow | null>()           // key: siteKey
const billingCache  = makeCache<string, boolean>()                    // key: publisherId
const planCache     = makeCache<string, Awaited<ReturnType<typeof getPublisherReaderPlan>>>()  // key: brandId
const pgCache       = makeCache<string, Awaited<ReturnType<typeof getOrCreatePgConfig>>>()    // key: brandId
const pricesCache   = makeCache<string, Awaited<ReturnType<typeof import("@/lib/db/queries/publisher-plans").listContentPrices>>>() // key: publisherId
const profileCache  = makeCache<string, Awaited<ReturnType<typeof getReaderProfile>>>()       // key: readerId
const adUnitsCache  = makeCache<string, AdUnitCandidate[]>()          // key: publisherId
const netCredsCache = makeCache<string, Awaited<ReturnType<typeof getDecryptedCredentialsById>>>() // key: adNetworkId

// ─── Cached loaders ───────────────────────────────────────────────────────────

async function getCachedDomain(siteKey: string): Promise<DomainRow | null> {
  const hit = domainCache.get(siteKey)
  if (hit !== undefined) return hit
  const [row] = await db
    .select()
    .from(domains)
    .where(and(eq(domains.siteKey, siteKey), eq(domains.status, "active"), isNull(domains.deletedAt)))
    .limit(1)
  const value = row ?? null
  domainCache.set(siteKey, value, TTL.DOMAIN)
  return value
}

async function getCachedBilling(publisherId: string): Promise<boolean> {
  const hit = billingCache.get(publisherId)
  if (hit !== undefined) return hit
  const active = await isPublisherActive(publisherId)
  billingCache.set(publisherId, active, TTL.BILLING)
  return active
}

async function getCachedPlan(brandId: string) {
  const hit = planCache.get(brandId)
  if (hit !== undefined) return hit
  const plan = await getPublisherReaderPlan(brandId)
  planCache.set(brandId, plan, TTL.PLAN)
  return plan
}

async function getCachedPgConfig(brandId: string, publisherId: string) {
  const hit = pgCache.get(brandId)
  if (hit !== undefined) return hit
  const config = await getOrCreatePgConfig(brandId, publisherId)
  pgCache.set(brandId, config, TTL.PG)
  return config
}

async function getCachedContentPrices(publisherId: string) {
  const hit = pricesCache.get(publisherId)
  if (hit !== undefined) return hit
  const { listContentPrices } = await import("@/lib/db/queries/publisher-plans")
  const prices = await listContentPrices(publisherId)
  pricesCache.set(publisherId, prices, TTL.PRICES)
  return prices
}

// Reader profiles are precomputed; 5-minute cache is fine — profile changes
// only from background computation, not inline during this request.
const PROFILE_TTL = 5 * 60 * 1000

async function getCachedReaderProfile(readerId: string) {
  const hit = profileCache.get(readerId)
  if (hit !== undefined) return hit
  const profile = await getReaderProfile(readerId)
  profileCache.set(readerId, profile, PROFILE_TTL)
  return profile
}

async function getCachedAdUnits(publisherId: string): Promise<AdUnitCandidate[]> {
  const hit = adUnitsCache.get(publisherId)
  if (hit !== undefined) return hit
  const units = await listActiveAdUnits(publisherId)
  adUnitsCache.set(publisherId, units, TTL.ADS)
  return units
}

async function getCachedNetworkCreds(adNetworkId: string) {
  const hit = netCredsCache.get(adNetworkId)
  if (hit !== undefined) return hit
  const creds = await getDecryptedCredentialsById(adNetworkId)
  netCredsCache.set(adNetworkId, creds, TTL.ADS)
  return creds
}

// ─── Route handler ────────────────────────────────────────────────────────────

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

  const domain = await getCachedDomain(siteKey)

  if (!domain) {
    return NextResponse.json({ gate: null }, {
      headers: { "Cache-Control": "private, no-cache" },
    })
  }

  // Fire-and-forget: auto-verify embed on first hit (doesn't affect cache)
  if (!domain.embedEnabled) {
    markEmbedVerified(siteKey).catch(() => {})
  }

  const ua = req.headers.get("user-agent") ?? ""

  const [billingActive, reader] = await Promise.all([
    getCachedBilling(domain.publisherId),
    resolveReader(clientId, ua, domain.id),
  ])

  if (!billingActive) {
    return NextResponse.json({ gate: null }, {
      headers: { "Cache-Control": "private, no-cache" },
    })
  }

  // Domain-level whitelist check (pure CPU — no DB)
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

  // Fetch subscription state and reader profile in parallel (both are reader-specific,
  // never cached at the gate level), then evaluate gates once with full context.
  const [subInfo, readerProfile] = await Promise.all([
    preview ? Promise.resolve(null) : getReaderActiveSubscriptionInfo(domain.brandId ?? domain.publisherId, reader.readerId),
    preview ? Promise.resolve(null) : getCachedReaderProfile(reader.readerId),
  ])

  const finalResult = await evaluateGate({
    domainId: domain.id,
    readerId: reader.readerId,
    visitCount: reader.visitCount,
    pageUrl,
    deviceType,
    publishedAt: publishedAt && !isNaN(publishedAt.getTime()) ? publishedAt : undefined,
    preview,
    readerProfile: readerProfile
      ? { segment: readerProfile.segment, monetizationProbability: readerProfile.monetizationProbability }
      : null,
  })

  if (subInfo) {
    return NextResponse.json(
      {
        token: reader.token,
        gate: null,
        isSubscriber: true,
        ...(domain.logoutWidgetEnabled && {
          widget: { position: domain.logoutWidgetPosition },
          subscribedSince: subInfo.since.toISOString(),
        }),
      },
      { headers: { "Cache-Control": "private, no-cache" } },
    )
  }

  if (finalResult.gate) {
    const hasSubscriptionStep = finalResult.gate.steps.some(step => step.stepType === "subscription_cta")
    const hasAdStep = finalResult.gate.steps.some(step => step.stepType === "ad")

    const [subscriptionIntervals, adUnits] = await Promise.all([
      hasSubscriptionStep
        ? Promise.all([
            getCachedPlan(domain.brandId ?? domain.publisherId),
            getCachedPgConfig(domain.brandId ?? domain.publisherId, domain.publisherId),
          ]).then(([plan, pgConfig]) => getEnabledSyncedIntervals(plan, pgConfig.mode as "platform" | "own"))
        : Promise.resolve([]),
      hasAdStep ? getCachedAdUnits(domain.publisherId) : Promise.resolve([]),
    ])

    // Pre-select ad unit once (same unit shown for all ad steps in this gate)
    const readerAdContext = readerProfile
      ? {
          crossPublisherInterests: (readerProfile.crossPublisherInterests as Record<string, { score: number; domainCount: number }>) ?? {},
          topicInterests: (readerProfile.topicInterests as Record<string, number>) ?? {},
        }
      : null
    const adSelection = hasAdStep ? selectAdUnit(adUnits, readerAdContext) : null

    for (const step of finalResult.gate.steps) {
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
      if (step.stepType === "ad" && adSelection) {
        const adConfig: Record<string, unknown> = {
          ...step.config,
          selectedAdUnitId: adSelection.adUnit.id,
          mediaType:        adSelection.adUnit.mediaType,
          cdnUrl:           adSelection.adUnit.cdnUrl,
          ctaLabel:         adSelection.adUnit.ctaLabel,
          ctaUrl:           adSelection.adUnit.ctaUrl,
          skipAfterSeconds: adSelection.adUnit.skipAfterSeconds,
        }
        // For network ad units, resolve the network render config (credentials never exposed)
        if (adSelection.adUnit.sourceType === "network" && adSelection.adUnit.adNetworkId) {
          const netData = await getCachedNetworkCreds(adSelection.adUnit.adNetworkId)
          if (netData) {
            const netCfg = adSelection.adUnit.networkConfig as Record<string, unknown>
            if (netData.provider === "google_adsense") {
              adConfig.networkAdConfig = resolveAdsenseConfig(
                netCfg as { adSlotId: string },
                netData.credentials as Parameters<typeof resolveAdsenseConfig>[1],
              )
            }
          }
        }
        step.config = adConfig
      }
      if (step.stepType !== "one_time_unlock") continue

      // Resolve unlock price using cached content prices + plan
      const stepCfg = step.config as { priceInPaise?: number }
      const resolved = await resolveUnlockPrice({
        publisherId: domain.publisherId,
        pageUrl,
        stepConfigPriceInPaise: stepCfg.priceInPaise ?? null,
        cachedContentPrices: await getCachedContentPrices(domain.publisherId),
      })
      if (resolved) step.config = { ...stepCfg, priceInPaise: resolved.amountInPaise }
    }
  }

  return NextResponse.json(
    {
      token: reader.token,
      ...finalResult,
      isSubscriber: false,
      // Reader segment is useful for publisher analytics + future embed personalisation
      ...(readerProfile && {
        readerSegment: readerProfile.segment,
        monetizationProbability: readerProfile.monetizationProbability,
      }),
    },
    { headers: { "Cache-Control": "private, no-cache" } },
  )
}
