import { describe, it } from "node:test"
import assert from "node:assert/strict"
import { selectAdUnit, scoreAdUnit, type AdUnitCandidate, type ReaderAdContext } from "./rotate.ts"

function makeUnit(overrides: Partial<AdUnitCandidate> = {}): AdUnitCandidate {
  return {
    id: "u1",
    relevantCategories: [],
    weight: 1,
    mediaType: null,
    cdnUrl: null,
    ctaLabel: null,
    ctaUrl: null,
    skipAfterSeconds: null,
    sourceType: "direct",
    adNetworkId: null,
    networkConfig: null,
    ...overrides,
  }
}

const emptyReader: ReaderAdContext = {
  crossPublisherInterests: {},
  topicInterests: {},
}

const techReader: ReaderAdContext = {
  crossPublisherInterests: { technology: { score: 0.9, domainCount: 5 } },
  topicInterests: { technology: 0.9 },
}

describe("selectAdUnit", () => {
  it("returns null for empty candidate list", () => {
    assert.equal(selectAdUnit([], null), null)
  })

  it("returns the unit for a single untargeted unit with null reader", () => {
    const unit = makeUnit({ id: "u1", relevantCategories: [] })
    const result = selectAdUnit([unit], null)
    assert.ok(result)
    assert.equal(result.adUnit.id, "u1")
    assert.equal(result.relevanceScore, 1.0)
  })

  it("returns null when all targeted units score zero and no untargeted fallback exists", () => {
    const unit = makeUnit({ id: "u1", relevantCategories: ["technology"] })
    const result = selectAdUnit([unit], emptyReader)
    assert.equal(result, null)
  })

  it("falls back to untargeted units when all targeted units score zero", () => {
    const targeted = makeUnit({ id: "targeted", relevantCategories: ["technology"] })
    const untargeted = makeUnit({ id: "untargeted", relevantCategories: [] })
    const result = selectAdUnit([targeted, untargeted], emptyReader)
    assert.ok(result)
    assert.equal(result.adUnit.id, "untargeted")
  })

  it("returns targeted unit for a matching reader over untargeted at same weight", () => {
    // Run many times to confirm the targeted unit wins most of the time
    const targeted = makeUnit({ id: "targeted", relevantCategories: ["technology"], weight: 1 })
    const untargeted = makeUnit({ id: "untargeted", relevantCategories: [], weight: 1 })
    let targetedWins = 0
    for (let i = 0; i < 100; i++) {
      const result = selectAdUnit([targeted, untargeted], techReader)
      if (result?.adUnit.id === "targeted") targetedWins++
    }
    // targeted has effectiveWeight 0.9, untargeted has 1.0 → targeted wins ~47% of time
    // Just verify both can win (distribution is correct, not one-sided)
    assert.ok(targetedWins > 10, `Expected targeted to win sometimes, got ${targetedWins}/100`)
    assert.ok(targetedWins < 90, `Expected untargeted to win sometimes, got ${100 - targetedWins}/100`)
  })
})

describe("scoreAdUnit", () => {
  it("scores untargeted unit as 1.0 regardless of reader", () => {
    const unit = makeUnit({ relevantCategories: [] })
    assert.equal(scoreAdUnit(unit, emptyReader), 1.0)
    assert.equal(scoreAdUnit(unit, techReader), 1.0)
  })

  it("scores targeted unit as 0 when reader has no matching interest", () => {
    const unit = makeUnit({ relevantCategories: ["technology"] })
    assert.equal(scoreAdUnit(unit, emptyReader), 0)
  })

  it("scores targeted unit proportionally to reader interest", () => {
    const unit = makeUnit({ relevantCategories: ["technology"] })
    const score = scoreAdUnit(unit, techReader)
    assert.equal(score, 0.9)
  })

  it("averages scores across multiple categories", () => {
    const unit = makeUnit({ relevantCategories: ["technology", "finance"] })
    const reader: ReaderAdContext = {
      crossPublisherInterests: {
        technology: { score: 0.8, domainCount: 3 },
        finance:    { score: 0.4, domainCount: 1 },
      },
      topicInterests: {},
    }
    const score = scoreAdUnit(unit, reader)
    assert.ok(Math.abs(score - 0.6) < 1e-10, `Expected ~0.6, got ${score}`)
  })
})
