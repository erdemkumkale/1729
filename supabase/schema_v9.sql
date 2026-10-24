-- 1729 — Schema v9: RLS fix (applied manually in Supabase SQL Editor)
-- Closes anonymous reads on profiles/onboarding_answers/gifts, removes the
-- sub_communities <-> sub_community_members policy recursion, and lets invitees
-- join their community. Founder-read policies (need the founder UID) are not
-- stored here: founder_reads_answers on onboarding_answers, founder_reads_activity on activity_log.

create or replace function public.my_community_ids()
returns setof uuid language sql stable security definer set search_path = public as $$
  select sub_community_id from sub_community_members where user_id = auth.uid()
$$;

create or replace function public.my_community_peers()
returns setof uuid language sql stable security definer set search_path = public as $$
  select user_id from sub_community_members
  where sub_community_id in (select sub_community_id from sub_community_members where user_id = auth.uid())
$$;

create or replace function public.in_my_circle(other uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from trust_circle
    where (owner_id = auth.uid() and member_id = other)
       or (owner_id = other and member_id = auth.uid())
  )
$$;

grant execute on function public.my_community_ids(), public.my_community_peers(), public.in_my_circle(uuid) to authenticated;

insert into sub_community_members (sub_community_id, user_id)
select id, owner_id from sub_communities on conflict do nothing;

insert into sub_community_members (sub_community_id, user_id)
select sub_community_id, used_by from invitations
where status = 'used' and sub_community_id is not null and used_by is not null
on conflict do nothing;

update gifts set visibility = 'community' where visibility = 'global';

drop policy if exists sc_member_read on sub_communities;
create policy sc_member_read on sub_communities for select to authenticated
  using (id in (select public.my_community_ids()));

drop policy if exists scm_comember_read on sub_community_members;
create policy scm_comember_read on sub_community_members for select to authenticated
  using (sub_community_id in (select public.my_community_ids()));

drop policy if exists scm_self_join on sub_community_members;
create policy scm_self_join on sub_community_members for insert to authenticated
  with check (
    user_id = auth.uid() and exists (
      select 1 from invitations i
      where i.used_by = auth.uid() and i.sub_community_id = sub_community_members.sub_community_id
    )
  );

drop policy if exists "Public Read Gifts" on gifts;
drop policy if exists "public_read" on gifts;
drop policy if exists "Community gifts visible to community members" on gifts;
drop policy if exists "Insert Gifts" on gifts;
create policy "gifts_visible_to_circle_and_community" on gifts for select to authenticated
  using (
    creator_id = auth.uid()
    or public.in_my_circle(creator_id)
    or (visibility = 'community' and creator_id in (select public.my_community_peers()))
  );

drop policy if exists "public_read" on profiles;
create policy "profiles_read_authenticated" on profiles for select to authenticated using (true);

alter table onboarding_answers enable row level security;
drop policy if exists "own_answers" on onboarding_answers;
create policy "own_answers" on onboarding_answers for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
