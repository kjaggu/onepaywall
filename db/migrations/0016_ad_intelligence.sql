-- Phase 3: Ad Intelligence
-- Partial index on gate_events.ad_unit_id to accelerate per-unit analytics queries.
CREATE INDEX IF NOT EXISTS gate_events_ad_unit_idx ON gate_events(ad_unit_id)
  WHERE ad_unit_id IS NOT NULL;
