"use client"

import { useState } from "react"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { UserPlus } from "lucide-react"

const INTERVALS = [
  { value: "monthly",   label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "annual",    label: "Annual" },
  { value: "lifetime",  label: "Lifetime" },
]

const PAYMENT_METHODS = [
  { value: "cash",          label: "Cash" },
  { value: "bank_transfer", label: "Bank transfer" },
  { value: "complimentary", label: "Complimentary" },
]

const fieldStyle = { display: "flex", flexDirection: "column" as const, gap: 6 }
const labelStyle = { fontSize: 13, fontWeight: 500, color: "#333" }
const selectStyle = {
  border: "1px solid #ddd", borderRadius: 6, padding: "8px 10px",
  fontSize: 13, color: "#333", background: "#fff", fontFamily: "inherit", cursor: "pointer", width: "100%",
}
const textareaStyle = {
  border: "1px solid #ddd", borderRadius: 6, padding: "8px 10px",
  fontSize: 13, color: "#333", background: "#fff", fontFamily: "inherit", width: "100%",
  resize: "vertical" as const, minHeight: 72, outline: "none",
}

type Props = { onAdded: () => void }

export function AddSubscriberSheet({ onAdded }: Props) {
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState("")
  const [interval, setInterval] = useState("annual")
  const [expiresAt, setExpiresAt] = useState("")
  const [paymentMethod, setPaymentMethod] = useState("complimentary")
  const [notes, setNotes] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setSaving(true)
    try {
      const res = await fetch("/api/subscribers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          interval,
          expiresAt: expiresAt || undefined,
          paymentMethod: paymentMethod || undefined,
          notes: notes.trim() || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? "Failed to add subscriber")
        return
      }
      setOpen(false)
      setEmail(""); setInterval("annual"); setExpiresAt(""); setPaymentMethod("complimentary"); setNotes("")
      onAdded()
    } finally {
      setSaving(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger>
        <span style={{ display: "none" }} />
      </SheetTrigger>
      {/* Trigger is controlled via open state — button is outside */}
      <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setOpen(true)}>
        <UserPlus size={14} />
        Add subscriber
      </Button>
      <SheetContent className="w-[400px] sm:w-[440px]">
        <SheetHeader>
          <SheetTitle>Add subscriber</SheetTitle>
        </SheetHeader>
        <form onSubmit={handleSubmit} style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={fieldStyle}>
            <label style={labelStyle}>Email</label>
            <Input type="email" placeholder="reader@example.com" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>

          <div style={fieldStyle}>
            <label style={labelStyle}>Billing interval</label>
            <select style={selectStyle} value={interval} onChange={e => setInterval(e.target.value)}>
              {INTERVALS.map(i => <option key={i.value} value={i.value}>{i.label}</option>)}
            </select>
          </div>

          <div style={fieldStyle}>
            <label style={labelStyle}>
              Access expires
              <span style={{ fontWeight: 400, color: "#aaa", marginLeft: 6 }}>(leave empty for no expiry)</span>
            </label>
            <Input type="date" value={expiresAt} onChange={e => setExpiresAt(e.target.value)} />
          </div>

          <div style={fieldStyle}>
            <label style={labelStyle}>Payment method</label>
            <select style={selectStyle} value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}>
              {PAYMENT_METHODS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
          </div>

          <div style={fieldStyle}>
            <label style={labelStyle}>
              Notes
              <span style={{ fontWeight: 400, color: "#aaa", marginLeft: 6 }}>(optional)</span>
            </label>
            <textarea
              style={textareaStyle}
              placeholder="e.g. Gifted annual subscription at launch event"
              value={notes}
              onChange={e => setNotes(e.target.value)}
            />
          </div>

          {error && <p style={{ fontSize: 13, color: "#dc2626" }}>{error}</p>}

          <div style={{ display: "flex", gap: 8, paddingTop: 4 }}>
            <Button type="submit" disabled={saving} style={{ flex: 1 }}>
              {saving ? "Adding…" : "Add subscriber"}
            </Button>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  )
}
