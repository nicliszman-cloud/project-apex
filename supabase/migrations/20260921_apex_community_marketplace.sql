-- Project Apex v0.3: comments, follows, notifications, moderation, marketplace and account deletion.

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 1000),
  created_at timestamptz not null default now()
);

create table if not exists public.follows (
  follower_id uuid not null references public.profiles(id) on delete cascade,
  following_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id),
  check (follower_id <> following_id)
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete cascade,
  type text not null check (type in ('follow','comment','match','event')),
  entity_id uuid,
  body text not null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.marketplace_listings (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references public.profiles(id) on delete cascade,
  car_id uuid references public.cars(id) on delete set null,
  kind text not null check (kind in ('sell','trade','wanted')),
  title text not null check (char_length(title) between 2 and 120),
  description text,
  price_cents bigint check (price_cents is null or price_cents >= 0),
  currency text not null default 'BRL',
  part_category text,
  compatibility text,
  city text,
  state text,
  image_url text,
  status text not null default 'active' check (status in ('active','reserved','sold','closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.comments enable row level security;
alter table public.follows enable row level security;
alter table public.notifications enable row level security;
alter table public.marketplace_listings enable row level security;

-- Blocking is enforced at the read/write layer for the main social surfaces.
drop policy if exists "profiles readable by signed in users" on public.profiles;
drop policy if exists "profiles readable unless blocked" on public.profiles;
create policy "profiles readable unless blocked"
on public.profiles for select to authenticated
using (
  auth.uid() = id
  or not exists (
    select 1 from public.blocks b
    where (b.blocker_id = auth.uid() and b.blocked_id = id)
       or (b.blocker_id = id and b.blocked_id = auth.uid())
  )
);

drop policy if exists "cars readable by signed in users" on public.cars;
drop policy if exists "cars readable unless blocked" on public.cars;
create policy "cars readable unless blocked"
on public.cars for select to authenticated
using (
  owner_id = auth.uid()
  or not exists (
    select 1 from public.blocks b
    where (b.blocker_id = auth.uid() and b.blocked_id = owner_id)
       or (b.blocker_id = owner_id and b.blocked_id = auth.uid())
  )
);

drop policy if exists "posts readable" on public.posts;
drop policy if exists "posts readable unless blocked" on public.posts;
create policy "posts readable unless blocked"
on public.posts for select to authenticated
using (
  author_id = auth.uid()
  or not exists (
    select 1 from public.blocks b
    where (b.blocker_id = auth.uid() and b.blocked_id = author_id)
       or (b.blocker_id = author_id and b.blocked_id = auth.uid())
  )
);

drop policy if exists "events readable" on public.events;
drop policy if exists "events readable unless blocked" on public.events;
create policy "events readable unless blocked"
on public.events for select to authenticated
using (
  organizer_id = auth.uid()
  or not exists (
    select 1 from public.blocks b
    where (b.blocker_id = auth.uid() and b.blocked_id = organizer_id)
       or (b.blocker_id = organizer_id and b.blocked_id = auth.uid())
  )
);

drop policy if exists "comments readable" on public.comments;
create policy "comments readable"
on public.comments for select to authenticated
using (
  author_id = auth.uid()
  or not exists (
    select 1 from public.blocks b
    where (b.blocker_id = auth.uid() and b.blocked_id = author_id)
       or (b.blocker_id = author_id and b.blocked_id = auth.uid())
  )
);

drop policy if exists "authors create comments" on public.comments;
create policy "authors create comments"
on public.comments for insert to authenticated
with check (
  auth.uid() = author_id
  and not exists (
    select 1
    from public.posts p
    join public.blocks b on
      (b.blocker_id = auth.uid() and b.blocked_id = p.author_id)
      or (b.blocker_id = p.author_id and b.blocked_id = auth.uid())
    where p.id = post_id
  )
);

drop policy if exists "authors delete comments" on public.comments;
create policy "authors delete comments"
on public.comments for delete to authenticated using (auth.uid() = author_id);

drop policy if exists "follows readable" on public.follows;
create policy "follows readable"
on public.follows for select to authenticated using (true);

drop policy if exists "users manage own follows" on public.follows;
create policy "users manage own follows"
on public.follows for all to authenticated
using (auth.uid() = follower_id)
with check (
  auth.uid() = follower_id
  and not exists (
    select 1 from public.blocks b
    where (b.blocker_id = auth.uid() and b.blocked_id = following_id)
       or (b.blocker_id = following_id and b.blocked_id = auth.uid())
  )
);

drop policy if exists "users read own notifications" on public.notifications;
create policy "users read own notifications"
on public.notifications for select to authenticated using (auth.uid() = user_id);

drop policy if exists "users update own notifications" on public.notifications;
create policy "users update own notifications"
on public.notifications for update to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "marketplace readable" on public.marketplace_listings;
create policy "marketplace readable"
on public.marketplace_listings for select to authenticated
using (
  seller_id = auth.uid()
  or not exists (
    select 1 from public.blocks b
    where (b.blocker_id = auth.uid() and b.blocked_id = seller_id)
       or (b.blocker_id = seller_id and b.blocked_id = auth.uid())
  )
);

drop policy if exists "sellers manage listings" on public.marketplace_listings;
create policy "sellers manage listings"
on public.marketplace_listings for all to authenticated
using (auth.uid() = seller_id)
with check (auth.uid() = seller_id);

drop policy if exists "match participants send messages" on public.messages;
create policy "match participants send messages"
on public.messages for insert to authenticated
with check (
  auth.uid() = sender_id
  and exists (
    select 1 from public.matches m
    where m.id = match_id
      and auth.uid() in (m.user_a, m.user_b)
      and not exists (
        select 1 from public.blocks b
        where (b.blocker_id = m.user_a and b.blocked_id = m.user_b)
           or (b.blocker_id = m.user_b and b.blocked_id = m.user_a)
      )
  )
);

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_marketplace_updated_at on public.marketplace_listings;
create trigger trg_marketplace_updated_at
before update on public.marketplace_listings
for each row execute function public.touch_updated_at();

create or replace function public.notify_follow()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare actor_name text;
begin
  select coalesce(display_name, username, 'Alguém') into actor_name
  from public.profiles where id = new.follower_id;

  insert into public.notifications(user_id, actor_id, type, entity_id, body)
  values (new.following_id, new.follower_id, 'follow', new.follower_id, actor_name || ' começou a seguir você.');
  return new;
end;
$$;

drop trigger if exists trg_notify_follow on public.follows;
create trigger trg_notify_follow
after insert on public.follows
for each row execute function public.notify_follow();

create or replace function public.notify_comment()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  post_owner uuid;
  actor_name text;
begin
  select author_id into post_owner from public.posts where id = new.post_id;
  if post_owner is null or post_owner = new.author_id then return new; end if;

  select coalesce(display_name, username, 'Alguém') into actor_name
  from public.profiles where id = new.author_id;

  insert into public.notifications(user_id, actor_id, type, entity_id, body)
  values (post_owner, new.author_id, 'comment', new.post_id, actor_name || ' comentou na sua publicação.');
  return new;
end;
$$;

drop trigger if exists trg_notify_comment on public.comments;
create trigger trg_notify_comment
after insert on public.comments
for each row execute function public.notify_comment();

create or replace function public.notify_match()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.notifications(user_id, actor_id, type, entity_id, body)
  values
    (new.user_a, new.user_b, 'match', new.id, 'Novo Garage Match!'),
    (new.user_b, new.user_a, 'match', new.id, 'Novo Garage Match!');
  return new;
end;
$$;

drop trigger if exists trg_notify_match on public.matches;
create trigger trg_notify_match
after insert on public.matches
for each row execute function public.notify_match();

-- Replace swipe logic so blocked users cannot interact or match.
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
  if v_user is null then raise exception 'not authenticated'; end if;
  if p_action not in ('like', 'pass', 'save') then raise exception 'invalid swipe action'; end if;

  select owner_id into v_target_owner from public.cars where id = p_target_car;
  if v_target_owner is null then raise exception 'car not found'; end if;
  if v_target_owner = v_user then raise exception 'cannot swipe your own car'; end if;

  if exists (
    select 1 from public.blocks b
    where (b.blocker_id = v_user and b.blocked_id = v_target_owner)
       or (b.blocker_id = v_target_owner and b.blocked_id = v_user)
  ) then
    raise exception 'interaction unavailable';
  end if;

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
    v_user_a := v_user; v_user_b := v_target_owner;
    v_car_a := v_reciprocal_car; v_car_b := p_target_car;
  else
    v_user_a := v_target_owner; v_user_b := v_user;
    v_car_a := p_target_car; v_car_b := v_reciprocal_car;
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

-- App Store / account self-service: users can delete their own account.
create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  delete from auth.users where id = auth.uid();
end;
$$;

revoke all on function public.delete_my_account() from public;
grant execute on function public.delete_my_account() to authenticated;
