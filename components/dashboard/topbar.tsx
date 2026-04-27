"use client"

import { useEffect, useRef, useState } from "react"
import { Menu } from "lucide-react"
import { useRouter } from "next/navigation"
import { useSidebarStore } from "@/lib/stores/sidebar"

export function DashboardTopbar() {
  const router = useRouter()
  const toggle = useSidebarStore((s) => s.toggle)

  const [email, setEmail] = useState<string | null>(null)
  const [initials, setInitials] = useState("…")
  const [plan, setPlan] = useState<string | null>(null)
  const [planTone, setPlanTone] = useState<"neutral" | "trial" | "warning" | "danger">("neutral")
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch("/api/me")
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (!d) return
        setEmail(d.email)
        setInitials(d.initials)
        setPlan(d.plan)
        if (d.subscription?.isSuspended)      setPlanTone("danger")
        else if (d.subscription?.isPastDue)   setPlanTone("warning")
        else if (d.subscription?.isTrialing)  setPlanTone("trial")
        else                                   setPlanTone("neutral")
      })
      .catch(() => {})
  }, [])

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" })
    router.push("/login")
  }

  return (
    <div className="h-12 bg-white border-b border-[#ebebeb] flex items-center px-3 gap-2 shrink-0">
      {/* Collapse toggle */}
      <button
        onClick={toggle}
        className="w-8 h-8 flex items-center justify-center rounded-[5px] text-[#aaa] hover:bg-[#f5f5f5] hover:text-[#555] transition-colors duration-100"
        style={{ background: "none", border: "none", cursor: "pointer" }}
      >
        <Menu size={15} strokeWidth={1.5} />
      </button>

      <div className="flex-1" />

      {/* Plan badge + avatar */}
      <div className="flex items-center gap-2" ref={menuRef}>
        {plan && (() => {
          const styles = {
            neutral: { border: "#e5e5e5", color: "#555", bg: "transparent",  suffix: "" },
            trial:   { border: "#c8eced", color: "#1f7e80", bg: "#f0fafa",   suffix: " · trial" },
            warning: { border: "#f5d28a", color: "#7a4500", bg: "#fff8ed",   suffix: " · past due" },
            danger:  { border: "#f5b5b0", color: "#922118", bg: "#fdecea",   suffix: " · suspended" },
          }[planTone]
          return (
            <span
              className="px-[7px] py-[1px] rounded text-[11px] font-medium capitalize"
              style={{ border: `1px solid ${styles.border}`, color: styles.color, background: styles.bg }}
            >
              {plan}{styles.suffix}
            </span>
          )
        })()}

        {/* Avatar button */}
        <div className="relative">
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="w-7 h-7 rounded-full bg-[#111] flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity"
            style={{ border: "none" }}
          >
            <span className="text-white text-[11px] font-semibold select-none">{initials}</span>
          </button>

          {/* Dropdown */}
          {menuOpen && (
            <div
              className="absolute right-0 top-9 bg-white border border-[#e8e8e8] rounded-[8px] shadow-[0_4px_20px_rgba(0,0,0,0.08)] z-50 overflow-hidden"
              style={{ minWidth: 200 }}
            >
              {email && (
                <div
                  className="px-4 py-3 border-b border-[#f0f0f0]"
                  style={{ fontSize: 12, color: "#888" }}
                >
                  {email}
                </div>
              )}
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-2.5 text-[13px] text-[#333] hover:bg-[#f5f5f5] transition-colors duration-100"
                style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}
              >
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
