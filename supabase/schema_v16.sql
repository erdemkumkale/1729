-- 1729 — Schema v16: requests + chat
-- Run in Supabase Dashboard → SQL Editor (safe to run more than once)
--
-- A request (support_transactions row) is the thread between a giver (provider) and a
-- receiver. Messages belong to one request. Only the two people involved can read or
-- write them. The giver can close a request; the receiver confirms delivery.

alter table messages
  add column if not exists transaction_id uuid references support_transactions(id) on delete cascade,
  add column if not exists read_at        timestamptz;

create index if not exists messages_tx_created_idx on messages (transaction_id, created_at);
create index if not exists messages_unread_idx on messages (receiver_id) where read_at is null;

-- drop every existing policy on the two tables, then define clear ones
do $$
declare r record;
begin
  for r in select policyname, tablename from pg_policies
           where schemaname = 'public' and tablename in ('messages', 'support_transactions')
  loop
    execute format('drop policy if exists %I on %I', r.policyname, r.tablename);
  end loop;
end $$;

alter table messages enable row level security;
alter table support_transactions enable row level security;

-- support_transactions
create policy "tx_select_participants" on support_transactions for select to authenticated
  using (provider_id = auth.uid() or receiver_id = auth.uid());

create policy "tx_select_admin" on support_transactions for select to authenticated
  using (exists (select 1 from app_admins a where a.user_id = auth.uid()));

create policy "tx_insert_receiver" on support_transactions for insert to authenticated
  with check (
    receiver_id = auth.uid()
    and provider_id <> auth.uid()
    and exists (select 1 from gifts g where g.id = gift_id and g.creator_id = provider_id)
  );

create policy "tx_update_participants" on support_transactions for update to authenticated
  using (provider_id = auth.uid() or receiver_id = auth.uid())
  with check (provider_id = auth.uid() or receiver_id = auth.uid());

-- messages
create policy "msg_select_participants" on messages for select to authenticated
  using (sender_id = auth.uid() or receiver_id = auth.uid());

create policy "msg_insert_participant" on messages for insert to authenticated
  with check (
    sender_id = auth.uid()
    and exists (
      select 1 from support_transactions t
      where t.id = transaction_id
        and ((t.provider_id = auth.uid() and t.receiver_id = messages.receiver_id)
          or (t.receiver_id = auth.uid() and t.provider_id = messages.receiver_id))
    )
  );

create policy "msg_mark_read" on messages for update to authenticated
  using (receiver_id = auth.uid())
  with check (receiver_id = auth.uid());

grant select, insert, update on messages to authenticated;
grant select, insert, update on support_transactions to authenticated;

notify pgrst, 'reload schema';
