-- 1729 — Schema v18: "how many people have me in their trust circle"
-- Run in Supabase Dashboard → SQL Editor (safe to run more than once)
--
-- trust_circle rows are private to their owner, so the count of people who added you has
-- to come from a function. It returns only a number, never who.

create or replace function public.my_circle_count()
returns integer
language sql stable security definer set search_path = public as $$
  select count(*)::integer from trust_circle where member_id = auth.uid()
$$;
revoke all on function public.my_circle_count() from public;
grant execute on function public.my_circle_count() to authenticated;

-- member profile: circle_size now means "people who have this member in their circle"
create or replace function public.get_member_profile(p_user uuid)
returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  result jsonb;
begin
  if uid is null then return null; end if;

  if not (
    p_user = uid
    or p_user in (select public.my_community_peers())
    or public.in_my_circle(p_user)
  ) then
    return null;
  end if;

  select jsonb_build_object(
    'hex', (select hex_code from profiles where id = p_user),
    'answers', coalesce((
      select jsonb_agg(jsonb_build_object('q', a.question_index, 'text', a.answer_text) order by a.question_index)
      from onboarding_answers a
      where a.user_id = p_user and a.question_index between 1 and 4
    ), '[]'::jsonb),
    'given_count', (
      select count(*) from support_transactions s
      where s.provider_id = p_user and s.receiver_confirmed is true
    ),
    'received_count', (
      select count(*) from support_transactions s
      where s.receiver_id = p_user and s.receiver_confirmed is true
    ),
    'received', case when p_user = uid then coalesce((
      select jsonb_agg(t.title) from (
        select g.title
        from support_transactions s
        join gifts g on g.id = s.gift_id
        where s.receiver_id = p_user and s.receiver_confirmed is true
        order by s.created_at desc
        limit 10
      ) t
    ), '[]'::jsonb) else '[]'::jsonb end,
    'circle_size', (select count(*) from trust_circle c where c.member_id = p_user)
  ) into result;

  return result;
end;
$$;
