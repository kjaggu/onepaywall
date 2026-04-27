"use client"

import { useEffect, useState, useCallback } from "react"
import { Megaphone, Plus, Image as ImageIcon, Video, ToggleLeft, ToggleRight, Trash2 } from "lucide-react"
import { CreateAdSheet } from "@/components/dashboard/ads/create-ad-sheet"

type AdUnit = {
  id: string
  name: string
  mediaType: "image" | "video" | null
  cdnUrl: string | null
  ctaLabel: string | null
  ctaUrl: string | null
  skipAfterSeconds: number | null
  active: boolean
  createdAt: string
}

export default function AdsPage() {
  const [units, setUnits] = useState<AdUnit[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch("/api/ads")
    if (res.ok) {
      const data = await res.json()
      setUnits(data.units ?? [])
    }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function toggleActive(unit: AdUnit) {
    await fetch(`/api/ads/${unit.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !unit.active }),
    })
    load()
  }

  async function handleDelete(unit: AdUnit) {
    if (!confirm(`Delete "${unit.name}"?`)) return
    await fetch(`/api/ads/${unit.id}`, { method: "DELETE" })
    load()
  }

  return (
    <div style={{ padding: "28px 32px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 600, color: "#111" }}>Ads</h1>
          <p style={{ fontSize: 12, color: "#aaa", marginTop: 2 }}>Upload ad creatives shown inside your gates.</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 6, background: "#111", color: "#fff", border: "none", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}
        >
          <Plus size={14} />
          Create ad unit
        </button>
      </div>

      {loading ? (
        <div style={{ border: "1px solid #ebebeb", borderRadius: 8, overflow: "hidden" }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{ padding: "14px 18px", borderBottom: i < 2 ? "1px solid #f5f5f5" : "none", display: "flex", gap: 12, alignItems: "center" }}>
              <div style={{ width: 48, height: 36, background: "#f0f0f0", borderRadius: 6 }} />
              <div style={{ flex: 1 }}>
                <div style={{ width: 160, height: 12, background: "#f0f0f0", borderRadius: 4, marginBottom: 6 }} />
                <div style={{ width: 80, height: 10, background: "#f5f5f5", borderRadius: 4 }} />
              </div>
            </div>
          ))}
        </div>
      ) : units.length === 0 ? (
        <div style={{ border: "1px solid #ebebeb", borderRadius: 8, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 32px", textAlign: "center" }}>
          <Megaphone size={40} stroke="#ddd" style={{ marginBottom: 12 }} />
          <div style={{ fontSize: 14, fontWeight: 500, color: "#888", marginBottom: 6 }}>No ad units yet</div>
          <div style={{ fontSize: 12, color: "#bbb", maxWidth: 320, lineHeight: 1.6, marginBottom: 20 }}>
            Upload images, GIFs, or short videos to show readers during gate interactions.
          </div>
          <button
            onClick={() => setShowCreate(true)}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", borderRadius: 6, background: "#111", color: "#fff", border: "none", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}
          >
            <Plus size={14} />
            Create ad unit
          </button>
        </div>
      ) : (
        <div style={{ border: "1px solid #ebebeb", borderRadius: 8, overflow: "hidden" }}>
          {/* Table head */}
          <div style={{ display: "grid", gridTemplateColumns: "56px 1fr 100px 120px 100px 80px", padding: "7px 18px", background: "#fafafa", borderBottom: "1px solid #ebebeb" }}>
            {["", "Name", "Type", "Skip", "Status", ""].map((h, i) => (
              <div key={i} style={{ fontSize: 10, fontWeight: 600, color: "#bbb", letterSpacing: "0.04em", textTransform: "uppercase" }}>{h}</div>
            ))}
          </div>

          {units.map((unit, i) => (
            <div
              key={unit.id}
              style={{ display: "grid", gridTemplateColumns: "56px 1fr 100px 120px 100px 80px", padding: "12px 18px", borderBottom: i < units.length - 1 ? "1px solid #f5f5f5" : "none", alignItems: "center", background: "#fff" }}
            >
              {/* Thumbnail / icon */}
              <div style={{ width: 44, height: 34, borderRadius: 5, background: "#f5f5f5", border: "1px solid #ebebeb", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                {unit.cdnUrl ? (
                  unit.mediaType === "video"
                    ? <Video size={16} stroke="#aaa" />
                    : <img src={unit.cdnUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  unit.mediaType === "video" ? <Video size={16} stroke="#aaa" /> : <ImageIcon size={16} stroke="#aaa" />
                )}
              </div>

              {/* Name + CTA */}
              <div>
                <div style={{ fontSize: 13, fontWeight: 500, color: "#111" }}>{unit.name}</div>
                {unit.ctaLabel && (
                  <div style={{ fontSize: 11, color: "#aaa", marginTop: 1 }}>CTA: {unit.ctaLabel}</div>
                )}
              </div>

              {/* Type */}
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                {unit.mediaType === "video" ? <Video size={12} stroke="#888" /> : <ImageIcon size={12} stroke="#888" />}
                <span style={{ fontSize: 12, color: "#888", textTransform: "capitalize" }}>{unit.mediaType ?? "—"}</span>
              </div>

              {/* Skip */}
              <div>
                {unit.skipAfterSeconds != null ? (
                  <span style={{ fontSize: 12, color: "#888" }}>Skip after {unit.skipAfterSeconds}s</span>
                ) : (
                  <span style={{ fontSize: 12, color: "#aaa", fontStyle: "italic" }}>Mandatory</span>
                )}
              </div>

              {/* Active toggle */}
              <button
                onClick={() => toggleActive(unit)}
                style={{ display: "flex", alignItems: "center", gap: 5, background: "none", border: "none", cursor: "pointer", padding: 0 }}
              >
                {unit.active
                  ? <ToggleRight size={18} stroke="#22c55e" />
                  : <ToggleLeft size={18} stroke="#ccc" />
                }
                <span style={{ fontSize: 12, color: unit.active ? "#22c55e" : "#bbb" }}>
                  {unit.active ? "Active" : "Paused"}
                </span>
              </button>

              {/* Delete */}
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button
                  onClick={() => handleDelete(unit)}
                  style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: "#ccc" }}
                  className="hover:text-[#e54] transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreate && (
        <CreateAdSheet
          onClose={() => setShowCreate(false)}
          onCreated={() => { setShowCreate(false); load() }}
        />
      )}
    </div>
  )
}
