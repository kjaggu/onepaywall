"use client"

import { useRef, useState } from "react"
import { X, Upload, Video } from "lucide-react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"

type AdFormData = {
  name: string
  mediaType: "image" | "video"
  skipAfterSeconds: number | null
  ctaLabel: string
  ctaUrl: string
}

const INITIAL: AdFormData = {
  name: "",
  mediaType: "image",
  skipAfterSeconds: 5,
  ctaLabel: "",
  ctaUrl: "",
}

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated: () => void
}

export function CreateAdSheet({ open, onOpenChange, onCreated }: Props) {
  const [form, setForm] = useState<AdFormData>(INITIAL)
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [skipType, setSkipType] = useState<"skip" | "mandatory">("skip")
  const fileRef = useRef<HTMLInputElement>(null)

  function reset() {
    setForm(INITIAL)
    setFile(null)
    setPreview(null)
    setError(null)
    setSkipType("skip")
  }

  function handleFile(f: File) {
    if (f.type.startsWith("video/")) {
      const video = document.createElement("video")
      video.preload = "metadata"
      video.onloadedmetadata = () => {
        URL.revokeObjectURL(video.src)
        if (video.duration > 60) {
          setError("Video must be 60 seconds or shorter.")
          return
        }
        setError(null)
      }
      video.src = URL.createObjectURL(f)
      setForm(p => ({ ...p, mediaType: "video" }))
    } else {
      setForm(p => ({ ...p, mediaType: "image" }))
    }
    setFile(f)
    setPreview(URL.createObjectURL(f))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!file) { setError("Please upload a creative."); return }
    if (!form.name.trim()) { setError("Ad name is required."); return }
    setSaving(true)
    setError(null)

    try {
      const urlRes = await fetch("/api/ads/upload-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: file.name, contentType: file.type }),
      })
      const { uploadUrl, storageKey, cdnUrl, error: urlErr } = await urlRes.json()

      if (!urlRes.ok) {
        if (urlErr === "R2 storage not configured") {
          await fetch("/api/ads", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: form.name,
              sourceType: "direct",
              mediaType: form.mediaType,
              ctaLabel: form.ctaLabel || null,
              ctaUrl: form.ctaUrl || null,
              skipAfterSeconds: skipType === "mandatory" ? null : (form.skipAfterSeconds ?? null),
            }),
          })
          onOpenChange(false)
          reset()
          onCreated()
          return
        }
        throw new Error(urlErr ?? "Failed to get upload URL")
      }

      await fetch(uploadUrl, { method: "PUT", body: file, headers: { "Content-Type": file.type } })

      const res = await fetch("/api/ads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          sourceType: "direct",
          mediaType: form.mediaType,
          storageKey,
          cdnUrl,
          ctaLabel: form.ctaLabel || null,
          ctaUrl: form.ctaUrl || null,
          skipAfterSeconds: skipType === "mandatory" ? null : (form.skipAfterSeconds ?? null),
        }),
      })
      if (!res.ok) throw new Error("Failed to create ad unit")
      onOpenChange(false)
      reset()
      onCreated()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={v => { onOpenChange(v); if (!v) reset() }}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Create ad unit</SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5 px-4 pb-4 mt-2">
          {/* Name */}
          <div className="flex flex-col gap-1.5">
            <label style={{ fontSize: 12, fontWeight: 500, color: "#555" }}>Ad name</label>
            <input
              type="text"
              placeholder="e.g. Summer campaign banner"
              value={form.name}
              onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              style={{ border: "1px solid #ddd", borderRadius: 6, padding: "7px 10px", fontSize: 13, outline: "none", fontFamily: "inherit" }}
              className="focus:border-[#111] transition-colors"
            />
          </div>

          {/* Upload */}
          <div className="flex flex-col gap-1.5">
            <label style={{ fontSize: 12, fontWeight: 500, color: "#555" }}>Creative</label>
            <input
              ref={fileRef}
              type="file"
              accept="image/*,image/gif,video/*"
              className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
            />
            {preview ? (
              <div className="relative rounded-lg overflow-hidden border border-[#ddd]" style={{ maxHeight: 200 }}>
                {form.mediaType === "video"
                  ? <video src={preview} controls className="w-full" style={{ maxHeight: 200, objectFit: "contain", background: "#000" }} />
                  : <img src={preview} alt="preview" className="w-full" style={{ maxHeight: 200, objectFit: "contain", background: "#f5f5f5" }} />
                }
                <button
                  type="button"
                  onClick={() => { setFile(null); setPreview(null) }}
                  className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1 hover:bg-black/70"
                >
                  <X size={12} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="flex flex-col items-center justify-center gap-2 border border-dashed border-[#ddd] rounded-lg hover:border-[#aaa] hover:bg-[#fafafa] transition-colors cursor-pointer"
                style={{ padding: "36px 24px" }}
              >
                <Upload size={24} stroke="#ccc" />
                <span style={{ fontSize: 13, color: "#888" }}>Click to upload image, GIF, or video</span>
                <span style={{ fontSize: 11, color: "#bbb" }}>Images & GIFs · Videos up to 60 seconds</span>
              </button>
            )}
          </div>

          {/* Skip behaviour */}
          <div className="flex flex-col gap-1.5">
            <label style={{ fontSize: 12, fontWeight: 500, color: "#555" }}>Skip behaviour</label>
            <div className="flex gap-2">
              {([
                { value: "skip",      label: "Allow skip" },
                { value: "mandatory", label: "Mandatory" },
              ] as const).map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setSkipType(opt.value)}
                  style={{
                    flex: 1,
                    padding: "7px 0",
                    borderRadius: 6,
                    border: `1px solid ${skipType === opt.value ? "#111" : "#ddd"}`,
                    background: skipType === opt.value ? "#111" : "#fff",
                    color: skipType === opt.value ? "#fff" : "#555",
                    fontSize: 13,
                    fontWeight: 500,
                    cursor: "pointer",
                    fontFamily: "inherit",
                    transition: "all 0.12s",
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            {skipType === "skip" && (
              <div className="flex items-center gap-2 mt-1">
                <label style={{ fontSize: 12, color: "#888", whiteSpace: "nowrap" }}>Skip after</label>
                <input
                  type="number"
                  min={1}
                  max={60}
                  value={form.skipAfterSeconds ?? ""}
                  onChange={e => setForm(p => ({ ...p, skipAfterSeconds: Number(e.target.value) || null }))}
                  style={{ border: "1px solid #ddd", borderRadius: 6, padding: "5px 8px", fontSize: 13, width: 60, fontFamily: "inherit" }}
                  className="focus:border-[#111] outline-none"
                />
                <span style={{ fontSize: 12, color: "#888" }}>seconds</span>
              </div>
            )}
          </div>

          {/* CTA */}
          <div className="flex flex-col gap-1.5">
            <label style={{ fontSize: 12, fontWeight: 500, color: "#555" }}>CTA (optional)</label>
            <input
              type="text"
              placeholder="Button label, e.g. Learn more"
              value={form.ctaLabel}
              onChange={e => setForm(p => ({ ...p, ctaLabel: e.target.value }))}
              style={{ border: "1px solid #ddd", borderRadius: 6, padding: "7px 10px", fontSize: 13, outline: "none", fontFamily: "inherit", marginBottom: 4 }}
              className="focus:border-[#111] transition-colors"
            />
            <input
              type="url"
              placeholder="https://advertiser.com"
              value={form.ctaUrl}
              onChange={e => setForm(p => ({ ...p, ctaUrl: e.target.value }))}
              style={{ border: "1px solid #ddd", borderRadius: 6, padding: "7px 10px", fontSize: 13, outline: "none", fontFamily: "inherit" }}
              className="focus:border-[#111] transition-colors"
            />
          </div>

          {error && <div style={{ fontSize: 12, color: "#e54" }}>{error}</div>}

          <button
            type="submit"
            disabled={saving}
            style={{
              background: "#111",
              color: "#fff",
              border: "none",
              borderRadius: 6,
              padding: "10px 0",
              fontSize: 13,
              fontWeight: 600,
              cursor: saving ? "not-allowed" : "pointer",
              opacity: saving ? 0.6 : 1,
              fontFamily: "inherit",
            }}
          >
            {saving ? "Creating…" : "Create ad unit"}
          </button>
        </form>
      </SheetContent>
    </Sheet>
  )
}
