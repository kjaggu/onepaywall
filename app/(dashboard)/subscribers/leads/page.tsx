"use client"

import { useCallback, useEffect, useState } from "react"
import { Download, Mail, Plus, Tag, X } from "lucide-react"

type CrmSubscriber = {
  id: string
  email: string
  source: string
  notes: string | null
  active: boolean
  createdAt: string
  tags: string[]
}

const SOURCE_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  subscription:  { bg: "#f0fdf4", color: "#16a34a", label: "Subscription" },
  lead_capture:  { bg: "#eff6ff", color: "#2563eb", label: "Lead" },
  manual:        { bg: "#f5f5f5", color: "#6b7280", label: "Manual" },
}

function sourceStyle(source: string) {
  return SOURCE_STYLE[source] ?? { bg: "#f5f5f5", color: "#888", label: source }
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
}

export default function LeadsPage() {
  const [subscribers, setSubscribers] = useState<CrmSubscriber[]>([])
  const [loading, setLoading] = useState(true)
  const [sourceFilter, setSourceFilter] = useState("")
  const [editingNotes, setEditingNotes] = useState<string | null>(null)
  const [notesValue, setNotesValue] = useState("")
  const [addingTagFor, setAddingTagFor] = useState<string | null>(null)
  const [tagInput, setTagInput] = useState("")

  const load = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (sourceFilter) params.set("source", sourceFilter)
    const res = await fetch(`/api/subscribers/crm?${params}`)
    if (res.ok) {
      const data = await res.json()
      setSubscribers(data.subscribers ?? [])
    }
    setLoading(false)
  }, [sourceFilter])

  useEffect(() => { load() }, [load])

  async function saveNotes(subscriberId: string) {
    await fetch(`/api/subscribers/crm/${subscriberId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notes: notesValue.trim() || null }),
    })
    setEditingNotes(null)
    load()
  }

  async function addTag(subscriberId: string) {
    const tag = tagInput.trim().toLowerCase()
    if (!tag) return
    await fetch("/api/subscribers/tags", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subscriberId, tag }),
    })
    setAddingTagFor(null)
    setTagInput("")
    load()
  }

  async function removeTag(subscriberId: string, tag: string) {
    await fetch("/api/subscribers/tags", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subscriberId, tag }),
    })
    load()
  }

  function downloadCsv() {
    const params = new URLSearchParams()
    if (sourceFilter) params.set("source", sourceFilter)
    window.location.href = `/api/subscribers/export?${params}`
  }

  return (
    <div>
      {/* Toolbar */}
      <div style={{ display: "flex", gap: 8, marginBottom: 14, alignItems: "center" }}>
        <select
          value={sourceFilter}
          onChange={e => setSourceFilter(e.target.value)}
          style={{ border: "1px solid #ddd", borderRadius: 6, padding: "5px 10px", fontSize: 12, color: "#555", background: "#fff", fontFamily: "inherit", cursor: "pointer" }}
        >
          <option value="">All sources</option>
          <option value="lead_capture">Lead capture</option>
          <option value="subscription">Subscription</option>
          <option value="manual">Manual</option>
        </select>

        <button
          onClick={downloadCsv}
          style={{ display: "flex", alignItems: "center", gap: 5, border: "1px solid #ddd", borderRadius: 6, padding: "5px 12px", fontSize: 12, background: "#fff", cursor: "pointer", color: "#555" }}
        >
          <Download size={12} />
          Export CSV
        </button>
      </div>

      {/* Table */}
      <div style={{ border: "1px solid #ebebeb", borderRadius: 8, overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 100px 200px 200px 100px", padding: "7px 18px", background: "#fafafa", borderBottom: "1px solid #ebebeb" }}>
          {["Email", "Source", "Tags", "Notes", "Since"].map((h) => (
            <div key={h} style={{ fontSize: 10, fontWeight: 600, color: "#bbb", letterSpacing: "0.04em", textTransform: "uppercase" }}>{h}</div>
          ))}
        </div>

        {loading ? (
          [0, 1, 2, 3].map(i => (
            <div key={i} style={{ padding: "13px 18px", borderBottom: i < 3 ? "1px solid #f5f5f5" : "none", display: "flex", gap: 20, alignItems: "center" }}>
              <div style={{ flex: 1, height: 12, background: "#f0f0f0", borderRadius: 4 }} />
              <div style={{ width: 80, height: 12, background: "#f0f0f0", borderRadius: 4 }} />
            </div>
          ))
        ) : subscribers.length === 0 ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "72px 32px", textAlign: "center" }}>
            <Mail size={36} stroke="#ddd" style={{ marginBottom: 10 }} />
            <div style={{ fontSize: 14, fontWeight: 500, color: "#888", marginBottom: 5 }}>No subscribers in this view</div>
            <div style={{ fontSize: 12, color: "#bbb", maxWidth: 300, lineHeight: 1.6 }}>
              Add a lead_capture gate step to start collecting emails.
            </div>
          </div>
        ) : (
          subscribers.map((sub, i) => {
            const ss = sourceStyle(sub.source)
            const isEditingNotes = editingNotes === sub.id
            const isAddingTag = addingTagFor === sub.id
            return (
              <div
                key={sub.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "2fr 100px 200px 200px 100px",
                  padding: "10px 18px",
                  borderBottom: i < subscribers.length - 1 ? "1px solid #f5f5f5" : "none",
                  alignItems: "start",
                  background: "#fff",
                }}
              >
                {/* Email */}
                <div style={{ fontSize: 13, color: "#333", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", paddingTop: 2 }}>
                  {sub.email}
                </div>

                {/* Source */}
                <div style={{ paddingTop: 2 }}>
                  <span style={{ fontSize: 10, fontWeight: 500, padding: "2px 7px", borderRadius: 4, background: ss.bg, color: ss.color }}>
                    {ss.label}
                  </span>
                </div>

                {/* Tags */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4, alignItems: "center" }}>
                  {sub.tags.map(tag => (
                    <span
                      key={tag}
                      style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: 10, padding: "2px 6px", borderRadius: 10, background: "#f0f4ff", color: "#3730a3", border: "1px solid #c7d2fe" }}
                    >
                      {tag}
                      <button
                        onClick={() => removeTag(sub.id, tag)}
                        style={{ background: "none", border: "none", cursor: "pointer", padding: 0, color: "#a5b4fc", display: "flex", alignItems: "center" }}
                      >
                        <X size={9} />
                      </button>
                    </span>
                  ))}
                  {isAddingTag ? (
                    <div style={{ display: "flex", gap: 3, alignItems: "center" }}>
                      <input
                        autoFocus
                        value={tagInput}
                        onChange={e => setTagInput(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === "Enter") addTag(sub.id)
                          if (e.key === "Escape") { setAddingTagFor(null); setTagInput("") }
                        }}
                        placeholder="tag"
                        style={{ width: 70, fontSize: 11, border: "1px solid #c7d2fe", borderRadius: 4, padding: "1px 5px", outline: "none" }}
                      />
                      <button onClick={() => addTag(sub.id)} style={{ fontSize: 10, background: "#4f46e5", color: "#fff", border: "none", borderRadius: 4, padding: "2px 6px", cursor: "pointer" }}>Add</button>
                      <button onClick={() => { setAddingTagFor(null); setTagInput("") }} style={{ fontSize: 10, background: "none", border: "1px solid #ddd", borderRadius: 4, padding: "2px 6px", cursor: "pointer", color: "#888" }}>✕</button>
                    </div>
                  ) : (
                    <button
                      onClick={() => { setAddingTagFor(sub.id); setTagInput("") }}
                      style={{ display: "flex", alignItems: "center", gap: 2, fontSize: 10, color: "#bbb", background: "none", border: "1px dashed #ddd", borderRadius: 10, padding: "1px 6px", cursor: "pointer" }}
                    >
                      <Plus size={9} />
                      tag
                    </button>
                  )}
                </div>

                {/* Notes */}
                <div>
                  {isEditingNotes ? (
                    <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                      <input
                        autoFocus
                        value={notesValue}
                        onChange={e => setNotesValue(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === "Enter") saveNotes(sub.id)
                          if (e.key === "Escape") setEditingNotes(null)
                        }}
                        style={{ flex: 1, fontSize: 11, border: "1px solid #ddd", borderRadius: 4, padding: "2px 6px", outline: "none" }}
                      />
                      <button onClick={() => saveNotes(sub.id)} style={{ fontSize: 10, background: "#111", color: "#fff", border: "none", borderRadius: 4, padding: "2px 6px", cursor: "pointer" }}>Save</button>
                    </div>
                  ) : (
                    <button
                      onClick={() => { setEditingNotes(sub.id); setNotesValue(sub.notes ?? "") }}
                      style={{ background: "none", border: "none", cursor: "pointer", textAlign: "left", padding: 0, fontSize: 12, color: sub.notes ? "#555" : "#ccc", width: "100%" }}
                      title="Click to edit notes"
                    >
                      {sub.notes ?? "Add note…"}
                    </button>
                  )}
                </div>

                {/* Since */}
                <div style={{ fontSize: 12, color: "#888", paddingTop: 2 }}>
                  {fmtDate(sub.createdAt)}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
