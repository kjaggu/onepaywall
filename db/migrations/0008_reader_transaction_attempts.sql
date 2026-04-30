-- Payment-attempt ledger fields for pending/completed/failed reader revenue.

ALTER TABLE "reader_transactions" ADD COLUMN IF NOT EXISTS "razorpay_subscription_id" text;
ALTER TABLE "reader_transactions" ADD COLUMN IF NOT EXISTS "reader_email_hash" text;
ALTER TABLE "reader_transactions" ADD COLUMN IF NOT EXISTS "encrypted_reader_email" text;
ALTER TABLE "reader_transactions" ADD COLUMN IF NOT EXISTS "failure_reason" text;
ALTER TABLE "reader_transactions" ADD COLUMN IF NOT EXISTS "updated_at" timestamp NOT NULL DEFAULT now();
ALTER TABLE "reader_transactions" ADD COLUMN IF NOT EXISTS "completed_at" timestamp;

CREATE INDEX IF NOT EXISTS "reader_transactions_status_idx"
  ON "reader_transactions" ("status");
CREATE INDEX IF NOT EXISTS "reader_transactions_payment_idx"
  ON "reader_transactions" ("razorpay_payment_id");
CREATE INDEX IF NOT EXISTS "reader_transactions_order_idx"
  ON "reader_transactions" ("razorpay_order_id");
CREATE INDEX IF NOT EXISTS "reader_transactions_subscription_idx"
  ON "reader_transactions" ("razorpay_subscription_id");
