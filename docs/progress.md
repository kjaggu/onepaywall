# Build Progress

Updated at the end of every meaningful session. Read this before starting work to know what exists.

---

## Status key
- `done` — built, committed, works
- `partial` — scaffolded or in progress
- `todo` — not started

---

## Foundation
| Area | Status | Notes |
|------|--------|-------|
| Next.js 16 scaffold | `done` | App Router, TypeScript strict, Tailwind |
| Drizzle + Neon client | `done` | `lib/db/client.ts`, `drizzle.config.ts` |
| shadcn/ui init | `done` | Button component + utils |
| Folder structure | `done` | Per CLAUDE.md spec |
| Founding docs | `done` | CLAUDE.md, AGENTS.md, design-system, data-model (split), file-map, progress |
| .env.example | `done` | |
| Drizzle schema | `done` | Core tables plus reader subscription tables defined — users, publishers, domains, gates, readers, ads, payments, analytics |
| DB migrations | `done` | `0000`–`0008`; `0007` adds reader subscriptions + publisher reader-plan Razorpay sync state; `0008` adds transaction-attempt details |
| Migration runner | `done` | `scripts/migrate.mjs` — tracks state in `_migrations` table, handles drizzle + hand-written SQL, idempotent. `npm run db:migrate` / `db:migrate:status` |
| CSS design tokens | `done` | Brand (indigo), semantic, surface, text tokens + typography utilities in `app/globals.css` |

---

## Auth
| Area | Status | Notes |
|------|--------|-------|
| DB schema (users) | `done` | users + password_reset_tokens in schema.ts |
| JWT session lib | `done` | `lib/auth/session.ts` — sign, verify, get, set, clear cookie |
| Login page + API | `done` | `app/(auth)/login/page.tsx`, `app/api/auth/login/route.ts` |
| Forgot / reset password | `done` | Pages + API routes + email via Resend |
| Register page + API | `done` | `app/(auth)/register/page.tsx`, `app/api/auth/register/route.ts`, `lib/auth/register.ts` — creates user, publisher, owner membership, Starter trial, session |
| Session guards | `done` | Dashboard redirects to /login; admin requires superadmin role |

---

## Publisher management
| Area | Status | Notes |
|------|--------|-------|
| DB schema | `done` | publishers, publisher_members in schema.ts |
| Publisher CRUD API | `done` | `app/api/publishers/route.ts` — GET + POST (re-issues session with publisherId) |
| Query helpers | `done` | `lib/db/queries/publishers.ts` |
| Publisher settings API | `done` | `app/api/publisher-settings/route.ts` — name, currency, timezone |
| Team member management | `todo` | |
| Dashboard shell | `done` | Sidebar nav, layout shell — `app/(dashboard)/layout.tsx`, `components/dashboard/sidebar.tsx` |

---

## Domain management
| Area | Status | Notes |
|------|--------|-------|
| DB schema | `done` | domains in schema.ts — includes site_key, embed_enabled, whitelisted_paths, soft-delete |
| Domain CRUD API | `done` | `app/api/domains/route.ts` (GET+POST) + `app/api/domains/[id]/route.ts` (PATCH+DELETE soft) |
| Query helpers | `done` | `lib/db/queries/domains.ts` |
| Site key generation | `done` | `lib/embed/siteKey.ts` — `opw_` prefixed hex, 44 chars |
| Domain list UI | `done` | `app/(dashboard)/domains/page.tsx` — server component, real data, table + empty state |
| Add domain sheet | `done` | `components/dashboard/domains/add-domain-sheet.tsx` |
| Domain actions | `done` | `components/dashboard/domains/domain-status-actions.tsx` — pause/activate/remove dropdown |
| Copy site key | `done` | `components/dashboard/domains/copy-site-key.tsx` |
| Domain detail page | `done` | `app/(dashboard)/domains/[id]/page.tsx` — embed script snippet + install guide |
| Domain embed setup page | `done` | `app/(dashboard)/domains/[id]/embed/page.tsx` + `app/api/domains/[id]/verify-embed/route.ts` |
| Domain settings page | `done` | `app/(dashboard)/domains/[id]/settings/page.tsx` |
| Copy embed script | `done` | `components/dashboard/domains/copy-embed-script.tsx` — syntax-highlighted snippet with copy button |
| Whitelisted paths UI | `done` | `app/(dashboard)/domains/[id]/free-pages/page.tsx` + `components/dashboard/domains/domain-whitelist.tsx` |
| Whitelist enforcement | `done` | `app/api/embed/gate-check/route.ts` — whitelisted paths skip gate evaluation entirely |

---

## Gate builder
| Area | Status | Notes |
|------|--------|-------|
| DB schema | `done` | gates, gate_steps, gate_rules in schema.ts |
| Gate query helpers | `done` | `lib/db/queries/gates.ts` — gates, steps, rules CRUD with ownership checks |
| Gate CRUD API | `done` | `app/api/gates/` + `app/api/gates/[id]/` — GET/POST/PATCH/DELETE |
| Step CRUD API | `done` | `app/api/gates/[id]/steps/` + `app/api/gates/[id]/steps/[stepId]/` |
| Rule CRUD API | `done` | `app/api/gates/[id]/rules/` + `app/api/gates/[id]/rules/[ruleId]/` |
| Gates list page | `done` | `app/(dashboard)/gates/page.tsx` — grouped by domain, create-gate sheet |
| Gate builder page | `done` | `app/(dashboard)/gates/[id]/page.tsx` — header, rules, steps |
| Gate steps page | `done` | `app/(dashboard)/gates/[id]/steps/page.tsx` |
| Gate triggers page | `done` | `app/(dashboard)/gates/[id]/triggers/page.tsx`, `components/dashboard/gates/gate-triggers.tsx` |
| Gate header component | `done` | `components/dashboard/gates/gate-header.tsx` — name/priority/enabled editor |
| URL rules component | `done` | `components/dashboard/gates/gate-rules.tsx` — add/remove glob patterns |
| Steps component | `done` | `components/dashboard/gates/gate-steps.tsx` — add/reorder/delete + per-type config |
| Gate evaluation engine | `done` | `lib/gates/evaluate.ts` — priority ordering, URL glob matching, unlock check, trigger conditions |
| Trigger condition evaluator | `done` | Inline in `lib/gates/evaluate.ts` — minVisitCount, maxVisitCount, deviceType |

---

## Embed script
| Area | Status | Notes |
|------|--------|-------|
| DB schema | `done` | readers, reader_tokens, gate_unlocks in schema.ts |
| Reader fingerprinting | `done` | `lib/embed/fingerprint.ts` — SHA-256(clientId:UA), no IP stored |
| Reader token resolution | `done` | `lib/embed/readerToken.ts` — upsert reader + token, visit_count increment |
| Gate evaluation engine | `done` | `lib/gates/evaluate.ts` — rule matching, unlock check, trigger conditions |
| URL sanitizer | `done` | `lib/intelligence/sanitize.ts` — strips PII params, normalises |
| Gate-check endpoint | `done` | `app/api/embed/gate-check/route.ts` — GET, Cache-Control: private |
| Signal endpoint | `done` | `app/api/embed/signal/route.ts` — POST, fire-and-forget via sendBeacon |
| Event endpoint | `done` | `app/api/embed/event/route.ts` — POST, gate event recording |
| Embed JS bundle | `done` | `public/embed/embed.js` — 11.7KB raw / 3.4KB gzip, vanilla JS |
| Embed test page | `done` | `app/embed/test/page.tsx` |

---

## Ads (Phase 3 complete)
| Area | Status | Notes |
|------|--------|-------|
| DB schema | `done` | ad_units, publisher_ad_networks in schema.ts |
| Ad unit CRUD API | `done` | `app/api/ads/route.ts`, `app/api/ads/[id]/route.ts`, `lib/db/queries/ads.ts` — includes `listActiveAdUnits` for rotation engine |
| Upload signed URL | `done` | `app/api/ads/upload-url/route.ts` — AWS SigV4 presigned PUT URL; try-catch on request body |
| Ad selection engine | `done` | `lib/ads/rotate.ts` — weighted relevance scoring against reader crossPublisherInterests; 9 unit tests passing |
| Google AdSense adapter | `done` | `lib/ads/networks/adsense.ts` — pure render config resolver |
| Google Ad Manager adapter | `done` | `lib/ads/networks/gam.ts` — pure render config resolver |
| Gate-check ad injection | `done` | `app/api/embed/gate-check/route.ts` — selects ad unit, injects config into step.config; resolves network ad config |
| Embed.js real ad rendering | `done` | `public/embed/embed.js` — image + video rendering, skip timer, CTA, fallback; bundle 7.7KB gzip |
| Event adUnitId attribution | `done` | `app/api/embed/event/route.ts` — writes adUnitId to gate_events |
| Ad network credential CRUD | `done` | `lib/db/queries/ad-networks.ts`, `app/api/ads/networks/route.ts`, `app/api/ads/networks/[id]/route.ts` — AES-256-GCM encrypted credentials |
| Ad analytics queries | `done` | `lib/db/queries/ad-analytics.ts` — per-unit, per-segment, per-category stats |
| Ad analytics API | `done` | `app/api/ads/analytics/route.ts` |
| Ad analytics page | `done` | `app/(dashboard)/ads/analytics/page.tsx` — impressions, completion %, skip %, fill %; analytics tab added to layout |
| Ad network connection UI | `done` | `app/(dashboard)/ads/networks/page.tsx` — connects AdSense/GAM, manage active/pause/disconnect |
| Connect sheets | `done` | `components/dashboard/ads/connect-adsense-sheet.tsx`, `components/dashboard/ads/connect-gam-sheet.tsx` |
| Create ad unit sheet | `done` | `components/dashboard/ads/create-ad-sheet.tsx` — source toggle: direct upload or network; network branch selects connected network + slot/path config |
| Migration | `done` | `db/migrations/0016_ad_intelligence.sql` — partial index on gate_events.ad_unit_id |

---

## Payments
| Area | Status | Notes |
|------|--------|-------|
| DB schema | `done` | publisher_pg_configs, plans, subscriptions, pg_webhook_events in schema.ts |
| AES-256-GCM encrypt/decrypt | `done` | `lib/payments/encrypt.ts` — iv+tag+ciphertext hex, keyed from PG_ENCRYPTION_KEY env |
| PG config query helpers | `done` | `lib/db/queries/pg-configs.ts` — getOrCreate, update (encrypts secrets), resolveDecrypted |
| Credential resolver | `done` | `lib/payments/resolveConfig.ts` — always call this; returns platform or own keys decrypted |
| PG config API | `done` | `app/api/pg-config/route.ts` — GET (never returns secrets) + PATCH |
| Payment gateway settings UI | `done` | `app/(dashboard)/settings/payment-gateway/page.tsx` + `components/dashboard/settings/pg-config-form.tsx` |
| OnePaywall billing — schema + API + webhook | `done` | Session 2a — migration `0006`, `lib/payments/billing.ts`, `app/api/billing/route.ts`, `app/api/webhooks/billing/route.ts`, signup hook in `lib/auth/register.ts`, `/api/me` extended for sub state |
| OnePaywall billing — UI | `done` | Session 2b — `/settings/billing` plan picker + manage view, `BillingBanner`, topbar plan-tone badge, Razorpay Checkout integration |
| OnePaywall billing — enforcement (Session 2c) | `done` | Cron worker at `app/api/cron/billing-enforcement/route.ts`; suspends past-due/expired-trial publishers; MAU per domain enforcement added — pauses domains over limit using `getDomainMauCurrentMonth` |
| One-time unlock flow | `done` | `app/api/embed/unlock/route.ts` create+verify; embed checkout; price resolution via `lib/payments/resolveUnlockPrice.ts` (URL override → publisher default → step config); revenue + unlock recorded atomically via `lib/payments/recordUnlock.ts`, idempotent on `razorpay_payment_id` |
| Reader subscriptions | `done` | Publisher membership intervals sync to Razorpay in platform or own-key mode; embed checkout + email magic-link restore; publisher-wide access bypass in gate-check |
| Reader subscription APIs | `done` | `app/api/embed/subscription/route.ts` — create, verify, restore-request, restore-confirm |
| Webhook handlers | `done` | `app/api/webhooks/publisher/[publisherId]/route.ts` handles own-key unlock/subscription events; `app/api/webhooks/reader/razorpay/route.ts` handles platform reader subscription events; `app/api/webhooks/billing/route.ts` remains SaaS billing only |
| Revenue ledger | `done` | `reader_transactions` now tracks pending/completed/failed reader payments, reader email hash/encrypted email, Razorpay order/payment/subscription IDs, failure reason, and completion timestamps |
| Publisher revenue dashboard | `done` | `/revenue` shows subscriptions + one-time unlocks, statuses, reader email/hash, domain/content, provider IDs, failure reasons, and CSV export for reconciliation/invoicing |
| Publisher invoice workflow | `done` | `publisher_invoices` table + sequential numbering; "Invoice" button per completed transaction in `/revenue`; `/invoices` list page + sidebar entry; download renders clean printable HTML at `GET /api/invoices/[id]/download` |

---

## Reader intelligence
| Area | Status | Notes |
|------|--------|-------|
| DB schema | `done` | reader_page_visits, content_classifications, reader_profiles in schema.ts |
| Signal collection | `done` | `app/api/embed/signal/route.ts` — writes reader_page_visits (readTime, scrollDepth, device, referrer origin) |
| URL sanitisation | `done` | `lib/intelligence/sanitize.ts` — strips PII query params, normalises |
| Content classification | `done` | `lib/intelligence/classifyContent.ts` — keyword classifier → 10 categories; caches in content_classifications; 30-day TTL |
| Profile computation | `done` | `lib/intelligence/computeProfile.ts` — engagement score, topic interests, monetizationProbability, segment, visitFrequency |
| Profile cron endpoint | `done` | `app/api/cron/compute-profiles/route.ts` — batch recomputes stale profiles |
| Trigger.dev integration | `done` | `trigger/compute-profiles.ts` — scheduleProfileCompute task; every-5th-signal + gate_passed/ad_complete event triggers |
| Gate targeting conditions | `done` | `lib/gates/evaluate.ts` — minMonetizationProbability, readerSegments conditions |

---

## Analytics
| Area | Status | Notes |
|------|--------|-------|
| DB schema | `done` | gate_events, analytics_rollups in schema.ts |
| Gate event recording | `done` | `app/api/embed/event/route.ts` — writes gate_events (gate_shown, step_shown, gate_passed, ad_*, unlock_*, subscription_cta_*) |
| Rollup computation | `done` | `lib/analytics/rollup.ts` — lazy upsert from gate_events per domain+gate+day |
| Analytics queries | `done` | `lib/db/queries/analytics.ts` — getSummary (gate_events direct), getDailySeries (rollups) |
| Analytics API | `done` | `app/api/analytics/route.ts` — GET, refreshes rollups then serves summary + daily series |
| Analytics dashboard | `done` | `app/(dashboard)/analytics/page.tsx`, `app/(dashboard)/analytics/[domainId]/page.tsx`, `components/dashboard/analytics/analytics-chart.tsx` — real stats + area chart (recharts), filters |

---

## Media Analytics (Phase 2)
| Area | Status | Notes |
|------|--------|-------|
| DB schema — page_events | `done` | `db/migrations/0015_page_events.sql` + `lib/db/schema.ts` (pageEvents, sourceStats) |
| page_view embed event | `done` | `public/embed/embed.js` — fires after token resolved; `app/api/embed/page-event/route.ts` |
| read_complete embed event | `done` | embed.js — 5s polling: scrollDepth ≥80% + elapsed ≥30s; fires once |
| Source stats rollup | `done` | `lib/analytics/source-stats.ts` — lazy upsert on content page load |
| Content analytics queries | `done` | `lib/db/queries/content-analytics.ts` — 8 functions: getTopContent, getSourceAttribution, getReaderJourneyFunnel, getActiveReaderCount, getSegmentDistribution, getTopicInterestDistribution, getMonetizationHistogram, getVisitFrequencyBreakdown |
| Content analytics page | `done` | `app/(dashboard)/analytics/content/page.tsx` — funnel, top content table, source attribution |
| Audience page rewrite | `done` | `app/(dashboard)/audience/page.tsx` — segment distribution, topic interests, monetization histogram, visit frequency |
| Domain analytics extension | `done` | `app/(dashboard)/analytics/[domainId]/page.tsx` — top content section + "See all" link |
| Sidebar nav | `done` | Content link added under Measure group in `components/dashboard/sidebar.tsx` |

---

## Phase 4 — Lead Capture + Digital Products
| Area | Status | Notes |
|------|--------|-------|
| DB migration | `done` | `db/migrations/0017_phase4_lead_digital.sql` — extends step_type + unlock_type enums, adds source/notes to reader_subscribers, new tables: publisher_digital_products, subscriber_tags, publisher_webhooks |
| Schema.ts updates | `done` | publisherDigitalProducts, subscriberTags, publisherWebhooks tables; updated enums |
| Lead capture lib | `done` | `lib/leads/captureLeadEmail.ts` — upserts subscriber with source='lead_capture', links reader, writes gate_unlock |
| Webhook fire lib | `done` | `lib/leads/fireWebhooks.ts` — fire-and-forget POST to active publisher webhooks on lead_captured |
| Embed route: lead capture | `done` | `app/api/embed/lead-capture/route.ts` — POST validates token, creates subscriber, fires webhooks async |
| Embed JS: lead_capture step | `done` | `public/embed/embed.js` — email + optional name + GDPR checkbox + CTA form |
| R2 presigned URL helper | `done` | `lib/digital-products/r2.ts` — AWS Sig V4 presigned GET URL (Node.js crypto, no external SDK) |
| Digital products DB queries | `done` | `lib/db/queries/digital-products.ts` — CRUD + incrementDownloadCount |
| Digital products lib | `done` | `lib/digital-products/createDownloadOrder.ts`, `lib/digital-products/recordDownloadUnlock.ts` |
| Embed route: digital product | `done` | `app/api/embed/digital-product/route.ts` — create/verify actions; verify returns presigned R2 download URL |
| Embed JS: digital_product step | `done` | `public/embed/embed.js` — product card, Razorpay checkout, auto-download on success |
| Digital products upload API | `done` | `app/api/digital-products/upload/route.ts` — presigned PUT URL with AWS Sig V4 |
| Digital products CRUD API | `done` | `app/api/digital-products/route.ts`, `app/api/digital-products/[id]/route.ts` |
| Digital products dashboard | `done` | `app/(dashboard)/digital-products/page.tsx` + `layout.tsx` — list + add sheet with file upload |
| Sidebar nav update | `done` | "Products" link added under Monetise group |
| Subscriber CRM queries | `done` | `listSubscribersCrm` + `updateSubscriberNotes` added to `lib/db/queries/reader-subscriptions.ts` |
| Subscriber tags queries | `done` | `lib/db/queries/subscriber-tags.ts` — add/remove/get tags |
| Subscribers CRM API | `done` | `app/api/subscribers/crm/route.ts`, `app/api/subscribers/crm/[id]/route.ts` |
| Tags API | `done` | `app/api/subscribers/tags/route.ts` — POST/DELETE |
| Export API | `done` | `app/api/subscribers/export/route.ts` — CSV with segment filter |
| Subscribers Leads page | `done` | `app/(dashboard)/subscribers/leads/page.tsx` — segment filter, tags, inline notes, export |
| Subscribers layout (tabs) | `done` | `app/(dashboard)/subscribers/layout.tsx` — Subscriptions / Leads tabs |
| Publisher webhooks queries | `done` | `lib/db/queries/publisher-webhooks.ts` — CRUD |
| Publisher webhooks API | `done` | `app/api/publisher-webhooks/route.ts`, `app/api/publisher-webhooks/[id]/route.ts` |
| Webhook settings page | `done` | `app/(dashboard)/settings/webhooks/page.tsx` — replaces "coming soon" with full CRUD UI |
| Gate step editor extension | `done` | `components/dashboard/gates/gate-steps.tsx` — lead_capture + digital_product config editors; product selector loads from API |

---

## Admin panel
| Area | Status | Notes |
|------|--------|-------|
| Admin layout + guard | `done` | `app/admin/layout.tsx` — requires superadmin session |
| Admin dashboard shell | `done` | `components/admin/sidebar.tsx`, `components/admin/topbar.tsx` |
| Admin overview | `done` | `app/admin/page.tsx` — async server component; live MRR, publishers, domains, gate decisions/day, recent publishers table, MRR-by-plan, alerts |
| Publisher list | `done` | `app/admin/publishers/page.tsx` — client component fetches `/api/admin/publishers`; search + plan/status badges |
| Publisher detail | `done` | `app/admin/publishers/[id]/page.tsx` — async server component; domains with gate count + last ping, team members |
| Plan management | `done` | `app/admin/plans/page.tsx` — async server component; live subscriber counts + MRR per plan |
| Subscription management | `done` | `app/admin/subscriptions/page.tsx` — client component fetches `/api/admin/subscriptions`; status filter + search |
| Admin query helpers | `done` | `lib/db/queries/admin.ts` — getPlatformStats, listAllPublishers, getPublisherDetail, listAllSubscriptions, getPlansWithStats |
| Admin API routes | `done` | `app/api/admin/publishers/route.ts`, `app/api/admin/subscriptions/route.ts` — superadmin-guarded |
| Platform health | `done` | `app/admin/health/page.tsx` — async server component with real data; `getDomainsHealth()` in admin.ts drives per-domain last-ping, calls/day, health status |

---

## Landing page
| Area | Status | Notes |
|------|--------|-------|
| Marketing landing page | `done` | `app/page.tsx` + `components/landing/` — full dark-theme page with Nav, Hero (3D mockup), StatsBar, Intelligence, Features, EmbedSection, GatewaySection, PrivacySection, PricingSection, CTA, Footer |
| Dashboard mockup components | `done` | `components/landing/mockups/` — AnalyticsMockup, IntelligenceMockup, RevenueMockup with dummy data |
| Motion system | `done` | CSS keyframes + scroll-reveal hook (IntersectionObserver) + counter hook (rAF) + mouse-parallax hook; 3D CSS perspective on hero mockup, tilt on feature cards |
| Landing CSS utilities | `done` | `app/globals.css` — lp-* keyframes, scroll reveal classes, stagger utilities, gradient text, btn-primary/ghost classes |

---

## Phase 5 — Publisher Email & Automation
| Area | Status | Notes |
|------|--------|-------|
| DB migration | `done` | `db/migrations/0018_email_automation.sql` — publisher_email_configs, campaigns, automations, email_automation_runs, email_events; unsubscribe_token + unsubscribed_at on reader_subscribers |
| Schema.ts updates | `done` | publisherEmailConfigs, publisherEmailCampaigns, publisherEmailAutomations, emailAutomationRuns, emailEvents tables |
| Email provider lib | `done` | `lib/email/provider.ts` — Resend wrapper with API key decryption |
| Segment filter lib | `done` | `lib/email/segments.ts` — joins reader_subscribers + reader_profiles; 4 filter dimensions |
| Tracking lib | `done` | `lib/email/tracking.ts` — Base64 token, wraps links + 1×1 pixel injection |
| Unsubscribe lib | `done` | `lib/email/unsubscribe.ts` — token validation, sets unsubscribed_at |
| Automation engine | `done` | `lib/email/automations/engine.ts` — evaluateAutomations; dedup via email_automation_runs |
| Automation triggers | `done` | `lib/email/automations/triggers.ts` — 4 trigger types + eventMatchesAutomation |
| Config API | `done` | `app/api/email/config/route.ts` — GET/PUT; encrypts Resend API key |
| Campaigns API | `done` | `app/api/email/campaigns/route.ts` + `[id]/route.ts` — CRUD |
| Automations API | `done` | `app/api/email/automations/route.ts` + `[id]/route.ts` — CRUD + status toggle |
| Send-campaign API | `done` | `app/api/email/send-campaign/route.ts` — internal; batch send to segment; guarded by CRON_SECRET |
| Open/click tracking | `done` | `app/api/email/track/open/[token]/route.ts`, `click/[token]/route.ts` — write email_events |
| Unsubscribe API | `done` | `app/api/email/unsubscribe/[token]/route.ts` — marks subscriber inactive, returns confirmation page |
| Domain verification API | `done` | `app/api/email/verify-domain/route.ts` — polls Resend DKIM/SPF, updates domain_verified_at |
| Resend webhook | `done` | `app/api/email/webhook/route.ts` — Svix signature, bounces + complaints → auto-suppress |
| Email hub page | `done` | `app/(dashboard)/email/page.tsx` — subscriber count, last campaign, active automation count |
| Campaigns page | `done` | `app/(dashboard)/email/campaigns/page.tsx` — list + create + send-now button |
| Automations page | `done` | `app/(dashboard)/email/automations/page.tsx` — list + activate/pause + create sheet |
| Settings page | `done` | `app/(dashboard)/email/settings/page.tsx` — Resend key, from fields, DKIM/SPF status chip |
| Email layout | `done` | `app/(dashboard)/email/layout.tsx` — Overview / Campaigns / Automations / Settings tabs |
| Sidebar nav | `done` | "Email" link added under Monetise group in sidebar.tsx |
| Integration: lead capture | `done` | `app/api/embed/lead-capture/route.ts` — fires new_subscriber automation after subscriber insert |
| Integration: ad engaged | `done` | `app/api/embed/event/route.ts` — fires ad_engaged automation on ad_complete/ad_skip |
| Integration: segment changed | `done` | `lib/intelligence/computeProfile.ts` — fires segment_entered automation on segment transition |
| Trigger.dev: campaign scheduler | `done` | `trigger/email-campaigns.ts` — every 5 min cron; sends scheduled campaigns atomically |
| Trigger.dev: inactivity check | `done` | `trigger/email-inactivity.ts` — daily 06:00 UTC; fires inactivity automation for dormant subscribers |

---

## Dev tooling
| Area | Status | Notes |
|------|--------|-------|
| schema-sync skill | `done` | `.claude/skills/schema-sync.md` |
| simplify hook | `done` | Runs `/simplify` on Stop |
| security-review hook | `done` | Available as `/security-review` |
| shadcn blocks policy | `done` | Documented in CLAUDE.md + design-system.md |
| Billing seed/backfill scripts | `done` | `scripts/seed-plans.mjs`, `scripts/backfill-trial-subs.mjs`, `scripts/verify-billing-enforcement.mjs` |
