"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Plus } from "lucide-react"
import { buttonVariants } from "@/components/ui/button"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

type Domain = { id: string; name: string; domain: string }

export function CreateGateSheet({ domains }: { domains: Domain[] }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [domainId, setDomainId] = useState(domains[0]?.id ?? "")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      const res = await fetch("/api/gates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, domainId }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? "Something went wrong")
        return
      }
      setOpen(false)
      setName("")
      router.push(`/gates/${data.gate.id}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger className={cn(buttonVariants({ size: "sm" }), "gap-1.5")}>
        <Plus size={14} />
        New gate
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Create gate</SheetTitle>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-5 px-1">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="gate-name" className="text-label text-[var(--color-text)]">
              Gate name
            </label>
            <Input
              id="gate-name"
              placeholder="Article paywall"
              value={name}
              onChange={e => setName(e.target.value)}
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="gate-domain" className="text-label text-[var(--color-text)]">
              Domain
            </label>
            <select
              id="gate-domain"
              value={domainId}
              onChange={e => setDomainId(e.target.value)}
              required
              className="h-8 w-full rounded-lg border border-[var(--input)] bg-background px-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
            >
              {domains.map(d => (
                <option key={d.id} value={d.id}>{d.name} — {d.domain}</option>
              ))}
            </select>
          </div>
          {error && <p className="text-sm text-[var(--destructive)]">{error}</p>}
          <Button type="submit" disabled={loading || domains.length === 0} className="mt-2">
            {loading ? "Creating…" : "Create gate"}
          </Button>
          {domains.length === 0 && (
            <p className="text-sm text-[var(--muted-foreground)]">Add a domain first before creating a gate.</p>
          )}
        </form>
      </SheetContent>
    </Sheet>
  )
}
