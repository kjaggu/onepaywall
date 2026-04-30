import { eq, and, isNull, gt, or } from "drizzle-orm"
import { db } from "@/lib/db/client"
import { gates, gateSteps, gateRules, gateUnlocks } from "@/lib/db/schema"
import { extractPath } from "@/lib/intelligence/sanitize"
import { matchGlob } from "@/lib/embed/match"
import { makeCache } from "@/lib/cache"

export type EvaluatedStep = {
  id: string
  stepOrder: number
  stepType: "ad" | "subscription_cta" | "one_time_unlock"
  config: Record<string, unknown>
  onSkip: "proceed" | "next_step"
  onDecline: "proceed" | "next_step"
}

export type EvaluationResult =
  | { gate: null }
  | { gate: { id: string; name: string; steps: EvaluatedStep[] } }

function gateMatchesUrl(rules: { pattern: string; matchType: string }[], urlPath: string): boolean {
  if (rules.length === 0) return true
  return rules.some(r => r.matchType === "path_glob" && matchGlob(r.pattern, urlPath))
}

type TriggerConditions = {
  minVisitCount?: number
  maxVisitCount?: number
  deviceType?: string
  freeForHours?: number
}

function conditionsMet(
  conditions: TriggerConditions,
  visitCount: number,
  deviceType?: string,
  publishedAt?: Date,
): boolean {
  if (conditions.minVisitCount !== undefined && visitCount < conditions.minVisitCount) return false
  if (conditions.maxVisitCount !== undefined && visitCount > conditions.maxVisitCount) return false
  if (conditions.deviceType && conditions.deviceType !== "any" && deviceType && conditions.deviceType !== deviceType) return false
  if (conditions.freeForHours && publishedAt) {
    const ageMs = Date.now() - publishedAt.getTime()
    if (ageMs < conditions.freeForHours * 60 * 60 * 1000) return false
  }
  return true
}

// ─── Gate domain config cache ─────────────────────────────────────────────────
// Gates, rules, and steps are publisher config — they change only when a
// publisher edits a gate. Cache per domain for 2 minutes; a stale gate config
// for up to 2 minutes is acceptable and saves 3 DB queries on every warm hit.

const GATE_TTL = 2 * 60 * 1000

type GateDomainConfig = {
  gates: (typeof gates.$inferSelect)[]
  rules: (typeof gateRules.$inferSelect)[]
  steps: (typeof gateSteps.$inferSelect)[]
}

const gateConfigCache = makeCache<string, GateDomainConfig>()

async function loadGateDomainConfig(domainId: string): Promise<GateDomainConfig> {
  const hit = gateConfigCache.get(domainId)
  if (hit) return hit

  const domainGates = await db
    .select()
    .from(gates)
    .where(and(eq(gates.domainId, domainId), eq(gates.enabled, true), isNull(gates.deletedAt)))
    .orderBy(gates.priority)

  if (domainGates.length === 0) {
    const empty: GateDomainConfig = { gates: [], rules: [], steps: [] }
    gateConfigCache.set(domainId, empty, GATE_TTL)
    return empty
  }

  const gateIds = domainGates.map(g => g.id)
  const rulesFilter = gateIds.length === 1
    ? eq(gateRules.gateId, gateIds[0])
    : or(...gateIds.map(id => eq(gateRules.gateId, id)))!
  const stepsFilter = gateIds.length === 1
    ? eq(gateSteps.gateId, gateIds[0])
    : or(...gateIds.map(id => eq(gateSteps.gateId, id)))!

  const [allRules, allSteps] = await Promise.all([
    db.select().from(gateRules).where(rulesFilter),
    db.select().from(gateSteps).where(stepsFilter).orderBy(gateSteps.stepOrder),
  ])

  const config: GateDomainConfig = { gates: domainGates, rules: allRules, steps: allSteps }
  gateConfigCache.set(domainId, config, GATE_TTL)
  return config
}

// ─── Evaluation ───────────────────────────────────────────────────────────────

export async function evaluateGate(opts: {
  domainId: string
  readerId: string
  visitCount: number
  pageUrl: string
  deviceType?: string
  publishedAt?: Date
  preview?: boolean
}): Promise<EvaluationResult> {
  const { domainId, readerId, visitCount, pageUrl, deviceType, publishedAt, preview } = opts
  const urlPath = extractPath(pageUrl)

  const { gates: domainGates, rules: allRules, steps: allSteps } = await loadGateDomainConfig(domainId)

  if (domainGates.length === 0) return { gate: null }

  const gateIds = domainGates.map(g => g.id)
  const unlocksFilter = gateIds.length === 1
    ? eq(gateUnlocks.gateId, gateIds[0])
    : or(...gateIds.map(id => eq(gateUnlocks.gateId, id)))!

  const now = new Date()

  // Reader unlocks are per-reader state — always queried live, never cached
  const existingUnlocks = await db
    .select({ gateId: gateUnlocks.gateId })
    .from(gateUnlocks)
    .where(and(
      eq(gateUnlocks.readerId, readerId),
      unlocksFilter,
      or(isNull(gateUnlocks.expiresAt), gt(gateUnlocks.expiresAt, now)),
    ))

  const unlockedGateIds = new Set(existingUnlocks.map(u => u.gateId))
  const sortedGates = [...domainGates].sort((a, b) => b.priority - a.priority)

  for (const gate of sortedGates) {
    if (!preview && unlockedGateIds.has(gate.id)) continue

    const rules = allRules.filter(r => r.gateId === gate.id)
    if (!preview && !gateMatchesUrl(rules, urlPath)) continue

    if (!preview) {
      const conditions = (gate.triggerConditions ?? {}) as TriggerConditions
      if (!conditionsMet(conditions, visitCount, deviceType, publishedAt)) continue
    }

    const steps = allSteps.filter(s => s.gateId === gate.id)
    return {
      gate: {
        id: gate.id,
        name: gate.name,
        steps: steps.map(s => ({
          id: s.id,
          stepOrder: s.stepOrder,
          stepType: s.stepType as EvaluatedStep["stepType"],
          config: (s.config ?? {}) as Record<string, unknown>,
          onSkip: s.onSkip as EvaluatedStep["onSkip"],
          onDecline: s.onDecline as EvaluatedStep["onDecline"],
        })),
      },
    }
  }

  return { gate: null }
}
