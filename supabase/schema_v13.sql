-- 1729 — Schema v13: disaster offers ("Afet")
-- Run in Supabase Dashboard → SQL Editor (safe to run more than once)
--
-- A disaster offer is a normal gift row with is_disaster = true. It is visible to every
-- signed-in member for 7 days (expires_at), unless hidden. Members can report it; three
-- reports hide it automatically, and the admin can hide or show it by hand.

alter table gifts
  add column if not exists is_disaster       boolean not null default false,
  add column if not exists disaster_category text,
  add column if not exists expires_at        timestamptz,
  add column if not exists hidden            boolean not null default false;

-- who is an admin (the founder). Add yourself by e-mail, no UID needed.
create table if not exists app_admins (
  user_id uuid primary key references auth.users(id) on delete cascade
);
alter table app_admins enable row level security;
drop policy if exists "admin reads own row" on app_admins;
create policy "admin reads own row" on app_admins for select to authenticated
  using (user_id = auth.uid());
grant select on app_admins to authenticated;

insert into app_admins (user_id)
select id from auth.users where email = 'ekumkale@gmail.com'
on conflict do nothing;

-- reports
create table if not exists gift_reports (
  gift_id     uuid not null references gifts(id) on delete cascade,
  reporter_id uuid not null references auth.users(id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (gift_id, reporter_id)
);
alter table gift_reports enable row level security;

drop policy if exists "member reports once" on gift_reports;
create policy "member reports once" on gift_reports for insert to authenticated
  with check (reporter_id = auth.uid());

drop policy if exists "admin reads reports" on gift_reports;
create policy "admin reads reports" on gift_reports for select to authenticated
  using (exists (select 1 from app_admins a where a.user_id = auth.uid()));

grant select, insert on gift_reports to authenticated;

-- three reports hide the offer
create or replace function public.hide_gift_after_reports()
returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if (select count(*) from gift_reports where gift_id = new.gift_id) >= 3 then
    update gifts set hidden = true where id = new.gift_id;
  end if;
  return new;
end;
$$;

drop trigger if exists gift_reports_autohide on gift_reports;
create trigger gift_reports_autohide
  after insert on gift_reports
  for each row execute function public.hide_gift_after_reports();

-- visibility: own, admin, circle, community, and live disaster offers for everyone
drop policy if exists "gifts_visible_to_circle_and_community" on gifts;
create policy "gifts_visible_to_circle_and_community" on gifts for select to authenticated
  using (
    creator_id = auth.uid()
    or exists (select 1 from app_admins a where a.user_id = auth.uid())
    or public.in_my_circle(creator_id)
    or (visibility = 'community' and creator_id in (select public.my_community_peers()))
    or (is_disaster and is_active and not hidden and (expires_at is null or expires_at > now()))
  );

-- the admin may hide / show any gift
drop policy if exists "admin updates gifts" on gifts;
create policy "admin updates gifts" on gifts for update to authenticated
  using (exists (select 1 from app_admins a where a.user_id = auth.uid()))
  with check (exists (select 1 from app_admins a where a.user_id = auth.uid()));

notify pgrst, 'reload schema';
