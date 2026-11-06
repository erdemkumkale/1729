-- 1729 — Schema v26: thank-you notes, colour change, community scoreboard
-- Run in Supabase Dashboard → SQL Editor (safe to run more than once)

-- The nickname column (also in schema_v25.sql). Harmless if it already exists.
alter table profiles add column if not exists nickname text;

-- ── 1. Thank-you notes ─────────────────────────────────────────
-- One short note per received gift, written by the receiver when they mark it received.
-- The table has no policies on purpose: everything goes through the functions below.
create table if not exists gift_thanks (
  id             uuid primary key default gen_random_uuid(),
  transaction_id uuid not null unique,
  gift_id        uuid not null,
  author_id      uuid not null references auth.users(id) on delete cascade,
  body           text not null check (char_length(body) between 1 and 280),
  hidden         boolean not null default false,
  created_at     timestamptz not null default now()
);
alter table gift_thanks enable row level security;
revoke all on gift_thanks from anon, authenticated;

create or replace function public.add_thanks(p_transaction uuid, p_body text)
returns void language plpgsql security definer set search_path = public as $$
declare
  tx record;
  txt text := left(btrim(coalesce(p_body, '')), 280);
begin
  if auth.uid() is null or txt = '' then return; end if;
  select id, gift_id, receiver_id, receiver_confirmed into tx
    from support_transactions where id = p_transaction;
  if not found or tx.receiver_id <> auth.uid() or tx.receiver_confirmed is not true then
    raise exception 'not allowed';
  end if;
  insert into gift_thanks (transaction_id, gift_id, author_id, body)
  values (tx.id, tx.gift_id, auth.uid(), txt)
  on conflict (transaction_id) do update set body = excluded.body;
end $$;

-- Notes for one gift. Visible to the giver, the author, and people who share a community
-- or trust circle with the giver. The giver also sees the notes they hid.
create or replace function public.get_gift_thanks(p_gift uuid)
returns table (id uuid, body text, created_at timestamptz, author_hex text, author_nick text, hidden boolean, mine boolean)
language plpgsql stable security definer set search_path = public as $$
declare
  creator uuid;
  uid uuid := auth.uid();
begin
  if uid is null then return; end if;
  select creator_id into creator from gifts where gifts.id = p_gift;
  if creator is null then return; end if;
  if not (creator = uid
          or creator in (select my_community_peers())
          or in_my_circle(creator)) then
    return;
  end if;
  return query
    select t.id, t.body, t.created_at, p.hex_code, p.nickname, t.hidden, (t.author_id = uid)
    from gift_thanks t join profiles p on p.id = t.author_id
    where t.gift_id = p_gift
      and (not t.hidden or creator = uid or t.author_id = uid)
    order by t.created_at desc;
end $$;

create or replace function public.set_thanks_hidden(p_id uuid, p_hidden boolean)
returns void language plpgsql security definer set search_path = public as $$
begin
  update gift_thanks t set hidden = p_hidden
  where t.id = p_id
    and exists (select 1 from gifts g where g.id = t.gift_id and g.creator_id = auth.uid());
end $$;

-- ── 2. Colour change (only until the member has offered a first gift) ──
create or replace function public.change_my_hex(p_hex text)
returns text language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid();
begin
  if uid is null then raise exception 'not signed in'; end if;
  if p_hex !~ '^#[0-9a-fA-F]{6}$' then raise exception 'bad colour'; end if;
  if exists (select 1 from gifts where creator_id = uid) then raise exception 'locked'; end if;
  if exists (select 1 from profiles where lower(hex_code) = lower(p_hex) and id <> uid) then
    raise exception 'taken';
  end if;
  update profiles set hex_code = p_hex where id = uid;
  return p_hex;
end $$;

-- ── 3. Community scoreboard ────────────────────────────────────
-- The founder always sees it; members see it only if the founder opened it.
alter table sub_communities add column if not exists scoreboard_open boolean not null default false;

create or replace function public.community_scoreboard(p_community uuid, p_period text default 'month')
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  c record;
  since timestamptz;
  is_owner boolean;
  rows jsonb;
begin
  if uid is null then return null; end if;
  select id, name, owner_id, scoreboard_open into c from sub_communities where id = p_community;
  if not found then return null; end if;
  is_owner := c.owner_id = uid;
  if not is_owner and not (c.scoreboard_open and exists (
        select 1 from sub_community_members where sub_community_id = p_community and user_id = uid)) then
    return jsonb_build_object('can_view', false, 'is_owner', false, 'open', c.scoreboard_open, 'name', c.name, 'rows', '[]'::jsonb);
  end if;

  since := case p_period
    when 'week'  then date_trunc('week', now())
    when 'month' then date_trunc('month', now())
    when 'year'  then date_trunc('year', now())
    else null end;

  select coalesce(jsonb_agg(r order by (r->>'given')::int desc, (r->>'received')::int desc, r->>'hex'), '[]'::jsonb)
  into rows
  from (
    select jsonb_build_object(
      'hex', p.hex_code,
      'nickname', p.nickname,
      'you', m.user_id = uid,
      'offers', (select count(*) from gifts g where g.creator_id = m.user_id and g.is_active),
      'given', (select count(*) from support_transactions s
                where s.provider_id = m.user_id and s.receiver_confirmed is true
                  and (since is null or s.confirmed_at >= since)),
      'received', (select count(*) from support_transactions s
                   where s.receiver_id = m.user_id and s.receiver_confirmed is true
                     and (since is null or s.confirmed_at >= since))
    ) as r
    from sub_community_members m join profiles p on p.id = m.user_id
    where m.sub_community_id = p_community
  ) q;

  return jsonb_build_object('can_view', true, 'is_owner', is_owner, 'open', c.scoreboard_open, 'name', c.name, 'rows', rows);
end $$;

create or replace function public.set_scoreboard_open(p_community uuid, p_open boolean)
returns void language plpgsql security definer set search_path = public as $$
begin
  update sub_communities set scoreboard_open = p_open where id = p_community and owner_id = auth.uid();
end $$;

revoke all on function public.add_thanks(uuid, text), public.get_gift_thanks(uuid), public.set_thanks_hidden(uuid, boolean),
  public.change_my_hex(text), public.community_scoreboard(uuid, text), public.set_scoreboard_open(uuid, boolean) from public, anon;
grant execute on function public.add_thanks(uuid, text), public.get_gift_thanks(uuid), public.set_thanks_hidden(uuid, boolean),
  public.change_my_hex(text), public.community_scoreboard(uuid, text), public.set_scoreboard_open(uuid, boolean) to authenticated;
