-- 1729 — Schema v21: announcements (from #1729 to everyone, or from a community founder to the members)
-- Run in Supabase Dashboard → SQL Editor (safe to run more than once).
--
-- An announcement never stores who wrote it. Community announcements show the community name,
-- #1729 announcements show "#1729". Only the founder (community) or an admin (#1729) can post, through
-- post_announcement(). Members read them and mark them read.

alter table notification_preferences
  add column if not exists announcement_emails boolean not null default true;

create table if not exists announcements (
  id               uuid primary key default gen_random_uuid(),
  sub_community_id uuid references sub_communities(id) on delete cascade, -- null = from #1729 to everyone
  body             text not null check (char_length(body) between 1 and 600),
  important        boolean not null default false,
  emailed_at       timestamptz,
  created_at       timestamptz not null default now()
);
create index if not exists announcements_created_idx on announcements (created_at desc);

create table if not exists announcement_reads (
  user_id         uuid not null references auth.users(id) on delete cascade,
  announcement_id uuid not null references announcements(id) on delete cascade,
  read_at         timestamptz not null default now(),
  primary key (user_id, announcement_id)
);

alter table announcements       enable row level security;
alter table announcement_reads  enable row level security;

drop policy if exists "members read announcements" on announcements;
create policy "members read announcements" on announcements for select to authenticated
  using (sub_community_id is null or sub_community_id in (select public.my_community_ids()));

drop policy if exists "own announcement reads" on announcement_reads;
create policy "own announcement reads" on announcement_reads for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

revoke all on announcements, announcement_reads from anon;
grant select on announcements to authenticated;
grant select, insert, update on announcement_reads to authenticated;

-- post: p_community = null → #1729 (admin only); otherwise the founder of that community (one per day)
create or replace function public.post_announcement(p_community uuid, p_body text, p_important boolean default false)
returns uuid
language plpgsql security definer set search_path = public as $$
declare
  new_id uuid;
  txt    text := btrim(coalesce(p_body, ''));
begin
  if char_length(txt) < 1 or char_length(txt) > 600 then raise exception 'invalid_text'; end if;

  if p_community is null then
    if not exists (select 1 from app_admins where user_id = auth.uid()) then raise exception 'not_allowed'; end if;
  else
    if not exists (select 1 from sub_communities where id = p_community and owner_id = auth.uid()) then
      raise exception 'not_allowed';
    end if;
    if exists (select 1 from announcements where sub_community_id = p_community and created_at > now() - interval '20 hours') then
      raise exception 'too_soon';
    end if;
  end if;

  insert into announcements (sub_community_id, body, important)
  values (p_community, txt, case when p_community is null then coalesce(p_important, false) else false end)
  returning id into new_id;
  return new_id;
end;
$$;

-- delete: the founder of the community, or an admin
create or replace function public.delete_announcement(p_id uuid)
returns void
language plpgsql security definer set search_path = public as $$
declare cid uuid;
begin
  select sub_community_id into cid from announcements where id = p_id;
  if not found then return; end if;
  if cid is null then
    if not exists (select 1 from app_admins where user_id = auth.uid()) then raise exception 'not_allowed'; end if;
  else
    if not exists (select 1 from sub_communities where id = cid and owner_id = auth.uid()) then raise exception 'not_allowed'; end if;
  end if;
  delete from announcements where id = p_id;
end;
$$;

revoke execute on function public.post_announcement(uuid, text, boolean) from public, anon;
revoke execute on function public.delete_announcement(uuid)              from public, anon;
grant  execute on function public.post_announcement(uuid, text, boolean) to authenticated;
grant  execute on function public.delete_announcement(uuid)              to authenticated;

notify pgrst, 'reload schema';
