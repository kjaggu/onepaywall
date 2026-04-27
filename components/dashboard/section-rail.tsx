"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

export type RailItem =
  | { kind: "link"; label: string; href: string; exact?: boolean }
  | { kind: "divider" }
  | { kind: "header"; label: string }

// Vertical left-rail used for L2 navigation (Settings, etc.).
// Visual model: a 1px guide line runs down the left edge of the items;
// the active item replaces that segment with a 2px brand-coloured marker.
// No bounding border, no fill on hover/active — quiet and readable.
export function SectionRail({
  items,
  width = 200,
}: {
  items: RailItem[]
  width?: number
}) {
  const pathname = usePathname()

  function isActive(href: string, exact?: boolean): boolean {
    if (exact) return pathname === href
    if (pathname === href) return true
    return pathname.startsWith(href + "/")
  }

  return (
    <aside className="shrink-0 py-6" style={{ width }}>
      <div style={{ borderLeft: "1px solid #e8e8e8", marginLeft: 16 }}>
        {items.map((it, i) => {
          if (it.kind === "divider") {
            return (
              <div
                key={i}
                style={{ marginLeft: -1, paddingLeft: 14, paddingRight: 14, paddingTop: 8, paddingBottom: 4 }}
              >
                <div className="border-t border-[#ebebeb]" />
              </div>
            )
          }
          if (it.kind === "header") {
            return (
              <div
                key={i}
                className="text-label uppercase tracking-wider text-[var(--color-text-secondary)]"
                style={{ marginLeft: -1, padding: "12px 14px 4px" }}
              >
                {it.label}
              </div>
            )
          }
          const active = isActive(it.href, it.exact)
          return (
            <Link
              key={it.href}
              href={it.href}
              className="block transition-colors duration-100"
              style={{
                marginLeft:  -1,
                borderLeft:  active ? "2px solid #111" : "2px solid transparent",
                padding:     "7px 14px",
                fontSize:    13,
                color:       active ? "#111" : "#888",
                fontWeight:  active ? 500 : 400,
              }}
              onMouseEnter={(e) => { if (!active) e.currentTarget.style.color = "#444" }}
              onMouseLeave={(e) => { if (!active) e.currentTarget.style.color = "#888" }}
            >
              {it.label}
            </Link>
          )
        })}
      </div>
    </aside>
  )
}
