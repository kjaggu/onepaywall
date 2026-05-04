// Dev-only script to generate an email verification URL for a test account.
// Usage: node scripts/dev-verify-email.mjs demo@onepaywall.test
import { neon } from "@neondatabase/serverless"
import crypto from "crypto"
import dotenv from "dotenv"
import { fileURLToPath } from "url"
import { dirname, join } from "path"

const __dirname = dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: join(__dirname, "../.env.local") })

const email = process.argv[2]
if (!email) { console.error("Usage: node scripts/dev-verify-email.mjs <email>"); process.exit(1) }

const sql = neon(process.env.DATABASE_URL)

const [user] = await sql`SELECT id FROM users WHERE email = ${email} LIMIT 1`
if (!user) { console.error("User not found:", email); process.exit(1) }

// Invalidate old tokens
await sql`DELETE FROM email_verification_tokens WHERE user_id = ${user.id}`

const token = crypto.randomBytes(32).toString("hex")
const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000)
await sql`INSERT INTO email_verification_tokens (token, user_id, expires_at) VALUES (${token}, ${user.id}, ${expiresAt})`

const url = `http://localhost:3000/api/auth/verify-email?token=${token}`
console.log("\n✅ Verification URL:\n" + url + "\n")
