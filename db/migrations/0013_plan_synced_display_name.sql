ALTER TABLE publisher_reader_plans
  ADD COLUMN IF NOT EXISTS synced_display_name text;
