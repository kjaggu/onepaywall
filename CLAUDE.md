# OnePaywall — CLAUDE.md

This is the source of truth for Claude Code sessions on this project. Read it fully before making changes.

---

## What this product is

**OnePaywall is an intelligent monetization platform for publishers. Its core objective is to maximize revenue per reader without compromising reader experience — because dropoffs are lost revenue, not just lost readers.**

Publishers onboard their domains and configure **gates** — monetization checkpoints that determine what a reader must do to access content (watch an ad, subscribe, make a one-time payment). OnePaywall's intelligence layer studies reader behavior across all publisher domains and routes each reader to the gate most likely to convert them — without friction that causes them to leave.

The two outcomes are treated as inseparable:
- A gate that generates revenue but causes readers to stop visiting is a bad gate.
- A gate that preserves experience but generates no revenue is a bad gate.
- The right gate is the one that converts this reader, on this visit, at this point in their journey.

OnePaywall delivers its functionality via a **JavaScript snippet** embedded in any site's `<head>` — works with any CMS or framework, no plugin required.

---

## Roles

| Role | Who | What they do |
|------|-----|--------------|
| `superadmin` | OnePaywall team | Manage publishers, plans, billing, platform config |
| `publisher` | Website/app owner + team members | Onboard sites, configure gates, manage ads/subscriptions, view analytics |
| Reader | End users of publisher sites | Never log in; identified via anonymous data layer |

---

## Tech stack

| Layer | Choice | Notes |
|-------|--------|-------|
| Framework | Next.js 15 (App Router) | TypeScript strict mode |
| Database | **Neon** (serverless Postgres) + **Drizzle ORM** | HTTP driver — no persistent connections, scales to zero |
| UI | Tailwind CSS + shadcn/ui | See docs/design-system.md |
| Client state | **Zustand** | Ephemeral UI state (modals, multi-step flows); URL state for navigation |
| Auth | JWT (HTTP-only cookie) | bcryptjs for password hashing, `jose` for JWT |
| Payments | Razorpay | Publishers subscribe to OnePaywall plans; reader monetization via platform or publisher's own keys |
| Object storage | Cloudflare R2 (or S3-compatible) | Publisher ad creative uploads (images/videos) |
| Testing | Node.js native test runner | `node --test` |

Do not introduce new dependencies without a clear reason.

---

## Folder structure

```
/app
  /(auth)               → login, signup (public, no session required)
  /(dashboard)          → publisher workspace (requires publisher session)
  /(admin)              → superadmin panel (requires superadmin session)
  /api                  → API route handlers (thin — delegate to /lib)
  /embed                → public embed endpoints (no auth, domain-verified)
/components
  /ui                   → shadcn primitives only (never add logic here)
  /shared               → reusable app components (header, nav, modals)
  /dashboard            → publisher dashboard components
  /admin                → superadmin components
/lib
  /db                   → db client, query helpers, typed query functions
  /auth                 → session creation, JWT, middleware helpers
  /gates                → gate evaluation logic
  /embed                → embed script generation, reader identification
  /analytics            → event ingestion, rollup logic
  /payments             → Razorpay integration
/db
  /migrations           → numbered SQL migration files (additive only)
  schema.sql            → current full schema (kept in sync)
/public
  /embed                → built JS embed bundle (served statically)
/docs
  design-system.md
  data-model.md
```

### Strict layering rule

```
UI components → API route handlers → /lib functions → /lib/db queries → PostgreSQL
```

- Components never query the DB directly.
- API routes never contain business logic — they call `/lib`.
- `/lib` functions are pure and testable.
- DB queries live in `/lib/db`, nowhere else.

---

## Auth & session model

- Single-host app. Routing is role-based, not subdomain-based.
- Session stored in an HTTP-only JWT cookie (`op_session`).
- JWT payload: `{ userId, email, platformRole, memberships: [{ publisherId, role }] }`
- `platformRole`: `"superadmin"` | `"publisher"`
- Route groups `/(dashboard)` and `/(admin)` have layout-level session guards.
- No public reader login. Ever.

### Session helpers (in `/lib/auth`)

- `getSession(req)` → returns session or null
- `requireSession(req)` → returns session or throws 401
- `requireSuperadmin(req)` → throws 403 if not superadmin
- `requirePublisher(req, publisherId)` → throws 403 if not a member of the publisher org

---

## API patterns

- All API routes: `app/api/[resource]/route.ts`
- JSON in, JSON out.
- Error shape: `{ error: string, code?: string }`
- Success shape: `{ data: T }` for single resources, `{ data: T[], meta?: { total } }` for lists.
- HTTP status codes must be accurate (200, 201, 400, 401, 403, 404, 422, 500).
- Never return stack traces to the client.
- Validate all inputs at the route level before passing to lib.

---

## Embed snippet architecture

The JS snippet is embedded in a publisher's site `<head>`:

```html
<script src="https://cdn.onepaywall.com/embed.js" data-site-key="SITE_KEY"></script>
```

The snippet is responsible for:
1. Identifying the reader (first-party cookie + fingerprint hash)
2. Calling `/api/embed/gate-check` with `{ siteKey, readerToken, contentId }`
3. Rendering the appropriate gate UI (ad interstitial, subscription prompt, or pass-through)
4. Reporting gate events (impression, completion, skip) back to `/api/embed/event`

The embed endpoints (`/api/embed/*`) are public but verified by `site_key`. They must be fast (<100ms p95) and stateless.

Reader tokens are opaque hashes — never expose PII in them.

---

## Database conventions

- All tables use `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`.
- All tables have `created_at TIMESTAMPTZ NOT NULL DEFAULT now()`.
- Mutable tables add `updated_at TIMESTAMPTZ NOT NULL DEFAULT now()` + trigger.
- Migrations are **additive only** — never DROP or ALTER existing columns in place. Add new columns; rename via add+migrate+drop across multiple migrations.
- Migration files: `db/migrations/NNNN_description.sql` (zero-padded 4 digits).
- Keep `db/schema.sql` in sync with every migration.
- Soft deletes: use `deleted_at TIMESTAMPTZ` where applicable, never hard-delete publisher or reader data.

---

## Code conventions

- TypeScript strict mode. No `any`. No `as unknown as T`.
- Named exports only. No default exports except Next.js page/layout files.
- No barrel files (`index.ts` re-exports). Import from the source file directly.
- Zod for all runtime validation (API inputs, embed events).
- No comments that describe WHAT the code does. Only comments that explain WHY (non-obvious constraints, workarounds).
- No `console.log` in production code. Use structured logging via `/lib/logger`.
- Error boundaries at route group layouts, not deep in components.

---

## Product design constraint

Every feature must satisfy this test: **does it increase revenue per reader without increasing reader dropoff?**

If a feature increases revenue but harms experience → reject it or redesign it.
If a feature improves experience but has no revenue path → it's a nice-to-have, not a priority.
If a feature does both → build it.

This applies to gate configuration options, UI decisions, intelligence features, and API design alike.

---

## Compute efficiency constraint

**OnePaywall's infrastructure cost must not scale with publisher readership.** A publisher with 10M monthly readers must not cost us 1000× more to serve than one with 10K readers. Every architectural decision must account for this.

### Rules

- **Embed hot path** (`/api/embed/*`) must be stateless and cacheable. Target <100ms p95 at any volume.
- **Never run per-reader computation synchronously** on the gate-check request. Profile computation, analytics rollups, content classification — all async/queued.
- **Neon HTTP driver** — no persistent DB connections. Each serverless invocation opens and closes cleanly. Use connection pooling via Neon's built-in pooler for dashboard queries; use the HTTP driver for embed endpoints.
- **Reader signals** (`reader_page_visits`) are written via `navigator.sendBeacon` — fire-and-forget from the client. The `/api/embed/signal` endpoint must acknowledge immediately and process async.
- **Content classification** is cached in `content_classifications`. Never re-classify a URL that has a fresh cached entry (<30 days, confidence ≥ 0.5).
- **Analytics rollups** are computed on-demand after batch ingestion — never per-event, never in real time.
- **Embed JS bundle** must stay under 15KB gzipped. Every byte added to the embed is loaded on every publisher page load across all their readers.
- **Gate-check response** must contain everything the embed needs to render all steps — no follow-up API calls from the embed during a gate interaction.
- **Ad creative serving** goes through the CDN directly — never proxied through our app server.

### Cost ownership principle

If a feature creates compute that scales with a publisher's reader volume, the cost must either:
1. Be borne by the publisher (metered on their plan), or
2. Be genuinely fixed/negligible per-reader (cache hit, static asset, edge computation)

Do not build features that silently scale our infrastructure cost with publisher growth.

---

## What NOT to do

- Do not add subdomain-based routing logic.
- Do not build a reader-facing login or reader accounts.
- Do not put business logic in React components or API route handlers.
- Do not use Prisma or any ORM other than Drizzle.
- Do not use Redux, MobX, or other heavy state libraries — Zustand only for client state.
- Do not create CMS-specific code (WordPress plugins, etc.). The snippet approach covers all CMSes.
- Do not serve ad network credentials (adClientId, networkCode, etc.) from the embed API — only serve the resolved render config needed by the embed script.
- Do not store uploaded media URLs directly from the client. Always generate a signed upload URL server-side, let the client upload to storage directly, then confirm the `storageKey` server-side before saving.
- Do not hardcode any domain or host string — use environment variables.
- Do not write backwards-compatibility shims or feature flags in application code.
- Do not `DROP` or destructively `ALTER` columns in migrations.

---

## Reader intelligence layer

OnePaywall builds an anonymous reader profile from signals collected by the embed script across all publisher domains. This profile is used to evaluate which gate is most likely to convert for a given reader, helping publishers monetize better.

### What is collected
- **Page visits** (`reader_page_visits`): URL, content category, read time, scroll depth, device type, referrer origin. Collected via `navigator.sendBeacon` on page unload.
- **Gate events** (`gate_events`): already tracked — ad completions, skips, subscription CTA clicks.

### What is derived (`reader_profiles`)
`segment`, `engagementScore`, `adCompletionRate`, `monetizationProbability`, `topicInterests`, `visitFrequency`, `totalDomains`. Recomputed asynchronously — never on the hot path.

### How publishers use it
Reader profile signals extend the gate/step `triggerConditions` vocabulary. Publishers configure gates with conditions like `readerSegment: ['power_user']` or `minEngagementScore: 0.6`. The intelligence layer populates these values; publishers decide how to act on them.

### Long-term optimization objective

OnePaywall's intelligence layer should eventually **maximize revenue per reader** by predicting the highest-probability monetization path and routing accordingly:

| Reader signal | Optimal path |
|---------------|-------------|
| High `monetizationProbability` | Push toward subscription or one-time unlock |
| Low `monetizationProbability`, high engagement | Show highly relevant ad (maximize completion + CPM) |
| Low engagement, new reader | Frictionless ad or soft subscription CTA — don't lose them |

This requires **two prediction tracks**:
1. **Payment propensity** — will this reader pay? Drives gate selection (subscription vs ad).
2. **Ad relevance** — what ad will this reader engage with? Drives ad unit selection within an ad step. Computed as `weight × relevanceScore` where relevance = overlap between `ad_unit.relevantCategories` and `reader_profiles.topicInterests`.

### Manual-first, auto-optimize later
- **Now**: gate selection is fully publisher-configured. Intelligence signals extend trigger conditions — publishers decide which gates fire for which reader profiles. Ad relevance weighting is computed but used only for rotation within a step's ad pool (not for gate reordering).
- **Phase 2** (once ≥6 months of signal data exists): opt-in `autoOptimize` mode — OnePaywall reorders available gates by predicted conversion probability, overriding publisher priority. Publishers opt in per domain.
- **Phase 3**: real-time propensity model replaces the heuristic `monetizationProbability` score. Do not design for this now — just ensure signal collection is comprehensive.

**Do not build Phase 2 or Phase 3 features yet. Build the signal collection and profile infrastructure correctly now so the optimization layer can be added without schema changes.**

### Privacy rules
- All reader data is tied to an anonymous fingerprint — never to PII.
- `reader_page_visits` rows are hard-deleted after 90 days (nightly job).
- URL query params that may contain PII are stripped before storage (list in `/lib/intelligence/sanitize.ts`).
- Referrer stored as origin only, never full URL.
- Publishers must disclose OnePaywall's data collection in their privacy policies (DPDPA compliance is the publisher's responsibility; OnePaywall provides template language).
- Reader profile data is never exposed to publishers at the individual level — only aggregate analytics.

### Architecture
- Collection: embed script → `POST /api/embed/signal` (fire-and-forget, non-blocking)
- Storage: `reader_page_visits` (raw), `content_classifications` (cached topic taxonomy)
- Computation: `/lib/intelligence/computeProfile.ts` — triggered async after every 5 new visits or gate completion
- Consumption: `reader_profiles` read during gate evaluation, extending the reader context

---

## Payment architecture

There are **two distinct payment flows** — they use different PG credentials and must never be confused:

| Flow | Who pays | Who receives | PG keys used |
|------|----------|--------------|--------------|
| **OnePaywall billing** | Publisher | OnePaywall | Platform env keys (`RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET`) |
| **Reader monetization** | Reader | Publisher | Publisher's config (`publisher_pg_configs`) — platform or own |

For reader monetization, always call `lib/payments/resolveConfig(publisherId)` to get the correct credential set. Never hardcode which keys to use.

Publisher-provided PG secrets (`keySecret`, `webhookSecret`) are stored AES-256 encrypted in `publisher_pg_configs`. The encryption key is `PG_ENCRYPTION_KEY` from env. Decrypt only inside `/lib/payments` at the moment of use — never elsewhere.

The `provider` field on `publisher_pg_configs` is `'razorpay'` only for now. When adding new providers, extend the `resolveConfig` function and add provider-specific adapters under `/lib/payments/providers/`. No schema change needed.

---

## Environment variables

```bash
DATABASE_URL=                        # PostgreSQL connection string
JWT_SECRET=                          # Secret for signing JWT cookies
SUPERADMIN_EMAILS=                   # Comma-separated list of superadmin emails
RAZORPAY_KEY_ID=                     # OnePaywall platform Razorpay public key
RAZORPAY_KEY_SECRET=                 # OnePaywall platform Razorpay secret key
RAZORPAY_WEBHOOK_SECRET=             # OnePaywall platform Razorpay webhook secret
PG_ENCRYPTION_KEY=                   # AES-256 key for encrypting publisher PG secrets + ad network credentials at rest
STORAGE_ENDPOINT=                    # R2/S3 endpoint URL
STORAGE_BUCKET=                      # Bucket name for ad creative uploads
STORAGE_ACCESS_KEY_ID=               # Storage access key
STORAGE_SECRET_ACCESS_KEY=           # Storage secret
NEXT_PUBLIC_APP_URL=                 # Full URL of the app (e.g. http://localhost:3000)
NEXT_PUBLIC_CDN_URL=                 # CDN base URL for embed script and served ad creatives
EMBED_SCRIPT_SECRET=                 # Secret for signing embed tokens
```

---

## Key business rules (non-negotiable)

1. **Publisher = Organization.** A user must be a member of at least one publisher before they can manage anything.
2. A **domain** belongs to exactly one publisher. A domain has one immutable `site_key` generated at creation.
3. A **gate** belongs to exactly one domain. A domain can have multiple gates; they are evaluated by priority.
4. A gate is a **sequential step flow** — not a flat config. Steps execute in order; each step's `on_skip` / `on_decline` determines whether to proceed or advance to the next step. See `docs/data-model.md`.
5. Reader identification is **anonymous**. Never store email, name, or any PII in the reader data layer without explicit opt-in from the publisher and reader.
6. Analytics events are **append-only**. Never update or delete event rows. Rollups are derived from events.
7. Razorpay webhooks must be verified with the webhook signature before processing.
