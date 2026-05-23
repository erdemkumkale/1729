-- 1729 — Schema v6: hex_code unique constraint + fix invalid hex
-- Run in Supabase Dashboard → SQL Editor

-- Fix the invalid hex code (5 chars instead of 6) for ali@veli.com
UPDATE profiles
SET hex_code = '#a208dd'
WHERE hex_code = '#a208d';

-- Add UNIQUE constraint on profiles.hex_code (only if it doesn't already exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'profiles_hex_code_key'
      AND conrelid = 'profiles'::regclass
  ) THEN
    ALTER TABLE profiles ADD CONSTRAINT profiles_hex_code_key UNIQUE (hex_code);
  END IF;
END $$;
