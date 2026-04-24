# OnePaywall — CLAUDE.md

**Intelligent monetization for publishers. Maximize revenue per reader without compromising reader experience — dropoffs are lost revenue.**

---

## Roles
| Role | Who |
|------|-----|
| `superadmin` | OnePaywall team — manages publishers, plans, platform |
| `publisher` | Website/app owner + team — manages domains, gates, ads, analytics |
| Reader | End user of publisher sites — never logs in, identified anonymously |

---

## Tech stack
| Layer | Choice |
|-------|--------|
| Framework | Next.js 15 App Router, TypeScript strict |
| Database | Neon serverless Postgres + Drizzle ORM (HTTP driver) |
| UI | Tailwind CSS + shadcn/ui |
| Client state | Zustand (UI only) + URL state (navigation) |
| Auth | JWT HTTP-only cookie — `jose` + `bcryptjs` |
| Payments | Razorpay (platform keys for OnePaywall billing; publisher own keys for reader monetization) |
| Storage | Cloudflare R2 — ad creative uploads |
| Testing | Node.js native `node --test` |

---

## Folder structure
```
app/(auth)          login, signup
app/(dashboard)     publisher workspace — layout-level session guard
app/(admin)         superadmin panel — layout-level session guard
app/api/            API route handlers — thin, delegate to /lib
app/embed/          public embed endpoints — no auth, domain-verified, stateless
components/ui/      shadcn primitives only
components/shared/  reusable app components
components/dashboard/ components/admin/
lib/db/             Drizzle client + schema (schema.ts) + query helpers
lib/auth/           session, JWT, middleware helpers
lib/gates/          gate evaluation logic
lib/embed/          embed script generation, reader fingerprinting
lib/analytics/      event ingestion, rollup computation
lib/payments/       Razorpay integration, PG credential resolution
lib/intelligence/   reader profile computation, content classification
db/migrations/      SQL migrations — additive only
public/embed/       built JS embed bundle
docs/               see below
```

---

## Layering rule — strict, no exceptions
```
UI components → API route handlers → /lib → lib/db → Neon
```
Components never touch DB. API routes never contain business logic. `/lib` is pure and testable.

---

## Key constraints

**Compute efficiency** — infrastructure cost must not scale with publisher readership.
- Embed hot path (`/api/embed/*`): stateless, cacheable, <100ms p95
- Never compute synchronously on gate-check: profiles, rollups, classification are always async
- Signals written via `sendBeacon` — fire-and-forget, `/api/embed/signal` acknowledges immediately
- Embed JS bundle: <15KB gzipped, no follow-up API calls during gate interaction
- CDN serves ad creatives directly — never proxied through app server

**Product constraint** — every feature must: increase revenue per reader without increasing dropoff.

**Privacy** — all reader data tied to anonymous fingerprint only, never PII. Raw signals hard-deleted after 90 days.

**Payments** — two separate flows: OnePaywall billing (platform keys) vs reader monetization (publisher's own or platform keys). Always call `lib/payments/resolveConfig(publisherId)` — never hardcode which keys to use.

**Intelligence** — manual gate selection now. Auto-optimize (Phase 2) only after ≥6 months of signal data. Do not build Phase 2 yet.

---

## Docs (read only what you need)
| Doc | When to read |
|-----|-------------|
| `docs/file-map.md` | **Start here** — maps features to files |
| `docs/data-model/overview.md` | Entity relationships at a glance |
| `docs/data-model/publishers.md` | publishers, members, domains, gates, gate_steps |
| `docs/data-model/readers.md` | readers, tokens, unlocks, signals, profiles |
| `docs/data-model/ads.md` | ad_units, publisher_ad_networks |
| `docs/data-model/payments.md` | pg_configs, subscriptions, webhook events |
| `docs/data-model/analytics.md` | gate_events, rollups |
| `docs/design-system.md` | colors, typography, components, layout |

---

## UI development — shadcn blocks first

Before building any UI component or page layout, check shadcn blocks:
```bash
npx shadcn@latest add <block-name>   # install a block
```

**Workflow:**
1. Check https://ui.shadcn.com/blocks for pre-built blocks (dashboard, sidebar, auth, data-table, etc.)
2. If a block covers the need → install it, customise to design tokens, done
3. If no block fits → compose from shadcn primitives in `components/ui/`
4. Never write raw HTML/CSS for something a shadcn primitive covers

**Useful blocks to install as needed** (don't pre-install — add when the feature is built):
- `sidebar-*` — dashboard sidebar layouts
- `login-*` — auth page layouts  
- `dashboard-*` — dashboard shells
- `data-table` — tables with sorting/pagination
- `chart-*` — analytics charts (uses recharts)
- `calendar` — date pickers

**Design system always wins** — after installing a block, replace all hardcoded colors/spacing with CSS tokens from `app/globals.css`. See `docs/design-system.md`.

---

## Session hygiene
After every session that creates new files:
1. Update `docs/progress.md` — mark completed items `done`
2. Update `docs/file-map.md` — add any new files created

---

## Never do
- Subdomain-based routing
- Reader login / reader accounts
- Business logic in components or API routes
- ORM other than Drizzle; state library other than Zustand
- CMS-specific code — snippet covers all CMSes
- Hardcode domain/host strings
- `DROP` or destructive `ALTER` in migrations
- Proxy ad creatives through the app server
- Store raw PG secrets or ad network credentials unencrypted (`PG_ENCRYPTION_KEY` always)
- Build Phase 2/3 intelligence features prematurely
