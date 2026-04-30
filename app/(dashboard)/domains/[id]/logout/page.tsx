import { notFound } from "next/navigation"
import { LogOut, Link2, Code2, Sparkles } from "lucide-react"
import { getSession } from "@/lib/auth/session"
import { getDomain } from "@/lib/db/queries/domains"
import { LogoutWidgetConfig } from "@/components/dashboard/domains/logout-widget-config"
import { CopySnippet } from "@/components/dashboard/domains/copy-snippet"

export default async function DomainLogoutPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getSession()
  if (!session?.publisherId) notFound()

  const domain = await getDomain(id, session.publisherId)
  if (!domain) notFound()

  const logoutUrl = `https://${domain.domain}/?opw_logout=1`
  const buttonSnippet = `<button onclick="window.OnePaywall && window.OnePaywall.logout()">
  Sign out
</button>`
  const buttonWithRedirectSnippet = `<button onclick="window.OnePaywall && window.OnePaywall.logout({ returnUrl: '/' })">
  Sign out
</button>`

  return (
    <div className="space-y-4">

      {/* Subscriber widget */}
      <div className="border border-[var(--color-border)] rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-[var(--color-border)] bg-[var(--color-surface)] flex items-center gap-2">
          <Sparkles size={16} className="text-[var(--color-brand)]" />
          <h2 className="text-body font-semibold text-[var(--color-text)]">Subscriber widget</h2>
          <span className="ml-auto text-xs font-medium px-2 py-0.5 rounded-full bg-[var(--color-brand-subtle)] text-[var(--color-brand)]">
            Recommended
          </span>
        </div>
        <div className="p-5">
          <LogoutWidgetConfig
            domainId={domain.id}
            enabled={domain.logoutWidgetEnabled}
            position={domain.logoutWidgetPosition}
          />
        </div>
      </div>

      {/* URL-based logout */}
      <div className="border border-[var(--color-border)] rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-[var(--color-border)] bg-[var(--color-surface)] flex items-center gap-2">
          <Link2 size={16} className="text-[var(--color-brand)]" />
          <h2 className="text-body font-semibold text-[var(--color-text)]">Logout link</h2>
        </div>
        <div className="p-5 space-y-4">
          <p className="text-body-sm text-[var(--color-text-secondary)]">
            Add this URL as a custom menu link — works in WordPress, Ghost, Webflow, or any CMS with a navigation
            editor. When a subscriber clicks it, they&apos;re signed out and the page reloads.
          </p>

          <CopySnippet code={logoutUrl} lang="URL" />

          <div className="space-y-2">
            <p className="text-body-sm font-medium text-[var(--color-text)]">WordPress</p>
            <ol className="space-y-1">
              {[
                "Go to Appearance → Menus in your WordPress dashboard.",
                'Open "Links" and paste the URL above. Set the label to "Sign out".',
                "Add it to your menu and save.",
              ].map((step, i) => (
                <li key={i} className="flex gap-2.5 text-body-sm text-[var(--color-text-secondary)]">
                  <span className="shrink-0 w-5 h-5 rounded-full bg-[var(--color-brand-subtle)] text-[var(--color-brand)] text-xs font-semibold flex items-center justify-center mt-0.5">
                    {i + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
          </div>

          <div className="space-y-2">
            <p className="text-body-sm font-medium text-[var(--color-text)]">Newsletter links</p>
            <p className="text-body-sm text-[var(--color-text-secondary)]">
              Link to this URL from your email footer. Subscribers who click it on their phone or a shared computer
              will be signed out on that device.
            </p>
          </div>

          <div className="space-y-2">
            <p className="text-body-sm font-medium text-[var(--color-text)]">Redirect after logout</p>
            <p className="text-body-sm text-[var(--color-text-secondary)]">
              Append <code className="font-mono text-xs bg-[var(--color-surface)] border border-[var(--color-border)] px-1 py-0.5 rounded">?opw_redirect=/path</code> to send the reader to a specific page after signing out. The destination must be on the same domain.
            </p>
            <CopySnippet code={`https://${domain.domain}/?opw_logout=1&opw_redirect=/subscribe`} lang="URL" />
          </div>
        </div>
      </div>

      {/* JS API */}
      <div className="border border-[var(--color-border)] rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-[var(--color-border)] bg-[var(--color-surface)] flex items-center gap-2">
          <Code2 size={16} className="text-[var(--color-brand)]" />
          <h2 className="text-body font-semibold text-[var(--color-text)]">Custom button</h2>
        </div>
        <div className="p-5 space-y-4">
          <p className="text-body-sm text-[var(--color-text-secondary)]">
            Use the JavaScript API to wire up your own button anywhere on the page. The embed script must already be
            loaded on that page.
          </p>

          <div className="space-y-2">
            <p className="text-body-sm font-medium text-[var(--color-text)]">Basic button</p>
            <CopySnippet code={buttonSnippet} />
          </div>

          <div className="space-y-2">
            <p className="text-body-sm font-medium text-[var(--color-text)]">With redirect</p>
            <CopySnippet code={buttonWithRedirectSnippet} />
          </div>

          <div className="rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] p-3 text-body-sm text-[var(--color-text-secondary)]">
            <span className="font-medium text-[var(--color-text)]">What logout does: </span>
            Signing out clears the subscriber&apos;s session on that device only. Their subscription is not cancelled.
            They can restore access at any time by clicking &ldquo;Already subscribed?&rdquo; on any paywalled article and
            following the email link.
          </div>
        </div>
      </div>
    </div>
  )
}
