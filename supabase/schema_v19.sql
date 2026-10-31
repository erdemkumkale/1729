-- 1729 — Schema v19: the member's language is stored on the profile
-- Run in Supabase Dashboard → SQL Editor (safe to run more than once).
-- Notification and invitation e-mails use it to decide which language comes first.

alter table profiles add column if not exists language text;

notify pgrst, 'reload schema';
