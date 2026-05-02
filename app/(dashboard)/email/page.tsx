"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Mail, Send, Zap, Users2, Settings, ArrowRight } from "lucide-react"

type HubStats = {
  subscriberCount: number
  lastCampaign: { name: string; sentAt: string; recipientCount: number } | null
  activeAutomations: number
}

export default function EmailHubPage() {
  const [stats, setStats] = useState<HubStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [cRes, aRes, sRes] = await Promise.all([
        fetch("/api/email/campaigns"),
        fetch("/api/email/automations"),
        fetch("/api/subscribers/count"),
      ])
      const campaigns  = cRes.ok  ? (await cRes.json()).campaigns  ?? [] : []
      const automations = aRes.ok ? (await aRes.json()).automations ?? [] : []
      const subCount   = sRes.ok  ? (await sRes.json()).count ?? 0 : 0

      const sent = campaigns.filter((c: { status: string }) => c.status === "sent")
      const lastCampaign = sent.length > 0 ? sent[0] : null

      setStats({
        subscriberCount:   subCount,
        lastCampaign:      lastCampaign
          ? { name: lastCampaign.name, sentAt: lastCampaign.sentAt, recipientCount: lastCampaign.recipientCount ?? 0 }
          : null,
        activeAutomations: automations.filter((a: { status: string }) => a.status === "active").length,
      })
      setLoading(false)
    }
    load()
  }, [])

  const cards = [
    {
      href:    "/email/campaigns",
      icon:    Send,
      label:   "Campaigns",
      desc:    "Send one-time broadcasts to segments of your audience",
      stat:    stats?.lastCampaign
        ? `Last sent: ${stats.lastCampaign.name}`
        : "No campaigns yet",
    },
    {
      href:    "/email/automations",
      icon:    Zap,
      label:   "Automations",
      desc:    "Trigger emails on reader behavior: new subscriber, segment change, ad engagement",
      stat:    stats ? `${stats.activeAutomations} active` : "–",
    },
    {
      href:    "/subscribers",
      icon:    Users2,
      label:   "Subscribers",
      desc:    "View and manage your email list",
      stat:    stats ? `${stats.subscriberCount.toLocaleString()} subscribers` : "–",
    },
    {
      href:    "/email/settings",
      icon:    Settings,
      label:   "Email settings",
      desc:    "Configure Resend API key, sending domain, and from address",
      stat:    "",
    },
  ]

  return (
    <div className="p-6 max-w-3xl">
      <div className="flex items-center gap-2.5 mb-1">
        <Mail size={18} strokeWidth={1.5} className="text-[#111]" />
        <h1 className="text-[17px] font-semibold text-[#111]">Email</h1>
      </div>
      <p className="text-[13px] text-[#888] mb-6">
        Send campaigns and automations to your readers — pre-segmented by behavior.
      </p>

      {loading ? (
        <div className="text-[13px] text-[#bbb]">Loading…</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {cards.map(card => {
            const Icon = card.icon
            return (
              <Link
                key={card.href}
                href={card.href}
                className="group border border-[#ebebeb] rounded-lg p-4 bg-white hover:border-[#d0d0d0] transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Icon size={14} strokeWidth={1.5} className="text-[#999]" />
                    <span className="text-[13px] font-medium text-[#111]">{card.label}</span>
                  </div>
                  <ArrowRight size={12} className="text-[#ccc] group-hover:text-[#999] transition-colors" />
                </div>
                <p className="text-[12px] text-[#888] leading-relaxed mb-2">{card.desc}</p>
                {card.stat && (
                  <p className="text-[11px] text-[#bbb]">{card.stat}</p>
                )}
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
