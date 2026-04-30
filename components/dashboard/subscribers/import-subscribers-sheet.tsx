"use client"

import { useRef, useState } from "react"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Upload, CheckCircle2, AlertTriangle } from "lucide-react"

type ParsedRow = {
  email: string
  interval: string
  expiresAt?: string
  paymentMethod?: string
  notes?: string
}

type ImportResult = {
  imported: number
  skipped: number
  errors: Array<{ email: string; reason: string }>
}

const VALID_INTERVALS = new Set(["monthly", "quarterly", "annual", "lifetime"])

function parseCSV(text: string): ParsedRow[] {
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean)
  if (lines.length === 0) return []
  const first = lines[0].toLowerCase()
  const hasHeader = first.startsWith("email") || first.includes(",interval")
  const dataLines = hasHeader ? lines.slice(1) : lines
  return dataLines.map(line => {
    const cols = line.split(",").map(c => c.replace(/^"|"$/g, "").trim())
    return {
      email:         cols[0] ?? "",
      interval:      (cols[1] ?? "annual").toLowerCase(),
      expiresAt:     cols[2] || undefined,
      paymentMethod: cols[3]?.toLowerCase() || undefined,
      notes:         cols[4] || undefined,
    }
  }).filter(r => r.email)
}

const selectStyle = {
  border: "1px solid #ddd", borderRadius: 6, padding: "7px 10px",
  fontSize: 13, color: "#333", background: "#fff", fontFamily: "inherit", cursor: "pointer", width: "100%",
}

type Props = { onImported: () => void }

export function ImportSubscribersSheet({ onImported }: Props) {
  const [open, setOpen] = useState(false)
  const [rows, setRows] = useState<ParsedRow[]>([])
  const [defaultInterval, setDefaultInterval] = useState("annual")
  const [defaultPaymentMethod, setDefaultPaymentMethod] = useState("bank_transfer")
  const [result, setResult] = useState<ImportResult | null>(null)
  const [importing, setImporting] = useState(false)
  const [error, setError] = useState("")
  const fileRef = useRef<HTMLInputElement>(null)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      const text = ev.target?.result as string
      const parsed = parseCSV(text).map(r => ({
        ...r,
        interval:      VALID_INTERVALS.has(r.interval) ? r.interval : defaultInterval,
        paymentMethod: r.paymentMethod || defaultPaymentMethod,
      }))
      setRows(parsed)
      setResult(null)
      setError("")
    }
    reader.readAsText(file)
  }

  async function handleImport() {
    if (rows.length === 0) return
    setImporting(true)
    setError("")
    try {
      const res = await fetch("/api/subscribers/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? "Import failed"); return }
      setResult(data as ImportResult)
      if (data.imported > 0) onImported()
    } finally {
      setImporting(false)
    }
  }

  function reset() {
    setRows([]); setResult(null); setError("")
    if (fileRef.current) fileRef.current.value = ""
  }

  return (
    <>
      <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setOpen(true)}>
        <Upload size={14} />
        Import CSV
      </Button>
      <Sheet open={open} onOpenChange={v => { setOpen(v); if (!v) reset() }}>
        <SheetContent className="w-[520px] sm:w-[560px]" style={{ overflowY: "auto" }}>
          <SheetHeader>
            <SheetTitle>Import subscribers</SheetTitle>
          </SheetHeader>

          <div style={{ marginTop: 16, fontSize: 13, color: "#666", display: "flex", flexDirection: "column", gap: 6 }}>
            <p>CSV columns (header row optional):</p>
            <code style={{ display: "block", background: "#f5f5f5", borderRadius: 6, padding: "8px 12px", fontSize: 12, fontFamily: "monospace" }}>
              email, interval, expires_at, payment_method, notes
            </code>
            <p style={{ fontSize: 12, color: "#aaa" }}>
              interval: monthly / quarterly / annual / lifetime &nbsp;·&nbsp;
              payment_method: cash / bank_transfer / complimentary
            </p>
          </div>

          <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 13, fontWeight: 500, color: "#333" }}>Default interval</label>
                <select style={selectStyle} value={defaultInterval} onChange={e => setDefaultInterval(e.target.value)}>
                  {["monthly","quarterly","annual","lifetime"].map(v => (
                    <option key={v} value={v} style={{ textTransform: "capitalize" }}>{v.charAt(0).toUpperCase() + v.slice(1)}</option>
                  ))}
                </select>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 13, fontWeight: 500, color: "#333" }}>Default payment method</label>
                <select style={selectStyle} value={defaultPaymentMethod} onChange={e => setDefaultPaymentMethod(e.target.value)}>
                  <option value="cash">Cash</option>
                  <option value="bank_transfer">Bank transfer</option>
                  <option value="complimentary">Complimentary</option>
                </select>
              </div>
            </div>

            <div
              onClick={() => fileRef.current?.click()}
              style={{
                border: "2px dashed #ddd", borderRadius: 10, padding: "28px 16px",
                textAlign: "center", cursor: "pointer", transition: "border-color 0.15s",
              }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = "#111")}
              onMouseLeave={e => (e.currentTarget.style.borderColor = "#ddd")}
            >
              <Upload size={20} style={{ margin: "0 auto 8px", color: "#aaa" }} />
              <p style={{ fontSize: 13, color: "#888" }}>
                {rows.length > 0 ? `${rows.length} rows loaded — click to replace` : "Click to select a CSV file"}
              </p>
              <input ref={fileRef} type="file" accept=".csv,text/csv" style={{ display: "none" }} onChange={handleFileChange} />
            </div>
          </div>

          {/* Preview */}
          {rows.length > 0 && !result && (
            <div style={{ marginTop: 16 }}>
              <p style={{ fontSize: 13, fontWeight: 500, marginBottom: 8 }}>{rows.length} row{rows.length !== 1 ? "s" : ""} to import</p>
              <div style={{ border: "1px solid #ebebeb", borderRadius: 8, overflow: "hidden", maxHeight: 220, overflowY: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                  <thead style={{ background: "#fafafa", position: "sticky", top: 0 }}>
                    <tr>
                      {["Email","Plan","Expires","Method"].map(h => (
                        <th key={h} style={{ padding: "6px 10px", textAlign: "left", fontWeight: 600, color: "#aaa", fontSize: 10, letterSpacing: "0.04em", textTransform: "uppercase" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.slice(0, 50).map((r, i) => (
                      <tr key={i} style={{ background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                        <td style={{ padding: "5px 10px", maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.email}</td>
                        <td style={{ padding: "5px 10px", textTransform: "capitalize" }}>{r.interval}</td>
                        <td style={{ padding: "5px 10px" }}>{r.expiresAt || "—"}</td>
                        <td style={{ padding: "5px 10px" }}>{(r.paymentMethod ?? "").replace("_"," ") || "—"}</td>
                      </tr>
                    ))}
                    {rows.length > 50 && (
                      <tr><td colSpan={4} style={{ padding: "5px 10px", color: "#aaa" }}>…and {rows.length - 50} more</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Results */}
          {result && (
            <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
                <CheckCircle2 size={16} style={{ color: "#16a34a", flexShrink: 0 }} />
                <span><strong>{result.imported}</strong> imported, <strong>{result.skipped}</strong> skipped (already active)</span>
              </div>
              {result.errors.length > 0 && (
                <div style={{ border: "1px solid #fca5a5", borderRadius: 8, padding: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#dc2626", marginBottom: 8 }}>
                    <AlertTriangle size={14} />
                    {result.errors.length} error{result.errors.length !== 1 ? "s" : ""}
                  </div>
                  <ul style={{ fontSize: 12, color: "#ef4444", maxHeight: 120, overflowY: "auto", margin: 0, padding: "0 0 0 16px" }}>
                    {result.errors.map((e, i) => (
                      <li key={i}>{e.email} — {e.reason}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {error && <p style={{ marginTop: 12, fontSize: 13, color: "#dc2626" }}>{error}</p>}

          <div style={{ marginTop: 24, display: "flex", gap: 8 }}>
            {!result ? (
              <Button onClick={handleImport} disabled={rows.length === 0 || importing} style={{ flex: 1 }}>
                {importing ? "Importing…" : `Import ${rows.length > 0 ? rows.length : ""} subscribers`}
              </Button>
            ) : (
              <Button onClick={reset} variant="outline" style={{ flex: 1 }}>Import more</Button>
            )}
            <Button variant="outline" onClick={() => setOpen(false)}>
              {result ? "Close" : "Cancel"}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
