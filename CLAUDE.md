# OnePaywall — CLAUDE.md

**Intelligent monetization for publishers. Maximize revenue per reader without compromising reader experience — dropoffs are lost revenue.**

---

## Roles
| Role | Who |
|------|-----|
| `superadmin` | OnePaywall team — manages publishers, plans, platform |
| `publisher` | Website/app owner + team — manages domains, gates, ads, analytics |
| Reader | End user of publisher sites — anonymous by default; subscription restore uses email magic links |

---

## Tech stack
| Layer | Choice |
|-------|--------|
| Framework | Next.js 16 App Router, TypeScript strict |
| Database | Neon serverless Postgres + Drizzle ORM (HTTP driver) |
| UI | Tailwind CSS + shadcn/ui |
| Client state | Zustand (UI only) + URL state (navigation) |
| Auth | JWT HTTP-only cookie — `jose` + `bcryptjs` |
| Payments | Razorpay (separate platform keys for OnePaywall billing; platform or publisher-owned keys for reader monetization) |
| Storage | Cloudflare R2 — ad creative uploads |
| Testing | Node.js native `node --test` |

---

## Folder structure
```
app/(auth)          login, register, forgot/reset password
app/(dashboard)     publisher workspace — layout-level session guard
app/admin           superadmin panel — layout-level session guard
app/api/            API route handlers — thin, delegate to /lib
app/api/embed/      public embed endpoints — no auth, domain-verified, stateless
app/embed/          embed test/debug pages
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

**Privacy** — reader behavior data is tied to anonymous fingerprint only; raw signals hard-deleted after 90 days. Paid reader subscriptions are the only PII exception: store normalized email hash + encrypted email for magic-link restore and support.

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

## Side sheets — mandatory pattern

All slide-over panels **must** use the `Sheet` component from `components/ui/sheet.tsx`. Never implement a custom overlay/drawer with `fixed inset-0` divs.

### Pattern A — self-contained trigger (preferred)
Use when the sheet has a single trigger button. The button is part of the sheet component itself.

```tsx
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

<Sheet open={open} onOpenChange={setOpen}>
  <SheetTrigger className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-1.5")}>
    <PlusIcon size={14} />
    Button label
  </SheetTrigger>
  <SheetContent className="w-full sm:max-w-md overflow-y-auto">
    <SheetHeader>
      <SheetTitle>Sheet title</SheetTitle>
    </SheetHeader>
    <div className="flex flex-col gap-5 px-4 pb-4 mt-2">
      {/* form or content */}
    </div>
  </SheetContent>
</Sheet>
```

### Pattern B — externally controlled (use when multiple triggers open the same sheet)
Use when the sheet must be opened from more than one place (e.g. a header button and an empty-state button).

```tsx
// In the sheet component:
type Props = { open: boolean; onOpenChange: (open: boolean) => void }

<Sheet open={open} onOpenChange={v => { onOpenChange(v); if (!v) reset() }}>
  <SheetContent className="w-full sm:max-w-md overflow-y-auto">
    ...
  </SheetContent>
</Sheet>

// In the page:
const [sheetOpen, setSheetOpen] = useState(false)
<Button onClick={() => setSheetOpen(true)}>Open</Button>         // trigger 1
<Button onClick={() => setSheetOpen(true)}>Empty state CTA</Button> // trigger 2
<MySheet open={sheetOpen} onOpenChange={setSheetOpen} />
```

### Width classes
| Width | Class | Use for |
|-------|-------|---------|
| Narrow | `w-full sm:max-w-md` | Simple forms (add domain, add subscriber) |
| Medium | `w-full sm:max-w-lg` | Multi-step wizards, file uploads (create gate, import CSV) |

### Rules
- **Never** use raw pixel widths (`w-[400px]`) — they lose to the Sheet's built-in `data-[side=right]:w-3/4` selector due to CSS specificity
- **Never** use a hidden `<SheetTrigger>` + separate `<Button>` outside the sheet — use Pattern A or B
- Always add `overflow-y-auto` to `SheetContent` when content can exceed viewport height
- Content padding goes on an inner div (`px-4 pb-4`), not on `SheetContent` itself

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

## Database migrations

One workflow, no exceptions.

**To apply migrations:** `npm run db:migrate`
**To check status:** `npm run db:migrate:status`

Both commands are idempotent and safe to re-run. The runner ([scripts/migrate.mjs](scripts/migrate.mjs)) tracks applied migrations in a `_migrations` table inside the DB itself, so it works regardless of who/what generated each `.sql` file.

**Authoring a new migration:**
1. Either run `npm run db:generate` (drizzle-kit, for schema-derived changes) or hand-write a numbered `.sql` file in `db/migrations/` for non-schema work (indexes, backfills).
2. Always use `IF NOT EXISTS` / `DO $$ ... EXCEPTION WHEN duplicate_object` so partial replays are safe.
3. Run `npm run db:migrate` to apply.
4. Commit the `.sql` file (and `meta/_journal.json` if drizzle-kit generated it).

**Never** `psql` directly against the DB to apply schema. Never edit a migration file once it has been applied anywhere — write a new migration instead.

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
