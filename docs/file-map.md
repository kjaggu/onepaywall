# File Map — Where to Look for What

Check this before exploring the codebase. Find your feature area, then go directly to those files.

---

## Landing page (marketing)

| Task | Files |
|------|-------|
| Root page (imports all sections) | `app/page.tsx` |
| Nav | `components/landing/nav.tsx` |
| Hero (3D mockup + mouse parallax) | `components/landing/hero.tsx` |
| Stats bar (count-up animation) | `components/landing/stats-bar.tsx` |
| Intelligence / problem-solution section | `components/landing/intelligence.tsx` |
| Feature cards (3D hover tilt) | `components/landing/features.tsx` |
| Embed section (code block) | `components/landing/embed-section.tsx` |
| BYOK gateway section | `components/landing/gateway-section.tsx` |
| Privacy / data ownership section | `components/landing/privacy-section.tsx` |
| Pricing section | `components/landing/pricing-section.tsx` |
| Final CTA section | `components/landing/cta-section.tsx` |
| Footer | `components/landing/footer.tsx` |
| Dashboard mockups (dummy data) | `components/landing/mockups/analytics-mockup.tsx`, `intelligence-mockup.tsx`, `revenue-mockup.tsx` |
| Animation hooks | `components/landing/hooks/use-scroll-reveal.ts`, `use-counter.ts`, `use-mouse-parallax.ts` |
| Landing CSS (keyframes, lp-* classes) | `app/globals.css` (lp-* section at bottom) |

---

## Auth & session

| Task | Files |
|------|-------|
| Login / register pages | `app/(auth)/login/page.tsx`, `app/(auth)/register/page.tsx` |
| Forgot / reset password pages | `app/(auth)/forgot-password/page.tsx`, `app/(auth)/reset-password/page.tsx` |
| Session creation / JWT | `lib/auth/session.ts` |
| Session guards | `app/(dashboard)/layout.tsx`, `app/admin/layout.tsx` |
| Auth API endpoints | `app/api/auth/login/route.ts`, `app/api/auth/register/route.ts`, `app/api/auth/logout/route.ts`, `app/api/auth/forgot-password/route.ts`, `app/api/auth/reset-password/route.ts` |
| Publisher registration | `lib/auth/register.ts` |
| User/password helpers | `lib/auth/users.ts`, `lib/auth/reset-tokens.ts`, `lib/auth/email.ts` |
| DB schema | `lib/db/schema.ts` → `users` table |

---

## Publisher onboarding & management

| Task | Files |
|------|-------|
| Publisher CRUD | `app/api/publishers/route.ts`, `lib/db/queries/publishers.ts` |
| Publisher settings | `app/api/publisher-settings/route.ts`, `app/(dashboard)/settings/general/page.tsx` |
| Team members | `app/(dashboard)/settings/team/page.tsx` (UI scaffold only) |
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
| Domain detail | `app/(dashboard)/domains/[id]/page.tsx`, `app/(dashboard)/domains/[id]/layout.tsx` |
| Domain embed setup | `app/(dashboard)/domains/[id]/embed/page.tsx`, `app/api/domains/[id]/verify-embed/route.ts` |
| Domain settings | `app/(dashboard)/domains/[id]/settings/page.tsx` |
| Domain free-pages (whitelist) | `app/(dashboard)/domains/[id]/free-pages/page.tsx` |
| Add domain sheet | `components/dashboard/domains/add-domain-sheet.tsx` |
| Domain status actions | `components/dashboard/domains/domain-status-actions.tsx` |
| Copy site key button | `components/dashboard/domains/copy-site-key.tsx` |
| Copy embed script snippet | `components/dashboard/domains/copy-embed-script.tsx` |
| Embed verify button | `components/dashboard/domains/embed-verify-button.tsx` |
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
| Gate builder pages | `app/(dashboard)/gates/[id]/page.tsx`, `app/(dashboard)/gates/[id]/layout.tsx`, `app/(dashboard)/gates/[id]/steps/page.tsx`, `app/(dashboard)/gates/[id]/triggers/page.tsx` |
| Gate header editor | `components/dashboard/gates/gate-header.tsx` |
| URL rules manager | `components/dashboard/gates/gate-rules.tsx` |
| Steps manager | `components/dashboard/gates/gate-steps.tsx` |
| Trigger conditions manager | `components/dashboard/gates/gate-triggers.tsx` |
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
| Embed test harness | `app/embed/test/page.tsx` |
| DB schema | `lib/db/schema.ts` → `readers`, `reader_tokens`, `gate_unlocks` |
| Data model reference | `docs/data-model/readers.md` |

---

## Ads

| Task | Files |
|------|-------|
| Ad unit CRUD | `app/api/ads/route.ts`, `app/api/ads/[id]/route.ts` |
| Upload signed URL | `app/api/ads/upload-url/route.ts` |
| Ad unit query helpers | `lib/db/queries/ads.ts` |
| Ad network connection | `app/(dashboard)/ads/networks/page.tsx` (UI scaffold; adapters not built yet) |
| Ad settings | `app/(dashboard)/ads/settings/page.tsx` |
| Ad rotation + relevance | `lib/ads/rotate.ts` (todo) |
| Ad management page | `app/(dashboard)/ads/page.tsx`, `app/(dashboard)/ads/layout.tsx` |
| Create ad unit sheet | `components/dashboard/ads/create-ad-sheet.tsx` |
| DB schema | `lib/db/schema.ts` → `ad_units`, `publisher_ad_networks` |
| Data model reference | `docs/data-model/ads.md` |

---

## Revenue

| Task | Files |
|------|-------|
| Revenue API (list + summary) | `app/api/revenue/route.ts` |
| Transaction query helpers | `lib/db/queries/transactions.ts` |
| Revenue page (filterable transaction ledger + CSV export) | `app/(dashboard)/revenue/page.tsx` |
| DB schema | `lib/db/schema.ts` → `reader_transactions` |

---

## Plans (reader monetization)

| Task | Files |
|------|-------|
| Publisher plans API (GET/PUT subscriptions + unlock) | `app/api/publisher-plans/route.ts` |
| Per-URL price delete | `app/api/publisher-plans/prices/[id]/route.ts` |
| Plans query helpers | `lib/db/queries/publisher-plans.ts` |
| Reader subscription query helpers | `lib/db/queries/reader-subscriptions.ts` |
| Pricing pages (subscriptions + article unlock + per-URL overrides) | `app/(dashboard)/pricing/page.tsx`, `app/(dashboard)/pricing/article-unlock/page.tsx`, `app/(dashboard)/pricing/layout.tsx` |
| Pricing form components | `components/dashboard/pricing/subscriptions-form.tsx`, `components/dashboard/pricing/article-unlock-form.tsx` |
| DB schema | `lib/db/schema.ts` → `publisher_reader_plans`, `publisher_content_prices`, `reader_subscribers`, `reader_subscriptions`, `reader_subscription_links`, `reader_subscription_magic_links` |

---

## Payments — OnePaywall billing

| Task | Files |
|------|-------|
| Plan management UI | `app/admin/plans/page.tsx` (static/mock admin UI) |
| Publisher subscription | `app/api/billing/route.ts`, `lib/payments/billing.ts` |
| Billing query helpers | `lib/db/queries/billing.ts` |
| Billing settings UI | `app/(dashboard)/settings/billing/page.tsx`, `components/dashboard/settings/billing-manager.tsx` |
| Billing banner/topbar state | `components/dashboard/billing-banner.tsx`, `components/dashboard/topbar.tsx` |
| Billing enforcement cron | `app/api/cron/billing-enforcement/route.ts` |
| Razorpay webhook (platform) | `app/api/webhooks/billing/route.ts` |
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
| One-time unlock payment | `app/api/embed/unlock/route.ts`, `lib/payments/oneTimeUnlock.ts`, `lib/payments/resolveUnlockPrice.ts`, `lib/payments/recordUnlock.ts` |
| Reader subscription payment | `app/api/embed/subscription/route.ts`, `lib/payments/readerSubscriptions.ts`, `lib/payments/readerSubscriptionWebhooks.ts` |
| Publisher webhook handler | `app/api/webhooks/publisher/[publisherId]/route.ts` |
| Platform reader webhook handler | `app/api/webhooks/reader/razorpay/route.ts` |
| DB schema | `lib/db/schema.ts` → `publisher_pg_configs`, `pg_webhook_events` |
| Data model reference | `docs/data-model/payments.md` |

---

## Reader intelligence

| Task | Files |
|------|-------|
| Signal collection | `app/api/embed/signal/route.ts` |
| Content classification | `lib/intelligence/classifyContent.ts`, `lib/db/queries/contentClassifications.ts` (todo) |
| URL sanitisation | `lib/intelligence/sanitize.ts` |
| Profile computation | `lib/intelligence/computeProfile.ts` (todo) |
| DB schema | `lib/db/schema.ts` → `reader_page_visits`, `content_classifications`, `reader_profiles` |
| Data model reference | `docs/data-model/readers.md` |

---

## Analytics

| Task | Files |
|------|-------|
| Rollup computation | `lib/analytics/rollup.ts` |
| Analytics query helpers | `lib/db/queries/analytics.ts` |
| Analytics API | `app/api/analytics/route.ts` |
| Analytics dashboard pages | `app/(dashboard)/analytics/page.tsx`, `app/(dashboard)/analytics/[domainId]/page.tsx` |
| Analytics area chart | `components/dashboard/analytics/analytics-chart.tsx` |
| Analytics filters | `components/dashboard/analytics/range-filter.tsx`, `components/dashboard/analytics/gate-filter.tsx` |
| DB schema | `lib/db/schema.ts` → `gate_events`, `analytics_rollups` |
| Data model reference | `docs/data-model/analytics.md` |

---

## Admin panel

| Task | Files |
|------|-------|
| Admin layout + guard | `app/admin/layout.tsx` |
| Admin shell components | `components/admin/sidebar.tsx`, `components/admin/topbar.tsx` |
| Admin overview | `app/admin/page.tsx` |
| Publisher list/detail | `app/admin/publishers/page.tsx`, `app/admin/publishers/[id]/page.tsx` |
| Plan management | `app/admin/plans/page.tsx` |
| Subscription management | `app/admin/subscriptions/page.tsx` |
| Platform health | `app/admin/health/page.tsx` |
| Admin settings | `app/admin/settings/page.tsx` |
| Admin API | not implemented yet |

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
