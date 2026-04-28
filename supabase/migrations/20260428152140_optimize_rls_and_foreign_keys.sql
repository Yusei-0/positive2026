-- Add indexes for foreign keys flagged by Supabase performance advisor.
CREATE INDEX IF NOT EXISTS idx_user_quotes_user_id ON public.user_quotes(user_id);
CREATE INDEX IF NOT EXISTS idx_likes_quote_id ON public.likes(quote_id);
CREATE INDEX IF NOT EXISTS idx_reports_user_id ON public.reports(user_id);
CREATE INDEX IF NOT EXISTS idx_reports_quote_id ON public.reports(quote_id);

-- Rewrite auth.uid() policies so the value is initialized once per statement.
DROP POLICY IF EXISTS "Users can insert their own profile." ON public.profiles;
CREATE POLICY "Users can insert their own profile."
  ON public.profiles FOR INSERT
  WITH CHECK ((select auth.uid()) = id);

DROP POLICY IF EXISTS "Users can update own profile." ON public.profiles;
CREATE POLICY "Users can update own profile."
  ON public.profiles FOR UPDATE
  USING ((select auth.uid()) = id);

DROP POLICY IF EXISTS "Users can insert their own quotes." ON public.user_quotes;
CREATE POLICY "Users can insert their own quotes."
  ON public.user_quotes FOR INSERT
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete their own quotes." ON public.user_quotes;
CREATE POLICY "Users can delete their own quotes."
  ON public.user_quotes FOR DELETE
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert their own likes." ON public.likes;
CREATE POLICY "Users can insert their own likes."
  ON public.likes FOR INSERT
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete their own likes." ON public.likes;
CREATE POLICY "Users can delete their own likes."
  ON public.likes FOR DELETE
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert reports." ON public.reports;
CREATE POLICY "Users can insert reports."
  ON public.reports FOR INSERT
  WITH CHECK ((select auth.uid()) = user_id);
