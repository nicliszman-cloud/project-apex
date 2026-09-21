-- Project Apex MVP schema
-- Execute no SQL Editor do Supabase em um projeto novo.

create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique,
  display_name text,
  avatar_url text,
  city text,
  state text,
  bio text,
  created_at timestamptz not null default now()
);

create table if not exists public.cars (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  make text not null,
  model text not null,
  model_year int,
  engine text,
  transmission text,
  drivetrain text,
  stock_hp int,
  current_hp int,
  category text,
  city text,
  state text,
  cover_url text,
  modifications jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  car_id uuid references public.cars(id) on delete set null,
  caption text,
  media_url text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.swipes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  target_car_id uuid not null references public.cars(id) on delete cascade,
  action text not null check (action in ('like','pass','save')),
  created_at timestamptz not null default now(),
  unique(user_id, target_car_id)
);

create table if not exists public.matches (
  id uuid primary key default gen_random_uuid(),
  user_a uuid not null references public.profiles(id) on delete cascade,
  user_b uuid not null references public.profiles(id) on delete cascade,
  car_a uuid references public.cars(id) on delete set null,
  car_b uuid references public.cars(id) on delete set null,
  created_at timestamptz not null default now(),
  unique(user_a, user_b)
);

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  organizer_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  description text,
  category text,
  city text,
  state text,
  venue_name text,
  starts_at timestamptz not null,
  cover_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.event_attendees (
  event_id uuid references public.events(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key(event_id, user_id)
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 4000),
  created_at timestamptz not null default now()
);

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  target_user_id uuid references public.profiles(id) on delete cascade,
  target_post_id uuid references public.posts(id) on delete cascade,
  reason text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.blocks (
  blocker_id uuid references public.profiles(id) on delete cascade,
  blocked_id uuid references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key(blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);

alter table public.profiles enable row level security;
alter table public.cars enable row level security;
alter table public.posts enable row level security;
alter table public.swipes enable row level security;
alter table public.matches enable row level security;
alter table public.events enable row level security;
alter table public.event_attendees enable row level security;
alter table public.messages enable row level security;
alter table public.reports enable row level security;
alter table public.blocks enable row level security;

create policy "profiles readable by signed in users" on public.profiles for select to authenticated using (true);
create policy "users update own profile" on public.profiles for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);
create policy "cars readable by signed in users" on public.cars for select to authenticated using (true);
create policy "owners manage own cars" on public.cars for all to authenticated using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
create policy "posts readable" on public.posts for select to authenticated using (true);
create policy "authors manage own posts" on public.posts for all to authenticated using (auth.uid() = author_id) with check (auth.uid() = author_id);
create policy "users manage own swipes" on public.swipes for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "participants read matches" on public.matches for select to authenticated using (auth.uid() in (user_a, user_b));
create policy "events readable" on public.events for select to authenticated using (true);
create policy "organizers manage events" on public.events for all to authenticated using (auth.uid() = organizer_id) with check (auth.uid() = organizer_id);
create policy "attendees readable" on public.event_attendees for select to authenticated using (true);
create policy "users manage own attendance" on public.event_attendees for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "match participants read messages" on public.messages for select to authenticated using (exists (select 1 from public.matches m where m.id = match_id and auth.uid() in (m.user_a, m.user_b)));
create policy "match participants send messages" on public.messages for insert to authenticated with check (auth.uid() = sender_id and exists (select 1 from public.matches m where m.id = match_id and auth.uid() in (m.user_a, m.user_b)));
create policy "users create own reports" on public.reports for insert to authenticated with check (auth.uid() = reporter_id);
create policy "users manage own blocks" on public.blocks for all to authenticated using (auth.uid() = blocker_id) with check (auth.uid() = blocker_id);

-- Cria automaticamente um perfil mínimo quando um usuário se cadastra.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();
