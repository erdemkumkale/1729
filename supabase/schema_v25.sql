-- Optional nickname shown next to a member's colour, e.g.  #B5AE3E - (Ada)
-- Members edit it on the Home page. Empty means colour only.
alter table profiles add column if not exists nickname text;
alter table profiles drop constraint if exists profiles_nickname_len;
alter table profiles add constraint profiles_nickname_len
  check (nickname is null or char_length(nickname) <= 24);
