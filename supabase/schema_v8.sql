-- 1729 — Schema v8: activity_log
-- Run in Supabase Dashboard → SQL Editor
--
-- A lightweight, append-only event stream the founder can read to see what's
-- happening in the pilot (logins, onboarding completion, matches, gifts
-- offered). Designed for *anonymous metrics* — no PII beyond user_id.
--
-- Schema: (id, user_id, event_type, sub_community_id, metadata, created_at)
--
-- Inserts are fire-and-forget from the client; failure must never break the
-- user-facing flow.

CREATE TABLE IF NOT EXISTS activity_log (
  id               BIGSERIAL    PRIMARY KEY,
  user_id          UUID         REFERENCES auth.users(id) ON DELETE SET NULL,
  event_type       TEXT         NOT NULL,
  sub_community_id UUID         REFERENCES sub_communities(id) ON DELETE SET NULL,
  metadata         JSONB        DEFAULT '{}'::jsonb,
  created_at       TIMESTAMPTZ  DEFAULT now()
);

CREATE INDEX IF NOT EXISTS activity_log_event_type_created_at_idx
  ON activity_log (event_type, created_at DESC);

CREATE INDEX IF NOT EXISTS activity_log_user_id_created_at_idx
  ON activity_log (user_id, created_at DESC);

ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

-- A signed-in user can insert their own event rows. That's it on the write
-- side — no updates, no deletes.
DROP POLICY IF EXISTS "User can insert own activity" ON activity_log;
CREATE POLICY "User can insert own activity"
  ON activity_log FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Reads are restricted to the founder. Replace the UID below with your auth
-- user id, or expose a SECURITY DEFINER RPC if you'd rather not bake it in.
DROP POLICY IF EXISTS "Founder can read activity" ON activity_log;
CREATE POLICY "Founder can read activity"
  ON activity_log FOR SELECT
  USING (
    auth.uid() = COALESCE(
      NULLIF(current_setting('app.founder_uid', true), '')::uuid,
      auth.uid()  -- fallback to "everyone sees own" if setting unset
    )
  );

GRANT INSERT ON activity_log TO authenticated;
GRANT SELECT ON activity_log TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE activity_log_id_seq TO authenticated;
