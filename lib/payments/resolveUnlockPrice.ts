import { eq } from "drizzle-orm"
import { db } from "@/lib/db/client"
import { publisherContentPrices, publisherReaderPlans } from "@/lib/db/schema"
import { matchGlob } from "@/lib/embed/match"
import { extractPath } from "@/lib/intelligence/sanitize"

export type ResolvedPrice = {
  amountInPaise: number
  source: "url_override" | "publisher_default" | "step_config"
  matchedPattern?: string
}

type ContentPrice = typeof publisherContentPrices.$inferSelect

// Pricing precedence for one-time unlocks:
//   1. publisher_content_prices URL pattern match (most specific wins on tie — longest pattern)
//   2. publisher_reader_plans.default_unlock_price (only if unlock_enabled)
//   3. step.config.priceInPaise (legacy fallback so existing gates don't break)
//
// cachedContentPrices: pass pre-loaded prices from cache to avoid a DB query.
// If omitted, prices are fetched from the DB (backward-compatible).
export async function resolveUnlockPrice(opts: {
  publisherId: string
  pageUrl: string | null
  stepConfigPriceInPaise?: number | null
  cachedContentPrices?: ContentPrice[]
}): Promise<ResolvedPrice | null> {
  const { publisherId, pageUrl, stepConfigPriceInPaise, cachedContentPrices } = opts

  if (pageUrl) {
    const path = extractPath(pageUrl)
    const overrides = cachedContentPrices
      ?? await db.select().from(publisherContentPrices).where(eq(publisherContentPrices.publisherId, publisherId))

    const matches = overrides.filter(o => matchGlob(o.urlPattern, path))
    if (matches.length > 0) {
      const best = matches.reduce((a, b) => (b.urlPattern.length > a.urlPattern.length ? b : a))
      return { amountInPaise: best.price, source: "url_override", matchedPattern: best.urlPattern }
    }
  }

  const [plan] = await db
    .select()
    .from(publisherReaderPlans)
    .where(eq(publisherReaderPlans.publisherId, publisherId))
    .limit(1)

  if (plan?.unlockEnabled && plan.defaultUnlockPrice && plan.defaultUnlockPrice > 0) {
    return { amountInPaise: plan.defaultUnlockPrice, source: "publisher_default" }
  }

  if (stepConfigPriceInPaise && stepConfigPriceInPaise > 0) {
    return { amountInPaise: stepConfigPriceInPaise, source: "step_config" }
  }

  return null
}
