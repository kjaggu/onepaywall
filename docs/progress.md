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
| Drizzle schema | `todo` | `lib/db/schema.ts` is a stub — no tables yet |
| DB migrations | `todo` | No migrations yet |
| CSS design tokens | `done` | Brand (indigo), semantic, surface, text tokens + typography utilities in `app/globals.css` |

---

## Auth
| Area | Status | Notes |
|------|--------|-------|
| DB schema (users) | `todo` | |
| JWT session lib | `todo` | `lib/auth/session.ts` |
| Login page + API | `todo` | |
| Signup page + API | `todo` | |
| Session guards | `todo` | Dashboard + admin layout guards |

---

## Publisher management
| Area | Status | Notes |
|------|--------|-------|
| DB schema | `todo` | publishers, publisher_members |
| Publisher CRUD API | `todo` | |
| Team member management | `todo` | |
| Dashboard shell | `done` | Sidebar nav, layout shell — `app/(dashboard)/layout.tsx`, `components/dashboard/sidebar.tsx` |

---

## Domain management
| Area | Status | Notes |
|------|--------|-------|
| DB schema | `todo` | domains |
| Domain CRUD API | `todo` | |
| Site key generation | `todo` | `lib/embed/siteKey.ts` |
| Domain list UI | `partial` | Placeholder page at `app/(dashboard)/domains/page.tsx` |

---

## Gate builder
| Area | Status | Notes |
|------|--------|-------|
| DB schema | `todo` | gates, gate_steps, gate_rules |
| Gate CRUD API | `todo` | |
| Gate evaluation engine | `todo` | `lib/gates/evaluate.ts` |
| Trigger condition evaluator | `todo` | `lib/gates/conditions.ts` |
| Gate builder UI | `todo` | |

---

## Embed script
| Area | Status | Notes |
|------|--------|-------|
| DB schema | `todo` | readers, reader_tokens, gate_unlocks |
| Gate-check endpoint | `todo` | `/api/embed/gate-check` |
| Signal endpoint | `todo` | `/api/embed/signal` |
| Event endpoint | `todo` | `/api/embed/event` |
| Reader fingerprinting | `todo` | `lib/embed/fingerprint.ts` |
| Embed JS bundle | `todo` | |

---

## Ads
| Area | Status | Notes |
|------|--------|-------|
| DB schema | `todo` | ad_units, publisher_ad_networks |
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
| DB schema | `todo` | publisher_pg_configs, plans, publisher_subscriptions, pg_webhook_events |
| PG config API | `todo` | |
| Credential resolver | `todo` | `lib/payments/resolveConfig.ts` |
| OnePaywall billing | `todo` | |
| One-time unlock flow | `todo` | |
| Webhook handler | `todo` | |

---

## Reader intelligence
| Area | Status | Notes |
|------|--------|-------|
| DB schema | `todo` | reader_page_visits, content_classifications, reader_profiles |
| Signal collection | `todo` | |
| Content classification | `todo` | |
| URL sanitisation | `todo` | `lib/intelligence/sanitize.ts` |
| Profile computation | `todo` | `lib/intelligence/computeProfile.ts` |

---

## Analytics
| Area | Status | Notes |
|------|--------|-------|
| DB schema | `todo` | gate_events, analytics_rollups |
| Event ingestion | `todo` | `lib/analytics/ingest.ts` |
| Rollup computation | `todo` | `lib/analytics/rollup.ts` |
| Analytics dashboard | `partial` | Placeholder page at `app/(dashboard)/analytics/page.tsx` |

---

## Admin panel
| Area | Status | Notes |
|------|--------|-------|
| Admin layout + guard | `todo` | |
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
