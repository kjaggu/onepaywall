export default function DigitalProductsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="p-8 max-w-5xl">
      <div className="mb-6">
        <h1 className="text-h1 text-[var(--color-text)]">Digital Products</h1>
        <p className="text-body-sm text-[var(--color-text-secondary)] mt-1">
          Sell e-books, reports, and downloads directly through your gates.
        </p>
      </div>
      {children}
    </div>
  )
}
