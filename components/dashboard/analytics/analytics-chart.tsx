"use client"

import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import type { DailyPoint } from "@/lib/db/queries/analytics"

function fillDates(data: DailyPoint[], days: number): DailyPoint[] {
  const byDate = new Map(data.map(d => [d.date, d]))
  const result: DailyPoint[] = []
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const key = d.toISOString().split("T")[0]
    result.push(byDate.get(key) ?? { date: key, impressions: 0, gatePasses: 0 })
  }
  return result
}

function fmtDate(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00")
  return d.toLocaleDateString("en-IN", { month: "short", day: "numeric" })
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: "#fff", border: "1px solid #ebebeb", borderRadius: 6, padding: "8px 12px", fontSize: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
      <div style={{ color: "#888", marginBottom: 6 }}>{label ? fmtDate(label) : ""}</div>
      {payload.map(p => (
        <div key={p.name} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
          <div style={{ width: 8, height: 8, borderRadius: 2, background: p.color }} />
          <span style={{ color: "#555" }}>{p.name === "impressions" ? "Impressions" : "Gate passes"}:</span>
          <span style={{ fontWeight: 600, color: "#111" }}>{p.value}</span>
        </div>
      ))}
    </div>
  )
}

export function AnalyticsChart({ data, days = 30 }: { data: DailyPoint[]; days?: number }) {
  const filled = fillDates(data, days)

  return (
    <div style={{ position: "relative", height: 240 }}>
      <div style={{ position: "absolute", inset: 0 }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={filled} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#ebebeb" vertical={false} />
          <XAxis
            dataKey="date"
            tickFormatter={fmtDate}
            tick={{ fontSize: 11, fill: "#bbb" }}
            tickLine={false}
            axisLine={false}
            interval={6}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "#bbb" }}
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="impressions"
            stroke="#27adb0"
            strokeWidth={2}
            fill="#27adb0"
            fillOpacity={0.08}
            dot={false}
            isAnimationActive={false}
          />
          <Area
            type="monotone"
            dataKey="gatePasses"
            stroke="#22c55e"
            strokeWidth={2}
            fill="#22c55e"
            fillOpacity={0.08}
            dot={false}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
      </div>
    </div>
  )
}
