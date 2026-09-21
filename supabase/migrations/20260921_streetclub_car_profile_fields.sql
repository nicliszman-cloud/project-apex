-- StreetClub v0.5: richer car project profile fields.
alter table public.cars add column if not exists version text;
alter table public.cars add column if not exists fuel text;
alter table public.cars add column if not exists description text;
