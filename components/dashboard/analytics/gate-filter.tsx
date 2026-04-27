"use client"

import { useRouter, useSearchParams, usePathname } from "next/navigation"

type Gate = { gateId: string; gateName: string }

export function GateFilter({ gates, current }: { gates: Gate[]; current: string | null }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  if (gates.length < 2) return null

  function setGate(value: string | null) {
    const params = new URLSearchParams(searchParams.toString())
    if (value) params.set("gate", value)
    else params.delete("gate")
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
      <button
        onClick={() => setGate(null)}
        style={{
          padding: "3px 10px",
          borderRadius: 5,
          fontSize: 11,
          fontWeight: current === null ? 600 : 400,
          color: current === null ? "#111" : "#999",
          background: current === null ? "#f0f0f0" : "transparent",
          border: "1px solid",
          borderColor: current === null ? "#ddd" : "transparent",
          cursor: "pointer",
          transition: "all 0.1s",
        }}
      >
        All gates
      </button>
      {gates.map(g => {
        const active = current === g.gateId
        return (
          <button
            key={g.gateId}
            onClick={() => setGate(g.gateId)}
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
              maxWidth: 160,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {g.gateName}
          </button>
        )
      })}
    </div>
  )
}
