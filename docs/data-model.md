# OnePaywall — Data Model

This document defines every core entity, its fields, and the business rules that govern it. The canonical SQL lives in `db/schema.sql`. Drizzle schema definitions live in `lib/db/schema.ts`.

---

## Entity overview

```
publishers
    │
    ├── publisher_members (users ↔ publishers)
    │
    ├── domains
    │     └── gates
    │           └── gate_steps          ← ordered step flow
    │
    ├── publisher_subscriptions (to OnePaywall plans)
    ├── publisher_pg_configs (platform or own PG keys)
    ├── publisher_ad_networks (Google AdSense / GAM account connections)
    └── ad_units (direct uploads or network ad slots)

users (superadmins + publisher team members)

readers (anonymous)
    ├── reader_tokens (per domain)
    ├── gate_unlocks (per gate, per reader)
    ├── reader_page_visits (raw page-level signals, 90-day retention)
    └── reader_profiles (computed scores + segments, derived from signals)

content_classifications (cached topic taxonomy per URL)

ad_units (owned by publisher)

gate_events (append-only analytics)
analytics_rollups (derived, daily)

plans (OnePaywall plans)
razorpay_webhook_events (idempotency log)
```

---

## Entities

### `users`

OnePaywall platform users. Superadmins and publisher team members only. Readers are never users.

```ts
id            uuid  PK  default gen_random_uuid()
email         text  NOT NULL  UNIQUE
passwordHash  text  NOT NULL
platformRole  text  NOT NULL  default 'publisher'   // 'superadmin' | 'publisher'
fullName      text
avatarUrl     text
createdAt     timestamptz  NOT NULL  default now()
updatedAt     timestamptz  NOT NULL  default now()
deletedAt     timestamptz
```

Rules:
- `platformRole = 'superadmin'` grants full platform access. Only set via direct DB or a superadmin promotion flow — never via API.
- Soft-delete only. Deleted users lose session access but records are preserved.
- A `publisher` user with zero `publisher_members` rows has no dashboard access.

---

### `publishers`

A publisher entity — a company, brand, or individual who owns domains. This is the top-level tenant.

```ts
id         uuid  PK  default gen_random_uuid()
name       text  NOT NULL
slug       text  NOT NULL  UNIQUE    // URL-safe, immutable after creation
logoUrl    text
createdAt  timestamptz  NOT NULL  default now()
updatedAt  timestamptz  NOT NULL  default now()
deletedAt  timestamptz
```

Rules:
- `slug` is immutable after creation.
- Soft-delete only.

---

### `publisher_members`

Links users to publishers with a role. A user can be a member of multiple publishers.

```ts
id           uuid  PK  default gen_random_uuid()
publisherId  uuid  NOT NULL  FK → publishers.id
userId       uuid  NOT NULL  FK → users.id
role         text  NOT NULL  default 'member'   // 'owner' | 'admin' | 'member'
createdAt    timestamptz  NOT NULL  default now()
UNIQUE (publisherId, userId)
```

Roles:
- `owner` — created with the publisher; can manage billing, delete publisher, manage all members.
- `admin` — can manage domains, gates, ads, and non-owner members.
- `member` — read-only: dashboards and analytics.

Rules:
- Every publisher must have exactly one `owner` at all times.
- Superadmins have implicit access to all publishers without a `publisher_members` row.

---

### `domains`

A website or app property owned by a publisher. The unit of embed integration.

```ts
id             uuid  PK  default gen_random_uuid()
publisherId    uuid  NOT NULL  FK → publishers.id
name           text  NOT NULL
domain         text  NOT NULL  UNIQUE    // e.g. "techblog.com" — no protocol, no trailing slash
siteKey        text  NOT NULL  UNIQUE    // format: "sk_<24 random chars>", immutable
embedEnabled   boolean  NOT NULL  default false
createdAt      timestamptz  NOT NULL  default now()
updatedAt      timestamptz  NOT NULL  default now()
deletedAt      timestamptz
```

Rules:
- `siteKey` is generated on creation and never changes. It is the credential for the embed script.
- `domain` is normalised on write: lowercase, strip protocol, strip trailing slash.
- `embedEnabled = false` → embed returns pass-through for all readers (gate not shown). Use to pause without deleting.
- Soft-delete only.

---

### `gates`

A monetization checkpoint on a domain. A domain can have multiple gates evaluated by priority.

```ts
id          uuid  PK  default gen_random_uuid()
domainId    uuid  NOT NULL  FK → domains.id
name        text  NOT NULL
priority    int   NOT NULL  default 0    // higher = evaluated first when multiple gates match
enabled     boolean  NOT NULL  default true
createdAt   timestamptz  NOT NULL  default now()
updatedAt   timestamptz  NOT NULL  default now()
deletedAt   timestamptz
```

### `gate_rules`

URL patterns that determine when a gate applies.

```ts
id         uuid  PK  default gen_random_uuid()
gateId     uuid  NOT NULL  FK → gates.id
pattern    text  NOT NULL               // glob, e.g. "/articles/*"
matchType  text  NOT NULL  default 'path_glob'   // 'path_glob' | 'content_type'
createdAt  timestamptz  NOT NULL  default now()
```

Rules:
- A gate with no rules applies to all content on the domain.
- When multiple gates match a request, the highest-priority gate wins.

---

### `gate_steps`

Ordered steps within a gate. Steps execute sequentially. Before showing a step, the engine evaluates the step's own `triggerConditions` — if not met, the step is auto-skipped (its `onSkip` outcome is applied without displaying anything). If conditions are met, the step is shown and the reader's action determines `onSkip` or `onDecline`.

```ts
id                 uuid  PK  default gen_random_uuid()
gateId             uuid  NOT NULL  FK → gates.id
stepOrder          int   NOT NULL               // 1-based; app enforces no gaps
stepType           text  NOT NULL               // 'ad' | 'subscription_cta' | 'one_time_unlock'
config             jsonb NOT NULL  default '{}'
triggerConditions  jsonb NOT NULL  default '{}'  // step-level conditions; empty = always show
onSkip             text  NOT NULL  default 'proceed'    // 'proceed' | 'next_step'
onDecline          text  NOT NULL  default 'next_step'  // 'proceed' | 'next_step'
createdAt          timestamptz  NOT NULL  default now()
updatedAt          timestamptz  NOT NULL  default now()
```

#### Step types and their `config` schemas

**`ad`**
```json
{
  "adUnitIds": ["uuid", "..."],
  "unlockDurationSeconds": 3600
}
```
- `adUnitIds`: pool of `ad_units` to rotate (by weight). Must belong to the same publisher. Mix of direct and network units is allowed.
- `skipAfterSeconds` is defined per `ad_unit`, not here — each unit can have its own skip behaviour.
- `unlockDurationSeconds`: 0 = session-only; N = unlocked for N seconds after the ad step completes.

**`subscription_cta`**
```json
{
  "heading": "Read unlimited articles",
  "subtext": "Subscribe from ₹99/month",
  "ctaLabel": "Subscribe now",
  "ctaUrl": "https://publisher.com/subscribe",
  "discounted": false
}
```
- `discounted`: if true, rendered as a discounted/special offer variant (e.g. gate 4's first step).
- No subscription verification happens here — this step only shows a CTA that links out.

**`one_time_unlock`**
```json
{
  "priceInPaise": 499,
  "label": "Unlock this article for ₹4.99",
  "unlockDurationSeconds": 86400
}
```
- Triggers a Razorpay one-time payment flow.
- On successful payment, a `gate_unlock` row is created for this reader + gate + content.

#### Canonical gate examples

**Gate 1 — First visit, soft subscription prompt**
```
gate trigger:  { visitorType: 'first_time' }
step 1: subscription_cta   stepTrigger: {}   onSkip=proceed   onDecline=proceed
```

**Gate 2 — First visit, ad**
```
gate trigger:  { visitorType: 'first_time' }
step 1: ad   stepTrigger: {}   onSkip=proceed   onDecline=proceed
```

**Gate 3 — Repeat visitor, subscription then ad**
```
gate trigger:  { visitorType: 'repeat' }
step 1: subscription_cta   stepTrigger: {}              onSkip=next_step   onDecline=next_step
step 2: ad                 stepTrigger: {}              onSkip=proceed     onDecline=proceed
```

**Gate 4 — Repeat visitor, full publisher-configured funnel**
```
gate trigger:  { visitorType: 'repeat' }
step 1: subscription_cta (discounted=true)   stepTrigger: { minVisitCount: 5 }   onSkip=next_step   onDecline=next_step
step 2: one_time_unlock                      stepTrigger: {}                      onSkip=next_step   onDecline=next_step
step 3: ad                                   stepTrigger: {}                      onSkip=proceed     onDecline=proceed
```
*If visitCount < 5, step 1 auto-skips → reader sees one_time_unlock first, then ad.*

**Gate 5 — Geo-targeted funnel (publisher custom)**
```
gate trigger:  { visitorType: 'any' }
step 1: subscription_cta   stepTrigger: { geo: ['IN'], minVisitCount: 3 }   onSkip=next_step   onDecline=next_step
step 2: ad                 stepTrigger: {}                                   onSkip=proceed     onDecline=proceed
```
*Indian readers with 3+ visits see subscription CTA first. All others jump straight to the ad.*

---

### Trigger conditions

The same `triggerConditions` JSONB schema applies at **both** the gate level and the step level.

- **Gate-level** (`gates.triggerConditions`): determines whether the gate fires at all for this reader + content combination.
- **Step-level** (`gate_steps.triggerConditions`): determines whether an individual step is shown. If conditions are not met, the step is silently skipped (its `onSkip` outcome is applied).

An empty object `{}` means "always match."

```json
{
  "visitorType": "first_time" | "repeat" | "any",
  "minVisitCount": 3,
  "maxVisitCount": 10,
  "deviceType": "mobile" | "desktop" | "any",
  "geo": ["IN", "US"],
  "hasCompletedGate": "gate-uuid"
}
```

#### Session / visit conditions

| Condition | Type | Meaning |
|-----------|------|---------|
| `visitorType` | string | `first_time` = no prior token on this domain; `repeat` = has prior token |
| `minVisitCount` | int | Step/gate only fires after N page visits on this domain |
| `maxVisitCount` | int | Step/gate stops firing after N page visits on this domain |
| `deviceType` | string | `mobile` \| `desktop` \| `tablet` \| `any` |
| `geo` | string[] | ISO country codes; empty = any |
| `hasCompletedGate` | uuid | Only fires if reader has previously passed the referenced gate |

#### Reader intelligence conditions (from `reader_profiles`)

| Condition | Type | Meaning |
|-----------|------|---------|
| `readerSegment` | string[] | Match if reader's segment is in list: `new`, `casual`, `regular`, `power_user` |
| `minEngagementScore` | float | Reader's `engagementScore` must be ≥ value (0–1) |
| `maxEngagementScore` | float | Reader's `engagementScore` must be ≤ value (0–1) |
| `minAdCompletionRate` | float | Reader's historical ad completion rate ≥ value |
| `maxAdCompletionRate` | float | Reader's historical ad completion rate ≤ value |
| `minMonetizationProbability` | float | Reader's monetization probability ≥ value |
| `topicInterests` | string[] | Reader has interest score > 0.4 in at least one of the listed topics |
| `visitFrequency` | string[] | `unknown`, `one_time`, `occasional`, `weekly`, `daily` |
| `minTotalDomains` | int | Reader has visited N+ distinct OnePaywall-enabled domains |

#### Example — intelligence-driven gate configuration

**Show subscription CTA to highly engaged readers; show ad to everyone else:**
```json
// Gate A (priority 10): subscription CTA for engaged readers
{
  "visitorType": "any",
  "readerSegment": ["regular", "power_user"],
  "minEngagementScore": 0.6
}

// Gate B (priority 5): ad gate fallback
{
  "visitorType": "any"
}
```

**Show discounted offer to readers with low ad completion but high engagement:**
```json
{
  "minEngagementScore": 0.5,
  "maxAdCompletionRate": 0.3
}
```

**Target tech-interested readers with a relevant subscription:**
```json
{
  "topicInterests": ["technology", "ai"],
  "readerSegment": ["regular", "power_user"]
}
```

Rules:
- All specified conditions must pass (AND logic). For OR logic, use multiple gates with different priorities.
- Intelligence conditions require a computed `reader_profiles` row. If no profile exists yet (new reader), intelligence conditions are treated as unmet — the gate skips to the next priority gate or falls back to a no-condition gate.
- New condition types can be added to the JSONB schema without a migration. The evaluation engine in `/lib/gates` must handle unknown keys gracefully (ignore them).
- Conditions are evaluated **server-side only**. The embed script never receives raw `triggerConditions` or reader profile data.

#### Example: step-level conditions

**Show discounted subscription CTA only after 5 visits:**
```json
// gate_steps.triggerConditions
{ "minVisitCount": 5 }
```

**Show ad only on mobile:**
```json
{ "deviceType": "mobile" }
```

**Show one-time unlock only to Indian readers who've visited 3+ times:**
```json
{ "geo": ["IN"], "minVisitCount": 3 }
```

---

### `readers`

Anonymous reader identities tracked across domains. Never stores PII.

```ts
id            uuid  PK  default gen_random_uuid()
fingerprint   text  NOT NULL  UNIQUE    // server-computed hash
createdAt     timestamptz  NOT NULL  default now()
lastSeenAt    timestamptz  NOT NULL  default now()
```

Rules:
- Created on first gate check for an unknown fingerprint.
- `fingerprint` is computed server-side. Never trust a client-supplied fingerprint.
- Do not store IP addresses. The fingerprint is derived from but does not contain the raw IP.

---

### `reader_tokens`

Per-domain session token issued to a reader's browser cookie.

```ts
id          uuid  PK  default gen_random_uuid()
readerId    uuid  NOT NULL  FK → readers.id
domainId    uuid  NOT NULL  FK → domains.id
token       text  NOT NULL  UNIQUE
visitCount  int   NOT NULL  default 1
expiresAt   timestamptz  NOT NULL
createdAt   timestamptz  NOT NULL  default now()
updatedAt   timestamptz  NOT NULL  default now()
UNIQUE (readerId, domainId)
```

- `visitCount` increments on each new page gate check. Used to evaluate `minVisitCount` triggers.

---

### `gate_unlocks`

Records that a reader has completed a gate step and earned access.

```ts
id           uuid  PK  default gen_random_uuid()
readerId     uuid  NOT NULL  FK → readers.id
gateId       uuid  NOT NULL  FK → gates.id
contentId    text             // null = domain-wide unlock; set = specific URL/content
unlockType   text  NOT NULL   // 'ad_completion' | 'one_time_payment' | 'subscription'
expiresAt    timestamptz      // null = session-only
createdAt    timestamptz  NOT NULL  default now()
```

Rules:
- A valid unlock: `readerId` matches, `gateId` matches, `contentId` matches (or is null), `expiresAt > now()` (or is null for session).
- Insert new rows per unlock event — never update existing rows.

---

### `reader_page_visits`

Raw page-level signals collected by the embed script on every page load. The foundation of the reader intelligence layer.

```ts
id              uuid  PK  default gen_random_uuid()
readerId        uuid  NOT NULL  FK → readers.id
domainId        uuid  NOT NULL  FK → domains.id
url             text  NOT NULL             // full page URL (path + query, no fragment)
contentCategory text                       // resolved from content_classifications
readTimeSeconds int                        // time on page before navigating away / closing
scrollDepthPct  int                        // max scroll depth as % of page height (0–100)
deviceType      text  NOT NULL             // 'mobile' | 'desktop' | 'tablet'
referrer        text                       // document.referrer — origin only, no path
occurredAt      timestamptz  NOT NULL  default now()
```

Rules:
- Written by the embed script on page unload (via `navigator.sendBeacon`).
- `url` is stripped of PII-bearing query params (e.g. `?email=`, `?token=`) before storage. Strip list is configurable in `/lib/intelligence/sanitize.ts`.
- `referrer` stores origin only (`https://google.com`), never the full referring URL.
- **Retention: hard-deleted after 90 days.** A scheduled job runs nightly: `DELETE FROM reader_page_visits WHERE occurred_at < now() - interval '90 days'`.
- Never join this table in user-facing queries. It is input to profile computation only.

---

### `content_classifications`

Cached topic taxonomy for a URL. Computed once and reused across all readers who visit the same page.

```ts
id          uuid  PK  default gen_random_uuid()
url         text  NOT NULL  UNIQUE       // normalised URL (no query string, no fragment)
categories  text[]  NOT NULL  default '{}'   // e.g. ['technology', 'ai', 'startups']
confidence  float   NOT NULL  default 1.0   // 0–1; low confidence = re-classify on next visit
classifiedAt  timestamptz  NOT NULL  default now()
```

Classification sources (in priority order):
1. Open Graph / meta tags (`og:section`, `article:tag`, `keywords`)
2. URL path pattern matching (e.g. `/technology/`, `/sports/`)
3. Page title keyword extraction (fallback)

Rules:
- Classification runs server-side when a `reader_page_visit` arrives with no matching cached entry.
- Entries with `confidence < 0.5` are re-classified on the next visit to the same URL.
- Cache entries older than 30 days are re-classified on next visit.

Supported top-level categories: `technology`, `finance`, `sports`, `entertainment`, `politics`, `health`, `lifestyle`, `education`, `business`, `travel`.

---

### `reader_profiles`

Computed aggregate profile per reader. Derived from `reader_page_visits` and `gate_events`. This is what the gate evaluation engine reads — never the raw signals tables.

```ts
id                      uuid  PK  default gen_random_uuid()
readerId                uuid  NOT NULL  FK → readers.id  UNIQUE
segment                 text  NOT NULL  default 'new'
  -- 'new'           : < 3 page visits total
  -- 'casual'        : 3–10 visits, low engagement
  -- 'regular'       : 10–50 visits OR high engagement on fewer visits
  -- 'power_user'    : 50+ visits OR very high engagement
engagementScore         float  NOT NULL  default 0.0   // 0–1; weighted: read time + scroll + return frequency
adCompletionRate        float  NOT NULL  default 0.0   // 0–1; completed ads / total ads shown
monetizationProbability float  NOT NULL  default 0.0   // 0–1; ML-derived or heuristic (see below)
topicInterests          jsonb  NOT NULL  default '{}'  // { "technology": 0.8, "finance": 0.3, ... }
visitFrequency          text   NOT NULL  default 'unknown'
  -- 'unknown' | 'one_time' | 'occasional' | 'weekly' | 'daily'
totalVisits             int    NOT NULL  default 0
totalDomains            int    NOT NULL  default 0     // number of distinct OnePaywall domains visited
lastComputedAt          timestamptz  NOT NULL  default now()
createdAt               timestamptz  NOT NULL  default now()
updatedAt               timestamptz  NOT NULL  default now()
```

#### `monetizationProbability` — heuristic model (v1)

Until enough data exists to train a real model, derive this score from observable signals:

```
score = (
  engagementScore * 0.35
  + adCompletionRate * 0.25
  + visitFrequencyScore * 0.20     // daily=1.0, weekly=0.6, occasional=0.3, one_time=0.1
  + topicDepthScore * 0.10         // how many distinct topics with interest > 0.5
  + multiDomainScore * 0.10        // log(totalDomains) / log(10), capped at 1.0
)
```

Replace with a trained model when sufficient data exists. The score interface doesn't change.

Rules:
- Recomputed asynchronously after every 5 new `reader_page_visits` for that reader, or after any `gate_event` of type `gate_passed` / `ad_complete`.
- Never block the embed gate-check request on profile computation. Read the last computed profile; enqueue recomputation.
- `topicInterests` weights decay over time — visits older than 30 days contribute at 50% weight; older than 60 days at 20%.

---

### `publisher_ad_networks`

Account-level connection between a publisher and an external ad network. One row per publisher per network.

```ts
id           uuid  PK  default gen_random_uuid()
publisherId  uuid  NOT NULL  FK → publishers.id
provider     text  NOT NULL   // 'google_adsense' | 'google_ad_manager'
credentials  jsonb NOT NULL  default '{}'   // AES-256 encrypted
active       boolean  NOT NULL  default true
createdAt    timestamptz  NOT NULL  default now()
updatedAt    timestamptz  NOT NULL  default now()
UNIQUE (publisherId, provider)
```

`credentials` schema by provider:

**`google_adsense`**
```json
{ "adClientId": "pub-0000000000000000" }
```

**`google_ad_manager`**
```json
{
  "networkCode": "123456789",
  "adUnitRootPath": "/123456789/site-name"
}
```

Rules:
- `credentials` is AES-256 encrypted using `PG_ENCRYPTION_KEY` (same key as PG secrets — both are publisher credentials).
- Decrypt only inside `/lib/ads/networks/` at render time. Never log or expose via API.
- Deactivating (`active = false`) suppresses all ad units under this connection without deleting them.

---

### `ad_units`

An individual ad unit — either a direct upload or a network ad slot. The atomic unit referenced by gate steps.

```ts
id            uuid  PK  default gen_random_uuid()
publisherId   uuid  NOT NULL  FK → publishers.id
name          text  NOT NULL
sourceType    text  NOT NULL   // 'direct' | 'network'
weight        int   NOT NULL  default 1   // relative rotation weight within a gate step

-- direct upload fields (null when sourceType = 'network')
mediaType     text             // 'image' | 'video'
storageKey    text             // internal object storage key (e.g. S3/R2 key)
cdnUrl        text             // public CDN URL for serving
ctaLabel      text
ctaUrl        text
skipAfterSeconds  int          // null = no skip; N = skip button appears after N seconds

-- network fields (null when sourceType = 'direct')
adNetworkId   uuid  FK → publisher_ad_networks.id
networkConfig jsonb            // ad slot / unit config; schema varies by provider (see below)

-- intelligence matching
relevantCategories  text[]  NOT NULL  default '{}'
  // topic categories this ad targets — matched against reader topicInterests for relevance scoring
  // e.g. ['technology', 'ai'] for a cloud software ad; [] = untagged, shown to any reader

active        boolean  NOT NULL  default true
createdAt     timestamptz  NOT NULL  default now()
updatedAt     timestamptz  NOT NULL  default now()
deletedAt     timestamptz
```

`networkConfig` schema by provider:

**`google_adsense`**
```json
{ "adSlotId": "1234567890" }
```
Rendered as: `<ins class="adsbygoogle" data-ad-client="{adClientId}" data-ad-slot="{adSlotId}" />`

**`google_ad_manager`**
```json
{
  "adUnitPath": "/123456789/site-name/article-top",
  "sizes": [[300, 250], [728, 90]]
}
```
Rendered via GPT: `googletag.defineSlot(adUnitPath, sizes, divId).addService(...)`

Rules:
- `sourceType = 'direct'`: `storageKey`, `cdnUrl`, `mediaType` are required. Network fields are null.
- `sourceType = 'network'`: `adNetworkId`, `networkConfig` are required. Direct fields are null.
- `storageKey` is the internal object storage reference used for deletion. `cdnUrl` is what the embed script uses.
- Direct upload `mediaType = 'video'`: must be a direct media file (mp4, webm). Reject watch-page URLs on write.
- Ad units belong to a publisher, not a domain — reusable across all domains within the publisher.
- `weight` is the base rotation weight. When reader intelligence is available, effective weight = `weight × relevanceScore`, where `relevanceScore` is the dot product of `relevantCategories` and the reader's `topicInterests`. Untagged ads (`relevantCategories = []`) use their base weight unchanged.
- Soft-delete only.

#### Embed rendering by source type

The embed script receives `sourceType` + the relevant config in the gate step payload and renders accordingly:

| sourceType | Render method |
|------------|---------------|
| `direct` / `image` | `<img>` + CTA button overlay |
| `direct` / `video` | `<video>` autoplay, muted; CTA after completion |
| `network` / `google_adsense` | Inject AdSense `<ins>` tag + AdSense script |
| `network` / `google_ad_manager` | Load GPT script, define slot, display |

The embed never receives raw `credentials` from `publisher_ad_networks` — only the resolved `networkConfig` values needed to render the tag (adClientId, adSlotId, adUnitPath etc. are not secret).

---

### `gate_events`

Append-only event log. Source of truth for all analytics.

```ts
id          uuid  PK  default gen_random_uuid()
domainId    uuid  NOT NULL  FK → domains.id
gateId      uuid  NOT NULL  FK → gates.id
stepId      uuid  FK → gate_steps.id    // null for gate-level events
readerId    uuid  FK → readers.id       // null if fingerprinting failed
eventType   text  NOT NULL
// 'gate_shown' | 'step_shown' | 'ad_start' | 'ad_complete' | 'ad_skip'
// | 'subscription_cta_click' | 'subscription_cta_skip'
// | 'one_time_unlock_start' | 'one_time_unlock_complete' | 'one_time_unlock_skip'
// | 'gate_passed'
adUnitId    uuid  FK → ad_units.id
contentId   text
metadata    jsonb  NOT NULL  default '{}'
occurredAt  timestamptz  NOT NULL  default now()   // always set server-side
```

Rules:
- Never update or delete rows.
- `occurredAt` is set server-side — never trust client timestamps.
- Write only via `/lib/analytics`, never from route handlers directly.

---

### `analytics_rollups`

Pre-computed daily aggregates from `gate_events`. Used for dashboard charts.

```ts
id              uuid  PK  default gen_random_uuid()
domainId        uuid  NOT NULL  FK → domains.id
gateId          uuid  FK → gates.id    // null = domain-level rollup
date            date  NOT NULL
impressions     int   NOT NULL  default 0
stepCompletions int   NOT NULL  default 0
gatePasses      int   NOT NULL  default 0
uniqueReaders   int   NOT NULL  default 0
createdAt       timestamptz  NOT NULL  default now()
updatedAt       timestamptz  NOT NULL  default now()
UNIQUE (domainId, gateId, date)
```

Rules:
- Computed on-demand (triggered after event ingestion), not on a cron.
- Use upsert (`INSERT ... ON CONFLICT DO UPDATE`).
- If corrupted, recompute from `gate_events` — rollups are a cache.

---

### `plans`

OnePaywall subscription plans available to publishers.

```ts
id                 uuid  PK  default gen_random_uuid()
name               text  NOT NULL
slug               text  NOT NULL  UNIQUE
priceMonthlyPaise  int   NOT NULL    // INR paise
domainLimit        int              // null = unlimited
gateLimit          int              // null = unlimited
active             boolean  NOT NULL  default true
createdAt          timestamptz  NOT NULL  default now()
updatedAt          timestamptz  NOT NULL  default now()
```

---

### `publisher_subscriptions`

A publisher's active subscription to a OnePaywall plan. Always billed through OnePaywall's own PG keys — never through the publisher's own keys.

```ts
id                      uuid  PK  default gen_random_uuid()
publisherId             uuid  NOT NULL  FK → publishers.id
planId                  uuid  NOT NULL  FK → plans.id
razorpaySubscriptionId  text  UNIQUE
status                  text  NOT NULL   // 'trialing' | 'active' | 'past_due' | 'cancelled'
currentPeriodStart      timestamptz
currentPeriodEnd        timestamptz
createdAt               timestamptz  NOT NULL  default now()
updatedAt               timestamptz  NOT NULL  default now()
```

---

### `publisher_pg_configs`

Payment gateway configuration for **reader monetization** (one-time unlocks, reader subscriptions). Each publisher either uses OnePaywall's platform PG account or provides their own credentials.

```ts
id             uuid  PK  default gen_random_uuid()
publisherId    uuid  NOT NULL  FK → publishers.id  UNIQUE
mode           text  NOT NULL  default 'platform'   // 'platform' | 'own'
provider       text  NOT NULL  default 'razorpay'   // 'razorpay' — extensible for future providers
keyId          text                                  // provider's public key; null if mode='platform'
keySecret      text                                  // AES-256 encrypted; null if mode='platform'
webhookSecret  text                                  // AES-256 encrypted; null if mode='platform'
active         boolean  NOT NULL  default true
createdAt      timestamptz  NOT NULL  default now()
updatedAt      timestamptz  NOT NULL  default now()
```

Rules:
- One config per publisher (UNIQUE on `publisherId`). Upsert on update.
- `mode = 'platform'`: OnePaywall's env-level PG keys are used. `keyId`, `keySecret`, `webhookSecret` are null.
- `mode = 'own'`: publisher provides their own keys. `keyId`, `keySecret`, `webhookSecret` are required.
- `keySecret` and `webhookSecret` are **always stored AES-256 encrypted** at rest. Decrypt only at payment execution time in `/lib/payments`. Never log, never return via API.
- `provider` field is stored now so multi-PG is a config change, not a schema migration later.
- When resolving which PG credentials to use for a payment: call `lib/payments/resolveConfig(publisherId)` — it reads this table and returns the active credential set.

---

### `pg_webhook_events`

Idempotency log for all payment gateway webhooks (platform and publisher own). Scoped by publisher so the same provider event ID can't collide across accounts.

```ts
id           uuid  PK  default gen_random_uuid()
publisherId  uuid  FK → publishers.id    // null = OnePaywall platform-level event
provider     text  NOT NULL              // 'razorpay'
eventId      text  NOT NULL              // provider's event ID
eventType    text  NOT NULL
payload      jsonb  NOT NULL
processedAt  timestamptz  NOT NULL  default now()
UNIQUE (provider, publisherId, eventId)
```

Rules:
- Before processing any webhook: verify signature using the correct keys for that publisher's config, then check this table.
- If the `(provider, publisherId, eventId)` tuple already exists, return 200 without reprocessing.
- Insert the event record **before** processing side effects.
- Use `publisherId = null` for OnePaywall's own billing webhooks (publisher subscription payments).

---

## Key query patterns

### Gate evaluation (embed hot path, target <100ms p95)

```
1. Look up domain by siteKey → verify embedEnabled
2. Compute reader fingerprint server-side → upsert readers → get readerId
3. Upsert reader_token for (readerId, domainId) → increment visitCount
4. Load reader_profiles row for readerId (may be null for new readers)
5. Build reader context:
   { visitorType, visitCount, deviceType, geo,
     segment, engagementScore, adCompletionRate, monetizationProbability,
     topicInterests, visitFrequency, totalDomains }
6. Find matching gates for contentId via gate_rules, ordered by priority DESC
7. For each matching gate (highest priority first):
   a. Evaluate gate.triggerConditions against reader context → skip if not met
      (intelligence conditions → unmet if reader_profiles is null)
   b. Check gate_unlocks for valid unexpired unlock → pass through if found
   c. Load gate_steps ordered by stepOrder
   d. Attach each step's triggerConditions to the step payload
   e. Return { gateId, steps: [...] } to embed script
8. Embed script evaluates step.triggerConditions client-side using the context sent
   → auto-skips non-matching steps (applies onSkip); shows matching steps
9. Embed reports events back per step action
10. Async (after response): enqueue reader profile recomputation if needed
```

Notes:
- Step `triggerConditions` are evaluated client-side for latency, but the server re-validates on any `gate_unlock` write to prevent spoofing.
- Reader profile is read from the last computed snapshot — never blocks the gate-check response.
- **Auto-optimize mode** (future): when enabled on a gate, step 6 reorders gates by `monetizationProbability` fit rather than strict priority. Not built until sufficient data exists.

Indexes required: `domains(siteKey)`, `readers(fingerprint)`, `reader_tokens(readerId, domainId)`, `gate_unlocks(readerId, gateId, contentId)`.

### Dashboard analytics

- Always query `analytics_rollups` — never aggregate `gate_events` in a user-facing request.
- Trigger rollup recomputation after batch event ingestion, not per event.
