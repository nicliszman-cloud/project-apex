-- StreetClub: threaded replies for post comments.
-- Safe to run more than once.

alter table public.comments
  add column if not exists parent_comment_id uuid
  references public.comments(id)
  on delete cascade;

create index if not exists idx_comments_parent_comment_id
  on public.comments(parent_comment_id);

create index if not exists idx_comments_post_created_at
  on public.comments(post_id, created_at);
