import { createHash } from "crypto"

// Server-side fingerprint — derived from client-supplied stable ID + normalised UA.
// Deliberately excludes IP to avoid quasi-PII. The clientId (random UUID from
// localStorage) provides cross-session stability without tracking real identity.
export function computeFingerprint(clientId: string, userAgent: string): string {
  const ua = userAgent.replace(/\s+/g, " ").substring(0, 300)
  return createHash("sha256").update(`${clientId}:${ua}`).digest("hex").substring(0, 40)
}

export function generateToken(): string {
  return createHash("sha256")
    .update(`${Date.now()}:${Math.random()}`)
    .digest("hex")
}
