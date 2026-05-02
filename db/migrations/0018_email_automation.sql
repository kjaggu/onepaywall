-- Phase 5: Publisher Email & Automation

-- Extend step_type with newsletter opt-in
ALTER TYPE step_type ADD VALUE IF NOT EXISTS 'newsletter_optin';

-- Extend reader_subscribers with unsubscribe support
ALTER TABLE reader_subscribers
  ADD COLUMN IF NOT EXISTS unsubscribe_token TEXT NOT NULL DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS unsubscribed_at   TIMESTAMPTZ;

DO $$ BEGIN
  CREATE UNIQUE INDEX reader_subscribers_unsubscribe_token_idx
    ON reader_subscribers(unsubscribe_token);
EXCEPTION WHEN duplicate_table THEN NULL; END $$;

-- Email provider config (one per publisher)
CREATE TABLE IF NOT EXISTS publisher_email_configs (
  id                  TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  publisher_id        TEXT NOT NULL REFERENCES publishers(id) ON DELETE CASCADE,
  resend_api_key      TEXT NOT NULL,
  from_name           TEXT NOT NULL,
  from_email          TEXT NOT NULL,
  reply_to            TEXT,
  domain_verified_at  TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT publisher_email_configs_publisher_unique UNIQUE (publisher_id)
);

CREATE INDEX IF NOT EXISTS publisher_email_configs_publisher_idx
  ON publisher_email_configs(publisher_id);

-- Broadcast campaigns
CREATE TABLE IF NOT EXISTS publisher_email_campaigns (
  id               TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  publisher_id     TEXT NOT NULL REFERENCES publishers(id) ON DELETE CASCADE,
  name             TEXT NOT NULL,
  subject          TEXT NOT NULL,
  body_html        TEXT NOT NULL,
  body_text        TEXT,
  segment_filter   JSONB,
  status           TEXT NOT NULL DEFAULT 'draft',
  scheduled_at     TIMESTAMPTZ,
  sent_at          TIMESTAMPTZ,
  recipient_count  INTEGER,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS publisher_email_campaigns_publisher_idx
  ON publisher_email_campaigns(publisher_id);
CREATE INDEX IF NOT EXISTS publisher_email_campaigns_status_idx
  ON publisher_email_campaigns(publisher_id, status);

-- Trigger-based automations
CREATE TABLE IF NOT EXISTS publisher_email_automations (
  id              TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  publisher_id    TEXT NOT NULL REFERENCES publishers(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  trigger_type    TEXT NOT NULL,
  trigger_config  JSONB NOT NULL DEFAULT '{}',
  subject         TEXT NOT NULL,
  body_html       TEXT NOT NULL,
  body_text       TEXT,
  status          TEXT NOT NULL DEFAULT 'draft',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS publisher_email_automations_publisher_idx
  ON publisher_email_automations(publisher_id);
CREATE INDEX IF NOT EXISTS publisher_email_automations_trigger_idx
  ON publisher_email_automations(publisher_id, trigger_type, status);

-- Automation run log (dedup: one send per automation+subscriber per day)
CREATE TABLE IF NOT EXISTS email_automation_runs (
  id            TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  automation_id TEXT NOT NULL REFERENCES publisher_email_automations(id) ON DELETE CASCADE,
  subscriber_id TEXT NOT NULL REFERENCES reader_subscribers(id) ON DELETE CASCADE,
  triggered_at  TIMESTAMPTZ NOT NULL,
  sent_at       TIMESTAMPTZ,
  status        TEXT NOT NULL DEFAULT 'pending',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS email_automation_runs_automation_idx
  ON email_automation_runs(automation_id);
CREATE INDEX IF NOT EXISTS email_automation_runs_subscriber_idx
  ON email_automation_runs(subscriber_id);

-- Email events (open / click / bounce / complaint)
CREATE TABLE IF NOT EXISTS email_events (
  id                  TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id         TEXT REFERENCES publisher_email_campaigns(id) ON DELETE SET NULL,
  automation_run_id   TEXT REFERENCES email_automation_runs(id) ON DELETE SET NULL,
  subscriber_id       TEXT NOT NULL REFERENCES reader_subscribers(id) ON DELETE CASCADE,
  event_type          TEXT NOT NULL,
  metadata            JSONB NOT NULL DEFAULT '{}',
  occurred_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS email_events_campaign_idx
  ON email_events(campaign_id);
CREATE INDEX IF NOT EXISTS email_events_automation_run_idx
  ON email_events(automation_run_id);
CREATE INDEX IF NOT EXISTS email_events_subscriber_idx
  ON email_events(subscriber_id);
CREATE INDEX IF NOT EXISTS email_events_type_idx
  ON email_events(subscriber_id, event_type, occurred_at);
