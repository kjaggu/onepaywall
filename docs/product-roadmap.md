# OnePaywall — Media Monetization Platform Roadmap

**Vision:** Plug-and-play media monetization for small & medium publishers — one embed script, zero third-party integrations.

> Clevertap + Google Analytics + Membership Management + Ad Network + Lead Management + Mailchimp — built for publications.

**Network-effect moat:** Every publisher that installs the OnePaywall embed contributes to a shared, anonymized reader interest graph. Better data → smarter ad targeting and gate decisions → better ROI → more publisher onboarding.

---

## Current State

| Pillar | Analogue | Status |
|--------|----------|--------|
| Reader Intelligence | Clevertap | **Phase 1 complete** — profile computation, cross-publisher graph, content classification |
| Media Analytics | Google Analytics | **Phase 2 complete** — content analytics, source attribution, reader journey funnel, audience profiles |
| Ad Intelligence | Ad Network | **Phase 3 complete** — ad selection engine, direct ad rendering, network adapters, analytics |
| Monetization Suite | Membership + Ecommerce | 70% — subscriptions + pay-per-article done; lead capture + digital products are Phase 4 |
| Publisher Email | Mailchimp | Planned — Phase 5 |

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

## Phase 2 — Media Analytics Dashboard (GA Replacement) ✅ Complete

Replace Google Analytics for publishers. Gives publishers a reason to install the embed even without a paywall.

**Delivered:**
| File | Change |
|------|--------|
| `db/migrations/0015_page_events.sql` | New — `page_events` + `source_stats` tables with indexes |
| `lib/db/schema.ts` | Extended — `pageEvents`, `sourceStats` Drizzle table definitions |
| `app/api/embed/page-event/route.ts` | New — POST endpoint; validates token, classifies URL, inserts page_events (fire-and-forget) |
| `public/embed/embed.js` | Extended — `sendPageEvent` helper; `page_view` fires after token resolved; `read_complete` polls every 5s (scrollDepth ≥80% + elapsed ≥30s) |
| `lib/analytics/source-stats.ts` | New — lazy rollup: joins reader_page_visits + reader_profiles, upserts into source_stats |
| `lib/db/queries/content-analytics.ts` | New — 8 query functions: getTopContent, getSourceAttribution, getReaderJourneyFunnel, getActiveReaderCount, getSegmentDistribution, getTopicInterestDistribution, getMonetizationHistogram, getVisitFrequencyBreakdown |
| `app/(dashboard)/analytics/content/page.tsx` | New — content analytics page: active reader chip, reader journey funnel, top content table, source attribution with quality score |
| `app/(dashboard)/audience/page.tsx` | Rewritten — segment distribution, topic interests, monetization histogram, visit frequency (all from reader_profiles) |
| `app/(dashboard)/analytics/[domainId]/page.tsx` | Extended — top 10 content section + "See all" link to /analytics/content |
| `components/dashboard/sidebar.tsx` | Extended — "Content" nav link added under Measure group |

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

## Phase 5 — Publisher Email & Automation

One-stop email for small publishers: send campaigns and trigger-based automations from their own domain,
pre-segmented by the behavioral data OnePaywall already collects.

**Differentiator vs Mailchimp:** segments are auto-built from `reader_profiles` (engagement score, visit frequency,
ad interactions, gate events, topic interests) — publisher clicks send, not configure.

### Day-1 automation triggers
| Trigger | When it fires |
|---------|--------------|
| `new_subscriber` | reader_subscribers row created (any source: gate, subscription, newsletter optin) |
| `segment_entered` | reader profile segment changes (new→casual, casual→regular, etc.) |
| `ad_engaged` | `ad_complete` or `ad_click` gate_event for this publisher |
| `inactivity` | no page signal in N days (configurable; default 14) — re-engagement |

### Email capture touchpoints
1. Lead capture gate step (Phase 4) — creates `reader_subscribers` with `source = 'lead_capture'`
2. Subscription checkout — email already stored in `reader_subscribers`
3. New `newsletter_optin` gate step type — free sign-up, no paywall, opt-in only

### Segment filter (campaigns + automations)
```json
{
  "segment": "power_user",
  "minMonetizationProbability": 0.5,
  "topicInterest": "technology",
  "source": "lead_capture",
  "subscriptionStatus": "active",
  "adEngaged": true
}
```
All fields optional; null filter = all active (non-unsubscribed) subscribers.

### Deliverables

#### Schema — `db/migrations/0018_email_automation.sql`
- `publisher_email_configs` — Resend API key (encrypted via `PG_ENCRYPTION_KEY`), from_name, from_email, domain_verified_at
- Extend `reader_subscribers` — add `unsubscribe_token UUID`, `unsubscribed_at TIMESTAMPTZ`
- `publisher_email_campaigns` — broadcast sends; `segment_filter JSONB`, status lifecycle (draft→scheduled→sending→sent)
- `publisher_email_automations` — trigger_type, trigger_config JSONB, subject/body, status (draft→active→paused)
- `email_automation_runs` — dedup log (unique per automation+subscriber+day); prevents duplicate sends
- `email_events` — open/click/bounce/complaint per send (campaign or automation run)

#### `lib/email/`
| File | Responsibility |
|------|---------------|
| `provider.ts` | `sendEmail(...)` via Resend SDK — interface abstraction; swap to SES later without touching callers |
| `segments.ts` | `getSubscribersForFilter(publisherId, filter)` — joins reader_subscribers + reader_profiles; excludes unsubscribed |
| `tracking.ts` | `injectTracking(html, campaignId, subscriberId)` — wraps links + inserts 1×1 pixel |
| `unsubscribe.ts` | `handleUnsubscribe(token)` — sets unsubscribed_at; returns publisher context for confirmation page |
| `automations/engine.ts` | `evaluateAutomations(publisherId, event)` — queries matching active automations, deduplicates via email_automation_runs, enqueues sends |
| `automations/triggers.ts` | Per-trigger condition matchers |

#### API routes
| Route | Purpose |
|-------|---------|
| `POST /api/email/send-campaign` | Internal — called by Trigger.dev job; batch-sends via Resend (50/batch) |
| `GET  /api/email/track/open/[token]` | 1×1 pixel; writes `email_events` type=opened |
| `GET  /api/email/track/click/[token]` | Redirect proxy; writes `email_events` type=clicked |
| `GET  /api/email/unsubscribe/[token]` | One-click unsubscribe; renders confirmation page |
| `POST /api/email/verify-domain` | Polls Resend for DKIM/SPF status; updates `publisher_email_configs` |
| `POST /api/email/webhook` | Resend webhook — handles bounces + complaints → auto-suppress |

#### Dashboard UI — `/app/(dashboard)/email/`
| Route | Content |
|-------|---------|
| `/email/` | Hub: subscriber count chip, last campaign stats, active automation count |
| `/email/campaigns/` | List + create Sheet; subject, body HTML, segment picker, schedule datetime |
| `/email/automations/` | List with active/paused toggle; create Sheet: trigger, delay, subject/body |
| `/email/settings/` | Resend API key input, from_name/email, DNS instructions + live DKIM/SPF status chip |
| `/subscribers/` | Extend existing CRM — unsubscribed_at column, email source badge |

#### Trigger.dev jobs
| Job | Trigger |
|-----|---------|
| `email-send-campaign` | On-demand when campaign status → sending; batch 50/call with 1s delay |
| `email-evaluate-automations` | Called from existing signal/event jobs after profile recompute |
| `email-inactivity-check` | Daily cron; finds subscribers with no page_signal in configured N days |

### Privacy
- `unsubscribe_token` is a random UUID (not reader_id); cannot reverse-engineer identity
- One-click unsubscribe link mandatory in every email footer
- Bounce + complaint webhook from Resend → immediate suppression, no publisher action required
- `resend_api_key` encrypted at rest via existing `PG_ENCRYPTION_KEY` pattern

### Integration points in existing code
| File | Change |
|------|--------|
| `app/api/embed/event/route.ts` | After gate_event write, call `evaluateAutomations` for `ad_engaged` trigger |
| `app/api/embed/lead-capture/route.ts` | After reader_subscribers insert, call `evaluateAutomations` for `new_subscriber` |
| `lib/intelligence/computeProfile.ts` | After segment changes, call `evaluateAutomations` for `segment_entered` |

---

## Phase 6 — Audience Marketplace (Network Effect Monetization)

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
