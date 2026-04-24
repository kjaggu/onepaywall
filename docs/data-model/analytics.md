# Data Model — Analytics

## `gate_events`  ← append-only, source of truth
```
id, domain_id FK, gate_id FK, step_id FK (null for gate-level), reader_id FK (null if fingerprint failed)
event_type, ad_unit_id FK, content_id, metadata JSONB, occurred_at (server-side only)
```

### `event_type` values
```
gate_shown | step_shown | gate_passed
ad_start | ad_complete | ad_skip
subscription_cta_click | subscription_cta_skip
one_time_unlock_start | one_time_unlock_complete | one_time_unlock_skip
```

### Rules
- Never update or delete rows.
- `occurred_at` always set server-side — never trust client timestamps.
- Write only via `lib/analytics/` — never directly from route handlers.

## `analytics_rollups`  ← derived daily cache
```
id, domain_id FK, gate_id FK (null = domain-level), date DATE
impressions int, step_completions int, gate_passes int, unique_readers int
created_at, updated_at
UNIQUE (domain_id, gate_id, date)
```

### Rules
- Computed on-demand after batch event ingestion — never per-event, never real-time.
- Upsert via `INSERT ... ON CONFLICT DO UPDATE`.
- If corrupted, recompute from `gate_events` — rollups are a cache.
- Dashboard charts always read from rollups — never aggregate `gate_events` in user-facing requests.
