import { notFound } from "next/navigation"
import { CreditCard } from "lucide-react"
import { getSession } from "@/lib/auth/session"
import { getOrCreatePgConfig } from "@/lib/db/queries/pg-configs"
import { PgConfigForm } from "@/components/dashboard/settings/pg-config-form"

export default async function PaymentGatewayPage() {
  const session = await getSession()
  if (!session?.publisherId) notFound()

  const config = await getOrCreatePgConfig(session.publisherId)

  return (
    <div className="p-8 max-w-2xl">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-9 h-9 rounded-lg bg-[var(--color-brand-subtle)] flex items-center justify-center shrink-0">
          <CreditCard size={18} className="text-[var(--color-brand)]" />
        </div>
        <div>
          <h1 className="text-h1 text-[var(--color-text)]">Payment gateway</h1>
          <p className="text-body-sm text-[var(--color-text-secondary)] mt-0.5">
            Choose how article unlocks and reader subscriptions are collected.
          </p>
        </div>
      </div>

      <div className="border border-[var(--color-border)] rounded-xl p-6">
        <PgConfigForm
          initial={{
            mode: config.mode,
            keyId: config.keyId ?? "",
            keySecretSet: !!config.keySecret,
            webhookSecretSet: !!config.webhookSecret,
          }}
        />
      </div>
    </div>
  )
}
