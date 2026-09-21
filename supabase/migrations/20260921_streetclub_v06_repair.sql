-- StreetClub v0.6 repair: media visibility, post resilience and map coordinates.
-- Safe to run more than once.

insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do update set public = true;

drop policy if exists "public media readable" on storage.objects;
drop policy if exists "streetclub media public read" on storage.objects;
create policy "streetclub media public read"
on storage.objects for select
to public
using (bucket_id = 'media');

drop policy if exists "users upload own media" on storage.objects;
drop policy if exists "streetclub users upload own media" on storage.objects;
create policy "streetclub users upload own media"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'media'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "users update own media" on storage.objects;
drop policy if exists "streetclub users update own media" on storage.objects;
create policy "streetclub users update own media"
on storage.objects for update
to authenticated
using (
  bucket_id = 'media'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'media'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "users delete own media" on storage.objects;
drop policy if exists "streetclub users delete own media" on storage.objects;
create policy "streetclub users delete own media"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'media'
  and (storage.foldername(name))[1] = auth.uid()::text
);

alter table public.events
  add column if not exists latitude double precision,
  add column if not exists longitude double precision;

alter table public.events
  drop constraint if exists events_latitude_range,
  drop constraint if exists events_longitude_range;

alter table public.events
  add constraint events_latitude_range
    check (latitude is null or latitude between -90 and 90),
  add constraint events_longitude_range
    check (longitude is null or longitude between -180 and 180);

create index if not exists idx_posts_created_at
on public.posts(created_at desc);

create index if not exists idx_events_coordinates
on public.events(latitude, longitude);

-- Repair server-stored local URIs from old builds whenever a linked car has a usable cover.
update public.posts p
set media_url = c.cover_url
from public.cars c
where p.car_id = c.id
  and c.cover_url is not null
  and c.cover_url <> ''
  and (
    p.media_url is null
    or p.media_url = ''
    or p.media_url ~* '^(file|content|blob):'
  );

-- Repair car covers from their first stored photo if an old local URI was persisted.
update public.cars c
set cover_url = first_photo.url
from lateral (
  select cp.url
  from public.car_photos cp
  where cp.car_id = c.id
  order by cp.position asc, cp.created_at asc
  limit 1
) first_photo
where (
  c.cover_url is null
  or c.cover_url = ''
  or c.cover_url ~* '^(file|content|blob):'
);
