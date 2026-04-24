# Data Model — Publishers, Domains, Gates

## `users`
```
id, email, password_hash, platform_role ('superadmin'|'publisher'), full_name, avatar_url
created_at, updated_at, deleted_at
```
- Soft-delete only. `platform_role = 'superadmin'` — never set via API.
- Publisher user with zero `publisher_members` rows has no dashboard access.

## `publishers`
```
id, name, slug (immutable, unique), logo_url
created_at, updated_at, deleted_at
```
- Soft-delete only.

## `publisher_members`
```
id, publisher_id FK, user_id FK, role ('owner'|'admin'|'member')
created_at
UNIQUE (publisher_id, user_id)
```
- Every publisher must have exactly one `owner` at all times.
- Superadmins have implicit access — no membership row needed.

## `domains`
```
id, publisher_id FK, name, domain (unique, normalised — no protocol/trailing slash)
site_key (unique, immutable, format: sk_<24chars>), embed_enabled (bool, default false)
created_at, updated_at, deleted_at
```
- `embed_enabled = false` → embed returns pass-through. Use to pause without deleting.

## `gates`
```
id, domain_id FK, name, priority (int, higher = evaluated first), enabled (bool)
trigger_conditions JSONB default '{}'
created_at, updated_at, deleted_at
```

### `trigger_conditions` schema
Session signals:
```json
{ "visitorType": "first_time|repeat|any", "minVisitCount": 3, "maxVisitCount": 10,
  "deviceType": "mobile|desktop|tablet|any", "geo": ["IN"], "hasCompletedGate": "uuid" }
```
Reader intelligence signals (from `reader_profiles`):
```json
{ "readerSegment": ["regular","power_user"], "minEngagementScore": 0.6,
  "maxAdCompletionRate": 0.3, "minMonetizationProbability": 0.5,
  "topicInterests": ["technology"], "visitFrequency": ["daily","weekly"],
  "minTotalDomains": 3 }
```
- AND logic only. For OR, use multiple gates with different priorities.
- Intelligence conditions → unmet if reader has no profile yet (new reader falls to next gate).

## `gate_rules`
```
id, gate_id FK, pattern (glob e.g. "/articles/*"), match_type ('path_glob'|'content_type')
created_at
```
- No rules = gate applies to all content on the domain.

## `gate_steps`
```
id, gate_id FK, step_order (1-based), step_type ('ad'|'subscription_cta'|'one_time_unlock')
config JSONB default '{}', trigger_conditions JSONB default '{}'
on_skip ('proceed'|'next_step'), on_decline ('proceed'|'next_step')
created_at, updated_at
```
- `trigger_conditions` on step: same schema as gate-level. Unmet → step auto-skips (applies on_skip).
- Steps evaluated client-side in embed for latency; server re-validates on any `gate_unlock` write.

### `config` by step_type

**`ad`**: `{ adUnitIds: [uuid], unlockDurationSeconds: 3600 }`
— `skipAfterSeconds` lives on `ad_units` not here.

**`subscription_cta`**: `{ heading, subtext, ctaLabel, ctaUrl, discounted: false }`
— CTA links out to publisher's subscribe page. No subscription verification here.

**`one_time_unlock`**: `{ priceInPaise: 499, label, unlockDurationSeconds: 86400 }`
— Triggers Razorpay payment flow. On success → inserts `gate_unlocks` row.

### Gate evaluation order
```
1. Match gates via gate_rules → sort by priority DESC
2. For each gate: evaluate trigger_conditions → skip if unmet
3. Check gate_unlocks for valid unexpired unlock → pass through
4. Return gate_steps to embed; embed evaluates step trigger_conditions
```
