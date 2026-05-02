import { and, eq } from "drizzle-orm"
import { db } from "@/lib/db/client"
import { publisherWebhooks } from "@/lib/db/schema"

type LeadPayload = {
  email: string
  name?: string | null
  publisherId: string
  capturedAt: string
}

export async function fireLeadWebhooks(publisherId: string, payload: LeadPayload): Promise<void> {
  const hooks = await db
    .select({ url: publisherWebhooks.url })
    .from(publisherWebhooks)
    .where(and(
      eq(publisherWebhooks.publisherId, publisherId),
      eq(publisherWebhooks.event, "lead_captured"),
      eq(publisherWebhooks.active, true),
    ))

  if (hooks.length === 0) return

  const body = JSON.stringify(payload)
  await Promise.allSettled(
    hooks.map(h =>
      fetch(h.url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
        signal: AbortSignal.timeout(8000),
      }).catch(() => {/* fire-and-forget — errors silently dropped */})
    )
  )
}
