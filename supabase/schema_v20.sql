-- 1729 — Schema v20: community join link
-- Run in Supabase Dashboard → SQL Editor (safe to run more than once).
--
-- The founder of a community can switch on one shared link (/katil/<code>). Anyone who opens it
-- can create an account and joins that community. The link never reveals who made it.
-- The code lives in its own table so ordinary members of the community cannot read it.

create table if not exists community_links (
  sub_community_id uuid primary key references sub_communities(id) on delete cascade,
  code             text not null unique,
  enabled          boolean not null default true,
  created_at       timestamptz not null default now()
);

alter table community_links enable row level security;

drop policy if exists "owner reads own link" on community_links;
create policy "owner reads own link" on community_links for select to authenticated
  using (exists (select 1 from sub_communities c where c.id = sub_community_id and c.owner_id = auth.uid()));

revoke all on community_links from anon;
grant select on community_links to authenticated;

-- founder: create / switch on / switch off / renew the link. Returns the current code.
create or replace function public.set_community_link(p_community uuid, p_enabled boolean, p_renew boolean default false)
returns text
language plpgsql security definer set search_path = public as $$
declare
  new_code text := substr(replace(gen_random_uuid()::text, '-', ''), 1, 16);
  result   text;
begin
  if not exists (select 1 from sub_communities where id = p_community and owner_id = auth.uid()) then
    raise exception 'not allowed';
  end if;

  insert into community_links (sub_community_id, code, enabled)
  values (p_community, new_code, p_enabled)
  on conflict (sub_community_id) do update
    set enabled = p_enabled,
        code    = case when p_renew then excluded.code else community_links.code end
  returning code into result;

  return result;
end;
$$;

-- join page (before sign-in): the community name for a valid, switched-on code
create or replace function public.get_community_by_code(p_code text)
returns table (name text)
language sql stable security definer set search_path = public as $$
  select c.name
  from community_links l
  join sub_communities c on c.id = l.sub_community_id
  where l.code = p_code and l.enabled
$$;

-- signed-in member opens the link: joins the community (idempotent)
create or replace function public.join_community_by_code(p_code text)
returns uuid
language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  cid uuid;
begin
  if uid is null then return null; end if;

  select l.sub_community_id into cid
  from community_links l
  where l.code = p_code and l.enabled;
  if cid is null then return null; end if;

  insert into profiles (id, payment_status, onboarding_completed)
  values (uid, 'pending', false)
  on conflict (id) do nothing;

  insert into sub_community_members (sub_community_id, user_id)
  values (cid, uid)
  on conflict do nothing;

  return cid;
end;
$$;

revoke execute on function public.set_community_link(uuid, boolean, boolean) from public, anon;
revoke execute on function public.get_community_by_code(text)               from public, anon;
revoke execute on function public.join_community_by_code(text)              from public, anon;
grant  execute on function public.set_community_link(uuid, boolean, boolean) to authenticated;
grant  execute on function public.get_community_by_code(text)               to anon, authenticated;
grant  execute on function public.join_community_by_code(text)              to authenticated;

notify pgrst, 'reload schema';
