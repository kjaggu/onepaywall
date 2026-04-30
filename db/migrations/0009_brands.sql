-- ─── Step 1: Create brands table ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS brands (
  id           TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  publisher_id TEXT NOT NULL REFERENCES publishers(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  slug         TEXT NOT NULL,
  created_at   TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS brands_publisher_slug_idx ON brands(publisher_id, slug);
CREATE INDEX        IF NOT EXISTS brands_publisher_idx      ON brands(publisher_id);

-- ─── Step 2: Seed one default brand per existing publisher ────────────────────
INSERT INTO brands (id, publisher_id, name, slug, created_at, updated_at)
SELECT
  gen_random_uuid(),
  p.id,
  p.name,
  p.slug,
  NOW(),
  NOW()
FROM publishers p
WHERE p.deleted_at IS NULL
ON CONFLICT DO NOTHING;

-- ─── Step 3: Add brand_id columns (nullable for backfill) ────────────────────
ALTER TABLE domains                       ADD COLUMN IF NOT EXISTS brand_id TEXT REFERENCES brands(id) ON DELETE CASCADE;
ALTER TABLE publisher_pg_configs          ADD COLUMN IF NOT EXISTS brand_id TEXT REFERENCES brands(id) ON DELETE CASCADE;
ALTER TABLE publisher_reader_plans        ADD COLUMN IF NOT EXISTS brand_id TEXT REFERENCES brands(id) ON DELETE CASCADE;
ALTER TABLE publisher_content_prices      ADD COLUMN IF NOT EXISTS brand_id TEXT REFERENCES brands(id) ON DELETE CASCADE;
ALTER TABLE reader_subscribers            ADD COLUMN IF NOT EXISTS brand_id TEXT REFERENCES brands(id) ON DELETE CASCADE;
ALTER TABLE reader_subscriptions          ADD COLUMN IF NOT EXISTS brand_id TEXT REFERENCES brands(id) ON DELETE CASCADE;
ALTER TABLE reader_subscription_links     ADD COLUMN IF NOT EXISTS brand_id TEXT REFERENCES brands(id) ON DELETE CASCADE;
ALTER TABLE reader_subscription_magic_links ADD COLUMN IF NOT EXISTS brand_id TEXT REFERENCES brands(id) ON DELETE CASCADE;
ALTER TABLE reader_transactions           ADD COLUMN IF NOT EXISTS brand_id TEXT REFERENCES brands(id) ON DELETE SET NULL;

-- ─── Step 4: Backfill brand_id from each row's publisher_id ──────────────────
UPDATE domains
  SET brand_id = (SELECT id FROM brands WHERE publisher_id = domains.publisher_id LIMIT 1)
  WHERE brand_id IS NULL;

UPDATE publisher_pg_configs
  SET brand_id = (SELECT id FROM brands WHERE publisher_id = publisher_pg_configs.publisher_id LIMIT 1)
  WHERE brand_id IS NULL;

UPDATE publisher_reader_plans
  SET brand_id = (SELECT id FROM brands WHERE publisher_id = publisher_reader_plans.publisher_id LIMIT 1)
  WHERE brand_id IS NULL;

UPDATE publisher_content_prices
  SET brand_id = (SELECT id FROM brands WHERE publisher_id = publisher_content_prices.publisher_id LIMIT 1)
  WHERE brand_id IS NULL;

UPDATE reader_subscribers
  SET brand_id = (SELECT id FROM brands WHERE publisher_id = reader_subscribers.publisher_id LIMIT 1)
  WHERE brand_id IS NULL;

UPDATE reader_subscriptions
  SET brand_id = (SELECT id FROM brands WHERE publisher_id = reader_subscriptions.publisher_id LIMIT 1)
  WHERE brand_id IS NULL;

UPDATE reader_subscription_links
  SET brand_id = (SELECT id FROM brands WHERE publisher_id = reader_subscription_links.publisher_id LIMIT 1)
  WHERE brand_id IS NULL;

UPDATE reader_subscription_magic_links
  SET brand_id = (SELECT id FROM brands WHERE publisher_id = reader_subscription_magic_links.publisher_id LIMIT 1)
  WHERE brand_id IS NULL;

UPDATE reader_transactions
  SET brand_id = (SELECT id FROM brands WHERE publisher_id = reader_transactions.publisher_id LIMIT 1)
  WHERE brand_id IS NULL;

-- ─── Step 5: Add query indexes ────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS domains_brand_idx                        ON domains(brand_id);
CREATE INDEX IF NOT EXISTS publisher_pg_configs_brand_idx           ON publisher_pg_configs(brand_id);
CREATE INDEX IF NOT EXISTS publisher_reader_plans_brand_idx         ON publisher_reader_plans(brand_id);
CREATE INDEX IF NOT EXISTS publisher_content_prices_brand_idx       ON publisher_content_prices(brand_id);
CREATE INDEX IF NOT EXISTS reader_subscribers_brand_idx             ON reader_subscribers(brand_id);
CREATE INDEX IF NOT EXISTS reader_subscriptions_brand_idx           ON reader_subscriptions(brand_id);
CREATE INDEX IF NOT EXISTS reader_subscription_links_brand_idx      ON reader_subscription_links(brand_id);
CREATE INDEX IF NOT EXISTS reader_transactions_brand_idx            ON reader_transactions(brand_id);

-- ─── Step 6: Replace publisher-scoped unique constraints with brand-scoped ────
-- pg_configs: one per brand (was one per publisher)
DROP INDEX IF EXISTS publisher_pg_configs_publisher_idx;
CREATE UNIQUE INDEX IF NOT EXISTS publisher_pg_configs_brand_unique_idx
  ON publisher_pg_configs(brand_id) WHERE brand_id IS NOT NULL;

-- reader_plans: one per brand (was one per publisher)
DROP INDEX IF EXISTS publisher_reader_plans_publisher_idx;
CREATE UNIQUE INDEX IF NOT EXISTS publisher_reader_plans_brand_unique_idx
  ON publisher_reader_plans(brand_id) WHERE brand_id IS NOT NULL;

-- reader_subscribers: unique per (brand, email) — was (publisher, email)
DROP INDEX IF EXISTS reader_subscribers_publisher_email_idx;
CREATE UNIQUE INDEX IF NOT EXISTS reader_subscribers_brand_email_idx
  ON reader_subscribers(brand_id, email_hash) WHERE brand_id IS NOT NULL;

-- subscription_links: unique per (reader, brand) — was (reader, publisher)
DROP INDEX IF EXISTS reader_subscription_links_reader_publisher_idx;
CREATE UNIQUE INDEX IF NOT EXISTS reader_subscription_links_reader_brand_idx
  ON reader_subscription_links(reader_id, brand_id) WHERE brand_id IS NOT NULL;

-- ─── Step 7: Add max_brands to platform plans table ───────────────────────────
ALTER TABLE plans ADD COLUMN IF NOT EXISTS max_brands INTEGER;

-- Seed from existing max_domains values (brands replace domains in plan limits)
UPDATE plans SET max_brands = max_domains WHERE max_brands IS NULL AND max_domains IS NOT NULL;
