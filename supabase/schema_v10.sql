-- 1729 — Schema v10: claim invitations by e-mail
-- Run in Supabase Dashboard → SQL Editor
--
-- When a signed-in user's e-mail matches pending invitations (whatever way they
-- signed up), mark those invitations used and add the user to each community.
-- Called by the app right after the profile is loaded.

create or replace function public.claim_invitations()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  uid  uuid := auth.uid();
  mail text;
  n    integer := 0;
  r    record;
begin
  if uid is null then return 0; end if;
  if not exists (select 1 from profiles where id = uid) then return 0; end if;

  select lower(email) into mail from auth.users where id = uid;
  if mail is null then return 0; end if;

  for r in
    select id, sub_community_id from invitations
    where status = 'pending' and lower(email) = mail
  loop
    if r.sub_community_id is not null then
      insert into sub_community_members (sub_community_id, user_id)
      values (r.sub_community_id, uid)
      on conflict do nothing;
    end if;
    update invitations
       set status = 'used', used_by = uid, used_at = now()
     where id = r.id;
    n := n + 1;
  end loop;

  return n;
end;
$$;

revoke all on function public.claim_invitations() from public;
grant execute on function public.claim_invitations() to authenticated;
