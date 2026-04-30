import { resolveDecryptedConfig, resolveDecryptedConfigByPublisher } from "@/lib/db/queries/pg-configs"

// Always call this — never hardcode which keys to use.
// Provide brandId when available (embed flows, brand-scoped operations).
// Falls back to publisher-level lookup (webhooks, legacy callers).
export async function resolveConfig(publisherId: string, brandId?: string | null) {
  if (brandId) return resolveDecryptedConfig(brandId, publisherId)
  return resolveDecryptedConfigByPublisher(publisherId)
}
