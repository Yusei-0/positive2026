-- Run this after applying all migrations to verify the restored Supabase schema.

select
  table_name
from information_schema.tables
where table_schema = 'public'
  and table_name in (
    'profiles',
    'daily_quotes',
    'user_quotes',
    'likes',
    'reports',
    'config'
  )
order by table_name;

select
  event_object_schema,
  event_object_table,
  trigger_name
from information_schema.triggers
where trigger_schema in ('public', 'auth')
  and trigger_name in ('on_like_change', 'on_auth_user_created')
order by trigger_name;

select
  routine_schema,
  routine_name,
  routine_type
from information_schema.routines
where routine_schema = 'public'
  and routine_name in ('get_smart_feed', 'handle_likes', 'handle_new_user')
order by routine_name;

select
  key,
  value
from public.config
where key = 'latest_version';

select
  count(*) as daily_quotes_count,
  min(date) as first_quote_date,
  max(date) as last_quote_date
from public.daily_quotes;
