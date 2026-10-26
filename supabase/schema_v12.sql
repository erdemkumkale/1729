-- 1729 — Schema v12: bring the live database in line with the app
-- Run in Supabase Dashboard → SQL Editor (safe to run more than once)
--
-- The live "gifts" table was missing columns the app writes (creator_hex, why_me,
-- gift_type, quota, quota_remaining, is_physical, delivery_note, lang) and
-- "profiles" was missing "language". Creating a gift failed because of that.

alter table gifts
  add column if not exists creator_hex     text,
  add column if not exists why_me          text,
  add column if not exists gift_type       text not null default 'unlimited',
  add column if not exists quota           integer,
  add column if not exists quota_remaining integer,
  add column if not exists is_physical     boolean not null default false,
  add column if not exists delivery_note   text,
  add column if not exists lang            text default 'en';

alter table profiles
  add column if not exists language text;

-- Auto-close a limited gift when its quota runs out (from schema_v3)
create or replace function check_gift_quota()
returns trigger as $$
begin
  if new.gift_type = 'quota' and new.quota_remaining is not null and new.quota_remaining <= 0 then
    new.is_active := false;
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists gift_quota_check on gifts;
create trigger gift_quota_check
  before update on gifts
  for each row execute function check_gift_quota();

-- make the API see the new columns right away
notify pgrst, 'reload schema';
