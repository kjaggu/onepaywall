# Data Model — Ads

## `publisher_ad_networks`
```
id, publisher_id FK, provider ('google_adsense'|'google_ad_manager')
credentials JSONB (AES-256 encrypted via PG_ENCRYPTION_KEY), active bool
created_at, updated_at
UNIQUE (publisher_id, provider)
```
- Credentials encrypted at rest. Decrypt only inside `lib/ads/networks/` at render time.
- Deactivating suppresses all ad_units under this connection.

### `credentials` by provider
**google_adsense**: `{ adClientId: "pub-0000000000000000" }`
**google_ad_manager**: `{ networkCode: "123456789", adUnitRootPath: "/123456789/site" }`

## `ad_units`
```
id, publisher_id FK, name, source_type ('direct'|'network'), weight (int, default 1)
relevant_categories text[]   ← topic tags for reader-ad matching

-- direct fields (null when source_type = 'network')
media_type ('image'|'video'), storage_key, cdn_url, cta_label, cta_url
skip_after_seconds (null = no skip)

-- network fields (null when source_type = 'direct')
ad_network_id FK → publisher_ad_networks, network_config JSONB

active bool, created_at, updated_at, deleted_at
```

### `network_config` by provider
**google_adsense**: `{ adSlotId: "1234567890" }`
→ renders `<ins data-ad-client="{adClientId}" data-ad-slot="{adSlotId}" />`

**google_ad_manager**: `{ adUnitPath: "/123456789/site/top", sizes: [[300,250],[728,90]] }`
→ renders via GPT: `googletag.defineSlot(adUnitPath, sizes, divId)`

### `relevant_categories`
Used for reader-ad relevance matching.
Effective rotation weight = `weight × relevance_score`
where `relevance_score` = overlap between `relevant_categories` and reader's `topic_interests`.
Empty `relevant_categories` → uses base `weight` unchanged (shown to any reader).

### Rules
- `source_type = 'direct'`: `storage_key`, `cdn_url`, `media_type` required. Network fields null.
- `source_type = 'network'`: `ad_network_id`, `network_config` required. Direct fields null.
- `media_type = 'video'`: must be direct file URL (mp4/webm). Reject watch-page URLs on write.
- Ad units belong to publisher, not domain — reusable across all publisher's domains.
- Uploads: generate signed URL server-side → client uploads directly to R2 → confirm `storage_key` server-side. Never stream binary through app server.
- The embed script never receives raw `credentials` — only resolved render config (slot IDs, unit paths).
- Soft-delete only.
