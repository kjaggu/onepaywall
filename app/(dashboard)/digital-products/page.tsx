"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Download, Package, Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

type Product = {
  id: string
  title: string
  description: string | null
  fileName: string
  priceInPaise: number
  downloadCount: number
  active: boolean
  createdAt: string
}

export default function DigitalProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [sheetOpen, setSheetOpen] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch("/api/digital-products")
    if (res.ok) {
      const data = await res.json()
      setProducts(data.products ?? [])
    }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function handleDelete(product: Product) {
    if (!confirm(`Archive "${product.title}"?`)) return
    await fetch(`/api/digital-products/${product.id}`, { method: "DELETE" })
    load()
  }

  return (
    <div>
      <div className="flex justify-end mb-3">
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger className={cn(buttonVariants({ size: "sm" }), "gap-1.5")}>
            <Plus size={14} />
            Add product
          </SheetTrigger>
          <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
            <SheetHeader>
              <SheetTitle>Add digital product</SheetTitle>
            </SheetHeader>
            <div className="flex flex-col gap-5 px-4 pb-4 mt-2">
              <CreateProductForm
                onCreated={() => { setSheetOpen(false); load() }}
              />
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {loading ? (
        <div style={{ border: "1px solid #ebebeb", borderRadius: 8, overflow: "hidden" }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{ padding: "14px 18px", borderBottom: i < 2 ? "1px solid #f5f5f5" : "none", display: "flex", gap: 12, alignItems: "center" }}>
              <div style={{ flex: 1 }}>
                <div style={{ width: 200, height: 12, background: "#f0f0f0", borderRadius: 4, marginBottom: 6 }} />
                <div style={{ width: 100, height: 10, background: "#f5f5f5", borderRadius: 4 }} />
              </div>
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <div style={{ border: "1px solid #ebebeb", borderRadius: 8, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 32px", textAlign: "center" }}>
          <Package size={40} stroke="#ddd" style={{ marginBottom: 12 }} />
          <div style={{ fontSize: 14, fontWeight: 500, color: "#888", marginBottom: 6 }}>No digital products yet</div>
          <div style={{ fontSize: 12, color: "#bbb", maxWidth: 320, lineHeight: 1.6, marginBottom: 20 }}>
            Upload e-books, research reports, or any downloadable file. Add a digital_product step to a gate to sell them.
          </div>
          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger className={cn(buttonVariants({ size: "sm" }), "gap-1.5")}>
              <Plus size={14} />
              Add product
            </SheetTrigger>
            <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
              <SheetHeader>
                <SheetTitle>Add digital product</SheetTitle>
              </SheetHeader>
              <div className="flex flex-col gap-5 px-4 pb-4 mt-2">
                <CreateProductForm onCreated={() => { setSheetOpen(false); load() }} />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      ) : (
        <div style={{ border: "1px solid #ebebeb", borderRadius: 8, overflow: "hidden" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 100px 120px 100px 48px", padding: "7px 18px", background: "#fafafa", borderBottom: "1px solid #ebebeb" }}>
            {["Product", "Price", "Downloads", "Status", ""].map((h, i) => (
              <div key={i} style={{ fontSize: 10, fontWeight: 600, color: "#bbb", letterSpacing: "0.04em", textTransform: "uppercase" }}>{h}</div>
            ))}
          </div>

          {products.map((p, i) => (
            <div
              key={p.id}
              style={{ display: "grid", gridTemplateColumns: "1fr 100px 120px 100px 48px", padding: "12px 18px", borderBottom: i < products.length - 1 ? "1px solid #f5f5f5" : "none", alignItems: "center", background: "#fff" }}
            >
              <div>
                <div style={{ fontSize: 13, fontWeight: 500, color: "#111" }}>{p.title}</div>
                {p.description && (
                  <div style={{ fontSize: 11, color: "#aaa", marginTop: 1 }}>{p.description}</div>
                )}
                <div style={{ fontSize: 11, color: "#ccc", marginTop: 1 }}>{p.fileName}</div>
              </div>

              <div style={{ fontSize: 13, color: "#444" }}>
                ₹{(p.priceInPaise / 100).toFixed(0)}
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "#888" }}>
                <Download size={12} stroke="#bbb" />
                {p.downloadCount}
              </div>

              <div>
                <span style={{
                  display: "inline-flex",
                  alignItems: "center",
                  padding: "2px 8px",
                  borderRadius: 12,
                  fontSize: 11,
                  fontWeight: 500,
                  background: p.active ? "#dcfce7" : "#f3f4f6",
                  color: p.active ? "#15803d" : "#6b7280",
                }}>
                  {p.active ? "Active" : "Archived"}
                </span>
              </div>

              <button
                onClick={() => handleDelete(p)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#ddd", display: "flex", padding: 4 }}
                title="Archive"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function CreateProductForm({ onCreated }: { onCreated: () => void }) {
  const [title, setTitle]         = useState("")
  const [description, setDesc]    = useState("")
  const [price, setPrice]         = useState("")
  const [file, setFile]           = useState<File | null>(null)
  const [saving, setSaving]       = useState(false)
  const [error, setError]         = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim() || !price || !file) {
      setError("Title, price, and file are required.")
      return
    }
    const priceNum = parseInt(price, 10)
    if (isNaN(priceNum) || priceNum <= 0) {
      setError("Price must be a positive number (in rupees).")
      return
    }

    setSaving(true)
    setError(null)

    try {
      // Step 1: get presigned upload URL
      const uploadRes = await fetch("/api/digital-products/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: file.name, contentType: file.type }),
      })
      if (!uploadRes.ok) throw new Error("Failed to get upload URL")
      const { uploadUrl, storageKey } = await uploadRes.json()

      // Step 2: upload file directly to R2
      const putRes = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      })
      if (!putRes.ok) throw new Error("File upload failed")

      // Step 3: create product record
      const createRes = await fetch("/api/digital-products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
          r2Key: storageKey,
          fileName: file.name,
          mimeType: file.type,
          priceInPaise: priceNum * 100,
        }),
      })
      if (!createRes.ok) throw new Error("Failed to save product")

      onCreated()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-[var(--color-text)]">Title</label>
        <input
          className="border border-[var(--color-border)] rounded-md px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
          placeholder="e.g. The Publisher Playbook"
          value={title}
          onChange={e => setTitle(e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-[var(--color-text)]">Description <span className="text-[var(--color-text-secondary)] font-normal">(optional)</span></label>
        <input
          className="border border-[var(--color-border)] rounded-md px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
          placeholder="Short description shown to readers"
          value={description}
          onChange={e => setDesc(e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-[var(--color-text)]">Price (₹)</label>
        <input
          className="border border-[var(--color-border)] rounded-md px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
          type="number"
          min="1"
          placeholder="e.g. 299"
          value={price}
          onChange={e => setPrice(e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-[var(--color-text)]">File</label>
        <input
          ref={fileRef}
          type="file"
          className="hidden"
          accept=".pdf,.epub,.zip,.docx,.xlsx,.csv,.mp3,.mp4"
          onChange={e => setFile(e.target.files?.[0] ?? null)}
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="border border-dashed border-[var(--color-border)] rounded-md px-3 py-3 text-sm text-[var(--color-text-secondary)] hover:border-[var(--color-primary)] transition-colors text-left"
        >
          {file ? (
            <span className="text-[var(--color-text)]">{file.name} ({(file.size / 1024 / 1024).toFixed(1)} MB)</span>
          ) : (
            "Click to select a file (PDF, EPUB, ZIP, etc.)"
          )}
        </button>
      </div>

      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}

      <Button type="submit" disabled={saving} className="mt-1">
        {saving ? "Uploading…" : "Save product"}
      </Button>
    </form>
  )
}
