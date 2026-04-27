"use client"

import { useRouter } from "next/navigation"
import { MoreHorizontal, Pause, Play, Trash2 } from "lucide-react"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

type Props = {
  id: string
  status: "active" | "paused" | "removed"
}

export function DomainActions({ id, status }: Props) {
  const router = useRouter()

  async function setStatus(next: "active" | "paused") {
    await fetch(`/api/domains/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    })
    router.refresh()
  }

  async function remove() {
    if (!confirm("Remove this domain? This cannot be undone.")) return
    await fetch(`/api/domains/${id}`, { method: "DELETE" })
    router.refresh()
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className={cn(buttonVariants({ variant: "ghost" }), "size-7")}>
        <MoreHorizontal size={15} />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        {status === "active" ? (
          <DropdownMenuItem onClick={() => setStatus("paused")}>
            <Pause size={13} className="mr-2" />
            Pause
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem onClick={() => setStatus("active")}>
            <Play size={13} className="mr-2" />
            Activate
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={remove}
          className="text-[var(--destructive)] focus:text-[var(--destructive)]"
        >
          <Trash2 size={13} className="mr-2" />
          Remove
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
