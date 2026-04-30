ALTER TABLE domains
  ADD COLUMN IF NOT EXISTS logout_widget_enabled  boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS logout_widget_position text    NOT NULL DEFAULT 'bottom';
