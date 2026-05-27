-- 1729 — Schema v5: Waitlist
-- Run in Supabase Dashboard → SQL Editor

CREATE TABLE IF NOT EXISTS waitlist (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email      TEXT NOT NULL,
  message    TEXT,
  lang       VARCHAR(5) DEFAULT 'tr',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;

-- Anyone can insert (public landing page form)
CREATE POLICY "Anyone can join waitlist"
  ON waitlist FOR INSERT
  WITH CHECK (true);

-- Only service role can read

-- Explicit grants required for new tables after May 30, 2026
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT INSERT ON waitlist TO anon;
GRANT SELECT, INSERT ON waitlist TO authenticated;
