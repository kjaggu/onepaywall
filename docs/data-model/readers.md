# Data Model — Readers & Intelligence

## `readers`
```
id, fingerprint (unique, server-computed — never trust client-supplied)
created_at, last_seen_at
```
- Created on first gate check for unknown fingerprint.
- Never store IP addresses. Fingerprint derived from but does not contain raw IP.
- Paid subscriptions link an anonymous reader to `reader_subscribers` after checkout or magic-link restore. See `docs/data-model/payments.md`; this is the only reader PII exception.

## `reader_tokens`
```
id, reader_id FK, domain_id FK, token (unique), visit_count (increments per page check)
expires_at, created_at, updated_at
UNIQUE (reader_id, domain_id)
```
- `visit_count` used to evaluate `minVisitCount` / `maxVisitCount` trigger conditions.

## `gate_unlocks`
```
id, reader_id FK, gate_id FK, content_id (null = domain-wide), unlock_type
('ad_completion'|'one_time_payment'|'subscription'), expires_at (null = session-only)
created_at
```
- Valid unlock: reader+gate+content match AND (expires_at > now() OR expires_at IS NULL).
- Insert only — never update.

## `reader_page_visits`  ← raw intelligence signals
```
id, reader_id FK, domain_id FK, url, content_category
read_time_seconds, scroll_depth_pct (0-100), device_type, referrer (origin only)
occurred_at
```
- Written via `sendBeacon` → `POST /api/embed/signal` — fire-and-forget.
- URL stripped of PII-bearing query params before storage (list in `lib/intelligence/sanitize.ts`).
- **Hard-deleted after 90 days** — nightly job. Never use in user-facing queries.

## `content_classifications`
```
id, url (unique, normalised — no query/fragment), categories text[], confidence (0-1)
classified_at
```
- Computed once, reused across all readers visiting same page.
- Re-classify if: `confidence < 0.5` OR `classified_at < now() - 30 days`.
- Classification priority: Open Graph meta → URL path pattern → title keywords.
- Supported categories: `technology`, `finance`, `sports`, `entertainment`, `politics`,
  `health`, `lifestyle`, `education`, `business`, `travel`.

## `reader_profiles`  ← computed, 1:1 with readers
```
id, reader_id FK (unique)
segment ('new'|'casual'|'regular'|'power_user')
engagement_score float (0-1)       — weighted: read_time + scroll + return frequency
ad_completion_rate float (0-1)     — completed / shown
monetization_probability float (0-1) — heuristic score (see below)
topic_interests JSONB              — { "technology": 0.8, "finance": 0.3 }
visit_frequency ('unknown'|'one_time'|'occasional'|'weekly'|'daily')
total_visits int, total_domains int
last_computed_at, created_at, updated_at
```

### Segment rules
- `new`: < 3 total visits
- `casual`: 3–10 visits, low engagement
- `regular`: 10–50 visits OR high engagement on fewer
- `power_user`: 50+ visits OR very high engagement

### `monetization_probability` heuristic (v1)
```
score = engagement_score × 0.35
      + ad_completion_rate × 0.25
      + visit_frequency_score × 0.20  (daily=1.0, weekly=0.6, occasional=0.3, one_time=0.1)
      + topic_depth × 0.10            (distinct topics with interest > 0.5)
      + log(total_domains)/log(10) × 0.10  (capped at 1.0)
```
Replace with trained model when sufficient data exists — score interface stays the same.

### Recomputation trigger
- Async after every 5 new `reader_page_visits` for that reader
- Async after any `gate_event` of type `gate_passed` or `ad_complete`
- Never on the gate-check hot path — always read last computed snapshot.

### Topic interest decay
- Visits > 30 days old: contribute at 50% weight
- Visits > 60 days old: contribute at 20% weight
