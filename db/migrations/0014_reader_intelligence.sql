-- Add cross-publisher interest graph + profile versioning to reader_profiles
ALTER TABLE reader_profiles
  ADD COLUMN IF NOT EXISTS cross_publisher_interests JSONB NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS profile_version INT NOT NULL DEFAULT 0;

-- Speed up profile staleness queries (cron picks up readers whose profile
-- hasn't been recomputed since their latest visit)
CREATE INDEX IF NOT EXISTS idx_reader_profiles_last_computed
  ON reader_profiles(last_computed_at);

-- Speed up per-reader visit lookups with time ordering (used by computeProfile)
CREATE INDEX IF NOT EXISTS idx_reader_page_visits_reader_occurred
  ON reader_page_visits(reader_id, occurred_at DESC);

-- Speed up URL-based classification cache lookups
CREATE INDEX IF NOT EXISTS idx_content_classifications_classified_at
  ON content_classifications(classified_at);
