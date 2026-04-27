"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Pause, Play, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"

type Status = "active" | "paused" | "removed"

export function DomainStatusActions({ id, status }: { id: string; status: Status }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)

  async function setStatus(next: "active" | "paused") {
    setBusy(true)
    await fetch(`/api/domains/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    })
    router.refresh()
    setBusy(false)
  }

  async function remove() {
    if (!confirm("Remove this domain? Gates will stop serving immediately. This cannot be undone.")) return
    setBusy(true)
    await fetch(`/api/domains/${id}`, { method: "DELETE" })
    router.replace("/domains")
  }

  return (
    <div className="flex flex-col gap-3">
      {status === "active" ? (
        <Button variant="outline" onClick={() => setStatus("paused")} disabled={busy} className="w-fit gap-1.5">
          <Pause size={13} />
          Pause domain
        </Button>
      ) : (
        <Button variant="outline" onClick={() => setStatus("active")} disabled={busy} className="w-fit gap-1.5">
          <Play size={13} />
          Activate domain
        </Button>
      )}
      <Button variant="destructive" onClick={remove} disabled={busy} className="w-fit gap-1.5">
        <Trash2 size={13} />
        Remove domain
      </Button>
    </div>
  )
}
