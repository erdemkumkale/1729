-- ================================================================
-- 1729 — Schema v2: Trust Community & Funding System
-- Run this in Supabase SQL Editor
-- ================================================================

-- ── New table: sub_communities ─────────────────────────────────
CREATE TABLE IF NOT EXISTS sub_communities (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name           TEXT NOT NULL,
  members_aware  BOOLEAN NOT NULL DEFAULT false,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── New table: sub_community_members ──────────────────────────
CREATE TABLE IF NOT EXISTS sub_community_members (
  sub_community_id  UUID NOT NULL REFERENCES sub_communities(id) ON DELETE CASCADE,
  user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (sub_community_id, user_id)
);

-- ── New table: trust_circle ────────────────────────────────────
-- Only created when a receiver explicitly confirms "I received this gift"
-- and then chooses to add the giver. One-directional: only the receiver adds.
CREATE TABLE IF NOT EXISTS trust_circle (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  member_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  gift_title    TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (owner_id, member_id)
);

-- ── Alter: invitations — add new fields ───────────────────────
ALTER TABLE invitations
  ADD COLUMN IF NOT EXISTS sub_community_id     UUID REFERENCES sub_communities(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS subscription_ends_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS funded_by_inviter    BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS duration_months      INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS used_at              TIMESTAMPTZ;

-- ── Alter: support_transactions — receiver confirmation ───────
ALTER TABLE support_transactions
  ADD COLUMN IF NOT EXISTS receiver_confirmed  BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS confirmed_at        TIMESTAMPTZ;

-- ── RLS: sub_communities ──────────────────────────────────────
ALTER TABLE sub_communities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sc_owner_all" ON sub_communities
  FOR ALL USING (owner_id = auth.uid());

CREATE POLICY "sc_member_read" ON sub_communities
  FOR SELECT USING (
    id IN (
      SELECT sub_community_id FROM sub_community_members
      WHERE user_id = auth.uid()
    )
  );

-- ── RLS: sub_community_members ────────────────────────────────
ALTER TABLE sub_community_members ENABLE ROW LEVEL SECURITY;

-- Owner of the community manages membership
CREATE POLICY "scm_owner_manage" ON sub_community_members
  FOR ALL USING (
    (SELECT owner_id FROM sub_communities WHERE id = sub_community_id) = auth.uid()
  );

-- Members can read their own row and co-members
CREATE POLICY "scm_comember_read" ON sub_community_members
  FOR SELECT USING (
    sub_community_id IN (
      SELECT sub_community_id FROM sub_community_members
      WHERE user_id = auth.uid()
    )
  );

-- ── RLS: trust_circle ─────────────────────────────────────────
ALTER TABLE trust_circle ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tc_owner_all" ON trust_circle
  FOR ALL USING (owner_id = auth.uid());

-- ── Done ──────────────────────────────────────────────────────
