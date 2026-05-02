"use client"

import { useEffect, useState } from "react"
import { Settings, CheckCircle2, XCircle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"

type Config = {
  fromName: string
  fromEmail: string
  replyTo: string
  domainVerifiedAt: string | null
  hasApiKey: boolean
} | null

export default function EmailSettingsPage() {
  const [config, setConfig] = useState<Config>(null)
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ resendApiKey: "", fromName: "", fromEmail: "", replyTo: "" })
  const [saving, setSaving] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [verifyStatus, setVerifyStatus] = useState<"idle" | "verified" | "unverified">("idle")
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetch("/api/email/config")
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d?.config) {
          setConfig(d.config)
          setForm({
            resendApiKey: "",
            fromName:     d.config.fromName ?? "",
            fromEmail:    d.config.fromEmail ?? "",
            replyTo:      d.config.replyTo ?? "",
          })
          if (d.config.domainVerifiedAt) setVerifyStatus("verified")
        }
        setLoading(false)
      })
  }, [])

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const res = await fetch("/api/email/config", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })
    setSaving(false)
    if (res.ok) {
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
      setConfig(c => c
        ? { ...c, fromName: form.fromName, fromEmail: form.fromEmail, replyTo: form.replyTo, hasApiKey: true }
        : { fromName: form.fromName, fromEmail: form.fromEmail, replyTo: form.replyTo, hasApiKey: true, domainVerifiedAt: null }
      )
      setForm(f => ({ ...f, resendApiKey: "" }))
    }
  }

  async function verifyDomain() {
    setVerifying(true)
    const res = await fetch("/api/email/verify-domain", { method: "POST" })
    const data = res.ok ? await res.json() : null
    setVerifying(false)
    setVerifyStatus(data?.verified ? "verified" : "unverified")
  }

  const domain = form.fromEmail.includes("@") ? form.fromEmail.split("@")[1] : null

  return (
    <div className="p-6 max-w-lg">
      <div className="flex items-center gap-2.5 mb-5">
        <Settings size={18} strokeWidth={1.5} className="text-[#111]" />
        <h1 className="text-[17px] font-semibold text-[#111]">Email settings</h1>
      </div>

      {loading ? (
        <div className="text-[13px] text-[#bbb]">Loading…</div>
      ) : (
        <form onSubmit={save} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-[12px] font-medium text-[#555]">Resend API key</label>
            <input
              type="password"
              className="border border-[#ebebeb] rounded px-3 py-2 text-[13px] focus:outline-none focus:ring-1 focus:ring-[#111]"
              placeholder={config?.hasApiKey ? "••••••••••••••••  (leave blank to keep current)" : "re_…"}
              value={form.resendApiKey}
              onChange={e => setForm(f => ({ ...f, resendApiKey: e.target.value }))}
            />
            <p className="text-[11px] text-[#aaa]">
              Get your API key from{" "}
              <a href="https://resend.com/api-keys" target="_blank" rel="noreferrer" className="underline">
                resend.com/api-keys
              </a>
            </p>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[12px] font-medium text-[#555]">From name</label>
            <input
              className="border border-[#ebebeb] rounded px-3 py-2 text-[13px] focus:outline-none focus:ring-1 focus:ring-[#111]"
              placeholder="The Finance Brief"
              value={form.fromName}
              onChange={e => setForm(f => ({ ...f, fromName: e.target.value }))}
              required
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[12px] font-medium text-[#555]">From email</label>
            <input
              type="email"
              className="border border-[#ebebeb] rounded px-3 py-2 text-[13px] focus:outline-none focus:ring-1 focus:ring-[#111]"
              placeholder="newsletter@yourdomain.com"
              value={form.fromEmail}
              onChange={e => setForm(f => ({ ...f, fromEmail: e.target.value }))}
              required
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[12px] font-medium text-[#555]">
              Reply-to <span className="text-[#bbb] font-normal">(optional)</span>
            </label>
            <input
              type="email"
              className="border border-[#ebebeb] rounded px-3 py-2 text-[13px] focus:outline-none focus:ring-1 focus:ring-[#111]"
              placeholder="hello@yourdomain.com"
              value={form.replyTo}
              onChange={e => setForm(f => ({ ...f, replyTo: e.target.value }))}
            />
          </div>

          <Button type="submit" size="sm" disabled={saving}>
            {saving ? "Saving…" : saved ? "Saved" : "Save settings"}
          </Button>
        </form>
      )}

      {/* Domain verification */}
      {domain && config?.hasApiKey && (
        <div className="mt-6 border border-[#ebebeb] rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[13px] font-medium text-[#111]">Domain verification</span>
            {verifyStatus === "verified" ? (
              <span className="flex items-center gap-1 text-[11px] text-[#16a34a]">
                <CheckCircle2 size={12} /> Verified
              </span>
            ) : verifyStatus === "unverified" ? (
              <span className="flex items-center gap-1 text-[11px] text-[#dc2626]">
                <XCircle size={12} /> Not verified
              </span>
            ) : null}
          </div>
          <p className="text-[12px] text-[#888] mb-3">
            Add your domain <strong>{domain}</strong> in Resend, then verify DKIM/SPF records to improve deliverability.
          </p>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={verifyDomain}
            disabled={verifying}
          >
            {verifying ? (
              <>
                <Loader2 size={12} className="animate-spin mr-1.5" />
                Checking…
              </>
            ) : "Check verification status"}
          </Button>
        </div>
      )}
    </div>
  )
}
