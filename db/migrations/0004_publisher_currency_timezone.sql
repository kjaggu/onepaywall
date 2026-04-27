ALTER TABLE "publishers" ADD COLUMN IF NOT EXISTS "currency" text NOT NULL DEFAULT 'INR';
ALTER TABLE "publishers" ADD COLUMN IF NOT EXISTS "timezone" text NOT NULL DEFAULT 'Asia/Kolkata';
