import Link from "next/link"

const sections = [
  {
    title: "Publisher",
    rows: [
      { label: "General — name, currency & timezone", href: "/settings/general" },
      { label: "Plan & billing", href: "/settings/billing" },
      { label: "Billing email", href: null },
    ],
  },
  {
    title: "Domains",
    rows: [
      { label: "Manage domains", href: "/domains" },
      { label: "Embed snippet", href: null },
    ],
  },
  {
    title: "Team",
    rows: [
      { label: "Members", href: null },
      { label: "Roles & permissions", href: null },
      { label: "Invite a member", href: null },
    ],
  },
  {
    title: "Integrations",
    rows: [
      { label: "Payment gateway", href: "/settings/payment-gateway" },
      { label: "Ad networks", href: null },
      { label: "Webhook endpoints", href: null },
    ],
  },
]

export default function SettingsPage() {
  return (
    <div style={{ padding: "28px 32px" }}>
      <div style={{ marginBottom: 22 }}>
        <h1 style={{ fontSize: 20, fontWeight: 600, color: "#111" }}>Settings</h1>
        <p style={{ fontSize: 12, color: "#aaa", marginTop: 2 }}>Manage your publisher account, team, and integrations.</p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {sections.map((section) => (
          <div key={section.title} style={{ border: "1px solid #ebebeb", borderRadius: 8, overflow: "hidden" }}>
            <div style={{ padding: "11px 18px", borderBottom: "1px solid #ebebeb", fontSize: 11, fontWeight: 600, color: "#aaa", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              {section.title}
            </div>
            {section.rows.map((row, i) => {
              const inner = (
                <div
                  style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "11px 18px", borderBottom: i < section.rows.length - 1 ? "1px solid #f5f5f5" : "none", cursor: row.href ? "pointer" : "default" }}
                  className={row.href ? "hover:bg-[#fafafa] transition-colors duration-100" : ""}
                >
                  <span style={{ fontSize: 13, color: "#333" }}>{row.label}</span>
                  {row.href && <span style={{ fontSize: 12, color: "#ccc" }}>→</span>}
                </div>
              )
              return row.href
                ? <Link key={row.label} href={row.href} className="block">{inner}</Link>
                : <div key={row.label}>{inner}</div>
            })}
          </div>
        ))}
      </div>
    </div>
  )
}
