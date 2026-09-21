-- StreetClub v0.6: public media delivery + real event coordinates + post realtime.

-- Ensure the media bucket can actually serve the public URLs stored by the app.
insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do update
set public = true;

drop policy if exists "streetclub media public read" on storage.objects;
create policy "streetclub media public read"
on storage.objects for select
to public
using (bucket_id = 'media');

drop policy if exists "streetclub users upload own media" on storage.objects;
create policy "streetclub users upload own media"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'media'
  and (storage.foldername(name))[1] = auth.uid()::text
);

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

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'posts'
  ) then
    alter publication supabase_realtime add table public.posts;
  end if;
end $$;
