import { SectionRail, type RailItem } from "@/components/dashboard/section-rail"

const items: RailItem[] = [
  { kind: "link", label: "General",          href: "/settings/general" },
  { kind: "link", label: "Plan & billing",   href: "/settings/billing" },
  { kind: "link", label: "Payment gateway",  href: "/settings/payment-gateway" },
  { kind: "link", label: "Team",             href: "/settings/team" },
  { kind: "link", label: "Webhooks",         href: "/settings/webhooks" },
  { kind: "link", label: "Notifications",    href: "/settings/notifications" },
  { kind: "divider" },
  { kind: "link", label: "Danger zone",      href: "/settings/danger" },
]

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-full">
      <SectionRail items={items} width={196} />
      <div className="flex-1 overflow-y-auto">
        {children}
      </div>
    </div>
  )
}
