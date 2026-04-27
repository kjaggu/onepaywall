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
| Next.js 15 scaffold | `done` | App Router, TypeScript strict, Tailwind |
| Drizzle + Neon client | `done` | `lib/db/client.ts`, `drizzle.config.ts` |
| shadcn/ui init | `done` | Button component + utils |
| Folder structure | `done` | Per CLAUDE.md spec |
| Founding docs | `done` | CLAUDE.md, AGENTS.md, design-system, data-model (split), file-map, progress |
| .env.example | `done` | |
| Drizzle schema | `done` | All 22 tables defined — users, publishers, domains, gates, readers, ads, payments, analytics |
| DB migrations | `done` | `0000` (foundation tables) + `0001` (gates, readers, ads, payments, analytics, schema additions) |
| CSS design tokens | `done` | Brand (indigo), semantic, surface, text tokens + typography utilities in `app/globals.css` |

---

## Auth
| Area | Status | Notes |
|------|--------|-------|
| DB schema (users) | `done` | users + password_reset_tokens in schema.ts |
| JWT session lib | `done` | `lib/auth/session.ts` — sign, verify, get, set, clear cookie |
| Login page + API | `done` | `app/(auth)/login/page.tsx`, `app/api/auth/login/route.ts` |
| Forgot / reset password | `done` | Pages + API routes + email via Resend |
| Signup page + API | `todo` | No signup flow yet — invite-only or admin-created |
| Session guards | `done` | Dashboard redirects to /login; admin requires superadmin role |

---

## Publisher management
| Area | Status | Notes |
|------|--------|-------|
| DB schema | `done` | publishers, publisher_members in schema.ts |
| Publisher CRUD API | `done` | `app/api/publishers/route.ts` — GET + POST (re-issues session with publisherId) |
| Query helpers | `done` | `lib/db/queries/publishers.ts` |
| Team member management | `todo` | |
| Dashboard shell | `done` | Sidebar nav, layout shell — `app/(dashboard)/layout.tsx`, `components/dashboard/sidebar.tsx` |

---

## Domain management
| Area | Status | Notes |
|------|--------|-------|
| DB schema | `done` | domains in schema.ts — includes site_key, embed_enabled, soft-delete |
| Domain CRUD API | `done` | `app/api/domains/route.ts` (GET+POST) + `app/api/domains/[id]/route.ts` (PATCH+DELETE soft) |
| Query helpers | `done` | `lib/db/queries/domains.ts` |
| Site key generation | `done` | `lib/embed/siteKey.ts` — `opw_` prefixed hex, 44 chars |
| Domain list UI | `done` | `app/(dashboard)/domains/page.tsx` — server component, real data, table + empty state |
| Add domain sheet | `done` | `components/dashboard/domains/add-domain-sheet.tsx` |
| Domain actions | `done` | `components/dashboard/domains/domain-actions.tsx` — pause/activate/remove dropdown |
| Copy site key | `done` | `components/dashboard/domains/copy-site-key.tsx` |

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
| Gate header component | `done` | `components/dashboard/gates/gate-header.tsx` — name/priority/enabled editor |
| URL rules component | `done` | `components/dashboard/gates/gate-rules.tsx` — add/remove glob patterns |
| Steps component | `done` | `components/dashboard/gates/gate-steps.tsx` — add/reorder/delete + per-type config |
| Gate evaluation engine | `todo` | `lib/gates/evaluate.ts` |
| Trigger condition evaluator | `todo` | `lib/gates/conditions.ts` |

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

---

## Ads
| Area | Status | Notes |
|------|--------|-------|
| DB schema | `done` | ad_units, publisher_ad_networks in schema.ts |
| Ad unit CRUD API | `todo` | |
| Upload signed URL | `todo` | |
| Google AdSense adapter | `todo` | `lib/ads/networks/adsense.ts` |
| Google Ad Manager adapter | `todo` | `lib/ads/networks/gam.ts` |
| Ad rotation + relevance | `todo` | `lib/ads/rotate.ts` |
| Ad management UI | `partial` | Placeholder page at `app/(dashboard)/ads/page.tsx` |

---

## Payments
| Area | Status | Notes |
|------|--------|-------|
| DB schema | `done` | publisher_pg_configs, plans, subscriptions, pg_webhook_events in schema.ts |
| PG config API | `todo` | |
| Credential resolver | `todo` | `lib/payments/resolveConfig.ts` |
| OnePaywall billing | `todo` | |
| One-time unlock flow | `todo` | |
| Webhook handler | `todo` | |

---

## Reader intelligence
| Area | Status | Notes |
|------|--------|-------|
| DB schema | `done` | reader_page_visits, content_classifications, reader_profiles in schema.ts |
| Signal collection | `todo` | |
| Content classification | `todo` | |
| URL sanitisation | `todo` | `lib/intelligence/sanitize.ts` |
| Profile computation | `todo` | `lib/intelligence/computeProfile.ts` |

---

## Analytics
| Area | Status | Notes |
|------|--------|-------|
| DB schema | `done` | gate_events, analytics_rollups in schema.ts |
| Event ingestion | `todo` | `lib/analytics/ingest.ts` |
| Rollup computation | `todo` | `lib/analytics/rollup.ts` |
| Analytics dashboard | `partial` | Placeholder page at `app/(dashboard)/analytics/page.tsx` |

---

## Admin panel
| Area | Status | Notes |
|------|--------|-------|
| Admin layout + guard | `done` | `app/admin/layout.tsx` — requires superadmin session |
| Publisher management | `todo` | |
| Plan management | `todo` | |

---

## Dev tooling
| Area | Status | Notes |
|------|--------|-------|
| schema-sync skill | `done` | `.claude/skills/schema-sync.md` |
| simplify hook | `done` | Runs `/simplify` on Stop |
| security-review hook | `done` | Available as `/security-review` |
| shadcn blocks policy | `done` | Documented in CLAUDE.md + design-system.md |
