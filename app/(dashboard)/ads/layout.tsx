import { Tabs, type TabItem } from "@/components/dashboard/tabs"

const tabs: TabItem[] = [
  { label: "Library",   href: "/ads",           exact: true },
  { label: "Analytics", href: "/ads/analytics" },
  { label: "Networks",  href: "/ads/networks" },
  { label: "Settings",  href: "/ads/settings" },
]

export default function AdsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="p-8 max-w-5xl">
      <div className="mb-6">
        <h1 className="text-h1 text-[var(--color-text)]">Ads</h1>
        <p className="text-body-sm text-[var(--color-text-secondary)] mt-1">
          Upload ad creatives shown inside your gates, and connect ad networks for fill.
        </p>
      </div>

      <div className="mb-6">
        <Tabs items={tabs} />
      </div>

      {children}
    </div>
  )
}
