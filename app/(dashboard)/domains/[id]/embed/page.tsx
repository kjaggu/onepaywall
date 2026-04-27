import { notFound } from "next/navigation"
import { Code2, CheckCircle2 } from "lucide-react"
import { getSession } from "@/lib/auth/session"
import { getDomain } from "@/lib/db/queries/domains"
import { CopyEmbedScript } from "@/components/dashboard/domains/copy-embed-script"
import { EmbedVerifyButton } from "@/components/dashboard/domains/embed-verify-button"

export default async function DomainEmbedPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getSession()
  if (!session?.publisherId) notFound()

  const domain = await getDomain(id, session.publisherId)
  if (!domain) notFound()

  return (
    <div className="border border-[var(--color-border)] rounded-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-[var(--color-border)] bg-[var(--color-surface)] flex items-center gap-2">
        <Code2 size={16} className="text-[var(--color-brand)]" />
        <h2 className="text-body font-semibold text-[var(--color-text)]">Embed script</h2>
      </div>

      <div className="p-5 space-y-5">
        <div>
          <p className="text-body-sm text-[var(--color-text-secondary)] mb-3">
            Copy this snippet and paste it into every page on{" "}
            <span className="font-medium text-[var(--color-text)]">{domain.domain}</span> where you want
            OnePaywall gates to appear.
          </p>
          <CopyEmbedScript siteKey={domain.siteKey} />
        </div>

        <div className="border-t border-[var(--color-border)]" />

        <div>
          <h3 className="text-body font-semibold text-[var(--color-text)] mb-3">How to install</h3>
          <ol className="space-y-3">
            {[
              { step: "Copy the snippet above." },
              {
                step: "Paste it inside the",
                code: "<head>",
                after: "tag of your site's HTML — or just before the closing",
                code2: "</body>",
                after2: "tag.",
              },
              { step: "Deploy the change — the script loads asynchronously so it won't slow your pages." },
              { step: "Create and publish a gate in OnePaywall. The script will pick it up automatically — no further changes needed." },
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

        <div className="border-t border-[var(--color-border)]" />

        <div>
          <h3 className="text-body font-semibold text-[var(--color-text)] mb-2">Installation status</h3>
          <EmbedVerifyButton domainId={domain.id} verified={domain.embedEnabled} />
        </div>

        <div className="border-t border-[var(--color-border)]" />

        <div>
          <h3 className="text-body font-semibold text-[var(--color-text)] mb-3">Works with any platform</h3>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {["WordPress", "Webflow", "Ghost", "Wix", "Squarespace", "Custom HTML"].map((platform) => (
              <div key={platform} className="flex items-center gap-2 text-body-sm text-[var(--color-text-secondary)]">
                <CheckCircle2 size={13} className="text-[var(--color-success)] shrink-0" />
                {platform}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
