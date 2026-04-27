-- Publisher reader subscription + unlock plans
CREATE TABLE IF NOT EXISTS "publisher_reader_plans" (
  "id"                    text PRIMARY KEY DEFAULT gen_random_uuid(),
  "publisher_id"          text NOT NULL REFERENCES "publishers"("id") ON DELETE CASCADE,
  "currency"              text NOT NULL DEFAULT 'INR',
  "monthly_price"         integer,
  "quarterly_price"       integer,
  "annual_price"          integer,
  "subs_enabled"          boolean NOT NULL DEFAULT false,
  "default_unlock_price"  integer,
  "unlock_enabled"        boolean NOT NULL DEFAULT false,
  "created_at"            timestamp NOT NULL DEFAULT now(),
  "updated_at"            timestamp NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS "publisher_reader_plans_publisher_idx" ON "publisher_reader_plans"("publisher_id");

-- Per-URL content price overrides
CREATE TABLE IF NOT EXISTS "publisher_content_prices" (
  "id"            text PRIMARY KEY DEFAULT gen_random_uuid(),
  "publisher_id"  text NOT NULL REFERENCES "publishers"("id") ON DELETE CASCADE,
  "url_pattern"   text NOT NULL,
  "price"         integer NOT NULL,
  "label"         text,
  "created_at"    timestamp NOT NULL DEFAULT now(),
  "updated_at"    timestamp NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "publisher_content_prices_publisher_idx" ON "publisher_content_prices"("publisher_id");

-- Transaction type and status enums
DO $$ BEGIN
  CREATE TYPE "transaction_type" AS ENUM ('subscription', 'one_time_unlock');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "transaction_status" AS ENUM ('pending', 'completed', 'refunded', 'failed');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Reader revenue transactions
CREATE TABLE IF NOT EXISTS "reader_transactions" (
  "id"                   text PRIMARY KEY DEFAULT gen_random_uuid(),
  "publisher_id"         text NOT NULL REFERENCES "publishers"("id") ON DELETE CASCADE,
  "domain_id"            text REFERENCES "domains"("id") ON DELETE SET NULL,
  "reader_id"            text REFERENCES "readers"("id") ON DELETE SET NULL,
  "type"                 "transaction_type" NOT NULL,
  "status"               "transaction_status" NOT NULL DEFAULT 'completed',
  "amount"               integer NOT NULL,
  "currency"             text NOT NULL DEFAULT 'INR',
  "razorpay_payment_id"  text,
  "razorpay_order_id"    text,
  "content_url"          text,
  "metadata"             jsonb NOT NULL DEFAULT '{}',
  "created_at"           timestamp NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "reader_transactions_publisher_idx" ON "reader_transactions"("publisher_id");
CREATE INDEX IF NOT EXISTS "reader_transactions_created_idx"   ON "reader_transactions"("created_at");
CREATE INDEX IF NOT EXISTS "reader_transactions_type_idx"      ON "reader_transactions"("type");
