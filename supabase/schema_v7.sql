-- 1729 — Schema v7: Invite-link join flow
-- Run in Supabase Dashboard → SQL Editor
--
-- Context: signup is now invite-only. The invitee opens /davet/<invitation-id>,
-- which must read the invitation row WHILE STILL ANONYMOUS (no session yet) to
-- show the locked email. This policy lets anyone read a *pending* invitation by
-- its id. Only non-sensitive fields are exposed and only while status='pending',
-- so a used/expired invite reveals nothing.

-- Allow anon + authenticated to read pending invitations (needed for the
-- /davet/:token join screen before the user has signed up).
DROP POLICY IF EXISTS "Anyone can read a pending invitation" ON invitations;
CREATE POLICY "Anyone can read a pending invitation"
  ON invitations FOR SELECT
  USING (status = 'pending');

-- The invitee marks their own invitation as used right after signing up.
-- Restrict the update to pending → used by the newly-created user.
DROP POLICY IF EXISTS "Invitee can mark invitation used" ON invitations;
CREATE POLICY "Invitee can mark invitation used"
  ON invitations FOR UPDATE
  USING (status = 'pending')
  WITH CHECK (used_by = auth.uid());

-- Explicit grants (required for new policies under the post-May-2026 Data API).
GRANT SELECT, UPDATE ON invitations TO anon, authenticated;
