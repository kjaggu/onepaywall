import { notFound } from "next/navigation"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import { getSession } from "@/lib/auth/session"
import { getGate } from "@/lib/db/queries/gates"
import { GateHeader } from "@/components/dashboard/gates/gate-header"
import { Tabs, type TabItem } from "@/components/dashboard/tabs"

export default async function GateLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const session = await getSession()
  if (!session?.publisherId) notFound()

  const row = await getGate(id, session.publisherId)
  if (!row) notFound()

  const tabs: TabItem[] = [
    { label: "URL rules", href: `/gates/${id}`,            exact: true },
    { label: "Steps",     href: `/gates/${id}/steps` },
    { label: "Triggers",  href: `/gates/${id}/triggers` },
  ]

  return (
    <div className="p-8 max-w-3xl">
      <Link
        href="/gates"
        className="inline-flex items-center gap-1 text-body-sm text-[var(--muted-foreground)] hover:text-[var(--color-text)] mb-5 transition-colors"
      >
        <ChevronLeft size={14} />
        All gates
      </Link>

      <div className="flex flex-col gap-5">
        <GateHeader gate={row.gate} domain={row.domain} />
        <Tabs items={tabs} />
        {children}
      </div>
    </div>
  )
}
