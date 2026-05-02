-- Publisher invoices: one per completed reader transaction, sequential numbering per publisher

CREATE TABLE IF NOT EXISTS publisher_invoices (
  id                    TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  publisher_id          TEXT NOT NULL REFERENCES publishers(id) ON DELETE CASCADE,
  transaction_id        TEXT REFERENCES reader_transactions(id) ON DELETE SET NULL,
  domain_id             TEXT REFERENCES domains(id) ON DELETE SET NULL,
  invoice_number        INTEGER NOT NULL,
  type                  TEXT NOT NULL,            -- 'subscription' | 'one_time_unlock'
  amount                INTEGER NOT NULL,          -- paise
  currency              TEXT NOT NULL DEFAULT 'INR',
  reader_email_hash     TEXT,
  encrypted_reader_email TEXT,
  content_url           TEXT,
  razorpay_payment_id   TEXT,
  issued_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DO $$ BEGIN
  CREATE UNIQUE INDEX IF NOT EXISTS publisher_invoices_pub_num_idx
    ON publisher_invoices (publisher_id, invoice_number);
EXCEPTION WHEN duplicate_table THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS publisher_invoices_publisher_idx ON publisher_invoices (publisher_id);
CREATE INDEX IF NOT EXISTS publisher_invoices_transaction_idx ON publisher_invoices (transaction_id);
