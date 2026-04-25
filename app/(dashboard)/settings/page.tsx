export default function SettingsPage() {
  const sections = [
    {
      title: "Publisher",
      rows: ["Organisation name", "Billing email", "Plan & billing"],
    },
    {
      title: "Domains",
      rows: ["Manage domains", "Site keys", "Embed snippet"],
    },
    {
      title: "Team",
      rows: ["Members", "Roles & permissions", "Invite a member"],
    },
    {
      title: "Integrations",
      rows: ["Payment gateway", "Ad networks", "Webhook endpoints"],
    },
  ]

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
            {section.rows.map((row, i) => (
              <div
                key={row}
                style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "11px 18px", borderBottom: i < section.rows.length - 1 ? "1px solid #f5f5f5" : "none", cursor: "pointer" }}
                className="hover:bg-[#fafafa] transition-colors duration-100"
              >
                <span style={{ fontSize: 13, color: "#333" }}>{row}</span>
                <span style={{ fontSize: 12, color: "#ccc" }}>→</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
