-- 1. Optimize user_quotes for time-based filtering.
CREATE INDEX IF NOT EXISTS idx_user_quotes_created_at ON public.user_quotes(created_at);

-- 2. Update get_smart_feed to limit candidate pool to last 45 days
CREATE OR REPLACE FUNCTION get_smart_feed(
  p_user_id uuid,
  p_limit int,
  p_offset int,
  p_seed text
)
RETURNS TABLE (
  id uuid,
  quote text,
  user_id uuid,
  username text,
  avatar_url text,
  likes_count int,
  user_liked boolean,
  created_at timestamptz,
  is_owner boolean
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    uq.id,
    uq.quote,
    uq.user_id,
    p.username,
    p.avatar_url,
    uq.likes_count,
    EXISTS(SELECT 1 FROM likes l WHERE l.quote_id = uq.id AND l.user_id = p_user_id) AS user_liked,
    uq.created_at,
    (uq.user_id = p_user_id) AS is_owner
  FROM
    user_quotes uq
  JOIN
    profiles p ON uq.user_id = p.id
  WHERE
    uq.created_at > (now() - interval '45 days') -- OPTIMIZATION: Only recent quotes
  ORDER BY
    -- Gravity Algorithm: (Likes + 1) / (HoursSincePosted + 2)^1.8
    (uq.likes_count + 1) / power( (extract(epoch from (now() - uq.created_at)) / 3600) + 2, 1.8 ) DESC,
    uq.created_at DESC
  LIMIT
    p_limit
  OFFSET
    p_offset;
END;
$$;
