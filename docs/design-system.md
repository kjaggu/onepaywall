# OnePaywall — Design System

This document is the single source of truth for all visual decisions. Follow it exactly. Do not use raw Tailwind color or spacing values where a token exists.

---

## Foundations

### Color tokens

Use these semantic tokens, not raw Tailwind palette values. Tokens are defined as CSS custom properties in `styles/globals.css`.

#### Brand
| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| `--color-brand` | `indigo-600` | `indigo-400` | Primary actions, links |
| `--color-brand-hover` | `indigo-700` | `indigo-300` | Hover state for brand elements |
| `--color-brand-subtle` | `indigo-50` | `indigo-950` | Backgrounds tinted with brand |

#### Surface
| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| `--color-bg` | `white` | `slate-950` | Page background |
| `--color-surface` | `slate-50` | `slate-900` | Cards, panels |
| `--color-surface-raised` | `white` | `slate-800` | Elevated cards, dropdowns |
| `--color-border` | `slate-200` | `slate-700` | All borders |
| `--color-border-strong` | `slate-300` | `slate-600` | Emphasized borders |

#### Text
| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| `--color-text` | `slate-900` | `slate-50` | Primary body text |
| `--color-text-secondary` | `slate-500` | `slate-400` | Secondary/muted text |
| `--color-text-disabled` | `slate-300` | `slate-600` | Disabled state text |
| `--color-text-inverse` | `white` | `slate-900` | Text on dark/brand backgrounds |

#### Semantic
| Token | Value | Usage |
|-------|-------|-------|
| `--color-success` | `emerald-600` | Positive states |
| `--color-success-subtle` | `emerald-50` | Success backgrounds |
| `--color-warning` | `amber-500` | Cautionary states |
| `--color-warning-subtle` | `amber-50` | Warning backgrounds |
| `--color-danger` | `red-600` | Errors, destructive actions |
| `--color-danger-subtle` | `red-50` | Error backgrounds |

---

### Typography

Font: **Inter** (loaded via `next/font`). Fallback: `system-ui, sans-serif`.

| Scale | Class | Size | Weight | Line height | Usage |
|-------|-------|------|--------|-------------|-------|
| `display` | `.text-display` | 36px | 700 | 1.1 | Hero headings |
| `h1` | `.text-h1` | 28px | 700 | 1.2 | Page titles |
| `h2` | `.text-h2` | 22px | 600 | 1.3 | Section headings |
| `h3` | `.text-h3` | 18px | 600 | 1.4 | Card headings, group labels |
| `body` | `.text-body` | 15px | 400 | 1.6 | Default body text |
| `body-sm` | `.text-body-sm` | 13px | 400 | 1.5 | Secondary descriptions |
| `label` | `.text-label` | 12px | 500 | 1.4 | Form labels, table headers |
| `mono` | `.text-mono` | 13px | 400 | 1.5 | Code, keys, IDs |

Define these as `@layer base` utilities in `styles/globals.css`, not as Tailwind arbitrary values.

---

### Spacing scale

Use Tailwind's default spacing scale. Do not invent custom values. Key usage guidelines:

| Scale | px | Usage |
|-------|----|-------|
| `1` | 4px | Icon gap, tight inline spacing |
| `2` | 8px | Small internal padding |
| `3` | 12px | Button padding (y-axis) |
| `4` | 16px | Default gap between elements |
| `6` | 24px | Section internal padding |
| `8` | 32px | Between major sections |
| `12` | 48px | Page-level vertical rhythm |
| `16` | 64px | Large layout gaps |

---

### Border radius

| Token | Value | Usage |
|-------|-------|-------|
| `rounded-sm` | 4px | Inputs, small chips |
| `rounded` | 6px | Buttons, cards |
| `rounded-lg` | 8px | Modals, panels |
| `rounded-full` | 9999px | Avatars, status badges |

---

### Shadows

| Token | Usage |
|-------|-------|
| `shadow-sm` | Cards at rest |
| `shadow` | Elevated cards, dropdowns |
| `shadow-lg` | Modals, popovers |

---

## Components

All components use **shadcn/ui** as the base. Do not rebuild shadcn primitives. Extend via the variant system; do not fork the component files.

### Component inventory

The following shadcn components are approved for use. Add to this list when adding a new shadcn component.

**Layout**
- `Card`, `CardHeader`, `CardContent`, `CardFooter`
- `Separator`
- `Sheet` (slide-over panel)
- `Dialog` (modal)
- `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent`

**Navigation**
- `DropdownMenu`
- `NavigationMenu`
- `Breadcrumb`

**Forms**
- `Button`
- `Input`
- `Textarea`
- `Select`
- `Checkbox`
- `Switch`
- `RadioGroup`
- `Label`
- `Form` (react-hook-form integration)

**Feedback**
- `Alert`
- `Badge`
- `Toast` / `Toaster` (via `sonner`)
- `Skeleton`
- `Progress`

**Data display**
- `Table`, `TableHeader`, `TableBody`, `TableRow`, `TableCell`
- `Avatar`
- `Tooltip`

---

### Button

| Variant | Usage |
|---------|-------|
| `default` | Primary actions (one per view) |
| `secondary` | Secondary actions |
| `outline` | Tertiary actions, filters |
| `ghost` | Icon buttons, inline actions |
| `destructive` | Irreversible actions (delete, revoke) |
| `link` | Inline text links |

Sizes: `sm`, `default`, `lg`, `icon`. Default to `default`.

Rules:
- One `default` (primary) button per screen section.
- Destructive actions must have a confirmation dialog.
- Loading state: use `disabled` + spinner inside the button, never remove the button.

---

### Form fields

- Every `Input` must have a `Label`.
- Error messages sit below the input, use `text-danger text-body-sm`.
- Helper text sits below the label, use `text-secondary text-body-sm`.
- Required fields: append `*` to the label, no separate indicator.

---

### Data tables

- Use `Table` from shadcn.
- Empty state: centered illustration + heading + CTA inside `TableBody`.
- Loading state: `Skeleton` rows, same count as page size.
- Pagination: `limit=20` default, simple prev/next controls.
- No client-side sorting — sort via query params, re-fetch.

---

## Layout patterns

### Dashboard shell

```
┌─────────────────────────────────────────────┐
│  Sidebar (240px fixed)  │  Main content      │
│                         │                    │
│  Logo                   │  Page header       │
│  Nav items              │  (title + actions) │
│  ─────────              │  ─────────────     │
│  Org switcher           │  Page body         │
│  User menu              │                    │
└─────────────────────────────────────────────┘
```

- Sidebar: `w-60`, `bg-surface`, `border-r border-border`
- Main: `flex-1 overflow-auto`, `bg-bg`
- Page header: `px-8 py-6 border-b border-border flex items-center justify-between`
- Page body: `px-8 py-6`

### Admin shell

Same structure as dashboard shell. Differentiate with a subtle top bar accent in `--color-brand-subtle` so admins know they're in the admin panel.

### Auth pages

- Centered card layout, `max-w-sm`, `mx-auto`, vertically centered.
- OnePaywall logo above the card.
- No sidebar.

### Embed gate UI

- Injected into publisher sites — must be isolated via Shadow DOM or iframe.
- Uses its own minimal CSS, **not** Tailwind or shadcn.
- Design: clean overlay, `max-w-md`, centered, white card on dark scrim.
- Keep embed UI under 15KB gzipped.

---

## Icons

Use **Lucide React** exclusively. Do not use other icon sets.

- Size: `16` for inline, `20` for standalone, `24` for large/empty states.
- Color: inherit from parent text color via `currentColor`.
- Pair icons with visible labels wherever space allows. Icon-only buttons must have a `Tooltip`.

---

## Motion

Keep animation minimal. Use only:
- `transition-colors duration-150` for interactive state changes (hover, focus)
- `transition-opacity duration-200` for fade-in/out
- shadcn's built-in animation for modals and sheets

No page transitions. No scroll animations. No decorative motion.

---

## Responsive

The dashboard is a **desktop-first** product. Design for `lg` (1024px+) as the baseline. A usable `md` (768px) state is acceptable for key flows. Mobile is not a priority for publisher dashboard or admin panel.

The embed gate UI must be fully responsive (it appears on the reader's device, which may be mobile).

---

## Dark mode

Support dark mode via the `class` strategy (`dark` class on `<html>`). Use the CSS token system — do not write `dark:` variants for color utilities directly in components. All color usage must go through the token layer.
