# File Map — Where to Look for What

Check this before exploring the codebase. Find your feature area, then go directly to those files.

---

## Auth & session

| Task | Files |
|------|-------|
| Login / signup pages | `app/(auth)/login/page.tsx`, `app/(auth)/signup/page.tsx` |
| Session creation / JWT | `lib/auth/session.ts` |
| Session guards (middleware) | `lib/auth/middleware.ts`, `app/(dashboard)/layout.tsx`, `app/(admin)/layout.tsx` |
| Auth API endpoints | `app/api/auth/login/route.ts`, `app/api/auth/signup/route.ts`, `app/api/auth/logout/route.ts` |
| Password hashing | `lib/auth/password.ts` |
| DB schema | `lib/db/schema.ts` → `users` table |

---

## Publisher onboarding & management

| Task | Files |
|------|-------|
| Publisher CRUD | `app/api/publishers/route.ts`, `lib/db/queries/publishers.ts` |
| Team members | `app/api/publishers/[id]/members/route.ts`, `lib/db/queries/members.ts` |
| Publisher dashboard shell | `app/(dashboard)/layout.tsx`, `components/dashboard/sidebar.tsx` |
| DB schema | `lib/db/schema.ts` → `publishers`, `publisher_members` |
| Data model reference | `docs/data-model/publishers.md` |

---

## Domain management

| Task | Files |
|------|-------|
| Domain CRUD | `app/api/domains/route.ts`, `app/api/domains/[id]/route.ts` |
| Domain query helpers | `lib/db/queries/domains.ts` |
| Publisher query helpers | `lib/db/queries/publishers.ts` |
| Site key generation | `lib/embed/siteKey.ts` |
| Domain list page | `app/(dashboard)/domains/page.tsx` |
| Domain detail + embed setup | `app/(dashboard)/domains/[id]/page.tsx` |
| Domain free-pages (whitelist) | `app/(dashboard)/domains/[id]/whitelist/page.tsx` |
| Add domain sheet | `components/dashboard/domains/add-domain-sheet.tsx` |
| Domain actions dropdown | `components/dashboard/domains/domain-actions.tsx` |
| Copy site key button | `components/dashboard/domains/copy-site-key.tsx` |
| Copy embed script snippet | `components/dashboard/domains/copy-embed-script.tsx` |
| Whitelist manager component | `components/dashboard/domains/domain-whitelist.tsx` |
| Copy-to-clipboard util | `lib/copy.ts` |
| DB schema | `lib/db/schema.ts` → `domains` |
| Data model reference | `docs/data-model/publishers.md` |

---

## Gate builder

| Task | Files |
|------|-------|
| Gate CRUD | `app/api/gates/route.ts`, `app/api/gates/[id]/route.ts` |
| Step CRUD | `app/api/gates/[id]/steps/route.ts`, `app/api/gates/[id]/steps/[stepId]/route.ts` |
| Rule CRUD | `app/api/gates/[id]/rules/route.ts`, `app/api/gates/[id]/rules/[ruleId]/route.ts` |
| Gate query helpers | `lib/db/queries/gates.ts` |
| Gates list page | `app/(dashboard)/gates/page.tsx` |
| Gate builder page | `app/(dashboard)/gates/[id]/page.tsx` |
| Gate header editor | `components/dashboard/gates/gate-header.tsx` |
| URL rules manager | `components/dashboard/gates/gate-rules.tsx` |
| Steps manager | `components/dashboard/gates/gate-steps.tsx` |
| Create gate sheet | `components/dashboard/gates/create-gate-sheet.tsx` |
| Gate evaluation logic | `lib/gates/evaluate.ts` |
| Trigger condition evaluation | inline in `lib/gates/evaluate.ts` → `conditionsMet()` |
| DB schema | `lib/db/schema.ts` → `gates`, `gate_steps`, `gate_rules` |
| Data model reference | `docs/data-model/publishers.md` |

---

## Embed script & gate-check (hot path)

| Task | Files |
|------|-------|
| Gate check endpoint | `app/api/embed/gate-check/route.ts` |
| Signal ingestion endpoint | `app/api/embed/signal/route.ts` |
| Embed event reporting | `app/api/embed/event/route.ts` |
| Reader fingerprinting | `lib/embed/fingerprint.ts` |
| Reader token management | `lib/embed/readerToken.ts` |
| Embed JS source | `public/embed/embed.js` (or build output) |
| DB schema | `lib/db/schema.ts` → `readers`, `reader_tokens`, `gate_unlocks` |
| Data model reference | `docs/data-model/readers.md` |

---

## Ads

| Task | Files |
|------|-------|
| Ad unit CRUD | `app/api/ads/route.ts`, `app/api/ads/[id]/route.ts` |
| Upload signed URL | `app/api/ads/upload-url/route.ts` |
| Ad unit query helpers | `lib/db/queries/ads.ts` |
| Ad network connection | `app/api/ads/networks/route.ts`, `lib/ads/networks/` |
| Ad rotation + relevance | `lib/ads/rotate.ts` |
| Ad management page | `app/(dashboard)/ads/page.tsx` |
| Create ad unit sheet | `components/dashboard/ads/create-ad-sheet.tsx` |
| DB schema | `lib/db/schema.ts` → `ad_units`, `publisher_ad_networks` |
| Data model reference | `docs/data-model/ads.md` |

---

## Revenue

| Task | Files |
|------|-------|
| Revenue API (list + summary) | `app/api/revenue/route.ts` |
| Transaction query helpers | `lib/db/queries/transactions.ts` |
| Revenue page (filterable table + CSV export) | `app/(dashboard)/revenue/page.tsx` |
| DB schema | `lib/db/schema.ts` → `reader_transactions` |

---

## Plans (reader monetization)

| Task | Files |
|------|-------|
| Publisher plans API (GET/PUT subscriptions + unlock) | `app/api/publisher-plans/route.ts` |
| Per-URL price delete | `app/api/publisher-plans/prices/[id]/route.ts` |
| Plans query helpers | `lib/db/queries/publisher-plans.ts` |
| Plans page (subscriptions + article unlock + per-URL overrides) | `app/(dashboard)/plans/page.tsx` |
| DB schema | `lib/db/schema.ts` → `publisher_reader_plans`, `publisher_content_prices` |

---

## Payments — OnePaywall billing

| Task | Files |
|------|-------|
| Plan management | `app/api/plans/route.ts`, `app/(admin)/plans/` |
| Publisher subscription | `app/api/billing/route.ts`, `lib/payments/billing.ts` |
| Razorpay webhook (platform) | `app/api/webhooks/razorpay/route.ts` |
| DB schema | `lib/db/schema.ts` → `plans`, `publisher_subscriptions`, `pg_webhook_events` |
| Data model reference | `docs/data-model/payments.md` |

---

## Payments — Reader monetization (publisher PG)

| Task | Files |
|------|-------|
| PG config API (GET + PATCH) | `app/api/pg-config/route.ts` |
| PG config query helpers | `lib/db/queries/pg-configs.ts` |
| Credential resolution | `lib/payments/resolveConfig.ts` ← always use this |
| AES-256-GCM encrypt/decrypt | `lib/payments/encrypt.ts` |
| Payment gateway settings UI | `app/(dashboard)/settings/payment-gateway/page.tsx` |
| PG config form component | `components/dashboard/settings/pg-config-form.tsx` |
| One-time unlock payment | `app/api/embed/unlock/route.ts` (todo), `lib/payments/oneTimeUnlock.ts` (todo) |
| Publisher webhook handler | `app/api/webhooks/publisher/[publisherId]/route.ts` (todo) |
| DB schema | `lib/db/schema.ts` → `publisher_pg_configs`, `pg_webhook_events` |
| Data model reference | `docs/data-model/payments.md` |

---

## Reader intelligence

| Task | Files |
|------|-------|
| Signal collection | `app/api/embed/signal/route.ts`, `lib/intelligence/collectSignal.ts` |
| Content classification | `lib/intelligence/classifyContent.ts`, `lib/db/queries/contentClassifications.ts` |
| URL sanitisation | `lib/intelligence/sanitize.ts` |
| Profile computation | `lib/intelligence/computeProfile.ts` |
| DB schema | `lib/db/schema.ts` → `reader_page_visits`, `content_classifications`, `reader_profiles` |
| Data model reference | `docs/data-model/readers.md` |

---

## Analytics

| Task | Files |
|------|-------|
| Rollup computation | `lib/analytics/rollup.ts` |
| Analytics query helpers | `lib/db/queries/analytics.ts` |
| Analytics API | `app/api/analytics/route.ts` |
| Analytics dashboard page | `app/(dashboard)/analytics/page.tsx` |
| Analytics area chart | `components/dashboard/analytics/analytics-chart.tsx` |
| DB schema | `lib/db/schema.ts` → `gate_events`, `analytics_rollups` |
| Data model reference | `docs/data-model/analytics.md` |

---

## Admin panel

| Task | Files |
|------|-------|
| Admin layout + guard | `app/(admin)/layout.tsx` |
| Publisher list | `app/(admin)/publishers/` |
| Plan management | `app/(admin)/plans/` |
| Admin API | `app/api/admin/` |

---

## DB schema & migrations

| Task | Files |
|------|-------|
| Drizzle schema (all tables) | `lib/db/schema.ts` |
| Drizzle config | `drizzle.config.ts` |
| Migration files | `db/migrations/NNNN_description.sql` |
| Generate migration | `npx drizzle-kit generate` |
| Run migration | `npx drizzle-kit migrate` |
| Data model reference | `docs/data-model/overview.md` |

---

## Design system & UI

| Task | Files |
|------|-------|
| CSS tokens | `app/globals.css` |
| shadcn components | `components/ui/` (button, sidebar, card, badge, avatar, tabs, sheet, skeleton, dropdown-menu, breadcrumb, separator, tooltip) |
| Dashboard shell components | `components/dashboard/sidebar.tsx` |
| Shared layout components | `components/shared/` |
| Root layout + font | `app/layout.tsx` (Inter + Geist Mono) |
| Design reference | `docs/design-system.md` |
