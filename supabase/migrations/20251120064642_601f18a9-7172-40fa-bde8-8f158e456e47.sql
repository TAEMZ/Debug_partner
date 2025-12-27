-- Fix RLS issues for inserting into problems
ALTER TABLE public.problems
  ALTER COLUMN user_id SET DEFAULT auth.uid();

DROP POLICY IF EXISTS "Users can create their own problems" ON public.problems;

CREATE POLICY "Users can create their own problems"
ON public.problems
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);