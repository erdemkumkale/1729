-- 1729 — Schema v27: founder overview (all communities, members and gifts)
-- Run in Supabase Dashboard → SQL Editor (safe to run more than once)
--
-- Works with or without schema_v26.sql (the scoreboard column is read defensively).
-- Only people listed in app_admins can call it. It returns colours, never names or e-mails.
-- If you are not in app_admins yet, run once (with your own UID from Authentication > Users):
--   insert into app_admins (user_id) values ('YOUR-UID-HERE') on conflict do nothing;

create or replace function public.admin_overview()
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare
  result jsonb;
begin
  if auth.uid() is null or not exists (select 1 from app_admins where user_id = auth.uid()) then
    return null;
  end if;

  select jsonb_build_object(
    'communities', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', c.id, 'name', c.name, 'created_at', c.created_at,
        'scoreboard_open', coalesce((to_jsonb(c) ->> 'scoreboard_open')::boolean, false),
        'owner_hex', (select hex_code from profiles where id = c.owner_id),
        'members', coalesce((
          select jsonb_agg(jsonb_build_object(
            'hex', p.hex_code, 'nickname', to_jsonb(p) ->> 'nickname', 'owner', m.user_id = c.owner_id,
            'offers', (select count(*) from gifts g where g.creator_id = m.user_id and g.is_active),
            'given', (select count(*) from support_transactions s where s.provider_id = m.user_id and s.receiver_confirmed is true),
            'received', (select count(*) from support_transactions s where s.receiver_id = m.user_id and s.receiver_confirmed is true)
          ) order by p.hex_code)
          from sub_community_members m join profiles p on p.id = m.user_id
          where m.sub_community_id = c.id
        ), '[]'::jsonb)
      ) order by c.created_at)
      from sub_communities c
    ), '[]'::jsonb),
    'gifts', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', g.id, 'title', g.title, 'type', g.gift_type, 'quota_remaining', g.quota_remaining,
        'active', g.is_active, 'disaster', g.is_disaster, 'hidden', g.hidden, 'created_at', g.created_at,
        'creator_hex', p.hex_code, 'nickname', to_jsonb(p) ->> 'nickname',
        'communities', coalesce((
          select jsonb_agg(c.name order by c.name)
          from sub_community_members m join sub_communities c on c.id = m.sub_community_id
          where m.user_id = g.creator_id
        ), '[]'::jsonb),
        'requests', (select count(*) from support_transactions s where s.gift_id = g.id),
        'received', (select count(*) from support_transactions s where s.gift_id = g.id and s.receiver_confirmed is true)
      ) order by g.created_at desc)
      from gifts g join profiles p on p.id = g.creator_id
    ), '[]'::jsonb)
  ) into result;

  return result;
end $$;

revoke all on function public.admin_overview() from public, anon;
grant execute on function public.admin_overview() to authenticated;
