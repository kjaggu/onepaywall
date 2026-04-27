-- @no-transaction
-- This migration uses ALTER TYPE ... ADD VALUE which Postgres forbids inside a
-- transaction block. The runner therefore applies it without wrapping. All
-- statements below must be individually idempotent.

-- Razorpay's plan_id mapping per OnePaywall plan tier. Populated by
-- scripts/seed-plans.mjs from RAZORPAY_PLATFORM_PLAN_* env vars.
ALTER TABLE "plans" ADD COLUMN IF NOT EXISTS "razorpay_plan_id" text;

-- Soft-cancel: keep the subscription active until current_period_end, then stop.
ALTER TABLE "subscriptions" ADD COLUMN IF NOT EXISTS "cancel_at_cycle_end" boolean NOT NULL DEFAULT false;

-- Tracks when a payment failure first put the publisher into past_due state, so
-- we know when the 7-day soft-suspension grace period started.
ALTER TABLE "subscriptions" ADD COLUMN IF NOT EXISTS "dunning_started_at" timestamp;

-- 'suspended' = past_due > 7 days; gates stop serving until publisher resolves payment.
ALTER TYPE "sub_status" ADD VALUE IF NOT EXISTS 'suspended';
