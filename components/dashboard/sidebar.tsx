"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import {
  BarChart2,
  Briefcase,
  DollarSign,
  Globe,
  LayoutGrid,
  Lock,
  Megaphone,
  Package,
  Settings,
  Users,
  Users2,
  type LucideIcon,
} from "lucide-react"
import { useSidebarStore } from "@/lib/stores/sidebar"

type NavItem = {
  label: string
  href:  string
  icon:  LucideIcon
}

type NavGroup = {
  // Optional uppercase group header. Items with no group label sit above the
  // first labelled group (used for Overview).
  label: string | null
  items: NavItem[]
}

const NAV: NavGroup[] = [
  {
    label: null,
    items: [
      { label: "Overview", href: "/overview", icon: LayoutGrid },
    ],
  },
  {
    label: "Monetise",
    items: [
      { label: "Brands",  href: "/brands",  icon: Briefcase },
      { label: "Gates",   href: "/gates",   icon: Lock      },
      { label: "Domains", href: "/domains", icon: Globe     },
      { label: "Pricing", href: "/pricing", icon: Package   },
      { label: "Ads",     href: "/ads",     icon: Megaphone },
    ],
  },
  {
    label: "Measure",
    items: [
      { label: "Analytics",   href: "/analytics",   icon: BarChart2  },
      { label: "Revenue",     href: "/revenue",     icon: DollarSign },
      { label: "Subscribers", href: "/subscribers", icon: Users2     },
      { label: "Audience",    href: "/audience",    icon: Users      },
    ],
  },
  {
    label: "Account",
    items: [
      { label: "Settings", href: "/settings", icon: Settings },
    ],
  },
]

export function DashboardSidebar() {
  const pathname  = usePathname()
  const collapsed = useSidebarStore((s) => s.collapsed)
  const [orgName, setOrgName] = useState<string | null>(null)

  useEffect(() => {
    fetch("/api/publisher-settings")
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.publisher?.name) setOrgName(d.publisher.name) })
      .catch(() => {})
  }, [])

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(href + "/")
  }

  return (
    <aside
      style={{ width: collapsed ? 44 : 208, minWidth: collapsed ? 44 : 208, transition: "width 0.18s, min-width 0.18s" }}
      className="bg-white border-r border-[#ebebeb] flex flex-col h-screen overflow-hidden shrink-0"
    >
      {/* Logo */}
      <div
        className="h-12 flex items-center border-b border-[#ebebeb] shrink-0 overflow-hidden"
        style={{ padding: collapsed ? "0 12px" : "0 16px", gap: 8 }}
      >
        <div className="w-5 h-5 rounded-[5px] bg-[#111] flex items-center justify-center shrink-0">
          <svg width={11} height={11} viewBox="0 0 16 16" fill="none">
            <rect x={2} y={4} width={12} height={8} rx={1.5} stroke="white" strokeWidth={1.5} />
            <path d="M5 4V3a3 3 0 016 0v1" stroke="white" strokeWidth={1.5} strokeLinecap="round" />
            <circle cx={8} cy={8} r={1} fill="white" />
          </svg>
        </div>
        {!collapsed && (
          <span className="font-semibold text-[13px] text-[#111] whitespace-nowrap">OnePaywall</span>
        )}
      </div>

      {/* Org label */}
      {!collapsed && (
        <div className="px-4 pt-3 pb-1 text-[10px] font-semibold text-[#aaa] tracking-[0.06em] uppercase truncate">
          {orgName ?? "Organization"}
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto" style={{ padding: collapsed ? "8px 0" : "8px 0 12px" }}>
        {NAV.map((group, gi) => (
          <div key={gi} className={gi > 0 ? "mt-2.5" : ""}>
            {/* Group header — only when expanded and label exists */}
            {!collapsed && group.label && (
              <div className="px-4 pt-2 pb-1 text-[10px] font-semibold text-[#bbb] tracking-[0.08em] uppercase">
                {group.label}
              </div>
            )}

            {/* Items */}
            {group.items.map(item => {
              const active = isActive(item.href)
              const Icon = item.icon

              if (collapsed) {
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    title={item.label}
                    className="w-full flex items-center justify-center py-2"
                    style={{
                      color:      active ? "#111" : "#bbb",
                      borderLeft: active ? "2px solid #111" : "2px solid transparent",
                      transition: "color 0.12s, border-color 0.12s",
                    }}
                  >
                    <Icon size={14} strokeWidth={active ? 1.9 : 1.5} />
                  </Link>
                )
              }

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center"
                  style={{
                    padding:    "6px 14px 6px 16px",
                    background: active ? "#f5f5f5" : "transparent",
                    color:      active ? "#111"    : "#666",
                    fontWeight: active ? 500 : 400,
                    fontSize:   13,
                    transition: "background 0.12s, color 0.12s",
                    gap:        10,
                  }}
                  onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = "#fafafa" }}
                  onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = "transparent" }}
                >
                  <Icon size={14} strokeWidth={active ? 1.9 : 1.5} style={{ color: active ? "#111" : "#999" }} />
                  <span className="whitespace-nowrap">{item.label}</span>
                </Link>
              )
            })}
          </div>
        ))}
      </nav>
    </aside>
  )
}
