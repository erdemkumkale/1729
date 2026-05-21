-- 1729 — Schema v4: Settings preferences + notification preferences
-- Run in Supabase Dashboard → SQL Editor

-- ── Profiles: theme + gift word ─────────────────────────────────

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS
  theme VARCHAR(20) DEFAULT 'dark';           -- dark / light / system

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS
  gift_word VARCHAR(20) DEFAULT 'armağan';    -- armağan / şey

-- ── Notification preferences ─────────────────────────────────────

CREATE TABLE IF NOT EXISTS notification_preferences (
  user_id          UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  gift_interest    BOOLEAN DEFAULT true,    -- biri armağanına ilgi gösterdi
  new_message      BOOLEAN DEFAULT true,    -- yeni mesaj
  subscription_expiring BOOLEAN DEFAULT true, -- 5 gün kala uyarı
  subscription_expired  BOOLEAN DEFAULT true, -- abonelik bitti
  added_to_circle  BOOLEAN DEFAULT false,   -- güven çemberine eklendin
  gift_quota_empty BOOLEAN DEFAULT false,   -- kota doldu
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own notification preferences"
  ON notification_preferences FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
