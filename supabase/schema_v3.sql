-- ================================================================
-- 1729 — Schema v3: Gift type, quota, physical fields
-- Run this in Supabase SQL Editor
-- ================================================================

ALTER TABLE gifts
  ADD COLUMN IF NOT EXISTS gift_type       TEXT NOT NULL DEFAULT 'unlimited',
  -- 'unlimited' | 'quota' | 'once'
  ADD COLUMN IF NOT EXISTS quota           INTEGER,
  ADD COLUMN IF NOT EXISTS quota_remaining INTEGER,
  ADD COLUMN IF NOT EXISTS is_physical     BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS delivery_note   TEXT;

-- Auto-close gift when quota_remaining hits 0
CREATE OR REPLACE FUNCTION check_gift_quota()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.gift_type = 'quota' AND NEW.quota_remaining IS NOT NULL AND NEW.quota_remaining <= 0 THEN
    NEW.is_active := false;
  END IF;
  IF NEW.gift_type = 'once' AND NEW.is_active = false THEN
    -- already handled by app
    NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS gift_quota_check ON gifts;
CREATE TRIGGER gift_quota_check
  BEFORE UPDATE ON gifts
  FOR EACH ROW EXECUTE FUNCTION check_gift_quota();
