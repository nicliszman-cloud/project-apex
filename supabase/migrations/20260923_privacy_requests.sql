-- StreetClub privacy request intake.
-- Public clients cannot read this table; inserts are performed by the privacy-request Edge Function.

create table if not exists public.privacy_requests (
  id uuid primary key default gen_random_uuid(),
  email text not null check (char_length(email) between 5 and 320),
  request_type text not null check (request_type in ('privacy_question','data_request','account_deletion_help','other')),
  message text not null check (char_length(message) between 3 and 4000),
  status text not null default 'open' check (status in ('open','in_progress','closed')),
  created_at timestamptz not null default now()
);

alter table public.privacy_requests enable row level security;

create index if not exists idx_privacy_requests_created_at on public.privacy_requests(created_at desc);
create index if not exists idx_privacy_requests_status on public.privacy_requests(status);
