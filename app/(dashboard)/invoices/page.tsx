"use client"

import { useEffect, useState } from "react"
import { FileText, Download, ArrowLeft } from "lucide-react"
import Link from "next/link"

type Invoice = {
  id: string
  invoiceNumber: number
  invoiceRef: string
  type: string
  amount: number
  currency: string
  readerEmail: string | null
  readerEmailHash: string | null
  domainHost: string | null
  contentUrl: string | null
  razorpayPaymentId: string | null
  issuedAt: string
}

const TYPE_LABELS: Record<string, string> = {
  subscription:    "Subscription",
  one_time_unlock: "Article unlock",
}

function fmt(amount: number, currency: string) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency, maximumFractionDigits: 0 }).format(amount / 100)
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    fetch("/api/invoices")
      .then(r => r.json())
      .then(d => setInvoices(d.invoices ?? []))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div style={{ padding: "28px 32px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22 }}>
        <div>
          <Link href="/revenue" style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, color: "#aaa", textDecoration: "none", marginBottom: 10 }}>
            <ArrowLeft size={12} /> Revenue
          </Link>
          <h1 style={{ fontSize: 20, fontWeight: 600, color: "#111" }}>Invoices</h1>
          <p style={{ fontSize: 12, color: "#aaa", marginTop: 2 }}>
            {loading ? "Loading…" : `${invoices.length} invoice${invoices.length !== 1 ? "s" : ""} generated`}
          </p>
        </div>
      </div>

      <div style={{ border: "1px solid #ebebeb", borderRadius: 8, overflow: "hidden" }}>
        {/* Header */}
        <div style={{ display: "grid", gridTemplateColumns: "140px 1fr 120px 100px 170px 100px 60px", padding: "7px 18px", background: "#fafafa", borderBottom: "1px solid #ebebeb" }}>
          {["Invoice #", "Description", "Amount", "Date", "Reader", "Domain", ""].map((h, i) => (
            <div key={i} style={{ fontSize: 10, fontWeight: 600, color: "#bbb", letterSpacing: "0.04em", textTransform: "uppercase" }}>{h}</div>
          ))}
        </div>

        {loading && (
          [0,1,2].map(i => (
            <div key={i} style={{ padding: "14px 18px", borderBottom: i < 2 ? "1px solid #f5f5f5" : "none", display: "flex", gap: 16, alignItems: "center" }}>
              <div style={{ width: 100, height: 12, background: "#f0f0f0", borderRadius: 4 }} />
              <div style={{ flex: 1, height: 12, background: "#f0f0f0", borderRadius: 4 }} />
              <div style={{ width: 70, height: 12, background: "#f0f0f0", borderRadius: 4 }} />
            </div>
          ))
        )}

        {!loading && invoices.length === 0 && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "72px 32px", textAlign: "center" }}>
            <FileText size={36} stroke="#ddd" style={{ marginBottom: 10 }} />
            <div style={{ fontSize: 14, fontWeight: 500, color: "#888", marginBottom: 5 }}>No invoices yet</div>
            <div style={{ fontSize: 12, color: "#bbb", maxWidth: 300, lineHeight: 1.6 }}>
              Click the "Invoice" button on any completed transaction in the{" "}
              <Link href="/revenue" style={{ color: "#27adb0", textDecoration: "none" }}>Revenue</Link> page to generate one.
            </div>
          </div>
        )}

        {!loading && invoices.map((inv, i) => (
          <div key={inv.id} className="row-hover transition-colors duration-[80ms]"
            style={{ display: "grid", gridTemplateColumns: "140px 1fr 120px 100px 170px 100px 60px", padding: "11px 18px", borderBottom: i < invoices.length - 1 ? "1px solid #f5f5f5" : "none", alignItems: "center", background: "#fff" }}>

            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#111", fontFamily: "monospace" }}>{inv.invoiceRef}</div>
            </div>

            <div>
              <div style={{ fontSize: 13, color: "#333", fontWeight: 500 }}>{TYPE_LABELS[inv.type] ?? inv.type}</div>
              {inv.contentUrl && (
                <div style={{ fontSize: 10, color: "#bbb", marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 200 }}>
                  {inv.contentUrl}
                </div>
              )}
            </div>

            <div style={{ fontSize: 13, fontWeight: 600, color: "#111" }}>
              {fmt(inv.amount, inv.currency)}
            </div>

            <div style={{ fontSize: 12, color: "#666" }}>
              {fmtDate(inv.issuedAt)}
            </div>

            <div style={{ fontSize: 12, color: "#555", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {inv.readerEmail ?? (inv.readerEmailHash ? (
                <span style={{ fontFamily: "monospace", color: "#bbb", fontSize: 11 }}>{inv.readerEmailHash.slice(0, 12)}…</span>
              ) : <span style={{ color: "#ccc" }}>—</span>)}
            </div>

            <div style={{ fontSize: 12, color: "#555" }}>
              {inv.domainHost ?? <span style={{ color: "#ccc" }}>—</span>}
            </div>

            <div>
              <a
                href={`/api/invoices/${inv.id}/download`}
                target="_blank"
                rel="noreferrer"
                style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 8px", borderRadius: 5, border: "1px solid #e5e5e5", background: "#fff", fontSize: 11, fontWeight: 500, color: "#555", cursor: "pointer", fontFamily: "inherit", textDecoration: "none" }}
              >
                <Download size={11} />
                View
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
