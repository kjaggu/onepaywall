"use client"

import { Info } from "lucide-react"
import { useRouter } from "next/navigation"

export function DashboardTopbar() {
  const router = useRouter()

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" })
    router.push("/login")
  }

  return (
    <div className="h-12 bg-white border-b border-[#ebebeb] flex items-center px-5 gap-2.5 shrink-0">
      <span className="text-[13px] text-[#555]">jamie@finmedia.com</span>
      <span className="px-[7px] py-[1px] rounded border border-[#e5e5e5] text-[11px] text-[#555] font-medium">
        Growth
      </span>

      <div className="flex-1" />

      <div className="flex items-center gap-1 px-2.5 py-[3px] border border-[#d4edda] rounded-[5px] bg-[#f0faf4]">
        <div className="w-1.5 h-1.5 rounded-full bg-primary" />
        <span className="text-[12px] text-primary font-medium">All OK</span>
      </div>

      <button className="flex items-center gap-[5px] px-2.5 py-1 border border-[#e5e5e5] rounded-[5px] bg-white text-[12px] text-[#555] font-medium hover:bg-[#f5f5f5] transition-colors duration-100">
        <Info size={13} stroke="#888" />
        Docs
      </button>

      <button className="px-3 py-1 rounded-[5px] bg-[#111] text-white text-[12px] font-semibold hover:bg-black transition-colors duration-100">
        Upgrade
      </button>

      <div className="w-7 h-7 rounded-full bg-[#111] flex items-center justify-center">
        <span className="text-white text-[11px] font-semibold">J</span>
      </div>

      <button
        onClick={handleLogout}
        className="text-[12px] text-[#888] hover:text-[#111] transition-colors duration-100"
        style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", padding: "4px 6px" }}
      >
        Sign out
      </button>
    </div>
  )
}
