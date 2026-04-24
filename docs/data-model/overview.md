# Data Model — Overview

Full detail in the sibling files. Read this for relationships; read the specific file for field-level detail.

```
publishers ──< publisher_members >── users
     │
     ├──< domains ──< gates ──< gate_steps
     │                    └──< gate_rules
     │
     ├──< publisher_subscriptions >── plans
     ├── publisher_pg_configs
     ├──< publisher_ad_networks ──< ad_units
     └── (ad_units also owned directly by publisher)

readers ──< reader_tokens (per domain)
        ──< gate_unlocks  (per gate)
        ──< reader_page_visits (90-day raw signals)
        ── reader_profiles (computed, 1:1)

content_classifications (shared URL→topic cache)

gate_events (append-only, analytics source of truth)
analytics_rollups (derived daily cache from gate_events)

razorpay_webhook_events / pg_webhook_events (idempotency logs)
```

## ID convention
All tables: `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
All tables: `created_at TIMESTAMPTZ NOT NULL DEFAULT now()`
Mutable tables add: `updated_at TIMESTAMPTZ NOT NULL DEFAULT now()` + trigger
Soft-deletes: `deleted_at TIMESTAMPTZ` — never hard-delete publisher or reader data

## Migration convention
Files: `db/migrations/NNNN_description.sql` — additive only, never DROP/ALTER existing columns.
