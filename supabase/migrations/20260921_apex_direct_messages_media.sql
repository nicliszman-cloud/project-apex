-- Project Apex v0.4: direct messages, marketplace contact, safer media and conversation notifications.

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  user_a uuid not null references public.profiles(id) on delete cascade,
  user_b uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (user_a <> user_b),
  unique (user_a, user_b)
);

create table if not exists public.direct_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 4000),
  listing_id uuid references public.marketplace_listings(id) on delete set null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_direct_messages_conversation_created
on public.direct_messages(conversation_id, created_at);

create index if not exists idx_conversations_user_a_updated
on public.conversations(user_a, updated_at desc);

create index if not exists idx_conversations_user_b_updated
on public.conversations(user_b, updated_at desc);

alter table public.conversations enable row level security;
alter table public.direct_messages enable row level security;

drop policy if exists "conversation participants read conversations" on public.conversations;
create policy "conversation participants read conversations"
on public.conversations for select to authenticated
using (auth.uid() in (user_a, user_b));

drop policy if exists "conversation participants read direct messages" on public.direct_messages;
create policy "conversation participants read direct messages"
on public.direct_messages for select to authenticated
using (
  exists (
    select 1 from public.conversations c
    where c.id = conversation_id
      and auth.uid() in (c.user_a, c.user_b)
  )
);

drop policy if exists "conversation participants send direct messages" on public.direct_messages;
create policy "conversation participants send direct messages"
on public.direct_messages for insert to authenticated
with check (
  auth.uid() = sender_id
  and exists (
    select 1
    from public.conversations c
    where c.id = conversation_id
      and auth.uid() in (c.user_a, c.user_b)
      and not exists (
        select 1
        from public.blocks b
        where (b.blocker_id = c.user_a and b.blocked_id = c.user_b)
           or (b.blocker_id = c.user_b and b.blocked_id = c.user_a)
      )
  )
);

revoke update on public.direct_messages from authenticated;
grant update(read_at) on public.direct_messages to authenticated;

drop policy if exists "recipients update direct message read state" on public.direct_messages;
create policy "recipients update direct message read state"
on public.direct_messages for update to authenticated
using (
  sender_id <> auth.uid()
  and exists (
    select 1 from public.conversations c
    where c.id = conversation_id
      and auth.uid() in (c.user_a, c.user_b)
  )
)
with check (
  sender_id <> auth.uid()
  and exists (
    select 1 from public.conversations c
    where c.id = conversation_id
      and auth.uid() in (c.user_a, c.user_b)
  )
);

create or replace function public.open_conversation(p_other_user uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_me uuid := auth.uid();
  v_a uuid;
  v_b uuid;
  v_id uuid;
begin
  if v_me is null then raise exception 'not authenticated'; end if;
  if p_other_user is null or p_other_user = v_me then
    raise exception 'invalid conversation target';
  end if;

  if not exists (select 1 from public.profiles where id = p_other_user) then
    raise exception 'user not found';
  end if;

  if exists (
    select 1 from public.blocks b
    where (b.blocker_id = v_me and b.blocked_id = p_other_user)
       or (b.blocker_id = p_other_user and b.blocked_id = v_me)
  ) then
    raise exception 'conversation unavailable';
  end if;

  if v_me::text < p_other_user::text then
    v_a := v_me;
    v_b := p_other_user;
  else
    v_a := p_other_user;
    v_b := v_me;
  end if;

  insert into public.conversations(user_a, user_b)
  values (v_a, v_b)
  on conflict (user_a, user_b)
  do update set updated_at = now()
  returning id into v_id;

  return v_id;
end;
$$;

revoke all on function public.open_conversation(uuid) from public;
grant execute on function public.open_conversation(uuid) to authenticated;

create or replace function public.touch_conversation_on_message()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.conversations
  set updated_at = new.created_at
  where id = new.conversation_id;
  return new;
end;
$$;

drop trigger if exists trg_touch_conversation_on_message on public.direct_messages;
create trigger trg_touch_conversation_on_message
after insert on public.direct_messages
for each row execute function public.touch_conversation_on_message();

alter table public.notifications
drop constraint if exists notifications_type_check;

alter table public.notifications
add constraint notifications_type_check
check (type in ('follow','comment','match','event','message','marketplace'));

create or replace function public.notify_direct_message()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_recipient uuid;
  v_sender_name text;
  v_type text;
  v_body text;
begin
  select
    case when c.user_a = new.sender_id then c.user_b else c.user_a end
  into v_recipient
  from public.conversations c
  where c.id = new.conversation_id;

  if v_recipient is null then return new; end if;

  select coalesce(display_name, username, 'Alguém')
  into v_sender_name
  from public.profiles
  where id = new.sender_id;

  v_type := case when new.listing_id is null then 'message' else 'marketplace' end;
  v_body := case
    when new.listing_id is null then v_sender_name || ' enviou uma mensagem.'
    else v_sender_name || ' enviou uma mensagem sobre um anúncio.'
  end;

  insert into public.notifications(user_id, actor_id, type, entity_id, body)
  values (v_recipient, new.sender_id, v_type, new.conversation_id, v_body);

  return new;
end;
$$;

drop trigger if exists trg_notify_direct_message on public.direct_messages;
create trigger trg_notify_direct_message
after insert on public.direct_messages
for each row execute function public.notify_direct_message();

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'direct_messages'
  ) then
    alter publication supabase_realtime add table public.direct_messages;
  end if;
end $$;
