"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import {
  BarChart2,
  Building2,
  CreditCard,
  Heart,
  LayoutGrid,
  Menu,
  Package,
  Settings,
} from "lucide-react"

const NAV = [
  { id: "overview",      label: "Overview",      href: "/admin",                   icon: LayoutGrid  },
  { id: "publishers",    label: "Publishers",    href: "/admin/publishers",        icon: Building2   },
  { id: "plans",         label: "Plans",         href: "/admin/plans",             icon: Package     },
  { id: "subscriptions", label: "Subscriptions", href: "/admin/subscriptions",     icon: CreditCard  },
  { id: "health",        label: "Health",        href: "/admin/health",            icon: Heart       },
  { id: "settings",      label: "Settings",      href: "/admin/settings",          icon: Settings    },
]

export function AdminSidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  function isActive(href: string) {
    if (href === "/admin") return pathname === "/admin"
    return pathname.startsWith(href)
  }

  return (
    <aside
      style={{ width: collapsed ? 44 : 200, minWidth: collapsed ? 44 : 200, transition: "width 0.18s, min-width 0.18s" }}
      className="bg-white border-r border-[#ebebeb] flex flex-col h-screen overflow-hidden shrink-0"
    >
      {/* Admin accent strip */}
      <div style={{ height: 3, background: "#27adb0", flexShrink: 0 }} />

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
          <div className="min-w-0">
            <div className="font-semibold text-[13px] text-[#111] whitespace-nowrap leading-tight">OnePaywall</div>
            <div className="text-[10px] text-primary font-semibold tracking-wide uppercase leading-tight">Admin</div>
          </div>
        )}
      </div>

      {/* Org label */}
      {!collapsed && (
        <div className="px-4 pt-3 pb-1 text-[10px] font-semibold text-[#aaa] tracking-[0.06em] uppercase">
          Platform
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto" style={{ padding: "8px 0" }}>
        {collapsed ? (
          NAV.map((item) => {
            const active = isActive(item.href)
            return (
              <Link
                key={item.id}
                href={item.href}
                className="w-full flex items-center justify-center py-2"
                style={{
                  color: active ? "#111" : "#bbb",
                  borderLeft: active ? "2px solid #27adb0" : "2px solid transparent",
                  transition: "color 0.12s, border-color 0.12s",
                }}
              >
                <item.icon size={14} strokeWidth={active ? 1.9 : 1.5} />
              </Link>
            )
          })
        ) : (
          <div style={{ borderLeft: "1px solid #e8e8e8", marginLeft: 20 }}>
            {NAV.map((item) => {
              const active = isActive(item.href)
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className="w-full flex items-center"
                  style={{
                    borderLeft: active ? "2px solid #27adb0" : "2px solid transparent",
                    marginLeft: -1,
                    transition: "border-color 0.12s",
                  }}
                >
                  <span
                    className="block whitespace-nowrap"
                    style={{
                      padding: "7px 14px",
                      fontSize: 13,
                      color: active ? "#111" : "#888",
                      fontWeight: active ? 500 : 400,
                      transition: "color 0.12s",
                    }}
                  >
                    {item.label}
                  </span>
                </Link>
              )
            })}
          </div>
        )}
      </nav>

      {/* Collapse */}
      <div className="border-t border-[#ebebeb] p-[6px]">
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="w-full flex items-center rounded-[5px] text-[#888] text-[13px] whitespace-nowrap hover:bg-[#f5f5f5] transition-colors duration-100"
          style={{
            gap: 8,
            padding: collapsed ? "7px 0" : "7px 10px",
            justifyContent: collapsed ? "center" : "flex-start",
            background: "transparent",
            border: "none",
            cursor: "pointer",
          }}
        >
          <Menu size={14} strokeWidth={1.5} />
          {!collapsed && "Collapse menu"}
        </button>
      </div>
    </aside>
  )
}
