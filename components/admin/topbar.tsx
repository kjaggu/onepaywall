"use client"

import { Shield } from "lucide-react"
import { useRouter } from "next/navigation"

export function AdminTopbar() {
  const router = useRouter()

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" })
    router.push("/login")
  }

  return (
    <div className="h-12 bg-white border-b border-[#ebebeb] flex items-center px-5 gap-2.5 shrink-0">
      <div className="flex items-center gap-1.5 px-2 py-[3px] rounded border border-[#e0f5f5] bg-[#f0fafa]">
        <Shield size={11} stroke="#27adb0" />
        <span className="text-[11px] text-primary font-semibold">Superadmin</span>
      </div>
      <span className="text-[13px] text-[#555]">jagadeeshk@outlook.com</span>

      <div className="flex-1" />

      <div className="flex items-center gap-1 px-2.5 py-[3px] border border-[#d4edda] rounded-[5px] bg-[#f0faf4]">
        <div className="w-1.5 h-1.5 rounded-full bg-primary" />
        <span className="text-[12px] text-primary font-medium">Platform OK</span>
      </div>

      <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center">
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
