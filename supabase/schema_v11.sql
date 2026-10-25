-- 1729 — Schema v11: privacy hardening (inviter and invitee never learn who the other is)
-- Run in Supabase Dashboard → SQL Editor
--
-- 1. Remove the e-mail <-> colour link: profiles.email is wiped (the app no longer writes it).
-- 2. Never record which user used an invitation (invitations.used_by is always NULL).
-- 3. Anonymous visitors can no longer list pending invitations; the join page asks for one
--    invitation by its random id through get_invitation().
-- 4. Joining / redeeming goes through server-side functions instead of client updates.

-- 1 + 2: wipe existing links
update profiles    set email   = null where email   is not null;
update invitations set used_by = null where used_by is not null;

create or replace function public.null_invitation_used_by()
returns trigger language plpgsql as $$
begin
  new.used_by := null;
  return new;
end;
$$;

drop trigger if exists invitations_null_used_by on invitations;
create trigger invitations_null_used_by
  before insert or update on invitations
  for each row execute function public.null_invitation_used_by();

-- 3: close anonymous / invitee-side direct table access
drop policy if exists "Anyone can read a pending invitation" on invitations;
drop policy if exists "Invitee can mark invitation used" on invitations;
revoke all on invitations from anon;

-- the inviter keeps full control of their own invitations
drop policy if exists "inviter_select_own" on invitations;
create policy "inviter_select_own" on invitations for select to authenticated
  using (inviter_id = auth.uid());

drop policy if exists "inviter_insert_own" on invitations;
create policy "inviter_insert_own" on invitations for insert to authenticated
  with check (inviter_id = auth.uid());

drop policy if exists "inviter_update_own" on invitations;
create policy "inviter_update_own" on invitations for update to authenticated
  using (inviter_id = auth.uid()) with check (inviter_id = auth.uid());

-- 4a: join page lookup (by random invitation id only)
create or replace function public.get_invitation(p_id uuid)
returns table (id uuid, email text, sub_community_id uuid)
language sql stable security definer set search_path = public as $$
  select i.id, i.email, i.sub_community_id
  from invitations i
  where i.id = p_id and i.status = 'pending'
$$;
grant execute on function public.get_invitation(uuid) to anon, authenticated;

-- 4b: claim every pending invitation addressed to the signed-in user's e-mail
create or replace function public.claim_invitations()
returns integer
language plpgsql security definer set search_path = public as $$
declare
  uid  uuid := auth.uid();
  mail text;
  n    integer := 0;
  r    record;
begin
  if uid is null then return 0; end if;

  select lower(email) into mail from auth.users where id = uid;
  if mail is null then return 0; end if;

  if not exists (select 1 from invitations where status = 'pending' and lower(email) = mail) then
    return 0;
  end if;

  insert into profiles (id, payment_status, onboarding_completed)
  values (uid, 'pending', false)
  on conflict (id) do nothing;

  for r in
    select id, sub_community_id from invitations
    where status = 'pending' and lower(email) = mail
  loop
    if r.sub_community_id is not null then
      insert into sub_community_members (sub_community_id, user_id)
      values (r.sub_community_id, uid)
      on conflict do nothing;
    end if;
    update invitations set status = 'used', used_at = now() where id = r.id;
    n := n + 1;
  end loop;

  return n;
end;
$$;
revoke all on function public.claim_invitations() from public;
grant execute on function public.claim_invitations() to authenticated;

-- 4c: invite-code payment page (used only when payment is switched back on)
create or replace function public.check_invitation_code(p_code text)
returns table (duration_months integer)
language sql stable security definer set search_path = public as $$
  select i.duration_months
  from invitations i
  where i.promo_code = upper(trim(p_code)) and i.status = 'pending'
  limit 1
$$;
grant execute on function public.check_invitation_code(text) to authenticated;

create or replace function public.redeem_invitation_code(p_code text)
returns boolean
language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  r   record;
begin
  if uid is null then return false; end if;

  select id, sub_community_id into r
  from invitations
  where promo_code = upper(trim(p_code)) and status = 'pending'
  limit 1;
  if not found then return false; end if;

  update invitations set status = 'used', used_at = now() where id = r.id;
  update profiles set payment_status = 'paid' where id = uid;
  if r.sub_community_id is not null then
    insert into sub_community_members (sub_community_id, user_id)
    values (r.sub_community_id, uid)
    on conflict do nothing;
  end if;
  return true;
end;
$$;
grant execute on function public.redeem_invitation_code(text) to authenticated;
