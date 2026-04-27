"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Plus } from "lucide-react"
import { Button, buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

export function AddDomainSheet() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [domain, setDomain] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      const res = await fetch("/api/domains", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, domain }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? "Something went wrong")
        return
      }
      setOpen(false)
      setName("")
      setDomain("")
      router.refresh()
    } catch {
      setError("Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger className={cn(buttonVariants({ size: "sm" }), "gap-1.5")}>
        <Plus size={14} />
        Add domain
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Add domain</SheetTitle>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-5 px-4 pb-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="name" className="text-label text-[var(--color-text)]">
              Display name
            </label>
            <Input
              id="name"
              placeholder="My Blog"
              value={name}
              onChange={e => setName(e.target.value)}
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="domain" className="text-label text-[var(--color-text)]">
              Domain
            </label>
            <Input
              id="domain"
              placeholder="example.com"
              value={domain}
              onChange={e => setDomain(e.target.value)}
              required
            />
            <p className="text-[var(--color-text-secondary)] text-xs">
              Without protocol — e.g. <span className="font-mono">example.com</span>
            </p>
          </div>
          {error && (
            <p className="text-sm text-[var(--destructive)]">{error}</p>
          )}
          <Button type="submit" disabled={loading} className="mt-2">
            {loading ? "Adding…" : "Add domain"}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  )
}
