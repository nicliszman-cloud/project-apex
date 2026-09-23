
-- Harden SECURITY DEFINER/helper functions exposed through PostgREST.
-- Public/anonymous callers should never execute internal trigger helpers.

revoke execute on function public.delete_my_account() from public, anon, authenticated;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.notify_comment() from public, anon, authenticated;
revoke execute on function public.notify_direct_message() from public, anon, authenticated;
revoke execute on function public.notify_follow() from public, anon, authenticated;
revoke execute on function public.notify_match() from public, anon, authenticated;
revoke execute on function public.touch_conversation_on_message() from public, anon, authenticated;
revoke execute on function public.touch_updated_at() from public, anon, authenticated;

-- These two RPCs are legitimate signed-in app actions.
revoke execute on function public.open_conversation(uuid) from public, anon;
grant execute on function public.open_conversation(uuid) to authenticated;

revoke execute on function public.swipe_car(uuid, text) from public, anon;
grant execute on function public.swipe_car(uuid, text) to authenticated;

alter function public.touch_updated_at() set search_path = public;
