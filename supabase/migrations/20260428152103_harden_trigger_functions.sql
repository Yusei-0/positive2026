-- Harden functions flagged by Supabase advisors.
-- Trigger functions should not be callable directly through the exposed API.

ALTER FUNCTION public.handle_likes() SET search_path = public, pg_temp;
ALTER FUNCTION public.handle_new_user() SET search_path = public, pg_temp;
ALTER FUNCTION public.get_smart_feed(uuid, int, int, text) SET search_path = public, pg_temp;

REVOKE EXECUTE ON FUNCTION public.handle_likes() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
