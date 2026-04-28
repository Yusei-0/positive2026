CREATE TABLE IF NOT EXISTS public.comments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  quote_id uuid NOT NULL REFERENCES public.user_quotes(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content text NOT NULL CHECK (char_length(btrim(content)) BETWEEN 1 AND 280),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Comments are viewable by everyone."
  ON public.comments FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own comments."
  ON public.comments FOR INSERT
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete their own comments."
  ON public.comments FOR DELETE
  USING ((select auth.uid()) = user_id);

CREATE INDEX IF NOT EXISTS idx_comments_quote_id_created_at ON public.comments(quote_id, created_at);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON public.comments(user_id);

DROP FUNCTION IF EXISTS public.get_smart_feed(uuid, int, int, text);

CREATE FUNCTION public.get_smart_feed(
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
  comments_count int,
  user_liked boolean,
  created_at timestamptz,
  is_owner boolean
)
LANGUAGE plpgsql
SET search_path TO 'public', 'pg_temp'
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
    COALESCE(c.comments_count, 0)::int AS comments_count,
    EXISTS(SELECT 1 FROM likes l WHERE l.quote_id = uq.id AND l.user_id = p_user_id) AS user_liked,
    uq.created_at,
    (uq.user_id = p_user_id) AS is_owner
  FROM
    user_quotes uq
  JOIN
    profiles p ON uq.user_id = p.id
  LEFT JOIN LATERAL (
    SELECT count(*)::int AS comments_count
    FROM comments c
    WHERE c.quote_id = uq.id
  ) c ON true
  WHERE
    uq.created_at > (now() - interval '45 days')
  ORDER BY
    (uq.likes_count + 1) / power((extract(epoch from (now() - uq.created_at)) / 3600) + 2, 1.8) DESC,
    uq.created_at DESC
  LIMIT
    p_limit
  OFFSET
    p_offset;
END;
$$;
