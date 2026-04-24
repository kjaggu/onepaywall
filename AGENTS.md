<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# OnePaywall — Agent & Handoff Guide

This project uses Claude Code. **Read `CLAUDE.md` first — it is the source of truth.**

## Start here
1. Read `CLAUDE.md` (root) — architecture, constraints, never-do list
2. Read `docs/file-map.md` — maps every feature to exact files. Use this before exploring.
3. Read `docs/progress.md` — current build state. Know what exists before adding anything.

## Data model reference
Do not read all of `docs/data-model/` — read only the file for your feature area:
- `docs/data-model/publishers.md` — users, publishers, domains, gates, gate_steps
- `docs/data-model/readers.md` — readers, tokens, unlocks, signals, profiles
- `docs/data-model/ads.md` — ad_units, ad_networks
- `docs/data-model/payments.md` — pg_configs, subscriptions, webhooks
- `docs/data-model/analytics.md` — gate_events, rollups
- `docs/data-model/overview.md` — entity relationships at a glance

## Design system
Read `docs/design-system.md` before building any UI. Check shadcn blocks before building any component — see the shadcn blocks policy in `CLAUDE.md`.

## Key invariants (do not break)
- Layering: UI → API routes → /lib → lib/db → Neon. Never skip layers.
- Embed hot path (`/api/embed/*`): stateless, <100ms p95, no sync computation
- Migrations: additive only. Never DROP or ALTER existing columns.
- Reader data: anonymous fingerprint only, never PII
- Payments: always `lib/payments/resolveConfig(publisherId)` — never hardcode keys
- Publisher PG secrets + ad network credentials: always AES-256 encrypted at rest

## After your session
Update `docs/progress.md` and `docs/file-map.md` with any new files created.
