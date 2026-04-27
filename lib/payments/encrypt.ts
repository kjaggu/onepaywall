import { createCipheriv, createDecipheriv, randomBytes } from "crypto"

const ALGO = "aes-256-gcm"

function getKey(): Buffer {
  const hex = process.env.PG_ENCRYPTION_KEY ?? ""
  if (hex.length !== 64) throw new Error("PG_ENCRYPTION_KEY must be a 64-char hex string")
  return Buffer.from(hex, "hex")
}

// Returns hex string: iv(12) + authTag(16) + ciphertext
export function encrypt(plaintext: string): string {
  const key = getKey()
  const iv = randomBytes(12)
  const cipher = createCipheriv(ALGO, key, iv)
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()])
  const tag = cipher.getAuthTag()
  return Buffer.concat([iv, tag, encrypted]).toString("hex")
}

export function decrypt(hex: string): string {
  const key = getKey()
  const buf = Buffer.from(hex, "hex")
  const iv = buf.subarray(0, 12)
  const tag = buf.subarray(12, 28)
  const ciphertext = buf.subarray(28)
  const decipher = createDecipheriv(ALGO, key, iv)
  decipher.setAuthTag(tag)
  return decipher.update(ciphertext).toString("utf8") + decipher.final("utf8")
}
