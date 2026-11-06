-- 1729 — Schema v28: choose which communities a card is shown in (run manually in Supabase SQL Editor)
-- A "community" card with NO rows in gift_communities is shown in all of its creator's communities
-- (so every existing card keeps working). With rows, it is shown only in those communities.

create table if not exists public.gift_communities (
  gift_id      uuid not null references public.gifts(id) on delete cascade,
  community_id uuid not null references public.sub_communities(id) on delete cascade,
  primary key (gift_id, community_id)
);
alter table public.gift_communities enable row level security;

drop policy if exists "gift_communities_select" on public.gift_communities;
create policy "gift_communities_select" on public.gift_communities for select to authenticated
  using (
    community_id in (select public.my_community_ids())
    or exists (select 1 from public.gifts g where g.id = gift_id and g.creator_id = auth.uid())
  );

drop policy if exists "gift_communities_insert" on public.gift_communities;
create policy "gift_communities_insert" on public.gift_communities for insert to authenticated
  with check (
    exists (select 1 from public.gifts g where g.id = gift_id and g.creator_id = auth.uid())
    and community_id in (select public.my_community_ids())
  );

drop policy if exists "gift_communities_delete" on public.gift_communities;
create policy "gift_communities_delete" on public.gift_communities for delete to authenticated
  using (exists (select 1 from public.gifts g where g.id = gift_id and g.creator_id = auth.uid()));

-- true when the card is not restricted, or is restricted to a community I am in
create or replace function public.gift_in_my_communities(p_gift uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select not exists (select 1 from gift_communities where gift_id = p_gift)
      or exists (select 1 from gift_communities
                 where gift_id = p_gift and community_id in (select my_community_ids()))
$$;
revoke all on function public.gift_in_my_communities(uuid) from public, anon;
grant execute on function public.gift_in_my_communities(uuid) to authenticated;

drop policy if exists "gifts_visible_to_circle_and_community" on gifts;
create policy "gifts_visible_to_circle_and_community" on gifts for select to authenticated
  using (
    creator_id = auth.uid()
    or exists (select 1 from app_admins a where a.user_id = auth.uid())
    or public.in_my_circle(creator_id)
    or (visibility = 'community'
        and creator_id in (select public.my_community_peers())
        and public.gift_in_my_communities(id))
    or (is_disaster and is_active and not hidden and (expires_at is null or expires_at > now()))
  );
