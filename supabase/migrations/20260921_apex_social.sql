-- Project Apex v0.2: media, feed likes, multi-photo cars, mutual matches and realtime chat.

create table if not exists public.car_photos (
  id uuid primary key default gen_random_uuid(),
  car_id uuid not null references public.cars(id) on delete cascade,
  url text not null,
  position int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.post_likes (
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

alter table public.car_photos enable row level security;
alter table public.post_likes enable row level security;

drop policy if exists "car photos readable" on public.car_photos;
create policy "car photos readable"
on public.car_photos for select to authenticated using (true);

drop policy if exists "owners manage car photos" on public.car_photos;
create policy "owners manage car photos"
on public.car_photos for all to authenticated
using (
  exists (
    select 1 from public.cars c
    where c.id = car_id and c.owner_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.cars c
    where c.id = car_id and c.owner_id = auth.uid()
  )
);

drop policy if exists "post likes readable" on public.post_likes;
create policy "post likes readable"
on public.post_likes for select to authenticated using (true);

drop policy if exists "users manage own post likes" on public.post_likes;
create policy "users manage own post likes"
on public.post_likes for all to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do update set public = true;

drop policy if exists "public media readable" on storage.objects;
create policy "public media readable"
on storage.objects for select
using (bucket_id = 'media');

drop policy if exists "users upload own media" on storage.objects;
create policy "users upload own media"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'media'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "users update own media" on storage.objects;
create policy "users update own media"
on storage.objects for update to authenticated
using (
  bucket_id = 'media'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'media'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "users delete own media" on storage.objects;
create policy "users delete own media"
on storage.objects for delete to authenticated
using (
  bucket_id = 'media'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create or replace function public.swipe_car(p_target_car uuid, p_action text default 'like')
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_target_owner uuid;
  v_reciprocal_car uuid;
  v_match_id uuid;
  v_user_a uuid;
  v_user_b uuid;
  v_car_a uuid;
  v_car_b uuid;
begin
  if v_user is null then
    raise exception 'not authenticated';
  end if;

  if p_action not in ('like', 'pass', 'save') then
    raise exception 'invalid swipe action';
  end if;

  select owner_id into v_target_owner from public.cars where id = p_target_car;
  if v_target_owner is null then raise exception 'car not found'; end if;
  if v_target_owner = v_user then raise exception 'cannot swipe your own car'; end if;

  insert into public.swipes(user_id, target_car_id, action)
  values (v_user, p_target_car, p_action)
  on conflict (user_id, target_car_id)
  do update set action = excluded.action, created_at = now();

  if p_action <> 'like' then return null; end if;

  select s.target_car_id
  into v_reciprocal_car
  from public.swipes s
  join public.cars c on c.id = s.target_car_id
  where s.user_id = v_target_owner
    and s.action = 'like'
    and c.owner_id = v_user
  order by s.created_at desc
  limit 1;

  if v_reciprocal_car is null then return null; end if;

  if v_user::text < v_target_owner::text then
    v_user_a := v_user;
    v_user_b := v_target_owner;
    v_car_a := v_reciprocal_car;
    v_car_b := p_target_car;
  else
    v_user_a := v_target_owner;
    v_user_b := v_user;
    v_car_a := p_target_car;
    v_car_b := v_reciprocal_car;
  end if;

  insert into public.matches(user_a, user_b, car_a, car_b)
  values (v_user_a, v_user_b, v_car_a, v_car_b)
  on conflict (user_a, user_b)
  do update set car_a = excluded.car_a, car_b = excluded.car_b
  returning id into v_match_id;

  return v_match_id;
end;
$$;

grant execute on function public.swipe_car(uuid, text) to authenticated;

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'messages'
  ) then
    alter publication supabase_realtime add table public.messages;
  end if;
end $$;
