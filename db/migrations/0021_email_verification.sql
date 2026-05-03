-- Add email_verified_at to users
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMP;

-- Mark all existing users as verified so they aren't locked out
UPDATE users SET email_verified_at = created_at WHERE email_verified_at IS NULL;

-- Token table for email verification links (same pattern as password_reset_tokens)
CREATE TABLE IF NOT EXISTS email_verification_tokens (
  token      TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TIMESTAMP NOT NULL,
  used_at    TIMESTAMP
);

CREATE INDEX IF NOT EXISTS evt_user_idx ON email_verification_tokens(user_id);
