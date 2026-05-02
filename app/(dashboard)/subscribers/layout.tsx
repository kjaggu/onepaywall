import { Tabs, type TabItem } from "@/components/dashboard/tabs"

const tabs: TabItem[] = [
  { label: "Subscriptions", href: "/subscribers",        exact: true },
  { label: "Leads",         href: "/subscribers/leads" },
]

export default function SubscribersLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ padding: "28px 32px" }}>
      <div style={{ marginBottom: 22 }}>
        <h1 style={{ fontSize: 20, fontWeight: 600, color: "#111" }}>Subscribers</h1>
        <p style={{ fontSize: 12, color: "#aaa", marginTop: 2 }}>All readers who have subscribed or submitted their email through a gate.</p>
      </div>

      <div style={{ marginBottom: 20 }}>
        <Tabs items={tabs} />
      </div>

      {children}
    </div>
  )
}
