-- Pricing v2: multi-currency, commission, BYOK, subscriber seats, ad impressions
-- Replaces MAU-per-domain quota with gate-trigger-per-publisher quota.
-- All monetary columns in smallest unit: paise (INR) or cents (USD).

-- ── Plans: new pricing columns ──────────────────────────────────────────────

ALTER TABLE plans ADD COLUMN IF NOT EXISTS price_monthly_usd    integer;
ALTER TABLE plans ADD COLUMN IF NOT EXISTS razorpay_plan_id_usd text;
ALTER TABLE plans ADD COLUMN IF NOT EXISTS commission_bps        integer NOT NULL DEFAULT 0;
ALTER TABLE plans ADD COLUMN IF NOT EXISTS byok_addon_price_inr  integer;
ALTER TABLE plans ADD COLUMN IF NOT EXISTS byok_addon_price_usd  integer;

-- Gate trigger quota (replaces per-domain MAU; NULL = unlimited)
ALTER TABLE plans ADD COLUMN IF NOT EXISTS max_monthly_gate_triggers integer;

-- Subscriber seat quota (NULL = unlimited)
ALTER TABLE plans ADD COLUMN IF NOT EXISTS max_paying_subscribers    integer;
ALTER TABLE plans ADD COLUMN IF NOT EXISTS subscriber_overage_price_inr integer;
ALTER TABLE plans ADD COLUMN IF NOT EXISTS subscriber_overage_price_usd integer;

-- Ad impression free tier + overage (NULL free = unlimited)
ALTER TABLE plans ADD COLUMN IF NOT EXISTS max_free_ad_impressions        integer;
ALTER TABLE plans ADD COLUMN IF NOT EXISTS ad_overage_price_per_mille_inr integer;
ALTER TABLE plans ADD COLUMN IF NOT EXISTS ad_overage_price_per_mille_usd integer;

-- All plans get unlimited domains (domain count is no longer a differentiator)
UPDATE plans SET max_domains = NULL;

-- ── Subscriptions: BYOK entitlement and billing interval ────────────────────

ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS byok_enabled      boolean NOT NULL DEFAULT false;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS billing_interval  text    NOT NULL DEFAULT 'monthly';

-- ── Publisher overage charges ────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS publisher_overage_charges (
  id                        text        PRIMARY KEY DEFAULT gen_random_uuid()::text,
  publisher_id              text        NOT NULL REFERENCES publishers(id) ON DELETE CASCADE,
  billing_period_start      timestamp   NOT NULL,
  billing_period_end        timestamp   NOT NULL,
  -- subscriber seat overage
  paying_subscriber_count   integer     NOT NULL DEFAULT 0,
  subscriber_overage_count  integer     NOT NULL DEFAULT 0,
  subscriber_overage_amount integer     NOT NULL DEFAULT 0,
  -- ad impression billing
  ad_impression_count       bigint      NOT NULL DEFAULT 0,
  ad_impression_free_quota  integer     NOT NULL DEFAULT 0,
  ad_impression_overage     bigint      NOT NULL DEFAULT 0,
  ad_impression_amount      integer     NOT NULL DEFAULT 0,
  -- totals
  total_amount              integer     NOT NULL DEFAULT 0,
  currency                  text        NOT NULL DEFAULT 'INR',
  status                    text        NOT NULL DEFAULT 'pending',
  razorpay_order_id         text,
  created_at                timestamp   NOT NULL DEFAULT NOW()
);

DO $$ BEGIN
  CREATE INDEX overage_charges_publisher_idx ON publisher_overage_charges(publisher_id);
EXCEPTION WHEN duplicate_table THEN NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX overage_charges_period_idx ON publisher_overage_charges(billing_period_start);
EXCEPTION WHEN duplicate_table THEN NULL;
END $$;

-- ── gate_events: compound index for fast publisher-level counting ────────────

DO $$ BEGIN
  CREATE INDEX gate_events_domain_type_time_idx ON gate_events(domain_id, event_type, occurred_at);
EXCEPTION WHEN duplicate_table THEN NULL;
END $$;
