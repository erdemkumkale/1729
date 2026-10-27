-- 1729 — Schema v17: option to hide the message text in notification e-mails
-- Run in Supabase Dashboard → SQL Editor (safe to run more than once)

alter table notification_preferences
  add column if not exists show_message_preview boolean not null default true;

notify pgrst, 'reload schema';
