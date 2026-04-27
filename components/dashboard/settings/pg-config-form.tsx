"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { CheckCircle2, Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

type Mode = "platform" | "own"

type Props = {
  initial: {
    mode: Mode
    keyId: string
    keySecretSet: boolean
    webhookSecretSet: boolean
  }
}

function SecretInput({
  id,
  placeholder,
  isSet,
  value,
  onChange,
}: {
  id: string
  placeholder: string
  isSet: boolean
  value: string
  onChange: (v: string) => void
}) {
  const [show, setShow] = useState(false)
  return (
    <div className="relative">
      <Input
        id={id}
        type={show ? "text" : "password"}
        placeholder={isSet && !value ? "••••••••  (saved — enter new value to replace)" : placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
        className="pr-9 font-mono text-sm"
      />
      <button
        type="button"
        onClick={() => setShow(s => !s)}
        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)] hover:text-[var(--color-text)]"
      >
        {show ? <EyeOff size={14} /> : <Eye size={14} />}
      </button>
    </div>
  )
}

export function PgConfigForm({ initial }: Props) {
  const router = useRouter()
  const [mode, setMode] = useState<Mode>(initial.mode)
  const [keyId, setKeyId] = useState(initial.keyId)
  const [keySecret, setKeySecret] = useState("")
  const [webhookSecret, setWebhookSecret] = useState("")
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState("")

  async function save() {
    setError("")
    if (mode === "own") {
      if (!keyId.trim()) { setError("Razorpay Key ID is required."); return }
    }
    setSaving(true)
    const body: Record<string, unknown> = { mode }
    if (mode === "own") {
      body.keyId = keyId.trim()
      if (keySecret) body.keySecret = keySecret
      if (webhookSecret) body.webhookSecret = webhookSecret
    }
    const res = await fetch("/api/pg-config", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
    setSaving(false)
    if (!res.ok) { setError("Failed to save. Please try again."); return }
    setSaved(true)
    setKeySecret("")
    setWebhookSecret("")
    setTimeout(() => setSaved(false), 3000)
    router.refresh()
  }

  return (
    <div className="space-y-6">
      {/* Mode selector */}
      <div className="grid grid-cols-2 gap-3">
        {(["platform", "own"] as Mode[]).map(m => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={cn(
              "rounded-xl border-2 px-4 py-4 text-left transition-all",
              mode === m
                ? "border-[var(--color-brand)] bg-[var(--color-brand-subtle)]"
                : "border-[var(--color-border)] hover:border-[var(--color-border-strong)]"
            )}
          >
            <p className={cn("text-body font-semibold", mode === m ? "text-[var(--color-brand)]" : "text-[var(--color-text)]")}>
              {m === "platform" ? "Use OnePaywall" : "Use my own Razorpay"}
            </p>
            <p className="text-body-sm text-[var(--color-text-secondary)] mt-1">
              {m === "platform"
                ? "OnePaywall collects payments on your behalf using our Razorpay account."
                : "Connect your own Razorpay account. You receive funds directly."}
            </p>
          </button>
        ))}
      </div>

      {/* Platform mode info */}
      {mode === "platform" && (
        <div className="rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] px-4 py-3 flex items-start gap-3">
          <CheckCircle2 size={16} className="text-[var(--color-success)] shrink-0 mt-0.5" />
          <div>
            <p className="text-body-sm font-medium text-[var(--color-text)]">No setup needed</p>
            <p className="text-body-sm text-[var(--color-text-secondary)] mt-0.5">
              OnePaywall handles payment processing. Revenue is settled to you after platform fees are deducted.
            </p>
          </div>
        </div>
      )}

      {/* Own keys form */}
      {mode === "own" && (
        <div className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="keyId" className="text-label text-[var(--color-text)]">
              Razorpay Key ID
            </label>
            <Input
              id="keyId"
              placeholder="rzp_live_xxxxxxxxxxxx"
              value={keyId}
              onChange={e => setKeyId(e.target.value)}
              className="font-mono text-sm"
            />
            <p className="text-xs text-[var(--color-text-secondary)]">
              Found in Razorpay Dashboard → Settings → API Keys. Use live keys in production.
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="keySecret" className="text-label text-[var(--color-text)]">
              Key Secret
            </label>
            <SecretInput
              id="keySecret"
              placeholder="Your Razorpay key secret"
              isSet={initial.keySecretSet}
              value={keySecret}
              onChange={setKeySecret}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="webhookSecret" className="text-label text-[var(--color-text)]">
              Webhook Secret
              <span className="ml-1.5 text-xs font-normal text-[var(--color-text-secondary)]">(optional)</span>
            </label>
            <SecretInput
              id="webhookSecret"
              placeholder="Your Razorpay webhook secret"
              isSet={initial.webhookSecretSet}
              value={webhookSecret}
              onChange={setWebhookSecret}
            />
            <p className="text-xs text-[var(--color-text-secondary)]">
              Set in Razorpay Dashboard → Webhooks. Used to validate incoming payment events.
            </p>
          </div>
        </div>
      )}

      {error && <p className="text-sm text-[var(--color-danger)]">{error}</p>}

      <div className="flex items-center gap-3">
        <Button onClick={save} disabled={saving}>
          {saving ? "Saving…" : "Save"}
        </Button>
        {saved && (
          <span className="flex items-center gap-1.5 text-body-sm text-[var(--color-success)]">
            <CheckCircle2 size={13} />
            Saved
          </span>
        )}
      </div>
    </div>
  )
}
