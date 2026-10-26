-- 1729 — Schema v15: every account always has a profile row
-- Run in Supabase Dashboard → SQL Editor (safe to run more than once)
--
-- gifts / onboarding_answers point at profiles(id). If a profile row is missing, saving
-- answers and gifts fails with a foreign-key error. This guarantees a profile for every
-- auth user: a trigger for new accounts, a backfill for existing ones, and an insert
-- policy so the app can create its own row as a fallback.

create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, payment_status, onboarding_completed)
  values (new.id, 'pending', false)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

insert into public.profiles (id, payment_status, onboarding_completed)
select u.id, 'pending', false
from auth.users u
where not exists (select 1 from public.profiles p where p.id = u.id);

drop policy if exists "own_insert" on profiles;
create policy "own_insert" on profiles for insert to authenticated
  with check (id = auth.uid());
