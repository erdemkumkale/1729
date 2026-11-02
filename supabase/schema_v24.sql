-- New members follow their device's light/dark setting by default.
-- Existing members keep whatever they chose.
alter table profiles alter column theme set default 'system';
