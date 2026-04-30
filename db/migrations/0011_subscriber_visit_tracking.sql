-- Track subscriber status and gate exposure on every page visit.
-- is_subscriber: stamped at signal time from gate-check response; null = pre-feature visit.
-- gate_shown: true when a gate was triggered for this reader on this pageview.

ALTER TABLE reader_page_visits
  ADD COLUMN IF NOT EXISTS is_subscriber boolean,
  ADD COLUMN IF NOT EXISTS gate_shown boolean;
