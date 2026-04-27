"use client"

import { useRouter, useSearchParams, usePathname } from "next/navigation"

const OPTIONS = [
  { label: "7d",  value: "7"  },
  { label: "30d", value: "30" },
  { label: "90d", value: "90" },
]

export function RangeFilter({ current }: { current: number }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  function setRange(value: string) {
    const params = new URLSearchParams(searchParams.toString())
    params.set("range", value)
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <div style={{ display: "flex", gap: 4 }}>
      {OPTIONS.map(o => {
        const active = String(current) === o.value
        return (
          <button
            key={o.value}
            onClick={() => setRange(o.value)}
            style={{
              padding: "3px 10px",
              borderRadius: 5,
              fontSize: 11,
              fontWeight: active ? 600 : 400,
              color: active ? "#111" : "#999",
              background: active ? "#f0f0f0" : "transparent",
              border: "1px solid",
              borderColor: active ? "#ddd" : "transparent",
              cursor: "pointer",
              transition: "all 0.1s",
            }}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}
