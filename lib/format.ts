export function fmtINR(paise: number | null, nullLabel = "—"): string {
  if (paise == null) return nullLabel
  return "₹" + (paise / 100).toLocaleString("en-IN")
}

export function relativeTime(date: Date | null): string {
  if (!date) return "never"
  const diff = Date.now() - new Date(date).getTime()
  const s = Math.floor(diff / 1000)
  if (s < 2)  return "<1s"
  if (s < 60) return `${s}s`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h`
  return `${Math.floor(h / 24)}d`
}
