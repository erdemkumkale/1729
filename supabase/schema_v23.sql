-- Gift cards get an icon (one of the 36 in src/lib/giftIcons.js).
-- Empty means "pick one from the title automatically".
alter table gifts add column if not exists icon text;

alter table gifts drop constraint if exists gifts_icon_format;
alter table gifts add constraint gifts_icon_format check (icon is null or icon ~ '^[a-z]{2,12}$');

notify pgrst, 'reload schema';
