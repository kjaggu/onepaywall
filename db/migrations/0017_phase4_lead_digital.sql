-- Phase 4: Lead Capture + Digital Products

-- Extend step_type enum
ALTER TYPE step_type ADD VALUE IF NOT EXISTS 'lead_capture';
ALTER TYPE step_type ADD VALUE IF NOT EXISTS 'digital_product';

-- Extend unlock_type enum
ALTER TYPE unlock_type ADD VALUE IF NOT EXISTS 'lead_capture';
ALTER TYPE unlock_type ADD VALUE IF NOT EXISTS 'digital_product_purchase';

-- Add source + notes to reader_subscribers
ALTER TABLE reader_subscribers
  ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'subscription',
  ADD COLUMN IF NOT EXISTS notes  TEXT;

-- Digital products catalogue
CREATE TABLE IF NOT EXISTS publisher_digital_products (
  id             TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  publisher_id   TEXT NOT NULL REFERENCES publishers(id) ON DELETE CASCADE,
  brand_id       TEXT REFERENCES brands(id) ON DELETE CASCADE,
  title          TEXT NOT NULL,
  description    TEXT,
  r2_key         TEXT NOT NULL,
  file_name      TEXT NOT NULL,
  mime_type      TEXT NOT NULL DEFAULT 'application/octet-stream',
  price_in_paise INTEGER NOT NULL,
  download_count INTEGER NOT NULL DEFAULT 0,
  active         BOOLEAN NOT NULL DEFAULT TRUE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS publisher_digital_products_publisher_idx ON publisher_digital_products(publisher_id);
CREATE INDEX IF NOT EXISTS publisher_digital_products_brand_idx ON publisher_digital_products(brand_id);

-- Subscriber tags (many-to-many)
CREATE TABLE IF NOT EXISTS subscriber_tags (
  id            TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  subscriber_id TEXT NOT NULL REFERENCES reader_subscribers(id) ON DELETE CASCADE,
  publisher_id  TEXT NOT NULL,
  tag           TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT subscriber_tags_subscriber_tag_unique UNIQUE (subscriber_id, tag)
);

CREATE INDEX IF NOT EXISTS subscriber_tags_subscriber_idx ON subscriber_tags(subscriber_id);
CREATE INDEX IF NOT EXISTS subscriber_tags_publisher_idx ON subscriber_tags(publisher_id);

-- Publisher webhook endpoints
CREATE TABLE IF NOT EXISTS publisher_webhooks (
  id           TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  publisher_id TEXT NOT NULL REFERENCES publishers(id) ON DELETE CASCADE,
  event        TEXT NOT NULL,
  url          TEXT NOT NULL,
  active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS publisher_webhooks_publisher_idx ON publisher_webhooks(publisher_id);
