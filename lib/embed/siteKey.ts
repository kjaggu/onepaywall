import { randomBytes } from "crypto"

export function generateSiteKey(): string {
  return "opw_" + randomBytes(20).toString("hex")
}
