import { resolveDecryptedConfig } from "@/lib/db/queries/pg-configs"

// Always call this — never hardcode which keys to use
export async function resolveConfig(publisherId: string) {
  return resolveDecryptedConfig(publisherId)
}
