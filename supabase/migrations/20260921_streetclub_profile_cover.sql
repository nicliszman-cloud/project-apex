-- StreetClub: custom profile cover image.
-- Safe to run more than once.

alter table public.profiles
  add column if not exists cover_url text;
