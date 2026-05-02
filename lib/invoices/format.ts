import type { InvoiceRow } from "@/lib/db/queries/invoices"

function fmtAmount(paise: number, currency: string): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(paise / 100)
}

function fmtDate(d: Date): string {
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })
}

const TYPE_LABELS: Record<string, string> = {
  subscription:    "Reader Subscription",
  one_time_unlock: "Article Unlock",
}

export function renderInvoiceHtml(inv: InvoiceRow): string {
  const amount    = fmtAmount(inv.amount, inv.currency)
  const date      = fmtDate(inv.issuedAt)
  const typeLabel = TYPE_LABELS[inv.type] ?? inv.type
  const buyer     = inv.readerEmail ?? "Anonymous Reader"

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${inv.invoiceRef} — ${inv.publisherName}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; font-size: 14px; color: #111; background: #fff; padding: 0; }
    .page { max-width: 720px; margin: 0 auto; padding: 56px 64px; }

    /* Header */
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 48px; }
    .publisher-name { font-size: 20px; font-weight: 700; color: #111; }
    .publisher-sub { font-size: 12px; color: #888; margin-top: 3px; }
    .inv-badge { text-align: right; }
    .inv-label { font-size: 11px; color: #999; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 4px; }
    .inv-number { font-size: 18px; font-weight: 700; color: #111; letter-spacing: -0.02em; }
    .inv-date { font-size: 12px; color: #888; margin-top: 4px; }

    /* Divider */
    hr { border: none; border-top: 1px solid #ebebeb; margin: 0 0 32px 0; }

    /* Billed to / from */
    .parties { display: flex; gap: 48px; margin-bottom: 40px; }
    .party-block { flex: 1; }
    .party-label { font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; color: #aaa; margin-bottom: 8px; }
    .party-name { font-size: 14px; font-weight: 600; color: #111; }
    .party-detail { font-size: 12px; color: #666; margin-top: 2px; }

    /* Line items */
    .table { width: 100%; border-collapse: collapse; margin-bottom: 32px; }
    .table th { font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; color: #aaa; text-align: left; padding: 0 0 10px 0; border-bottom: 1px solid #ebebeb; }
    .table th.right, .table td.right { text-align: right; }
    .table td { padding: 14px 0; border-bottom: 1px solid #f5f5f5; font-size: 13px; color: #333; vertical-align: top; }
    .table td.desc-main { font-weight: 500; color: #111; margin-bottom: 3px; }
    .table .sub { font-size: 11px; color: #aaa; margin-top: 3px; font-family: monospace; word-break: break-all; }

    /* Totals */
    .totals { display: flex; justify-content: flex-end; margin-bottom: 40px; }
    .totals-block { min-width: 220px; }
    .total-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 13px; color: #555; }
    .total-row.grand { border-top: 1px solid #111; margin-top: 8px; padding-top: 12px; font-size: 16px; font-weight: 700; color: #111; }

    /* Footer */
    .footer { border-top: 1px solid #ebebeb; padding-top: 24px; display: flex; justify-content: space-between; align-items: center; }
    .footer-note { font-size: 11px; color: #aaa; line-height: 1.6; }
    .footer-brand { font-size: 11px; color: #ccc; }

    @media print {
      body { padding: 0; }
      .page { padding: 40px; }
    }
  </style>
</head>
<body>
  <div class="page">

    <div class="header">
      <div>
        <div class="publisher-name">${escHtml(inv.publisherName)}</div>
        <div class="publisher-sub">Issued via OnePaywall</div>
      </div>
      <div class="inv-badge">
        <div class="inv-label">Tax Invoice</div>
        <div class="inv-number">${escHtml(inv.invoiceRef)}</div>
        <div class="inv-date">${date}</div>
      </div>
    </div>

    <hr />

    <div class="parties">
      <div class="party-block">
        <div class="party-label">From</div>
        <div class="party-name">${escHtml(inv.publisherName)}</div>
        ${inv.domainHost ? `<div class="party-detail">${escHtml(inv.domainHost)}</div>` : ""}
      </div>
      <div class="party-block">
        <div class="party-label">Billed To</div>
        <div class="party-name">${escHtml(buyer)}</div>
      </div>
    </div>

    <table class="table">
      <thead>
        <tr>
          <th>Description</th>
          <th class="right">Amount</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>
            <div class="desc-main">${escHtml(typeLabel)}</div>
            ${inv.contentUrl ? `<div class="sub">${escHtml(truncate(inv.contentUrl, 80))}</div>` : ""}
            ${inv.razorpayPaymentId ? `<div class="sub">Payment ref: ${escHtml(inv.razorpayPaymentId)}</div>` : ""}
          </td>
          <td class="right">${escHtml(amount)}</td>
        </tr>
      </tbody>
    </table>

    <div class="totals">
      <div class="totals-block">
        <div class="total-row grand">
          <span>Total</span>
          <span>${escHtml(amount)}</span>
        </div>
        <div class="total-row" style="color:#aaa; font-size:11px; margin-top:4px;">
          <span>Status</span>
          <span>Paid</span>
        </div>
      </div>
    </div>

    <div class="footer">
      <div class="footer-note">
        This is a system-generated invoice. For queries contact ${escHtml(inv.publisherName)}.
      </div>
      <div class="footer-brand">Powered by OnePaywall</div>
    </div>

  </div>
</body>
</html>`
}

function escHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

function truncate(s: string, n: number): string {
  return s.length > n ? s.slice(0, n) + "…" : s
}
