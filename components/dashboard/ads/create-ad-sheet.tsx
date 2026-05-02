"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { X, Upload } from "lucide-react"
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

type NetworkOption = {
  id: string
  provider: "google_adsense" | "google_ad_manager"
}

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated: () => void
}

export function CreateAdSheet({ open, onOpenChange, onCreated }: Props) {
  const [sourceType, setSourceType] = useState<"direct" | "network">("direct")
  const [form, setForm] = useState<AdFormData>(INITIAL)
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [skipType, setSkipType] = useState<"skip" | "mandatory">("skip")
  const fileRef = useRef<HTMLInputElement>(null)

  // Network source state
  const [networks, setNetworks] = useState<NetworkOption[]>([])
  const [selectedNetworkId, setSelectedNetworkId] = useState("")
  const [adSlotId, setAdSlotId] = useState("")
  const [adUnitPath, setAdUnitPath] = useState("")
  const [adSizes, setAdSizes] = useState("300x250")
  const [networkName, setNetworkName] = useState("")

  const loadNetworks = useCallback(async () => {
    const res = await fetch("/api/ads/networks")
    if (res.ok) {
      const json = await res.json()
      setNetworks(json.networks ?? [])
      if (json.networks?.length) setSelectedNetworkId(json.networks[0].id)
    }
  }, [])

  useEffect(() => {
    if (open && sourceType === "network") void loadNetworks()
  }, [open, sourceType, loadNetworks])

  function reset() {
    setSourceType("direct")
    setForm(INITIAL)
    setFile(null)
    setPreview(null)
    setError(null)
    setSkipType("skip")
    setSelectedNetworkId("")
    setAdSlotId("")
    setAdUnitPath("")
    setAdSizes("300x250")
    setNetworkName("")
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

  async function handleDirectSubmit(e: React.FormEvent) {
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

  async function handleNetworkSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!networkName.trim()) { setError("Ad name is required."); return }
    if (!selectedNetworkId) { setError("Select a connected network."); return }

    const network = networks.find(n => n.id === selectedNetworkId)
    if (!network) { setError("Invalid network selected."); return }

    let networkConfig: Record<string, unknown>
    if (network.provider === "google_adsense") {
      if (!adSlotId.trim()) { setError("Ad Slot ID is required."); return }
      networkConfig = { adSlotId: adSlotId.trim() }
    } else {
      if (!adUnitPath.trim()) { setError("Ad Unit Path is required."); return }
      const sizes = adSizes
        .split(",")
        .map(s => s.trim().split("x").map(Number))
        .filter(pair => pair.length === 2 && !pair.some(isNaN))
      if (sizes.length === 0) { setError("Enter at least one valid size (e.g. 300x250)."); return }
      networkConfig = { adUnitPath: adUnitPath.trim(), sizes }
    }

    setSaving(true)
    setError(null)
    try {
      const res = await fetch("/api/ads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: networkName.trim(),
          sourceType: "network",
          adNetworkId: selectedNetworkId,
          networkConfig,
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

  const selectedNetwork = networks.find(n => n.id === selectedNetworkId)

  return (
    <Sheet open={open} onOpenChange={v => { onOpenChange(v); if (!v) reset() }}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Create ad unit</SheetTitle>
        </SheetHeader>

        <div className="flex flex-col gap-5 px-4 pb-4 mt-2">
          {/* Source type toggle */}
          <div className="flex flex-col gap-1.5">
            <label style={{ fontSize: 12, fontWeight: 500, color: "#555" }}>Source</label>
            <div className="flex gap-2">
              {([
                { value: "direct",  label: "Direct upload" },
                { value: "network", label: "Ad network" },
              ] as const).map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => { setSourceType(opt.value); setError(null); if (opt.value === "network") void loadNetworks() }}
                  style={{
                    flex: 1,
                    padding: "7px 0",
                    borderRadius: 6,
                    border: `1px solid ${sourceType === opt.value ? "#111" : "#ddd"}`,
                    background: sourceType === opt.value ? "#111" : "#fff",
                    color: sourceType === opt.value ? "#fff" : "#555",
                    fontSize: 13,
                    fontWeight: 500,
                    cursor: "pointer",
                    fontFamily: "inherit",
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {sourceType === "direct" ? (
            <form onSubmit={handleDirectSubmit} className="contents">
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
          ) : (
            <form onSubmit={handleNetworkSubmit} className="contents">
              {/* Ad name */}
              <div className="flex flex-col gap-1.5">
                <label style={{ fontSize: 12, fontWeight: 500, color: "#555" }}>Ad name</label>
                <input
                  type="text"
                  placeholder="e.g. Homepage leaderboard"
                  value={networkName}
                  onChange={e => setNetworkName(e.target.value)}
                  style={{ border: "1px solid #ddd", borderRadius: 6, padding: "7px 10px", fontSize: 13, outline: "none", fontFamily: "inherit" }}
                  className="focus:border-[#111] transition-colors"
                />
              </div>

              {/* Network picker */}
              <div className="flex flex-col gap-1.5">
                <label style={{ fontSize: 12, fontWeight: 500, color: "#555" }}>Network</label>
                {networks.length === 0 ? (
                  <p style={{ fontSize: 13, color: "#888" }}>
                    No networks connected. Go to the Networks tab to connect AdSense or Google Ad Manager first.
                  </p>
                ) : (
                  <select
                    value={selectedNetworkId}
                    onChange={e => setSelectedNetworkId(e.target.value)}
                    style={{ border: "1px solid #ddd", borderRadius: 6, padding: "7px 10px", fontSize: 13, outline: "none", fontFamily: "inherit", background: "#fff" }}
                  >
                    {networks.map(n => (
                      <option key={n.id} value={n.id}>
                        {n.provider === "google_adsense" ? "Google AdSense" : "Google Ad Manager"}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Provider-specific config */}
              {selectedNetwork?.provider === "google_adsense" && (
                <div className="flex flex-col gap-1.5">
                  <label style={{ fontSize: 12, fontWeight: 500, color: "#555" }}>Ad Slot ID</label>
                  <input
                    type="text"
                    placeholder="1234567890"
                    value={adSlotId}
                    onChange={e => setAdSlotId(e.target.value)}
                    style={{ border: "1px solid #ddd", borderRadius: 6, padding: "7px 10px", fontSize: 13, outline: "none", fontFamily: "inherit" }}
                    className="focus:border-[#111] transition-colors"
                  />
                  <p style={{ fontSize: 11, color: "#aaa" }}>Found in your AdSense account under Ads → By ad unit.</p>
                </div>
              )}

              {selectedNetwork?.provider === "google_ad_manager" && (
                <>
                  <div className="flex flex-col gap-1.5">
                    <label style={{ fontSize: 12, fontWeight: 500, color: "#555" }}>Ad Unit Path</label>
                    <input
                      type="text"
                      placeholder="/12345678/my-site/content"
                      value={adUnitPath}
                      onChange={e => setAdUnitPath(e.target.value)}
                      style={{ border: "1px solid #ddd", borderRadius: 6, padding: "7px 10px", fontSize: 13, outline: "none", fontFamily: "inherit" }}
                      className="focus:border-[#111] transition-colors"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label style={{ fontSize: 12, fontWeight: 500, color: "#555" }}>Sizes</label>
                    <input
                      type="text"
                      placeholder="300x250,728x90"
                      value={adSizes}
                      onChange={e => setAdSizes(e.target.value)}
                      style={{ border: "1px solid #ddd", borderRadius: 6, padding: "7px 10px", fontSize: 13, outline: "none", fontFamily: "inherit" }}
                      className="focus:border-[#111] transition-colors"
                    />
                    <p style={{ fontSize: 11, color: "#aaa" }}>Comma-separated, e.g. 300x250,728x90</p>
                  </div>
                </>
              )}

              {error && <div style={{ fontSize: 12, color: "#e54" }}>{error}</div>}

              <button
                type="submit"
                disabled={saving || networks.length === 0}
                style={{
                  background: "#111",
                  color: "#fff",
                  border: "none",
                  borderRadius: 6,
                  padding: "10px 0",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: (saving || networks.length === 0) ? "not-allowed" : "pointer",
                  opacity: (saving || networks.length === 0) ? 0.6 : 1,
                  fontFamily: "inherit",
                }}
              >
                {saving ? "Creating…" : "Create ad unit"}
              </button>
            </form>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
