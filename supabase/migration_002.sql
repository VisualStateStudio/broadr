-- ─── Migration 002: expanded client fields ────────────────────────────────────

ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS contact_name     text,
  ADD COLUMN IF NOT EXISTS contact_email    text,
  ADD COLUMN IF NOT EXISTS phone            text,
  ADD COLUMN IF NOT EXISTS instagram_handle text,
  ADD COLUMN IF NOT EXISTS facebook_page    text,
  ADD COLUMN IF NOT EXISTS monthly_budget   numeric;
