-- Add 'manual' to pg_mode enum
ALTER TYPE pg_mode ADD VALUE IF NOT EXISTS 'manual';

-- Make razorpay fields nullable for manual subscriptions
ALTER TABLE reader_subscriptions ALTER COLUMN razorpay_subscription_id DROP NOT NULL;
ALTER TABLE reader_subscriptions ALTER COLUMN razorpay_plan_id DROP NOT NULL;

-- Replace unique index with partial unique (only enforce for Razorpay subscriptions)
DROP INDEX IF EXISTS reader_subscriptions_razorpay_idx;
CREATE UNIQUE INDEX IF NOT EXISTS reader_subscriptions_razorpay_unique_idx
  ON reader_subscriptions(razorpay_subscription_id)
  WHERE razorpay_subscription_id IS NOT NULL;

-- Track subscription source (razorpay or manual)
ALTER TABLE reader_subscriptions ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'razorpay';

-- Payment method: upi / netbanking / card (Razorpay) or cash / bank_transfer / complimentary (manual)
ALTER TABLE reader_subscriptions ADD COLUMN IF NOT EXISTS payment_method TEXT;

-- Publisher notes on manual subscriptions
ALTER TABLE reader_subscriptions ADD COLUMN IF NOT EXISTS notes TEXT;
