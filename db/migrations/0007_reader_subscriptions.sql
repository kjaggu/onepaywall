-- Reader subscriptions for publisher monetization. Additive only.

ALTER TABLE "publisher_reader_plans" ADD COLUMN IF NOT EXISTS "monthly_razorpay_plan_id" text;
ALTER TABLE "publisher_reader_plans" ADD COLUMN IF NOT EXISTS "quarterly_razorpay_plan_id" text;
ALTER TABLE "publisher_reader_plans" ADD COLUMN IF NOT EXISTS "annual_razorpay_plan_id" text;
ALTER TABLE "publisher_reader_plans" ADD COLUMN IF NOT EXISTS "monthly_synced_price" integer;
ALTER TABLE "publisher_reader_plans" ADD COLUMN IF NOT EXISTS "quarterly_synced_price" integer;
ALTER TABLE "publisher_reader_plans" ADD COLUMN IF NOT EXISTS "annual_synced_price" integer;
ALTER TABLE "publisher_reader_plans" ADD COLUMN IF NOT EXISTS "monthly_synced_currency" text;
ALTER TABLE "publisher_reader_plans" ADD COLUMN IF NOT EXISTS "quarterly_synced_currency" text;
ALTER TABLE "publisher_reader_plans" ADD COLUMN IF NOT EXISTS "annual_synced_currency" text;
ALTER TABLE "publisher_reader_plans" ADD COLUMN IF NOT EXISTS "monthly_synced_pg_mode" "pg_mode";
ALTER TABLE "publisher_reader_plans" ADD COLUMN IF NOT EXISTS "quarterly_synced_pg_mode" "pg_mode";
ALTER TABLE "publisher_reader_plans" ADD COLUMN IF NOT EXISTS "annual_synced_pg_mode" "pg_mode";
ALTER TABLE "publisher_reader_plans" ADD COLUMN IF NOT EXISTS "monthly_synced_at" timestamp;
ALTER TABLE "publisher_reader_plans" ADD COLUMN IF NOT EXISTS "quarterly_synced_at" timestamp;
ALTER TABLE "publisher_reader_plans" ADD COLUMN IF NOT EXISTS "annual_synced_at" timestamp;
ALTER TABLE "publisher_reader_plans" ADD COLUMN IF NOT EXISTS "monthly_sync_error" text;
ALTER TABLE "publisher_reader_plans" ADD COLUMN IF NOT EXISTS "quarterly_sync_error" text;
ALTER TABLE "publisher_reader_plans" ADD COLUMN IF NOT EXISTS "annual_sync_error" text;

CREATE TABLE IF NOT EXISTS "reader_subscribers" (
  "id" text PRIMARY KEY DEFAULT gen_random_uuid(),
  "publisher_id" text NOT NULL REFERENCES "publishers"("id") ON DELETE cascade,
  "email_hash" text NOT NULL,
  "encrypted_email" text NOT NULL,
  "razorpay_customer_id" text,
  "active" boolean NOT NULL DEFAULT true,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS "reader_subscribers_publisher_email_idx"
  ON "reader_subscribers" ("publisher_id", "email_hash");
CREATE INDEX IF NOT EXISTS "reader_subscribers_publisher_idx"
  ON "reader_subscribers" ("publisher_id");

CREATE TABLE IF NOT EXISTS "reader_subscriptions" (
  "id" text PRIMARY KEY DEFAULT gen_random_uuid(),
  "publisher_id" text NOT NULL REFERENCES "publishers"("id") ON DELETE cascade,
  "subscriber_id" text NOT NULL REFERENCES "reader_subscribers"("id") ON DELETE cascade,
  "interval" text NOT NULL,
  "status" text NOT NULL DEFAULT 'created',
  "pg_mode" "pg_mode" NOT NULL,
  "razorpay_subscription_id" text NOT NULL,
  "razorpay_plan_id" text NOT NULL,
  "current_period_start" timestamp,
  "current_period_end" timestamp,
  "cancelled_at" timestamp,
  "cancel_at_cycle_end" boolean NOT NULL DEFAULT false,
  "dunning_started_at" timestamp,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS "reader_subscriptions_razorpay_idx"
  ON "reader_subscriptions" ("razorpay_subscription_id");
CREATE INDEX IF NOT EXISTS "reader_subscriptions_publisher_idx"
  ON "reader_subscriptions" ("publisher_id");
CREATE INDEX IF NOT EXISTS "reader_subscriptions_subscriber_idx"
  ON "reader_subscriptions" ("subscriber_id");
CREATE INDEX IF NOT EXISTS "reader_subscriptions_status_idx"
  ON "reader_subscriptions" ("status");

CREATE TABLE IF NOT EXISTS "reader_subscription_links" (
  "id" text PRIMARY KEY DEFAULT gen_random_uuid(),
  "publisher_id" text NOT NULL REFERENCES "publishers"("id") ON DELETE cascade,
  "subscriber_id" text NOT NULL REFERENCES "reader_subscribers"("id") ON DELETE cascade,
  "reader_id" text NOT NULL REFERENCES "readers"("id") ON DELETE cascade,
  "created_at" timestamp NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS "reader_subscription_links_reader_publisher_idx"
  ON "reader_subscription_links" ("reader_id", "publisher_id");
CREATE INDEX IF NOT EXISTS "reader_subscription_links_subscriber_idx"
  ON "reader_subscription_links" ("subscriber_id");

CREATE TABLE IF NOT EXISTS "reader_subscription_magic_links" (
  "token" text PRIMARY KEY,
  "publisher_id" text NOT NULL REFERENCES "publishers"("id") ON DELETE cascade,
  "subscriber_id" text NOT NULL REFERENCES "reader_subscribers"("id") ON DELETE cascade,
  "return_url" text,
  "expires_at" timestamp NOT NULL,
  "used_at" timestamp,
  "created_at" timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "reader_subscription_magic_links_subscriber_idx"
  ON "reader_subscription_magic_links" ("subscriber_id");
CREATE INDEX IF NOT EXISTS "reader_subscription_magic_links_expires_idx"
  ON "reader_subscription_magic_links" ("expires_at");
