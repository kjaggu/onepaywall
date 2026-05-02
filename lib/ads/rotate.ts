export interface AdUnitCandidate {
  id: string
  relevantCategories: string[]
  weight: number
  mediaType: "image" | "video" | null
  cdnUrl: string | null
  ctaLabel: string | null
  ctaUrl: string | null
  skipAfterSeconds: number | null
  sourceType: "direct" | "network"
  adNetworkId: string | null
  networkConfig: unknown
}

export interface ReaderAdContext {
  crossPublisherInterests: Record<string, { score: number; domainCount: number }>
  topicInterests: Record<string, number>
}

export interface RotationResult {
  adUnit: AdUnitCandidate
  relevanceScore: number
}

export function scoreAdUnit(unit: AdUnitCandidate, reader: ReaderAdContext): number {
  if (unit.relevantCategories.length === 0) return 1.0
  let sum = 0
  for (const cat of unit.relevantCategories) {
    sum += reader.crossPublisherInterests[cat]?.score ?? 0
  }
  return sum / unit.relevantCategories.length
}

export function selectAdUnit(
  candidates: AdUnitCandidate[],
  reader: ReaderAdContext | null,
): RotationResult | null {
  if (candidates.length === 0) return null

  // Score each candidate
  const scored = candidates.map(unit => ({
    unit,
    relevanceScore: reader ? scoreAdUnit(unit, reader) : 1.0,
  }))

  // effectiveWeight = weight * relevanceScore
  let pool = scored.map(s => ({ ...s, effectiveWeight: s.unit.weight * s.relevanceScore }))

  // If all scored candidates have zero effective weight, fall back to untargeted units
  const totalWeight = pool.reduce((sum, s) => sum + s.effectiveWeight, 0)
  if (totalWeight === 0) {
    const untargeted = pool.filter(s => s.unit.relevantCategories.length === 0)
    if (untargeted.length === 0) return null
    pool = untargeted.map(s => ({ ...s, effectiveWeight: s.unit.weight }))
  }

  // Weighted random selection
  const total = pool.reduce((sum, s) => sum + s.effectiveWeight, 0)
  let pick = Math.random() * total
  for (const s of pool) {
    pick -= s.effectiveWeight
    if (pick <= 0) return { adUnit: s.unit, relevanceScore: s.relevanceScore }
  }

  // Fallback (floating-point edge case)
  const last = pool[pool.length - 1]
  return { adUnit: last.unit, relevanceScore: last.relevanceScore }
}
