-- ─── page_events ──────────────────────────────────────────────────────────────
-- Fires on every page load (page_view) and on read completion (read_complete).
-- Separate from gate_events because gate_events.gate_id is NOT NULL.

CREATE TABLE IF NOT EXISTS "page_events" (
  "id"                text      PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "domain_id"         text      NOT NULL REFERENCES domains(id) ON DELETE CASCADE,
  "reader_id"         text      REFERENCES readers(id) ON DELETE SET NULL,
  "event_type"        text      NOT NULL,
  "url"               text      NOT NULL,
  "referrer"          text,
  "content_category"  text,
  "read_time_seconds" integer,
  "scroll_depth_pct"  integer,
  "occurred_at"       timestamp NOT NULL DEFAULT now()
);

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "page_events_domain_idx"   ON page_events(domain_id);
  CREATE INDEX IF NOT EXISTS "page_events_occurred_idx" ON page_events(domain_id, occurred_at DESC);
  CREATE INDEX IF NOT EXISTS "page_events_url_idx"      ON page_events(domain_id, url);
  CREATE INDEX IF NOT EXISTS "page_events_type_idx"     ON page_events(domain_id, event_type, occurred_at DESC);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ─── source_stats ─────────────────────────────────────────────────────────────
-- Daily per-domain per-referrer rollup. reader_quality_score = avg monetization_probability.

CREATE TABLE IF NOT EXISTS "source_stats" (
  "id"                     text    PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "domain_id"              text    NOT NULL REFERENCES domains(id) ON DELETE CASCADE,
  "date"                   date    NOT NULL,
  "referrer"               text    NOT NULL,
  "page_views"             integer NOT NULL DEFAULT 0,
  "unique_readers"         integer NOT NULL DEFAULT 0,
  "avg_read_time_seconds"  integer,
  "avg_scroll_depth_pct"   integer,
  "reader_quality_score"   real,
  "created_at"             timestamp NOT NULL DEFAULT now(),
  "updated_at"             timestamp NOT NULL DEFAULT now()
);

DO $$ BEGIN
  CREATE UNIQUE INDEX IF NOT EXISTS "source_stats_unique_idx"      ON source_stats(domain_id, date, referrer);
  CREATE INDEX        IF NOT EXISTS "source_stats_domain_date_idx" ON source_stats(domain_id, date DESC);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
