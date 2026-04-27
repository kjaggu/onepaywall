import Script from "next/script"

export default async function EmbedTestPage({
  searchParams,
}: {
  searchParams: Promise<{ siteKey?: string }>
}) {
  const { siteKey } = await searchParams

  if (!siteKey) {
    return (
      <div style={{ fontFamily: "system-ui, sans-serif", padding: "48px", color: "#666" }}>
        Missing <code>?siteKey=</code> — open this page from the gate detail screen.
      </div>
    )
  }

  return (
    <>
      <Script
        src="/embed/embed.js"
        data-site-key={siteKey}
        data-api-base=""
        data-preview="1"
        strategy="afterInteractive"
      />

      <div style={{
        fontFamily: "Georgia, 'Times New Roman', serif",
        maxWidth: "680px",
        margin: "0 auto",
        padding: "48px 24px",
        color: "#111",
        lineHeight: "1.7",
      }}>
        {/* Test banner */}
        <div style={{
          background: "#fffbeb",
          border: "1px solid #fcd34d",
          borderRadius: "8px",
          padding: "10px 16px",
          marginBottom: "40px",
          fontSize: "13px",
          color: "#92400e",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          fontFamily: "system-ui, sans-serif",
        }}>
          <span>⚗️</span>
          <span>Gate preview — triggers fire immediately regardless of visit count. Close this tab when done.</span>
        </div>

        {/* Publication header */}
        <div style={{
          borderBottom: "1px solid #e5e7eb",
          paddingBottom: "20px",
          marginBottom: "32px",
          fontFamily: "system-ui, sans-serif",
        }}>
          <span style={{ fontWeight: 700, fontSize: "15px", letterSpacing: "-0.01em" }}>The Daily Bulletin</span>
        </div>

        {/* Article */}
        <p style={{ fontSize: "13px", color: "#9ca3af", fontFamily: "system-ui, sans-serif", marginBottom: "12px" }}>
          TECHNOLOGY · 4 min read
        </p>

        <h1 style={{ fontSize: "32px", fontWeight: 700, lineHeight: "1.2", marginBottom: "16px", letterSpacing: "-0.02em" }}>
          The quiet revolution reshaping how readers pay for news
        </h1>

        <p style={{ fontSize: "16px", color: "#6b7280", marginBottom: "32px", fontStyle: "italic" }}>
          Publishers are discovering that intelligent gating — not hard paywalls — keeps readers coming back.
        </p>

        <p>
          For most of the last decade, digital publishers faced an uncomfortable choice: give content away for free
          and hope advertising revenue would follow, or lock everything behind a hard paywall and watch casual readers
          disappear. Neither strategy proved satisfying.
        </p>

        <p style={{ marginTop: "20px" }}>
          The hard paywall converts a sliver of readers into subscribers while quietly turning away the rest.
          Free-with-ads keeps the lights on but hollows out editorial ambitions. Between these two extremes,
          a subtler approach has been gaining ground — one that treats each reader as an individual rather
          than a unit of inventory.
        </p>

        <p style={{ marginTop: "20px" }}>
          &ldquo;We used to think of monetisation as a switch,&rdquo; says one editor at a mid-sized regional
          outlet that recently piloted metered gating. &ldquo;Either the content is free or it isn&apos;t.
          The shift is realising that the gate itself is a reader experience, not just a revenue mechanism.&rdquo;
        </p>

        <p style={{ marginTop: "20px" }}>
          Early data suggests readers who encounter a thoughtfully designed gate — one that offers a genuine
          choice between a small payment, an ad view, or a newsletter sign-up — churn at rates significantly
          lower than those pushed straight to a subscription page.
        </p>

        <p style={{ marginTop: "20px" }}>
          The economics are straightforward: a reader who pays fifty rupees to unlock a single article is
          worth less in isolation than a subscriber, but the cumulative signal — which articles they unlock,
          how often they return, how far they scroll — is worth considerably more in aggregate.
        </p>
      </div>
    </>
  )
}
