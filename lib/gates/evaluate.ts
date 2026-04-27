import { eq, and, isNull, gt, or } from "drizzle-orm"
import { db } from "@/lib/db/client"
import { gates, gateSteps, gateRules, gateUnlocks, domains } from "@/lib/db/schema"
import { extractPath } from "@/lib/intelligence/sanitize"
import { matchGlob } from "@/lib/embed/match"

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
  // No rules = applies to all content
  if (rules.length === 0) return true
  return rules.some(r => r.matchType === "path_glob" && matchGlob(r.pattern, urlPath))
}

type TriggerConditions = {
  minVisitCount?: number
  maxVisitCount?: number
  deviceType?: string
  freeForHours?: number  // skip gate if article published within this many hours
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

export async function evaluateGate(opts: {
  domainId: string
  readerId: string
  visitCount: number
  pageUrl: string
  deviceType?: string
  publishedAt?: Date
}): Promise<EvaluationResult> {
  const { domainId, readerId, visitCount, pageUrl, deviceType, publishedAt } = opts
  const urlPath = extractPath(pageUrl)

  // Load all enabled gates for domain with their rules, ordered by priority DESC
  const domainGates = await db
    .select()
    .from(gates)
    .where(and(eq(gates.domainId, domainId), eq(gates.enabled, true), isNull(gates.deletedAt)))
    .orderBy(gates.priority)

  if (domainGates.length === 0) return { gate: null }

  // Load all rules for these gates in one query
  const gateIds = domainGates.map(g => g.id)
  const allRules = await db
    .select()
    .from(gateRules)
    .where(
      gateIds.length === 1
        ? eq(gateRules.gateId, gateIds[0])
        : or(...gateIds.map(id => eq(gateRules.gateId, id)))!,
    )

  // Load valid unexpired unlocks for this reader across all gates
  const now = new Date()
  const existingUnlocks = await db
    .select({ gateId: gateUnlocks.gateId })
    .from(gateUnlocks)
    .where(
      and(
        eq(gateUnlocks.readerId, readerId),
        gateIds.length === 1
          ? eq(gateUnlocks.gateId, gateIds[0])
          : or(...gateIds.map(id => eq(gateUnlocks.gateId, id))),
        or(isNull(gateUnlocks.expiresAt), gt(gateUnlocks.expiresAt, now)),
      ),
    )

  const unlockedGateIds = new Set(existingUnlocks.map(u => u.gateId))

  // Evaluate gates in priority order (higher priority = evaluated first)
  const sortedGates = [...domainGates].sort((a, b) => b.priority - a.priority)

  for (const gate of sortedGates) {
    // Already unlocked — reader passes, skip this gate
    if (unlockedGateIds.has(gate.id)) continue

    const rules = allRules.filter(r => r.gateId === gate.id)

    // URL doesn't match this gate's rules — skip
    if (!gateMatchesUrl(rules, urlPath)) continue

    // Gate-level trigger conditions (basic ones — no profile required)
    const conditions = (gate.triggerConditions ?? {}) as TriggerConditions
    if (!conditionsMet(conditions, visitCount, deviceType, publishedAt)) continue

    // Gate applies — load its steps
    const steps = await db
      .select()
      .from(gateSteps)
      .where(eq(gateSteps.gateId, gate.id))
      .orderBy(gateSteps.stepOrder)

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
