import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, ExternalLink, Globe } from "lucide-react"
import { getSession } from "@/lib/auth/session"
import { getDomain } from "@/lib/db/queries/domains"
import { Badge } from "@/components/ui/badge"
import { Tabs, type TabItem } from "@/components/dashboard/tabs"

export default async function DomainLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const session = await getSession()
  if (!session?.publisherId) notFound()

  const domain = await getDomain(id, session.publisherId)
  if (!domain) notFound()

  const tabs: TabItem[] = [
    { label: "Overview",   href: `/domains/${id}`,           exact: true },
    { label: "Embed",      href: `/domains/${id}/embed` },
    { label: "Free pages", href: `/domains/${id}/free-pages` },
    { label: "Settings",   href: `/domains/${id}/settings` },
  ]

  return (
    <div className="p-8 max-w-4xl">
      <Link
        href="/domains"
        className="inline-flex items-center gap-1.5 text-body-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text)] mb-6"
      >
        <ArrowLeft size={14} />
        All domains
      </Link>

      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[var(--color-brand-subtle)] flex items-center justify-center shrink-0">
            <Globe size={18} className="text-[var(--color-brand)]" />
          </div>
          <div>
            <h1 className="text-h1 text-[var(--color-text)]">{domain.name}</h1>
            <a
              href={`https://${domain.domain}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-body-sm text-[var(--color-text-secondary)] hover:text-[var(--color-brand)] mt-0.5"
            >
              {domain.domain}
              <ExternalLink size={11} />
            </a>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={domain.status === "active" ? "default" : "secondary"} className="capitalize">
            {domain.status}
          </Badge>
          <Badge variant={domain.embedEnabled ? "default" : "outline"}>
            Embed {domain.embedEnabled ? "on" : "off"}
          </Badge>
        </div>
      </div>

      <div className="mb-6">
        <Tabs items={tabs} />
      </div>

      {children}
    </div>
  )
}
