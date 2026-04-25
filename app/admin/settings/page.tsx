"use client"

import { useState } from "react"

const SUPERADMINS = [
  { name: "Jagadeesh K",  email: "jagadeeshk@outlook.com", role: "superadmin", added: "1 Feb 2026", self: true  },
]

export default function AdminSettingsPage() {
  const [emailNotifs, setEmailNotifs] = useState(true)
  const [slackNotifs, setSlackNotifs] = useState(false)
  const [maintenanceMode, setMaintenanceMode] = useState(false)

  return (
    <div style={{ padding: "28px 32px" }}>
      <div style={{ marginBottom: 22 }}>
        <h1 style={{ fontSize: 20, fontWeight: 600, color: "#111" }}>Settings</h1>
        <p style={{ fontSize: 12, color: "#aaa", marginTop: 2 }}>Platform configuration and superadmin management</p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 14, maxWidth: 720 }}>

        {/* Superadmins */}
        <div style={{ border: "1px solid #ebebeb", borderRadius: 8, overflow: "hidden" }}>
          <div style={{ padding: "14px 18px", borderBottom: "1px solid #ebebeb", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#111" }}>Superadmins</div>
              <div style={{ fontSize: 11, color: "#aaa", marginTop: 2 }}>Full platform access · can manage publishers, plans, and billing</div>
            </div>
            <button style={{ padding: "6px 12px", borderRadius: 6, background: "#111", color: "#fff", border: "none", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
              + Add admin
            </button>
          </div>
          {SUPERADMINS.map((a, i) => (
            <div key={a.email} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 18px", borderBottom: i < SUPERADMINS.length - 1 ? "1px solid #f5f5f5" : "none", background: "#fff" }}>
              <div style={{ width: 30, height: 30, borderRadius: "50%", background: "#27adb0", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: "#fff" }}>{a.name[0]}</span>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: "#111", display: "flex", alignItems: "center", gap: 6 }}>
                  {a.name}
                  {a.self && <span style={{ fontSize: 10, color: "#aaa" }}>you</span>}
                </div>
                <div style={{ fontSize: 11, color: "#aaa", marginTop: 1 }}>{a.email}</div>
              </div>
              <div style={{ fontSize: 11, color: "#ccc" }}>added {a.added}</div>
              <span style={{ padding: "2px 7px", borderRadius: 3, background: "#faf5ff", color: "#6b21a8", fontSize: 10, fontWeight: 500 }}>{a.role}</span>
            </div>
          ))}
        </div>

        {/* Platform config */}
        <div style={{ border: "1px solid #ebebeb", borderRadius: 8, overflow: "hidden" }}>
          <div style={{ padding: "14px 18px", borderBottom: "1px solid #ebebeb" }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#111" }}>Platform</div>
            <div style={{ fontSize: 11, color: "#aaa", marginTop: 2 }}>Global configuration for all publishers</div>
          </div>

          <Row label="Trial duration" sub="Days before trial auto-converts to Lite">
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <input defaultValue="30" style={{ width: 52, border: "1px solid #e5e5e5", borderRadius: 5, padding: "4px 8px", fontSize: 13, color: "#111", fontFamily: "inherit", textAlign: "center" }} />
              <span style={{ fontSize: 12, color: "#aaa" }}>days</span>
            </div>
          </Row>

          <Row label="Maintenance mode" sub="All embed endpoints return cached fallback, no gates shown">
            <Toggle value={maintenanceMode} onChange={setMaintenanceMode} danger />
          </Row>

          <Row label="SDK version (latest)" sub="Pushed to all new installations" last>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 12, fontFamily: "monospace", color: "#333" }}>2.4.1</span>
              <button style={{ padding: "4px 10px", borderRadius: 5, border: "1px solid #e5e5e5", background: "#fff", fontSize: 11, fontWeight: 500, color: "#555", cursor: "pointer", fontFamily: "inherit" }}>Manage</button>
            </div>
          </Row>
        </div>

        {/* Notifications */}
        <div style={{ border: "1px solid #ebebeb", borderRadius: 8, overflow: "hidden" }}>
          <div style={{ padding: "14px 18px", borderBottom: "1px solid #ebebeb" }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#111" }}>Notifications</div>
            <div style={{ fontSize: 11, color: "#aaa", marginTop: 2 }}>Alerts sent to the superadmin team</div>
          </div>

          <Row label="Email alerts" sub="Payment failures, domain down, plan changes">
            <Toggle value={emailNotifs} onChange={setEmailNotifs} />
          </Row>

          <Row label="Slack alerts" sub="Connect a webhook for real-time ops alerts" last>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Toggle value={slackNotifs} onChange={setSlackNotifs} />
              {slackNotifs && (
                <input placeholder="https://hooks.slack.com/…" style={{ border: "1px solid #e5e5e5", borderRadius: 5, padding: "4px 10px", fontSize: 12, color: "#333", fontFamily: "inherit", width: 240 }} />
              )}
            </div>
          </Row>
        </div>

        {/* Billing / Razorpay */}
        <div style={{ border: "1px solid #ebebeb", borderRadius: 8, overflow: "hidden" }}>
          <div style={{ padding: "14px 18px", borderBottom: "1px solid #ebebeb" }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#111" }}>Billing integration</div>
            <div style={{ fontSize: 11, color: "#aaa", marginTop: 2 }}>Razorpay platform keys for OnePaywall subscription billing</div>
          </div>

          <Row label="Razorpay Key ID" sub="Live mode key for platform subscriptions">
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 12, fontFamily: "monospace", color: "#555" }}>rzp_live_••••••••7f9a</span>
              <button style={{ padding: "4px 10px", borderRadius: 5, border: "1px solid #e5e5e5", background: "#fff", fontSize: 11, fontWeight: 500, color: "#555", cursor: "pointer", fontFamily: "inherit" }}>Rotate</button>
            </div>
          </Row>

          <Row label="Webhook secret" sub="Validates incoming Razorpay payment events" last>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 12, fontFamily: "monospace", color: "#555" }}>whsec_••••••••••••</span>
              <button style={{ padding: "4px 10px", borderRadius: 5, border: "1px solid #e5e5e5", background: "#fff", fontSize: 11, fontWeight: 500, color: "#555", cursor: "pointer", fontFamily: "inherit" }}>Rotate</button>
            </div>
          </Row>
        </div>

      </div>
    </div>
  )
}

function Row({ label, sub, children, last }: { label: string; sub: string; children: React.ReactNode; last?: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "13px 18px", borderBottom: last ? "none" : "1px solid #f5f5f5", gap: 16, background: "#fff" }}>
      <div>
        <div style={{ fontSize: 13, fontWeight: 500, color: "#111" }}>{label}</div>
        <div style={{ fontSize: 11, color: "#aaa", marginTop: 2 }}>{sub}</div>
      </div>
      {children}
    </div>
  )
}

function Toggle({ value, onChange, danger }: { value: boolean; onChange: (v: boolean) => void; danger?: boolean }) {
  const active = danger ? "#c0392b" : "#27adb0"
  return (
    <button onClick={() => onChange(!value)}
      style={{ width: 36, height: 20, borderRadius: 10, background: value ? active : "#e0e0e0", border: "none", cursor: "pointer", position: "relative", transition: "background 0.15s", flexShrink: 0 }}>
      <span style={{ position: "absolute", top: 2, left: value ? 18 : 2, width: 16, height: 16, borderRadius: "50%", background: "#fff", transition: "left 0.15s", boxShadow: "0 1px 3px rgba(0,0,0,0.15)" }} />
    </button>
  )
}
