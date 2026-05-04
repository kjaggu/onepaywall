import { Tabs, type TabItem } from "@/components/dashboard/tabs"

const tabs: TabItem[] = [
  { label: "Overview",    href: "/email",             exact: true },
  { label: "Campaigns",  href: "/email/campaigns"   },
  { label: "Automations", href: "/email/automations" },
  { label: "Settings",   href: "/email/settings"    },
]

export default function EmailLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ padding: "28px 32px" }}>
      <div style={{ marginBottom: 22 }}>
        <h1 style={{ fontSize: 20, fontWeight: 600, color: "#111" }}>Email</h1>
        <p style={{ fontSize: 12, color: "#aaa", marginTop: 2 }}>Send campaigns and automate emails to your subscribers.</p>
      </div>

      <div style={{ marginBottom: 20 }}>
        <Tabs items={tabs} />
      </div>

      {children}
    </div>
  )
}
