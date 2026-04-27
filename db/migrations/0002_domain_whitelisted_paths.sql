ALTER TABLE "domains" ADD COLUMN IF NOT EXISTS "whitelisted_paths" jsonb NOT NULL DEFAULT '[]'::jsonb;
