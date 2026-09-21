-- StreetClub hotfix: profile cover column + PostgREST schema refresh.
-- Safe to run more than once.

alter table public.profiles
  add column if not exists cover_url text;

create index if not exists idx_profiles_cover_url
  on public.profiles(id)
  where cover_url is not null;

notify pgrst, 'reload schema';
