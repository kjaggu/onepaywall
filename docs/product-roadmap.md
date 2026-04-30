# OnePaywall — Media Monetization Platform Roadmap

**Vision:** Plug-and-play media monetization for small & medium publishers — one embed script, zero third-party integrations.

> Clevertap + Google Analytics + Membership Management + Ad Network + Lead Management — built for publications.

**Network-effect moat:** Every publisher that installs the OnePaywall embed contributes to a shared, anonymized reader interest graph. Better data → smarter ad targeting and gate decisions → better ROI → more publisher onboarding.

---

## Current State

| Pillar | Analogue | Status |
|--------|----------|--------|
| Reader Intelligence | Clevertap | **Phase 1 complete** — profile computation, cross-publisher graph, content classification |
| Media Analytics | Google Analytics | 30% — gate analytics only; full dashboard is Phase 2 |
| Ad Intelligence | Ad Network | 20% — schema only; delivery engine is Phase 3 |
| Monetization Suite | Membership + Ecommerce | 70% — subscriptions + pay-per-article done; lead capture + digital products are Phase 4 |

---

## Phase 1 — Intelligence Foundation ✅ Complete

Reader profiling engine and cross-publisher interest graph. Prerequisite for smart ad targeting, segment-aware gates, and meaningful analytics.

**Delivered:**
- `lib/intelligence/classifyContent.ts` — URL keyword classifier → 10 content categories (technology, finance, sports, entertainment, politics, health, lifestyle, education, business, travel). Caches results in `content_classifications` table; re-classifies stale entries after 30 days.
- `lib/intelligence/computeProfile.ts` — Async profile computation for a reader:
  - Engagement score (weighted read time + scroll depth with time decay)
  - Ad completion rate from gate_events
  - Topic interests (cross-publisher, time-decayed: 30d→50%, 60d→20%)
  - Cross-publisher interests (topic + domain count, for advertiser targeting)
  - Visit frequency (one_time / occasional / weekly / daily)
  - Segment (new / casual / regular / power_user)
  - Monetization probability: `0.35×engagement + 0.25×ad_rate + 0.20×visit_freq + 0.10×topic_depth + 0.10×domain_breadth`
- `app/api/cron/compute-profiles/route.ts` — Batch recomputes stale profiles (100 at a time). HTTP GET, gated by CRON_SECRET in production. Compatible with Trigger.dev (recommended) or any HTTP scheduler.
- `lib/gates/evaluate.ts` — Extended `TriggerConditions` with `minMonetizationProbability` and `readerSegments` so gates can target specific reader segments.
- Trigger wiring: profile recomputes every 5th signal; on `gate_passed` and `ad_complete` events.
- `app/api/embed/gate-check` — Now fetches and passes reader profile to gate evaluation; returns `readerSegment` + `monetizationProbability` in response.
- `db/migrations/0014_reader_intelligence.sql` — Adds `cross_publisher_interests`, `profile_version` columns; performance indexes.

**Trigger.dev note:** Set up Trigger.dev instead of Vercel cron for the compute-profiles job. The cron endpoint at `/api/cron/compute-profiles` is a plain HTTP handler — register it as a Trigger.dev scheduled job. Additionally, define event-triggered jobs (on `signal` + high-value gate events) for near-real-time profile updates.

---

## Phase 2 — Media Analytics Dashboard (GA Replacement)

Replace Google Analytics for publishers. Gives publishers a reason to install the embed even without a paywall.

**Deliverables:**
1. New embed event types: `page_view`, `read_complete` — funneled into `gate_events` or a new `page_events` table.
2. `/app/(dashboard)/analytics/content/` — Top content by views, avg read time, scroll depth, gate conversion rate per article. Replaces the need for GA content reports.
3. Source attribution: referrer → domain breakdown with reader quality score per source (high-intent readers from referrer X).
4. Reader journey funnel: new reader → repeat reader → gate shown → converted.
5. `/app/(dashboard)/audience/` page rewrite — uses computed `reader_profiles`: segment distribution, topic interest treemap, monetization probability histogram, visit frequency breakdown.
6. Real-time reader count: last 30 min active sessions from `reader_tokens.updatedAt`.
7. Domain-level analytics deep-dive: `/analytics/[domainId]` — content breakdown for one domain.

**Schema changes needed:**
- `page_events` table (or extend `gate_events`) for `page_view` + `read_complete` event types
- `source_stats` rollup (daily per-domain per-referrer)

---

## Phase 3 — Ad Intelligence (the 80% market)

Complete the ad delivery stack with contextual + behavioral targeting. Unblocks publishers whose entire business model is ad-supported.

**Deliverables:**
1. `lib/ads/networks/adsense.ts` — Google AdSense adapter (slot injection, revenue reporting).
2. `lib/ads/networks/gam.ts` — Google Ad Manager adapter (DFP line item targeting, creative serving).
3. `lib/ads/rotate.ts` — Ad selection engine: score each publisher ad unit against `reader.crossPublisherInterests × ad.relevantCategories × ad.weight`. Returns ranked ad unit ID for the gate-check response.
4. `/api/embed/gate-check` — Extend to include `selectedAdUnitId` in the ad step config (pre-selected server-side based on reader profile).
5. Ad performance analytics: impressions, clicks, completions, skip rate — per ad unit, per reader segment, per content category.
6. `/app/(dashboard)/ads/inventory/` — Fill rate, CPM, estimated revenue per ad unit.
7. Publisher ad network credential UI: `/app/(dashboard)/ads/networks/` (currently scaffolded only).

---

## Phase 4 — Lead Capture + Digital Products

Two missing monetization primitives that complete the publisher toolkit.

**Deliverables:**
1. New `step_type`: `lead_capture` — Email + name form, GDPR consent checkbox, configurable title/CTA. On submit: creates `reader_subscribers` record with `source = 'lead_capture'`. Unlock type: new `lead_capture` enum value.
2. New `step_type`: `digital_product` — Pay-per-download for research reports, e-books. New `publisher_digital_products` table (R2 file key, price, description, download count). Unlock grants a signed download URL.
3. CRM-lite: `/app/(dashboard)/subscribers/` extension — segment filter (subscription | lead | manual), tag system, bulk export (CSV), notes field.
4. Outbound webhook integrations: fire on `lead_captured` event to Mailchimp, ConvertKit, or any Zapier webhook URL configured per publisher.

**Schema changes needed:**
- Add `lead_capture` to `unlock_type` enum
- `publisher_digital_products` table
- `subscriber_tags` table (many-to-many with `reader_subscribers`)
- `publisher_webhooks` table (url, event, active)

---

## Phase 5 — Audience Marketplace (Network Effect Monetization)

Monetize the cross-publisher intelligence graph for advertisers. This is the long-term moat.

**Deliverables:**
1. Advertiser portal — view anonymized, aggregated audience segments (e.g. "fintech readers: 45K across 12 publishers").
2. Inventory marketplace — publishers list ad inventory (slots, formats, CPM floor); advertisers book direct.
3. Programmatic fallback — if direct inventory unfilled, fall back to network (AdSense/GAM).
4. Revenue share — OnePaywall takes platform cut (configurable %) from marketplace ad bookings.
5. Audience export for DSPs — anonymized segment data exportable to programmatic demand platforms.

---

## Technical Notes

### Profile computation triggers
| Event | Action |
|-------|--------|
| Every 5th page signal for a reader | `scheduleProfileCompute(readerId)` — background |
| `gate_passed` event | `scheduleProfileCompute(readerId)` — background |
| `ad_complete` event | `scheduleProfileCompute(readerId)` — background |
| Daily cron (Trigger.dev) | Batch recompute all stale profiles |

### Gate intelligence conditions (Phase 1)
Gate `triggerConditions` now supports:
```json
{
  "minMonetizationProbability": 0.5,
  "readerSegments": ["regular", "power_user"]
}
```
These conditions are ignored if the reader has no computed profile yet (new readers always see gates).

### Content classification
- 10 categories, keyword-based (no external API, zero latency)
- Cached in `content_classifications` table; 30-day TTL
- Batch-fetched per computation cycle to minimize DB round trips
- Phase 3 upgrade path: replace keyword scorer with a Claude API call for higher-confidence classification on ambiguous URLs

### Key files added / modified in Phase 1
| File | Change |
|------|--------|
| `lib/intelligence/classifyContent.ts` | New — URL classifier |
| `lib/intelligence/computeProfile.ts` | New — profile computation engine |
| `lib/db/queries/reader-intelligence.ts` | Extended — `getReaderProfile`, `getStalePotentialProfileReaderIds` |
| `app/api/cron/compute-profiles/route.ts` | New — batch cron handler |
| `lib/gates/evaluate.ts` | Extended — `minMonetizationProbability`, `readerSegments` conditions |
| `app/api/embed/signal/route.ts` | Extended — trigger every 5th visit |
| `app/api/embed/event/route.ts` | Extended — trigger on gate_passed/ad_complete |
| `app/api/embed/gate-check/route.ts` | Extended — pass profile to gate eval; return segment in response |
| `lib/db/schema.ts` | Extended — `crossPublisherInterests`, `profileVersion` on `readerProfiles` |
| `db/migrations/0014_reader_intelligence.sql` | New — columns + indexes |
