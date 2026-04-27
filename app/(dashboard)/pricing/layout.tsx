import { Tabs, type TabItem } from "@/components/dashboard/tabs"

const tabs: TabItem[] = [
  { label: "Subscriptions",  href: "/pricing", exact: true },
  { label: "Article unlock", href: "/pricing/article-unlock" },
]

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="p-8 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-h1 text-[var(--color-text)]">Pricing</h1>
        <p className="text-body-sm text-[var(--color-text-secondary)] mt-1">
          Set what readers pay you — subscriptions and per-article unlocks.
        </p>
      </div>

      <div className="mb-6">
        <Tabs items={tabs} />
      </div>

      {children}
    </div>
  )
}
