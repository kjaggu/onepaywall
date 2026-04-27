import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, ExternalLink, Globe, Code2, CheckCircle2 } from "lucide-react"
import { getSession } from "@/lib/auth/session"
import { getDomain } from "@/lib/db/queries/domains"
import { Badge } from "@/components/ui/badge"
import { CopyEmbedScript } from "@/components/dashboard/domains/copy-embed-script"

export default async function DomainDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getSession()
  if (!session?.publisherId) notFound()

  const domain = await getDomain(id, session.publisherId)
  if (!domain) notFound()

  return (
    <div className="p-8 max-w-3xl">
      {/* Back nav */}
      <Link
        href="/domains"
        className="inline-flex items-center gap-1.5 text-body-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text)] mb-6"
      >
        <ArrowLeft size={14} />
        All domains
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between mb-8">
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

      {/* Embed script section */}
      <div className="border border-[var(--color-border)] rounded-xl overflow-hidden">
        {/* Section header */}
        <div className="px-5 py-4 border-b border-[var(--color-border)] bg-[var(--color-surface)] flex items-center gap-2">
          <Code2 size={16} className="text-[var(--color-brand)]" />
          <h2 className="text-body font-semibold text-[var(--color-text)]">Embed script</h2>
        </div>

        <div className="p-5 space-y-5">
          {/* Script snippet */}
          <div>
            <p className="text-body-sm text-[var(--color-text-secondary)] mb-3">
              Copy this snippet and paste it into every page on{" "}
              <span className="font-medium text-[var(--color-text)]">{domain.domain}</span> where you want
              OnePaywall gates to appear.
            </p>
            <CopyEmbedScript siteKey={domain.siteKey} />
          </div>

          {/* Divider */}
          <div className="border-t border-[var(--color-border)]" />

          {/* Installation instructions */}
          <div>
            <h3 className="text-body font-semibold text-[var(--color-text)] mb-3">How to install</h3>
            <ol className="space-y-3">
              {[
                {
                  step: "Copy the snippet above.",
                },
                {
                  step: "Paste it inside the",
                  code: "<head>",
                  after: "tag of your site's HTML — or just before the closing",
                  code2: "</body>",
                  after2: "tag.",
                },
                {
                  step: "Deploy the change — the script loads asynchronously so it won't slow your pages.",
                },
                {
                  step: "Create and publish a gate in OnePaywall. The script will pick it up automatically — no further changes needed.",
                },
              ].map((item, i) => (
                <li key={i} className="flex gap-3">
                  <span className="shrink-0 w-5 h-5 rounded-full bg-[var(--color-brand-subtle)] text-[var(--color-brand)] text-xs font-semibold flex items-center justify-center mt-0.5">
                    {i + 1}
                  </span>
                  <p className="text-body-sm text-[var(--color-text-secondary)]">
                    {item.step}
                    {item.code && (
                      <>
                        {" "}
                        <code className="font-mono text-xs bg-[var(--color-surface)] border border-[var(--color-border)] px-1 py-0.5 rounded text-[var(--color-text)]">
                          {item.code}
                        </code>{" "}
                        {item.after}{" "}
                        <code className="font-mono text-xs bg-[var(--color-surface)] border border-[var(--color-border)] px-1 py-0.5 rounded text-[var(--color-text)]">
                          {item.code2}
                        </code>
                        {item.after2}
                      </>
                    )}
                  </p>
                </li>
              ))}
            </ol>
          </div>

          {/* Divider */}
          <div className="border-t border-[var(--color-border)]" />

          {/* Works with */}
          <div>
            <h3 className="text-body font-semibold text-[var(--color-text)] mb-3">Works with any platform</h3>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {["WordPress", "Webflow", "Ghost", "Wix", "Squarespace", "Custom HTML"].map((platform) => (
                <div
                  key={platform}
                  className="flex items-center gap-2 text-body-sm text-[var(--color-text-secondary)]"
                >
                  <CheckCircle2 size={13} className="text-[var(--color-success)] shrink-0" />
                  {platform}
                </div>
              ))}
            </div>
            <p className="text-body-sm text-[var(--color-text-secondary)] mt-3">
              The snippet is a plain JavaScript tag — it works anywhere you can add HTML to your page
              template.
            </p>
          </div>

          {/* Divider */}
          <div className="border-t border-[var(--color-border)]" />

          {/* Where to add */}
          <div>
            <h3 className="text-body font-semibold text-[var(--color-text)] mb-3">Where to add it</h3>
            <div className="space-y-2.5">
              {[
                {
                  label: "All pages",
                  description:
                    "Add to your global layout or template so it loads on every page. Gates only fire on pages that match a configured URL pattern.",
                },
                {
                  label: "Specific pages only",
                  description:
                    "Add the snippet only to the pages or post types you want to monetise — leave it out of free pages.",
                },
              ].map(({ label, description }) => (
                <div
                  key={label}
                  className="rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] px-4 py-3"
                >
                  <p className="text-body-sm font-medium text-[var(--color-text)]">{label}</p>
                  <p className="text-body-sm text-[var(--color-text-secondary)] mt-0.5">{description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
