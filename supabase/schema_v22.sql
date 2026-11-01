-- Lets a new member's colour be picked far from every taken colour.
-- Returns only colours, no identities.
create or replace function public.all_hex_codes()
returns setof text
language sql
security definer
set search_path = public
as $$
  select hex_code from profiles where hex_code is not null
$$;

revoke execute on function public.all_hex_codes() from public, anon;
grant execute on function public.all_hex_codes() to authenticated;
