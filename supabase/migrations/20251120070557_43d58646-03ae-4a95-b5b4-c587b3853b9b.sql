-- Drop and recreate INSERT policy with the exact format from Supabase docs
DROP POLICY IF EXISTS "Users can create their own problems" ON public.problems;

CREATE POLICY "Users can create their own problems"
ON public.problems
FOR INSERT
TO authenticated
WITH CHECK ((select auth.uid()) = user_id);