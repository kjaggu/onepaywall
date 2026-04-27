"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

export type TabItem = {
  label: string
  href:  string
  // When true, this tab is active for any pathname starting with `href`. Used
  // for a default tab whose route prefix overlaps with siblings.
  exact?: boolean
}

// Segmented "pill" tabs (Cloudflare-style): inline group on a soft grey
// background; the active tab lifts to white with a subtle shadow.
export function Tabs({ items }: { items: TabItem[] }) {
  const pathname = usePathname()

  function isActive(item: TabItem): boolean {
    if (item.exact) return pathname === item.href
    if (pathname === item.href) return true
    return pathname.startsWith(item.href + "/")
  }

  return (
    <div
      className="inline-flex items-center gap-0.5 rounded-lg p-1"
      style={{ background: "#f1f1f2" }}
    >
      {items.map(item => {
        const active = isActive(item)
        return (
          <Link
            key={item.href}
            href={item.href}
            className="rounded-md px-3 py-1 text-body-sm transition-all"
            style={{
              background: active ? "#fff" : "transparent",
              color:      active ? "var(--color-text)" : "var(--color-text-secondary)",
              fontWeight: active ? 500 : 400,
              boxShadow:  active
                ? "0 1px 2px rgba(0,0,0,0.05), 0 0 0 1px rgba(0,0,0,0.04)"
                : "none",
            }}
            onMouseEnter={e => {
              if (!active) e.currentTarget.style.color = "var(--color-text)"
            }}
            onMouseLeave={e => {
              if (!active) e.currentTarget.style.color = "var(--color-text-secondary)"
            }}
          >
            {item.label}
          </Link>
        )
      })}
    </div>
  )
}
